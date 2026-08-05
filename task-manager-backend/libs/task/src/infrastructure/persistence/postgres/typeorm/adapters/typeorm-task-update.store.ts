import type { TaskUpdateStore } from '@task/application';
import type { TaskSnapshot } from '@task/domain';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from '../entities';

export class TypeOrmTaskUpdateStore implements TaskUpdateStore {
  constructor(private readonly dataSource: DataSource) {}

  async update(task: TaskSnapshot): Promise<TaskSnapshot | null> {
    const result = await this.taskRepository.update(
      {
        id: task.id,
        projectId: task.projectId,
      },
      {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      },
    );

    return result.affected === 1 ? task : null;
  }

  private get taskRepository() {
    return this.dataSource.getRepository(TaskOrmEntity);
  }
}
