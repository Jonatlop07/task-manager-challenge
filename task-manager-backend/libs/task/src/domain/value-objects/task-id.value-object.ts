import {
  TASK_ERROR_CODES,
  TASK_ERROR_MESSAGES,
  TaskDomainError,
} from '../errors';

const TASK_ID_MAX_LENGTH = 64;

export class TaskId {
  private constructor(readonly value: string) {}

  static create(value: string): TaskId {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_ID_REQUIRED,
        TASK_ERROR_MESSAGES.TASK_ID_REQUIRED,
      );
    }

    if (normalizedValue.length > TASK_ID_MAX_LENGTH) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.TASK_ID_INVALID_LENGTH,
        `Task id cannot exceed ${TASK_ID_MAX_LENGTH} characters`,
      );
    }

    return new TaskId(normalizedValue);
  }
}
