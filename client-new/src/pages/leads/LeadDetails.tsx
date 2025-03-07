import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
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
  Link
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
  MonetizationOn as MoneyIcon,
  EventNote as NoteIcon,
  Forum as InteractionIcon
} from '@mui/icons-material';
import leadService, { Lead } from '../../api/leadService';

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
      id={`lead-tabpanel-${index}`}
      aria-labelledby={`lead-tab-${index}`}
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

// Lead status colors
const statusColors = {
  new: 'info',
  contacted: 'primary',
  qualified: 'success',
  proposal: 'warning',
  won: 'success',
  lost: 'error',
  inactive: 'default'
} as const;

// Lead status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'inactive', label: 'Inactive' }
];

// Lead category options
const categoryOptions = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' }
];

// Lead source options
const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'event', label: 'Event' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
];

// Interaction type options
const interactionTypes = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' }
];

// Property type options
const propertyTypes = [
  { value: 'residential_single', label: 'Residential (Single Family)' },
  { value: 'residential_multi', label: 'Residential (Multi-Family)' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'other', label: 'Other' }
];

// Roof type options
const roofTypes = [
  { value: 'shingle', label: 'Shingle' },
  { value: 'metal', label: 'Metal' },
  { value: 'tile', label: 'Tile' },
  { value: 'flat', label: 'Flat' },
  { value: 'other', label: 'Other' }
];

