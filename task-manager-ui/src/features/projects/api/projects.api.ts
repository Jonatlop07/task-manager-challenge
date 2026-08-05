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

const projectSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    pending: z.number().int().nonnegative(),
    inProgress: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
  }),
  byPriority: z.object({
    low: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
  }),
  overdue: z.number().int().nonnegative(),
  completionPercentage: z.number().min(0).max(100),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export type CreateProjectInput = Readonly<{
  name: string;
  description?: string;
  idempotencyKey: string;
}>;

export type UpdateProjectInput = Readonly<{
  projectId: string;
  name: string;
  description: string | null;
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

export async function updateProject(
  input: UpdateProjectInput,
): Promise<Project> {
  const response = await httpClient.request(
    `/projects/${encodeURIComponent(input.projectId)}`,
    {
      method: 'PATCH',
      json: {
        name: input.name,
        description: input.description,
      },
      responseSchema: z.object({ project: projectSchema }),
    },
  );

  return response.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await httpClient.requestVoid(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}

export async function getProjectSummary(
  projectId: string,
): Promise<ProjectSummary> {
  return httpClient.request(
    `/projects/${encodeURIComponent(projectId)}/summary`,
    { responseSchema: projectSummarySchema },
  );
}
