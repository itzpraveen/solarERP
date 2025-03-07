import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  EventNote as NoteIcon,
  Assignment as ProjectIcon
} from '@mui/icons-material';
import customerService, { Customer } from '../../api/customerService';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Sample data for projects (in a real app, this would come from the API)
const sampleProjects = [
  {
    id: 'proj1',
    name: 'Residential Solar Installation',
    status: 'in_progress',
    startDate: '2024-03-05',
    estimatedCompletionDate: '2024-04-15',
    systemSize: 7.5,
    totalCost: 24000
  },
  {
    id: 'proj2',
    name: 'Battery Backup System',
    status: 'planning',
    startDate: '2024-04-20',
    estimatedCompletionDate: '2024-05-10',
    systemSize: 0,
    totalCost: 12000
  }
];

// Project status colors for visual indication
const projectStatusColors = {
  planning: 'info',
  approved: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error'
} as const;

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for customer data
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  
  // State for new note
  const [newNote, setNewNote] = useState('');

  // Fetch customer data
  const fetchCustomer = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.getCustomer(id);
      setCustomer(response.data.customer);
      setEditData(response.data.customer);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch customer');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCustomer();
  }, [id]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData({
        ...editData,
        [parent]: {
          ...editData[parent as keyof typeof editData] as any,
          [child]: value
        }
      });
    } else {
      setEditData({
        ...editData,
        [name]: value
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Canceling edit - reset data
      setEditData(customer || {});
    }
    setEditMode(!editMode);
  };

  // Save customer changes
  const saveCustomer = async () => {
    if (!id || !editData) return;
    
    try {
      setLoading(true);
      await customerService.updateCustomer(id, editData);
      await fetchCustomer();
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update customer');
      setLoading(false);
    }
  };

  // Delete customer
  const deleteCustomer = async () => {
    if (!id) return;
    
    try {
      await customerService.deleteCustomer(id);
      navigate('/customers');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete customer');
    }
  };

  // Add note
  const addNote = async () => {
    if (!id || !newNote.trim()) return;
    
    try {
      await customerService.addNote(id, newNote);
      setNewNote('');
      setNoteDialog(false);
      fetchCustomer();
    } catch (err: any) {
      setError(err?.message || 'Failed to add note');
    }
  };

  if (loading && !customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !customer) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!customer) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Customer not found
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} color="inherit" to="/dashboard" underline="hover">
          Dashboard
        </Link>
        <Link component={RouterLink} color="inherit" to="/customers" underline="hover">
          Customers
        </Link>
        <Typography color="text.primary">
          {customer.firstName} {customer.lastName}
        </Typography>
      </Breadcrumbs>
      
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/customers')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {customer.firstName} {customer.lastName}
          </Typography>
        </Box>
        
        <Box>
          {!editMode ? (
            <>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={toggleEditMode}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />} 
                onClick={saveCustomer}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<CancelIcon />}
                onClick={toggleEditMode}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Contact Info" />
          <Tab label="Projects" />
          <Tab label="Notes" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {customer.firstName} {customer.lastName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={customer.active ? 'Active' : 'Inactive'} 
                          color={customer.active ? 'success' : 'default'} 
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                        {customer.email}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                        {customer.phone}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Preferred Contact Method</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                          <InputLabel>Preferred Contact</InputLabel>
                          <Select
                            name="preferredContactMethod"
                            value={editData.preferredContactMethod || customer.preferredContactMethod || 'email'}
                            label="Preferred Contact"
                            onChange={handleSelectChange}
                          >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="phone">Phone</MenuItem>
                            <MenuItem value="text">Text Message</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {customer.preferredContactMethod ? 
                            customer.preferredContactMethod.charAt(0).toUpperCase() + customer.preferredContactMethod.slice(1) : 
                            'Email'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Lead Source</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                          <InputLabel>Lead Source</InputLabel>
                          <Select
                            name="leadSource"
                            value={editData.leadSource || customer.leadSource || 'direct'}
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
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {customer.leadSource ? 
                            customer.leadSource.charAt(0).toUpperCase() + customer.leadSource.slice(1).replace('_', ' ') : 
                            'Direct'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        <HomeIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                        {customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zipCode}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Projects Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {sampleProjects.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body1" color="text.secondary">
                        No projects found for this customer.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        component={RouterLink}
                        to="/projects/new"
                      >
                        Create Project
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <List>
                        {sampleProjects.map((project) => (
                          <ListItem
                            key={project.id}
                            divider
                            secondaryAction={
                              <Button 
                                variant="outlined" 
                                size="small"
                                component={RouterLink}
                                to={`/projects/${project.id}`}
                              >
                                View
                              </Button>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <ProjectIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={project.name}
                              secondary={
                                <>
                                  <Chip 
                                    label={project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    size="small"
                                    color={projectStatusColors[project.status as keyof typeof projectStatusColors] || 'default'}
                                    sx={{ mr: 1, my: 0.5 }}
                                  />
                                  <Typography variant="body2" component="span" color="text.secondary">
                                    {project.systemSize > 0 ? `${project.systemSize} kW • ` : ''}
                                    ${project.totalCost.toLocaleString()}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ textAlign: 'right', mt: 2 }}>
                        <Button 
                          component={RouterLink}
                          to={`/customers/${customer._id}/projects`}
                        >
                          View All Projects
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Recent Notes
                    </Typography>
                    <Button 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => setNoteDialog(true)}
                    >
                      Add Note
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {!customer.notes || customer.notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notes have been added yet.
                    </Typography>
                  ) : (
                    <List dense>
                      {(customer.notes.slice(0, 2) || []).map((note, index) => (
                        <ListItem key={index} divider={index < Math.min(customer.notes?.length || 0, 2) - 1}>
                          <ListItemAvatar>
                            <Avatar>
                              <NoteIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={new Date(note.createdAt).toLocaleDateString()}
                            secondary={note.text.length > 60 ? `${note.text.substring(0, 60)}...` : note.text}
                          />
                        </ListItem>
                      ))}
                      {(customer.notes?.length || 0) > 2 && (
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                          <Button size="small" onClick={() => setTabValue(3)}>
                            View All Notes
                          </Button>
                        </Box>
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Contact Info Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">First Name</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="firstName"
                          value={editData.firstName || customer.firstName}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.firstName}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Last Name</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="lastName"
                          value={editData.lastName || customer.lastName}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.lastName}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      </Box>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="email"
                          type="email"
                          value={editData.email || customer.email}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.email}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      </Box>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="phone"
                          value={editData.phone || customer.phone}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.phone}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Preferred Contact Method</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Preferred Contact</InputLabel>
                          <Select
                            name="preferredContactMethod"
                            value={editData.preferredContactMethod || customer.preferredContactMethod || 'email'}
                            label="Preferred Contact"
                            onChange={handleSelectChange}
                          >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="phone">Phone</MenuItem>
                            <MenuItem value="text">Text Message</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.preferredContactMethod ? 
                            customer.preferredContactMethod.charAt(0).toUpperCase() + customer.preferredContactMethod.slice(1) : 
                            'Email'}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Address
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HomeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary">Street</Typography>
                      </Box>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.street"
                          value={editData.address?.street || customer.address.street}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.address.street}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">City</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.city"
                          value={editData.address?.city || customer.address.city}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.address.city}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">State</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.state"
                          value={editData.address?.state || customer.address.state}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.address.state}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">ZIP Code</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.zipCode"
                          value={editData.address?.zipCode || customer.address.zipCode}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {customer.address.zipCode}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Projects Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Customer Projects
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              component={RouterLink}
              to="/projects/new"
              state={{ customerId: customer._id }}
            >
              Create New Project
            </Button>
          </Box>
          
          {sampleProjects.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No projects have been created for this customer yet.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                component={RouterLink}
                to="/projects/new"
                state={{ customerId: customer._id }}
              >
                Create First Project
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>System Size</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleProjects.map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          color={projectStatusColors[project.status as keyof typeof projectStatusColors] || 'default'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Start: {new Date(project.startDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Est. Completion: {new Date(project.estimatedCompletionDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {project.systemSize > 0 ? `${project.systemSize} kW` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        ${project.totalCost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small"
                          component={RouterLink}
                          to={`/projects/${project.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Notes Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Customer Notes
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setNoteDialog(true)}
            >
              Add Note
            </Button>
          </Box>
          
          {!customer.notes || customer.notes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No notes have been added for this customer yet.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setNoteDialog(true)}
              >
                Add First Note
              </Button>
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {(customer.notes || [])
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((note, index) => (
                  <Paper sx={{ mb: 2 }} key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <NoteIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ whiteSpace: 'pre-wrap', mt: 1 }}
                          >
                            {note.text}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
            </List>
          )}
        </TabPanel>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this customer? This action cannot be undone and will remove all customer data.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteCustomer} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Note"
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(false)}>Cancel</Button>
          <Button 
            onClick={addNote} 
            color="primary" 
            variant="contained"
            disabled={!newNote.trim()}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetails;