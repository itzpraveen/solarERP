/**
 * Frontend constants for permissions.
 * These should ideally mirror the backend definitions.
 */

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage:users',
  VIEW_USERS: 'view:users',

  // Leads
  CREATE_LEAD: 'create:lead',
  VIEW_LEADS: 'view:leads',
  EDIT_LEAD: 'edit:lead',
  DELETE_LEAD: 'delete:lead',
  CONVERT_LEAD: 'convert:lead',

  // Customers
  CREATE_CUSTOMER: 'create:customer',
  VIEW_CUSTOMERS: 'view:customers',
  EDIT_CUSTOMER: 'edit:customer',
  DELETE_CUSTOMER: 'delete:customer',

  // Proposals
  CREATE_PROPOSAL: 'create:proposal',
  VIEW_PROPOSALS: 'view:proposals',
  EDIT_PROPOSAL: 'edit:proposal',
  DELETE_PROPOSAL: 'delete:proposal',
  SEND_PROPOSAL: 'send:proposal',

  // Projects
  CREATE_PROJECT: 'create:project',
  VIEW_PROJECTS: 'view:projects',
  EDIT_PROJECT_DETAILS: 'edit:project_details',
  EDIT_PROJECT_STATUS: 'edit:project_status',
  EDIT_PROJECT_FINANCIALS: 'edit:project_financials',
  DELETE_PROJECT: 'delete:project',
  VIEW_PROJECT_FINANCIALS: 'view:project_financials',

  // Documents
  UPLOAD_DOCUMENT: 'upload:document',
  VIEW_DOCUMENTS: 'view:documents',
  DELETE_DOCUMENT: 'delete:document',

  // Reports
  VIEW_REPORTS: 'view:reports',

  // Settings
  MANAGE_SETTINGS: 'manage:settings',
};

// Helper function (can be expanded if needed)
export const hasPermission = (
  userPermissions: string[] | undefined,
  requiredPermission: string
): boolean => {
  if (!userPermissions) {
    return false;
  }
  // TODO: Consider adding role-based implicit permissions if needed (e.g., admin always true)
  return userPermissions.includes(requiredPermission);
};

// Add empty export to satisfy --isolatedModules
export {};
