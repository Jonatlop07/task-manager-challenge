import z from "zod";
import { ApiInterfaceError } from "../errors/api-interface.error";
import { HTTP_ERROR_CODES, HTTP_ERROR_MESSAGES } from "../errors/http-error.constants";

const createProjectHttpRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(256),
    description: z
      .string()
      .trim()
      .min(1)
      .optional(),
  });

export type CreateProjectHttpRequest = z.infer<typeof createProjectHttpRequestSchema>;

export const parseCreateProjectHttpRequest = (value: unknown): CreateProjectHttpRequest => {
  const result = createProjectHttpRequestSchema.safeParse(value);

  if (!result.success) {
    throw new ApiInterfaceError(
      HTTP_ERROR_CODES.INVALID_REQUEST_BODY,
      HTTP_ERROR_MESSAGES.INVALID_REQUEST_BODY,
    );
  }

  return result.data;
};
