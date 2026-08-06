import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { mapExceptionToHttpError } from './http-error-mapper';
import { RequestWithId } from '../logging/http-logging.middleware';

@Catch()
export class AppErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<{
      status(statusCode: number): {
        json(body: unknown): void;
      };
    }>();
    const mappedError = mapExceptionToHttpError(exception);

    if (mappedError.statusCode >= 500) {
      this.logger.error({
        event: 'http.request.failed',
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: mappedError.statusCode,
        errorCode: mappedError.body.error.code,
        exception: this.describeException(exception),
      });
    }

    response.status(mappedError.statusCode).json(mappedError.body);
  }

  private describeException(exception: unknown): {
    name: string;
    message: string;
    stack?: string;
  } {
    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    return {
      name: 'UnknownThrownValue',
      message: 'A non-Error value was thrown',
    };
  }
}
