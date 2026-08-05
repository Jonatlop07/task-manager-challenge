import {
  TASK_ERROR_CODES,
  TASK_ERROR_MESSAGES,
  TaskDomainError,
} from '../errors';

export class TaskDueDate {
  private constructor(readonly value: Date | null) {}

  static create(value?: string | Date | null): TaskDueDate {
    if (value === undefined || value === null) {
      return new TaskDueDate(null);
    }

    const dueDate = new Date(value);

    if (Number.isNaN(dueDate.getTime())) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_DUE_DATE_INVALID,
        TASK_ERROR_MESSAGES.TASK_DUE_DATE_INVALID,
      );
    }

    return new TaskDueDate(dueDate);
  }

  toISOString(): string | null {
    return this.value?.toISOString() ?? null;
  }
}
