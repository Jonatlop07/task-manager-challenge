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
import type { CreateTaskUseCase } from '@task/application';
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
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    createTask = jest.fn();

    const testingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE,
          useValue: { execute: createTask },
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
});
