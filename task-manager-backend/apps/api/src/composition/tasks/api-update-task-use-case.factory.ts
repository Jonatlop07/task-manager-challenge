import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import { type TaskUpdateStore, UpdateTaskUseCase } from '@task/application';
import {
  TypeOrmTaskQueryStore,
  TypeOrmTaskUpdateStore,
} from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiUpdateTaskUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskUpdateStore = (
  input: Pick<CreateApiUpdateTaskUseCaseInput, 'dataSource'>,
): TaskUpdateStore => {
  return new TypeOrmTaskUpdateStore(input.dataSource);
};

export const createApiUpdateTaskUseCase = (
  input: CreateApiUpdateTaskUseCaseInput,
): UpdateTaskUseCase => {
  return new UpdateTaskUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    new TypeOrmTaskQueryStore(input.dataSource),
    createApiTaskUpdateStore(input),
  );
};
