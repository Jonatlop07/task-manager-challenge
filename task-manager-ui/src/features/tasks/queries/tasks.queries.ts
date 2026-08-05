import { queryOptions } from '@tanstack/react-query';
import { getTask, listTasks } from '../api/tasks.api';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  byProject: (projectId: string) =>
    [...taskQueryKeys.all, 'project', projectId] as const,
  detail: (projectId: string, taskId: string) =>
    [...taskQueryKeys.byProject(projectId), 'detail', taskId] as const,
};

export function tasksByProjectQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: taskQueryKeys.byProject(projectId),
    queryFn: () => listTasks(projectId),
    enabled: projectId.length > 0,
  });
}

export function taskDetailsQueryOptions(projectId: string, taskId: string) {
  return queryOptions({
    queryKey: taskQueryKeys.detail(projectId, taskId),
    queryFn: () => getTask(projectId, taskId),
    enabled: projectId.length > 0 && taskId.length > 0,
  });
}
