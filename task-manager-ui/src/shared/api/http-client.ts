import { z } from 'zod';
import { apiConfig } from './api-config';
import { ApiError } from './api-error';

const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    layer: z.string(),
    category: z.string(),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

const CLIENT_ERROR_CODES = {
  HTTP_ERROR: 'client.http-error',
  INVALID_RESPONSE: 'client.invalid-response',
  NETWORK_ERROR: 'client.network-error',
} as const;

export type ResponseParser<TResponse> = (value: unknown) => TResponse;

export type HttpRequestOptions<TResponse> = Omit<
  RequestInit,
  'body' | 'method'
> &
  Readonly<{
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    json?: unknown;
    parse?: ResponseParser<TResponse>;
  }>;

type Fetcher = typeof fetch;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(baseUrl: string, fetcher: Fetcher = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  async request<TResponse = void>(
    path: string,
    options: HttpRequestOptions<TResponse> = {},
  ): Promise<TResponse> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.json !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;

    try {
      response = await this.fetcher(this.resolveUrl(path), {
        ...options,
        method: options.method ?? 'GET',
        headers,
        body:
          options.json === undefined ? undefined : JSON.stringify(options.json),
      });
    } catch (cause) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.NETWORK_ERROR,
        message: 'Unable to connect to the API.',
        retryable: true,
        cause,
      });
    }

    const responseBody = await this.readResponseBody(response);

    if (!response.ok) {
      throw this.createHttpError(response, responseBody);
    }

    if (!options.parse) {
      return responseBody as TResponse;
    }

    try {
      return options.parse(responseBody);
    } catch (cause) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.INVALID_RESPONSE,
        message: 'The API response does not match the expected contract.',
        status: response.status,
        retryable: false,
        cause,
      });
    }
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');
    return new URL(normalizedPath, `${this.baseUrl}/`).toString();
  }

  private async readResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const text = await response.text();

    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (cause) {
      if (!response.ok) {
        return undefined;
      }

      throw new ApiError({
        code: CLIENT_ERROR_CODES.INVALID_RESPONSE,
        message: 'The API returned an invalid JSON response.',
        status: response.status,
        retryable: false,
        cause,
      });
    }
  }

  private createHttpError(response: Response, body: unknown): ApiError {
    const parsedError = apiErrorResponseSchema.safeParse(body);

    if (!parsedError.success) {
      return new ApiError({
        code: CLIENT_ERROR_CODES.HTTP_ERROR,
        message: `The API request failed with status ${response.status}.`,
        status: response.status,
        retryable: response.status >= 500,
      });
    }

    return new ApiError({
      ...parsedError.data.error,
      status: response.status,
    });
  }
}

export const httpClient = new HttpClient(apiConfig.baseUrl);
