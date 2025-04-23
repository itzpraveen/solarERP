import apiService from './apiService';

// Define the structure for financing options in the frontend interfaces
export interface FinancingOption {
  _id?: string; // Optional ID if it's an existing subdocument
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  provider?: string;
  termYears?: number;
  interestRate?: number;
  downPayment?: number;
  monthlyPayment?: number;
  notes?: string;
}

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

// Define the structure for equipment items within a proposal
// Matches the backend model's populated equipment structure
export interface ProposalEquipmentItem {
  item: {
    _id: string;
    name: string;
    category: string;
    unitPrice?: number;
    modelNumber?: string;
  };
  quantity: number;
  unitPrice?: number; // Price at the time proposal was created
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
  proposalId?: string; // Added proposalId (optional for now)
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  systemSize: number;
  panelCount: number; // Keep or remove based on final decision
  // Removed panelType, inverterType, includesBattery, batteryType, batteryCount
  energyMeter?: string; // Added energy meter field
  // yearlyProductionEstimate: number; // Removed
  // estimatedSavings: ProposalEstimatedSavings; // Removed
  // pricing: ProposalPricing; // Removed old pricing object
  projectCostExcludingStructure: number; // Added
  structureCost?: number; // Added
  finalProjectCost?: number; // Added (calculated on backend)
  subsidyAmount: number; // Added
  netInvestment?: number; // Added (calculated on backend)
  additionalCosts?: number; // Added
  currency: string; // Added
  financingOptions?: FinancingOption[]; // Added
  // designImages?: string[]; // Removed
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
  // Add line items matching the backend structure (populated)
  lineItems?: {
    itemId: {
      _id: string;
      name: string;
      category: string;
      modelNumber?: string;
      // Add other InventoryItem fields if needed
    };
    quantity: number;
    _id?: string; // Subdocument ID
  }[];
}

// Define the explicit payload type for updates
// Matches the structure needed by the backend API call
export interface ProposalUpdatePayload {
  name?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  systemSize?: number;
  panelCount?: number;
  // yearlyProductionEstimate?: number; // Removed
  // estimatedSavings?: ProposalEstimatedSavings; // Removed
  // pricing?: ProposalPricing; // Removed
  projectCostExcludingStructure?: number; // Added
  structureCost?: number; // Added
  // finalProjectCost is calculated, not updated directly
  subsidyAmount?: number; // Added
  // netInvestment is calculated, not updated directly
  additionalCosts?: number; // Added
  energyMeter?: string; // Added energy meter field
  currency?: string; // Added
  financingOptions?: FinancingOption[]; // Added
  // designImages?: string[]; // Removed
  validUntil?: string;
  notes?: string;
  sentDate?: string;
  viewedDate?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  active?: boolean;
  // Add lineItems for update payload (expecting array of objects with itemId and quantity)
  lineItems?: {
    itemId: string;
    quantity: number;
  }[];
  // Excludes _id, createdAt, updatedAt, createdBy, lead
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
  // Define a specific type for the creation payload
  createProposal: async (
    // Use a simpler type reflecting the actual data sent from the form
    proposalData: {
      lead: string; // Lead ID
      name: string;
      systemSize: number;
      panelCount: number; // Or remove if derived solely from equipment
      // yearlyProductionEstimate: number; // Removed
      // estimatedSavings: ProposalEstimatedSavings; // Removed
      // pricing: ProposalPricing; // Removed
      projectCostExcludingStructure: number; // Added
      structureCost?: number; // Added
      subsidyAmount: number; // Added
      additionalCosts?: number; // Added
      currency: string; // Added & Made Required
      financingOptions?: FinancingOption[]; // Added
      energyMeter?: string; // Added energy meter field
      // Add lineItems matching the backend structure (array of objects with itemId and quantity)
      lineItems?: {
        itemId: string;
        quantity: number;
      }[];
      notes?: string;
      // Add other non-populated fields required by backend if any (e.g., status, validUntil, proposalId)
      proposalId?: string;
      status?: string;
      validUntil?: string;
      active?: boolean;
    }
  ) => {
    try {
      // Add createdBy on the backend, not sent from frontend
      return await apiService.post('/api/proposals', proposalData);
    } catch (error) {
      throw error;
    }
  },

  // Update proposal
  // Use the explicit payload type
  updateProposal: async (id: string, proposalData: ProposalUpdatePayload) => {
    try {
      // Use PATCH for partial updates if backend supports it, otherwise PUT
      return await apiService.patch(`/api/proposals/${id}`, proposalData);
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

  // Download proposal PDF
  downloadProposalPdf: async (id: string) => {
    try {
      console.log('Downloading PDF for proposal:', id);
      
      // apiService.get returns the full AxiosResponse when responseType is 'blob'
      const response: any = await apiService.get(
        `/api/proposals/${id}/download`,
        {
          responseType: 'blob', // Important: Expect a blob response
        }
      );

      // Verify we received a valid PDF blob
      const contentType = response.headers?.['content-type'];
      console.log('Response content type:', contentType);
      
      if (contentType !== 'application/pdf') {
        console.error('Received non-PDF content type:', contentType);
        
        // If we received a JSON error response instead of a PDF, parse it
        if (contentType?.includes('application/json')) {
          const reader = new FileReader();
          return new Promise((resolve, reject) => {
            reader.onload = () => {
              try {
                const errorJson = JSON.parse(reader.result as string);
                reject(new Error(errorJson.message || 'Failed to download PDF'));
              } catch (e) {
                reject(new Error('Invalid response format'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read error response'));
            reader.readAsText(response.data);
          });
        }
        
        // For other non-PDF content types
        throw new Error(`Received invalid content type: ${contentType}`);
      }

      // Access headers from the response object
      const contentDisposition = response.headers?.['content-disposition'];
      let filename = `proposal-${id}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      console.log('Creating download for file:', filename);
      
      // Verify the blob size is reasonable for a PDF
      if (response.data.size < 100) { // A valid PDF should be larger than 100 bytes
        console.error('PDF blob size too small:', response.data.size);
        throw new Error('Generated PDF is invalid or empty');
      }

      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

      // Return success or potentially the filename
      return { success: true, filename };
    } catch (error: any) {
      console.error('Error downloading proposal PDF:', error);
      
      // Provide a more specific error message if available
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || `Server error (${status})`;
        throw new Error(`Failed to download PDF: ${message}`);
      }
      
      // Re-throw the error so the component can handle it
      throw error.message ? error : new Error('Failed to download PDF');
    }
  },
};

export default proposalService;
