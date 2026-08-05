import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type { TaskQueryStore, TaskUpdateStore } from '@task/application/ports';
import { UpdateTaskUseCase } from '@task/application/use-cases';
import {
  TASK_ERROR_CODES,
  TaskDomainError,
  TaskPriority,
  TaskStatus,
  type TaskSnapshot,
} from '@task/domain';

describe('UpdateTaskUseCase', () => {
  const projectId = 'project-123';
  const taskId = 'task-123';
  const storedTask: TaskSnapshot = {
    id: taskId,
    projectId,
    title: 'Prepare technical design',
    description: 'Define the task boundaries',
    status: TaskStatus.Pending,
    priority: TaskPriority.Medium,
    dueDate: '2026-08-10T20:30:00.000Z',
  };

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let findTaskById: jest.MockedFunction<TaskQueryStore['findById']>;
  let updateTask: jest.MockedFunction<TaskUpdateStore['update']>;
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    findTaskById = jest.fn().mockResolvedValue(storedTask);
    updateTask = jest
      .fn<
        ReturnType<TaskUpdateStore['update']>,
        Parameters<TaskUpdateStore['update']>
      >()
      .mockImplementation((task) => Promise.resolve(task));
    useCase = new UpdateTaskUseCase(
      { findById: findProjectById },
      { findById: findTaskById },
      { update: updateTask },
    );
  });

  it('updates and normalizes all mutable task fields', async () => {
    const result = await useCase.execute({
      projectId: `  ${projectId}  `,
      taskId: `  ${taskId}  `,
      title: '  Review technical design  ',
      description: '  Validate the proposed boundaries  ',
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
      dueDate: '2026-08-12T15:30:00-05:00',
    });

    const expectedTask = {
      ...storedTask,
      title: 'Review technical design',
      description: 'Validate the proposed boundaries',
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
      dueDate: '2026-08-12T20:30:00.000Z',
    };
    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(findTaskById).toHaveBeenCalledWith({ projectId, taskId });
    expect(updateTask).toHaveBeenCalledWith(expectedTask);
    expect(result).toEqual({ task: expectedTask });
  });

  it('preserves fields that were not provided', async () => {
    const result = await useCase.execute({
      projectId,
      taskId,
      title: 'Review technical design',
    });

    expect(result.task).toEqual({
      ...storedTask,
      title: 'Review technical design',
    });
  });

  it('clears nullable fields when null is provided', async () => {
    const result = await useCase.execute({
      projectId,
      taskId,
      description: null,
      dueDate: null,
    });

    expect(result.task.description).toBeNull();
    expect(result.task.dueDate).toBeNull();
  });

  it('rejects a command without fields to update', async () => {
    const execution = useCase.execute({ projectId, taskId });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.TASK_UPDATE_REQUIRED,
      message: TASK_APPLICATION_ERROR_MESSAGES.TASK_UPDATE_REQUIRED,
      layer: ERROR_LAYERS.APPLICATION,
      category: ERROR_CATEGORIES.VALIDATION,
      retryable: false,
    });
    expect(findProjectById).not.toHaveBeenCalled();
    expect(findTaskById).not.toHaveBeenCalled();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('throws a project not found error when the project does not exist', async () => {
    findProjectById.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId,
      taskId,
      title: 'Review technical design',
    });

    await expect(execution).rejects.toMatchObject({
      code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
    });
    expect(findTaskById).not.toHaveBeenCalled();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('throws a task not found error when the task does not exist in the project', async () => {
    findTaskById.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId,
      taskId,
      title: 'Review technical design',
    });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
      message: TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('throws a task not found error when the task disappears before updating', async () => {
    updateTask.mockResolvedValue(null);

    const execution = useCase.execute({
      projectId,
      taskId,
      title: 'Review technical design',
    });

    await expect(execution).rejects.toMatchObject({
      code: TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
    });
  });

  it.each([
    {
      scenario: 'blank project id',
      command: { projectId: '   ', taskId, title: 'Review design' },
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_REQUIRED,
    },
    {
      scenario: 'long project id',
      command: {
        projectId: 'a'.repeat(65),
        taskId,
        title: 'Review design',
      },
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
    },
    {
      scenario: 'blank task id',
      command: { projectId, taskId: '   ', title: 'Review design' },
      expectedCode: TASK_ERROR_CODES.TASK_ID_REQUIRED,
    },
    {
      scenario: 'long task id',
      command: {
        projectId,
        taskId: 'a'.repeat(65),
        title: 'Review design',
      },
      expectedCode: TASK_ERROR_CODES.TASK_ID_INVALID_LENGTH,
    },
  ])('rejects a $scenario', async ({ command, expectedCode }) => {
    const execution = useCase.execute(command);

    await expect(execution).rejects.toMatchObject({
      name: TaskDomainError.name,
      code: expectedCode,
    });
    expect(findTaskById).not.toHaveBeenCalled();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: 'blank title',
      changes: { title: '   ' },
      expectedCode: TASK_ERROR_CODES.TASK_TITLE_REQUIRED,
    },
    {
      scenario: 'invalid due date',
      changes: { dueDate: 'not-a-date' },
      expectedCode: TASK_ERROR_CODES.TASK_DUE_DATE_INVALID,
    },
    {
      scenario: 'invalid status',
      changes: { status: 'blocked' as TaskStatus },
      expectedCode: TASK_ERROR_CODES.TASK_STATUS_INVALID,
    },
    {
      scenario: 'invalid priority',
      changes: { priority: 'urgent' as TaskPriority },
      expectedCode: TASK_ERROR_CODES.TASK_PRIORITY_INVALID,
    },
  ])('rejects an $scenario', async ({ changes, expectedCode }) => {
    const execution = useCase.execute({ projectId, taskId, ...changes });

    await expect(execution).rejects.toMatchObject({
      name: TaskDomainError.name,
      code: expectedCode,
    });
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('propagates update store errors', async () => {
    const storeError = new Error('Store failed');
    updateTask.mockRejectedValue(storeError);

    await expect(
      useCase.execute({
        projectId,
        taskId,
        title: 'Review technical design',
      }),
    ).rejects.toBe(storeError);
  });
});
