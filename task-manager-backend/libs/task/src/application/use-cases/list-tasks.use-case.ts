import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import {
  TaskPriority,
  TaskProjectId,
  TaskStatus,
  type TaskSnapshot,
} from '@task/domain';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '../errors';
import type { TaskListQueryStore } from '../ports';

export type ListTasksCommand = Readonly<{
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}>;

export type ListTasksResult = Readonly<{
  tasks: readonly TaskSnapshot[];
}>;

export class ListTasksUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskListQueryStore: TaskListQueryStore,
  ) {}

  async execute(command: ListTasksCommand): Promise<ListTasksResult> {
    const projectId = TaskProjectId.create(command.projectId);
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

    const normalizedSearch = command.search?.trim() || undefined;
    const tasks = await this.taskListQueryStore.findByProjectId({
      projectId: projectId.value,
      status: command.status,
      priority: command.priority,
      search: normalizedSearch,
    });

    return { tasks };
  }
}
