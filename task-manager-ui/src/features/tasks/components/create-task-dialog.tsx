import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField } from '../../../shared/components';
import { createTask, type TaskPriority } from '../api/tasks.api';
import { taskQueryKeys } from '../queries/tasks.queries';
import { projectQueryKeys } from '../../projects/queries/projects.queries';
import styles from './create-task-dialog.module.css';

export type CreateTaskDialogProps = Readonly<{
  open: boolean;
  projectId: string;
  onClose: () => void;
}>;

export function CreateTaskDialog({
  onClose,
  open,
  projectId,
}: CreateTaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [titleError, setTitleError] = useState<string>();

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(projectId),
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

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle) {
      setTitleError('El título de la tarea es obligatorio.');
      return;
    }

    setTitleError(undefined);
    createTaskMutation.mutate({
      projectId,
      title: normalizedTitle,
      description: normalizedDescription || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  }

  function resetAndClose() {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTitleError(undefined);
    createTaskMutation.reset();
    onClose();
  }

  function requestClose() {
    if (!createTaskMutation.isPending) {
      resetAndClose();
    }
  }

  return (
    <dialog
      aria-describedby="create-task-description"
      aria-labelledby="create-task-title"
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
            <p className={styles.eyebrow}>Nueva tarea</p>
            <h2 className={styles.title} id="create-task-title">
              Añade trabajo al tablero
            </h2>
            <p className={styles.description} id="create-task-description">
              La tarea se agregará inicialmente a la columna Por hacer.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className={styles.closeButton}
            disabled={createTaskMutation.isPending}
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.fields}>
          <TextField
            autoFocus
            disabled={createTaskMutation.isPending}
            error={titleError}
            label="Título"
            maxLength={150}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) setTitleError(undefined);
            }}
            placeholder="Ej. Preparar propuesta"
            required
            value={title}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-description">
              Descripción <span>(opcional)</span>
            </label>
            <textarea
              className={styles.textarea}
              disabled={createTaskMutation.isPending}
              id="task-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Añade contexto o criterios de finalización"
              rows={4}
              value={description}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="task-priority">
                Prioridad
              </label>
              <select
                className={styles.control}
                disabled={createTaskMutation.isPending}
                id="task-priority"
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                value={priority}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="task-due-date">
                Fecha límite <span>(opcional)</span>
              </label>
              <input
                className={styles.control}
                disabled={createTaskMutation.isPending}
                id="task-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                type="datetime-local"
                value={dueDate}
              />
            </div>
          </div>
        </div>

        {createTaskMutation.isError ? (
          <p className={styles.error} role="alert">
            No pudimos crear la tarea. Revisa la información e inténtalo de
            nuevo.
          </p>
        ) : null}

        <footer className={styles.actions}>
          <Button
            disabled={createTaskMutation.isPending}
            onClick={requestClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={createTaskMutation.isPending} type="submit">
            {createTaskMutation.isPending ? 'Creando tarea…' : 'Crear tarea'}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}
