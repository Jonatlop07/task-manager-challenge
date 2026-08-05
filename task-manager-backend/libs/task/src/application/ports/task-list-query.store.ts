import type { TaskPriority, TaskSnapshot, TaskStatus } from '@task/domain';

export type FindTasksByProjectIdQuery = Readonly<{
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}>;

export interface TaskListQueryStore {
  findByProjectId(
    query: FindTasksByProjectIdQuery,
  ): Promise<readonly TaskSnapshot[]>;
}
