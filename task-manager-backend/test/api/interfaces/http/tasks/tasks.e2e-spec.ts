import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import { AppErrorExceptionFilter } from '@api/interfaces/http/errors/app-error-exception.filter';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';
import { TASK_HTTP_LIMITS } from '@api/interfaces/http/tasks/tasks-http.constants';
import { TasksController } from '@api/interfaces/http/tasks/tasks.controller';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import type {
  CreateTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@task/application';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import { TaskPriority, TaskStatus } from '@task/domain';
import type { Server } from 'node:http';
import request from 'supertest';

describe('Tasks HTTP API', () => {
  const projectId = 'project-123';
  const task = {
    id: 'task-123',
    projectId,
    title: 'Prepare technical design',
    description: 'Define the task boundaries',
    status: TaskStatus.Pending,
    priority: TaskPriority.High,
    dueDate: '2026-08-10T20:30:00.000Z',
  };

  let createTask: jest.MockedFunction<CreateTaskUseCase['execute']>;
  let listTasks: jest.MockedFunction<ListTasksUseCase['execute']>;
  let updateTask: jest.MockedFunction<UpdateTaskUseCase['execute']>;
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    createTask = jest.fn();
    listTasks = jest.fn();
    updateTask = jest.fn();

    const testingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE,
          useValue: { execute: createTask },
        },
        {
          provide: API_PROVIDER_TOKENS.LIST_TASKS_USE_CASE,
          useValue: { execute: listTasks },
        },
        {
          provide: API_PROVIDER_TOKENS.UPDATE_TASK_USE_CASE,
          useValue: { execute: updateTask },
        },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.useGlobalFilters(new AppErrorExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
  });

  beforeEach(() => {
    createTask.mockReset();
    listTasks.mockReset();
    updateTask.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /projects/:projectId/tasks', () => {
    it('responds with 201 and the created task', async () => {
      createTask.mockResolvedValue({ task });

      const response = await request(server)
        .post(`/projects/${projectId}/tasks`)
        .send({
          title: `  ${task.title}  `,
          description: `  ${task.description}  `,
          priority: task.priority,
          dueDate: '2026-08-10T15:30:00-05:00',
        })
        .expect(201);

      expect(response.body).toEqual({ task });
      expect(createTask).toHaveBeenCalledWith({
        projectId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: '2026-08-10T15:30:00-05:00',
      });
    });

    it.each([
      {
        scenario: 'blank title',
        body: { title: '   ' },
      },
      {
        scenario: 'invalid priority',
        body: { title: task.title, priority: 'urgent' },
      },
      {
        scenario: 'invalid due date',
        body: { title: task.title, dueDate: 'not-a-date' },
      },
    ])('responds with 400 for a $scenario', async ({ body }) => {
      const response = await request(server)
        .post(`/projects/${projectId}/tasks`)
        .send(body)
        .expect(400);

      expect(response.body).toEqual(invalidRequestBodyErrorResponse());
      expect(createTask).not.toHaveBeenCalled();
    });

    it('responds with 400 when the project id is too long', async () => {
      const response = await request(server)
        .post(
          `/projects/${'a'.repeat(TASK_HTTP_LIMITS.PROJECT_ID_MAX_LENGTH + 1)}/tasks`,
        )
        .send({ title: task.title })
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(createTask).not.toHaveBeenCalled();
    });

    it('responds with 404 when the project does not exist', async () => {
      createTask.mockRejectedValue(
        new TaskApplicationError(
          TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          { category: ERROR_CATEGORIES.NOT_FOUND },
        ),
      );

      const response = await request(server)
        .post(`/projects/${projectId}/tasks`)
        .send({ title: task.title })
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  describe('GET /projects/:projectId/tasks', () => {
    it('responds with 200 and forwards the normalized filters', async () => {
      listTasks.mockResolvedValue({ tasks: [task] });

      const response = await request(server)
        .get(`/projects/${projectId}/tasks`)
        .query({
          status: TaskStatus.Pending,
          priority: TaskPriority.High,
          search: '  technical design  ',
        })
        .expect(200);

      expect(response.body).toEqual({ tasks: [task] });
      expect(listTasks).toHaveBeenCalledWith({
        projectId,
        status: TaskStatus.Pending,
        priority: TaskPriority.High,
        search: 'technical design',
      });
    });

    it('responds with an empty collection when the project has no tasks', async () => {
      listTasks.mockResolvedValue({ tasks: [] });

      const response = await request(server)
        .get(`/projects/${projectId}/tasks`)
        .query({ search: '   ' })
        .expect(200);

      expect(response.body).toEqual({ tasks: [] });
      expect(listTasks).toHaveBeenCalledWith({
        projectId,
        status: undefined,
        priority: undefined,
        search: undefined,
      });
    });

    it.each([
      {
        scenario: 'invalid status',
        query: { status: 'blocked' },
      },
      {
        scenario: 'invalid priority',
        query: { priority: 'urgent' },
      },
      {
        scenario: 'search that is too long',
        query: { search: 'a'.repeat(TASK_HTTP_LIMITS.SEARCH_MAX_LENGTH + 1) },
      },
    ])('responds with 400 for an $scenario', async ({ query }) => {
      const response = await request(server)
        .get(`/projects/${projectId}/tasks`)
        .query(query)
        .expect(400);

      expect(response.body).toEqual(invalidRequestQueryErrorResponse());
      expect(listTasks).not.toHaveBeenCalled();
    });

    it('responds with 400 when the project id is too long', async () => {
      const response = await request(server)
        .get(
          `/projects/${'a'.repeat(TASK_HTTP_LIMITS.PROJECT_ID_MAX_LENGTH + 1)}/tasks`,
        )
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(listTasks).not.toHaveBeenCalled();
    });

    it('responds with 404 when the project does not exist', async () => {
      listTasks.mockRejectedValue(
        new TaskApplicationError(
          TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          { category: ERROR_CATEGORIES.NOT_FOUND },
        ),
      );

      const response = await request(server)
        .get(`/projects/${projectId}/tasks`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  describe('PATCH /projects/:projectId/tasks/:taskId', () => {
    it('responds with 200 and the updated task', async () => {
      const updatedTask = {
        ...task,
        title: 'Review technical design',
        description: 'Validate the proposed boundaries',
        status: TaskStatus.InProgress,
        dueDate: '2026-08-12T20:30:00.000Z',
      };
      updateTask.mockResolvedValue({ task: updatedTask });

      const response = await request(server)
        .patch(`/projects/${projectId}/tasks/${task.id}`)
        .send({
          title: '  Review technical design  ',
          description: '  Validate the proposed boundaries  ',
          status: TaskStatus.InProgress,
          dueDate: '2026-08-12T15:30:00-05:00',
        })
        .expect(200);

      expect(response.body).toEqual({ task: updatedTask });
      expect(updateTask).toHaveBeenCalledWith({
        projectId,
        taskId: task.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: undefined,
        dueDate: '2026-08-12T15:30:00-05:00',
      });
    });

    it('supports clearing description and due date', async () => {
      const updatedTask = {
        ...task,
        description: null,
        dueDate: null,
      };
      updateTask.mockResolvedValue({ task: updatedTask });

      await request(server)
        .patch(`/projects/${projectId}/tasks/${task.id}`)
        .send({ description: null, dueDate: null })
        .expect(200);

      expect(updateTask).toHaveBeenCalledWith({
        projectId,
        taskId: task.id,
        title: undefined,
        description: null,
        status: undefined,
        priority: undefined,
        dueDate: null,
      });
    });

    it.each([
      {
        scenario: 'empty body',
        body: {},
      },
      {
        scenario: 'blank title',
        body: { title: '   ' },
      },
      {
        scenario: 'invalid status',
        body: { status: 'blocked' },
      },
      {
        scenario: 'invalid priority',
        body: { priority: 'urgent' },
      },
      {
        scenario: 'invalid due date',
        body: { dueDate: 'not-a-date' },
      },
    ])('responds with 400 for an $scenario', async ({ body }) => {
      const response = await request(server)
        .patch(`/projects/${projectId}/tasks/${task.id}`)
        .send(body)
        .expect(400);

      expect(response.body).toEqual(invalidRequestBodyErrorResponse());
      expect(updateTask).not.toHaveBeenCalled();
    });

    it('responds with 400 when the task id is too long', async () => {
      const response = await request(server)
        .patch(
          `/projects/${projectId}/tasks/${'a'.repeat(TASK_HTTP_LIMITS.TASK_ID_MAX_LENGTH + 1)}`,
        )
        .send({ title: task.title })
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(updateTask).not.toHaveBeenCalled();
    });

    it.each([
      {
        scenario: 'project does not exist',
        code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
        message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      },
      {
        scenario: 'task does not exist',
        code: TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
        message: TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
      },
    ])('responds with 404 when the $scenario', async ({ code, message }) => {
      updateTask.mockRejectedValue(
        new TaskApplicationError(code, message, {
          category: ERROR_CATEGORIES.NOT_FOUND,
        }),
      );

      const response = await request(server)
        .patch(`/projects/${projectId}/tasks/${task.id}`)
        .send({ title: 'Review technical design' })
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code,
          message,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  function invalidRequestBodyErrorResponse(): object {
    return {
      error: {
        code: HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
        layer: ERROR_LAYERS.INTERFACE,
        category: ERROR_CATEGORIES.VALIDATION,
        retryable: false,
      },
    };
  }

  function invalidRequestParamErrorResponse(): object {
    return {
      error: {
        code: HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
        layer: ERROR_LAYERS.INTERFACE,
        category: ERROR_CATEGORIES.VALIDATION,
        retryable: false,
      },
    };
  }

  function invalidRequestQueryErrorResponse(): object {
    return {
      error: {
        code: HTTP_ERROR_CODES.INVALID_REQUEST_QUERY,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_QUERY,
        layer: ERROR_LAYERS.INTERFACE,
        category: ERROR_CATEGORIES.VALIDATION,
        retryable: false,
      },
    };
  }
});
