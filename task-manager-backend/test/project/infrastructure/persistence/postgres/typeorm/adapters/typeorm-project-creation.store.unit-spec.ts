import { PROJECT_CREATION_STORE_RESULT_STATUSES } from '@project/application';
import type { ProjectCreationResult } from '@project/application';
import type { ProjectSnapshot } from '@project/domain';
import { TypeOrmProjectCreationStore } from '@project/infrastructure/persistence/postgres/typeorm/adapters';
import {
  ProjectIdempotencyRecordOrmEntity,
  ProjectOrmEntity,
} from '@project/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, EntityManager } from 'typeorm';

const PROJECT_CREATION_OPERATION = 'project.create';
const ADVISORY_LOCK_QUERY =
  'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))';

type TransactionCallback = (
  entityManager: EntityManager,
) => Promise<ProjectCreationResult>;

describe('TypeOrmProjectCreationStore', () => {
  const idempotencyKey = 'create-project-atlas';
  const project: ProjectSnapshot = {
    id: 'project-123',
    name: 'Project Atlas',
    description: 'Internal planning',
  };

  let transaction: jest.MockedFunction<
    (callback: TransactionCallback) => Promise<ProjectCreationResult>
  >;
  let query: jest.MockedFunction<
    (statement: string, parameters: unknown[]) => Promise<unknown>
  >;
  let getTransactionRepository: jest.MockedFunction<
    (entity: unknown) => unknown
  >;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let findIdempotencyRecord: jest.Mock;
  let insertIdempotencyRecord: jest.Mock;
  let insertProject: jest.Mock;
  let store: TypeOrmProjectCreationStore;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue(undefined);
    findIdempotencyRecord = jest.fn();
    insertIdempotencyRecord = jest.fn().mockResolvedValue(undefined);
    insertProject = jest.fn().mockResolvedValue(undefined);

    const idempotencyRecordRepository = {
      findOneBy: findIdempotencyRecord,
      insert: insertIdempotencyRecord,
    };
    const projectRepository = {
      insert: insertProject,
    };

    getTransactionRepository = jest.fn((entity: unknown) => {
      if (entity === ProjectIdempotencyRecordOrmEntity) {
        return idempotencyRecordRepository;
      }

      if (entity === ProjectOrmEntity) {
        return projectRepository;
      }

      throw new Error('Unexpected entity');
    });

    const entityManager = {
      query,
      getRepository: getTransactionRepository,
    } as unknown as EntityManager;

    transaction = jest.fn((callback: TransactionCallback) =>
      callback(entityManager),
    );
    getRepository = jest.fn().mockReturnValue(idempotencyRecordRepository);

    const dataSource = {
      transaction,
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmProjectCreationStore(dataSource);
  });

  describe('save', () => {
    it('inserts the project and its idempotency record in one transaction', async () => {
      findIdempotencyRecord.mockResolvedValue(null);

      const result = await store.save({ idempotencyKey, project });

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith(ADVISORY_LOCK_QUERY, [idempotencyKey]);
      expect(findIdempotencyRecord).toHaveBeenCalledWith({ idempotencyKey });
      expect(insertProject).toHaveBeenCalledWith({
        id: project.id,
        name: project.name,
        description: project.description,
      });
      expect(insertIdempotencyRecord).toHaveBeenCalledWith({
        idempotencyKey,
        operation: PROJECT_CREATION_OPERATION,
        aggregateId: project.id,
        response: project,
      });
      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.CREATED,
        project,
      });
    });

    it('returns the stored response when the request is an idempotent replay', async () => {
      const storedProject: ProjectSnapshot = {
        ...project,
        id: 'original-project-456',
      };
      findIdempotencyRecord.mockResolvedValue(
        createIdempotencyRecord(storedProject),
      );

      const result = await store.save({ idempotencyKey, project });

      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED,
        project: storedProject,
      });
      expect(insertProject).not.toHaveBeenCalled();
      expect(insertIdempotencyRecord).not.toHaveBeenCalled();
    });

    it('returns a conflict when the stored request has different content', async () => {
      findIdempotencyRecord.mockResolvedValue(
        createIdempotencyRecord({
          ...project,
          name: 'Different project',
        }),
      );

      const result = await store.save({ idempotencyKey, project });

      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      });
      expect(insertProject).not.toHaveBeenCalled();
      expect(insertIdempotencyRecord).not.toHaveBeenCalled();
    });

    it('returns a conflict when the key belongs to another operation', async () => {
      findIdempotencyRecord.mockResolvedValue(
        createIdempotencyRecord(project, 'project.update'),
      );

      const result = await store.save({ idempotencyKey, project });

      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      });
    });
  });

  describe('findByIdempotencyKey', () => {
    it('returns the stored project for a project creation record', async () => {
      findIdempotencyRecord.mockResolvedValue(createIdempotencyRecord(project));

      const result = await store.findByIdempotencyKey({ idempotencyKey });

      expect(getRepository).toHaveBeenCalledWith(
        ProjectIdempotencyRecordOrmEntity,
      );
      expect(findIdempotencyRecord).toHaveBeenCalledWith({ idempotencyKey });
      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED,
        project,
      });
    });

    it('returns a conflict when no record exists', async () => {
      findIdempotencyRecord.mockResolvedValue(null);

      const result = await store.findByIdempotencyKey({ idempotencyKey });

      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      });
    });

    it('returns a conflict when the record belongs to another operation', async () => {
      findIdempotencyRecord.mockResolvedValue(
        createIdempotencyRecord(project, 'project.update'),
      );

      const result = await store.findByIdempotencyKey({ idempotencyKey });

      expect(result).toEqual({
        status: PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT,
      });
    });
  });

  function createIdempotencyRecord(
    response: ProjectSnapshot,
    operation = PROJECT_CREATION_OPERATION,
  ): ProjectIdempotencyRecordOrmEntity {
    return Object.assign(new ProjectIdempotencyRecordOrmEntity(), {
      idempotencyKey,
      operation,
      aggregateId: response.id,
      response,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      project: new ProjectOrmEntity(),
    });
  }
});
