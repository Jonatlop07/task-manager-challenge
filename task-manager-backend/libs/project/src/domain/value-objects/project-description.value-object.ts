export class ProjectDescription {
  private constructor(readonly value: string | null) {}

  static create(value?: string | null): ProjectDescription {
    const normalizedValue = value?.trim();

    return new ProjectDescription(normalizedValue || null);
  }

  equals(other: ProjectDescription): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? '';
  }
}
