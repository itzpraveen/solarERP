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
  ImportContacts as ImportIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import projectService, {
  Project,
  ProjectFilter,
} from '../../api/projectService';
import customerService from '../../api/customerService';

// Project form component for creating new projects
const ProjectForm = ({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    customer: '',
    systemSize: 0,
    panelCount: 0,
    panelType: '',
    inverterType: '',
    includesBattery: false,
    batteryType: '',
    batteryCount: 0,
    installAddress: {
      street: '',
      city: '',
      district: '', // Add district field
      state: '',
      zipCode: '',
      country: 'USA', // Consider changing default to 'India' later if needed
    },
    financials: {
      totalContractValue: 0,
    },
  });

  const [customers, setCustomers] = useState<
    Array<{ _id: string; firstName: string; lastName: string }>
  >([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const response = await customerService.getCustomers({ limit: 100 });
        setCustomers(response.data.customers);
        setCustomersLoading(false);
      } catch (error) {
        console.error('Failed to fetch customers', error);
        setCustomersLoading(false);
      }
    };

    if (open) {
      fetchCustomers();
    }
  }, [open]);

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
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer"
                  value={formData.customer}
                  label="Customer"
                  onChange={handleSelectChange}
                  disabled={customersLoading}
                >
                  {customersLoading ? (
                    <MenuItem value="">Loading customers...</MenuItem>
                  ) : (
                    customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.firstName} {customer.lastName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Installation Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="installAddress.street"
                value={formData.installAddress.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="City"
                name="installAddress.city"
                value={formData.installAddress.city}
                onChange={handleChange}
              />
            </Grid> {/* Close City Grid item */}
            
            {/* District Grid item - Now a sibling */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="District"
                name="installAddress.district"
                value={formData.installAddress.district}
                onChange={handleChange}
              />
            </Grid>

            {/* State Grid item */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="State"
                name="installAddress.state"
                value={formData.installAddress.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="installAddress.zipCode"
                value={formData.installAddress.zipCode}
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
                Financial Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Total Contract Value (₹)"
                name="financials.totalContractValue"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.financials.totalContractValue}
                onChange={handleNumberChange}
              />
            </Grid>
          </Grid> {/* This closes the main Grid container */}
          {/* Removed the extra closing </Grid> tag that was here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Project
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Projects = () => {
  const navigate = useNavigate();

  // State for projects data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);

  // State for filters
  const [filters, setFilters] = useState<ProjectFilter>({
    sort: '-createdAt',
  });

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // State for new project form
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    projectId: '',
    projectName: '',
  });

  // Fetch projects data
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await projectService.getProjects({
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });

      setProjects(response.data.projects);
      setTotalProjects(response.results);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch projects');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
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
    fetchProjects();
  };

  // Handle project creation
  const handleCreateProject = async (projectData: any) => {
    try {
      setFormLoading(true);
      await projectService.createProject(projectData);
      setFormOpen(false);
      setFormLoading(false);
      fetchProjects();
    } catch (err: any) {
      setError(err?.message || 'Failed to create project');
      setFormLoading(false);
    }
  };

  // Handle project edit
  const handleEditProject = (id: string) => {
    navigate(`/projects/${id}`);
  };

  // Handle project delete
  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(deleteDialog.projectId);
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchProjects();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete project');
    }
  };

  // Get chip color for project status
  const getStatusColor = (
    status: string
  ): 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'on_hold':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Get stage label
  const getStageLabel = (stage: string): string => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
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
        <Typography variant="h4">Projects</Typography>
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
            New Project
          </Button>
        </Box>
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status || ''}
                label="Status"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select
                name="stage"
                value={filters.stage || ''}
                label="Stage"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All Stages</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="permitting">Permitting</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Project Manager</InputLabel>
              <Select
                name="projectManager"
                value={filters.projectManager || ''}
                label="Project Manager"
                onChange={handleFilterChange as any}
              >
                <MenuItem value="">All Managers</MenuItem>
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
              onClick={fetchProjects}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>System Size</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {project.customer
                      ? `${project.customer.firstName} ${project.customer.lastName}`
                      : 'No Customer'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        project.status.charAt(0).toUpperCase() +
                        project.status.slice(1).replace('_', ' ')
                      }
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getStageLabel(project.stage)}</TableCell>
                  <TableCell>
                    {project.systemSize} kW ({project.panelCount} panels)
                  </TableCell>
                  <TableCell>
                    {project.installAddress.city},{' '}
                    {project.installAddress.state}
                  </TableCell>
                  <TableCell>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditProject(project._id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          projectId: project._id,
                          projectName: project.name,
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
          count={totalProjects}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add Project Form */}
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateProject}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the project "
          {deleteDialog.projectName}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProject}
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

export default Projects;
