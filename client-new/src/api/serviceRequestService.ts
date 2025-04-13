import apiService from './apiService';

export interface ServiceRequest {
  _id: string;
  title: string;
  description: string;
  requestType:
    | 'maintenance'
    | 'repair'
    | 'installation'
    | 'inspection'
    | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status:
    | 'new'
    | 'assigned'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'cancelled';
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  project?: {
    _id: string;
    name: string;
    projectNumber: string;
  };
  assignedTechnician?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  scheduledDate?: string;
  completionDate?: string;
  notes?: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ServiceRequestFilter {
  customer?: string;
  project?: string;
  assignedTechnician?: string;
  status?: string;
  requestType?: string;
  priority?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Service Request service for handling all service request related API calls
const serviceRequestService = {
  // Get all service requests with optional filtering
  getServiceRequests: async (filters: ServiceRequestFilter = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/api/service-requests${queryString ? `?${queryString}` : ''}`;

      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  },

  // Get service request by ID
  getServiceRequest: async (id: string) => {
    try {
      return await apiService.get(`/api/service-requests/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Create new service request
  createServiceRequest: async (
    requestData: Omit<ServiceRequest, '_id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      return await apiService.post('/api/service-requests', requestData);
    } catch (error) {
      throw error;
    }
  },

  // Update service request
  updateServiceRequest: async (
    id: string,
    requestData: Partial<ServiceRequest>
  ) => {
    try {
      return await apiService.put(`/api/service-requests/${id}`, requestData);
    } catch (error) {
      throw error;
    }
  },

  // Delete service request
  deleteServiceRequest: async (id: string) => {
    try {
      return await apiService.delete(`/api/service-requests/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Add note to service request
  addNote: async (id: string, noteText: string) => {
    try {
      return await apiService.post(`/api/service-requests/${id}/notes`, {
        text: noteText,
      });
    } catch (error) {
      throw error;
    }
  },

  // Assign service request to technician
  assignTechnician: async (id: string, technicianId: string) => {
    try {
      return await apiService.put(`/api/service-requests/${id}/assign`, {
        technicianId,
      });
    } catch (error) {
      throw error;
    }
  },

  // Update service request status
  updateStatus: async (id: string, status: ServiceRequest['status']) => {
    try {
      return await apiService.put(`/api/service-requests/${id}/status`, {
        status,
      });
    } catch (error) {
      throw error;
    }
  },

  // Schedule service request
  scheduleServiceRequest: async (id: string, scheduledDate: string) => {
    try {
      return await apiService.put(`/api/service-requests/${id}/schedule`, {
        scheduledDate,
      });
    } catch (error) {
      throw error;
    }
  },

  // Complete service request
  completeServiceRequest: async (
    id: string,
    completionDetails: { completionDate: string; notes?: string }
  ) => {
    try {
      return await apiService.put(
        `/api/service-requests/${id}/complete`,
        completionDetails
      );
    } catch (error) {
      throw error;
    }
  },

  // Get service requests by customer
  getCustomerServiceRequests: async (customerId: string) => {
    try {
      return await apiService.get(
        `/api/customers/${customerId}/service-requests`
      );
    } catch (error) {
      throw error;
    }
  },

  // Get service requests by project
  getProjectServiceRequests: async (projectId: string) => {
    try {
      return await apiService.get(
        `/api/projects/${projectId}/service-requests`
      );
    } catch (error) {
      throw error;
    }
  },
};

export default serviceRequestService;
