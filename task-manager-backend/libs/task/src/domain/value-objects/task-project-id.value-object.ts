import {
  TASK_ERROR_CODES,
  TASK_ERROR_MESSAGES,
  TaskDomainError,
} from '../errors';

const PROJECT_ID_MAX_LENGTH = 64;

export class TaskProjectId {
  private constructor(readonly value: string) {}

  static create(value: string): TaskProjectId {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.PROJECT_ID_REQUIRED,
        TASK_ERROR_MESSAGES.PROJECT_ID_REQUIRED,
      );
    }

    if (normalizedValue.length > PROJECT_ID_MAX_LENGTH) {
      throw new TaskDomainError(
        TASK_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
        `Project id cannot exceed ${PROJECT_ID_MAX_LENGTH} characters`,
      );
    }

    return new TaskProjectId(normalizedValue);
  }
}
