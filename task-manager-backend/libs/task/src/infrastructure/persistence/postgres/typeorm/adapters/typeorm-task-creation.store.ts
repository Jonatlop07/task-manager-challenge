import type { TaskCreationStore } from '@task/application';
import type { TaskSnapshot } from '@task/domain';
import { DataSource } from 'typeorm';
import { TaskOrmEntity } from '../entities';

export class TypeOrmTaskCreationStore implements TaskCreationStore {
  constructor(private readonly dataSource: DataSource) {}

  async save(task: TaskSnapshot): Promise<TaskSnapshot> {
    await this.taskRepository.insert({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    });

    return task;
  }

  private get taskRepository() {
    return this.dataSource.getRepository(TaskOrmEntity);
  }
}
