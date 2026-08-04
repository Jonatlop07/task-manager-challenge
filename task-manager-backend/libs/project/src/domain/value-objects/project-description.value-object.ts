export class ProjectDescription {
  private constructor(public readonly value: string | null) {}

  public static create(
    value?: string | null,
  ): ProjectDescription {
    const normalizedValue = value?.trim();

    return new ProjectDescription(normalizedValue || null);
  }

  public equals(other: ProjectDescription): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value ?? '';
  }
}
