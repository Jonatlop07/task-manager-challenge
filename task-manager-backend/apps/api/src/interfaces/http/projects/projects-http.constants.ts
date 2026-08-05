import { API_HTTP_HEADER_NAMES } from '../shared/api-http-headers';

export const PROJECT_HTTP_HEADERS = {
  IDEMPOTENCY_KEY: API_HTTP_HEADER_NAMES.IDEMPOTENCY_KEY,
} as const;

export const PROJECT_HTTP_ROUTES = {
  PROJECTS: 'projects',
} as const;

export const PROJECT_HTTP_RESPONSE_STATUSES = {
  CREATED: 201,
} as const;
