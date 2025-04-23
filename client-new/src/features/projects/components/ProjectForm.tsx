import { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import projectService, { ProjectCreatePayload } from '../../../api/projectService';
import proposalService, { Proposal } from '../../../api/proposalService';
import customerService, { Customer } from '../../../api/customerService'; // Import customer service
import userService, { User } from '../../../api/userService'; // Import user service

// Define the structure for the form data
export interface ProjectFormData {
  name: string;
  customer: string; // Customer ID
  proposal?: string; // Optional Proposal ID
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  stage:
    | 'planning'
    | 'permitting'
    | 'scheduled'
    | 'in_progress'
    | 'inspection'
    | 'completed';
  installAddress?: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  systemSize: number;
  panelCount: number;
  panelType: string;
  inverterType: string;
  includesBattery: boolean;
  batteryType?: string;
  batteryCount?: number;
  team?: {
    projectManager?: string;
    salesRep?: string;
    designer?: string;
    installationTeam?: string[];
  };
  financials?: {
    totalContractValue: number;
    totalContractValueCurrency: string;
  };
  notes?: string; // Simplified notes for creation form
}

// Define props for the component
interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: (projectId: string) => void; // Callback on successful creation
  initialProposalId?: string | null; // To pre-fill from proposal
}

const ProjectForm = ({
  open,
  onClose,
  onSubmitSuccess,
  initialProposalId,
}: ProjectFormProps) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    customer: '',
    status: 'active',
    stage: 'planning',
    systemSize: 0,
    panelCount: 0,
    panelType: '',
    inverterType: '',
    includesBattery: false,
    financials: { totalContractValue: 0, totalContractValueCurrency: 'INR' },
    notes: '',
  });
  const [proposalData, setProposalData] = useState<Proposal | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]); // State for customers
  const [users, setUsers] = useState<User[]>([]); // State for users (team members)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch proposal data if initialProposalId is provided
  useEffect(() => {
    const fetchProposalAndPrefill = async () => {
      if (!initialProposalId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await proposalService.getProposal(initialProposalId);
        const proposal = response.data.proposal;
        setProposalData(proposal);

        // Pre-fill form data from proposal
        setFormData((prev) => ({
          ...prev,
          name: `Project for ${proposal.lead.firstName} ${proposal.lead.lastName} (${proposal.name})`,
          proposal: proposal._id,
          // Assuming lead is converted to customer before project creation
          // We need to fetch the customer associated with the lead
          // customer: proposal.lead.customer?._id || '', // Need to fetch customer separately
          installAddress: proposal.lead.address, // Use lead's address as default install address
          systemSize: proposal.systemSize || 0,
          panelCount: proposal.panelCount || 0,
          financials: {
            totalContractValue: proposal.finalProjectCost || 0,
            totalContractValueCurrency: proposal.currency || 'INR',
          },
          notes: proposal.notes || '',
          // You might want to pre-fill panel/inverter types if available in proposal
        }));
      } catch (err: any) {
        setError(
          `Failed to fetch proposal data: ${err?.message || 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    };

    // Fetch customers for dropdown
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const response = await customerService.getCustomers({ limit: 500 }); // Fetch a reasonable number
        setCustomers(response.data.customers || []);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
        // Handle error appropriately
      } finally {
        setCustomersLoading(false);
      }
    };

    // Fetch users for team assignment dropdowns
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        // Assuming userService.getUsers exists and returns { data: { users: User[] } }
        const response = await userService.getUsers({ limit: 100 }); // Adjust limit as needed
        setUsers(response.data.users || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        // Handle error appropriately
      } finally {
        setUsersLoading(false);
      }
    };

    if (open) {
      fetchProposalAndPrefill();
      fetchCustomers();
      fetchUsers();
    } else {
      // Reset form when dialog closes
      setFormData({
        name: '',
        customer: '',
        status: 'active',
        stage: 'planning',
        systemSize: 0,
        panelCount: 0,
        panelType: '',
        inverterType: '',
        includesBattery: false,
        financials: { totalContractValue: 0, totalContractValueCurrency: 'INR' },
        notes: '',
      });
      setProposalData(null);
      setError(null);
    }
  }, [open, initialProposalId]);

  // Effect to set customer ID once proposal and customers are loaded
  useEffect(() => {
    if (proposalData && customers.length > 0) {
      // Find the customer whose lead ID matches the proposal's lead ID
      // This assumes a 'leadOrigin' field exists on the Customer model
      // OR find customer by email/phone if leadOrigin isn't available
      const relatedCustomer = customers.find(
        (c) =>
          c.email === proposalData.lead.email ||
          c.phone === proposalData.lead.phone
        // || c.leadOrigin === proposalData.lead._id // Ideal scenario
      );
      if (relatedCustomer) {
        setFormData((prev) => ({ ...prev, customer: relatedCustomer._id }));
      } else {
        console.warn(
          'Could not automatically link customer for proposal:',
          proposalData.lead.firstName,
          proposalData.lead.lastName
        );
        // Optionally set an error or leave customer field blank for manual selection
      }
    }
  }, [proposalData, customers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value); // Default to 0 if empty or invalid
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamChange = (name: string, value: string | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        [name]: value || undefined, // Set to undefined if null/empty
      },
    }));
  };

  const handleFinancialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      financials: {
        ...prev.financials!, // Assume financials exists
        [name]: numValue,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Construct payload matching backend expectations
    const payload: ProjectCreatePayload = {
      name: formData.name,
      customer: formData.customer,
      proposal: formData.proposal, // Include proposal ID if available
      status: formData.status,
      stage: formData.stage,
      installAddress: formData.installAddress,
      systemSize: formData.systemSize,
      panelCount: formData.panelCount,
      panelType: formData.panelType,
      inverterType: formData.inverterType,
      includesBattery: formData.includesBattery,
      batteryType: formData.batteryType,
      batteryCount: formData.batteryCount,
      team: formData.team,
      financials: formData.financials,
      dates: {}, // Add empty dates object to satisfy type requirement
      notes: formData.notes ? [{ text: formData.notes }] : undefined, // Backend expects notes array
    };

    // Basic validation
    if (!payload.customer) {
      setError('Customer is required.');
      setLoading(false);
      return;
    }
    if (!payload.name) {
      setError('Project name is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await projectService.createProject(payload);
      const newProjectId = response.data.project._id;
      onSubmitSuccess(newProjectId); // Call success callback
      onClose(); // Close the dialog
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to create project'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialProposalId ? 'Create Project from Proposal' : 'Add New Project'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Customer Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={customersLoading}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer"
                  value={formData.customer}
                  label="Customer"
                  onChange={handleSelectChange}
                  disabled={!!initialProposalId && !!formData.customer} // Disable if pre-filled from proposal
                >
                  {customersLoading ? (
                    <MenuItem value="" disabled>
                      Loading customers...
                    </MenuItem>
                  ) : customers.length === 0 ? (
                    <MenuItem value="" disabled>
                      No customers found
                    </MenuItem>
                  ) : (
                    customers.map((cust) => (
                      <MenuItem key={cust._id} value={cust._id}>
                        {cust.firstName} {cust.lastName} ({cust.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Project Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            {/* Status & Stage */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Stage</InputLabel>
                <Select
                  name="stage"
                  value={formData.stage}
                  label="Stage"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="permitting">Permitting</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* System Specs */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 1 }}>
                System Specifications
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="System Size (kW)"
                name="systemSize"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.systemSize}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Panel Count"
                name="panelCount"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.panelCount}
                onChange={handleNumberChange}
              />
            </Grid>
             <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Panel Type / Brand"
                name="panelType"
                value={formData.panelType}
                onChange={handleChange}
              />
            </Grid>
             <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Inverter Type / Brand"
                name="inverterType"
                value={formData.inverterType}
                onChange={handleChange}
              />
            </Grid>
            {/* Add fields for battery if needed */}

             {/* Financials */}
             <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 1 }}>
                Financials
              </Typography>
            </Grid>
             <Grid item xs={12} md={6}>
               <TextField
                 fullWidth
                 required
                 label="Total Contract Value"
                 name="totalContractValue" // Matches nested structure
                 type="number"
                 inputProps={{ min: 0, step: 0.01 }}
                 value={formData.financials?.totalContractValue || 0}
                 onChange={handleFinancialsChange}
                 InputProps={{
                   startAdornment: (
                     <Typography sx={{ mr: 0.5 }}>
                       {formData.financials?.totalContractValueCurrency || 'INR'}
                     </Typography>
                   ),
                 }}
               />
             </Grid>

            {/* Team Assignment */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 1 }}>
                Team Assignment
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                value={users.find(u => u._id === formData.team?.projectManager) || null}
                onChange={(_, newValue) => handleTeamChange('projectManager', newValue?._id || null)}
                loading={usersLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project Manager"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
             <Grid item xs={12} md={6}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                value={users.find(u => u._id === formData.team?.salesRep) || null}
                onChange={(_, newValue) => handleTeamChange('salesRep', newValue?._id || null)}
                loading={usersLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sales Rep"
                     InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
             {/* Add Autocomplete for Designer and Installation Team (Multi-select) if needed */}


            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Initial Project Notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || customersLoading || usersLoading || !formData.customer}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectForm;
