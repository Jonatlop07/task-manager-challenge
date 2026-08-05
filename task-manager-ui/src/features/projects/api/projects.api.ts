import { z } from 'zod';
import { httpClient } from '../../../shared/api/http-client';

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
});

const listProjectsResponseSchema = z.object({
  projects: z.array(projectSchema),
});

const createProjectResponseSchema = z.object({
  project: projectSchema,
  idempotentReplay: z.boolean(),
});

export type Project = z.infer<typeof projectSchema>;

export type CreateProjectInput = Readonly<{
  name: string;
  description?: string;
  idempotencyKey: string;
}>;

export async function listProjects(): Promise<readonly Project[]> {
  const response = await httpClient.request('/projects', {
    responseSchema: listProjectsResponseSchema,
  });

  return response.projects;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await httpClient.request('/projects', {
    method: 'POST',
    headers: {
      'Idempotency-Key': input.idempotencyKey,
    },
    json: {
      name: input.name,
      description: input.description,
    },
    responseSchema: createProjectResponseSchema,
  });

  return response.project;
}
