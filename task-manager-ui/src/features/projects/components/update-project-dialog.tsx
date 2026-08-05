import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField } from '../../../shared/components';
import {
  updateProject,
  type Project,
  type UpdateProjectInput,
} from '../api/projects.api';
import { projectQueryKeys } from '../queries/projects.queries';
import styles from './create-project-dialog.module.css';

export type UpdateProjectDialogProps = Readonly<{
  project: Project | null;
  onClose: () => void;
}>;

export function UpdateProjectDialog({
  onClose,
  project,
}: UpdateProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string>();

  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<readonly Project[]>(
        projectQueryKeys.lists(),
        (currentProjects = []) =>
          currentProjects.map((currentProject) =>
            currentProject.id === updatedProject.id
              ? updatedProject
              : currentProject,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.lists(),
      });
      closeDialog();
    },
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setNameError(undefined);
    }
  }, [project]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (project && !dialog?.open) {
      dialog?.showModal();
    } else if (!project && dialog?.open) {
      dialog.close();
    }
  }, [project]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) return;

    const normalizedName = name.trim();

    if (!normalizedName) {
      setNameError('El nombre del proyecto es obligatorio.');
      return;
    }

    const input: UpdateProjectInput = {
      projectId: project.id,
      name: normalizedName,
      description: description.trim() || null,
    };

    setNameError(undefined);
    updateProjectMutation.mutate(input);
  }

  function closeDialog() {
    setNameError(undefined);
    updateProjectMutation.reset();
    onClose();
  }

  function requestClose() {
    if (!updateProjectMutation.isPending) {
      closeDialog();
    }
  }

  return (
    <dialog
      aria-describedby="update-project-description"
      aria-labelledby="update-project-title"
      className={styles.dialog}
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
      <form className={styles.form} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Editar proyecto</p>
            <h2 className={styles.title} id="update-project-title">
              Actualiza la información
            </h2>
            <p className={styles.description} id="update-project-description">
              Modifica el nombre o la descripción del proyecto.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className={styles.closeButton}
            disabled={updateProjectMutation.isPending}
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.fields}>
          <TextField
            autoFocus
            disabled={updateProjectMutation.isPending}
            error={nameError}
            label="Nombre"
            maxLength={256}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(undefined);
            }}
            required
            value={name}
          />

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="updated-project-description"
            >
              Descripción <span>(opcional)</span>
            </label>
            <textarea
              className={styles.textarea}
              disabled={updateProjectMutation.isPending}
              id="updated-project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Resume el objetivo del proyecto"
              rows={4}
              value={description}
            />
          </div>
        </div>

        {updateProjectMutation.isError ? (
          <p className={styles.error} role="alert">
            No pudimos actualizar el proyecto. Inténtalo nuevamente.
          </p>
        ) : null}

        <footer className={styles.actions}>
          <Button
            disabled={updateProjectMutation.isPending}
            onClick={requestClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={updateProjectMutation.isPending} type="submit">
            {updateProjectMutation.isPending
              ? 'Guardando cambios…'
              : 'Guardar cambios'}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}
