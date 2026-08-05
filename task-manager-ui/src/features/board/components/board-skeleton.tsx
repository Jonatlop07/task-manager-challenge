import { Card } from '../../../shared/components';
import styles from './board-skeleton.module.css';

export function BoardSkeleton() {
  return (
    <div aria-label="Cargando tareas" className={styles.board} role="status">
      {[0, 1, 2].map((column) => (
        <Card className={styles.column} key={column}>
          <div className={`${styles.line} ${styles.heading}`} />
          {[0, 1].map((task) => (
            <div className={styles.task} key={task}>
              <div className={`${styles.line} ${styles.title}`} />
              <div className={`${styles.line} ${styles.copy}`} />
              <div className={`${styles.line} ${styles.meta}`} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
