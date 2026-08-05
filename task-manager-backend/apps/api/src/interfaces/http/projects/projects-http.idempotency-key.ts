import { CREATE_PROJECT_LIMITS } from '@project/application';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '../errors/http-error.constants';
import { ApiInterfaceError } from '../errors/api-interface.error';

export const assertProjectIdempotencyKeyHeader = (value: string): string => {
  if (value.trim().length > CREATE_PROJECT_LIMITS.IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );
  }
  return value;
};
