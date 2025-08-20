import axios, { AxiosRequestConfig, AxiosProgressEvent, AxiosError } from 'axios';

// Set base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Remove console.log in production
if (process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
}

axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 30000; // 30 seconds timeout
axios.defaults.withCredentials = true; // Include cookies in requests

// Add request interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access denied');
    } else if (error.response?.status === 429) {
      // Rate limited
      console.error('Too many requests. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Error handler utility
const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with error
    const errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        `Server error: ${error.response.status}`;
    throw new Error(errorMessage);
  } else if (error.request) {
    // Request made but no response
    throw new Error('Network error: Unable to reach server');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Create reusable API service with common methods
const apiService = {
  // Generic GET request
  get: async (endpoint: string, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error: any) {
      handleApiError(error);
    }
  },

  // Generic POST request
  post: async (endpoint: string, data: any = {}, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.post(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      handleApiError(error);
    }
  },

  // Generic PUT request
  put: async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.put(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`API PUT error for ${endpoint}:`, error);
      }
      handleApiError(error);
    }
  },

  // Generic PATCH request
  patch: async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.patch(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      handleApiError(error);
    }
  },

  // Generic DELETE request
  delete: async (endpoint: string, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.delete(endpoint, config);
      return response.data;
    } catch (error: any) {
      handleApiError(error);
    }
  },

  // Upload file with size validation
  uploadFile: async (
    endpoint: string, 
    formData: FormData, 
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
    maxSizeMB: number = 5
  ) => {
    try {
      // Validate file size
      const file = formData.get('file') as File;
      if (file && file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
      }
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress,
        timeout: 60000 // 60 seconds for file uploads
      });
      return response.data;
    } catch (error: any) {
      handleApiError(error);
    }
  }
};

export default apiService;