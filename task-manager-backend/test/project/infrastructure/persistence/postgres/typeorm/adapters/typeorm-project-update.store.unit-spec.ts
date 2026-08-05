import type { ProjectSnapshot } from '@project/domain';
import { TypeOrmProjectUpdateStore } from '@project/infrastructure/persistence/postgres/typeorm/adapters';
import { ProjectOrmEntity } from '@project/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmProjectUpdateStore', () => {
  const project: ProjectSnapshot = {
    id: 'project-123',
    name: 'Project Atlas',
    description: 'Internal planning',
  };

  let findOneBy: jest.MockedFunction<Repository<ProjectOrmEntity>['findOneBy']>;
  let updateProject: jest.MockedFunction<
    Repository<ProjectOrmEntity>['update']
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmProjectUpdateStore;

  beforeEach(() => {
    findOneBy = jest.fn();
    updateProject = jest.fn();

    const projectRepository = {
      findOneBy,
      update: updateProject,
    };

    getRepository = jest.fn().mockReturnValue(projectRepository);

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmProjectUpdateStore(dataSource);
  });

  describe('findById', () => {
    it('returns a project snapshot when the project exists', async () => {
      findOneBy.mockResolvedValue(createProjectEntity(project));

      const result = await store.findById(project.id);

      expect(getRepository).toHaveBeenCalledWith(ProjectOrmEntity);
      expect(findOneBy).toHaveBeenCalledWith({ id: project.id });
      expect(result).toEqual(project);
    });

    it('returns null when the project does not exist', async () => {
      findOneBy.mockResolvedValue(null);

      await expect(store.findById('missing-project')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates the mutable fields and returns the snapshot', async () => {
      updateProject.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: [],
      });

      const result = await store.update(project);

      expect(getRepository).toHaveBeenCalledWith(ProjectOrmEntity);
      expect(updateProject).toHaveBeenCalledWith(
        { id: project.id },
        {
          name: project.name,
          description: project.description,
        },
      );
      expect(result).toEqual(project);
    });

    it('supports clearing the description', async () => {
      const projectWithoutDescription = {
        ...project,
        description: null,
      };
      updateProject.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: [],
      });

      await store.update(projectWithoutDescription);

      expect(updateProject).toHaveBeenCalledWith(
        { id: project.id },
        {
          name: project.name,
          description: null,
        },
      );
    });

    it.each([0, undefined])(
      'returns null when affected is %s',
      async (affected) => {
        updateProject.mockResolvedValue({
          affected,
          generatedMaps: [],
          raw: [],
        });

        await expect(store.update(project)).resolves.toBeNull();
      },
    );
  });

  function createProjectEntity(snapshot: ProjectSnapshot): ProjectOrmEntity {
    return Object.assign(new ProjectOrmEntity(), {
      ...snapshot,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      updatedAt: new Date('2026-08-05T00:00:00.000Z'),
    });
  }
});
