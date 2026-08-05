import { ProjectId } from '@project/domain';
import { ERROR_CATEGORIES } from '@shared/errors';
import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '../errors';
import type { ProjectDeletionStore } from '../ports';

export type DeleteProjectCommand = Readonly<{
  projectId: string;
}>;

export class DeleteProjectUseCase {
  constructor(private readonly store: ProjectDeletionStore) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    const projectId = ProjectId.create(command.projectId);
    const deleted = await this.store.delete(projectId.value);

    if (!deleted) {
      throw new ProjectApplicationError(
        PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
        PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }
  }
}
