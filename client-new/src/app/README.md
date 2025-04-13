# App Directory

This directory contains the core application setup and configuration for the Solar ERP frontend application.

## Files

- **App.tsx**: The main application component that sets up the application structure, including routing, theme, and global providers.
- **routes.tsx**: Centralized routing configuration for the application.
- **store.ts**: Global state management setup (if using Redux or another state management library).

## Purpose

The app directory serves as the entry point and configuration hub for the application. It connects all the features together and provides the global application structure.

## App.tsx

The `App.tsx` file is the main application component that:

1. Sets up the application theme using Material UI's ThemeProvider
2. Configures global providers (Auth, API, etc.)
3. Sets up the routing structure
4. Handles global error boundaries
5. Configures global styles

## routes.tsx

The `routes.tsx` file centralizes all routing configuration for the application. It:

1. Defines all routes for the application
2. Sets up route protection (private routes)
3. Configures route layouts
4. Handles route redirects

## store.ts

If the application uses a global state management solution like Redux, the `store.ts` file configures:

1. The global store setup
2. Root reducer configuration
3. Middleware setup
4. Store enhancers
5. Initial state

## Guidelines

1. **Minimal Logic**: Keep business logic out of the app directory. It should focus on application setup and configuration.
2. **Feature Independence**: The app directory should connect features without creating tight coupling between them.
3. **Clear Structure**: Maintain a clear and organized structure to make it easy for new developers to understand the application architecture.
4. **Documentation**: Document the application setup and configuration to help onboarding new developers.