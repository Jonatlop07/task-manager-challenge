import { useParams } from 'react-router';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <main>
      <h1>Tablero del proyecto</h1>
      <p>{projectId}</p>
    </main>
  );
}
