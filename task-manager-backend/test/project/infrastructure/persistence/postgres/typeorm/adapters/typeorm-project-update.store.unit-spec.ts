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

  let updateProject: jest.MockedFunction<
    Repository<ProjectOrmEntity>['update']
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmProjectUpdateStore;

  beforeEach(() => {
    updateProject = jest.fn();

    const projectRepository = {
      update: updateProject,
    };

    getRepository = jest.fn().mockReturnValue(projectRepository);

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmProjectUpdateStore(dataSource);
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
});
