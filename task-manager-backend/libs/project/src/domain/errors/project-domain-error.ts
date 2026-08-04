import { AppError, ERROR_CATEGORIES, ERROR_LAYERS } from '@shared/errors';

export class ProjectDomainError extends AppError {
  readonly layer = ERROR_LAYERS.DOMAIN;
  readonly category = ERROR_CATEGORIES.DOMAIN_INVARIANT;
  readonly retryable = false;

  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
