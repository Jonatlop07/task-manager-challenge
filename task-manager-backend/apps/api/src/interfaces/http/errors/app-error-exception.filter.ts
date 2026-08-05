import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { mapExceptionToHttpError } from './http-error-mapper';

@Catch()
export class AppErrorExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(statusCode: number): {
        json(body: unknown): void;
      };
    }>();
    const mappedError = mapExceptionToHttpError(exception);

    response.status(mappedError.statusCode).json(mappedError.body);
  }
}
