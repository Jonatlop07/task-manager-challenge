export const TASK_HTTP_LIMITS = {
  PROJECT_ID_MAX_LENGTH: 64,
  SEARCH_MAX_LENGTH: 150,
  TITLE_MAX_LENGTH: 150,
} as const;

export const TASK_HTTP_ROUTES = {
  PROJECT_TASKS: 'projects/:projectId/tasks',
} as const;

export const TASK_HTTP_RESPONSE_STATUSES = {
  CREATED: 201,
} as const;
