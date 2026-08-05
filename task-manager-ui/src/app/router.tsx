import { Navigate, createBrowserRouter } from 'react-router';
import App from '../App';
import { ProjectBoardPage } from '../features/board/pages/project-board.page';
import { ProjectsPage } from '../features/projects/pages/projects.page';
import { NotFoundPage } from './not-found.page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId/board',
        element: <ProjectBoardPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
