import apiService from './apiService';

export interface Lead {
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
  source: string;
  status: string;
  category: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  notes?: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }>;
  interactions?: Array<{
    type: string;
    date: string;
    summary: string;
    conductedBy: string;
  }>;
  estimatedSystemSize?: number;
  monthlyElectricBill?: number;
  propertyType?: string;
  roofType?: string;
  roofAge?: number;
  shading?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilter {
  status?: string;
  category?: string;
  assignedTo?: string;
  source?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Lead service for handling all lead-related API calls
const leadService = {
  // Get all leads with optional filtering
  getLeads: async (filters: LeadFilter = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/api/leads${queryString ? `?${queryString}` : ''}`;
      
      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  },
  
  // Get lead by ID
  getLead: async (id: string) => {
    try {
      return await apiService.get(`/api/leads/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Create new lead
  createLead: async (leadData: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await apiService.post('/api/leads', leadData);
    } catch (error) {
      throw error;
    }
  },
  
  // Update lead
  updateLead: async (id: string, leadData: Partial<Lead>) => {
    try {
      return await apiService.put(`/api/leads/${id}`, leadData);
    } catch (error) {
      throw error;
    }
  },
  
  // Delete lead
  deleteLead: async (id: string) => {
    try {
      return await apiService.delete(`/api/leads/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Add note to lead
  addNote: async (id: string, noteText: string) => {
    try {
      return await apiService.post(`/api/leads/${id}/notes`, { text: noteText });
    } catch (error) {
      throw error;
    }
  },
  
  // Add interaction to lead
  addInteraction: async (id: string, interaction: { type: string; summary: string; date?: string }) => {
    try {
      return await apiService.post(`/api/leads/${id}/interactions`, interaction);
    } catch (error) {
      throw error;
    }
  },
  
  // Change lead status
  updateStatus: async (id: string, status: string) => {
    try {
      return await apiService.put(`/api/leads/${id}/status`, { status });
    } catch (error) {
      throw error;
    }
  },
  
  // Assign lead to user
  assignLead: async (id: string, userId: string) => {
    try {
      return await apiService.put(`/api/leads/${id}/assign`, { userId });
    } catch (error) {
      throw error;
    }
  }
};

export default leadService;