import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  ImportContacts as ImportIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import customerService, {
  Customer,
  CustomerFilter,
} from '../../api/customerService';

import leadService from '../../api/leadService';

// Customer form component for creating new customers
const CustomerForm = ({
  open,
  onClose,
  onSubmit,
  loading,
  initialLeadId = '',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (customerData: any) => void;
  loading: boolean;
  initialLeadId?: string; // Optional ID for direct lead conversion
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
    preferredContactMethod: 'email',
    leadSource: 'direct',
    originalLead: initialLeadId || '',
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [isDirectConversion, setIsDirectConversion] = useState(!!initialLeadId);

  // Fetch leads for dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLeadsLoading(true);

        // If there's a direct conversion, first fetch that specific lead
        if (initialLeadId) {
          try {
            // Get the specific lead data directly
            const leadResponse = await leadService.getLead(initialLeadId);
            setLeads([leadResponse.data.lead]); // Put it in the leads array
            populateFormFromLead(leadResponse.data.lead);
            console.log(
              'Lead data fetched for direct conversion:',
              leadResponse.data.lead
            );
          } catch (err) {
            console.error('Failed to fetch the specific lead:', err);
          }
        }
        // Otherwise fetch qualified leads that could be converted
        else {
          const response = await leadService.getLeads({
            limit: 100,
            status: 'qualified,proposal,won', // Include qualified, proposal, and won leads
          });
          setLeads(response.data.leads);

          // Only set a default if we have leads to choose from
          if (response.data.leads && response.data.leads.length > 0) {
            setFormData((prev) => ({
              ...prev,
              originalLead: response.data.leads[0]._id,
            }));
            populateFormFromLead(response.data.leads[0]);
          }
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
  }, [open, initialLeadId]);

  // Helper function to populate form data from a lead
  const populateFormFromLead = (lead: any) => {
    if (!lead) return;

    // Use a callback form of setState to ensure we're working with the latest state
    setFormData((prevData) => ({
      ...prevData, // Keep other fields like preferredContactMethod
      originalLead: lead._id,
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: {
        street: lead.address?.street || '',
        city: lead.address?.city || '',
        state: lead.address?.state || '',
        zipCode: lead.address?.zipCode || '',
        country: lead.address?.country || 'USA',
      },
      leadSource: lead.source || 'direct',
      // Add any other fields needed for customer creation
      notes: lead.notes || [],
      monthlyElectricBill: lead.monthlyElectricBill,
      // If the lead was already contacted, set preferred contact method based on experience
      preferredContactMethod: prevData.preferredContactMethod || 'email',
    }));
  };

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

    // If changing the lead, auto-fill customer information
    if (name === 'originalLead') {
      // If the user selected "Create new customer" (empty value)
      if (!value) {
        // Reset the form to empty values except for preferred contact method and lead source
        setFormData({
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
          preferredContactMethod: 'email',
          leadSource: 'direct',
          originalLead: '',
        });
        return;
      }

      // Otherwise find and populate from the selected lead
      const selectedLead = leads.find((lead) => lead._id === value);
      if (selectedLead) {
        populateFormFromLead(selectedLead);
        return;
      }
    }

    // For other selects
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isDirectConversion ? 'Convert Lead to Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              {isDirectConversion ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You are converting a lead to a customer. The information below
                  has been pre-filled from the lead data. You can edit it if
                  needed before creating the customer.
                </Alert>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Convert Lead to Customer
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Select a lead from the dropdown to convert to a customer.
                    The customer information will be pre-filled from the lead
                    data.
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Select Lead</InputLabel>
                    <Select
                      name="originalLead"
                      value={formData.originalLead}
                      label="Select Lead"
                      onChange={handleSelectChange}
                      disabled={leadsLoading}
                    >
                      <MenuItem value="">
                        Create new customer (not from lead)
                      </MenuItem>
                      {leadsLoading ? (
                        <MenuItem value="" disabled>
                          Loading leads...
                        </MenuItem>
                      ) : (
                        leads.map((lead) => (
                          <MenuItem key={lead._id} value={lead._id}>
                            {lead.firstName} {lead.lastName} - {lead.email}{' '}
                            {lead.status
                              ? `(${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)})`
                              : ''}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Grid>
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
                required
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Contact Method</InputLabel>
                <Select
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  label="Preferred Contact Method"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="text">Text Message</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Source</InputLabel>
                <Select
                  name="leadSource"
                  value={formData.leadSource}
                  label="Lead Source"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="direct">Direct</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="social_media">Social Media</MenuItem>
                  <MenuItem value="partner">Partner</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
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
            {isDirectConversion || formData.originalLead
              ? 'Convert to Customer'
              : 'Create Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Customers = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State for customers data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // State for filters
  const [filters, setFilters] = useState<CustomerFilter>({
    sort: '-createdAt',
  });

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // State for new customer form
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState('');

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customerId: '',
    customerName: '',
  });

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerService.getCustomers({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });

      setCustomers(response.data.customers);
      setTotalCustomers(response.results);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch customers');
      setLoading(false);
    }
  };

  // Check for direct lead conversion from URL
  const [searchParams] = useSearchParams();

  // Initial data fetch and check for lead conversion
  useEffect(() => {
    fetchCustomers();

    // Check if we're converting a lead directly from the URL
    const leadId = searchParams.get('convertLead');
    if (leadId) {
      setConvertLeadId(leadId);
      setFormOpen(true);

      // Validate the lead ID exists
      leadService
        .getLead(leadId)
        .then(() => {
          console.log('Lead validated for conversion');
        })
        .catch((err) => {
          console.error('Invalid lead ID for conversion:', err);
          setError('Could not find the lead to convert. Please try again.');
          setFormOpen(false); // Close the form if lead doesn't exist

          // Clear the URL parameter
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('convertLead');
          navigate({ search: newParams.toString() }, { replace: true });
        });
    }
  }, [page, rowsPerPage, filters, searchParams, navigate]);

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
    fetchCustomers();
  };

  // Handle customer creation
  const handleCreateCustomer = async (customerData: any) => {
    try {
      setFormLoading(true);
      setSuccessMessage(null); // Clear any previous success messages

      let response;

      // If this is a lead conversion, use the dedicated endpoint
      if (customerData.originalLead) {
        console.log(
          'Converting lead to customer using dedicated endpoint:',
          customerData.originalLead
        );
        response = await customerService.convertLeadToCustomer(
          customerData.originalLead
        );
        console.log('Lead successfully converted to customer:', response);

        // Set success message for lead conversion
        setError(null); // Clear any previous errors
        const successMsg = `Lead successfully converted to customer: ${customerData.firstName} ${customerData.lastName}`;
        setSuccessMessage(successMsg);
      } else {
        // For new customers (not from leads), use standard creation
        response = await customerService.createCustomer(customerData);
        console.log('Customer created successfully:', response);
      }

      setFormOpen(false);
      setFormLoading(false);
      fetchCustomers();
    } catch (err: any) {
      console.error('Error creating/converting customer:', err);
      setError(err?.message || 'Failed to create customer');
      setFormLoading(false);
    }
  };

  // Handle customer edit
  const handleEditCustomer = (id: string) => {
    navigate(`/customers/${id}`);
  };

  // Handle customer delete
  const handleDeleteCustomer = async () => {
    try {
      await customerService.deleteCustomer(deleteDialog.customerId);
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchCustomers();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete customer');
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
        <Typography variant="h4">Customers</Typography>
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' }, // Stack reversed on mobile
          alignItems: { xs: 'stretch', sm: 'center' } // Stretch on mobile
        }}>
          <Button variant="outlined" startIcon={<ImportIcon />} sx={{ mr: 1 }}>
            Import
          </Button>
          <Button variant="outlined" startIcon={<ExportIcon />} sx={{ mr: 1 }}>
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Add New Customer
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by name, email, or phone"
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select
                name="assignedTo"
                value={filters.assignedTo || ''}
                label="Assigned To"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                {/* This would ideally be populated from a users API */}
                <MenuItem value="current">Assigned to Me</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCustomers}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Information</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Preferred Contact</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {`${customer.firstName || ''} ${customer.lastName || ''}`.trim()}
                    </Typography>
                    {customer.leadSource && (
                      <Chip
                        label={
                          customer.leadSource.charAt(0).toUpperCase() +
                          customer.leadSource.slice(1).replace('_', ' ')
                        }
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer.phone || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {customer.address
                      ? `${customer.address.city || 'N/A'}, ${customer.address.state || 'N/A'}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {customer.preferredContactMethod
                      ? customer.preferredContactMethod
                          .charAt(0)
                          .toUpperCase() +
                        customer.preferredContactMethod.slice(1)
                      : 'Email'}
                  </TableCell>
                  <TableCell>
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditCustomer(customer._id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          customerId: customer._id,
                          customerName: `${customer.firstName} ${customer.lastName}`,
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
          count={totalCustomers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Customer Form */}
      <CustomerForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setConvertLeadId(''); // Clear the conversion ID when closing

          // If we came from a lead conversion URL, go back to leads
          if (convertLeadId) {
            const newSearch = new URLSearchParams(searchParams);
            newSearch.delete('convertLead');
            navigate({ search: newSearch.toString() });
          }
        }}
        onSubmit={handleCreateCustomer}
        loading={formLoading}
        initialLeadId={convertLeadId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the customer record for{' '}
          {deleteDialog.customerName}? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCustomer}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
