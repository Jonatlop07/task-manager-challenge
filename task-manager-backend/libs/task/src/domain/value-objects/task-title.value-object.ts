import {
  TASK_ERROR_CODES,
  TASK_ERROR_MESSAGES,
  TaskDomainError,
} from '../errors';

const TASK_TITLE_MAX_LENGTH = 150;

export class TaskTitle {
  private constructor(readonly value: string) {}

  static create(value: string): TaskTitle {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_TITLE_REQUIRED,
        TASK_ERROR_MESSAGES.TASK_TITLE_REQUIRED,
      );
    }

    if (normalizedValue.length > TASK_TITLE_MAX_LENGTH) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_TITLE_INVALID_LENGTH,
        `Task title cannot exceed ${TASK_TITLE_MAX_LENGTH} characters`,
      );
    }

    return new TaskTitle(normalizedValue);
  }
}
