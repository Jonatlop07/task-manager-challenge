import type { ProjectSnapshot } from '@project/domain';

export const PROJECT_CREATION_STORE_RESULT_STATUSES = {
  CREATED: 'created',
  REPLAYED: 'replayed',
  IDEMPOTENCY_CONFLICT: 'idempotency-conflict',
} as const;

export type SaveProjectInput = Readonly<{
  idempotencyKey: string;
  project: ProjectSnapshot;
}>;

export type ProjectCreationResult = Readonly<
  | {
      status: typeof PROJECT_CREATION_STORE_RESULT_STATUSES.CREATED;
      project: ProjectSnapshot;
    }
  | {
      status: typeof PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED;
      project: ProjectSnapshot;
    }
  | {
      status: typeof PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT;
    }
  >;

export interface ProjectCreationStore {
  save(input: SaveProjectInput): Promise<ProjectCreationResult>;
}
