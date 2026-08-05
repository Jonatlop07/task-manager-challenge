import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import {
  Task,
  TaskId,
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
import type { TaskQueryStore, TaskUpdateStore } from '../ports';

export type UpdateTaskCommand = Readonly<{
  projectId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}>;

export type UpdateTaskResult = Readonly<{
  task: TaskSnapshot;
}>;

export class UpdateTaskUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskQueryStore: TaskQueryStore,
    private readonly taskUpdateStore: TaskUpdateStore,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<UpdateTaskResult> {
    this.assertHasChanges(command);

    const projectId = TaskProjectId.create(command.projectId);
    const taskId = TaskId.create(command.taskId);
    const project = await this.projectQueryStore.findById(projectId.value);

    if (!project) {
      throw this.projectNotFoundError();
    }

    const snapshot = await this.taskQueryStore.findById({
      projectId: projectId.value,
      taskId: taskId.value,
    });

    if (!snapshot) {
      throw this.taskNotFoundError();
    }

    const task = Task.restore(snapshot);
    task.update({
      title: command.title,
      description: command.description,
      status: command.status,
      priority: command.priority,
      dueDate: command.dueDate,
    });

    const updatedTask = await this.taskUpdateStore.update(task.toSnapshot());

    if (!updatedTask) {
      throw this.taskNotFoundError();
    }

    return { task: updatedTask };
  }

  private assertHasChanges(command: UpdateTaskCommand): void {
    if (
      command.title === undefined &&
      command.description === undefined &&
      command.status === undefined &&
      command.priority === undefined &&
      command.dueDate === undefined
    ) {
      throw new TaskApplicationError(
        TASK_APPLICATION_ERROR_CODES.TASK_UPDATE_REQUIRED,
        TASK_APPLICATION_ERROR_MESSAGES.TASK_UPDATE_REQUIRED,
        { category: ERROR_CATEGORIES.VALIDATION },
      );
    }
  }

  private projectNotFoundError(): TaskApplicationError {
    return new TaskApplicationError(
      TASK_APPLICATION_ERROR_CODES.PROJECT_NOT_FOUND,
      TASK_APPLICATION_ERROR_MESSAGES.PROJECT_NOT_FOUND,
      {
        category: ERROR_CATEGORIES.NOT_FOUND,
        retryable: false,
      },
    );
  }

  private taskNotFoundError(): TaskApplicationError {
    return new TaskApplicationError(
      TASK_APPLICATION_ERROR_CODES.TASK_NOT_FOUND,
      TASK_APPLICATION_ERROR_MESSAGES.TASK_NOT_FOUND,
      {
        category: ERROR_CATEGORIES.NOT_FOUND,
        retryable: false,
      },
    );
  }
}
