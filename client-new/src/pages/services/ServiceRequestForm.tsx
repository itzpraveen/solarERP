import { useState, useEffect, useCallback } from 'react'; // Removed unused useContext
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Engineering as EngineeringIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import serviceRequestService, {
  ServiceRequest,
} from '../../api/serviceRequestService';
import customerService from '../../api/customerService';
import projectService from '../../api/projectService';
// import { AuthContext } from '../../features/auth/context/AuthContext'; // Removed unused import

// Using MUI TextField with type="date" instead of DatePicker component
// Simple date formatting function instead of using date-fns
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Status chips with appropriate colors
const StatusChip = ({ status }: { status: ServiceRequest['status'] }) => {
  let color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | undefined;

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

const ServiceRequestForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';

  // Form data state
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    requestType: 'maintenance',
    priority: 'medium',
    status: 'new',
    customer: '',
    project: '',
    assignedTechnician: '',
    scheduledDate: null,
    completionDate: null,
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Options for selects
  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customerProjects, setCustomerProjects] = useState<any[]>([]);

  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  // Fetch projects for the selected customer (wrapped in useCallback)
  const fetchCustomerProjects = useCallback(async (customerId: string) => {
    try {
      const response = await projectService.getProjects({
        customer: customerId,
      });
      setCustomerProjects(response.data.projects);
    } catch (err) {
      console.error('Failed to fetch customer projects:', err);
      // Optionally set an error state here if needed
    }
  }, []); // Empty dependency array as projectService is stable

  // Fetch service request data if editing
  useEffect(() => {
    const fetchServiceRequest = async () => {
      // Double-check id is valid before fetching
      if (!id || id === 'new') {
        // setError('Invalid service request ID for fetching.'); // Don't set error here, handled below
        setInitialLoading(false);
        return;
      }
      try {
        // Set loading true only when actually fetching
        setInitialLoading(true);
        setError(null); // Clear previous errors

        const response = await serviceRequestService.getServiceRequest(id);
        const serviceReq = response.data.serviceRequest;

        // Format the service request data for form
        setFormData({
          title: serviceReq.title,
          description: serviceReq.description,
          requestType: serviceReq.requestType,
          priority: serviceReq.priority,
          status: serviceReq.status,
          customer: serviceReq.customer._id,
          project: serviceReq.project?._id || '',
          assignedTechnician: serviceReq.assignedTechnician?._id || '',
          scheduledDate: serviceReq.scheduledDate
            ? new Date(serviceReq.scheduledDate)
            : null,
          completionDate: serviceReq.completionDate
            ? new Date(serviceReq.completionDate)
            : null,
        });

        // Set notes if available
        if (serviceReq.notes && serviceReq.notes.length > 0) {
          setNotes(serviceReq.notes);
        }

        // Load projects for the selected customer
        if (serviceReq.customer?._id) {
          fetchCustomerProjects(serviceReq.customer._id);
        }

        setInitialLoading(false);
      } catch (err: any) {
        console.error('Error fetching service request:', err);
        setError(err?.message || 'Failed to fetch service request data');
        setInitialLoading(false);
      }
    };

    if (isEditing) {
      // Only attempt fetch if editing and id seems valid initially
      fetchServiceRequest();
    } else {
      // Explicitly handle the 'new' case
      setInitialLoading(false); // Ensure loading is off for new form
      setError(null); // Clear any potential stale errors
      // Reset form data if needed (though initial useState might be sufficient)
      // setFormData({ title: '', ... });
    }
  }, [id, isEditing, fetchCustomerProjects]); // Now fetchCustomerProjects is defined above

  // Fetch options data for selects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch customers
        const customerResponse = await customerService.getCustomers({
          limit: 100,
        });
        setCustomers(customerResponse.data.customers);

        // Fetch all projects for project selection
        const projectResponse = await projectService.getProjects({
          limit: 100,
        });
        // setProjects(projectResponse.data.projects); // Removed as _projects state is unused

        // Fetch technicians (this would be a users API with role filter in a real app)
        // For now, we'll mock a few technicians
        setTechnicians([
          {
            _id: 'tech1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@solar.com',
          },
          {
            _id: 'tech2',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@solar.com',
          },
          {
            _id: 'tech3',
            firstName: 'Michael',
            lastName: 'Davis',
            email: 'michael@solar.com',
          },
        ]);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch form options');
      }
    };

    fetchOptions();
  }, []);

  // Handle input changes for text fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // If customer changes, fetch their projects
    if (name === 'customer' && value) {
      fetchCustomerProjects(value as string);
    }
  };

  // Handle date changes
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData({
      ...formData,
      [fieldName]: date,
    });
  };

  // Moved fetchCustomerProjects definition above the useEffect that uses it

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add description, requestType, priority to validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.requestType ||
      !formData.priority ||
      !formData.customer
    ) {
      setError('Please fill all required fields');
      return;
    }

    // Removed potentially problematic check: if (isEditing && !id)
    // The main if/else block below correctly handles the logic based on isEditing.

    try {
      setLoading(true);
      setError(null);
      // Format dates for API
      const formattedData: any = {
        // Use 'any' temporarily for easier key deletion
        ...formData,
        // Format dates
        scheduledDate: formData.scheduledDate
          ? formatDate(formData.scheduledDate)
          : undefined,
        completionDate: formData.completionDate
          ? formatDate(formData.completionDate)
          : undefined,
      };

      // Explicitly remove optional fields if they are empty/falsy
      if (!formattedData.project) {
        delete formattedData.project;
      }
      if (!formattedData.assignedTechnician) {
        delete formattedData.assignedTechnician;
      }

      // Use a more robust check: id must exist and not be 'new' for update
      if (id && id !== 'new') {
        await serviceRequestService.updateServiceRequest(id, formattedData); // id is guaranteed to be a string here
        setSuccess('Service request updated successfully');
      } else {
        // This branch handles the 'new' case (id === 'new' or id is undefined initially)
        const response =
          await serviceRequestService.createServiceRequest(formattedData);
        setSuccess('Service request created successfully');

        // Navigate to the detail page after a short delay
        if (response.data?.serviceRequest?._id) {
          setTimeout(() => {
            navigate(`/services/${response.data.serviceRequest._id}`);
          }, 1500);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error saving service request:', err);
      setError(err?.message || 'Failed to save service request');
      setLoading(false);
    }
  };

  // Handle adding a note
  const handleAddNote = async () => {
    if (!noteText.trim() || !id) {
      return;
    }

    try {
      setLoading(true);

      const response = await serviceRequestService.addNote(id, noteText);

      // Update notes list
      if (response.data && response.data.notes) {
        setNotes(response.data.notes);
      }

      // Clear note text and close dialog
      setNoteText('');
      setNoteDialogOpen(false);
      setLoading(false);
      setSuccess('Note added successfully');
    } catch (err: any) {
      console.error('Error adding note:', err);
      setError(err?.message || 'Failed to add note');
      setLoading(false);
    }
  };

  // Handle completion of service request
  const handleCompleteRequest = async () => {
    if (!id) {
      setError('Invalid service request ID');
      return;
    }

    try {
      setLoading(true);

      const completionDetails = {
        completionDate: formatDate(new Date()),
        notes: completionNote,
      };

      const response = await serviceRequestService.completeServiceRequest(
        id,
        completionDetails
      );

      // Update form data
      setFormData({
        ...formData,
        status: 'completed',
        completionDate: new Date(),
      });

      // If there was a note, update notes list
      if (completionNote && response.data && response.data.notes) {
        setNotes(response.data.notes);
      }

      setCompleteDialogOpen(false);
      setCompletionNote('');
      setLoading(false);
      setSuccess('Service request marked as completed');
    } catch (err: any) {
      console.error('Error completing service request:', err);
      setError(err?.message || 'Failed to complete service request');
      setLoading(false);
    }
  };

  // Conditional rendering of action buttons
  const renderActionButtons = () => {
    if (!isEditing) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {formData.status !== 'completed' && formData.status !== 'cancelled' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CompleteIcon />}
            onClick={() => setCompleteDialogOpen(true)}
          >
            Mark as Completed
          </Button>
        )}

        <Button variant="outlined" onClick={() => setNoteDialogOpen(true)}>
          Add Note
        </Button>
      </Box>
    );
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Button
          component={Link}
          to="/services"
          startIcon={<BackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Service Requests
        </Button>

        {isEditing && <StatusChip status={formData.status} />}
      </Box>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEditing ? 'Edit Service Request' : 'Create Service Request'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column - Request Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title="Request Details"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ bgcolor: 'primary.lightest', pb: 1 }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      disabled={
                        formData.status === 'completed' ||
                        formData.status === 'cancelled'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Description"
                      name="description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      disabled={
                        formData.status === 'completed' ||
                        formData.status === 'cancelled'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Request Type</InputLabel>
                      <Select
                        name="requestType"
                        value={formData.requestType}
                        label="Request Type"
                        onChange={handleSelectChange}
                        disabled={
                          formData.status === 'completed' ||
                          formData.status === 'cancelled'
                        }
                      >
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="repair">Repair</MenuItem>
                        <MenuItem value="installation">Installation</MenuItem>
                        <MenuItem value="inspection">Inspection</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        name="priority"
                        value={formData.priority}
                        label="Priority"
                        onChange={handleSelectChange}
                        disabled={
                          formData.status === 'completed' ||
                          formData.status === 'cancelled'
                        }
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {isEditing ? (
                      <FormControl fullWidth required>
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={formData.status}
                          label="Status"
                          onChange={handleSelectChange}
                          disabled={
                            formData.status === 'completed' ||
                            formData.status === 'cancelled'
                          }
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="assigned">Assigned</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="on_hold">On Hold</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl fullWidth disabled>
                        <InputLabel>Status</InputLabel>
                        <Select name="status" value="new" label="Status">
                          <MenuItem value="new">New</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Notes section (only for existing requests) */}
            {isEditing && (
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  title="Notes"
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ bgcolor: 'primary.lightest', pb: 1 }}
                  action={
                    <Button
                      startIcon={<AddIcon />}
                      size="small"
                      onClick={() => setNoteDialogOpen(true)}
                    >
                      Add Note
                    </Button>
                  }
                />
                <CardContent>
                  {notes.length === 0 ? (
                    <Typography color="text.secondary">No notes yet</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {notes.map((note, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Added by: {note.createdBy || 'System'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(note.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography>{note.text}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column - Related Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Related Information"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ bgcolor: 'primary.lightest', pb: 1 }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Customer</InputLabel>
                      <Select
                        name="customer"
                        value={formData.customer}
                        label="Customer"
                        onChange={handleSelectChange}
                        disabled={
                          formData.status === 'completed' ||
                          formData.status === 'cancelled'
                        }
                      >
                        <MenuItem value="">Select Customer</MenuItem>
                        {customers.map((customer) => (
                          <MenuItem key={customer._id} value={customer._id}>
                            {customer.firstName} {customer.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Related Project</InputLabel>
                      <Select
                        name="project"
                        value={formData.project}
                        label="Related Project"
                        onChange={handleSelectChange}
                        disabled={
                          !formData.customer ||
                          formData.status === 'completed' ||
                          formData.status === 'cancelled'
                        }
                      >
                        <MenuItem value="">No Project</MenuItem>
                        {customerProjects.length > 0 ? (
                          customerProjects.map((project) => (
                            <MenuItem key={project._id} value={project._id}>
                              {project.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled value="">
                            No projects available for this customer
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Assigned Technician</InputLabel>
                      <Select
                        name="assignedTechnician"
                        value={formData.assignedTechnician}
                        label="Assigned Technician"
                        onChange={handleSelectChange}
                        disabled={
                          formData.status === 'completed' ||
                          formData.status === 'cancelled'
                        }
                        startAdornment={
                          formData.assignedTechnician ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                ml: 1,
                                mr: -0.5,
                              }}
                            >
                              <EngineeringIcon fontSize="small" />
                            </Box>
                          ) : null
                        }
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {technicians.map((tech) => (
                          <MenuItem key={tech._id} value={tech._id}>
                            {tech.firstName} {tech.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardHeader
                title="Schedule"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ bgcolor: 'primary.lightest', pb: 1 }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Scheduled Date"
                      type="date"
                      value={
                        formData.scheduledDate
                          ? formatDate(formData.scheduledDate)
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : null;
                        handleDateChange(date, 'scheduledDate');
                      }}
                      InputLabelProps={{ shrink: true }}
                      disabled={
                        formData.status === 'completed' ||
                        formData.status === 'cancelled'
                      }
                    />
                  </Grid>
                  {isEditing && formData.status === 'completed' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Completion Date"
                        type="date"
                        value={
                          formData.completionDate
                            ? formatDate(formData.completionDate)
                            : ''
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          handleDateChange(date, 'completionDate');
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action buttons */}
        {renderActionButtons()}

        {/* Save button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button component={Link} to="/services" sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={
              loading ||
              formData.status === 'completed' ||
              formData.status === 'cancelled'
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Save Service Request'}
          </Button>
        </Box>
      </form>

      {/* Add Note Dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note Text"
            fullWidth
            multiline
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={!noteText.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Service Request Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Service Request</DialogTitle>
        <DialogContent>
          <Typography paragraph sx={{ mt: 2 }}>
            Are you sure you want to mark this service request as completed?
            This will set the status to "Completed" and record today's date as
            the completion date.
          </Typography>
          <TextField
            margin="dense"
            label="Completion Notes (Optional)"
            fullWidth
            multiline
            rows={3}
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCompleteRequest}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestForm;
