import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import { TaskId, TaskProjectId, type TaskSnapshot } from '@task/domain';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '../errors';
import type { TaskQueryStore } from '../ports';

export type GetTaskCommand = Readonly<{
  projectId: string;
  taskId: string;
}>;

export type GetTaskResult = Readonly<{
  task: TaskSnapshot;
}>;

export class GetTaskUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskQueryStore: TaskQueryStore,
  ) {}

  async execute(command: GetTaskCommand): Promise<GetTaskResult> {
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

    const task = await this.taskQueryStore.findById({
      projectId: projectId.value,
      taskId: taskId.value,
    });

    if (!task) {
      throw new TaskApplicationError(
        TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
        TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
        {
          category: ERROR_CATEGORIES.NOT_FOUND,
          retryable: false,
        },
      );
    }

    return { task };
  }
}
