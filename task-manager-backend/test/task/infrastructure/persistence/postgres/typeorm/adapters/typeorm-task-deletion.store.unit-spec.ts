import { TypeOrmTaskDeletionStore } from '@task/infrastructure/persistence/postgres/typeorm/adapters';
import { TaskOrmEntity } from '@task/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmTaskDeletionStore', () => {
  const input = {
    projectId: 'project-123',
    taskId: 'task-123',
  };

  let deleteTask: jest.MockedFunction<Repository<TaskOrmEntity>['delete']>;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmTaskDeletionStore;

  beforeEach(() => {
    deleteTask = jest.fn();
    getRepository = jest.fn().mockReturnValue({ delete: deleteTask });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmTaskDeletionStore(dataSource);
  });

  it('deletes the task scoped to its project and returns true', async () => {
    deleteTask.mockResolvedValue({ affected: 1, raw: [] });

    const result = await store.delete(input);

    expect(getRepository).toHaveBeenCalledWith(TaskOrmEntity);
    expect(deleteTask).toHaveBeenCalledWith({
      id: input.taskId,
      projectId: input.projectId,
    });
    expect(result).toBe(true);
  });

  it.each([0, undefined])(
    'returns false when affected is %s',
    async (affected) => {
      deleteTask.mockResolvedValue({ affected, raw: [] });

      await expect(store.delete(input)).resolves.toBe(false);
    },
  );

  it('propagates repository errors', async () => {
    const repositoryError = new Error('Delete failed');
    deleteTask.mockRejectedValue(repositoryError);

    await expect(store.delete(input)).rejects.toBe(repositoryError);
  });
});
