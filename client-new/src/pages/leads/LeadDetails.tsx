import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // Import Link as RouterLink
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
  Link,
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
  Forum as InteractionIcon,
  Description as DescriptionIcon, // Added for Proposal button
} from '@mui/icons-material';
import leadService, { Lead } from '../../api/leadService';
import userService, { User } from '../../api/userService'; // Import userService and User type
// Import Proposal type along with the service
import proposalService from '../../api/proposalService'; // Removed unused Proposal type import
import ProposalForm from '../../features/proposals/components/ProposalForm'; // Import the new form component
import { useSnackbar } from 'notistack'; // Import useSnackbar
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  inactive: 'default',
} as const;

// Lead status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'inactive', label: 'Inactive' },
];

// Lead category options
const categoryOptions = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

// Lead source options
const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'event', label: 'Event' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' },
];

// Interaction type options
const interactionTypes = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' },
];

// Property type options
const propertyTypes = [
  { value: 'residential_single', label: 'Residential (Single Family)' },
  { value: 'residential_multi', label: 'Residential (Multi-Family)' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'other', label: 'Other' },
];

// Roof type options
const roofTypes = [
  { value: 'shingle', label: 'Shingle' },
  { value: 'metal', label: 'Metal' },
  { value: 'tile', label: 'Tile' },
  { value: 'flat', label: 'Flat' },
  { value: 'other', label: 'Other' },
];

