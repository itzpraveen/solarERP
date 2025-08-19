import { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (formData: RegisterFormData) => Promise<any>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setError: (error: string | null) => void;
  updateUser: (userData: Partial<User>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Validate token format
        if (!token.includes('.')) {
          localStorage.removeItem('authToken');
          setLoading(false);
          return;
        }
        
        // Set auth token header
        setAuthToken(token);
        
        try {
          // Verify token & get user data
          const res = await axios.get('/api/auth/me');
          
          if (res.data?.data) {
            setUser(res.data.data);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid user data');
          }
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth verification failed:', err);
          }
          localStorage.removeItem('authToken');
          setAuthToken(null);
          setUser(null);
          setIsAuthenticated(false);
          if (err.response?.status !== 401) {
            setError(err.response?.data?.message || 'Authentication failed');
          }
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth token error:', err);
        }
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
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
      setError(null);
      
      // Validate input
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        throw new Error('All fields are required');
      }
      
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      const res = await axios.post('/api/auth/signup', formData);
      
      if (res.data?.token) {
        localStorage.setItem('authToken', res.data.token);
        setAuthToken(res.data.token);
        
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          setIsAuthenticated(true);
        }
        
        setError(null);
        return { success: true, data: res.data };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data?.token) {
        localStorage.setItem('authToken', res.data.token);
        setAuthToken(res.data.token);
        
        if (res.data?.data?.user) {
          setUser(res.data.data.user);
          setIsAuthenticated(true);
        } else {
          // Fetch user data if not included in login response
          const userRes = await axios.get('/api/auth/me');
          if (userRes.data?.data) {
            setUser(userRes.data.data);
            setIsAuthenticated(true);
          }
        }
        
        setError(null);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid credentials';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      setAuthToken(null);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout user
  const logout = async () => {
    try {
      // Call logout endpoint if available
      await axios.post('/api/auth/logout').catch(() => {});
    } catch (err) {
      // Ignore logout endpoint errors
    } finally {
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      // Redirect to login page
      window.location.href = '/login';
    }
  };
  
  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...userData
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
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};