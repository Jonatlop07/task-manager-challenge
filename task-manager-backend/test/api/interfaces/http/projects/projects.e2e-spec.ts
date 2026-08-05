import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import { AppErrorExceptionFilter } from '@api/interfaces/http/errors/app-error-exception.filter';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';
import { ProjectsController } from '@api/interfaces/http/projects/projects.controller';
import { PROJECT_HTTP_LIMITS } from '@api/interfaces/http/projects/projects-http.constants';
import type {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  UpdateProjectUseCase,
} from '@project/application';
import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '@project/application/errors';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';

describe('Projects HTTP API', () => {
  const idempotencyKey = 'create-project-atlas';
  const project = {
    id: 'project-123',
    name: 'Project Atlas',
    description: null,
  };

  let execute: jest.MockedFunction<CreateProjectUseCase['execute']>;
  let updateProject: jest.MockedFunction<UpdateProjectUseCase['execute']>;
  let deleteProject: jest.MockedFunction<DeleteProjectUseCase['execute']>;
  let getProject: jest.MockedFunction<GetProjectUseCase['execute']>;
  let listProjects: jest.MockedFunction<ListProjectsUseCase['execute']>;
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    execute = jest.fn();
    updateProject = jest.fn();
    deleteProject = jest.fn();
    getProject = jest.fn();
    listProjects = jest.fn();

    const testingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE,
          useValue: { execute },
        },
        {
          provide: API_PROVIDER_TOKENS.UPDATE_PROJECT_USE_CASE,
          useValue: { execute: updateProject },
        },
        {
          provide: API_PROVIDER_TOKENS.DELETE_PROJECT_USE_CASE,
          useValue: { execute: deleteProject },
        },
        {
          provide: API_PROVIDER_TOKENS.GET_PROJECT_USE_CASE,
          useValue: { execute: getProject },
        },
        {
          provide: API_PROVIDER_TOKENS.LIST_PROJECTS_USE_CASE,
          useValue: { execute: listProjects },
        },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.useGlobalFilters(new AppErrorExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
  });

  beforeEach(() => {
    execute.mockReset();
    updateProject.mockReset();
    deleteProject.mockReset();
    getProject.mockReset();
    listProjects.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds with 201 when a project is created', async () => {
    execute.mockResolvedValue({ project, idempotentReplay: false });

    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: project.name })
      .expect(201);

    expect(response.body).toEqual({ project, idempotentReplay: false });
    expect(execute).toHaveBeenCalledWith({
      idempotencyKey,
      name: project.name,
      description: undefined,
    });
  });

  it('responds with 200 when the request is an idempotent replay', async () => {
    execute.mockResolvedValue({ project, idempotentReplay: true });

    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: project.name })
      .expect(200);

    expect(response.body).toEqual({ project, idempotentReplay: true });
  });

  it('responds with 400 when the body is invalid', async () => {
    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: '   ' })
      .expect(400);

    expect(response.body).toEqual(invalidRequestErrorResponse());
    expect(execute).not.toHaveBeenCalled();
  });

  it('responds with 400 when the idempotency key is missing', async () => {
    const response = await request(server)
      .post('/projects')
      .send({ name: project.name })
      .expect(400);

    expect(response.body).toEqual(invalidRequestErrorResponse());
    expect(execute).not.toHaveBeenCalled();
  });

  it('responds with 400 when the idempotency key is too long', async () => {
    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', 'a'.repeat(129))
      .send({ name: project.name })
      .expect(400);

    expect(response.body).toEqual(invalidRequestErrorResponse());
    expect(execute).not.toHaveBeenCalled();
  });

  it('responds with 409 when the idempotency key conflicts', async () => {
    execute.mockRejectedValue(
      new ProjectApplicationError(
        PROJECT_APPLICATION_ERROR_CODES.IDEMPOTENCY_CONFLICT,
        PROJECT_APPLICATION_ERROR_MESSAGES.IDEMPOTENCY_CONFLICT,
        { category: ERROR_CATEGORIES.IDEMPOTENCY_CONFLICT },
      ),
    );

    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: project.name })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: PROJECT_APPLICATION_ERROR_CODES.IDEMPOTENCY_CONFLICT,
        message: PROJECT_APPLICATION_ERROR_MESSAGES.IDEMPOTENCY_CONFLICT,
        layer: ERROR_LAYERS.APPLICATION,
        category: ERROR_CATEGORIES.IDEMPOTENCY_CONFLICT,
        retryable: false,
      },
    });
  });

  it('responds with a sanitized 500 error for an unexpected failure', async () => {
    execute.mockRejectedValue(new Error('Sensitive database failure'));

    const response = await request(server)
      .post('/projects')
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: project.name })
      .expect(500);

    expect(response.body).toEqual({
      error: {
        code: HTTP_ERROR_CODES.UNEXPECTED_ERROR,
        message: HTTP_ERROR_MESSAGES.UNEXPECTED_ERROR,
        layer: ERROR_LAYERS.INTERFACE,
        category: ERROR_CATEGORIES.UNEXPECTED,
        retryable: false,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain(
      'Sensitive database failure',
    );
  });

  describe('PATCH /projects/:projectId', () => {
    it('responds with 200 and the updated project', async () => {
      const updatedProject = {
        ...project,
        name: 'Project Borealis',
        description: 'Delivery planning',
      };
      updateProject.mockResolvedValue({ project: updatedProject });

      const response = await request(server)
        .patch(`/projects/${project.id}`)
        .send({
          name: '  Project Borealis  ',
          description: '  Delivery planning  ',
        })
        .expect(200);

      expect(response.body).toEqual({ project: updatedProject });
      expect(updateProject).toHaveBeenCalledWith({
        projectId: project.id,
        name: updatedProject.name,
        description: updatedProject.description,
      });
    });

    it('responds with 400 when no fields are provided', async () => {
      const response = await request(server)
        .patch(`/projects/${project.id}`)
        .send({})
        .expect(400);

      expect(response.body).toEqual(invalidRequestErrorResponse());
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('responds with 400 when the project id is too long', async () => {
      const response = await request(server)
        .patch(`/projects/${'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1)}`)
        .send({ name: 'Project Borealis' })
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('responds with 404 when the project does not exist', async () => {
      updateProject.mockRejectedValue(
        new ProjectApplicationError(
          PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          { category: ERROR_CATEGORIES.NOT_FOUND },
        ),
      );

      const response = await request(server)
        .patch(`/projects/${project.id}`)
        .send({ name: 'Project Borealis' })
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  describe('DELETE /projects/:projectId', () => {
    it('responds with 204 when the project is deleted', async () => {
      deleteProject.mockResolvedValue(undefined);

      const response = await request(server)
        .delete(`/projects/${project.id}`)
        .expect(204);

      expect(response.text).toBe('');
      expect(deleteProject).toHaveBeenCalledWith({ projectId: project.id });
    });

    it('responds with 400 when the project id is too long', async () => {
      const response = await request(server)
        .delete(
          `/projects/${'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1)}`,
        )
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(deleteProject).not.toHaveBeenCalled();
    });

    it('responds with 404 when the project does not exist', async () => {
      deleteProject.mockRejectedValue(
        new ProjectApplicationError(
          PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          { category: ERROR_CATEGORIES.NOT_FOUND },
        ),
      );

      const response = await request(server)
        .delete(`/projects/${project.id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  describe('GET /projects/:projectId', () => {
    it('responds with 200 and the project', async () => {
      getProject.mockResolvedValue({ project });

      const response = await request(server)
        .get(`/projects/${project.id}`)
        .expect(200);

      expect(response.body).toEqual({ project });
      expect(getProject).toHaveBeenCalledWith({ projectId: project.id });
    });

    it('responds with 400 when the project id is too long', async () => {
      const response = await request(server)
        .get(`/projects/${'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1)}`)
        .expect(400);

      expect(response.body).toEqual(invalidRequestParamErrorResponse());
      expect(getProject).not.toHaveBeenCalled();
    });

    it('responds with 404 when the project does not exist', async () => {
      getProject.mockRejectedValue(
        new ProjectApplicationError(
          PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          { category: ERROR_CATEGORIES.NOT_FOUND },
        ),
      );

      const response = await request(server)
        .get(`/projects/${project.id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
          message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
          layer: ERROR_LAYERS.APPLICATION,
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      });
    });
  });

  describe('GET /projects', () => {
    it('responds with 200 and the projects', async () => {
      const projects = [
        project,
        {
          id: 'project-456',
          name: 'Project Borealis',
          description: 'Delivery planning',
        },
      ];
      listProjects.mockResolvedValue({ projects });

      const response = await request(server).get('/projects').expect(200);

      expect(response.body).toEqual({ projects });
      expect(listProjects).toHaveBeenCalledTimes(1);
    });

    it('responds with an empty collection when no projects exist', async () => {
      listProjects.mockResolvedValue({ projects: [] });

      const response = await request(server).get('/projects').expect(200);

      expect(response.body).toEqual({ projects: [] });
    });
  });

  function invalidRequestErrorResponse(): object {
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
