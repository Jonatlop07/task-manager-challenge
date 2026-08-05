import {
  GetProjectUseCase,
  type ProjectQueryStore,
} from '@project/application';
import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiGetProjectUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiProjectQueryStore = (
  input: Pick<CreateApiGetProjectUseCaseInput, 'dataSource'>,
): ProjectQueryStore => {
  return new TypeOrmProjectQueryStore(input.dataSource);
};

export const createApiGetProjectUseCase = (
  input: CreateApiGetProjectUseCaseInput,
): GetProjectUseCase => {
  return new GetProjectUseCase(createApiProjectQueryStore(input));
};
