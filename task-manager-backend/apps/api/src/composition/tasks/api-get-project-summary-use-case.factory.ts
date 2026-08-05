import { TypeOrmProjectQueryStore } from '@project/infrastructure';
import {
  GetProjectSummaryUseCase,
  type TaskSummaryQueryStore,
} from '@task/application';
import { TypeOrmTaskSummaryQueryStore } from '@task/infrastructure';
import type { DataSource } from 'typeorm';

export type CreateApiGetProjectSummaryUseCaseInput = Readonly<{
  dataSource: DataSource;
}>;

export const createApiTaskSummaryQueryStore = (
  input: Pick<CreateApiGetProjectSummaryUseCaseInput, 'dataSource'>,
): TaskSummaryQueryStore => {
  return new TypeOrmTaskSummaryQueryStore(input.dataSource);
};

export const createApiGetProjectSummaryUseCase = (
  input: CreateApiGetProjectSummaryUseCaseInput,
): GetProjectSummaryUseCase => {
  return new GetProjectSummaryUseCase(
    new TypeOrmProjectQueryStore(input.dataSource),
    createApiTaskSummaryQueryStore(input),
  );
};
