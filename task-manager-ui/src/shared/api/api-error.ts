export type ApiErrorInput = Readonly<{
  message: string;
  code: string;
  status?: number;
  layer?: string;
  category?: string;
  retryable: boolean;
  details?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}>;

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly layer?: string;
  readonly category?: string;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(input: ApiErrorInput) {
    super(input.message, { cause: input.cause });
    this.name = ApiError.name;
    this.code = input.code;
    this.status = input.status;
    this.layer = input.layer;
    this.category = input.category;
    this.retryable = input.retryable;
    this.details = input.details;
  }
}
