export const TASK_ERROR_CODES = {
  TASK_ID_REQUIRED: 'task.id.required',
  TASK_ID_INVALID_LENGTH: 'task.id.invalid-length',
  PROJECT_ID_REQUIRED: 'task.project-id.required',
  PROJECT_ID_INVALID_LENGTH: 'task.project-id.invalid-length',
  TASK_TITLE_REQUIRED: 'task.title.required',
  TASK_TITLE_INVALID_LENGTH: 'task.title.invalid-length',
  TASK_DUE_DATE_INVALID: 'task.due-date.invalid',
  TASK_STATUS_INVALID: 'task.status.invalid',
  TASK_PRIORITY_INVALID: 'task.priority.invalid',
} as const;
