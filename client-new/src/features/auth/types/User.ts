/**
 * User interface representing a user in the system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  active?: boolean; // Add optional active status
}