import { useEffect, useState, type SubmitEvent } from 'react';
import { Button, Card } from '../../../shared/components';
import type {
  ListTasksFilters,
  TaskPriority,
  TaskStatus,
} from '../../tasks/api/tasks.api';
import styles from './task-filters.module.css';

export type TaskFiltersProps = Readonly<{
  filters: ListTasksFilters;
  isFetching: boolean;
  resultCount?: number;
  onChange: (filters: ListTasksFilters) => void;
}>;

export function TaskFilters({
  filters,
  isFetching,
  onChange,
  resultCount,
}: TaskFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const hasFilters = Boolean(
    filters.status || filters.priority || filters.search,
  );

  useEffect(() => {
    setSearch(filters.search ?? '');
  }, [filters.search]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...filters, search: search.trim() || undefined });
  }

  return (
    <Card className={styles.card}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.searchField}>
          <label htmlFor="task-search">Buscar tareas</label>
          <input
            id="task-search"
            maxLength={150}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Título o descripción"
            type="search"
            value={search}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="task-status-filter">Estado</label>
          <select
            id="task-status-filter"
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value
                  ? (event.target.value as TaskStatus)
                  : undefined,
              })
            }
            value={filters.status ?? ''}
          >
            <option value="">Todos</option>
            <option value="pending">Por hacer</option>
            <option value="in-progress">En progreso</option>
            <option value="completed">Finalizadas</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="task-priority-filter">Prioridad</label>
          <select
            id="task-priority-filter"
            onChange={(event) =>
              onChange({
                ...filters,
                priority: event.target.value
                  ? (event.target.value as TaskPriority)
                  : undefined,
              })
            }
            value={filters.priority ?? ''}
          >
            <option value="">Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div className={styles.actions}>
          <Button type="submit">Buscar</Button>
          {hasFilters ? (
            <Button
              onClick={() => {
                setSearch('');
                onChange({});
              }}
              type="button"
              variant="ghost"
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      <p aria-live="polite" className={styles.resultCount}>
        {isFetching
          ? 'Actualizando resultados…'
          : formatResultCount(resultCount)}
      </p>
    </Card>
  );
}

function formatResultCount(count?: number): string {
  if (count === undefined) return '';
  return count === 1 ? '1 resultado' : `${count} resultados`;
}
