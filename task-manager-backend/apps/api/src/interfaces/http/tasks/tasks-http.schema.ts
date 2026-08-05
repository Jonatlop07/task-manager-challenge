import { ApiInterfaceError } from '@api/interfaces/http/errors/api-interface.error';
import {
  HTTP_ERROR_CODES,
  HTTP_ERROR_MESSAGES,
} from '@api/interfaces/http/errors/http-error.constants';
import { TaskPriority } from '@task/domain';
import z from 'zod';
import { TASK_HTTP_LIMITS } from './tasks-http.constants';

const taskCollectionParamsSchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1)
    .max(TASK_HTTP_LIMITS.PROJECT_ID_MAX_LENGTH),
});

const createTaskHttpRequestSchema = z.object({
  title: z.string().trim().min(1).max(TASK_HTTP_LIMITS.TITLE_MAX_LENGTH),
  description: z.string().trim().min(1).nullable().optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
});

export type CreateTaskHttpRequest = z.infer<typeof createTaskHttpRequestSchema>;

export type TaskCollectionParams = z.infer<typeof taskCollectionParamsSchema>;

export const parseCreateTaskHttpRequest = (
  value: unknown,
): CreateTaskHttpRequest => {
  const result = createTaskHttpRequestSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );
  }

  return result.data;
};

export const parseTaskCollectionParams = (
  value: unknown,
): TaskCollectionParams => {
  const result = taskCollectionParamsSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_PARAM,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_PARAM,
    );
  }

  return result.data;
};
