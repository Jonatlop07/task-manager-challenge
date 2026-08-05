import { API_HTTP_HEADER_NAMES } from '../shared/api-http-headers';

export const PROJECT_HTTP_HEADERS = {
  IDEMPOTENCY_KEY: API_HTTP_HEADER_NAMES.IDEMPOTENCY_KEY,
} as const;

export const PROJECT_HTTP_ROUTES = {
  PROJECTS: 'projects',
  PROJECT: ':projectId',
} as const;

export const PROJECT_HTTP_RESPONSE_STATUSES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
} as const;

export const PROJECT_HTTP_LIMITS = {
  ID_MAX_LENGTH: 64,
} as const;
