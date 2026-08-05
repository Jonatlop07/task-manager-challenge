export class TaskDescription {
  private constructor(readonly value: string | null) {}

  static create(value?: string | null): TaskDescription {
    const normalizedValue = value?.trim();

    return new TaskDescription(normalizedValue || null);
  }
}
