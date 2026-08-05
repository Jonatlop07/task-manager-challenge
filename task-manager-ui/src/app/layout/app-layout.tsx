import { NavLink, Outlet } from 'react-router';
import styles from './app-layout.module.css';

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <NavLink className={styles.brand} to="/projects">
            <span className={styles.brandMark} aria-hidden="true">
              T
            </span>
            <span>Task Manager</span>
          </NavLink>

          <nav aria-label="Navegación principal">
            <NavLink
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              to="/projects"
            >
              Proyectos
            </NavLink>
          </nav>
        </div>
      </header>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
