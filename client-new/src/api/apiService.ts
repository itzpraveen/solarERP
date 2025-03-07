import axios, { AxiosRequestConfig, AxiosProgressEvent } from 'axios';

// Set base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
console.log('API URL:', API_URL);
axios.defaults.baseURL = API_URL;

// Create reusable API service with common methods
const apiService = {
  // Generic GET request
  get: async (endpoint: string, config?: AxiosRequestConfig) => {
    try {
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  },

  // Generic POST request
  post: async (endpoint: string, data: any = {}, config?: AxiosRequestConfig) => {
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
      const response = await axios.put(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`API PUT error for ${endpoint}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
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
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Network error');
    }
  }
};

export default apiService;