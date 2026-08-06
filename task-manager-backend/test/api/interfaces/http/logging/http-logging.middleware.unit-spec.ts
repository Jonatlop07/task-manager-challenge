import { Logger } from '@nestjs/common';
import {
  HttpLoggingMiddleware,
  REQUEST_ID_HEADER,
  RequestWithId,
  resolveRequestId,
} from '@api/interfaces/http/logging/http-logging.middleware';
import type { NextFunction, Response } from 'express';

describe('HttpLoggingMiddleware', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves a valid request ID supplied by the caller', () => {
    expect(resolveRequestId('client-request-123')).toBe('client-request-123');
  });

  it.each([
    { scenario: 'missing', value: undefined },
    { scenario: 'blank', value: '' },
    { scenario: 'too long', value: 'a'.repeat(129) },
    { scenario: 'containing unsupported characters', value: 'request id' },
  ])('generates an ID when the incoming ID is $scenario', ({ value }) => {
    expect(resolveRequestId(value)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('adds the request ID and logs a successful request lifecycle', () => {
    const context = createHttpContext({
      requestId: 'request-123',
      statusCode: 200,
    });

    new HttpLoggingMiddleware().use(
      context.request,
      context.response,
      context.next,
    );

    expect(context.request.requestId).toBe('request-123');
    expect(context.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'request-123',
    );
    expect(context.next).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith({
      event: 'http.request.started',
      requestId: 'request-123',
      method: 'GET',
      path: '/projects',
    });

    context.listeners.finish();

    const completedLog = getLastLogArgument(log);

    expect(completedLog).toMatchObject({
      event: 'http.request.completed',
      requestId: 'request-123',
      method: 'GET',
      path: '/projects',
      statusCode: 200,
    });
    expect(getDuration(completedLog)).toEqual(expect.any(Number));
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it.each([
    { statusCode: 404, logger: 'warn' },
    { statusCode: 500, logger: 'error' },
  ])(
    'logs a $statusCode response at $logger level',
    ({ statusCode, logger }) => {
      const context = createHttpContext({ statusCode });

      new HttpLoggingMiddleware().use(
        context.request,
        context.response,
        context.next,
      );
      context.listeners.finish();

      const selectedLogger = logger === 'warn' ? warn : error;
      const completedLog = getLastLogArgument(selectedLogger);

      expect(completedLog).toMatchObject({
        event: 'http.request.completed',
        statusCode,
      });
    },
  );

  it('logs an aborted request once when the connection closes early', () => {
    const context = createHttpContext({});

    new HttpLoggingMiddleware().use(
      context.request,
      context.response,
      context.next,
    );
    context.listeners.close();
    context.listeners.close();

    expect(warn).toHaveBeenCalledTimes(1);
    const abortedLog = getLastLogArgument(warn);

    expect(abortedLog).toMatchObject({
      event: 'http.request.aborted',
      method: 'GET',
      path: '/projects',
    });
    expect(getDuration(abortedLog)).toEqual(expect.any(Number));
  });
});

type ResponseEvent = 'finish' | 'close';

function createHttpContext({
  requestId,
  statusCode = 200,
}: {
  requestId?: string;
  statusCode?: number;
}) {
  const listeners: Record<ResponseEvent, () => void> = {
    finish: jest.fn(),
    close: jest.fn(),
  };
  const setHeader = jest.fn();
  const request = {
    headers: requestId ? { 'x-request-id': requestId } : {},
    method: 'GET',
    path: '/projects',
  } as unknown as RequestWithId;
  const response = {
    statusCode,
    setHeader,
    on: jest.fn((event: ResponseEvent, listener: () => void) => {
      listeners[event] = listener;
      return response;
    }),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  return { request, response, next, setHeader, listeners };
}

function getDuration(logEntry: unknown): unknown {
  if (typeof logEntry !== 'object' || logEntry === null) {
    return undefined;
  }

  return Reflect.get(logEntry, 'durationMs');
}

function getLastLogArgument(logger: jest.SpyInstance): unknown {
  const calls = logger.mock.calls as unknown as ReadonlyArray<
    ReadonlyArray<unknown>
  >;

  return calls.at(-1)?.[0];
}
