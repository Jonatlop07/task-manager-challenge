import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../shared/components';
import { deleteProject, type Project } from '../api/projects.api';
import { projectQueryKeys } from '../queries/projects.queries';
import dialogStyles from './create-project-dialog.module.css';
import styles from './delete-project-dialog.module.css';

export type DeleteProjectDialogProps = Readonly<{
  project: Project | null;
  onClose: () => void;
}>;

export function DeleteProjectDialog({
  onClose,
  project,
}: DeleteProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedProjectId) => {
      queryClient.setQueryData<readonly Project[]>(
        projectQueryKeys.lists(),
        (currentProjects = []) =>
          currentProjects.filter(
            (currentProject) => currentProject.id !== deletedProjectId,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.lists(),
      });
      closeDialog();
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (project && !dialog?.open) {
      dialog?.showModal();
    } else if (!project && dialog?.open) {
      dialog.close();
    }
  }, [project]);

  function closeDialog() {
    deleteProjectMutation.reset();
    onClose();
  }

  function requestClose() {
    if (!deleteProjectMutation.isPending) {
      closeDialog();
    }
  }

  function confirmDeletion() {
    if (project) {
      deleteProjectMutation.mutate(project.id);
    }
  }

  return (
    <dialog
      aria-describedby="delete-project-description"
      aria-labelledby="delete-project-title"
      className={dialogStyles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
      ref={dialogRef}
    >
      <div className={dialogStyles.form}>
        <header className={dialogStyles.header}>
          <div>
            <p className={styles.eyebrow}>Eliminar proyecto</p>
            <h2 className={dialogStyles.title} id="delete-project-title">
              ¿Eliminar este proyecto?
            </h2>
            <p
              className={dialogStyles.description}
              id="delete-project-description"
            >
              Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className={dialogStyles.closeButton}
            disabled={deleteProjectMutation.isPending}
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.projectSummary}>
            <span className={styles.projectLabel}>Proyecto</span>
            <strong>{project?.name}</strong>
            {project?.description ? <p>{project.description}</p> : null}
          </div>

          {deleteProjectMutation.isError ? (
            <p className={styles.error} role="alert">
              No pudimos eliminar el proyecto. Inténtalo nuevamente.
            </p>
          ) : null}
        </div>

        <footer className={dialogStyles.actions}>
          <Button
            disabled={deleteProjectMutation.isPending}
            onClick={requestClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            disabled={deleteProjectMutation.isPending}
            onClick={confirmDeletion}
            type="button"
            variant="danger"
          >
            {deleteProjectMutation.isPending
              ? 'Eliminando proyecto…'
              : 'Eliminar proyecto'}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
