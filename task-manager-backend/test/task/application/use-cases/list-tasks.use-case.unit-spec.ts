import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type { TaskListQueryStore } from '@task/application/ports';
import { ListTasksUseCase } from '@task/application/use-cases';
import {
  TASK_ERROR_CODES,
  TaskDomainError,
  TaskPriority,
  TaskStatus,
  type TaskSnapshot,
} from '@task/domain';

describe('ListTasksUseCase', () => {
  const projectId = 'project-123';
  const tasks: readonly TaskSnapshot[] = [
    {
      id: 'task-123',
      projectId,
      title: 'Prepare technical design',
      description: 'Define the task boundaries',
      status: TaskStatus.Pending,
      priority: TaskPriority.High,
      dueDate: '2026-08-10T20:30:00.000Z',
    },
    {
      id: 'task-456',
      projectId,
      title: 'Review technical design',
      description: null,
      status: TaskStatus.InProgress,
      priority: TaskPriority.Medium,
      dueDate: null,
    },
  ];

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let findTasksByProjectId: jest.MockedFunction<
    TaskListQueryStore['findByProjectId']
  >;
  let useCase: ListTasksUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    findTasksByProjectId = jest.fn().mockResolvedValue(tasks);
    useCase = new ListTasksUseCase(
      { findById: findProjectById },
      { findByProjectId: findTasksByProjectId },
    );
  });

  it('returns the tasks using the normalized project id', async () => {
    const result = await useCase.execute({
      projectId: `  ${projectId}  `,
    });

    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(findTasksByProjectId).toHaveBeenCalledWith({
      projectId,
      status: undefined,
      priority: undefined,
      search: undefined,
    });
    expect(result).toEqual({ tasks });
  });

  it('passes status, priority and normalized search filters to the store', async () => {
    await useCase.execute({
      projectId,
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
      search: '  technical design  ',
    });

    expect(findTasksByProjectId).toHaveBeenCalledWith({
      projectId,
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
      search: 'technical design',
    });
  });

  it('omits search when it only contains whitespace', async () => {
    await useCase.execute({ projectId, search: '   ' });

    expect(findTasksByProjectId).toHaveBeenCalledWith(
      expect.objectContaining({ search: undefined }),
    );
  });

  it('returns an empty collection when the project has no tasks', async () => {
    findTasksByProjectId.mockResolvedValue([]);

    await expect(useCase.execute({ projectId })).resolves.toEqual({
      tasks: [],
    });
  });

  it('throws a not found error when the project does not exist', async () => {
    findProjectById.mockResolvedValue(null);

    const execution = useCase.execute({ projectId });

    await expect(execution).rejects.toMatchObject({
      name: TaskApplicationError.name,
      code: TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      message: TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      layer: ERROR_LAYERS.APPLICATION,
      category: ERROR_CATEGORIES.NOT_FOUND,
      retryable: false,
    });
    expect(findTasksByProjectId).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: 'blank',
      projectId: '   ',
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_REQUIRED,
    },
    {
      scenario: 'too long',
      projectId: 'a'.repeat(65),
      expectedCode: TASK_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
    },
  ])('rejects a $scenario project id', async ({ projectId, expectedCode }) => {
    const execution = useCase.execute({ projectId });

    await expect(execution).rejects.toMatchObject({
      name: TaskDomainError.name,
      code: expectedCode,
    });
    expect(findProjectById).not.toHaveBeenCalled();
    expect(findTasksByProjectId).not.toHaveBeenCalled();
  });

  it('propagates task query store errors', async () => {
    const storeError = new Error('Store failed');
    findTasksByProjectId.mockRejectedValue(storeError);

    await expect(useCase.execute({ projectId })).rejects.toBe(storeError);
  });
});
