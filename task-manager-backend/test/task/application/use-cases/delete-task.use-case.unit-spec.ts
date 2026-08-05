import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type { TaskDeletionStore } from '@task/application/ports';
import { DeleteTaskUseCase } from '@task/application/use-cases';
import { TASK_ERROR_CODES, TaskDomainError } from '@task/domain/errors';

describe('DeleteTaskUseCase', () => {
  const projectId = 'project-123';
  const taskId = 'task-123';

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let deleteTask: jest.MockedFunction<TaskDeletionStore['delete']>;
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    deleteTask = jest.fn().mockResolvedValue(true);
    useCase = new DeleteTaskUseCase(
      { findById: findProjectById },
      { delete: deleteTask },
    );
  });

  it('deletes the task using normalized project and task ids', async () => {
    const result = await useCase.execute({
      projectId: `  ${projectId}  `,
      taskId: `  ${taskId}  `,
    });

    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(deleteTask).toHaveBeenCalledWith({ projectId, taskId });
    expect(result).toBeUndefined();
  });

  it('throws a project not found error when the project does not exist', async () => {
    findProjectById.mockResolvedValue(null);

    const execution = useCase.execute({ projectId, taskId });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      layer: ERROR_LAYERS.APPLICATION,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it('throws a task not found error when the task does not exist in the project', async () => {
    deleteTask.mockResolvedValue(false);

    const execution = useCase.execute({ projectId, taskId });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
      message: TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
  });

  it.each([
    {
      scenario: 'blank project id',
      projectId: '   ',
      taskId,
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_REQUIRED,
    },
    {
      scenario: 'long project id',
      projectId: 'a'.repeat(65),
      taskId,
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
    },
    {
      scenario: 'blank task id',
      projectId,
      taskId: '   ',
      expectedCode: TASK_ERROR_CODES.TASK_ID_REQUIRED,
    },
    {
      scenario: 'long task id',
      projectId,
      taskId: 'a'.repeat(65),
      expectedCode: TASK_ERROR_CODES.TASK_ID_INVALID_LENGTH,
    },
  ])('rejects a $scenario', async ({ projectId, taskId, expectedCode }) => {
    const execution = useCase.execute({ projectId, taskId });

    await expect(execution).rejects.toMatchObject({
      name: TaskDomainError.name,
      code: expectedCode,
    });
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it('propagates deletion store errors', async () => {
    const storeError = new Error('Store failed');
    deleteTask.mockRejectedValue(storeError);

    await expect(useCase.execute({ projectId, taskId })).rejects.toBe(
      storeError,
    );
  });
});
