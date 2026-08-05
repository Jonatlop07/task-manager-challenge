import type { ProjectUpdateStore } from '@project/application';
import type { ProjectSnapshot } from '@project/domain';
import { DataSource } from 'typeorm';
import { ProjectOrmEntity } from '../entities';

export class TypeOrmProjectUpdateStore implements ProjectUpdateStore {
  constructor(private readonly dataSource: DataSource) {}

  async findById(projectId: string): Promise<ProjectSnapshot | null> {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    return project ? this.toSnapshot(project) : null;
  }

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

  private toSnapshot(project: ProjectOrmEntity): ProjectSnapshot {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
    };
  }
}
