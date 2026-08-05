export const PROJECT_APPLICATION_ERROR_MESSAGES = {
  IDEMPOTENCY_KEY_REQUIRED: 'Idempotency key must not be blank',
  IDEMPOTENCY_KEY_INVALID: 'Idempotency key exceeds the project snapshot limit',
  IDEMPOTENCY_CONFLICT:
    'Project idempotency key conflicts with a different request',
  PROJECT_NOT_FOUND: 'Project was not found',
  PROJECT_UPDATE_REQUIRED: 'At least one project field must be updated',
} as const;
