import { TypeOrmProjectDeletionStore } from '@project/infrastructure/persistence/postgres/typeorm/adapters';
import { ProjectOrmEntity } from '@project/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmProjectDeletionStore', () => {
  const projectId = 'project-123';

  let deleteProject: jest.MockedFunction<
    Repository<ProjectOrmEntity>['delete']
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmProjectDeletionStore;

  beforeEach(() => {
    deleteProject = jest.fn();
    getRepository = jest.fn().mockReturnValue({ delete: deleteProject });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmProjectDeletionStore(dataSource);
  });

  it('deletes the project and returns true when one row is affected', async () => {
    deleteProject.mockResolvedValue({ affected: 1, raw: [] });

    const result = await store.delete(projectId);

    expect(getRepository).toHaveBeenCalledWith(ProjectOrmEntity);
    expect(deleteProject).toHaveBeenCalledWith({ id: projectId });
    expect(result).toBe(true);
  });

  it.each([0, undefined])(
    'returns false when affected is %s',
    async (affected) => {
      deleteProject.mockResolvedValue({ affected, raw: [] });

      await expect(store.delete(projectId)).resolves.toBe(false);
    },
  );

  it('propagates repository errors', async () => {
    const repositoryError = new Error('Delete failed');
    deleteProject.mockRejectedValue(repositoryError);

    await expect(store.delete(projectId)).rejects.toBe(repositoryError);
  });
});
