import apiService from './apiService';

export interface ProposalFinancingOption {
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  termYears?: number;
  downPayment?: number;
  apr?: number;
  monthlyPayment?: number;
  totalCost?: number;
  selected?: boolean;
}

export interface ProposalPricing {
  grossCost: number;
  centralSubsidy: number; // Renamed
  stateSubsidy?: number; // Renamed
  gstRate?: number; // Added
  gstAmount?: number; // Added
  utilityRebate?: number;
  otherIncentives?: number;
  netCost: number;
  currency?: string; // Added
}

export interface ProposalEstimatedSavings {
  firstYear: number;
  twentyFiveYear: number;
}

export interface Proposal {
  _id: string;
  lead: {
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
  };
  name: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  systemSize: number;
  panelCount: number;
  panelType: string;
  inverterType: string;
  includesBattery: boolean;
  batteryType?: string;
  batteryCount?: number;
  yearlyProductionEstimate: number;
  estimatedSavings: ProposalEstimatedSavings;
  pricing: ProposalPricing;
  financingOptions?: ProposalFinancingOption[];
  designImages?: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  validUntil: string;
  notes?: string;
  sentDate?: string;
  viewedDate?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalFilter {
  lead?: string;
  status?: string;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Proposal service for handling all proposal-related API calls
const proposalService = {
  // Get all proposals with optional filtering
  getProposals: async (filters: ProposalFilter = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/api/proposals${queryString ? `?${queryString}` : ''}`;

      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  },

  // Get proposal by ID
  getProposal: async (id: string) => {
    try {
      return await apiService.get(`/api/proposals/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Create new proposal
  createProposal: async (
    proposalData: Omit<
      Proposal,
      '_id' | 'createdAt' | 'updatedAt' | 'createdBy'
    >
  ) => {
    try {
      return await apiService.post('/api/proposals', proposalData);
    } catch (error) {
      throw error;
    }
  },

  // Update proposal
  updateProposal: async (id: string, proposalData: Partial<Proposal>) => {
    try {
      return await apiService.put(`/api/proposals/${id}`, proposalData);
    } catch (error) {
      throw error;
    }
  },

  // Delete proposal
  deleteProposal: async (id: string) => {
    try {
      return await apiService.delete(`/api/proposals/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Update proposal status
  updateStatus: async (
    id: string,
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  ) => {
    try {
      return await apiService.put(`/api/proposals/${id}/status`, { status });
    } catch (error) {
      throw error;
    }
  },

  // Send proposal to lead
  sendProposal: async (id: string) => {
    try {
      return await apiService.post(`/api/proposals/${id}/send`);
    } catch (error) {
      throw error;
    }
  },
};

export default proposalService;
