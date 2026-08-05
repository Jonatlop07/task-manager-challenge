import { TaskPriority, TaskStatus } from '../enums';
import {
  TASK_ERROR_CODES,
  TASK_ERROR_MESSAGES,
  TaskDomainError,
} from '../errors';
import {
  TaskDescription,
  TaskDueDate,
  TaskId,
  TaskProjectId,
  TaskTitle,
} from '../value-objects';

interface TaskProperties {
  id: TaskId;
  projectId: TaskProjectId;
  title: TaskTitle;
  description: TaskDescription;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: TaskDueDate;
}

interface CreateTaskProperties {
  id: TaskId;
  projectId: TaskProjectId;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
}

interface UpdateTaskProperties {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
}

export type TaskSnapshot = Readonly<{
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
}>;

export class Task {
  private constructor(private readonly properties: TaskProperties) {}

  static create(properties: CreateTaskProperties): Task {
    const priority = properties.priority ?? TaskPriority.Medium;
    this.assertPriority(priority);

    return new Task({
      id: properties.id,
      projectId: properties.projectId,
      title: TaskTitle.create(properties.title),
      description: TaskDescription.create(properties.description),
      status: TaskStatus.Pending,
      priority,
      dueDate: TaskDueDate.create(properties.dueDate),
    });
  }

  static restore(snapshot: TaskSnapshot): Task {
    this.assertStatus(snapshot.status);
    this.assertPriority(snapshot.priority);

    return new Task({
      id: TaskId.create(snapshot.id),
      projectId: TaskProjectId.create(snapshot.projectId),
      title: TaskTitle.create(snapshot.title),
      description: TaskDescription.create(snapshot.description),
      status: snapshot.status,
      priority: snapshot.priority,
      dueDate: TaskDueDate.create(snapshot.dueDate),
    });
  }

  update(properties: UpdateTaskProperties): void {
    if (properties.title !== undefined) {
      this.properties.title = TaskTitle.create(properties.title);
    }

    if (properties.description !== undefined) {
      this.properties.description = TaskDescription.create(
        properties.description,
      );
    }

    if (properties.status !== undefined) {
      Task.assertStatus(properties.status);
      this.properties.status = properties.status;
    }

    if (properties.priority !== undefined) {
      Task.assertPriority(properties.priority);
      this.properties.priority = properties.priority;
    }

    if (properties.dueDate !== undefined) {
      this.properties.dueDate = TaskDueDate.create(properties.dueDate);
    }
  }

  toSnapshot(): TaskSnapshot {
    return {
      id: this.properties.id.value,
      projectId: this.properties.projectId.value,
      title: this.properties.title.value,
      description: this.properties.description.value,
      status: this.properties.status,
      priority: this.properties.priority,
      dueDate: this.properties.dueDate.toISOString(),
    };
  }

  private static assertStatus(status: TaskStatus): void {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_STATUS_INVALID,
        TASK_ERROR_MESSAGES.TASK_STATUS_INVALID,
      );
    }
  }

  private static assertPriority(priority: TaskPriority): void {
    if (!Object.values(TaskPriority).includes(priority)) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_PRIORITY_INVALID,
        TASK_ERROR_MESSAGES.TASK_PRIORITY_INVALID,
      );
    }
  }
}
