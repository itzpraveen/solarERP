import apiService from './apiService';

export interface Equipment {
  _id: string;
  name: string;
  type:
    | 'panel'
    | 'inverter'
    | 'battery'
    | 'optimizers'
    | 'racking'
    | 'monitoring'
    | 'other';
  manufacturer: string;
  model: string;
  unitPrice: number;
  stockQuantity: number;
  minimumStockLevel?: number;
  description?: string;
  specifications?: Record<string, any>;
  tags?: string[];
  supplier?: {
    name: string;
    contactPerson?: string;
    contactNumber?: string;
    email?: string;
    website?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'discontinued' | 'out_of_stock';
  images?: string[];
}

export interface EquipmentSearchParams {
  type?: string;
  manufacturer?: string;
  search?: string;
  status?: string;
  minStockQuantity?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const equipmentService = {
  // Get all equipment
  getAll: async (params?: EquipmentSearchParams) => {
    try {
      return await apiService.get('/api/equipment', { params });
    } catch (error) {
      throw error;
    }
  },

  // Get single equipment by ID
  getById: async (id: string) => {
    try {
      return await apiService.get(`/api/equipment/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Create new equipment
  create: async (data: Omit<Equipment, '_id'>) => {
    try {
      return await apiService.post('/api/equipment', data);
    } catch (error) {
      throw error;
    }
  },

  // Update equipment
  update: async (id: string, data: Partial<Equipment>) => {
    try {
      return await apiService.put(`/api/equipment/${id}`, data);
    } catch (error) {
      throw error;
    }
  },

  // Delete equipment
  delete: async (id: string) => {
    try {
      return await apiService.delete(`/api/equipment/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Adjust stock quantity
  adjustStock: async (
    id: string,
    adjustment: { quantity: number; reason: string }
  ) => {
    try {
      return await apiService.post(
        `/api/equipment/${id}/stock-adjustment`,
        adjustment
      );
    } catch (error) {
      throw error;
    }
  },

  // Get stock history
  getStockHistory: async (id: string) => {
    try {
      return await apiService.get(`/api/equipment/${id}/stock-history`);
    } catch (error) {
      throw error;
    }
  },

  // Get equipment types (for dropdowns)
  getTypes: async () => {
    try {
      return await apiService.get('/api/equipment/types');
    } catch (error) {
      throw error;
    }
  },

  // Get manufacturers (for dropdowns)
  getManufacturers: async () => {
    try {
      return await apiService.get('/api/equipment/manufacturers');
    } catch (error) {
      throw error;
    }
  },
};

export default equipmentService;
