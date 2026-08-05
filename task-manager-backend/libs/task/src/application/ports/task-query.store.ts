import type { TaskSnapshot } from '@task/domain';

export type FindTaskByIdQuery = Readonly<{
  projectId: string;
  taskId: string;
}>;

export interface TaskQueryStore {
  findById(query: FindTaskByIdQuery): Promise<TaskSnapshot | null>;
}
