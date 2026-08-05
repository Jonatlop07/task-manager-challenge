import type {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  UpdateProjectUseCase,
} from '@project/application';
import { ProjectsController } from '@api/interfaces/http/projects/projects.controller';
import {
  PROJECT_HTTP_LIMITS,
  PROJECT_HTTP_RESPONSE_STATUSES,
} from '@api/interfaces/http/projects/projects-http.constants';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';
import { ApiInterfaceError } from '@api/interfaces/http/errors/api-interface.error';
import type { Response } from 'express';

describe('ProjectsController', () => {
  const project = {
    id: 'project-123',
    name: 'Project Atlas',
    description: null,
  };

  let execute: jest.MockedFunction<CreateProjectUseCase['execute']>;
  let updateProject: jest.MockedFunction<UpdateProjectUseCase['execute']>;
  let deleteProject: jest.MockedFunction<DeleteProjectUseCase['execute']>;
  let getProject: jest.MockedFunction<GetProjectUseCase['execute']>;
  let setStatus: jest.Mock;
  let response: Response;
  let controller: ProjectsController;

  beforeEach(() => {
    execute = jest.fn();
    updateProject = jest.fn();
    deleteProject = jest.fn();
    getProject = jest.fn();
    setStatus = jest.fn();
    response = { status: setStatus } as unknown as Response;
    controller = new ProjectsController(
      { execute },
      { execute: updateProject },
      { execute: deleteProject },
      { execute: getProject },
    );
  });

  it.each([
    {
      scenario: 'a newly created project',
      idempotentReplay: false,
      expectedStatus: PROJECT_HTTP_RESPONSE_STATUSES.CREATED,
    },
    {
      scenario: 'an idempotent replay',
      idempotentReplay: true,
      expectedStatus: PROJECT_HTTP_RESPONSE_STATUSES.OK,
    },
  ])(
    'responds with the expected status for $scenario',
    async ({ idempotentReplay, expectedStatus }) => {
      const useCaseResult = { project, idempotentReplay };
      execute.mockResolvedValue(useCaseResult);

      const result = await controller.createProject(
        { name: project.name },
        { 'idempotency-key': 'create-project-atlas' },
        response,
      );

      expect(execute).toHaveBeenCalledWith({
        idempotencyKey: 'create-project-atlas',
        name: project.name,
        description: undefined,
      });
      expect(setStatus).toHaveBeenCalledWith(expectedStatus);
      expect(result).toEqual(useCaseResult);
    },
  );

  it.each([
    { scenario: 'a missing name', body: {} },
    { scenario: 'a blank name', body: { name: '   ' } },
    { scenario: 'a non-string name', body: { name: 123 } },
    {
      scenario: 'a name longer than 256 characters',
      body: { name: 'a'.repeat(257) },
    },
    {
      scenario: 'a blank description',
      body: { name: project.name, description: '   ' },
    },
  ])('rejects $scenario', async ({ body }) => {
    const execution = controller.createProject(
      body,
      { 'idempotency-key': 'create-project-atlas' },
      response,
    );

    await expect(execution).rejects.toMatchObject({
      code: HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    });
    expect(execute).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('normalizes the request body before executing the use case', async () => {
    const useCaseResult = { project, idempotentReplay: false };
    execute.mockResolvedValue(useCaseResult);

    await controller.createProject(
      {
        name: `  ${project.name}  `,
        description: '  Internal planning  ',
      },
      { 'idempotency-key': '  create-project-atlas  ' },
      response,
    );

    expect(execute).toHaveBeenCalledWith({
      idempotencyKey: 'create-project-atlas',
      name: project.name,
      description: 'Internal planning',
    });
  });

  it('rejects an idempotency key longer than the supported limit', async () => {
    const execution = controller.createProject(
      { name: project.name },
      { 'idempotency-key': 'a'.repeat(129) },
      response,
    );

    await expect(execution).rejects.toBeInstanceOf(ApiInterfaceError);
    expect(execute).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it.each([
    { scenario: 'missing', headers: {} },
    { scenario: 'blank', headers: { 'idempotency-key': '   ' } },
  ])('rejects a $scenario idempotency key', async ({ headers }) => {
    const execution = controller.createProject(
      { name: project.name },
      headers,
      response,
    );

    await expect(execution).rejects.toBeInstanceOf(ApiInterfaceError);
    expect(execute).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('propagates use case errors without setting a success status', async () => {
    const useCaseError = new Error('Use case failed');
    execute.mockRejectedValue(useCaseError);

    const execution = controller.createProject(
      { name: project.name },
      { 'idempotency-key': 'create-project-atlas' },
      response,
    );

    await expect(execution).rejects.toBe(useCaseError);
    expect(setStatus).not.toHaveBeenCalled();
  });

  describe('updateProject', () => {
    it('normalizes the request and returns the updated project', async () => {
      const updatedProject = {
        ...project,
        name: 'Project Borealis',
        description: 'Delivery planning',
      };
      updateProject.mockResolvedValue({ project: updatedProject });

      const result = await controller.updateProject(
        { projectId: project.id },
        {
          name: '  Project Borealis  ',
          description: '  Delivery planning  ',
        },
      );

      expect(updateProject).toHaveBeenCalledWith({
        projectId: project.id,
        name: updatedProject.name,
        description: updatedProject.description,
      });
      expect(result).toEqual({ project: updatedProject });
    });

    it('allows clearing the project description', async () => {
      updateProject.mockResolvedValue({ project });

      await controller.updateProject(
        { projectId: project.id },
        { description: null },
      );

      expect(updateProject).toHaveBeenCalledWith({
        projectId: project.id,
        name: undefined,
        description: null,
      });
    });

    it.each([
      { scenario: 'an empty body', body: {} },
      { scenario: 'a blank name', body: { name: '   ' } },
      {
        scenario: 'a name longer than 256 characters',
        body: { name: 'a'.repeat(257) },
      },
      { scenario: 'a blank description', body: { description: '   ' } },
    ])('rejects $scenario', async ({ body }) => {
      const execution = controller.updateProject(
        { projectId: project.id },
        body,
      );

      await expect(execution).rejects.toMatchObject({
        code: HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
      });
      expect(updateProject).not.toHaveBeenCalled();
    });

    it.each([
      { scenario: 'missing', params: {} },
      { scenario: 'blank', params: { projectId: '   ' } },
      {
        scenario: 'too long',
        params: {
          projectId: 'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1),
        },
      },
    ])('rejects a $scenario project id', async ({ params }) => {
      const execution = controller.updateProject(params, {
        name: project.name,
      });

      await expect(execution).rejects.toMatchObject({
        code: HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
      });
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('propagates update use case errors', async () => {
      const useCaseError = new Error('Update failed');
      updateProject.mockRejectedValue(useCaseError);

      const execution = controller.updateProject(
        { projectId: project.id },
        { name: project.name },
      );

      await expect(execution).rejects.toBe(useCaseError);
    });
  });

  describe('deleteProject', () => {
    it('normalizes the project id and executes the use case', async () => {
      deleteProject.mockResolvedValue(undefined);

      const result = await controller.deleteProject({
        projectId: `  ${project.id}  `,
      });

      expect(deleteProject).toHaveBeenCalledWith({ projectId: project.id });
      expect(result).toBeUndefined();
    });

    it.each([
      { scenario: 'missing', params: {} },
      { scenario: 'blank', params: { projectId: '   ' } },
      {
        scenario: 'too long',
        params: {
          projectId: 'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1),
        },
      },
    ])('rejects a $scenario project id', async ({ params }) => {
      const execution = controller.deleteProject(params);

      await expect(execution).rejects.toMatchObject({
        code: HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
      });
      expect(deleteProject).not.toHaveBeenCalled();
    });

    it('propagates deletion use case errors', async () => {
      const useCaseError = new Error('Deletion failed');
      deleteProject.mockRejectedValue(useCaseError);

      const execution = controller.deleteProject({ projectId: project.id });

      await expect(execution).rejects.toBe(useCaseError);
    });
  });

  describe('getProject', () => {
    it('normalizes the project id and returns the project', async () => {
      getProject.mockResolvedValue({ project });

      const result = await controller.getProject({
        projectId: `  ${project.id}  `,
      });

      expect(getProject).toHaveBeenCalledWith({ projectId: project.id });
      expect(result).toEqual({ project });
    });

    it.each([
      { scenario: 'missing', params: {} },
      { scenario: 'blank', params: { projectId: '   ' } },
      {
        scenario: 'too long',
        params: {
          projectId: 'a'.repeat(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH + 1),
        },
      },
    ])('rejects a $scenario project id', async ({ params }) => {
      const execution = controller.getProject(params);

      await expect(execution).rejects.toMatchObject({
        code: HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
        message: HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
      });
      expect(getProject).not.toHaveBeenCalled();
    });

    it('propagates query use case errors', async () => {
      const useCaseError = new Error('Query failed');
      getProject.mockRejectedValue(useCaseError);

      const execution = controller.getProject({ projectId: project.id });

      await expect(execution).rejects.toBe(useCaseError);
    });
  });
});
