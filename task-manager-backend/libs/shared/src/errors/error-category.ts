export const ERROR_CATEGORIES = {
  DOMAIN_INVARIANT: 'domain-invariant',
  IDEMPOTENCY_CONFLICT: 'idempotency-conflict',
  NOT_FOUND: 'not-found',
  CONFLICT: 'conflict',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  PROVIDER_FAILURE: 'provider-failure',
  INFRASTRUCTURE_FAILURE: 'infrastructure-failure',
  TIMEOUT: 'timeout',
  UNEXPECTED: 'unexpected',
  VALIDATION: 'validation',
} as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];
