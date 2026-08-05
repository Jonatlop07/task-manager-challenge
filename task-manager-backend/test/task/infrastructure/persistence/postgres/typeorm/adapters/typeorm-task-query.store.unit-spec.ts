import { TaskPriority, TaskStatus } from '@task/domain';
import { TypeOrmTaskQueryStore } from '@task/infrastructure/persistence/postgres/typeorm/adapters';
import { TaskOrmEntity } from '@task/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

describe('TypeOrmTaskQueryStore', () => {
  const projectId = 'project-123';
  const dueDate = new Date('2026-08-10T20:30:00.000Z');
  const taskEntity = Object.assign(new TaskOrmEntity(), {
    id: 'task-123',
    projectId,
    title: 'Prepare technical design',
    description: 'Define the task boundaries',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    dueDate,
    createdAt: new Date('2026-08-05T10:00:00.000Z'),
    updatedAt: new Date('2026-08-05T10:00:00.000Z'),
  });

  let createQueryBuilder: jest.MockedFunction<
    Repository<TaskOrmEntity>['createQueryBuilder']
  >;
  let where: jest.MockedFunction<SelectQueryBuilder<TaskOrmEntity>['where']>;
  let andWhere: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['andWhere']
  >;
  let orderBy: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['orderBy']
  >;
  let addOrderBy: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['addOrderBy']
  >;
  let getMany: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['getMany']
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmTaskQueryStore;

  beforeEach(() => {
    const queryBuilder = {} as SelectQueryBuilder<TaskOrmEntity>;
    where = jest.fn().mockReturnValue(queryBuilder);
    andWhere = jest.fn().mockReturnValue(queryBuilder);
    orderBy = jest.fn().mockReturnValue(queryBuilder);
    addOrderBy = jest.fn().mockReturnValue(queryBuilder);
    getMany = jest.fn().mockResolvedValue([taskEntity]);
    Object.assign(queryBuilder, {
      where,
      andWhere,
      orderBy,
      addOrderBy,
      getMany,
    });

    createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    getRepository = jest.fn().mockReturnValue({ createQueryBuilder });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmTaskQueryStore(dataSource);
  });

  it('lists and maps tasks for a project in a stable order', async () => {
    const result = await store.findByProjectId({ projectId });

    expect(getRepository).toHaveBeenCalledWith(TaskOrmEntity);
    expect(createQueryBuilder).toHaveBeenCalledWith('task');
    expect(where).toHaveBeenCalledWith('task.projectId = :projectId', {
      projectId,
    });
    expect(andWhere).not.toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledWith('task.createdAt', 'ASC');
    expect(addOrderBy).toHaveBeenCalledWith('task.id', 'ASC');
    expect(result).toEqual([
      {
        id: taskEntity.id,
        projectId: taskEntity.projectId,
        title: taskEntity.title,
        description: taskEntity.description,
        status: taskEntity.status,
        priority: taskEntity.priority,
        dueDate: dueDate.toISOString(),
      },
    ]);
  });

  it('applies status and priority filters', async () => {
    await store.findByProjectId({
      projectId,
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
    });

    expect(andWhere).toHaveBeenNthCalledWith(1, 'task.status = :status', {
      status: TaskStatus.InProgress,
    });
    expect(andWhere).toHaveBeenNthCalledWith(2, 'task.priority = :priority', {
      priority: TaskPriority.High,
    });
  });

  it('searches title and description using an escaped literal pattern', async () => {
    await store.findByProjectId({
      projectId,
      search: String.raw`design_100%\ready`,
    });

    expect(andWhere).toHaveBeenCalledWith(
      `(task.title ILIKE :search ESCAPE '\\' OR task.description ILIKE :search ESCAPE '\\')`,
      { search: String.raw`%design\_100\%\\ready%` },
    );
  });

  it('maps a missing due date to null', async () => {
    getMany.mockResolvedValue([
      Object.assign(new TaskOrmEntity(), taskEntity, { dueDate: null }),
    ]);

    const result = await store.findByProjectId({ projectId });

    expect(result[0]?.dueDate).toBeNull();
  });

  it('propagates query errors', async () => {
    const queryError = new Error('Query failed');
    getMany.mockRejectedValue(queryError);

    await expect(store.findByProjectId({ projectId })).rejects.toBe(queryError);
  });
});
