import { PROJECT_ERROR_CODES, ProjectDomainError } from "../errors";

const PROJECT_NAME_MAX_LENGTH = 256;

export class ProjectName {
  private constructor(public readonly value: string) {}

  public static create(value: string): ProjectName {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new ProjectDomainError(PROJECT_ERROR_CODES.PROJECT_NAME_REQUIRED, PROJECT_ERROR_CODES.PROJECT_NAME_INVALID_LENGTH);
    }

    if (normalizedValue.length > PROJECT_NAME_MAX_LENGTH) {
      throw new ProjectDomainError(
        PROJECT_ERROR_CODES.PROJECT_NAME_INVALID_LENGTH,
        `Project name cannot exceed ${PROJECT_NAME_MAX_LENGTH} characters`,
      );
    }

    return new ProjectName(normalizedValue);
  }

  public equals(other: ProjectName): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
