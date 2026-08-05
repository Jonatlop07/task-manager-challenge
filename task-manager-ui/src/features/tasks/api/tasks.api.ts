import { z } from 'zod';
import { httpClient } from '../../../shared/api/http-client';

const taskStatusSchema = z.enum(['pending', 'in-progress', 'completed']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.iso.datetime().nullable(),
});

const listTasksResponseSchema = z.object({
  tasks: z.array(taskSchema),
});

const createTaskResponseSchema = z.object({
  task: taskSchema,
});

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export type CreateTaskInput = Readonly<{
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
}>;

export async function createTask({
  projectId,
  ...body
}: CreateTaskInput): Promise<Task> {
  const response = await httpClient.request(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    {
      method: 'POST',
      json: body,
      responseSchema: createTaskResponseSchema,
    },
  );

  return response.task;
}

export async function listTasks(projectId: string): Promise<readonly Task[]> {
  const response = await httpClient.request(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    { responseSchema: listTasksResponseSchema },
  );

  return response.tasks;
}
