import type { ProjectSnapshot } from '@project/domain';

export interface ProjectQueryStore {
  findById(projectId: string): Promise<ProjectSnapshot | null>;
}
