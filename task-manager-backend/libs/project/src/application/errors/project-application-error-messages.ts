export const PROJECT_APPLICATION_ERROR_CODES = {
  IDEMPOTENCY_KEY_REQUIRED: 'project.idempotency-key.required',
  IDEMPOTENCY_KEY_INVALID: 'project.idempotency-key.invalid',
  IDEMPOTENCY_CONFLICT: 'project.idempotency.conflict',
  PROJECT_NOT_FOUND: 'project.not-found',
  PROJECT_UPDATE_REQUIRED: 'project.update.required',
} as const;
