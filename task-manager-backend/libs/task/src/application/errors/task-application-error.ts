import {
  AppError,
  type AppErrorDetails,
  ERROR_CATEGORIES,
  ERROR_LAYERS,
  type ErrorCategory,
} from '@shared/errors';

export type TaskApplicationErrorOptions = Readonly<{
  category?: ErrorCategory;
  details?: AppErrorDetails;
  retryable?: boolean;
}>;

export class TaskApplicationError extends AppError {
  readonly layer = ERROR_LAYERS.APPLICATION;
  readonly category: ErrorCategory;
  readonly retryable: boolean;

  constructor(
    readonly code: string,
    message: string,
    options: TaskApplicationErrorOptions = {},
  ) {
    super(message, { details: options.details });
    this.category = options.category ?? ERROR_CATEGORIES.VALIDATION;
    this.retryable = options.retryable ?? false;
  }
}
