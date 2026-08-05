import type { ProjectDeletionStore } from '@project/application';
import { DataSource } from 'typeorm';
import { ProjectOrmEntity } from '../entities';

export class TypeOrmProjectDeletionStore implements ProjectDeletionStore {
  constructor(private readonly dataSource: DataSource) {}

  async delete(projectId: string): Promise<boolean> {
    const result = await this.projectRepository.delete({ id: projectId });

    return result.affected === 1;
  }

  private get projectRepository() {
    return this.dataSource.getRepository(ProjectOrmEntity);
  }
}
