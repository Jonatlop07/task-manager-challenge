import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import { UuidIdGenerator } from '@shared/identity';
import { CreateTaskUseCase, type TaskCreationStore } from '@task/application';
import { TypeOrmTaskCreationStore } from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiCreateTaskUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskCreationStore = (
  input: Pick<CreateApiCreateTaskUseCaseInput, 'dataSource'>,
): TaskCreationStore => {
  return new TypeOrmTaskCreationStore(input.dataSource);
};

export const createApiCreateTaskUseCase = (
  input: CreateApiCreateTaskUseCaseInput,
): CreateTaskUseCase => {
  return new CreateTaskUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiTaskCreationStore(input),
    new UuidIdGenerator(),
  );
};
