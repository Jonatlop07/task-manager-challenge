import { CreateProjectUseCase } from '@project/application';
import type { ProjectCreationStore } from '@project/application';
import { TypeOrmProjectCreationStore } from '@project/infrastructure';
import { UuidIdGenerator } from '@shared/identity';
import type { DataSource } from 'typeorm';

export type CreateApiCreateProjectUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiProjectCreationStore = (
  input: Pick<CreateApiCreateProjectUseCaseInput, 'dataSource'>,
): ProjectCreationStore => {
  return new TypeOrmProjectCreationStore(input.dataSource);
};

export const createApiCreateProjectUseCase = (
  input: CreateApiCreateProjectUseCaseInput,
): CreateProjectUseCase => {
  return new CreateProjectUseCase(
    createApiProjectCreationStore(input),
    new UuidIdGenerator(),
  );
};
