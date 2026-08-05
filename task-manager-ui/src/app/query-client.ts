import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../shared/api/api-error';

const QUERY_STALE_TIME_MS = 30_000;
const MAX_QUERY_RETRIES = 1;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && !error.retryable) {
          return false;
        }

        return failureCount < MAX_QUERY_RETRIES;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
