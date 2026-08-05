import { Link } from 'react-router';
import { Card } from '../../../shared/components';
import type { Project } from '../api/projects.api';
import styles from './project-list.module.css';

export type ProjectListProps = Readonly<{
  projects: readonly Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}>;

export function ProjectList({ onDelete, onEdit, projects }: ProjectListProps) {
  return (
    <ul className={styles.grid}>
      {projects.map((project) => (
        <li key={project.id}>
          <Card className={styles.card}>
            <div className={styles.cardActions}>
              <button
                aria-label={`Editar ${project.name}`}
                className={styles.actionButton}
                onClick={() => onEdit(project)}
                type="button"
              >
                Editar
              </button>
              <button
                aria-label={`Eliminar ${project.name}`}
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => onDelete(project)}
                type="button"
              >
                Eliminar
              </button>
            </div>
            <Link className={styles.link} to={`/projects/${project.id}/board`}>
              <div className={styles.identity}>
                <span className={styles.mark} aria-hidden="true">
                  {getProjectInitials(project.name)}
                </span>
                <div className={styles.copy}>
                  <h3 className={styles.name}>{project.name}</h3>
                  <p className={styles.description}>
                    {project.description ?? 'Sin descripción'}
                  </p>
                </div>
              </div>
              <span className={styles.action}>
                Abrir tablero <span aria-hidden="true">→</span>
              </span>
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function getProjectInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
