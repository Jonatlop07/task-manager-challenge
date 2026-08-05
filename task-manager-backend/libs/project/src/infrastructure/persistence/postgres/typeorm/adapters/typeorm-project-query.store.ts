import type { ProjectQueryStore } from '@project/application';
import type { ProjectSnapshot } from '@project/domain';
import { DataSource } from 'typeorm';
import { ProjectOrmEntity } from '../entities';

export class TypeOrmProjectQueryStore implements ProjectQueryStore {
  constructor(private readonly dataSource: DataSource) {}

  async findById(projectId: string): Promise<ProjectSnapshot | null> {
    const project = await this.projectRepository.findOneBy({ id: projectId });

    return project ? this.toSnapshot(project) : null;
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
