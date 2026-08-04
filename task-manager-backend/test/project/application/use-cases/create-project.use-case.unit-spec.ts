import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '@project/application/errors';
import {
  PROJECT_CREATION_STORE_RESULT_STATUSES,
  ProjectCreationStore,
} from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import { IdGenerator } from '@shared/identity';
import { CreateProjectUseCase } from '@project/application/use-cases';

describe('CreateProjectUseCase', () => {
  const generatedProjectId = 'project-123';

  let store: jest.Mocked<ProjectCreationStore>;
  let projectIdGenerator: jest.Mocked<IdGenerator<string>>;
  let saveProject: jest.MockedFunction<ProjectCreationStore['save']>;
  let generateProjectId: jest.MockedFunction<IdGenerator<string>['generate']>;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    saveProject = jest.fn();
    generateProjectId = jest.fn().mockReturnValue(generatedProjectId);
    store = {
      save: saveProject,
    };
    projectIdGenerator = {
      generate: generateProjectId,
    };
    useCase = new CreateProjectUseCase(store, projectIdGenerator);
  });

  it('creates and stores a project', async () => {
    const storedProject = {
      id: generatedProjectId,
      name: 'Project Atlas',
      description: 'Internal planning',
    };
    saveProject.mockResolvedValue({
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.CREATED,
      project: storedProject,
    });

    const result = await useCase.execute({
      idempotencyKey: 'create-project-atlas',
      name: '  Project Atlas  ',
      description: '  Internal planning  ',
    });

    expect(generateProjectId).toHaveBeenCalledTimes(1);
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(saveProject).toHaveBeenCalledWith({
      idempotencyKey: 'create-project-atlas',
      project: storedProject,
    });
    expect(result).toEqual({
      project: storedProject,
      idempotentReplay: false,
    });
  });

  it('stores a null description when it is omitted', async () => {
    const storedProject = {
      id: generatedProjectId,
      name: 'Project Atlas',
      description: null,
    };
    saveProject.mockResolvedValue({
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.CREATED,
      project: storedProject,
    });

    await useCase.execute({
      idempotencyKey: 'create-project-atlas',
      name: 'Project Atlas',
    });

    expect(saveProject).toHaveBeenCalledWith({
      idempotencyKey: 'create-project-atlas',
      project: storedProject,
    });
  });

  it('returns the previously stored project for an idempotent replay', async () => {
    const replayedProject = {
      id: 'existing-project-456',
      name: 'Project Atlas',
      description: null,
    };
    saveProject.mockResolvedValue({
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED,
      project: replayedProject,
    });

    const result = await useCase.execute({
      idempotencyKey: 'create-project-atlas',
      name: 'Project Atlas',
    });

    expect(result).toEqual({
      project: replayedProject,
      idempotentReplay: true,
    });
  });

  it('throws an application error when the idempotency key conflicts', async () => {
    saveProject.mockResolvedValue({
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
    });

    const execution = useCase.execute({
      idempotencyKey: 'conflicting-key',
      name: 'Project Atlas',
    });

    await expect(execution).rejects.toMatchObject({
      name: ProjectApplicationError.name,
      code: PROJECT_APPLICATION_ERROR_CODES.IDEMPOTENCY_CONFLICT,
      message: PROJECT_APPLICATION_ERROR_MESSAGES.IDEMPOTENCY_CONFLICT,
      layer: ERROR_LAYERS.APPLICATION,
      category: ERROR_CATEGORIES.IDEMPOTENCY_CONFLICT,
      retryable: false,
    });
  });
});
