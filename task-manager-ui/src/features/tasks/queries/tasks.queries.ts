import { queryOptions } from '@tanstack/react-query';
import { getTask, listTasks, type ListTasksFilters } from '../api/tasks.api';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  byProject: (projectId: string) =>
    [...taskQueryKeys.all, 'project', projectId] as const,
  lists: (projectId: string) =>
    [...taskQueryKeys.byProject(projectId), 'list'] as const,
  list: (projectId: string, filters: ListTasksFilters) =>
    [...taskQueryKeys.lists(projectId), filters] as const,
  detail: (projectId: string, taskId: string) =>
    [...taskQueryKeys.byProject(projectId), 'detail', taskId] as const,
};

export function tasksByProjectQueryOptions(
  projectId: string,
  filters: ListTasksFilters = {},
) {
  return queryOptions({
    queryKey: taskQueryKeys.list(projectId, filters),
    queryFn: () => listTasks(projectId, filters),
    enabled: projectId.length > 0,
    placeholderData: (previousTasks) => previousTasks,
  });
}

export function taskDetailsQueryOptions(projectId: string, taskId: string) {
  return queryOptions({
    queryKey: taskQueryKeys.detail(projectId, taskId),
    queryFn: () => getTask(projectId, taskId),
    enabled: projectId.length > 0 && taskId.length > 0,
  });
}
