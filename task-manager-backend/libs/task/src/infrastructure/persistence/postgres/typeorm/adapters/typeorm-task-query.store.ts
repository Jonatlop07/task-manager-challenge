import type {
  FindTasksByProjectIdQuery,
  TaskListQueryStore,
} from '@task/application';
import type { TaskSnapshot } from '@task/domain';
import { DataSource, type SelectQueryBuilder } from 'typeorm';
import { TaskOrmEntity } from '../entities';

const TASK_ALIAS = 'task';

export class TypeOrmTaskQueryStore implements TaskListQueryStore {
  constructor(private readonly dataSource: DataSource) {}

  async findByProjectId(
    query: FindTasksByProjectIdQuery,
  ): Promise<readonly TaskSnapshot[]> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder(TASK_ALIAS)
      .where(`${TASK_ALIAS}.projectId = :projectId`, {
        projectId: query.projectId,
      });

    this.applyFilters(queryBuilder, query);

    const tasks = await queryBuilder
      .orderBy(`${TASK_ALIAS}.createdAt`, 'ASC')
      .addOrderBy(`${TASK_ALIAS}.id`, 'ASC')
      .getMany();

    return tasks.map((task) => this.toSnapshot(task));
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<TaskOrmEntity>,
    query: FindTasksByProjectIdQuery,
  ): void {
    if (query.status !== undefined) {
      queryBuilder.andWhere(`${TASK_ALIAS}.status = :status`, {
        status: query.status,
      });
    }

    if (query.priority !== undefined) {
      queryBuilder.andWhere(`${TASK_ALIAS}.priority = :priority`, {
        priority: query.priority,
      });
    }

    if (query.search !== undefined) {
      queryBuilder.andWhere(
        `(${TASK_ALIAS}.title ILIKE :search ESCAPE '\\' OR ${TASK_ALIAS}.description ILIKE :search ESCAPE '\\')`,
        { search: `%${this.escapeLikePattern(query.search)}%` },
      );
    }
  }

  private escapeLikePattern(value: string): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
  }

  private toSnapshot(task: TaskOrmEntity): TaskSnapshot {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
    };
  }

  private get taskRepository() {
    return this.dataSource.getRepository(TaskOrmEntity);
  }
}
