import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField } from '../../../shared/components';
import { createProject, type CreateProjectInput } from '../api/projects.api';
import { projectQueryKeys } from '../queries/projects.queries';
import styles from './create-project-dialog.module.css';

export type CreateProjectDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

type PendingRequest = Readonly<{
  input: Omit<CreateProjectInput, 'idempotencyKey'>;
  idempotencyKey: string;
}>;

export function CreateProjectDialog({
  onClose,
  open,
}: CreateProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingRequestRef = useRef<PendingRequest | null>(null);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string>();

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData<readonly (typeof project)[]>(
        projectQueryKeys.lists(),
        (currentProjects = []) => [project, ...currentProjects],
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.lists(),
      });
      resetAndClose();
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (open && !dialog?.open) {
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (!normalizedName) {
      setNameError('El nombre del proyecto es obligatorio.');
      return;
    }

    const input = {
      name: normalizedName,
      description: normalizedDescription || undefined,
    };
    const pendingRequest = pendingRequestRef.current;
    const canReuseIdempotencyKey =
      pendingRequest !== null && isSameRequest(pendingRequest.input, input);
    const idempotencyKey = canReuseIdempotencyKey
      ? pendingRequest.idempotencyKey
      : createIdempotencyKey();

    pendingRequestRef.current = { input, idempotencyKey };
    setNameError(undefined);
    createProjectMutation.mutate({ ...input, idempotencyKey });
  }

  function resetAndClose() {
    setName('');
    setDescription('');
    setNameError(undefined);
    pendingRequestRef.current = null;
    createProjectMutation.reset();
    onClose();
  }

  function requestClose() {
    if (!createProjectMutation.isPending) {
      resetAndClose();
    }
  }

  return (
    <dialog
      aria-describedby="create-project-description"
      aria-labelledby="create-project-title"
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
            <p className={styles.eyebrow}>Nuevo proyecto</p>
            <h2 className={styles.title} id="create-project-title">
              Crea un espacio de trabajo
            </h2>
            <p className={styles.description} id="create-project-description">
              Añade la información básica. Podrás organizar sus tareas después.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className={styles.closeButton}
            disabled={createProjectMutation.isPending}
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.fields}>
          <TextField
            autoFocus
            disabled={createProjectMutation.isPending}
            error={nameError}
            label="Nombre"
            maxLength={256}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(undefined);
            }}
            placeholder="Ej. Lanzamiento de producto"
            required
            value={name}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="project-description">
              Descripción <span>(opcional)</span>
            </label>
            <textarea
              className={styles.textarea}
              disabled={createProjectMutation.isPending}
              id="project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Resume el objetivo del proyecto"
              rows={4}
              value={description}
            />
          </div>
        </div>

        {createProjectMutation.isError ? (
          <p className={styles.error} role="alert">
            No pudimos crear el proyecto. Revisa la información e inténtalo de
            nuevo.
          </p>
        ) : null}

        <footer className={styles.actions}>
          <Button
            disabled={createProjectMutation.isPending}
            onClick={requestClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={createProjectMutation.isPending} type="submit">
            {createProjectMutation.isPending
              ? 'Creando proyecto…'
              : 'Crear proyecto'}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

function isSameRequest(
  previous: PendingRequest['input'] | undefined,
  current: PendingRequest['input'],
): boolean {
  return (
    previous?.name === current.name &&
    previous.description === current.description
  );
}

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const randomValues = globalThis.crypto.getRandomValues(new Uint32Array(4));
  return `${Date.now()}-${Array.from(randomValues).join('-')}`;
}
