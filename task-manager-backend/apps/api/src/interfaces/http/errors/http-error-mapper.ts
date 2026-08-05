import { AppError, ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';

import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
  HTTP_ERROR_RESPONSE_KEYS,
  HTTP_STATUS_CODES,
} from './http-error.constants';

export type HttpErrorResponseBody = Readonly<{
  [HTTP_ERROR_RESPONSE_KEYS.ERROR]: Readonly<{
    code: string;
    message: string;
    layer: string;
    category: string;
    retryable: boolean;
    [HTTP_ERROR_RESPONSE_KEYS.DETAILS]?: Readonly<Record<string, unknown>>;
  }>;
}>;

export type HttpErrorResponse = Readonly<{
  statusCode: number;
  body: HttpErrorResponseBody;
}>;

export const mapExceptionToHttpError = (exception: unknown): HttpErrorResponse => {
  if (exception instanceof AppError) {
    return {
      statusCode: mapAppErrorStatusCode(exception),
      body: {
        [HTTP_ERROR_RESPONSE_KEYS.ERROR]: toHttpErrorResponseBody(exception),
      },
    };
  }

  return {
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    body: {
      [HTTP_ERROR_RESPONSE_KEYS.ERROR]: {
        code: HTTP_ERROR_CODES.UNEXPECTED_ERROR,
        message: HTTP_ERROR_MESSAGES.UNEXPECTED_ERROR,
        layer: ERROR_LAYERS.INTERFACE,
        category: ERROR_CATEGORIES.UNEXPECTED,
        retryable: false,
      },
    },
  };
};

const toHttpErrorResponseBody = (
  error: AppError,
): HttpErrorResponseBody[typeof HTTP_ERROR_RESPONSE_KEYS.ERROR] => ({
  code: error.code,
  message: error.message,
  layer: error.layer,
  category: error.category,
  retryable: error.retryable,
  ...(error.details === undefined ? {} : { [HTTP_ERROR_RESPONSE_KEYS.DETAILS]: error.details }),
});

const mapAppErrorStatusCode = (error: AppError): number => {
  switch (error.category) {
    case ERROR_CATEGORIES.VALIDATION:
    case ERROR_CATEGORIES.DOMAIN_INVARIANT:
      return HTTP_STATUS_CODES.BAD_REQUEST;
    case ERROR_CATEGORIES.AUTHENTICATION:
      return HTTP_STATUS_CODES.UNAUTHORIZED;
    case ERROR_CATEGORIES.AUTHORIZATION:
      return HTTP_STATUS_CODES.FORBIDDEN;
    case ERROR_CATEGORIES.NOT_FOUND:
      return HTTP_STATUS_CODES.NOT_FOUND;
    case ERROR_CATEGORIES.CONFLICT:
    case ERROR_CATEGORIES.IDEMPOTENCY_CONFLICT:
      return HTTP_STATUS_CODES.CONFLICT;
    case ERROR_CATEGORIES.TIMEOUT:
      return HTTP_STATUS_CODES.GATEWAY_TIMEOUT;
    case ERROR_CATEGORIES.PROVIDER_FAILURE:
      return HTTP_STATUS_CODES.BAD_GATEWAY;
    case ERROR_CATEGORIES.INFRASTRUCTURE_FAILURE:
      return error.retryable
        ? HTTP_STATUS_CODES.SERVICE_UNAVAILABLE
        : HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    case ERROR_CATEGORIES.UNEXPECTED:
      return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
};
