/**
 * Defines default permissions for each user role.
 * Permissions should be granular action strings, e.g., 'read:project', 'create:lead', 'update:user_role'.
 */

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  INSTALLER: 'installer',
  FINANCE: 'finance',
  TECHNICIAN: 'technician', // Add Technician role
  USER: 'user',
};

// Define granular permissions (examples - expand as needed)
const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage:users', // Create, update roles/permissions, delete
  VIEW_USERS: 'view:users',

  // Leads
  CREATE_LEAD: 'create:lead',
  VIEW_LEADS: 'view:leads', // View all or assigned leads
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
  VIEW_PROJECTS: 'view:projects', // View all or assigned projects
  EDIT_PROJECT_DETAILS: 'edit:project_details', // Basic info, team, etc.
  EDIT_PROJECT_STATUS: 'edit:project_status',
  EDIT_PROJECT_FINANCIALS: 'edit:project_financials',
  DELETE_PROJECT: 'delete:project',
  VIEW_PROJECT_FINANCIALS: 'view:project_financials',

  // Equipment
  MANAGE_EQUIPMENT: 'manage:equipment', // Add/edit/delete equipment catalog
  VIEW_EQUIPMENT: 'view:equipment',

  // Documents
  UPLOAD_DOCUMENT: 'upload:document',
  VIEW_DOCUMENTS: 'view:documents',
  DELETE_DOCUMENT: 'delete:document',

  // Reports
  VIEW_REPORTS: 'view:reports',

  // Settings
  MANAGE_SETTINGS: 'manage:settings',

  // Service Requests (Example - Add more as needed)
  VIEW_SERVICE_REQUESTS: 'view:service_requests',
  UPDATE_SERVICE_REQUEST_STATUS: 'update:service_request_status',
};

// Map default permissions to roles
const defaultPermissionsByRole = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin gets all defined permissions

  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.EDIT_LEAD,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMER,
    PERMISSIONS.VIEW_PROPOSALS,
    PERMISSIONS.EDIT_PROPOSAL,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROJECT_DETAILS,
    PERMISSIONS.EDIT_PROJECT_STATUS,
    PERMISSIONS.VIEW_PROJECT_FINANCIALS, // Maybe view only?
    PERMISSIONS.VIEW_EQUIPMENT,
    PERMISSIONS.UPLOAD_DOCUMENT,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_REPORTS,
  ],

  [ROLES.SALES]: [
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.VIEW_LEADS, // Should likely be restricted to own/team leads later
    PERMISSIONS.EDIT_LEAD,
    PERMISSIONS.CONVERT_LEAD,
    PERMISSIONS.CREATE_CUSTOMER, // Or maybe only convert?
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMER,
    PERMISSIONS.CREATE_PROPOSAL,
    PERMISSIONS.VIEW_PROPOSALS, // Own/team proposals
    PERMISSIONS.EDIT_PROPOSAL,
    PERMISSIONS.SEND_PROPOSAL,
    PERMISSIONS.VIEW_PROJECTS, // Related projects
    PERMISSIONS.VIEW_EQUIPMENT,
    PERMISSIONS.UPLOAD_DOCUMENT, // Related to leads/proposals
    PERMISSIONS.VIEW_DOCUMENTS,
  ],

  [ROLES.INSTALLER]: [
    PERMISSIONS.VIEW_PROJECTS, // Assigned projects
    PERMISSIONS.EDIT_PROJECT_STATUS, // Limited status updates?
    // Add permissions for adding notes, issues, viewing assigned documents/equipment
  ],

  [ROLES.FINANCE]: [
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_PROPOSALS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_PROJECT_FINANCIALS,
    PERMISSIONS.EDIT_PROJECT_FINANCIALS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DOCUMENTS, // Financial documents
  ],

  [ROLES.USER]: [
    // Basic view permissions, e.g., view own profile
  ],

  [ROLES.TECHNICIAN]: [
    PERMISSIONS.VIEW_PROJECTS, // Assigned projects
    PERMISSIONS.EDIT_PROJECT_STATUS, // Limited status updates
    PERMISSIONS.VIEW_EQUIPMENT, // View equipment needed for jobs
    PERMISSIONS.VIEW_DOCUMENTS, // View relevant documents/manuals
    PERMISSIONS.VIEW_SERVICE_REQUESTS, // View assigned service requests
    PERMISSIONS.UPDATE_SERVICE_REQUEST_STATUS, // Update status of assigned requests
    // Add permissions for adding notes, viewing assigned customers etc.
  ],
};

const getDefaultPermissions = (role) => {
  return defaultPermissionsByRole[role] || [];
};

module.exports = {
  ROLES,
  PERMISSIONS,
  getDefaultPermissions,
};
