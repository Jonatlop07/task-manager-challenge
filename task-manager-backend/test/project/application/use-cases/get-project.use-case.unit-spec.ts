import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '@project/application/errors';
import type { ProjectQueryStore } from '@project/application/ports';
import { GetProjectUseCase } from '@project/application/use-cases';
import type { ProjectSnapshot } from '@project/domain';
import {
  PROJECT_ERROR_CODES,
  ProjectDomainError,
} from '@project/domain/errors';
import { ERROR_CATEGORIES } from '@shared/errors';

describe('GetProjectUseCase', () => {
  const project: ProjectSnapshot = {
    id: 'project-123',
    name: 'Project Atlas',
    description: 'Internal planning',
  };

  let findById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let useCase: GetProjectUseCase;

  beforeEach(() => {
    findById = jest.fn().mockResolvedValue(project);
    useCase = new GetProjectUseCase({ findById });
  });

  it('returns the project using its normalized id', async () => {
    const result = await useCase.execute({
      projectId: `  ${project.id}  `,
    });

    expect(findById).toHaveBeenCalledWith(project.id);
    expect(result).toEqual({ project });
  });

  it('throws a not found error when the project does not exist', async () => {
    findById.mockResolvedValue(null);

    const execution = useCase.execute({ projectId: project.id });

    await expect(execution).rejects.toMatchObject({
      name: ProjectApplicationError.name,
      code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
  });

  it.each([
    {
      scenario: 'blank',
      projectId: '   ',
      expectedCode: PROJECT_ERROR_CODES.PROJECT_ID_REQUIRED,
    },
    {
      scenario: 'too long',
      projectId: 'a'.repeat(65),
      expectedCode: PROJECT_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
    },
  ])('rejects a $scenario project id', async ({ projectId, expectedCode }) => {
    const execution = useCase.execute({ projectId });

    await expect(execution).rejects.toMatchObject({
      name: ProjectDomainError.name,
      code: expectedCode,
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('propagates store errors', async () => {
    const storeError = new Error('Store failed');
    findById.mockRejectedValue(storeError);

    const execution = useCase.execute({ projectId: project.id });

    await expect(execution).rejects.toBe(storeError);
  });
});
