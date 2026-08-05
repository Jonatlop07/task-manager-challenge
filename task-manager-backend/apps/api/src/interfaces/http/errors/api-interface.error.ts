import { AppError, ERROR_CATEGORIES, ERROR_LAYERS, type ErrorCategory } from '@shared/errors';

export type ApiInterfaceErrorOptions = Readonly<{
  category?: ErrorCategory;
}>;

export class ApiInterfaceError extends AppError {
  readonly layer = ERROR_LAYERS.INTERFACE;
  readonly category: ErrorCategory;
  readonly retryable = false;

  constructor(
    readonly code: string,
    message: string,
    options: ApiInterfaceErrorOptions = {},
  ) {
    super(message);
    this.category = options.category ?? ERROR_CATEGORIES.VALIDATION;
  }
}
