/**
 * User interface representing a user in the system
 * Aligned with typical backend model structure (_id, firstName, lastName)
 */
export interface User {
  _id: string; // Use _id consistent with MongoDB
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  active?: boolean; // Add optional active status
}
