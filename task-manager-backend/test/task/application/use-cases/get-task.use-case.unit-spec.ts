import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type { TaskQueryStore } from '@task/application/ports';
import { GetTaskUseCase } from '@task/application/use-cases';
import {
  TASK_ERROR_CODES,
  TaskDomainError,
  TaskPriority,
  TaskStatus,
  type TaskSnapshot,
} from '@task/domain';

describe('GetTaskUseCase', () => {
  const projectId = 'project-123';
  const taskId = 'task-123';
  const task: TaskSnapshot = {
    id: taskId,
    projectId,
    title: 'Prepare technical design',
    description: 'Define the task boundaries',
    status: TaskStatus.Pending,
    priority: TaskPriority.High,
    dueDate: '2026-08-10T20:30:00.000Z',
  };

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let findTaskById: jest.MockedFunction<TaskQueryStore['findById']>;
  let useCase: GetTaskUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    findTaskById = jest.fn().mockResolvedValue(task);
    useCase = new GetTaskUseCase(
      { findById: findProjectById },
      { findById: findTaskById },
    );
  });

  it('returns the task using normalized project and task ids', async () => {
    const result = await useCase.execute({
      projectId: `  ${projectId}  `,
      taskId: `  ${taskId}  `,
    });

    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(findTaskById).toHaveBeenCalledWith({ projectId, taskId });
    expect(result).toEqual({ task });
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
    expect(findTaskById).not.toHaveBeenCalled();
  });

  it('throws a task not found error when the task does not exist in the project', async () => {
    findTaskById.mockResolvedValue(null);

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
    expect(findTaskById).not.toHaveBeenCalled();
  });

  it('propagates task query store errors', async () => {
    const storeError = new Error('Store failed');
    findTaskById.mockRejectedValue(storeError);

    await expect(useCase.execute({ projectId, taskId })).rejects.toBe(
      storeError,
    );
  });
});
