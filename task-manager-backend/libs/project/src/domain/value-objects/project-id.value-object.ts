import {
  PROJECT_ERROR_CODES,
  PROJECT_ERROR_MESSAGES,
  ProjectDomainError,
} from '../errors';

const PROJECT_ID_MAX_LENGTH = 64;

export class ProjectId {
  private constructor(readonly value: string) {}

  static create(value: string): ProjectId {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new ProjectDomainError(
        PROJECT_ERROR_CODES.PROJECT_ID_REQUIRED,
        PROJECT_ERROR_MESSAGES.PROJECT_ID_REQUIRED,
      );
    }

    if (normalizedValue.length > PROJECT_ID_MAX_LENGTH) {
      throw new ProjectDomainError(
        PROJECT_ERROR_CODES.PROJECT_ID_INVALID_LENGTH,
        `Project id cannot exceed ${PROJECT_ID_MAX_LENGTH} characters`,
      );
    }

    return new ProjectId(normalizedValue);
  }

  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
