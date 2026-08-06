# Task Manager UI

Web client for managing projects and tasks. It is built with React, Vite,
TypeScript, React Router, TanStack Query, and Zod.

## Live application

[https://task-manager-ui-go-pass.onrender.com](https://task-manager-ui-go-pass.onrender.com)

The API runs on Render's free tier, so the first request after a period of
inactivity might take a few seconds while the service starts.

## Requirements

- Node.js 22 or later.
- pnpm 9.
- The project API running locally.

## Local setup

1. Start the backend first by following its
   [README](../task-manager-backend/README.md). The API must be available at
   `http://localhost:3000` or `http://127.0.0.1:3000`.

2. In another terminal, enter the UI directory:

   ```bash
   cd task-manager-ui
   ```

3. Install dependencies:

   ```bash
   pnpm install --frozen-lockfile
   ```

4. Create the local configuration:

   ```bash
   cp .env.example .env.local
   ```

   The file must contain the public API URL:

   ```dotenv
   VITE_API_URL=http://127.0.0.1:3000
   ```

5. Start Vite:

   ```bash
   pnpm run dev
   ```

6. Open `http://127.0.0.1:5173/projects`.

If you change Vite's host or port, add that origin to `CORS_ORIGINS` in the
backend.

## Features

- Project listing, creation, editing, and deletion.
- A Kanban board for each project.
- Task creation, retrieval, and editing.
- Server-side filters by status, priority, and search term.
- A project summary with status, priority, overdue tasks, and completion rate.
- Loading, error, empty, and retry states.
- Response and HTTP error validation with Zod.

## Routes

| Route                        | View                                        |
| ---------------------------- | ------------------------------------------- |
| `/projects`                  | Project listing and management.             |
| `/projects/:projectId/board` | Project board, summary, filters, and tasks. |
| `*`                          | Not-found page.                             |

## Internal architecture

The UI is organized by feature. Pages compose components and consume query
options, while HTTP access and data contracts remain outside the presentation
layer.

```mermaid
flowchart LR
  Entry["main.tsx"] --> Providers["AppProviders"]
  Providers --> Router["React Router"]
  Providers --> QueryClient["TanStack Query"]
  Router --> Pages["Feature pages"]
  Pages --> Components["Feature components"]
  Pages --> Queries["Query options + cache keys"]
  Components --> Mutations["Mutations"]
  Queries --> API["Feature API"]
  Mutations --> API
  API --> HttpClient["fetch httpClient"]
  HttpClient --> Zod["Zod contracts"]
  HttpClient --> Backend["Task Manager API"]
  Shared["Shared components and design tokens"] --> Pages
  Shared --> Components
```

Main structure:

```text
src/
├── app/                  # Providers, router, layout, and global styles
├── features/
│   ├── projects/         # Project API, queries, pages, and dialogs
│   ├── tasks/            # Task API, queries, and dialogs
│   └── board/            # Kanban, filters, indicators, and skeletons
└── shared/
    ├── api/              # Fetch client, configuration, and typed errors
    └── components/       # Reusable visual components
```

### Data flow

1. React Router resolves the page and its parameters.
2. The page builds the TanStack Query options.
3. The feature API calls the HTTP client built on `fetch`.
4. Zod validates the response body before it reaches the UI.
5. Mutations update or invalidate the relevant cache entries.
6. Filters remain in the URL to support reloads and navigation.

## Useful scripts

| Command            | Description                                 |
| ------------------ | ------------------------------------------- |
| `pnpm run dev`     | Starts Vite in development mode.            |
| `pnpm run build`   | Checks TypeScript and generates `dist`.     |
| `pnpm run preview` | Serves the production build locally.        |
| `pnpm run lint`    | Runs Oxlint and checks Prettier formatting. |
| `pnpm run format`  | Formats the project.                        |

## Render deployment

The [`../render.yaml`](../render.yaml) file publishes this application as a
static site, configures `VITE_API_URL`, and rewrites browser routes to
`index.html`.
