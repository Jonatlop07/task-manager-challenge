import type { DeleteTaskInput, TaskDeletionStore } from '@task/application';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from '../entities';

export class TypeOrmTaskDeletionStore implements TaskDeletionStore {
  constructor(private readonly dataSource: DataSource) {}

  async delete(input: DeleteTaskInput): Promise<boolean> {
    const result = await this.taskRepository.delete({
      id: input.taskId,
      projectId: input.projectId,
    });

    return result.affected === 1;
  }

  private get taskRepository() {
    return this.dataSource.getRepository(TaskOrmEntity);
  }
}
