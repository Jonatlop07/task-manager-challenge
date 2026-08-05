export const TASK_HTTP_LIMITS = {
  PROJECT_ID_MAX_LENGTH: 64,
  TASK_ID_MAX_LENGTH: 64,
  SEARCH_MAX_LENGTH: 150,
  TITLE_MAX_LENGTH: 150,
} as const;

export const TASK_HTTP_ROUTES = {
  PROJECT_TASKS: 'projects/:projectId/tasks',
  TASK: ':taskId',
} as const;

export const TASK_HTTP_RESPONSE_STATUSES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
} as const;
