import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import { TaskId, TaskProjectId } from '@task/domain';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '../errors';
import type { TaskDeletionStore } from '../ports';

export type DeleteTaskCommand = Readonly<{
  projectId: string;
  taskId: string;
}>;

export class DeleteTaskUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskDeletionStore: TaskDeletionStore,
  ) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
    const projectId = TaskProjectId.create(command.projectId);
    const taskId = TaskId.create(command.taskId);
    const project = await this.projectQueryStore.findById(projectId.value);

    if (!project) {
      throw new TaskApplicationError(
        TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
        TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }

    const deleted = await this.taskDeletionStore.delete({
      projectId: projectId.value,
      taskId: taskId.value,
    });

    if (!deleted) {
      throw new TaskApplicationError(
        TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
        TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }
  }
}
