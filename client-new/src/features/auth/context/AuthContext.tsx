import React, { ReactNode, createContext, useState, useEffect } from 'react';
import * as axiosModule from 'axios';
import mockAuthService from '../services/mockAuthService';
import { User } from '../types/User';

// Log the mockAuthService to debug
console.log('mockAuthService:', mockAuthService);

const axios = axiosModule.default || axiosModule;

// Flag to use mock authentication (for development without backend)
const USE_MOCK_AUTH = false;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (formData: RegisterFormData) => Promise<any>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setError: (error: string | null) => void;
  updateUser: (userData: Partial<User>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setLoading(false);
          return;
        }

        // Set auth token header
        setAuthToken(token);

        try {
          if (USE_MOCK_AUTH) {
            // Use mock authentication service
            const user = await mockAuthService.getCurrentUser();
            if (user) {
              setUser(user);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('token');
              setUser(null);
              setIsAuthenticated(false);
              setError('Session expired');
            }
            setLoading(false);
          } else {
            // Verify token & get user data
            const res = await axios.get('/api/auth/me');

            setUser(res.data.data);
            setIsAuthenticated(true);
            setLoading(false);
          }
        } catch (err: any) {
          console.error('Auth verification failed:', err);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          setError(err.response?.data?.message || 'Authentication failed');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Auth token error:', err);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setError('Authentication initialization failed');
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Set auth token header for all requests
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Register user
  const register = async (formData: RegisterFormData) => {
    try {
      // Call the correct signup endpoint
      const res = await axios.post('/api/auth/signup', formData);

      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);

      // Use user data directly from signup response
      setUser(res.data.data.user);
      setIsAuthenticated(true);
      setLoading(false);
      setError(null);

      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed',
      };
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      if (USE_MOCK_AUTH) {
        // Use mock authentication service
        const result = await mockAuthService.login(email, password);

        if (result.success && result.token) {
          localStorage.setItem('token', result.token);
          setAuthToken(result.token);

          if (result.user) {
            setUser(result.user);
            setIsAuthenticated(true);
            setLoading(false);
            setError(null);
          }

          return { success: true };
        } else {
          setError(result.error || 'Invalid credentials');
          return {
            success: false,
            error: result.error || 'Invalid credentials',
          };
        }
      } else {
        // Use real API
        const res = await axios.post('/api/auth/login', { email, password });

        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);

        // Use user data directly from login response
        setUser(res.data.data.user);
        setIsAuthenticated(true);
        setLoading(false);
        setError(null);

        return { success: true };
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
      return {
        success: false,
        error: err.response?.data?.message || 'Invalid credentials',
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...userData,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        setError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
