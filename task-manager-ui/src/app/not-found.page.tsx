import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main>
      <h1>Página no encontrada</h1>
      <Link to="/projects">Volver a proyectos</Link>
    </main>
  );
}
