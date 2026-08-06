import { randomUUID } from 'node:crypto';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

const REQUEST_ID_HEADER_KEY = REQUEST_ID_HEADER.toLowerCase();
const MAX_REQUEST_ID_LENGTH = 128;
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]+$/;

export type RequestWithId = Request & {
  requestId?: string;
};

export function resolveRequestId(
  header: string | string[] | undefined,
): string {
  const candidate = Array.isArray(header) ? header[0] : header;

  if (
    candidate &&
    candidate.length <= MAX_REQUEST_ID_LENGTH &&
    VALID_REQUEST_ID.test(candidate)
  ) {
    return candidate;
  }

  return randomUUID();
}

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggingMiddleware.name);

  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER_KEY]);
    const method = request.method;
    const path = request.path;
    const startedAt = process.hrtime.bigint();
    let terminalEventLogged = false;

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    this.logger.log({
      event: 'http.request.started',
      requestId,
      method,
      path,
    });

    response.on('finish', () => {
      terminalEventLogged = true;
      const details = {
        event: 'http.request.completed',
        requestId,
        method,
        path,
        statusCode: response.statusCode,
        durationMs: this.elapsedMilliseconds(startedAt),
      };

      if (response.statusCode >= 500) {
        this.logger.error(details);
      } else if (response.statusCode >= 400) {
        this.logger.warn(details);
      } else {
        this.logger.log(details);
      }
    });

    response.on('close', () => {
      if (terminalEventLogged) {
        return;
      }

      terminalEventLogged = true;
      this.logger.warn({
        event: 'http.request.aborted',
        requestId,
        method,
        path,
        durationMs: this.elapsedMilliseconds(startedAt),
      });
    });

    next();
  }

  private elapsedMilliseconds(startedAt: bigint): number {
    const elapsed = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    return Number(elapsed.toFixed(2));
  }
}
