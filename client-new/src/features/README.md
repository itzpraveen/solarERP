# Features Directory

This directory contains feature-based modules for the Solar ERP frontend application. Each feature is a self-contained unit that includes all the necessary components, hooks, services, and types related to that feature.

## Architecture

Each feature follows a consistent structure:

```
features/
├── auth/
│   ├── components/  # React components specific to auth
│   ├── hooks/       # Custom hooks for auth-related logic
│   ├── services/    # API services for auth
│   ├── types/       # TypeScript types and interfaces
│   └── utils/       # Utility functions
├── customers/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── ...
└── ...
```

## Benefits of Feature-Based Architecture

1. **Improved Maintainability**: Each feature is self-contained, making it easier to understand and maintain.
2. **Better Code Organization**: Code is organized by domain rather than by technical role.
3. **Enhanced Developer Experience**: New developers can quickly understand the codebase by focusing on specific features.
4. **Scalability**: New features can be added without affecting existing ones.
5. **Testability**: Features can be tested in isolation.

## Guidelines

1. **Feature Independence**: Features should be as independent as possible. Shared functionality should be moved to the `common` directory.
2. **Consistent Naming**: Use consistent naming conventions across all features.
3. **Encapsulation**: Keep feature-specific code within the feature directory.
4. **Documentation**: Document each feature with comments and README files.
5. **Testing**: Write tests for each feature.

## Current Features

- **Auth**: Authentication and authorization
- **Dashboard**: Main dashboard and analytics
- **Customers**: Customer management
- **Projects**: Project management
- **Services**: Service request management
- **And more...**

## Adding a New Feature

To add a new feature, create a new directory in the `features` directory with the following structure:

```
features/
└── new-feature/
    ├── components/  # React components
    ├── hooks/       # Custom hooks
    ├── services/    # API services
    ├── types/       # TypeScript types
    └── utils/       # Utility functions
```

Then, export the feature's components, hooks, and services from the feature's index file.