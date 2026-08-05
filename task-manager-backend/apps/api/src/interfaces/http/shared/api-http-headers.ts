export const API_HTTP_HEADER_NAMES = {
  IDEMPOTENCY_KEY: 'idempotency-key',
} as const;

export type ApiHttpHeaderMap = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export const readHttpHeader = (
  headers: ApiHttpHeaderMap | undefined,
  name: string,
): string => readOptionalHttpHeader(headers, name) ?? '';

export const readOptionalHttpHeader = (
  headers: ApiHttpHeaderMap | undefined,
  name: string,
): string | undefined => {
  const value = headers?.[name];

  if (typeof value === 'string') {
    return value;
  }

  return value?.[0];
};
