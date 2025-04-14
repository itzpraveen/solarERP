# Task Management Implementation Plan - Phase 1

This document outlines the plan for implementing the core task management features within the SolarERP project.

## Current System State Summary

*   **Database:** The `Project` model (`src/api/models/project.model.js`) supports storing tasks with description, status, assignee, and due date within a `tasks` array.
*   **Backend API:** The project controller (`src/api/controllers/project.controller.js`) currently lacks specific endpoints to create, read, update, or delete these tasks.
*   **Frontend UI:** The project details page (`client-new/src/pages/projects/ProjectDetails.tsx`) includes a "Tasks" tab, but the component it renders (`client-new/src/pages/projects/ProjectTasksTab.tsx`) is a non-functional placeholder.

## Phase 1: Implement Core Task CRUD Functionality

This phase focuses on building the essential Create, Read, Update, and Delete (CRUD) operations for tasks associated with a project.

### 1. Backend API Development (`src/api/`)

*   **Define Routes:** Add new routes to `src/api/routes/project.routes.js` for task management:
    *   `POST /api/projects/:id/tasks`: Add a new task to the specified project.
    *   `PATCH /api/projects/:id/tasks/:taskId`: Update an existing task within the specified project.
    *   `DELETE /api/projects/:id/tasks/:taskId`: Delete a task from the specified project.
    *   *(Note: Fetching tasks will likely be handled by populating the `tasks` array when fetching the main project details, rather than a separate GET route for tasks).*
*   **Implement Controllers:** Create corresponding controller functions in `src/api/controllers/project.controller.js`:
    *   These functions will locate the relevant project using the `:id`.
    *   They will use Mongoose array update operators (`$push` for add, `$set` with arrayFilters for update, `$pull` for delete) to modify the `tasks` array within the found `Project` document.
    *   Implement necessary input validation (e.g., required fields for new tasks) and authorization checks (ensure the user has permission to modify the project/tasks).

### 2. Frontend Service Layer (`client-new/src/api/projectService.ts`)

*   Add new functions to this service file to interact with the newly created backend API endpoints:
    *   `addTask(projectId, taskData)`: Calls `POST /api/projects/:projectId/tasks`.
    *   `updateTask(projectId, taskId, updateData)`: Calls `PATCH /api/projects/:projectId/tasks/:taskId`.
    *   `deleteTask(projectId, taskId)`: Calls `DELETE /api/projects/:projectId/tasks/:taskId`.

### 3. Frontend UI Implementation (`client-new/src/pages/projects/ProjectTasksTab.tsx`)

*   **Fetch & Display Tasks:**
    *   Modify the component to receive the project data (including the `tasks` array) as a prop or fetch it using the `projectId`.
    *   Render the list of tasks associated with the project. Display key information like description, status, assignee (user name), and due date. Consider using MUI components like `List`, `Card`, or `Table`.
*   **Add Task Functionality:**
    *   Implement the "Add Task" button to open a modal/dialog (e.g., using MUI `Dialog`).
    *   The dialog should contain a form with fields for task description, assignee (perhaps a dropdown populated with project team members or all users), and due date (a date picker).
    *   On form submission, call the `addTask` function from `projectService` and then refresh the task list displayed in the tab (either by re-fetching project data or updating local state).
*   **Update Task Functionality:**
    *   For each displayed task, provide controls to modify its details:
        *   Status: Dropdown (e.g., 'todo', 'in_progress', 'done', 'blocked').
        *   Assignee: Dropdown.
        *   Description/Due Date: An "Edit" button opening a similar dialog/form as the "Add Task" one, pre-filled with existing data.
    *   When changes are saved, call the `updateTask` function from `projectService` and update the UI.
*   **Delete Task Functionality:**
    *   Add a "Delete" button/icon to each task.
    *   On click, show a confirmation dialog.
    *   If confirmed, call the `deleteTask` function from `projectService` and remove the task from the UI.

## Data Flow Diagram

```mermaid
graph TD
    A[Frontend: User interacts with Tasks Tab] --> B{ProjectTasksTab Component};
    B --> C[projectService: addTask/updateTask/deleteTask];
    C --> D[Backend API: /api/projects/:id/tasks/...];
    D --> E{Project Controller: Task Functions};
    E --> F[Project Model: Modify 'tasks' array];
    F --> G[Database: Persist changes];
    G --> F;
    F --> E;
    E --> D;
    D --> C;
    C --> B;
    B --> A;

    subgraph Frontend (client-new)
        B
        C
    end

    subgraph Backend (src)
        D
        E
        F
    end

    subgraph Database
        G[MongoDB]
    end

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#ccf,stroke:#333,stroke-width:2px
    style Database fill:#cfc,stroke:#333,stroke-width:2px