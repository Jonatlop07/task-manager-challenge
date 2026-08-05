import {
  PROJECT_CREATION_STORE_RESULT_STATUSES,
  ProjectCreationReplayLookup,
  ProjectCreationStore,
} from '@project/application';
import type {
  SaveProjectInput,
  ProjectCreationResult,
  ProjectCreationReplayLookupInput,
  ProjectCreationReplayLookupResult,
} from '@project/application';
import { DataSource } from 'typeorm';
import { ProjectIdempotencyRecordOrmEntity, ProjectOrmEntity } from '../entities';
import type { ProjectSnapshot } from '@project/domain';

const PROJECT_CREATION_OPERATION = 'project.create';

export class TypeOrmProjectCreationStore
  implements ProjectCreationStore, ProjectCreationReplayLookup {

  constructor(private readonly dataSource: DataSource) {}

  async save(input: SaveProjectInput): Promise<ProjectCreationResult> {
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [input.idempotencyKey],
      );

      const idempotencyRecordRepository = entityManager.getRepository(
        ProjectIdempotencyRecordOrmEntity,
      );
      const existingRecord = await idempotencyRecordRepository.findOneBy({
        idempotencyKey: input.idempotencyKey,
      });
      if (existingRecord) {
        return this.resolveExistingRecord(existingRecord, input.project);
      }

      const projectRepository = entityManager.getRepository(ProjectOrmEntity);
      await projectRepository.insert({
        id: input.project.id,
        name: input.project.name,
        description: input.project.description,
      });

      await idempotencyRecordRepository.insert({
        idempotencyKey: input.idempotencyKey,
        operation: PROJECT_CREATION_OPERATION,
        aggregateId: input.project.id,
        response: input.project,
      });

      return {
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.CREATED,
        project: input.project,
      };
    });
  };

  async findByIdempotencyKey(
    input: ProjectCreationReplayLookupInput,
  ): Promise<ProjectCreationReplayLookupResult> {
    const record = await this.dataSource
      .getRepository(ProjectIdempotencyRecordOrmEntity)
      .findOneBy({ idempotencyKey: input.idempotencyKey });

    if (record?.operation !== PROJECT_CREATION_OPERATION) {
      return {
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      };
    }

    return {
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED,
      project: record.response,
    };
  }

  private resolveExistingRecord(
    record: ProjectIdempotencyRecordOrmEntity,
    requestedProject: ProjectSnapshot,
  ): ProjectCreationResult {
    if (!this.isSameCreationRequest(record, requestedProject)) {
      return {
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      };
    }

    return {
      status: PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED,
      project: record.response,
    };
  }

  private isSameCreationRequest(
    record: ProjectIdempotencyRecordOrmEntity,
    requestedProject: ProjectSnapshot,
  ): boolean {
    return (
      record.operation === PROJECT_CREATION_OPERATION &&
      record.response.name === requestedProject.name &&
      record.response.description === requestedProject.description
    );
  }
}
