import { ProjectId, type ProjectSnapshot } from '@project/domain';
import { ERROR_CATEGORIES } from '@shared/errors';
import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '../errors';
import type { ProjectQueryStore } from '../ports';

export type GetProjectQuery = Readonly<{
  projectId: string;
}>;

export type GetProjectResult = Readonly<{
  project: ProjectSnapshot;
}>;

export class GetProjectUseCase {
  constructor(private readonly store: ProjectQueryStore) {}

  async execute(query: GetProjectQuery): Promise<GetProjectResult> {
    const projectId = ProjectId.create(query.projectId);
    const project = await this.store.findById(projectId.value);

    if (!project) {
      throw new ProjectApplicationError(
        PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
        PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }

    return { project };
  }
}
