import type { ProjectSnapshot } from '@project/domain';

export interface ProjectUpdateStore {
  update(project: ProjectSnapshot): Promise<ProjectSnapshot | null>;
}
