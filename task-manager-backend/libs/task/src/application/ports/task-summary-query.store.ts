export type TaskSummaryCounts = Readonly<{
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
}>;

export interface TaskSummaryQueryStore {
  summarizeByProjectId(projectId: string): Promise<TaskSummaryCounts>;
}
