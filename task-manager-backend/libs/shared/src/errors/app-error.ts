import type { ErrorCategory } from './error-category';
import type { ErrorLayer } from './error-layer';

export type AppErrorOptions = Readonly<{
  cause?: unknown;
  details?: AppErrorDetails;
}>;

export type AppErrorDetails = Readonly<Record<string, unknown>>;

export abstract class AppError extends Error {
  abstract readonly layer: ErrorLayer;
  abstract readonly category: ErrorCategory;
  abstract readonly code: string;
  abstract readonly retryable: boolean;
  readonly details?: AppErrorDetails;

  protected constructor(message: string, options?: AppErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.details = options?.details;
  }
}
