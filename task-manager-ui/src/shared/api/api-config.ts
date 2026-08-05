import { z } from 'zod';

const apiEnvironmentSchema = z.object({
  VITE_API_URL: z.url(),
});

const environment = apiEnvironmentSchema.parse(import.meta.env);

export const apiConfig = {
  baseUrl: environment.VITE_API_URL.replace(/\/$/, ''),
} as const;
