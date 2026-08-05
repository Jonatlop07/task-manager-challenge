import type { CreateProjectUseCase } from '@project/application';
import { ProjectsController } from '@api/interfaces/http/projects/projects.controller';
import { PROJECT_HTTP_RESPONSE_STATUSES } from '@api/interfaces/http/projects/projects-http.constants';
import type { Response } from 'express';

describe('ProjectsController', () => {
  const project = {
    id: 'project-123',
    name: 'Project Atlas',
    description: null,
  };

  let execute: jest.MockedFunction<CreateProjectUseCase['execute']>;
  let setStatus: jest.Mock;
  let response: Response;
  let controller: ProjectsController;

  beforeEach(() => {
    execute = jest.fn();
    setStatus = jest.fn();
    response = { status: setStatus } as unknown as Response;
    controller = new ProjectsController({ execute });
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
});
