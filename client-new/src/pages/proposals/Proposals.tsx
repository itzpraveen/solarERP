import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Remove useLocation
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import proposalService, {
  Proposal,
  ProposalFilter,
} from '../../api/proposalService';
import leadService from '../../api/leadService';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';

// Proposal form component for creating new proposals
const ProposalForm = ({
  open,
  onClose,
  onSubmit,
  loading,
  initialLeadId, // Add initialLeadId prop
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposalData: any) => void;
  loading: boolean;
  initialLeadId?: string | null; // Make it optional
}) => {
  const [formData, setFormData] = useState({
    lead: '',
    name: '',
    systemSize: 0,
    panelCount: 0,
    panelType: '',
    inverterType: '',
    includesBattery: false,
    batteryType: '',
    batteryCount: 0,
    yearlyProductionEstimate: 0,
    estimatedSavings: {
      firstYear: 0,
      twentyFiveYear: 0,
    },
    pricing: {
      grossCost: 0,
      centralSubsidy: 0, // Renamed
      stateSubsidy: 0,   // Renamed
      gstRate: 12,       // Added (example default)
      gstAmount: 0,      // Added
      utilityRebate: 0,
      otherIncentives: 0,
      netCost: 0,
      currency: 'INR',   // Added currency
    },
    notes: '',
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Fetch leads for dropdown or pre-select based on initialLeadId
  useEffect(() => {
    const fetchData = async () => {
      setLeadsLoading(true);
      try {
        if (initialLeadId) {
          // Fetch only the specific lead if initialLeadId is provided
          console.log('Fetching specific lead for form:', initialLeadId);
          const response = await leadService.getLead(initialLeadId);
          const lead = response.data.lead;
          if (lead) {
            setLeads([lead]); // Set only this lead in the options
            setFormData((prev) => ({
              ...prev,
              lead: lead._id,
              name: `Solar Proposal for ${lead.firstName} ${lead.lastName}`,
            }));
            console.log('Pre-selected lead:', lead._id);
          } else {
            console.error('Initial lead not found:', initialLeadId);
            // Fallback to fetching all leads if specific one not found? Or show error?
            // For now, just log error and fetch all
            const response = await leadService.getLeads({ limit: 100 });
            setLeads(response.data.leads || []);
          }
        } else {
          // Fetch all leads if no initialLeadId
          console.log('Fetching all leads for form');
          const response = await leadService.getLeads({ limit: 100 });
          const fetchedLeads = response.data.leads || [];
          setLeads(fetchedLeads);
          // Set the first lead as default if available
          if (fetchedLeads.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lead: fetchedLeads[0]._id,
              name: `Solar Proposal for ${fetchedLeads[0].firstName} ${fetchedLeads[0].lastName}`,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch lead data for form', error);
        setLeads([]); // Clear leads on error
      } finally {
        setLeadsLoading(false);
      }
    };

    if (open) {
      fetchData();
    } else {
      // Reset form when dialog closes? Optional.
      // setFormData({ ...initial empty state ... });
      // setLeads([]);
    }
    // Add initialLeadId to dependency array
  }, [open, initialLeadId]);

  // Calculate gstAmount and netCost whenever relevant pricing values change
  useEffect(() => {
    const {
      grossCost,
      centralSubsidy,
      stateSubsidy,
      gstRate,
      utilityRebate,
      otherIncentives,
    } = formData.pricing;

    // Calculate GST Amount
    const calculatedGstAmount = (grossCost * gstRate) / 100;

    // Calculate Net Cost (Gross + GST - Subsidies/Rebates)
    const calculatedNetCost =
      grossCost +
      calculatedGstAmount -
      centralSubsidy -
      stateSubsidy -
      utilityRebate -
      otherIncentives;

    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        gstAmount: calculatedGstAmount > 0 ? calculatedGstAmount : 0,
        netCost: calculatedNetCost > 0 ? calculatedNetCost : 0,
      },
    }));
  }, [ // Update dependencies
    formData.pricing.grossCost,
    formData.pricing.centralSubsidy,
    formData.pricing.stateSubsidy,
    formData.pricing.gstRate,
    formData.pricing.utilityRebate,
    formData.pricing.otherIncentives,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as any),
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as any),
          [child]: parseFloat(value) || 0,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;

    // If lead changes, update proposal name
    if (name === 'lead') {
      const selectedLead = leads.find((lead) => lead._id === value);
      if (selectedLead) {
        setFormData({
          ...formData,
          lead: value,
          name: `Solar Proposal for ${selectedLead.firstName} ${selectedLead.lastName}`,
        });
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBooleanChange = (e: any) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Lead</InputLabel>
                <Select
                  name="lead"
                  value={formData.lead}
                  label="Select Lead"
                  onChange={handleSelectChange}
                  disabled={leadsLoading}
                >
                  {leadsLoading ? (
                    <MenuItem value="">Loading leads...</MenuItem>
                  ) : (
                    leads.map((lead) => (
                      <MenuItem key={lead._id} value={lead._id}>
                        {lead.firstName} {lead.lastName} - {lead.email}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Proposal Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
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
                label="Panel Type"
                name="panelType"
                value={formData.panelType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Inverter Type"
                name="inverterType"
                value={formData.inverterType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Includes Battery</InputLabel>
                <Select
                  name="includesBattery"
                  value={formData.includesBattery ? 'true' : 'false'}
                  label="Includes Battery"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includesBattery: e.target.value === 'true',
                    })
                  }
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.includesBattery && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Battery Type"
                    name="batteryType"
                    value={formData.batteryType}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Battery Count"
                    name="batteryCount"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={formData.batteryCount}
                    onChange={handleNumberChange}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Production & Savings Estimates
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Yearly Production (kWh)"
                name="yearlyProductionEstimate"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.yearlyProductionEstimate}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={`First Year Savings (₹)`}
                name="estimatedSavings.firstYear"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.estimatedSavings.firstYear}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={`25-Year Savings (₹)`}
                name="estimatedSavings.twentyFiveYear"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.estimatedSavings.twentyFiveYear}
                onChange={handleNumberChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Pricing & Incentives
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={`Gross Cost (₹)`}
                name="pricing.grossCost"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.grossCost}
                onChange={handleNumberChange}
              />
            </Grid>
            {/* Using Central Subsidy */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={`Central Subsidy (₹)`}
                name="pricing.centralSubsidy"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.centralSubsidy}
                onChange={handleNumberChange}
              />
            </Grid>
            {/* Using State Subsidy */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`State Subsidy (₹)`}
                name="pricing.stateSubsidy"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.stateSubsidy}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Utility Rebate (₹)`}
                name="pricing.utilityRebate"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.utilityRebate}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Other Incentives (₹)`}
                name="pricing.otherIncentives"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.otherIncentives}
                onChange={handleNumberChange}
              />
            </Grid>
            {/* Added GST Rate Field */}
            <Grid item xs={12} md={4}>
               <TextField
                 fullWidth
                 required
                 label={`GST Rate (%)`}
                 name="pricing.gstRate"
                 type="number"
                 inputProps={{ min: 0, step: 0.1 }}
                 value={formData.pricing.gstRate}
                 onChange={handleNumberChange}
               />
            </Grid>
            {/* Added GST Amount Field (Read Only) */}
             <Grid item xs={12} md={4}>
               <TextField
                 fullWidth
                 required
                 label={`GST Amount (₹)`}
                 name="pricing.gstAmount"
                 type="number"
                 value={formData.pricing.gstAmount}
                 InputProps={{
                   readOnly: true, // GST Amount is calculated
                 }}
               />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={`Net Cost After Incentives (₹)`}
                name="pricing.netCost"
                type="number"
                value={formData.pricing.netCost}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
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
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Proposal
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Proposals = () => {
  const navigate = useNavigate();

  // State for proposals data
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProposals, setTotalProposals] = useState(0);

  // State for filters
  const [filters, setFilters] = useState<ProposalFilter>({
    sort: '-createdAt',
  });

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // State for new proposal form
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    proposalId: '',
    proposalName: '',
  });

  // State for send confirmation
  const [sendDialog, setSendDialog] = useState({
    open: false,
    proposalId: '',
    proposalName: '',
    leadEmail: '',
  });

  // Fetch proposals data
  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await proposalService.getProposals({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });

      setProposals(response.data.proposals);
      setTotalProposals(response.results);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch proposals');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProposals();
  }, [page, rowsPerPage, filters]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setPage(0);
  };

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchProposals();
  };

  // Handle proposal creation
  const handleCreateProposal = async (proposalData: any) => {
    try {
      setFormLoading(true);
      await proposalService.createProposal(proposalData);
      setFormOpen(false);
      setFormLoading(false);
      fetchProposals();
    } catch (err: any) {
      setError(err?.message || 'Failed to create proposal');
      setFormLoading(false);
    }
  };

  // Handle proposal edit
  const handleEditProposal = (id: string) => {
    navigate(`/proposals/${id}`);
  };

  // Handle proposal delete
  const handleDeleteProposal = async () => {
    try {
      await proposalService.deleteProposal(deleteDialog.proposalId);
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchProposals();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete proposal');
    }
  };

  // Handle send proposal
  const handleSendProposal = async () => {
    try {
      await proposalService.sendProposal(sendDialog.proposalId);
      setError(null);
      setSendDialog({ ...sendDialog, open: false });
      fetchProposals();
    } catch (err: any) {
      setError(err?.message || 'Failed to send proposal');
    }
  };

  // Get status color for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'viewed':
        return 'info';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Proposals</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Create Proposal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by name or customer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status || ''}
                label="Status"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="viewed">Viewed</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                name="sort"
                value={filters.sort || '-createdAt'}
                label="Sort By"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="-createdAt">Newest First</MenuItem>
                <MenuItem value="createdAt">Oldest First</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="-pricing.grossCost">Highest Value</MenuItem>
                <MenuItem value="pricing.grossCost">Lowest Value</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchProposals}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Proposals Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Proposal Name</TableCell>
              <TableCell>Lead</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>System</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No proposals found.
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((proposal) => (
                <TableRow key={proposal._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {proposal.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {proposal.lead
                      ? `${proposal.lead.firstName || ''} ${
                          proposal.lead.lastName || ''
                        }`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        proposal.status.charAt(0).toUpperCase() +
                        proposal.status.slice(1)
                      }
                      color={getStatusColor(proposal.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {proposal.systemSize} kW ({proposal.panelCount} panels)
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay amount={proposal.pricing.grossCost} />
                  </TableCell>
                  <TableCell>
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditProposal(proposal._id)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>

                      {proposal.status === 'draft' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            setSendDialog({
                              open: true,
                              proposalId: proposal._id,
                              proposalName: proposal.name,
                              leadEmail: proposal.lead.email,
                            })
                          }
                          title="Send to Lead"
                        >
                          <SendIcon />
                        </IconButton>
                      )}

                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/proposals/${proposal._id}`)}
                        title="View"
                      >
                        <ViewIcon />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            proposalId: proposal._id,
                            proposalName: proposal.name,
                          })
                        }
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalProposals}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Create Proposal Form */}
      <ProposalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateProposal}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the proposal "
          {deleteDialog.proposalName}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProposal}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog
        open={sendDialog.open}
        onClose={() => setSendDialog({ ...sendDialog, open: false })}
      >
        <DialogTitle>Send Proposal</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to send "{sendDialog.proposalName}" to{' '}
            {sendDialog.leadEmail}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will email the proposal to the lead and update the proposal
            status to "Sent".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog({ ...sendDialog, open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleSendProposal}
            color="primary"
            variant="contained"
            startIcon={<SendIcon />}
          >
            Send Proposal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Proposals;
