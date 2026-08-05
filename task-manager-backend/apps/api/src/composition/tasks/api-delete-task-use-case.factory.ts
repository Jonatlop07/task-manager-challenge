import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import { DeleteTaskUseCase, type TaskDeletionStore } from '@task/application';
import { TypeOrmTaskDeletionStore } from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiDeleteTaskUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskDeletionStore = (
  input: Pick<CreateApiDeleteTaskUseCaseInput, 'dataSource'>,
): TaskDeletionStore => {
  return new TypeOrmTaskDeletionStore(input.dataSource);
};

export const createApiDeleteTaskUseCase = (
  input: CreateApiDeleteTaskUseCaseInput,
): DeleteTaskUseCase => {
  return new DeleteTaskUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiTaskDeletionStore(input),
  );
};
