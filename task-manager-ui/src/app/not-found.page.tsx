import { Link } from 'react-router';
import { Card, EmptyState } from '../shared/components';
import styles from './not-found.page.module.css';

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <Card>
        <EmptyState
          title="Página no encontrada"
          description="La dirección no existe o fue movida."
          action={
            <Link className={styles.link} to="/projects">
              Volver a proyectos
            </Link>
          }
        />
      </Card>
    </main>
  );
}
