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

export type Project = z.infer<typeof projectSchema>;

export async function listProjects(): Promise<readonly Project[]> {
  const response = await httpClient.request('/projects', {
    responseSchema: listProjectsResponseSchema,
  });

  return response.projects;
}
