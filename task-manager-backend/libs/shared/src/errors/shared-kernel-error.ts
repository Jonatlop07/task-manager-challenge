import { AppError } from './app-error';
import { ERROR_CATEGORIES } from './error-category';
import { ERROR_LAYERS } from './error-layer';

export class SharedKernelError extends AppError {
  readonly layer = ERROR_LAYERS.SHARED_KERNEL;
  readonly category = ERROR_CATEGORIES.VALIDATION;
  readonly retryable = false;

  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
