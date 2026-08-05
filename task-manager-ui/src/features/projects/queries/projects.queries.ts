import { queryOptions } from '@tanstack/react-query';
import { listProjects } from '../api/projects.api';

export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
};

export function projectsQueryOptions() {
  return queryOptions({
    queryKey: projectQueryKeys.lists(),
    queryFn: listProjects,
  });
}
