import { ProjectSnapshot } from '@project/domain';

const PROJECT_CREATION_STORE_RESULT_STATUSES = {
  CREATED: 'created',
  REPLAYED: 'replayed',
  IDEMPOTENCY_CONFLICT: 'idempotency-conflict',
} as const;

export type SaveProjectInput = Readonly<{
  idempotencyKey: string;
  project: ProjectSnapshot;
}>;

export type ProjectCreationResult = Readonly<{
  status: (typeof PROJECT_CREATION_STORE_RESULT_STATUSES)[keyof typeof PROJECT_CREATION_STORE_RESULT_STATUSES];
}>;

export interface ProjectCreationStore {
  save(input: SaveProjectInput): Promise<ProjectCreationResult>;
}
