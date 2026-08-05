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

type BaseHttpRequestOptions = Omit<RequestInit, 'body' | 'method'> &
  Readonly<{
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    json?: unknown;
  }>;

export type HttpRequestOptions<TResponse> = BaseHttpRequestOptions &
  Readonly<{
    responseSchema: z.ZodType<TResponse>;
  }>;

export type HttpRequestVoidOptions = BaseHttpRequestOptions;

type Fetcher = typeof fetch;

type HttpResponse = Readonly<{
  response: Response;
  body: unknown;
}>;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(baseUrl: string, fetcher?: Fetcher) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async request<TResponse>(
    path: string,
    options: HttpRequestOptions<TResponse>,
  ): Promise<TResponse> {
    const { responseSchema, ...requestOptions } = options;
    const { response, body } = await this.execute(path, requestOptions);

    try {
      return responseSchema.parse(body);
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

  async requestVoid(
    path: string,
    options: HttpRequestVoidOptions = {},
  ): Promise<void> {
    const { response, body } = await this.execute(path, options);

    if (body !== undefined) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.INVALID_RESPONSE,
        message: 'The API returned content for an empty response.',
        status: response.status,
        retryable: false,
      });
    }
  }

  private async execute(
    path: string,
    options: BaseHttpRequestOptions,
  ): Promise<HttpResponse> {
    const {
      headers: inputHeaders,
      json,
      method = 'GET',
      ...requestInit
    } = options;
    const headers = new Headers(inputHeaders);
    headers.set('Accept', 'application/json');

    if (json !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;

    try {
      response = await this.fetcher(this.resolveUrl(path), {
        ...requestInit,
        method,
        headers,
        body: json === undefined ? undefined : JSON.stringify(json),
      });
    } catch (cause) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.NETWORK_ERROR,
        message: 'Unable to connect to the API.',
        retryable: true,
        cause,
      });
    }

    const body = await this.readResponseBody(response);

    if (!response.ok) {
      throw this.createHttpError(response, body);
    }

    return { response, body };
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
