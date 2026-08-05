import {
  DeleteProjectUseCase,
  type ProjectDeletionStore,
} from '@project/application';
import { TypeOrmProjectDeletionStore } from '@project/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiDeleteProjectUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiProjectDeletionStore = (
  input: Pick<CreateApiDeleteProjectUseCaseInput, 'dataSource'>,
): ProjectDeletionStore => {
  return new TypeOrmProjectDeletionStore(input.dataSource);
};

export const createApiDeleteProjectUseCase = (
  input: CreateApiDeleteProjectUseCaseInput,
): DeleteProjectUseCase => {
  return new DeleteProjectUseCase(createApiProjectDeletionStore(input));
};
