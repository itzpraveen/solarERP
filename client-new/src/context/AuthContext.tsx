import React, { ReactNode } from 'react';
import * as axiosModule from 'axios';
import mockAuthService from '../api/mockAuthService';
import { User } from '../types/User'; // Import the shared User type

const axios = axiosModule.default || axiosModule;

// Flag to use mock authentication (for development without backend)
const USE_MOCK_AUTH = false;
// Removed local User interface definition

interface AuthContextType {
  user: User | null; // Use imported User type
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

export const AuthContext = React.createContext<AuthContextType>(
  {} as AuthContextType
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = React.useState<User | null>(null); // Use imported User type
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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

            // Adapt backend response to FrontendUserContext structure
            const backendUser = res.data.data;
            const adaptedUser: User = {
              id: backendUser._id, // Map _id to id
              name: `${backendUser.firstName} ${backendUser.lastName}`, // Combine names
              email: backendUser.email,
              role: backendUser.role,
              avatar: backendUser.avatar, // Optional field
            };
            setUser(adaptedUser);
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
      const res = await axios.post('/api/auth/register', formData);

      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);

      // Get user data
      const userRes = await axios.get('/api/auth/me');

      // Adapt backend response to FrontendUserContext structure
      const backendUserReg = userRes.data.data;
      const adaptedUserReg: User = {
        id: backendUserReg._id,
        name: `${backendUserReg.firstName} ${backendUserReg.lastName}`,
        email: backendUserReg.email,
        role: backendUserReg.role,
        avatar: backendUserReg.avatar,
      };
      setUser(adaptedUserReg);
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

        // Get user data
        const userRes = await axios.get('/api/auth/me');

        // Adapt backend response to FrontendUserContext structure
        const backendUserLogin = userRes.data.data;
        const adaptedUserLogin: User = {
          id: backendUserLogin._id,
          name: `${backendUserLogin.firstName} ${backendUserLogin.lastName}`,
          email: backendUserLogin.email,
          role: backendUserLogin.role,
          avatar: backendUserLogin.avatar,
        };
        setUser(adaptedUserLogin);
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
    // Use imported User type
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
