import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField } from '../../../shared/components';
import {
  updateTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from '../api/tasks.api';
import { taskQueryKeys } from '../queries/tasks.queries';
import { projectQueryKeys } from '../../projects/queries/projects.queries';
import styles from './create-task-dialog.module.css';

export type UpdateTaskDialogProps = Readonly<{
  task: Task | null;
  onClose: () => void;
}>;

export function UpdateTaskDialog({ onClose, task }: UpdateTaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [titleError, setTitleError] = useState<string>();

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(
        taskQueryKeys.detail(updatedTask.projectId, updatedTask.id),
        updatedTask,
      );
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(updatedTask.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(updatedTask.projectId),
      });
      closeDialog();
    },
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? toLocalDateTime(task.dueDate) : '');
      setTitleError(undefined);
    }
  }, [task]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (task && !dialog?.open) {
      dialog?.showModal();
    } else if (!task && dialog?.open) {
      dialog.close();
    }
  }, [task]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) return;

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setTitleError('El título de la tarea es obligatorio.');
      return;
    }

    const input: UpdateTaskInput = {
      projectId: task.projectId,
      taskId: task.id,
      title: normalizedTitle,
      description: description.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    setTitleError(undefined);
    updateTaskMutation.mutate(input);
  }

  function closeDialog() {
    setTitleError(undefined);
    updateTaskMutation.reset();
    onClose();
  }

  function requestClose() {
    if (!updateTaskMutation.isPending) {
      closeDialog();
    }
  }

  return (
    <dialog
      aria-describedby="update-task-description"
      aria-labelledby="update-task-title"
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
            <p className={styles.eyebrow}>Editar tarea</p>
            <h2 className={styles.title} id="update-task-title">
              Actualiza la tarea
            </h2>
            <p className={styles.description} id="update-task-description">
              Modifica su contenido o muévela a otro estado del tablero.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className={styles.closeButton}
            disabled={updateTaskMutation.isPending}
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.fields}>
          <TextField
            autoFocus
            disabled={updateTaskMutation.isPending}
            error={titleError}
            label="Título"
            maxLength={150}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) setTitleError(undefined);
            }}
            required
            value={title}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="updated-task-description">
              Descripción <span>(opcional)</span>
            </label>
            <textarea
              className={styles.textarea}
              disabled={updateTaskMutation.isPending}
              id="updated-task-description"
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              value={description}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="updated-task-status">
                Estado
              </label>
              <select
                className={styles.control}
                disabled={updateTaskMutation.isPending}
                id="updated-task-status"
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                value={status}
              >
                <option value="pending">Por hacer</option>
                <option value="in-progress">En progreso</option>
                <option value="completed">Finalizada</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="updated-task-priority">
                Prioridad
              </label>
              <select
                className={styles.control}
                disabled={updateTaskMutation.isPending}
                id="updated-task-priority"
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
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="updated-task-due-date">
              Fecha límite <span>(opcional)</span>
            </label>
            <input
              className={styles.control}
              disabled={updateTaskMutation.isPending}
              id="updated-task-due-date"
              onChange={(event) => setDueDate(event.target.value)}
              type="datetime-local"
              value={dueDate}
            />
          </div>
        </div>

        {updateTaskMutation.isError ? (
          <p className={styles.error} role="alert">
            No pudimos actualizar la tarea. Inténtalo nuevamente.
          </p>
        ) : null}

        <footer className={styles.actions}>
          <Button
            disabled={updateTaskMutation.isPending}
            onClick={requestClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={updateTaskMutation.isPending} type="submit">
            {updateTaskMutation.isPending
              ? 'Guardando cambios…'
              : 'Guardar cambios'}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  const offsetInMilliseconds = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetInMilliseconds)
    .toISOString()
    .slice(0, 16);
}
