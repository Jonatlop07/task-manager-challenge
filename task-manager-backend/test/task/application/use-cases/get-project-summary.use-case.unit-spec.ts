import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '@task/application/errors';
import type {
  TaskSummaryCounts,
  TaskSummaryQueryStore,
} from '@task/application/ports';
import { GetProjectSummaryUseCase } from '@task/application/use-cases';
import { TASK_ERROR_CODES, TaskDomainError } from '@task/domain';

describe('GetProjectSummaryUseCase', () => {
  const projectId = 'project-123';
  const summary: TaskSummaryCounts = {
    total: 12,
    byStatus: {
      pending: 4,
      inProgress: 3,
      completed: 5,
    },
    byPriority: {
      low: 2,
      medium: 7,
      high: 3,
    },
    overdue: 2,
  };

  let findProjectById: jest.MockedFunction<ProjectQueryStore['findById']>;
  let summarizeByProjectId: jest.MockedFunction<
    TaskSummaryQueryStore['summarizeByProjectId']
  >;
  let useCase: GetProjectSummaryUseCase;

  beforeEach(() => {
    findProjectById = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Project Atlas',
      description: null,
    });
    summarizeByProjectId = jest.fn().mockResolvedValue(summary);
    useCase = new GetProjectSummaryUseCase(
      { findById: findProjectById },
      { summarizeByProjectId },
    );
  });

  it('returns the project summary with its completion percentage', async () => {
    await expect(
      useCase.execute({ projectId: `  ${projectId}  ` }),
    ).resolves.toEqual({
      ...summary,
      completionPercentage: 41.67,
    });

    expect(findProjectById).toHaveBeenCalledWith(projectId);
    expect(summarizeByProjectId).toHaveBeenCalledWith(projectId);
  });

  it('returns zero completion for a project without tasks', async () => {
    summarizeByProjectId.mockResolvedValue({
      total: 0,
      byStatus: {
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      overdue: 0,
    });

    await expect(useCase.execute({ projectId })).resolves.toEqual({
      total: 0,
      byStatus: {
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      overdue: 0,
      completionPercentage: 0,
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
    expect(summarizeByProjectId).not.toHaveBeenCalled();
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
    expect(summarizeByProjectId).not.toHaveBeenCalled();
  });

  it('propagates summary store errors', async () => {
    const storeError = new Error('Store failed');
    summarizeByProjectId.mockRejectedValue(storeError);

    await expect(useCase.execute({ projectId })).rejects.toBe(storeError);
  });
});
