import { Project, ProjectId, type ProjectSnapshot } from '@project/domain';
import { ERROR_CATEGORIES } from '@shared/errors';
import {
  PROJECT_APPLICATION_ERROR_CODES,
  PROJECT_APPLICATION_ERROR_MESSAGES,
  ProjectApplicationError,
} from '../errors';
import type { ProjectUpdateStore } from '../ports';

export type UpdateProjectCommand = Readonly<{
  projectId: string;
  name?: string;
  description?: string | null;
}>;

export type UpdateProjectResult = Readonly<{
  project: ProjectSnapshot;
}>;

export class UpdateProjectUseCase {
  constructor(private readonly store: ProjectUpdateStore) {}

  async execute(command: UpdateProjectCommand): Promise<UpdateProjectResult> {
    this.assertHasChanges(command);

    const projectId = ProjectId.create(command.projectId);
    const snapshot = await this.store.findById(projectId.value);

    if (!snapshot) {
      throw this.projectNotFoundError();
    }

    const project = Project.restore(snapshot);
    project.update({
      name: command.name,
      description: command.description,
    });

    const updatedProject = await this.store.update(project.toSnapshot());

    if (!updatedProject) {
      throw this.projectNotFoundError();
    }

    return { project: updatedProject };
  }

  private assertHasChanges(command: UpdateProjectCommand): void {
    if (command.name === undefined && command.description === undefined) {
      throw new ProjectApplicationError(
        PROJECT_APPLICATION_ERROR_CODES.PROJECT_UPDATE_REQUIRED,
        PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_UPDATE_REQUIRED,
        { category: ERROR_CATEGORIES.VALIDATION },
      );
    }
  }

  private projectNotFoundError(): ProjectApplicationError {
    return new ProjectApplicationError(
      PROJECT_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      PROJECT_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      {
        category: ERROR_CATEGORIES.NOT_FOUND,
        retryable: false,
      },
    );
  }
}
