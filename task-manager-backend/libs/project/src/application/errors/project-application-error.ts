import {
  AppError,
  AppErrorDetails,
  ERROR_CATEGORIES,
  ERROR_LAYERS,
  ErrorCategory,
} from '@shared/errors';

export type ProjectApplicationErrorOptions = Readonly<{
  category?: ErrorCategory;
  details?: AppErrorDetails;
  retryable?: boolean;
}>;

export class ProjectApplicationError extends AppError {
  readonly layer = ERROR_LAYERS.APPLICATION;
  readonly category: ErrorCategory;
  readonly retryable: boolean;

  constructor(
    readonly code: string,
    message: string,
    options: ProjectApplicationErrorOptions = {},
  ) {
    super(message, { details: options.details });
    this.category = options.category ?? ERROR_CATEGORIES.VALIDATION;
    this.retryable = options.retryable ?? false;
  }
}
