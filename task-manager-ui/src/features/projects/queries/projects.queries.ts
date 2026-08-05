import { queryOptions } from '@tanstack/react-query';
import { getProjectSummary, listProjects } from '../api/projects.api';

export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
  summary: (projectId: string) =>
    [...projectQueryKeys.all, 'detail', projectId, 'summary'] as const,
};

export function projectsQueryOptions() {
  return queryOptions({
    queryKey: projectQueryKeys.lists(),
    queryFn: listProjects,
  });
}

export function projectSummaryQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: projectQueryKeys.summary(projectId),
    queryFn: () => getProjectSummary(projectId),
    enabled: projectId.length > 0,
  });
}
