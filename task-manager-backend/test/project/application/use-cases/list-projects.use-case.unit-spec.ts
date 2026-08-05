import type { ProjectListQueryStore } from '@project/application/ports';
import { ListProjectsUseCase } from '@project/application/use-cases';
import type { ProjectSnapshot } from '@project/domain';

describe('ListProjectsUseCase', () => {
  const projects: readonly ProjectSnapshot[] = [
    {
      id: 'project-123',
      name: 'Project Atlas',
      description: 'Internal planning',
    },
    {
      id: 'project-456',
      name: 'Project Borealis',
      description: null,
    },
  ];

  let findAll: jest.MockedFunction<ProjectListQueryStore['findAll']>;
  let useCase: ListProjectsUseCase;

  beforeEach(() => {
    findAll = jest.fn().mockResolvedValue(projects);
    useCase = new ListProjectsUseCase({ findAll });
  });

  it('returns all projects', async () => {
    const result = await useCase.execute();

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ projects });
  });

  it('returns an empty collection when there are no projects', async () => {
    findAll.mockResolvedValue([]);

    await expect(useCase.execute()).resolves.toEqual({ projects: [] });
  });

  it('propagates store errors', async () => {
    const storeError = new Error('Store failed');
    findAll.mockRejectedValue(storeError);

    await expect(useCase.execute()).rejects.toBe(storeError);
  });
});
