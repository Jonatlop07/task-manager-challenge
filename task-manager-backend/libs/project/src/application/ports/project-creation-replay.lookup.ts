import { ProjectSnapshot } from '@project/domain';
import { PROJECT_CREATION_STORE_RESULT_STATUSES } from './project-creation.store';

export type ProjectCreationReplayLookupInput = Readonly<{
  idempotencyKey: string;
}>;

export type ProjectCreationReplayLookupResult =
  | Readonly<{
      status: typeof PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED;
      project: ProjectSnapshot;
    }>
  | Readonly<{
      status: typeof PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT;
    }>;

export interface ProjectCreationReplayLookup {
  findByIdempotencyKey(
    input: ProjectCreationReplayLookupInput,
  ): Promise<ProjectCreationReplayLookupResult>;
}
