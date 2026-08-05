import type { ProjectQueryStore } from '@project/application/ports';
import { ERROR_CATEGORIES } from '@shared/errors';
import type { IdGenerator } from '@shared/identity';
import {
  Task,
  TaskId,
  TaskPriority,
  TaskProjectId,
  type TaskSnapshot,
} from '@task/domain';
import {
  TASK_APPLICATION_ERROR_CODES,
  TASK_APPLICATION_ERROR_MESSAGES,
  TaskApplicationError,
} from '../errors';
import type { TaskCreationStore } from '../ports';

export type CreateTaskCommand = Readonly<{
  projectId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}>;

export type CreateTaskResult = Readonly<{
  task: TaskSnapshot;
}>;

export class CreateTaskUseCase {
  constructor(
    private readonly projectQueryStore: ProjectQueryStore,
    private readonly taskCreationStore: TaskCreationStore,
    private readonly taskIdGenerator: IdGenerator<string>,
  ) {}

  async execute(command: CreateTaskCommand): Promise<CreateTaskResult> {
    const projectId = TaskProjectId.create(command.projectId);
    const taskId = TaskId.create(this.taskIdGenerator.generate());
    const task = Task.create({
      id: taskId,
      projectId,
      title: command.title,
      description: command.description,
      priority: command.priority,
      dueDate: command.dueDate,
    });

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

    const storedTask = await this.taskCreationStore.save(task.toSnapshot());

    return { task: storedTask };
  }
}
