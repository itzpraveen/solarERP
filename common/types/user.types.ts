/**
 * Shared User interface representing core user properties.
 * Used across both frontend and backend.
 */
export interface SharedUser {
  _id: string; // Corresponds to MongoDB's default ID
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'manager' | 'sales' | 'installer' | 'finance' | 'technician'; // Keep roles consistent
  permissions: string[];
  avatar?: string; // Optional avatar URL
  createdAt?: Date; // Optional timestamp
  updatedAt?: Date; // Optional timestamp
}

/**
 * Represents the user object typically returned by the API
 * (excluding sensitive fields like password).
 */
export type ApiUser = Omit<SharedUser, 'password'>; // Example if password was included, adjust as needed

/**
 * Represents the basic user information often needed in the frontend context.
 * Combines first and last name for display purposes.
 */
export interface FrontendUserContext {
  id: string; // Use _id as the primary identifier
  name: string; // Combined first and last name
  email: string;
  role: SharedUser['role'];
  avatar?: string;
}