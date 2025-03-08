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
      console.log(`Making GET request to: ${endpoint}`);
      const response = await axios.get(endpoint, config);
      console.log(`GET response from ${endpoint}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`GET request failed for ${endpoint}:`, error);
      
      // Enhanced error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        throw error.response.data || { message: `Server error: ${error.response.status}` };
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
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