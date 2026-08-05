import type {
  TaskSummaryCounts,
  TaskSummaryQueryStore,
} from '@task/application';
import { TaskPriority, TaskStatus } from '@task/domain';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from '../entities';

const TASK_ALIAS = 'task';

type RawTaskSummary = Readonly<{
  total: string | null;
  pending: string | null;
  inProgress: string | null;
  completed: string | null;
  low: string | null;
  medium: string | null;
  high: string | null;
  overdue: string | null;
}>;

export class TypeOrmTaskSummaryQueryStore implements TaskSummaryQueryStore {
  constructor(private readonly dataSource: DataSource) {}

  async summarizeByProjectId(projectId: string): Promise<TaskSummaryCounts> {
    const summary = await this.taskRepository
      .createQueryBuilder(TASK_ALIAS)
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.status = :pendingStatus)`,
        'pending',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.status = :inProgressStatus)`,
        'inProgress',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.status = :completedStatus)`,
        'completed',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.priority = :lowPriority)`,
        'low',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.priority = :mediumPriority)`,
        'medium',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.priority = :highPriority)`,
        'high',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ${TASK_ALIAS}.dueDate < CURRENT_TIMESTAMP AND ${TASK_ALIAS}.status <> :completedStatus)`,
        'overdue',
      )
      .where(`${TASK_ALIAS}.projectId = :projectId`, { projectId })
      .setParameters({
        pendingStatus: TaskStatus.Pending,
        inProgressStatus: TaskStatus.InProgress,
        completedStatus: TaskStatus.Completed,
        lowPriority: TaskPriority.Low,
        mediumPriority: TaskPriority.Medium,
        highPriority: TaskPriority.High,
      })
      .getRawOne<RawTaskSummary>();

    return {
      total: this.toNumber(summary?.total),
      byStatus: {
        pending: this.toNumber(summary?.pending),
        inProgress: this.toNumber(summary?.inProgress),
        completed: this.toNumber(summary?.completed),
      },
      byPriority: {
        low: this.toNumber(summary?.low),
        medium: this.toNumber(summary?.medium),
        high: this.toNumber(summary?.high),
      },
      overdue: this.toNumber(summary?.overdue),
    };
  }

  private toNumber(value: string | null | undefined): number {
    return Number(value ?? 0);
  }

  private get taskRepository() {
    return this.dataSource.getRepository(TaskOrmEntity);
  }
}
