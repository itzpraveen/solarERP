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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  Assignment as AssignmentIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import serviceRequestService, { ServiceRequest, ServiceRequestFilter } from '../../api/serviceRequestService';
import customerService from '../../api/customerService';
import projectService from '../../api/projectService';

// Status chips with appropriate colors
const StatusChip = ({ status }: { status: ServiceRequest['status'] }) => {
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined;
  
  switch (status) {
    case 'new':
      color = 'info';
      break;
    case 'assigned':
      color = 'secondary';
      break;
    case 'in_progress':
      color = 'primary';
      break;
    case 'on_hold':
      color = 'warning';
      break;
    case 'completed':
      color = 'success';
      break;
    case 'cancelled':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  
  return (
    <Chip 
      label={status.replace('_', ' ').toUpperCase()} 
      color={color} 
      size="small" 
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

// Priority indicator with colors
const PriorityChip = ({ priority }: { priority: ServiceRequest['priority'] }) => {
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined;
  
  switch (priority) {
    case 'low':
      color = 'success';
      break;
    case 'medium':
      color = 'info';
      break;
    case 'high':
      color = 'warning';
      break;
    case 'urgent':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  
  return (
    <Chip 
      label={priority.toUpperCase()} 
      color={color} 
      size="small" 
      variant="outlined" 
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

const ServiceRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for service requests data
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  
  // State for filters
  const [filters, setFilters] = useState<ServiceRequestFilter>({
    sort: '-createdAt'
  });
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    requestId: '',
    requestTitle: ''
  });
  
  // Filter options
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch service requests data
  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceRequestService.getServiceRequests({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      });
      
      console.log('Service requests response:', response);
      
      // Check the structure of the response and handle both possible formats
      if (response.serviceRequests) {
        // Direct format: { serviceRequests: [...], totalCount: n }
        setServiceRequests(response.serviceRequests);
        setTotalRequests(response.totalCount || 0);
      } else if (response.data && response.data.serviceRequests) {
        // Nested format: { data: { serviceRequests: [...] }, results: n }
        setServiceRequests(response.data.serviceRequests);
        setTotalRequests(response.results || 0);
      } else {
        // Fallback for unexpected format
        setServiceRequests([]);
        setTotalRequests(0);
        console.error('Unexpected response format:', response);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Service request fetch error:', err);
      setError(err?.message || 'Failed to fetch service requests');
      setLoading(false);
    }
  };
  
  // Fetch customers and projects for filters
  const fetchFilterOptions = async () => {
    try {
      const [customerResponse, projectResponse] = await Promise.all([
        customerService.getCustomers({ limit: 100 }),
        projectService.getProjects({ limit: 100 })
      ]);
      
      setCustomers(customerResponse.data.customers);
      setProjects(projectResponse.data.projects);
    } catch (err: any) {
      console.error('Failed to fetch filter options:', err);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchServiceRequests();
    fetchFilterOptions();
  }, [page, rowsPerPage, filters]);
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setPage(0);
  };
  
  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchServiceRequests();
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
    fetchServiceRequests();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({ sort: '-createdAt' });
    setFilterDialogOpen(false);
  };
  
  // Handle service request creation
  const handleCreateRequest = () => {
    navigate('/services/new');
  };
  
  // Handle service request edit
  const handleEditRequest = (id: string) => {
    navigate(`/services/${id}/edit`);
  };
  
  // Handle service request delete
  const handleDeleteRequest = async () => {
    try {
      await serviceRequestService.deleteServiceRequest(deleteDialog.requestId);
      setDeleteDialog({ ...deleteDialog, open: false });
      setSuccessMessage('Service request deleted successfully');
      fetchServiceRequests();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete service request');
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Service Requests
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateRequest}
        >
          New Service Request
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      
      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search by title or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                )
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
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              More Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchServiceRequests}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Service Requests Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Request Info</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Technician</TableCell>
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
            ) : serviceRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No service requests found.
                </TableCell>
              </TableRow>
            ) : (
              serviceRequests.map((request) => (
                <TableRow key={request._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {request.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1).replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.customer.firstName} {request.customer.lastName}
                    </Typography>
                    {request.project && (
                      <Typography variant="caption" color="text.secondary">
                        Project: {request.project.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={request.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    {request.scheduledDate ? 
                      new Date(request.scheduledDate).toLocaleDateString() : 
                      <Typography variant="body2" color="text.secondary">Not scheduled</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    {request.assignedTechnician ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EngineeringIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {request.assignedTechnician.firstName} {request.assignedTechnician.lastName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleEditRequest(request._id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteDialog({
                          open: true,
                          requestId: request._id,
                          requestTitle: request.title
                        })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalRequests}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Advanced Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer"
                  value={filters.customer || ''}
                  label="Customer"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.firstName} {customer.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  name="project"
                  value={filters.project || ''}
                  label="Project"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Request Type</InputLabel>
                <Select
                  name="requestType"
                  value={filters.requestType || ''}
                  label="Request Type"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="installation">Installation</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={filters.priority || ''}
                  label="Priority"
                  onChange={handleFilterChange as any}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
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
                  <MenuItem value="-priority">Highest Priority</MenuItem>
                  <MenuItem value="priority">Lowest Priority</MenuItem>
                  <MenuItem value="scheduledDate">Scheduled Date (Ascending)</MenuItem>
                  <MenuItem value="-scheduledDate">Scheduled Date (Descending)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Reset Filters</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyFilters} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the service request "{deleteDialog.requestTitle}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={handleDeleteRequest} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequests;