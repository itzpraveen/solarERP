# Frontend Feature-Based Structure Migration Plan

## Overview

This document outlines the plan for migrating the current frontend structure to a feature-based architecture. The feature-based structure organizes code by domain/feature rather than by technical role, making it easier to understand, maintain, and scale the application.

## Current Structure

The current frontend structure is organized primarily by technical role:

```
client-new/src/
├── api/
│   ├── apiService.ts
│   ├── customerService.ts
│   ├── mockAuthService.ts
│   └── ...
├── components/
│   ├── common/
│   ├── Layout/
│   └── routing/
├── context/
│   ├── AuthContext.tsx
│   └── ...
├── pages/
│   ├── auth/
│   ├── customers/
│   ├── projects/
│   └── ...
├── types/
├── utils/
└── App.tsx
```

## Target Feature-Based Structure

The target structure organizes code by feature/domain:

```
client-new/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── customers/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── projects/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── ...
├── common/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── store.ts
└── index.tsx
```

## Progress So Far

Some components have already been migrated to the feature-based structure:

- `AuthContext.tsx` → `features/auth/context/AuthContext.tsx`
- `User.ts` → `features/auth/types/User.ts`
- `mockAuthService.ts` → `features/auth/services/mockAuthService.ts`

However, many components are still importing from the old structure, and several components need to be moved to their respective feature directories.

## Migration Plan

### Phase 1: Update Imports in Existing Components

Update all components that are still importing from the old structure to use the new paths:

| File | Current Import | New Import |
|------|---------------|------------|
| `App.tsx` | `import { AuthProvider } from './context/AuthContext';` | `import { AuthProvider } from './features/auth/context/AuthContext';` |
| `components/routing/PrivateRoute.tsx` | `import { AuthContext } from '../../context/AuthContext';` | `import { AuthContext } from '../../features/auth/context/AuthContext';` |
| `components/Layout/Header.tsx` | `import { AuthContext } from '../../context/AuthContext';` | `import { AuthContext } from '../../features/auth/context/AuthContext';` |
| `pages/auth/Login.tsx` | `import { AuthContext } from '../../context/AuthContext';` | `import { AuthContext } from '../../features/auth/context/AuthContext';` |
| `pages/Profile.tsx` | `import { AuthContext } from '../context/AuthContext';` | `import { AuthContext } from '../features/auth/context/AuthContext';` |

### Phase 2: Move Components to Feature Directories

Move components to their respective feature directories:

#### Auth Feature

| Source | Destination |
|--------|-------------|
| `pages/auth/Login.tsx` | `features/auth/components/Login.tsx` |
| `pages/auth/Register.tsx` (if exists) | `features/auth/components/Register.tsx` |
| `components/routing/PrivateRoute.tsx` | `features/auth/components/PrivateRoute.tsx` |
| `api/authService.ts` (if exists) | `features/auth/services/authService.ts` |

#### Profile Feature

| Source | Destination |
|--------|-------------|
| `pages/Profile.tsx` | `features/profile/components/Profile.tsx` |

#### Customers Feature

| Source | Destination |
|--------|-------------|
| `pages/customers/Customers.tsx` | `features/customers/components/CustomersList.tsx` |
| `pages/customers/CustomerDetails.tsx` | `features/customers/components/CustomerDetails.tsx` |
| `api/customerService.ts` | `features/customers/services/customerService.ts` |

#### Projects Feature

| Source | Destination |
|--------|-------------|
| `pages/projects/Projects.tsx` | `features/projects/components/ProjectsList.tsx` |
| `pages/projects/ProjectDetails.tsx` | `features/projects/components/ProjectDetails.tsx` |
| `api/projectService.ts` | `features/projects/services/projectService.ts` |

#### Services Feature

| Source | Destination |
|--------|-------------|
| `pages/services/ServiceRequests.tsx` | `features/services/components/ServiceRequestsList.tsx` |
| `pages/services/ServiceRequestDetails.tsx` | `features/services/components/ServiceRequestDetails.tsx` |
| `pages/services/ServiceRequestForm.tsx` | `features/services/components/ServiceRequestForm.tsx` |
| `api/serviceRequestService.ts` | `features/services/services/serviceRequestService.ts` |

#### Dashboard Feature

| Source | Destination |
|--------|-------------|
| `pages/Dashboard.tsx` | `features/dashboard/components/Dashboard.tsx` |

#### Common Components

| Source | Destination |
|--------|-------------|
| `components/Layout/Header.tsx` | `common/components/Layout/Header.tsx` |
| `components/Layout/Sidebar.tsx` | `common/components/Layout/Sidebar.tsx` |
| `components/Layout/MainLayout.tsx` | `common/components/Layout/MainLayout.tsx` |
| `components/common/CurrencyDisplay.tsx` | `common/components/CurrencyDisplay.tsx` |

### Phase 3: Create Feature-Specific Hooks

Create custom hooks for each feature to encapsulate business logic:

- `features/auth/hooks/useAuth.ts`
- `features/customers/hooks/useCustomers.ts`
- `features/projects/hooks/useProjects.ts`
- `features/services/hooks/useServiceRequests.ts`

### Phase 4: Update App.tsx and Routing

Update the App.tsx file to import components from their new locations and consider implementing a more modular routing approach where each feature defines its routes.

### Phase 5: Implement Barrel Exports

Add index.ts files in each feature directory to export its components, making imports cleaner:

```typescript
// features/auth/index.ts
export { default as Login } from './components/Login';
export { default as PrivateRoute } from './components/PrivateRoute';
export { AuthProvider, AuthContext } from './context/AuthContext';
export { default as useAuth } from './hooks/useAuth';
export * from './types/User';
```

## Best Practices for Feature-Based Structure

1. **Feature Independence**: Each feature should be as independent as possible, with minimal dependencies on other features.

2. **Shared Code**: Common utilities, components, and types should be placed in the `common` directory.

3. **Encapsulation**: Features should encapsulate their internal implementation details and expose a clean API through barrel exports.

4. **Consistent Structure**: Maintain a consistent structure across all features to make the codebase more predictable and easier to navigate.

5. **Avoid Circular Dependencies**: Be careful to avoid circular dependencies between features. If two features need to share code, consider moving that code to the `common` directory.

6. **Feature-Specific State**: Each feature should manage its own state, either through context, hooks, or a state management library.

7. **Feature-Specific Routes**: Consider defining routes at the feature level and then combining them in the main routing configuration.

## Implementation Timeline

1. **Week 1**: Update imports in existing components (Phase 1)
2. **Week 2**: Move auth and profile components to feature directories (Phase 2 - partial)
3. **Week 3**: Move remaining components to feature directories (Phase 2 - completion)
4. **Week 4**: Create feature-specific hooks and update App.tsx (Phases 3 and 4)
5. **Week 5**: Implement barrel exports and finalize the migration (Phase 5)

## Conclusion

This migration plan provides a structured approach to transitioning from the current frontend structure to a feature-based architecture. By following this plan, we can ensure a smooth migration with minimal disruption to the development workflow.

The feature-based structure will make the codebase more maintainable, scalable, and easier to understand, ultimately leading to a more efficient development process and a better user experience.