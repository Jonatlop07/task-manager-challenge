import type { TaskSnapshot } from '@task/domain';

export interface TaskCreationStore {
  save(task: TaskSnapshot): Promise<TaskSnapshot>;
}
