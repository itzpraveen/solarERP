import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposalData: any) => void;
  loading: boolean;
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
      federalTaxCredit: 0,
      stateTaxCredit: 0,
      utilityRebate: 0,
      otherIncentives: 0,
      netCost: 0,
    },
    notes: '',
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Fetch leads for dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLeadsLoading(true);
        const response = await leadService.getLeads({ limit: 100 });
        setLeads(response.data.leads);

        // If leads are available, set the first one as default
        if (response.data.leads && response.data.leads.length > 0) {
          setFormData((prev) => ({
            ...prev,
            lead: response.data.leads[0]._id,
            name: `Solar Proposal for ${response.data.leads[0].firstName} ${response.data.leads[0].lastName}`,
          }));
        }

        setLeadsLoading(false);
      } catch (error) {
        console.error('Failed to fetch leads', error);
        setLeadsLoading(false);
      }
    };

    if (open) {
      fetchLeads();
    }
  }, [open]);

  // Calculate netCost whenever pricing values change
  useEffect(() => {
    const {
      grossCost,
      federalTaxCredit,
      stateTaxCredit,
      utilityRebate,
      otherIncentives,
    } = formData.pricing;
    const netCost =
      grossCost -
      federalTaxCredit -
      stateTaxCredit -
      utilityRebate -
      otherIncentives;

    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        netCost: netCost > 0 ? netCost : 0,
      },
    }));
  }, [
    formData.pricing.grossCost,
    formData.pricing.federalTaxCredit,
    formData.pricing.stateTaxCredit,
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={`Federal Tax Credit (₹)`}
                name="pricing.federalTaxCredit"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.federalTaxCredit}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`State Tax Credit (₹)`}
                name="pricing.stateTaxCredit"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.stateTaxCredit}
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
