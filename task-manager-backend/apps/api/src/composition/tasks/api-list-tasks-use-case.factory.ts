import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import { ListTasksUseCase, type TaskListQueryStore } from '@task/application';
import { TypeOrmTaskQueryStore } from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiListTasksUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskListQueryStore = (
  input: Pick<CreateApiListTasksUseCaseInput, 'dataSource'>,
): TaskListQueryStore => {
  return new TypeOrmTaskQueryStore(input.dataSource);
};

export const createApiListTasksUseCase = (
  input: CreateApiListTasksUseCaseInput,
): ListTasksUseCase => {
  return new ListTasksUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiTaskListQueryStore(input),
  );
};
