export const HTTP_ERROR_RESPONSE_KEYS = {
  ERROR: 'error',
  DETAILS: 'details',
} as const;

export const HTTP_ERROR_CODES = {
  INVALID_REQUEST_BODY: 'api.invalid-request-body',
  UNEXPECTED_ERROR: 'api.unexpected-error',
  INVALID_REQUEST_PARAM: 'api.invalid-request-param',
} as const;

export const HTTP_ERROR_MESSAGES = {
  INVALID_REQUEST_BODY: 'Request body does not match the expected contract.',
  UNEXPECTED_ERROR: 'Unexpected API error.',
  INVALID_REQUEST_PARAM:
    'Request path parameters do not match the expected contract.',
} as const;

export const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
