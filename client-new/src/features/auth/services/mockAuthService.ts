// Mock authentication service for development without backend
import { User } from '../types/User';

// Demo user credentials
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

// Mock token
const MOCK_TOKEN = 'mock-jwt-token-for-development-only';

// Mock user data
const MOCK_USER: User = {
  _id: 'mock-user-1', // Use _id and a more descriptive mock ID
  firstName: 'Demo',
  lastName: 'User',
  email: DEMO_EMAIL,
  role: 'admin',
};

/**
 * Mock authentication service for development
 */
const mockAuthService = {
  /**
   * Mock login function
   * @param email User email
   * @param password User password
   * @returns Promise with login result
   */
  login: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
    token?: string;
    user?: User;
  }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Check if credentials match demo user
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return {
        success: true,
        token: MOCK_TOKEN,
        user: MOCK_USER,
      };
    }
    // Return error for invalid credentials
    return {
      success: false,
      error: 'Invalid credentials',
    };
  },
  /**
   * Mock get current user function
   * @returns Promise with user data
   */
  getCurrentUser: async (): Promise<User | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Return mock user
    return MOCK_USER;
  },
};

export default mockAuthService;
