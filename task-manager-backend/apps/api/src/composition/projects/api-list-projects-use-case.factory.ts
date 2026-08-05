import {
  ListProjectsUseCase,
  type ProjectListQueryStore,
} from '@project/application';
import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiListProjectsUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiProjectListQueryStore = (
  input: Pick<CreateApiListProjectsUseCaseInput, 'dataSource'>,
): ProjectListQueryStore => {
  return new TypeOrmProjectQueryStore(input.dataSource);
};

export const createApiListProjectsUseCase = (
  input: CreateApiListProjectsUseCaseInput,
): ListProjectsUseCase => {
  return new ListProjectsUseCase(createApiProjectListQueryStore(input));
};
