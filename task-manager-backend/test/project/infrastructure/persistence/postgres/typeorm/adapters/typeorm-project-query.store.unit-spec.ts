import type { ProjectSnapshot } from '@project/domain';
import { TypeOrmProjectQueryStore } from '@project/infrastructure/persistence/postgres/typeorm/adapters';
import { ProjectOrmEntity } from '@project/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmProjectQueryStore', () => {
  const project: ProjectSnapshot = {
    id: 'project-123',
    name: 'Project Atlas',
    description: 'Internal planning',
  };

  let findOneBy: jest.MockedFunction<Repository<ProjectOrmEntity>['findOneBy']>;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmProjectQueryStore;

  beforeEach(() => {
    findOneBy = jest.fn();
    getRepository = jest.fn().mockReturnValue({ findOneBy });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmProjectQueryStore(dataSource);
  });

  it('returns a project snapshot when the project exists', async () => {
    findOneBy.mockResolvedValue(createProjectEntity(project));

    const result = await store.findById(project.id);

    expect(getRepository).toHaveBeenCalledWith(ProjectOrmEntity);
    expect(findOneBy).toHaveBeenCalledWith({ id: project.id });
    expect(result).toEqual(project);
  });

  it('preserves a null description in the snapshot', async () => {
    const projectWithoutDescription = { ...project, description: null };
    findOneBy.mockResolvedValue(createProjectEntity(projectWithoutDescription));

    await expect(store.findById(project.id)).resolves.toEqual(
      projectWithoutDescription,
    );
  });

  it('returns null when the project does not exist', async () => {
    findOneBy.mockResolvedValue(null);

    await expect(store.findById('missing-project')).resolves.toBeNull();
  });

  it('propagates repository errors', async () => {
    const repositoryError = new Error('Query failed');
    findOneBy.mockRejectedValue(repositoryError);

    await expect(store.findById(project.id)).rejects.toBe(repositoryError);
  });

  function createProjectEntity(snapshot: ProjectSnapshot): ProjectOrmEntity {
    return Object.assign(new ProjectOrmEntity(), {
      ...snapshot,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      updatedAt: new Date('2026-08-05T00:00:00.000Z'),
    });
  }
});
