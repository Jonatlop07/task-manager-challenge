import { TaskPriority, TaskStatus } from '@task/domain';
import { TypeOrmTaskSummaryQueryStore } from '@task/infrastructure/persistence/postgres/typeorm/adapters';
import { TaskOrmEntity } from '@task/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

describe('TypeOrmTaskSummaryQueryStore', () => {
  const projectId = 'project-123';

  let select: jest.MockedFunction<SelectQueryBuilder<TaskOrmEntity>['select']>;
  let addSelect: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['addSelect']
  >;
  let where: jest.MockedFunction<SelectQueryBuilder<TaskOrmEntity>['where']>;
  let setParameters: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['setParameters']
  >;
  let getRawOne: jest.MockedFunction<
    SelectQueryBuilder<TaskOrmEntity>['getRawOne']
  >;
  let createQueryBuilder: jest.MockedFunction<
    Repository<TaskOrmEntity>['createQueryBuilder']
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmTaskSummaryQueryStore;

  beforeEach(() => {
    const queryBuilder = {} as SelectQueryBuilder<TaskOrmEntity>;
    select = jest.fn().mockReturnValue(queryBuilder);
    addSelect = jest.fn().mockReturnValue(queryBuilder);
    where = jest.fn().mockReturnValue(queryBuilder);
    setParameters = jest.fn().mockReturnValue(queryBuilder);
    getRawOne = jest.fn().mockResolvedValue({
      total: '12',
      pending: '4',
      inProgress: '3',
      completed: '5',
      low: '2',
      medium: '7',
      high: '3',
      overdue: '2',
    });
    Object.assign(queryBuilder, {
      select,
      addSelect,
      where,
      setParameters,
      getRawOne,
    });

    createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    getRepository = jest.fn().mockReturnValue({ createQueryBuilder });
    const dataSource = { getRepository } as unknown as DataSource;

    store = new TypeOrmTaskSummaryQueryStore(dataSource);
  });

  it('returns the aggregated task counts for a project', async () => {
    const result = await store.summarizeByProjectId(projectId);

    expect(getRepository).toHaveBeenCalledWith(TaskOrmEntity);
    expect(createQueryBuilder).toHaveBeenCalledWith('task');
    expect(select).toHaveBeenCalledWith('COUNT(*)', 'total');
    expect(where).toHaveBeenCalledWith('task.projectId = :projectId', {
      projectId,
    });
    expect(setParameters).toHaveBeenCalledWith({
      pendingStatus: TaskStatus.Pending,
      inProgressStatus: TaskStatus.InProgress,
      completedStatus: TaskStatus.Completed,
      lowPriority: TaskPriority.Low,
      mediumPriority: TaskPriority.Medium,
      highPriority: TaskPriority.High,
    });
    expect(addSelect).toHaveBeenCalledWith(
      'COUNT(*) FILTER (WHERE task.dueDate < CURRENT_TIMESTAMP AND task.status <> :completedStatus)',
      'overdue',
    );
    expect(result).toEqual({
      total: 12,
      byStatus: {
        pending: 4,
        inProgress: 3,
        completed: 5,
      },
      byPriority: {
        low: 2,
        medium: 7,
        high: 3,
      },
      overdue: 2,
    });
  });

  it('returns zeroed counts when the project has no tasks', async () => {
    getRawOne.mockResolvedValue({
      total: '0',
      pending: '0',
      inProgress: '0',
      completed: '0',
      low: '0',
      medium: '0',
      high: '0',
      overdue: '0',
    });

    await expect(store.summarizeByProjectId(projectId)).resolves.toEqual({
      total: 0,
      byStatus: {
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      overdue: 0,
    });
  });

  it('returns zeroed counts when the aggregate query returns no row', async () => {
    getRawOne.mockResolvedValue(undefined);

    await expect(store.summarizeByProjectId(projectId)).resolves.toEqual({
      total: 0,
      byStatus: {
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      overdue: 0,
    });
  });

  it('propagates query errors', async () => {
    const queryError = new Error('Query failed');
    getRawOne.mockRejectedValue(queryError);

    await expect(store.summarizeByProjectId(projectId)).rejects.toBe(
      queryError,
    );
  });
});
