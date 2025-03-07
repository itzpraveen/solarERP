import { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
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
  name: string;
  email: string;
  password: string;
  role?: string;
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
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set auth token header
        setAuthToken(token);
        
        try {
          // Verify token & get user data
          const res = await axios.get('/api/auth/me');
          
          setUser(res.data.data);
          setIsAuthenticated(true);
          setLoading(false);
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
      
      setUser(userRes.data.data);
      setIsAuthenticated(true);
      setLoading(false);
      setError(null);
      
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };
  
  // Login user
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      // Get user data
      const userRes = await axios.get('/api/auth/me');
      
      setUser(userRes.data.data);
      setIsAuthenticated(true);
      setLoading(false);
      setError(null);
      
      return { success: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
      return { success: false, error: err.response?.data?.message || 'Invalid credentials' };
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