// Shading options
const shadingOptions = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' }
];

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for lead data
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [interactionDialog, setInteractionDialog] = useState(false);
  
  // State for new note and interaction
  const [newNote, setNewNote] = useState('');
  const [newInteraction, setNewInteraction] = useState({
    type: 'phone',
    summary: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch lead data
  const fetchLead = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await leadService.getLead(id);
      setLead(response.data.lead);
      setEditData(response.data.lead);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch lead');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLead();
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
      setEditData(lead || {});
    }
    setEditMode(!editMode);
  };

  // Save lead changes
  const saveLead = async () => {
    if (!id || !editData) return;
    
    try {
      setLoading(true);
      await leadService.updateLead(id, editData);
      await fetchLead();
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead');
      setLoading(false);
    }
  };

  // Delete lead
  const deleteLead = async () => {
    if (!id) return;
    
    try {
      await leadService.deleteLead(id);
      navigate('/leads');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lead');
    }
  };

  // Add note
  const addNote = async () => {
    if (!id || !newNote.trim()) return;
    
    try {
      await leadService.addNote(id, newNote);
      setNewNote('');
      setNoteDialog(false);
      fetchLead();
    } catch (err: any) {
      setError(err?.message || 'Failed to add note');
    }
  };

  // Add interaction
  const addInteraction = async () => {
    if (!id || !newInteraction.summary.trim()) return;
    
    try {
      await leadService.addInteraction(id, newInteraction);
      setNewInteraction({
        type: 'phone',
        summary: '',
        date: new Date().toISOString().split('T')[0]
      });
      setInteractionDialog(false);
      fetchLead();
    } catch (err: any) {
      setError(err?.message || 'Failed to add interaction');
    }
  };

  // Update lead status - returns a promise so it can be chained
  const updateStatus = async (status: string) => {
    if (!id) return Promise.reject('No lead ID provided');
    
    try {
      const result = await leadService.updateStatus(id, status);
      await fetchLead();
      return Promise.resolve(result);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update status';
      setError(errorMsg);
      return Promise.reject(errorMsg);
    }
  };

  if (loading && !lead) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !lead) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!lead) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Lead not found
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard" underline="hover">
          Dashboard
        </Link>
        <Link color="inherit" href="/leads" underline="hover">
          Leads
        </Link>
        <Typography color="text.primary">
          {lead.firstName} {lead.lastName}
        </Typography>
      </Breadcrumbs>
      
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/leads')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {lead.firstName} {lead.lastName}
          </Typography>
          <Chip 
            label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
            color={statusColors[lead.status as keyof typeof statusColors] || 'default'}
            sx={{ ml: 2 }}
          />
          <Chip 
            label={lead.category.charAt(0).toUpperCase() + lead.category.slice(1)}
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Box>
          {!editMode ? (
            <>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<PersonIcon />} 
                onClick={async () => {
                  try {
                    // First update the lead status to qualified if needed
                    if (lead.status !== 'qualified' && lead.status !== 'won') {
                      // Try to update the status, but don't throw an error if it fails
                      try {
                        await leadService.updateStatus(id!, 'qualified');
                        // Wait for the lead data to refresh
                        await fetchLead();
                      } catch (err) {
                        console.warn("Could not update status, but proceeding with conversion:", err);
                      }
                    }
                    
                    // Always navigate to customer conversion page
                    navigate(`/customers?convertLead=${id}`);
                  } catch (error) {
                    console.error("Error during lead conversion:", error);
                    setError("Failed to start conversion process. Please try again.");
                  }
                }}
                sx={{ mr: 1 }}
                title="Convert this lead to a customer"
              >
                Convert to Customer
              </Button>
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
                onClick={saveLead}
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
          <Tab label="Property Details" />
          <Tab label="Notes & Interactions" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lead Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            name="status"
                            value={editData.status || lead.status}
                            label="Status"
                            onChange={handleSelectChange}
                          >
                            {statusOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                            color={statusColors[lead.status as keyof typeof statusColors] || 'default'}
                            size="small"
                          />
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            name="category"
                            value={editData.category || lead.category}
                            label="Category"
                            onChange={handleSelectChange}
                          >
                            {categoryOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.category.charAt(0).toUpperCase() + lead.category.slice(1)}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Source</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            name="source"
                            value={editData.source || lead.source}
                            label="Source"
                            onChange={handleSelectChange}
                          >
                            {sourceOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace('_', ' ')}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Monthly Electric Bill</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="monthlyElectricBill"
                          type="number"
                          value={editData.monthlyElectricBill || ''}
                          onChange={handleEditChange}
                          label="Amount"
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.monthlyElectricBill ? `₹${lead.monthlyElectricBill.toLocaleString()}` : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
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
                    Quick Actions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Update Status
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {statusOptions.map(option => (
                          <Button
                            key={option.value}
                            variant={lead.status === option.value ? 'contained' : 'outlined'}
                            size="small"
                            color={statusColors[option.value as keyof typeof statusColors] as any || 'primary'}
                            onClick={() => updateStatus(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Add Information
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<NoteIcon />}
                          onClick={() => setNoteDialog(true)}
                        >
                          Add Note
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<InteractionIcon />}
                          onClick={() => setInteractionDialog(true)}
                        >
                          Add Interaction
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {!lead.interactions || lead.interactions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No recent activity recorded.
                    </Typography>
                  ) : (
                    <List dense>
                      {[...lead.interactions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 3)
                        .map((interaction, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>
                                <InteractionIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1).replace('_', ' ')}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {new Date(interaction.date).toLocaleDateString()}
                                  </Typography>
                                  {` — ${interaction.summary}`}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
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
                          value={editData.firstName || lead.firstName}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.firstName}
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
                          value={editData.lastName || lead.lastName}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.lastName}
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
                          value={editData.email || lead.email}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.email}
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
                          value={editData.phone || lead.phone}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.phone}
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
                          value={editData.address?.street || lead.address.street}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.address.street}
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
                          value={editData.address?.city || lead.address.city}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.address.city}
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
                          value={editData.address?.state || lead.address.state}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.address.state}
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
                          value={editData.address?.zipCode || lead.address.zipCode}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.address.zipCode}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Property Details Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Property Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Property Type</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Property Type</InputLabel>
                          <Select
                            name="propertyType"
                            value={editData.propertyType || lead.propertyType || ''}
                            label="Property Type"
                            onChange={handleSelectChange}
                          >
                            {propertyTypes.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.propertyType ? 
                            propertyTypes.find(t => t.value === lead.propertyType)?.label || lead.propertyType :
                            'Not specified'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Roof Type</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Roof Type</InputLabel>
                          <Select
                            name="roofType"
                            value={editData.roofType || lead.roofType || ''}
                            label="Roof Type"
                            onChange={handleSelectChange}
                          >
                            {roofTypes.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.roofType ? 
                            roofTypes.find(t => t.value === lead.roofType)?.label || lead.roofType :
                            'Not specified'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Roof Age (years)</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="roofAge"
                          type="number"
                          value={editData.roofAge || ''}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.roofAge !== undefined ? lead.roofAge : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Shading</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Shading</InputLabel>
                          <Select
                            name="shading"
                            value={editData.shading || lead.shading || ''}
                            label="Shading"
                            onChange={handleSelectChange}
                          >
                            {shadingOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.shading ? 
                            shadingOptions.find(t => t.value === lead.shading)?.label || lead.shading :
                            'Not specified'}
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
                    System Requirements
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Monthly Electric Bill</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="monthlyElectricBill"
                          type="number"
                          value={editData.monthlyElectricBill || ''}
                          onChange={handleEditChange}
                          label="Amount"
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                          }}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.monthlyElectricBill ? `₹${lead.monthlyElectricBill.toLocaleString()}` : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Estimated System Size (kW)</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="estimatedSystemSize"
                          type="number"
                          value={editData.estimatedSystemSize || ''}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.estimatedSystemSize ? `${lead.estimatedSystemSize} kW` : 'Not estimated yet'}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notes & Interactions Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Notes
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
                  
                  {!lead.notes || lead.notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notes have been added yet.
                    </Typography>
                  ) : (
                    <List>
                      {[...lead.notes]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((note, index) => (
                          <ListItem key={index} alignItems="flex-start" divider={index < lead.notes!.length - 1}>
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
                              secondary={note.text}
                            />
                          </ListItem>
                        ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Interactions
                    </Typography>
                    <Button 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => setInteractionDialog(true)}
                    >
                      Add Interaction
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {!lead.interactions || lead.interactions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No interactions have been recorded yet.
                    </Typography>
                  ) : (
                    <List>
                      {[...lead.interactions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((interaction, index) => (
                          <ListItem key={index} alignItems="flex-start" divider={index < lead.interactions!.length - 1}>
                            <ListItemAvatar>
                              <Avatar>
                                <InteractionIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip 
                                    label={interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1).replace('_', ' ')}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="subtitle2">
                                    {new Date(interaction.date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={interaction.summary}
                            />
                          </ListItem>
                        ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lead? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteLead} color="error" variant="contained">Delete</Button>
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
      
      {/* Add Interaction Dialog */}
      <Dialog open={interactionDialog} onClose={() => setInteractionDialog(false)}>
        <DialogTitle>Add Interaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newInteraction.type}
                  label="Type"
                  onChange={(e) => setNewInteraction({
                    ...newInteraction,
                    type: e.target.value as string
                  })}
                >
                  {interactionTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newInteraction.date}
                onChange={(e) => setNewInteraction({
                  ...newInteraction,
                  date: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Summary"
                multiline
                rows={3}
                value={newInteraction.summary}
                onChange={(e) => setNewInteraction({
                  ...newInteraction,
                  summary: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractionDialog(false)}>Cancel</Button>
          <Button 
            onClick={addInteraction} 
            color="primary" 
            variant="contained"
            disabled={!newInteraction.summary.trim()}
          >
            Add Interaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadDetails;