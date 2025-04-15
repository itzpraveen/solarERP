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
  Chip,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import leadService, { Lead, LeadFilter } from '../../api/leadService';

// Lead status colors
const statusColors = {
  new: 'info',
  contacted: 'primary',
  qualified: 'success',
  proposal: 'warning',
  won: 'success',
  lost: 'error',
  inactive: 'default',
} as const;

// Lead form component for creating new leads
const LeadForm = ({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (leadData: any) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    source: 'website',
    status: 'new',
    category: 'warm',
    monthlyElectricBill: '',
  });

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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert any numeric strings to numbers
    const processedData = {
      ...formData,
      monthlyElectricBill: formData.monthlyElectricBill
        ? parseFloat(formData.monthlyElectricBill as string)
        : undefined,
    };
    onSubmit(processedData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Lead</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="ZIP Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  name="source"
                  value={formData.source}
                  label="Source"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="partner">Partner</MenuItem>
                  <MenuItem value="cold_call">Cold Call</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="social_media">Social Media</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="hot">Hot</MenuItem>
                  <MenuItem value="warm">Warm</MenuItem>
                  <MenuItem value="cold">Cold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Monthly Electric Bill (₹)"
                name="monthlyElectricBill"
                type="number"
                value={formData.monthlyElectricBill}
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
            Create Lead
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Leads = () => {
  const navigate = useNavigate();

  // State for leads data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeads, setTotalLeads] = useState(0);

  // State for filters
  const [filters, setFilters] = useState<LeadFilter>({
    status: '',
    category: '',
    sort: '-createdAt',
    includeConverted: 'false', // Default to excluding converted leads
  });

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // State for new lead form
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    leadId: '',
    leadName: '',
  });

  // Fetch leads data
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching leads with filters:', JSON.stringify(filters));
      const response = await leadService.getLeads({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
      });

      console.log('Leads response:', JSON.stringify(response));
      setLeads(response.data.leads);
      setTotalLeads(response.results);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err?.message || 'Failed to fetch leads');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLeads();
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
    // Implement search functionality (would likely require backend support)
    alert('Search functionality to be implemented in future release');
  };

  // Handle lead creation
  const handleCreateLead = async (leadData: any) => {
    try {
      setFormLoading(true);
      console.log('Creating lead with data:', JSON.stringify(leadData));
      const result = await leadService.createLead(leadData);
      console.log('Lead creation result:', JSON.stringify(result));
      setFormOpen(false);
      setFormLoading(false);
      // Force refresh leads list
      await fetchLeads();
    } catch (err: any) {
      console.error('Error creating lead:', err);
      setError(err?.message || 'Failed to create lead');
      setFormLoading(false);
    }
  };

  // Handle lead edit
  const handleEditLead = (id: string) => {
    navigate(`/leads/${id}`);
  };

  // Handle lead delete
  const handleDeleteLead = async () => {
    try {
      await leadService.deleteLead(deleteDialog.leadId);
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchLeads();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lead');
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
        <Typography variant="h4">Leads</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add New Lead
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status || ''}
                label="Status"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem>
                <MenuItem value="won">Won</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={filters.category || ''}
                label="Category"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="hot">Hot</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="cold">Cold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
                <MenuItem value="lastName">Name (A-Z)</MenuItem>
                <MenuItem value="-lastName">Name (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Show Converted</InputLabel>
              <Select
                name="includeConverted"
                value={filters.includeConverted || 'false'}
                label="Show Converted"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="false">Hide Converted</MenuItem>
                <MenuItem value="true">Show Converted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchLeads}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Leads Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Category</TableCell>
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
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead._id} hover>
                  <TableCell>
                    {lead.firstName} {lead.lastName}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lead.email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lead.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {lead.address.city}, {lead.address.state}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={
                          lead.status.charAt(0).toUpperCase() +
                          lead.status.slice(1).replace('_', ' ')
                        }
                        color={
                          statusColors[
                            lead.status as keyof typeof statusColors
                          ] || 'default'
                        }
                        size="small"
                      />
                      {lead.converted && (
                        <Chip
                          label="Converted"
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        lead.category.charAt(0).toUpperCase() +
                        lead.category.slice(1)
                      }
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditLead(lead._id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          leadId: lead._id,
                          leadName: `${lead.firstName} ${lead.lastName}`,
                        })
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalLeads}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Lead Form */}
      <LeadForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateLead}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the lead for {deleteDialog.leadName}?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteLead} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leads;
