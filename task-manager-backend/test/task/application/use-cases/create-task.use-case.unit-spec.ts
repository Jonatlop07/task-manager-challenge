import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import type { IdGenerator } from '@shared/identity';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type { TaskCreationStore } from '@task/application/ports';
import { CreateTaskUseCase } from '@task/application/use-cases';
import {
  TASK_ERROR_CODES,
  TaskDomainError,
  TaskPriority,
  TaskStatus,
} from '@task/domain';

describe('CreateTaskUseCase', () => {
  const generatedTaskId = 'task-123';
  const projectId = 'project-123';

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let saveTask: jest.MockedFunction<TaskCreationStore['save']>;
  let generateTaskId: jest.MockedFunction<IdGenerator<string>['generate']>;
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    saveTask = jest
      .fn<
        ReturnType<TaskCreationStore['save']>,
        Parameters<TaskCreationStore['save']>
      >()
      .mockImplementation((task) => Promise.resolve(task));
    generateTaskId = jest.fn().mockReturnValue(generatedTaskId);
    useCase = new CreateTaskUseCase(
      { findById: findProjectById },
      { save: saveTask },
      { generate: generateTaskId },
    );
  });

  it('creates a pending task with the default priority', async () => {
    const result = await useCase.execute({
      projectId: `  ${projectId}  `,
      title: '  Prepare technical design  ',
      description: '  Define the task boundaries  ',
    });

    const expectedTask = {
      id: generatedTaskId,
      projectId,
      title: 'Prepare technical design',
      description: 'Define the task boundaries',
      status: TaskStatus.Pending,
      priority: TaskPriority.Medium,
      dueDate: null,
    };
    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(generateTaskId).toHaveBeenCalledTimes(1);
    expect(saveTask).toHaveBeenCalledWith(expectedTask);
    expect(result).toEqual({ task: expectedTask });
  });

  it('uses the requested priority and normalizes the due date', async () => {
    const result = await useCase.execute({
      projectId,
      title: 'Prepare technical design',
      priority: TaskPriority.High,
      dueDate: '2026-08-10T15:30:00-05:00',
    });

    expect(result.task).toMatchObject({
      priority: TaskPriority.High,
      dueDate: '2026-08-10T20:30:00.000Z',
    });
  });

  it('stores optional fields as null when they are omitted', async () => {
    const result = await useCase.execute({
      projectId,
      title: 'Prepare technical design',
    });

    expect(result.task.description).toBeNull();
    expect(result.task.dueDate).toBeNull();
  });

  it('throws a not found error when the project does not exist', async () => {
    findProjectById.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId,
      title: 'Prepare technical design',
    });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      layer: ERROR_LAYERS.APPLICATION,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
    expect(saveTask).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: 'blank title',
      command: { projectId, title: '   ' },
      expectedCode: TASK_ERROR_CODES.TASK_TITLE_REQUIRED,
    },
    {
      scenario: 'long title',
      command: { projectId, title: 'a'.repeat(151) },
      expectedCode: TASK_ERROR_CODES.TASK_TITLE_INVALID_LENGTH,
    },
    {
      scenario: 'invalid due date',
      command: {
        projectId,
        title: 'Prepare technical design',
        dueDate: 'invalid-date',
      },
      expectedCode: TASK_ERROR_CODES.TASK_DUE_DATE_INVALID,
    },
  ])('rejects a $scenario', async ({ command, expectedCode }) => {
    const execution = useCase.execute(command);

    await expect(execution).rejects.toMatchObject({
      name: TaskDomainError.name,
      code: expectedCode,
    });
    expect(findProjectById).not.toHaveBeenCalled();
    expect(saveTask).not.toHaveBeenCalled();
  });

  it('propagates store errors', async () => {
    const storeError = new Error('Store failed');
    saveTask.mockRejectedValue(storeError);

    const execution = useCase.execute({
      projectId,
      title: 'Prepare technical design',
    });

    await expect(execution).rejects.toBe(storeError);
  });
});
