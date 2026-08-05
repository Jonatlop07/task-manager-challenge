import type { TaskSnapshot } from '@task/domain';
import { TaskPriority, TaskStatus } from '@task/domain';
import { TypeOrmTaskUpdateStore } from '@task/infrastructure/persistence/postgres/typeorm/adapters';
import { TaskOrmEntity } from '@task/infrastructure/persistence/postgres/typeorm/entities';
import type { DataSource, Repository } from 'typeorm';

describe('TypeOrmTaskUpdateStore', () => {
  const task: TaskSnapshot = {
    id: 'task-123',
    projectId: 'project-123',
    title: 'Review technical design',
    description: 'Validate the task boundaries',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    dueDate: '2026-08-12T20:30:00.000Z',
  };

  let updateTask: jest.MockedFunction<Repository<TaskOrmEntity>['update']>;
  let getRepository: jest.MockedFunction<(entity: unknown) => unknown>;
  let store: TypeOrmTaskUpdateStore;

  beforeEach(() => {
    updateTask = jest.fn().mockResolvedValue({
      affected: 1,
      generatedMaps: [],
      raw: [],
    });
    getRepository = jest.fn().mockReturnValue({ update: updateTask });

    const dataSource = {
      getRepository,
    } as unknown as DataSource;

    store = new TypeOrmTaskUpdateStore(dataSource);
  });

  it('updates mutable fields scoped to the task project', async () => {
    const result = await store.update(task);

    expect(getRepository).toHaveBeenCalledWith(TaskOrmEntity);
    expect(updateTask).toHaveBeenCalledWith(
      {
        id: task.id,
        projectId: task.projectId,
      },
      {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: new Date(task.dueDate as string),
      },
    );
    expect(result).toBe(task);
  });

  it('supports clearing nullable fields', async () => {
    const taskWithoutOptionalFields: TaskSnapshot = {
      ...task,
      description: null,
      dueDate: null,
    };

    await store.update(taskWithoutOptionalFields);

    expect(updateTask).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        description: null,
        dueDate: null,
      }),
    );
  });

  it.each([0, undefined])(
    'returns null when affected is %s',
    async (affected) => {
      updateTask.mockResolvedValue({
        affected,
        generatedMaps: [],
        raw: [],
      });

      await expect(store.update(task)).resolves.toBeNull();
    },
  );

  it('propagates persistence errors', async () => {
    const persistenceError = new Error('Update failed');
    updateTask.mockRejectedValue(persistenceError);

    await expect(store.update(task)).rejects.toBe(persistenceError);
  });
});
