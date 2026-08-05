import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '@project/application/errors';
import type { ProjectDeletionStore } from '@project/application/ports';
import { DeleteProjectUseCase } from '@project/application/use-cases';
import {
  PROJECT_ERROR_CODES,
  ProjectDomainError,
} from '@project/domain/errors';
import { ERROR_CATEGORIES } from '@shared/errors';

describe('DeleteProjectUseCase', () => {
  const projectId = 'project-123';

  let deleteProject: jest.MockedFunction<ProjectDeletionStore['delete']>;
  let useCase: DeleteProjectUseCase;

  beforeEach(() => {
    deleteProject = jest.fn().mockResolvedValue(true);
    useCase = new DeleteProjectUseCase({ delete: deleteProject });
  });

  it('deletes the project using its normalized id', async () => {
    const result = await useCase.execute({ projectId: `  ${projectId}  ` });

    expect(deleteProject).toHaveBeenCalledWith(projectId);
    expect(result).toBeUndefined();
  });

  it('throws a not found error when the project does not exist', async () => {
    deleteProject.mockResolvedValue(false);

    const execution = useCase.execute({ projectId });

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
    expect(deleteProject).not.toHaveBeenCalled();
  });

  it('propagates store errors', async () => {
    const storeError = new Error('Store failed');
    deleteProject.mockRejectedValue(storeError);

    const execution = useCase.execute({ projectId });

    await expect(execution).rejects.toBe(storeError);
  });
});
