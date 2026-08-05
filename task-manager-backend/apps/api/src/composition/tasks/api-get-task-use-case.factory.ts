import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import { GetTaskUseCase, type TaskQueryStore } from '@task/application';
import { TypeOrmTaskQueryStore } from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiGetTaskUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskQueryStore = (
  input: Pick<CreateApiGetTaskUseCaseInput, 'dataSource'>,
): TaskQueryStore => {
  return new TypeOrmTaskQueryStore(input.dataSource);
};

export const createApiGetTaskUseCase = (
  input: CreateApiGetTaskUseCaseInput,
): GetTaskUseCase => {
  return new GetTaskUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiTaskQueryStore(input),
  );
};
