import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Engineering as EngineeringIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  HomeRepairService as ServiceIcon,
  CheckCircle,
} from '@mui/icons-material';
import serviceRequestService, {
  ServiceRequest,
} from '../../api/serviceRequestService';

// Simple date formatting function instead of using date-fns
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Status chip component
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

// Priority chip component
const PriorityChip = ({
  priority,
}: {
  priority: ServiceRequest['priority'];
}) => {
  let color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | undefined;

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

const ServiceRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for service request data
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for dialogs
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch service request data
  useEffect(() => {
    const fetchServiceRequest = async () => {
      try {
        setLoading(true);
        // Only attempt to fetch if we have a valid ID
        if (!id) {
          setError('Invalid service request ID');
          setLoading(false);
          return;
        }

        const response = await serviceRequestService.getServiceRequest(id);
        setServiceRequest(response.data.serviceRequest);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching service request:', err);
        setError(err?.message || 'Failed to fetch service request');
        setLoading(false);
      }
    };

    fetchServiceRequest();
  }, [id]);

  // Handle adding a note
  const handleAddNote = async () => {
    if (!noteText.trim() || !id) {
      return;
    }

    try {
      setLoading(true);

      const response = await serviceRequestService.addNote(id, noteText);

      // Update service request with new notes
      setServiceRequest((prevRequest) => {
        if (!prevRequest) return null;
        return {
          ...prevRequest,
          notes: response.data.notes || [],
        };
      });

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

      // Update service request
      setServiceRequest((prevRequest) => {
        if (!prevRequest) return null;
        const updated = {
          ...prevRequest,
          status: 'completed' as ServiceRequest['status'],
          completionDate: formatDate(new Date()),
        };

        // If there was a note, update notes as well
        if (completionNote && response.data.notes) {
          updated.notes = response.data.notes;
        }

        return updated;
      });

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

  // Handle deletion of service request
  const handleDeleteRequest = async () => {
    if (!id) {
      setError('Invalid service request ID');
      return;
    }

    try {
      setLoading(true);

      await serviceRequestService.deleteServiceRequest(id);

      setDeleteDialogOpen(false);
      setSuccess('Service request deleted successfully');

      // Navigate back to list after short delay
      setTimeout(() => {
        navigate('/services');
      }, 1500);
    } catch (err: any) {
      console.error('Error deleting service request:', err);
      setError(err?.message || 'Failed to delete service request');
      setLoading(false);
    }
  };

  if (loading && !serviceRequest) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !serviceRequest) {
    return (
      <Box>
        <Button
          component={Link}
          to="/services"
          startIcon={<BackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Service Requests
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!serviceRequest) {
    return (
      <Box>
        <Button
          component={Link}
          to="/services"
          startIcon={<BackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Service Requests
        </Button>
        <Alert severity="error">Service request not found</Alert>
      </Box>
    );
  }

  // Format dates
  const formattedCreatedDate = new Date(
    serviceRequest.createdAt
  ).toLocaleString();
  const formattedScheduledDate = serviceRequest.scheduledDate
    ? new Date(serviceRequest.scheduledDate).toLocaleDateString()
    : 'Not scheduled';
  const formattedCompletionDate = serviceRequest.completionDate
    ? new Date(serviceRequest.completionDate).toLocaleDateString()
    : 'Not completed';

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
        <Button component={Link} to="/services" startIcon={<BackIcon />}>
          Back to Service Requests
        </Button>

        <Box>
          <Button
            component={Link}
            to={`/services/${id}/edit`}
            startIcon={<EditIcon />}
            variant="outlined"
            sx={{ mr: 1 }}
            disabled={
              serviceRequest.status === 'completed' ||
              serviceRequest.status === 'cancelled'
            }
          >
            Edit
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

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

      {/* Title and status section */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography variant="h4">{serviceRequest.title}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
            <StatusChip status={serviceRequest.status} />
            <PriorityChip priority={serviceRequest.priority} />
            <Typography variant="body2" color="text.secondary">
              Created: {formattedCreatedDate}
            </Typography>
          </Box>
        </Box>

        {serviceRequest.status !== 'completed' &&
          serviceRequest.status !== 'cancelled' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => setCompleteDialogOpen(true)}
            >
              Mark as Completed
            </Button>
          )}
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Request Information"
              titleTypographyProps={{ variant: 'h6' }}
              sx={{ bgcolor: 'primary.lightest', pb: 1 }}
            />
            <CardContent>
              <Typography
                variant="body1"
                paragraph
                sx={{ whiteSpace: 'pre-line' }}
              >
                {serviceRequest.description}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ServiceIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Request Type:</Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ ml: 4, textTransform: 'capitalize' }}
                  >
                    {serviceRequest.requestType.replace('_', ' ')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FlagIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Priority:</Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ ml: 4, textTransform: 'capitalize' }}
                  >
                    {serviceRequest.priority}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Scheduled Date:</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {formattedScheduledDate}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">
                      Completion Date:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 4 }}>
                    {formattedCompletionDate}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notes section */}
          <Card>
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
              {!serviceRequest.notes || serviceRequest.notes.length === 0 ? (
                <Typography color="text.secondary">No notes yet</Typography>
              ) : (
                <Stack spacing={2}>
                  {serviceRequest.notes.map((note, index) => (
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
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Customer information */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Customer Information"
              titleTypographyProps={{ variant: 'h6' }}
              sx={{ bgcolor: 'primary.lightest', pb: 1 }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="subtitle1">
                  {serviceRequest.customer.firstName}{' '}
                  {serviceRequest.customer.lastName}
                </Typography>
              </Box>
              <Box sx={{ ml: 5, mb: 2 }}>
                <Typography variant="body2">
                  {serviceRequest.customer.email}
                </Typography>
                <Typography variant="body2">
                  {serviceRequest.customer.phone}
                </Typography>
              </Box>

              <Button
                component={Link}
                to={`/customers/${serviceRequest.customer._id}`}
                variant="outlined"
                size="small"
                fullWidth
              >
                View Customer Details
              </Button>
            </CardContent>
          </Card>

          {/* Project information */}
          {serviceRequest.project && (
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title="Related Project"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ bgcolor: 'primary.lightest', pb: 1 }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="subtitle1">
                    {serviceRequest.project.name}
                  </Typography>
                </Box>
                <Box sx={{ ml: 5, mb: 2 }}>
                  <Typography variant="body2">
                    Project #: {serviceRequest.project.projectNumber}
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to={`/projects/${serviceRequest.project._id}`}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  View Project Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Technician information */}
          <Card>
            <CardHeader
              title="Assigned Technician"
              titleTypographyProps={{ variant: 'h6' }}
              sx={{ bgcolor: 'primary.lightest', pb: 1 }}
            />
            <CardContent>
              {serviceRequest.assignedTechnician ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EngineeringIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="subtitle1">
                      {serviceRequest.assignedTechnician.firstName}{' '}
                      {serviceRequest.assignedTechnician.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 5, mb: 2 }}>
                    <Typography variant="body2">
                      {serviceRequest.assignedTechnician.email}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">
                  No technician assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this service request? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteRequest}
            color="error"
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestDetails;
