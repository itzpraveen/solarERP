import apiService from './apiService';

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }>;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  active: boolean;
  leadSource?: string;
  preferredContactMethod?: string;
  originalLead: string; // Reference to the lead this customer was created from
  acceptedProposal?: string; // Reference to the accepted proposal, if any
}

export interface CustomerFilter {
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Customer service for handling all customer-related API calls
const customerService = {
  // Get all customers with optional filtering
  getCustomers: async (filters: CustomerFilter = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/api/customers${queryString ? `?${queryString}` : ''}`;
      
      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  },
  
  // Get customer by ID
  getCustomer: async (id: string) => {
    try {
      return await apiService.get(`/api/customers/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Create new customer
  createCustomer: async (customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await apiService.post('/api/customers', customerData);
    } catch (error) {
      throw error;
    }
  },
  
  // Update customer
  updateCustomer: async (id: string, customerData: Partial<Customer>) => {
    try {
      return await apiService.put(`/api/customers/${id}`, customerData);
    } catch (error) {
      throw error;
    }
  },
  
  // Delete customer
  deleteCustomer: async (id: string) => {
    try {
      return await apiService.delete(`/api/customers/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Add note to customer
  addNote: async (id: string, noteText: string) => {
    try {
      return await apiService.post(`/api/customers/${id}/notes`, { text: noteText });
    } catch (error) {
      throw error;
    }
  },
  
  // Get customer projects
  getCustomerProjects: async (id: string) => {
    try {
      return await apiService.get(`/api/customers/${id}/projects`);
    } catch (error) {
      throw error;
    }
  },
  
  // Note: The server does not have a direct lead conversion endpoint.
  // Instead, we create a customer with the originalLead field set to maintain the reference
  // and then update the lead status separately.
  
  // Assign customer to user
  assignCustomer: async (id: string, userId: string) => {
    try {
      return await apiService.put(`/api/customers/${id}/assign`, { userId });
    } catch (error) {
      throw error;
    }
  }
};

export default customerService;