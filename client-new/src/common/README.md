# Common Directory

This directory contains shared components, hooks, utilities, and types that are used across multiple features in the Solar ERP frontend application.

## Structure

```
common/
├── components/  # Shared React components
├── hooks/       # Shared custom hooks
├── utils/       # Shared utility functions
└── types/       # Shared TypeScript types and interfaces
```

## Components

The `components` directory contains reusable UI components that are used across multiple features. These components should be generic and not tied to any specific feature.

Examples:
- Buttons
- Cards
- Modals
- Form elements
- Tables
- Loading indicators

## Hooks

The `hooks` directory contains custom React hooks that provide reusable logic across multiple features.

Examples:
- `useForm`: Form handling logic
- `usePagination`: Pagination logic
- `useSort`: Sorting logic
- `useFilter`: Filtering logic
- `useLocalStorage`: Local storage access

## Utils

The `utils` directory contains utility functions that are used across multiple features.

Examples:
- Date formatting
- Number formatting
- String manipulation
- Validation functions
- API helpers

## Types

The `types` directory contains TypeScript types and interfaces that are shared across multiple features.

Examples:
- Common entity interfaces
- API response types
- Form types
- UI component props

## Guidelines

1. **Shared Only**: Only add code to the common directory if it's used by multiple features. Feature-specific code should remain in the feature directory.
2. **Minimal Dependencies**: Common components and utilities should have minimal dependencies on other parts of the application.
3. **Documentation**: Document each component, hook, utility, and type with comments and examples.
4. **Testing**: Write tests for common components and utilities to ensure they work correctly across all features.
5. **Consistency**: Maintain consistent naming conventions and coding styles across all common code.