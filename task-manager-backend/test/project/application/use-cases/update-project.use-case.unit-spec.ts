import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '@project/application/errors';
import type {
  ProjectQueryStore,
  ProjectUpdateStore,
} from '@project/application/ports';
import { UpdateProjectUseCase } from '@project/application/use-cases';
import type { ProjectSnapshot } from '@project/domain';
import { ERROR_CATEGORIES } from '@shared/errors';

describe('UpdateProjectUseCase', () => {
  const storedProject: ProjectSnapshot = {
    id: 'project-123',
    name: 'Project Atlas',
    description: 'Internal planning',
  };

  let findById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let update: jest.MockedFunction<ProjectUpdateStore['update']>;
  let useCase: UpdateProjectUseCase;

  beforeEach(() => {
    findById = jest.fn().mockResolvedValue(storedProject);
    update = jest
      .fn<
        ReturnType<ProjectUpdateStore['update']>,
        Parameters<ProjectUpdateStore['update']>
      >()
      .mockImplementation((project) => Promise.resolve(project));
    useCase = new UpdateProjectUseCase({ findById }, { update });
  });

  it('updates and normalizes the project fields', async () => {
    const result = await useCase.execute({
      projectId: storedProject.id,
      name: '  Project Orion  ',
      description: '  External planning  ',
    });

    const expectedProject = {
      id: storedProject.id,
      name: 'Project Orion',
      description: 'External planning',
    };
    expect(findById).toHaveBeenCalledWith(storedProject.id);
    expect(update).toHaveBeenCalledWith(expectedProject);
    expect(result).toEqual({ project: expectedProject });
  });

  it('preserves fields that were not provided', async () => {
    const result = await useCase.execute({
      projectId: storedProject.id,
      name: 'Project Orion',
    });

    expect(result.project).toEqual({
      ...storedProject,
      name: 'Project Orion',
    });
  });

  it('clears the project description when null is provided', async () => {
    const result = await useCase.execute({
      projectId: storedProject.id,
      description: null,
    });

    expect(result.project.description).toBeNull();
    expect(update).toHaveBeenCalledWith({
      ...storedProject,
      description: null,
    });
  });

  it('rejects a command without fields to update', async () => {
    const execution = useCase.execute({ projectId: storedProject.id });

    await expect(execution).rejects.toMatchObject({
      name: ProjectApplicationError.name,
      code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_UPDATE_REQUIRED,
      message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_UPDATE_REQUIRED,
      category: ERROR_CATEGORIES.VALIDATION,
      retryable: false,
    });
    expect(findById).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('throws a not found error when the project does not exist', async () => {
    findById.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId: 'missing-project',
      name: 'Project Orion',
    });

    await expect(execution).rejects.toMatchObject({
      name: ProjectApplicationError.name,
      code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      message: PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('throws a not found error when the project disappears before updating', async () => {
    update.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId: storedProject.id,
      name: 'Project Orion',
    });

    await expect(execution).rejects.toMatchObject({
      code: PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
    });
  });
});
