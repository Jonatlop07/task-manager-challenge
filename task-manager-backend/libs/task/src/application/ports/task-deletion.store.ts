export type DeleteTaskInput = Readonly<{
  projectId: string;
  taskId: string;
}>;

export interface TaskDeletionStore {
  delete(input: DeleteTaskInput): Promise<boolean>;
}
