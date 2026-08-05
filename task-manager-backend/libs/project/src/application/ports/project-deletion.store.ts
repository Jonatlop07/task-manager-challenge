export interface ProjectDeletionStore {
  delete(projectId: string): Promise<boolean>;
}
