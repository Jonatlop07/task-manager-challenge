import type { ProjectSnapshot } from '@project/domain';

export interface ProjectListQueryStore {
  findAll(): Promise<readonly ProjectSnapshot[]>;
}
