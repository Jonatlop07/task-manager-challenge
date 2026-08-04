import { randomUUID } from 'node:crypto';

export interface IdGenerator<TId = string> {
  generate(): TId;
}

export class UuidIdGenerator implements IdGenerator<string> {
  generate(): string {
    return randomUUID();
  }
}
