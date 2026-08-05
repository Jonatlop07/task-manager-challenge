import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import { AppErrorExceptionFilter } from '@api/interfaces/http/errors/app-error-exception.filter';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';
import { ProjectsController } from '@api/interfaces/http/projects/projects.controller';
import type { CreateProjectUseCase } from '@project/application';
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

describe('POST /projects', () => {
  const idempotencyKey = 'create-project-atlas';
  const project = {
    id: 'project-123',
    name: 'Project Atlas',
    description: null,
  };

  let execute: jest.MockedFunction<CreateProjectUseCase['execute']>;
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    execute = jest.fn();

    const testingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE,
          useValue: { execute },
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
});
