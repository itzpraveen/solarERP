import * as axiosModule from 'axios';
import { AxiosRequestConfig } from 'axios';

const axios = axiosModule.default || axiosModule;

// Define AxiosProgressEvent type if it doesn't exist in axios 0.27.2
interface AxiosProgressEvent {
  loaded: number;
  total?: number;
  progress?: number;
  bytes?: number;
  rate?: number;
  estimated?: number;
  upload?: boolean;
}

// Set base URL for API requests
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = '/'; // Use relative path for production
  console.log('API URL (Production): /');
} else {
  // Use environment variable or default for development
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
  console.log('API URL (Development):', API_URL);
  axios.defaults.baseURL = API_URL;
}

// --- Axios Interceptor for Auth Token ---
axios.interceptors.request.use(
  (config) => {
    // Retrieve the token from local storage (adjust key if different)
    const token = localStorage.getItem('token'); // Use 'token' key
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        // eslint-disable-next-line no-param-reassign
        config.headers = {};
      }
      // Add the Authorization header
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor added Auth token to headers');
    } else {
      console.log('Interceptor: No auth token found');
    }
    return config;
  },
  (error) => {
    // Handle request error
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);
// --- End Interceptor ---

// Cache control helper function
const shouldUseCache = (endpoint: string): boolean => {
  // Don't cache auth, reports, or rapidly changing data
  return !(
    endpoint.includes('/auth') ||
    endpoint.includes('/reports') ||
    endpoint.includes('no-cache=true')
  );
};

// Create reusable API service with common methods
const apiService = {
  // Generic GET request with caching optimization
  get: async (endpoint: string, config?: AxiosRequestConfig) => {
    try {
      // Only add cache-busting parameter when we don't want to use the cache
      let url = endpoint;
      if (!shouldUseCache(endpoint)) {
        const cacheBuster = `_cb=${new Date().getTime()}`;
        const separator = endpoint.includes('?') ? '&' : '?';
        url = `${endpoint}${separator}${cacheBuster}`;
      }

      // Configure request to optimize for speed and caching
      const requestConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          ...config?.headers,
          // Add cache control headers
          'Cache-Control': shouldUseCache(endpoint)
            ? 'max-age=300' // 5 minutes for cacheable endpoints
            : 'no-cache, no-store',
        },
      };

      const response = await axios.get(url, requestConfig);

      // If responseType is blob, return the full response object for header access
      if (config?.responseType === 'blob') {
        return response;
      }
      // Otherwise, return only the data as before
      return response.data;
    } catch (error: any) {
      console.error('API GET error:', error);
      // Try to return more specific error info if available
      throw error.response || error;
    }
  },

  // Generic POST request
  post: async (
    endpoint: string,
    // eslint-disable-next-line default-param-last
    data: any = {},
    config?: AxiosRequestConfig
  ) => {
    try {
      const response = await axios.post(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  },

  // Generic PUT request
  put: async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
    try {
      console.log(`Making PUT request to ${endpoint}`);
      console.log('Request data:', JSON.stringify(data, null, 2));
      console.log('Request config:', JSON.stringify(config, null, 2));

      const response = await axios.put(endpoint, data, config);
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error: any) {
      console.error(`API PUT error for ${endpoint}:`, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);

      const errorMessage =
        error.response?.data?.message || error.message || 'Network error';
      throw new Error(errorMessage);
    }
  },

  // Generic PATCH request
  patch: async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.patch(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  },

  // Generic DELETE request
  delete: async (endpoint: string, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.delete(endpoint, config);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  },

  // Upload file
  uploadFile: async (
    endpoint: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ) => {
    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  },
};

export default apiService;
