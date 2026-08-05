import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import { TaskProjectId } from '@task/domain';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '../errors';
import type { TaskSummaryQueryStore } from '../ports';

export type GetProjectSummaryCommand = Readonly<{
  projectId: string;
}>;

export type GetProjectSummaryResult = Readonly<{
  total: number;
  byStatus: Readonly<{
    pending: number;
    inProgress: number;
    completed: number;
  }>;
  byPriority: Readonly<{
    low: number;
    medium: number;
    high: number;
  }>;
  overdue: number;
  completionPercentage: number;
}>;

export class GetProjectSummaryUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskSummaryQueryStore: TaskSummaryQueryStore,
  ) {}

  async execute(
    command: GetProjectSummaryCommand,
  ): Promise<GetProjectSummaryResult> {
    const projectId = TaskProjectId.create(command.projectId);
    const project = await this.projectQueryStore.findById(projectId.value);

    if (!project) {
      throw new TaskApplicationError(
        TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
        TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }

    const summary = await this.taskSummaryQueryStore.summarizeByProjectId(
      projectId.value,
    );

    return {
      ...summary,
      completionPercentage: this.calculateCompletionPercentage(
        summary.byStatus.completed,
        summary.total,
      ),
    };
  }

  private calculateCompletionPercentage(
    completed: number,
    total: number,
  ): number {
    if (total === 0) return 0;

    return Math.round((completed / total) * 10_000) / 100;
  }
}
