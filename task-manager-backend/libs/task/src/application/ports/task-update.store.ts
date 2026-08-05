import type { TaskSnapshot } from '@task/domain';

export interface TaskUpdateStore {
  update(task: TaskSnapshot): Promise<TaskSnapshot | null>;
}
