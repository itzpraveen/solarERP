import apiService from './apiService';

export interface Report {
  _id: string;
  title: string;
  type: 'financial' | 'performance' | 'project' | 'sales' | 'inventory' | 'custom';
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  parameters?: Record<string, any>;
  scheduledFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'none';
  lastRun?: string;
  status: 'active' | 'archived' | 'scheduled';
  recipients?: string[];
  data?: any;
  visualizations?: {
    type: 'bar' | 'line' | 'pie' | 'table' | 'card' | 'gauge';
    config: Record<string, any>;
  }[];
}

export interface ReportSearchParams {
  type?: string;
  createdBy?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const reportService = {
  // Get all reports
  getAll: async (params?: ReportSearchParams) => {
    try {
      return await apiService.get('/api/reports', { params });
    } catch (error) {
      throw error;
    }
  },

  // Get single report by ID
  getById: async (id: string) => {
    try {
      return await apiService.get(`/api/reports/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Create new report
  create: async (data: Omit<Report, '_id'>) => {
    try {
      return await apiService.post('/api/reports', data);
    } catch (error) {
      throw error;
    }
  },

  // Update report
  update: async (id: string, data: Partial<Report>) => {
    try {
      return await apiService.put(`/api/reports/${id}`, data);
    } catch (error) {
      throw error;
    }
  },

  // Delete report
  delete: async (id: string) => {
    try {
      return await apiService.delete(`/api/reports/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Run report to generate data
  runReport: async (id: string, parameters?: Record<string, any>) => {
    try {
      return await apiService.post(`/api/reports/${id}/run`, { parameters });
    } catch (error) {
      throw error;
    }
  },

  // Schedule a report
  scheduleReport: async (id: string, schedule: { frequency: string; recipients: string[] }) => {
    try {
      return await apiService.post(`/api/reports/${id}/schedule`, schedule);
    } catch (error) {
      throw error;
    }
  },

  // Get report types (for dropdowns)
  getReportTypes: async () => {
    try {
      return await apiService.get('/api/reports/types');
    } catch (error) {
      throw error;
    }
  },

  // Get report templates
  getTemplates: async () => {
    try {
      return await apiService.get('/api/reports/templates');
    } catch (error) {
      throw error;
    }
  },
  
  // Export report data
  exportReport: async (id: string, format: 'pdf' | 'csv' | 'excel') => {
    try {
      return await apiService.get(`/api/reports/${id}/export/${format}`, { responseType: 'blob' });
    } catch (error) {
      throw error;
    }
  },
  
  // Get dashboard summary reports
  getDashboardReports: async () => {
    try {
      return await apiService.get('/api/reports/dashboard');
    } catch (error) {
      throw error;
    }
  }
};

export default reportService;