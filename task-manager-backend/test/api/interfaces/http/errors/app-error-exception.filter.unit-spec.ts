import { ArgumentsHost, Logger } from '@nestjs/common';
import { ApiInterfaceError } from '@api/interfaces/http/errors/api-interface.error';
import { AppErrorExceptionFilter } from '@api/interfaces/http/errors/app-error-exception.filter';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';

describe('AppErrorExceptionFilter', () => {
  let logError: jest.SpyInstance;

  beforeEach(() => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs unexpected failures with correlation and exception details', () => {
    const exception = new Error('Database connection failed');
    const context = createArgumentsHost();

    new AppErrorExceptionFilter().catch(exception, context.host);

    expect(logError).toHaveBeenCalledWith({
      event: 'http.request.failed',
      requestId: 'request-123',
      method: 'GET',
      path: '/projects',
      statusCode: 500,
      errorCode: 'api.unexpected-error',
      exception: {
        name: 'Error',
        message: exception.message,
        stack: exception.stack,
      },
    });
    expect(context.status).toHaveBeenCalledWith(500);
    expect(context.json).toHaveBeenCalledWith({
      error: {
        code: HTTP_ERROR_CODES.UNEXPECTED_ERROR,
        message: HTTP_ERROR_MESSAGES.UNEXPECTED_ERROR,
        layer: 'interface',
        category: 'unexpected',
        retryable: false,
      },
    });
  });

  it('does not log expected client errors as server failures', () => {
    const context = createArgumentsHost();
    const exception = new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );

    new AppErrorExceptionFilter().catch(exception, context.host);

    expect(logError).not.toHaveBeenCalled();
    expect(context.status).toHaveBeenCalledWith(400);
  });
});

function createArgumentsHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        requestId: 'request-123',
        method: 'GET',
        path: '/projects',
      }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}
