import apiService from './apiService';
import { User } from '../features/auth/types/User'; // Assuming User type is here

// Interface for the API response when fetching multiple users
interface GetUsersResponse {
  status: string;
  results: number; // Total number of users matching filter
  data: {
    users: User[];
  };
}

// Interface for the API response when fetching a single user
interface GetUserResponse {
  status: string;
  data: {
    user: User;
  };
}

// Interface for filter/pagination options
interface UserListOptions {
  page?: number;
  limit?: number;
  sort?: string;
  role?: string;
  search?: string;
}

// Interface for creating a user (adjust based on required fields)
interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password might be optional if set via invite/reset later
  role: string;
  permissions?: string[]; // Optional: override default role permissions
}

// Interface for updating a user (adjust based on allowed fields)
interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  active?: boolean;
}

const userService = {
  // Get a list of users with pagination and filtering
  getUsers: async (
    options: UserListOptions = {}
  ): Promise<GetUsersResponse> => {
    const response = await apiService.get('/api/users', { params: options });
    return response.data;
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<GetUserResponse> => {
    const response = await apiService.get(`/api/users/${id}`);
    return response.data;
  },

  // Create a new user
  createUser: async (userData: CreateUserData): Promise<GetUserResponse> => {
    const response = await apiService.post('/api/users', userData);
    return response.data;
  },
  // Update a user by ID
  updateUser: async (
    id: string,
    userData: UpdateUserData
  ): Promise<GetUserResponse> => {
    const response = await apiService.patch(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete (soft delete) a user by ID
  deleteUser: async (id: string): Promise<void> => {
    await apiService.delete(`/api/users/${id}`);
  },
};

export default userService;
