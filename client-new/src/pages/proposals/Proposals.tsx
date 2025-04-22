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
// import leadService from '../../api/leadService'; // Removed unused import
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
// Import the corrected ProposalForm component
import ProposalForm from '../../features/proposals/components/ProposalForm';
// Import the correct data type for the form submission
import { ProposalFormData } from '../../features/proposals/components/ProposalForm';

// The inline form definition has been removed.
// The correct ProposalForm component is imported from '../../features/proposals/components/ProposalForm'.

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
  }, [page, rowsPerPage, filters, fetchProposals]); // Added fetchProposals to dependency array

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

  // Handle proposal creation - Update type signature to use ProposalFormData
  const handleCreateProposal = async (proposalData: ProposalFormData) => {
    try {
      setFormLoading(true);
      // The proposalData received here should now be correctly structured
      // by the imported ProposalForm component's handleSubmit function.
      await proposalService.createProposal(proposalData);
      setFormOpen(false);
      setFormLoading(false);
      fetchProposals(); // Refresh list on success
      setError(null); // Clear previous errors on success
    } catch (err: any) {
      console.error('Proposal creation failed:', err.response?.data || err); // Log the full error
      let errorMessage = 'Failed to create proposal. Please try again.';
      // Check if it's a validation error from our backend
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        // Format the validation errors
        errorMessage = `Validation failed: ${err.response.data.errors
          .map(
            (e: { message: string; field: string }) =>
              `${e.message} (field: ${e.field})`
          )
          .join(', ')}`;
      } else if (err.response?.data?.message) {
        // Use message from backend response if available
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Fallback to generic error message
        errorMessage = err.message;
      }
      setError(errorMessage);
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
                    {/* Use finalProjectCost which is calculated on the backend, provide default value and correct prop name */}
                    <CurrencyDisplay
                      amount={proposal.finalProjectCost ?? 0}
                      currencyCode={proposal.currency}
                    />
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
