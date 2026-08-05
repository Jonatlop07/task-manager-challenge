import type { ProjectSnapshot } from '@project/domain';

export interface ProjectUpdateStore {
  findById(projectId: string): Promise<ProjectSnapshot | null>;
  update(project: ProjectSnapshot): Promise<ProjectSnapshot | null>;
}
