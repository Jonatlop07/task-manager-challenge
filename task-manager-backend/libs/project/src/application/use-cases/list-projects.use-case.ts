import type { ProjectSnapshot } from '@project/domain';
import type { ProjectListQueryStore } from '../ports';

export type ListProjectsResult = Readonly<{
  projects: readonly ProjectSnapshot[];
}>;

export class ListProjectsUseCase {
  constructor(private readonly store: ProjectListQueryStore) {}

  async execute(): Promise<ListProjectsResult> {
    const projects = await this.store.findAll();

    return { projects };
  }
}
