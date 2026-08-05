import type { ProjectUpdateStore } from '@project/application';
import type { ProjectSnapshot } from '@project/domain';
import { DataSource } from 'typeorm';
import { ProjectOrmEntity } from '../entities';

export class TypeOrmProjectUpdateStore implements ProjectUpdateStore {
  constructor(private readonly dataSource: DataSource) {}

  async update(project: ProjectSnapshot): Promise<ProjectSnapshot | null> {
    const result = await this.projectRepository.update(
      { id: project.id },
      {
        name: project.name,
        description: project.description,
      },
    );

    return result.affected === 1 ? project : null;
  }

  private get projectRepository() {
    return this.dataSource.getRepository(ProjectOrmEntity);
  }
}