// Shading options
const shadingOptions = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
];

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar(); // Call the hook here

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
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false); // State for proposal dialog
  const [proposalLoading, setProposalLoading] = useState(false); // State for proposal creation loading
  const [proposalError, setProposalError] = useState<string | null>(null); // State for proposal creation error
  const [users, setUsers] = useState<User[]>([]); // State for users list
  const [usersLoading, setUsersLoading] = useState(false); // State for user loading indicator

  // State for new note and interaction
  const [newNote, setNewNote] = useState('');
  const [newInteraction, setNewInteraction] = useState({
    type: 'phone',
    summary: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch lead data
  const fetchLead = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await leadService.getLead(id);
      const fetchedLead = response.data.lead;
      setLead(fetchedLead);
      // Initialize editData with the full lead object
      setEditData(fetchedLead);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch lead');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLead();
    // Users will be fetched on demand when edit mode is entered
  }, [id, fetchLead]); // Added fetchLead to dependencies

  // Function to fetch users, called on demand
  const fetchUsersIfNeeded = async () => {
    // Only fetch if users haven't been loaded yet and aren't currently loading
    if (users.length === 0 && !usersLoading) {
      setUsersLoading(true); // Set loading state
      try {
        console.log('Fetching users for assignment dropdown...');
        // Fetch all users, maybe limit fields later if needed
        const response = await userService.getUsers({ limit: 1000 }); // Fetch a large number for now
        setUsers(response.data.users);
        console.log('Users fetched successfully.');
      } catch (err) {
        console.error('Failed to fetch users:', err);
        enqueueSnackbar('Failed to load users for assignment', {
          variant: 'error',
        });
      } finally {
        setUsersLoading(false); // Reset loading state regardless of success/failure
      }
    }
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle edit form changes
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'monthlyElectricBill.amount') {
      const numericValue = value ? parseFloat(value) : NaN; // Use NaN for invalid/empty

      setEditData((prevData) => {
        if (!isNaN(numericValue)) {
          // Valid number: update or create the object
          return {
            ...prevData,
            monthlyElectricBill: {
              // Use existing currency if available, else default
              currency: prevData.monthlyElectricBill?.currency || 'INR',
              amount: numericValue,
            },
          };
        } else {
          // Invalid or empty number: remove the monthlyElectricBill object
          const { monthlyElectricBill, ...rest } = prevData;
          return { ...rest, monthlyElectricBill: undefined };
        }
      });
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData((prevData) => ({
        ...prevData,
        [parent]: {
          ...(prevData[parent as keyof typeof prevData] as any),
          [child]: value,
        },
      }));
    } else {
      setEditData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    // Special handling for assignedTo: find the user object and store it
    if (name === 'assignedTo') {
      const selectedUser = users.find((user) => user._id === value);
      setEditData((prevData) => ({
        ...prevData,
        // Store the found user object or undefined if "Unassigned" (value === '')
        assignedTo: selectedUser || undefined,
      } as Partial<Lead>)); // Explicitly cast the returned object
    } else {
      setEditData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!editMode) {
      // Entering edit mode
      fetchUsersIfNeeded();
      // Reset editData to the current lead state
      setEditData(lead || {});
    } else {
      // Canceling edit mode - reset editData to the current lead state
      setEditData(lead || {});
    }
    setEditMode(!editMode);
  };

  // Save lead changes
  const saveLead = async () => {
    if (!id || !editData) return;

    // Prepare the payload specifically for the API update
    // Create a new object to avoid mutating editData directly
    const updatePayload: any = { ...editData };

    // Ensure assignedTo is sent as an ID string or null
    if (updatePayload.assignedTo && typeof updatePayload.assignedTo === 'object') {
      // If it's a user object, extract the ID
      updatePayload.assignedTo = (updatePayload.assignedTo as User)._id;
    } else if (updatePayload.assignedTo === undefined) {
      // If it's undefined (meaning unassigned was selected), send null
      updatePayload.assignedTo = null;
    }
    // If it's already null or a string ID, it's fine as is.

    try {
      console.log('Saving lead with payload:', JSON.stringify(updatePayload, null, 2));
      setLoading(true);
      // Send the specifically prepared payload
      // Cast to Partial<Lead> for the service call, assuming the service handles the ID correctly
      await leadService.updateLead(id, updatePayload as Partial<Lead>);
      console.log('Lead update successful');
      await fetchLead(); // Refresh data with potentially populated assignedTo object
      setEditMode(false);
    } catch (err: any) {
      console.error('Error updating lead:', err);
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
        date: new Date().toISOString().split('T')[0],
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/leads')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {lead.firstName} {lead.lastName}
          </Typography>
          <Chip
            label={
              lead.status.charAt(0).toUpperCase() +
              lead.status.slice(1).replace('_', ' ')
            }
            color={
              statusColors[lead.status as keyof typeof statusColors] ===
              'default'
                ? 'primary'
                : (statusColors[
                    lead.status as keyof typeof statusColors
                  ] as any)
            }
            sx={{ ml: 2 }}
          />
          <Chip
            label={
              lead.category.charAt(0).toUpperCase() + lead.category.slice(1)
            }
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
                    setLoading(true);

                    // First update the lead status to qualified if needed
                    if (lead.status !== 'qualified' && lead.status !== 'won') {
                      try {
                        console.log(
                          'Updating lead status to qualified before conversion'
                        );
                        await leadService.updateStatus(id!, 'qualified');

                        // Wait for the lead data to refresh to ensure we have the latest status
                        await fetchLead();
                        console.log('Lead status updated successfully');
                      } catch (err) {
                        console.error(
                          'Failed to update lead status before conversion:',
                          err
                        );
                        setError(
                          'Failed to update lead status. Please try again.'
                        );
                        setLoading(false);
                        return; // Stop the conversion process if status update fails
                      }
                    }

                    // Navigate to customer conversion page with the lead ID
                    console.log('Navigating to customer conversion page');
                    navigate(`/customers?convertLead=${id}`);
                  } catch (error) {
                    console.error('Error during lead conversion:', error);
                    setError(
                      'Failed to start conversion process. Please try again.'
                    );
                    setLoading(false);
                  }
                }}
                sx={{ mr: 1 }}
                title="Convert this lead to a customer"
              >
                Convert to Customer
              </Button>
              {/* Add Create Proposal Button */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<DescriptionIcon />}
                onClick={() => setProposalDialogOpen(true)} // Open dialog instead of navigating
                sx={{ mr: 1 }}
                title="Create a new proposal for this lead"
                disabled={!lead} // Disable if lead data isn't loaded
              >
                Create Proposal
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            name="status"
                            value={editData.status || lead.status}
                            label="Status"
                            onChange={handleSelectChange}
                          >
                            {statusOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={
                              lead.status.charAt(0).toUpperCase() +
                              lead.status.slice(1).replace('_', ' ')
                            }
                            color={
                              statusColors[
                                lead.status as keyof typeof statusColors
                              ] === 'default'
                                ? 'primary'
                                : (statusColors[
                                    lead.status as keyof typeof statusColors
                                  ] as any)
                            }
                            size="small"
                          />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Category
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            name="category"
                            value={editData.category || lead.category}
                            label="Category"
                            onChange={handleSelectChange}
                          >
                            {categoryOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.category.charAt(0).toUpperCase() +
                            lead.category.slice(1)}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Source
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            name="source"
                            value={editData.source || lead.source}
                            label="Source"
                            onChange={handleSelectChange}
                          >
                            {sourceOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.source.charAt(0).toUpperCase() +
                            lead.source.slice(1).replace('_', ' ')}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Monthly Electric Bill
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="monthlyElectricBill.amount"
                          type="number"
                          // Display the amount from editData, converting back to string for input
                          value={
                            editData.monthlyElectricBill?.amount?.toString() ||
                            ''
                          }
                          onChange={handleEditChange}
                          label="Amount"
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ mr: 1 }}>₹</Typography>
                            ),
                          }}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.monthlyElectricBill?.amount // Access amount property
                            ? `₹${lead.monthlyElectricBill.amount.toLocaleString()}` // Format the amount
                            : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assigned To
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Assigned To</InputLabel>
                          {usersLoading ? (
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '40px', // Match Select height
                              }}
                            >
                              <CircularProgress size={20} />
                            </Box>
                          ) : (
                            <Select
                              name="assignedTo"
                              // Derive the value (ID) from the user object stored in editData
                              value={editData.assignedTo?._id || ''}
                              label="Assigned To"
                              onChange={handleSelectChange}
                          >
                            <MenuItem value="">
                              <em>Unassigned</em>
                            </MenuItem>
                            {users.map((user) => (
                              <MenuItem key={user._id} value={user._id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.assignedTo
                            ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                            : 'Unassigned'}
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
                    Quick Actions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Update Status
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {statusOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant={
                              lead.status === option.value
                                ? 'contained'
                                : 'outlined'
                            }
                            size="small"
                            color={
                              statusColors[
                                option.value as keyof typeof statusColors
                              ] === 'default'
                                ? 'primary'
                                : (statusColors[
                                    option.value as keyof typeof statusColors
                                  ] as any)
                            }
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
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .slice(0, 3)
                        .map((interaction, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>
                                <InteractionIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                interaction.type.charAt(0).toUpperCase() +
                                interaction.type.slice(1).replace('_', ' ')
                              }
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {new Date(
                                      interaction.date
                                    ).toLocaleDateString()}
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

              {/* Linked Proposals Card */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Linked Proposals
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {!lead.proposals || lead.proposals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No proposals created for this lead yet.
                    </Typography>
                  ) : (
                    <List dense>
                      {lead.proposals.map((proposal) => (
                        <ListItem
                          key={proposal._id}
                          secondaryAction={
                            <Chip
                              label={proposal.status}
                              size="small"
                              // Add color based on proposal status if needed
                            />
                          }
                          disablePadding
                        >
                          <ListItemText
                            primary={
                              <Link
                                component={RouterLink}
                                to={`/proposals/${proposal._id}`}
                                underline="hover"
                              >
                                {proposal.name}
                              </Link>
                            }
                            secondary={`Created: ${new Date(proposal.createdAt).toLocaleDateString()}`}
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
                      <Typography variant="subtitle2" color="text.secondary">
                        First Name
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Name
                      </Typography>
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
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                      >
                        <EmailIcon
                          fontSize="small"
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
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
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                      >
                        <PhoneIcon
                          fontSize="small"
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
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
                        <HomeIcon
                          fontSize="small"
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                        <Typography variant="subtitle2" color="text.secondary">
                          Street
                        </Typography>
                      </Box>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.street"
                          value={
                            editData.address?.street || lead.address.street
                          }
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
                      <Typography variant="subtitle2" color="text.secondary">
                        City
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">
                        State
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">
                        ZIP Code
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="address.zipCode"
                          value={
                            editData.address?.zipCode || lead.address.zipCode
                          }
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Property Type
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Property Type</InputLabel>
                          <Select
                            name="propertyType"
                            value={
                              editData.propertyType || lead.propertyType || ''
                            }
                            label="Property Type"
                            onChange={handleSelectChange}
                          >
                            {propertyTypes.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.propertyType
                            ? propertyTypes.find(
                                (t) => t.value === lead.propertyType
                              )?.label || lead.propertyType
                            : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Roof Type
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Roof Type</InputLabel>
                          <Select
                            name="roofType"
                            value={editData.roofType || lead.roofType || ''}
                            label="Roof Type"
                            onChange={handleSelectChange}
                          >
                            {roofTypes.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.roofType
                            ? roofTypes.find((t) => t.value === lead.roofType)
                                ?.label || lead.roofType
                            : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Roof Age (years)
                      </Typography>
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
                          {lead.roofAge !== undefined
                            ? lead.roofAge
                            : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Shading
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Shading</InputLabel>
                          <Select
                            name="shading"
                            value={editData.shading || lead.shading || ''}
                            label="Shading"
                            onChange={handleSelectChange}
                          >
                            {shadingOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.shading
                            ? shadingOptions.find(
                                (t) => t.value === lead.shading
                              )?.label || lead.shading
                            : 'Not specified'}
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Monthly Electric Bill
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="monthlyElectricBill.amount"
                          type="number"
                          // Display the amount from editData, converting back to string for input
                          value={
                            editData.monthlyElectricBill?.amount?.toString() ||
                            ''
                          }
                          onChange={handleEditChange}
                          label="Amount"
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ mr: 1 }}>₹</Typography>
                            ),
                          }}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {lead.monthlyElectricBill?.amount // Access amount property
                            ? `₹${lead.monthlyElectricBill.amount.toLocaleString()}` // Format the amount
                            : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Estimated System Size (kW)
                      </Typography>
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
                          {lead.estimatedSystemSize
                            ? `${lead.estimatedSystemSize} kW`
                            : 'Not estimated yet'}
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">Notes</Typography>
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
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((note, index) => (
                          <ListItem
                            key={index}
                            alignItems="flex-start"
                            divider={index < lead.notes!.length - 1}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <NoteIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2">
                                  {new Date(
                                    note.createdAt
                                  ).toLocaleDateString()}{' '}
                                  at{' '}
                                  {new Date(
                                    note.createdAt
                                  ).toLocaleTimeString()}
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">Interactions</Typography>
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
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .map((interaction, index) => (
                          <ListItem
                            key={index}
                            alignItems="flex-start"
                            divider={index < lead.interactions!.length - 1}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <InteractionIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <Chip
                                    label={
                                      interaction.type.charAt(0).toUpperCase() +
                                      interaction.type
                                        .slice(1)
                                        .replace('_', ' ')
                                    }
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="subtitle2">
                                    {new Date(
                                      interaction.date
                                    ).toLocaleDateString()}
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
          Are you sure you want to delete this lead? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteLead} color="error" variant="contained">
            Delete
          </Button>
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
      <Dialog
        open={interactionDialog}
        onClose={() => setInteractionDialog(false)}
      >
        <DialogTitle>Add Interaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newInteraction.type}
                  label="Type"
                  onChange={(e) =>
                    setNewInteraction({
                      ...newInteraction,
                      type: e.target.value as string,
                    })
                  }
                >
                  {interactionTypes.map((option) => (
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
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    date: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    summary: e.target.value,
                  })
                }
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

      {/* Proposal Creation Dialog */}
      {lead && (
        <ProposalForm
          open={proposalDialogOpen}
          onClose={() => {
            setProposalDialogOpen(false);
            setProposalError(null); // Clear error on close
          }}
          onSubmit={async (proposalData) => {
            console.log('Submitting proposal data:', proposalData);
            setProposalLoading(true);
            setProposalError(null);
            try {
              // Ensure lead ID is correctly passed and add default values for required fields
              const validUntilDate = new Date();
              validUntilDate.setDate(validUntilDate.getDate() + 30); // Set valid for 30 days

              // Construct the payload matching the service expectation
              const dataToSubmit = {
                ...proposalData, // Includes name, systemSize, panelCount, financingOptions, etc.
                // Removed incorrect equipment mapping as it's not in ProposalFormData or the backend model
                // Removed redundant pricing object mapping; fields are already at top level from proposalData spread
                // Ensure required fields from proposalData are present and have defaults if needed
                projectCostExcludingStructure:
                  proposalData.projectCostExcludingStructure || 0, // Already spread, but explicit default is safe
                structureCost: proposalData.structureCost || 0,
                subsidyAmount: proposalData.subsidyAmount || 0,
                additionalCosts: proposalData.additionalCosts || 0,
                currency: proposalData.currency || 'INR',
                // Pass only the lead ID string
                lead: lead._id,
                // Add other fields required by the backend model but not directly in the form
                status: 'draft' as const, // Use const assertion for literal type
                validUntil: validUntilDate.toISOString(),
                active: true,
                // financingOptions and designImages can be added later if needed
              };

              const createdProposalResponse = // Renamed variable for clarity
                await proposalService.createProposal(dataToSubmit);
              console.log('Proposal created successfully:', createdProposalResponse);
              setProposalDialogOpen(false);
              // Add success notification
              enqueueSnackbar('Proposal created successfully!', { variant: 'success' });
              // Update lead status to 'proposal' (fire and forget, or handle potential error)
              updateStatus('proposal').catch((statusErr) => {
                console.error('Failed to auto-update lead status to proposal:', statusErr);
                // Optionally show another snackbar for this specific error
                enqueueSnackbar('Proposal created, but failed to update lead status.', { variant: 'warning' });
              });
              // Navigate to the new proposal's detail page
              navigate(`/proposals/${createdProposalResponse.data.proposal._id}`);
            } catch (err: any) {
              console.error('Failed to create proposal:', err);
              const errorMsg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create proposal';
              setProposalError(errorMsg);
              // Keep the dialog open on error so user can see the message/retry
            } finally {
              setProposalLoading(false);
            }
          }}
          loading={proposalLoading}
          initialLeadId={lead._id} // Pass the current lead's ID
        />
      )}
      {/* Display proposal creation error within the dialog or below */}
      {/* Note: ProposalForm might need internal error display, or handle it here */}
      {proposalError &&
        !proposalDialogOpen && ( // Show persistent error below if dialog closed
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            Proposal Creation Error: {proposalError}
          </Alert>
        )}
    </Box>
  );
};

export default LeadDetails;
