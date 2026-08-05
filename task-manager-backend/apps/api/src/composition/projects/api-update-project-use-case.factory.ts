import {
  UpdateProjectUseCase,
  type ProjectUpdateStore,
} from '@project/application';
import {
  TypeOrmProjectQueryStore,
  TypeOrmProjectUpdateStore,
} from '@project/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiUpdateProjectUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiProjectUpdateStore = (
  input: Pick<CreateApiUpdateProjectUseCaseInput, 'dataSource'>,
): ProjectUpdateStore => {
  return new TypeOrmProjectUpdateStore(input.dataSource);
};

export const createApiUpdateProjectUseCase = (
  input: CreateApiUpdateProjectUseCaseInput,
): UpdateProjectUseCase => {
  return new UpdateProjectUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiProjectUpdateStore(input),
  );
};
