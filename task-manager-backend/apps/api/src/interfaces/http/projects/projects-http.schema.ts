import z from 'zod';
import { ApiInterfaceError } from '../errors/api-interface.error';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '../errors/http-error.constants';
import { PROJECT_HTTP_LIMITS } from './projects-http.constants';

const projectStringIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(PROJECT_HTTP_LIMITS.ID_MAX_LENGTH);

const createProjectHttpRequestSchema = z.object({
  name: z.string().trim().min(1).max(256),
  description: z.string().trim().min(1).optional(),
});

const updateProjectHttpRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(256).optional(),
    description: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    ({ name, description }) => name !== undefined || description !== undefined,
  );

const projectLifecycleParamsSchema = z.object({
  projectId: projectStringIdSchema,
});

export type CreateProjectHttpRequest = z.infer<
  typeof createProjectHttpRequestSchema
>;

export type UpdateProjectHttpRequest = z.infer<
  typeof updateProjectHttpRequestSchema
>;

export type ProjectLifecycleParams = z.infer<
  typeof projectLifecycleParamsSchema
>;

export const parseCreateProjectHttpRequest = (
  value: unknown,
): CreateProjectHttpRequest => {
  const result = createProjectHttpRequestSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );
  }

  return result.data;
};

export const parseUpdateProjectHttpRequest = (
  value: unknown,
): UpdateProjectHttpRequest => {
  const result = updateProjectHttpRequestSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );
  }

  return result.data;
};

export const parseProjectLifecycleParams = (
  value: unknown,
): ProjectLifecycleParams => {
  const result = projectLifecycleParamsSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
    );
  }

  return result.data;
};
