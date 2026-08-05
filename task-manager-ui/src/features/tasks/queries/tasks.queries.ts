import { queryOptions } from '@tanstack/react-query';
import { listTasks } from '../api/tasks.api';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  byProject: (projectId: string) =>
    [...taskQueryKeys.all, 'project', projectId] as const,
};

export function tasksByProjectQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: taskQueryKeys.byProject(projectId),
    queryFn: () => listTasks(projectId),
    enabled: projectId.length > 0,
  });
}
