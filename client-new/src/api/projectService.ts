import apiService from './apiService';

export interface ProjectAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ProjectDates {
  siteAssessment?: string;
  planningCompleted?: string;
  permitSubmitted?: string;
  permitApproved?: string;
  scheduledInstallation?: string;
  installationStarted?: string;
  installationCompleted?: string;
  inspectionScheduled?: string;
  inspectionCompleted?: string;
  utilityInterconnection?: string;
  systemActivation?: string;
  projectClosed?: string;
}

export interface ProjectTeam {
  projectManager?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  salesRep?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  designer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  installationTeam?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export interface ProjectEquipment {
  _id?: string;
  type: 'panel' | 'inverter' | 'battery' | 'optimizers' | 'racking' | 'monitoring' | 'other';
  manufacturer: string;
  model: string;
  serialNumber?: string;
  quantity: number;
  notes?: string;
}

export interface ProjectDocument {
  _id?: string;
  type: 'permit' | 'contract' | 'design' | 'inspection' | 'utility' | 'warranty' | 'other';
  name: string;
  fileUrl: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt: string;
  notes?: string;
}

export interface ProjectNote {
  _id?: string;
  text: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface ProjectIssue {
  _id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface ProjectPayment {
  _id?: string;
  name: string;
  amount: number;
  percentage?: number;
  dueDate?: string;
  paymentDate?: string;
  status: 'pending' | 'invoiced' | 'paid' | 'overdue';
  notes?: string;
}

export interface ProjectExpense {
  _id?: string;
  category: 'equipment' | 'labor' | 'permits' | 'subcontractor' | 'other';
  description: string;
  amount: number;
  vendor?: string;
  date: string;
  notes?: string;
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ProjectFinancials {
  totalContractValue: number;
  totalExpenses?: number;
  projectedProfit?: number;
  paymentSchedule?: ProjectPayment[];
  expenses?: ProjectExpense[];
}

export interface Project {
  _id: string;
  name: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: ProjectAddress;
  };
  proposal?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  stage: 'planning' | 'permitting' | 'scheduled' | 'in_progress' | 'inspection' | 'completed';
  installAddress: ProjectAddress;
  systemSize: number;
  panelCount: number;
  panelType: string;
  inverterType: string;
  includesBattery: boolean;
  batteryType?: string;
  batteryCount?: number;
  dates: ProjectDates;
  team: ProjectTeam;
  equipment?: ProjectEquipment[];
  documents?: ProjectDocument[];
  notes?: ProjectNote[];
  issues?: ProjectIssue[];
  financials: ProjectFinancials;
  active: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilter {
  status?: string;
  stage?: string;
  projectManager?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  customer?: string; // Added customer filter
}

// Project service for handling all project-related API calls
const projectService = {
  // Get all projects with optional filtering
  getProjects: async (filters: ProjectFilter = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`;
      
      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  },
  
  // Get project by ID
  getProject: async (id: string) => {
    try {
      return await apiService.get(`/api/projects/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Create new project
  createProject: async (projectData: Omit<Project, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await apiService.post('/api/projects', projectData);
    } catch (error) {
      throw error;
    }
  },
  
  // Update project
  updateProject: async (id: string, projectData: Partial<Project>) => {
    try {
      return await apiService.put(`/api/projects/${id}`, projectData);
    } catch (error) {
      throw error;
    }
  },
  
  // Delete project
  deleteProject: async (id: string) => {
    try {
      return await apiService.delete(`/api/projects/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Update project status
  updateStatus: async (id: string, status: 'active' | 'on_hold' | 'completed' | 'cancelled') => {
    try {
      return await apiService.put(`/api/projects/${id}/status`, { status });
    } catch (error) {
      throw error;
    }
  },
  
  // Update project stage
  updateStage: async (id: string, stage: 'planning' | 'permitting' | 'scheduled' | 'in_progress' | 'inspection' | 'completed') => {
    try {
      return await apiService.put(`/api/projects/${id}/stage`, { stage });
    } catch (error) {
      throw error;
    }
  },
  
  // Add note to project
  addNote: async (id: string, noteText: string) => {
    try {
      return await apiService.post(`/api/projects/${id}/notes`, { text: noteText });
    } catch (error) {
      throw error;
    }
  },
  
  // Add issue to project
  addIssue: async (id: string, issue: { title: string; description: string; priority: string }) => {
    try {
      return await apiService.post(`/api/projects/${id}/issues`, issue);
    } catch (error) {
      throw error;
    }
  },
  
  // Update issue
  updateIssue: async (projectId: string, issueId: string, issueData: Partial<ProjectIssue>) => {
    try {
      return await apiService.patch(`/api/projects/${projectId}/issues/${issueId}`, issueData);
    } catch (error) {
      throw error;
    }
  },
  
  // Add document to project
  addDocument: async (id: string, document: { type: string; name: string; fileUrl: string; notes?: string }) => {
    try {
      return await apiService.post(`/api/projects/${id}/documents`, document);
    } catch (error) {
      throw error;
    }
  },
  
  // Add equipment to project
  addEquipment: async (id: string, equipment: { type: string; manufacturer: string; model: string; quantity: number; serialNumber?: string; notes?: string }) => {
    try {
      return await apiService.post(`/api/projects/${id}/equipment`, equipment);
    } catch (error) {
      throw error;
    }
  },
  
  // Update project team
  updateTeam: async (id: string, teamData: Partial<ProjectTeam>) => {
    try {
      return await apiService.patch(`/api/projects/${id}/team`, teamData);
    } catch (error) {
      throw error;
    }
  },
  
  // Add expense to project
  addExpense: async (id: string, expense: { category: string; description: string; amount: number; vendor?: string; notes?: string }) => {
    try {
      return await apiService.post(`/api/projects/${id}/expenses`, expense);
    } catch (error) {
      throw error;
    }
  },
  
  // Add payment to project
  addPayment: async (id: string, payment: { name: string; amount: number; percentage?: number; dueDate?: string; status?: string; notes?: string }) => {
    try {
      return await apiService.post(`/api/projects/${id}/payments`, payment);
    } catch (error) {
      throw error;
    }
  },
  
  // Get project timeline
  getTimeline: async (id: string) => {
    try {
      return await apiService.get(`/api/projects/${id}/timeline`);
    } catch (error) {
      throw error;
    }
  }
};

export default projectService;