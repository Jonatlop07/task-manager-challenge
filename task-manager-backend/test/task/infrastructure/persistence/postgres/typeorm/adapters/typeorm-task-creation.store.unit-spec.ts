import type { TaskSnapshot } from '@task/domain';
import { TaskPriority, TaskStatus } from '@task/domain';
import { TypeOrmTaskCreationStore } from '@task/infrastructure/persistence/postgres/typeorm/adapters';
import { TaskOrmEntity } from '@task/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmTaskCreationStore', () => {
  const task: TaskSnapshot = {
    id: 'task-123',
    projectId: 'project-123',
    title: 'Prepare technical design',
    description: 'Define the task boundaries',
    status: TaskStatus.Pending,
    priority: TaskPriority.High,
    dueDate: '2026-08-10T20:30:00.000Z',
  };

  let insertTask: jest.MockedFunction<Repository<TaskOrmEntity>['insert']>;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmTaskCreationStore;

  beforeEach(() => {
    insertTask = jest.fn().mockResolvedValue({
      identifiers: [{ id: task.id }],
      generatedMaps: [],
      raw: [],
    });
    getRepository = jest.fn().mockReturnValue({ insert: insertTask });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmTaskCreationStore(dataSource);
  });

  it('inserts the task and returns its snapshot', async () => {
    const result = await store.save(task);

    expect(getRepository).toHaveBeenCalledWith(TaskOrmEntity);
    expect(insertTask).toHaveBeenCalledWith({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate as string),
    });
    expect(result).toBe(task);
  });

  it('inserts null when the task has no due date or description', async () => {
    const taskWithoutOptionalFields: TaskSnapshot = {
      ...task,
      description: null,
      dueDate: null,
    };

    await store.save(taskWithoutOptionalFields);

    expect(insertTask).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
        dueDate: null,
      }),
    );
  });

  it('propagates persistence errors', async () => {
    const persistenceError = new Error('Insert failed');
    insertTask.mockRejectedValue(persistenceError);

    await expect(store.save(task)).rejects.toBe(persistenceError);
  });
});
