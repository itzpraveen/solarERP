import { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
  TableRow,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
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
  AttachFile as FileIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  AccountCircle, // Import AccountCircle
  TaskAlt as TaskIcon, // Import Task icon
} from '@mui/icons-material';
// Removed unused imports: ProjectDocument, ProjectNote, ProjectTeam, ProjectDates
import projectService, {
  Project,
  ProjectIssue,
  ProjectPayment, // Import ProjectPayment
  ProjectExpense, // Import ProjectExpense
} from '../../api/projectService';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ProjectTasksTab from './ProjectTasksTab'; // Import the new Tasks tab component

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Status colors mapping
const statusColors = {
  active: 'primary',
  on_hold: 'warning',
  completed: 'success',
  cancelled: 'error',
} as const;

// Stage labels and colors
const stageLabels = {
  planning: 'Planning',
  permitting: 'Permitting',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  inspection: 'Inspection',
  completed: 'Completed',
};

const stageColors = {
  planning: 'info',
  permitting: 'secondary',
  scheduled: 'info',
  in_progress: 'warning',
  inspection: 'secondary',
  completed: 'success',
} as const;

// Issue priority colors
const priorityColors = {
  low: 'info',
  medium: 'success',
  high: 'warning',
  critical: 'error',
} as const;

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for project data
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // State for dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState(false);

  // State for new items
  const [newNote, setNewNote] = useState('');
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  // Fetch project data - wrapped in useCallback
  const fetchProject = useCallback(async () => { // Wrap in useCallback
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await projectService.getProject(id);
      setProject(response.data.project);
      setEditData(response.data.project); // Initialize editData
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch project');
      setLoading(false);
    }
  }, [id]); // Add id as dependency for useCallback

  // Initial data fetch
  useEffect(() => {
    fetchProject();
  }, [fetchProject]); // Now only depends on the memoized fetchProject

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle edit form changes
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData((prev) => ({ // Use functional update
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }));
    } else {
      setEditData((prev) => ({ // Use functional update
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ // Use functional update
      ...prev,
      [name]: value,
    }));
  };

  // Handle boolean changes
  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditData((prev) => ({ // Use functional update
      ...prev,
      [name]: checked,
    }));
  };

  // Handle number changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0; // Ensure it's a number

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData((prev) => ({ // Use functional update
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: numValue,
        },
      }));
    } else {
      setEditData((prev) => ({ // Use functional update
        ...prev,
        [name]: numValue,
      }));
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Canceling edit - reset data
      setEditData(project || {});
    }
    setEditMode(!editMode);
  };

  // Save project changes
  const saveProject = async () => {
    if (!id || !editData) return;

    try {
      setLoading(true);
      await projectService.updateProject(id, editData);
      await fetchProject();
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update project');
      setLoading(false);
    }
  };

  // Delete project
  const deleteProject = async () => {
    if (!id) return;

    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete project');
    }
  };

  // Add note
  const addNote = async () => {
    if (!id || !newNote.trim()) return;

    try {
      await projectService.addNote(id, newNote);
      setNewNote('');
      setNoteDialog(false);
      fetchProject();
    } catch (err: any) {
      setError(err?.message || 'Failed to add note');
    }
  };

  // Add issue
  const addIssue = async () => {
    if (!id || !newIssue.title.trim()) return;

    try {
      await projectService.addIssue(id, newIssue);
      setNewIssue({
        title: '',
        description: '',
        priority: 'medium',
      });
      setIssueDialog(false);
      fetchProject();
    } catch (err: any) {
      setError(err?.message || 'Failed to add issue');
    }
  };

  // Handle issue change
  const handleIssueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewIssue({
      ...newIssue,
      [name]: value,
    });
  };

  // Handle issue select change
  const handleIssueSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewIssue({
      ...newIssue,
      [name]: value,
    });
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !project) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Project not found
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          color="inherit"
          to="/dashboard"
          underline="hover"
        >
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          color="inherit"
          to="/projects"
          underline="hover"
        >
          Projects
        </Link>
        <Typography color="text.primary">{project?.name}</Typography>
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
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/projects')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{project?.name}</Typography>
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
                onClick={saveProject}
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

      {/* Status and Stage Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip
          label={project?.status.replace('_', ' ').toUpperCase()}
          color={statusColors[project?.status] || 'default'}
          size="small"
        />
        <Chip
          label={stageLabels[project?.stage] || project?.stage}
          color={stageColors[project?.stage] || 'default'}
          size="small"
        />
      </Box>

      {/* Tabs and Content */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Project details tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" icon={<ProjectIcon />} iconPosition="start" />
            <Tab label="Tasks" icon={<TaskIcon />} iconPosition="start" />
            <Tab label="Details" icon={<HomeIcon />} iconPosition="start" />
            <Tab label="Documents" icon={<FileIcon />} iconPosition="start" />
            <Tab label="Issues" icon={<WarningIcon />} iconPosition="start" />
            <Tab
              label="Timeline"
              icon={<TimelineIcon />}
              iconPosition="start"
            />
            <Tab label="Financials" icon={<MoneyIcon />} iconPosition="start" />
            <Tab label="Notes" icon={<NoteIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        {/* Tab Panels */}
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Project Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Project Name
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="name"
                          value={editData.name ?? project?.name}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.systemSize ?? 0} kW
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            label="Status"
                            name="status"
                            value={editData.status ?? project?.status}
                            onChange={handleSelectChange}
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="on_hold">On Hold</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={project?.status
                              .replace('_', ' ')
                              .toUpperCase()}
                            color={statusColors[project?.status] || 'default'}
                            size="small"
                          />
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Stage
                      </Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Stage</InputLabel>
                          <Select
                            label="Stage"
                            name="stage"
                            value={editData.stage ?? project?.stage}
                            onChange={handleSelectChange}
                          >
                            {Object.entries(stageLabels).map(([key, label]) => (
                              <MenuItem key={key} value={key}>
                                {label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={stageLabels[project?.stage] || project?.stage}
                            color={stageColors[project?.stage] || 'default'}
                            size="small"
                          />
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Project Type
                      </Typography>
                      {/* Add edit mode handling if needed later */}
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {project?.projectType || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {formatDate(project?.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Installation Address
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="installAddress.street"
                          value={
                            editData.installAddress?.street ??
                            project?.installAddress?.street
                          }
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                          // Add fields for city, state, zipCode as needed
                        />
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {project?.installAddress?.street || 'Not set'}
                          {/* Display city, state, zipCode */}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* System Details */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Size (kW)
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="systemSize"
                          type="number"
                          inputProps={{ min: 0, step: 0.1 }}
                          value={editData.systemSize ?? project?.systemSize}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.systemSize ?? 0} kW
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Count
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="panelCount"
                          type="number"
                          inputProps={{ min: 0, step: 1 }}
                          value={editData.panelCount ?? project?.panelCount}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.panelCount ?? 0} panels
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Type
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="panelType"
                          value={editData.panelType ?? project?.panelType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.panelType ?? 'N/A'}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Inverter Type
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="inverterType"
                          value={editData.inverterType ?? project?.inverterType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.inverterType ?? 'N/A'}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Battery
                      </Typography>
                      {editMode ? (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                name="includesBattery"
                                checked={
                                  editData.includesBattery ??
                                  project?.includesBattery ?? false
                                }
                                onChange={handleBooleanChange}
                              />
                            }
                            label="Battery Included"
                          />
                          {(editData.includesBattery ??
                            project?.includesBattery) && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Battery Type"
                                  name="batteryType"
                                  value={
                                    editData.batteryType ?? project?.batteryType ?? ''
                                  }
                                  onChange={handleEditChange}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Battery Count"
                                  name="batteryCount"
                                  type="number"
                                  inputProps={{ min: 0, step: 1 }}
                                  value={
                                    editData.batteryCount ??
                                    project?.batteryCount ?? 0
                                  }
                                  onChange={handleNumberChange}
                                />
                              </Grid>
                            </Grid>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project?.includesBattery
                            ? `Yes (${project?.batteryType || 'N/A'}, ${
                                project?.batteryCount || 0
                              } units)`
                            : 'No'}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer & Team Info */}
            <Grid item xs={12} md={6}>
              {/* Customer Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {project?.customer ? (
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <AccountCircle />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${project?.customer.firstName} ${project?.customer.lastName}`}
                          secondary="Customer Name"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <EmailIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project?.customer.email}
                          secondary="Email"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <PhoneIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project?.customer.phone}
                          secondary="Phone"
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography>No customer linked.</Typography>
                  )}
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/customers/${project?.customer?._id}`}
                    disabled={!project?.customer}
                    sx={{ mt: 1 }}
                  >
                    View Customer Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Members
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Project Manager
                      </Typography>
                      <Typography>
                        {project?.team?.projectManager?.firstName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Sales Rep
                      </Typography>
                      <Typography>
                        {project?.team?.salesRep?.firstName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Designer
                      </Typography>
                      <Typography>
                        {project?.team?.designer?.firstName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Installers
                      </Typography>
                      <Typography>
                        {project?.team?.installationTeam?.length || 0} assigned
                      </Typography>
                    </Grid>
                  </Grid>
                  <Button size="small" sx={{ mt: 2 }}>
                    Manage Team
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Issues (Placeholder) */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Recent Issues</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setIssueDialog(true)}
                    >
                      Add Issue
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {!project?.issues || project?.issues.length === 0 ? (
                    <Typography color="text.secondary">
                      No issues reported yet.
                    </Typography>
                  ) : (
                    <List dense>
                      {/* Display only first 2 issues for brevity */}
                      {(project?.issues || [])
                        .slice(0, 2)
                        .map((issue: ProjectIssue, index: number) => (
                          <ListItem key={index} divider={index < 1}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: `${
                                    priorityColors[issue.priority] || 'grey'
                                  }.light`,
                                }}
                              >
                                <WarningIcon
                                  fontSize="small"
                                  color={
                                    priorityColors[issue.priority] || 'inherit'
                                  }
                                />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={issue.title}
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {issue.status}
                                  </Typography>
                                  {` - Priority: ${issue.priority}`}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  )}
                  {(project?.issues?.length || 0) > 2 && (
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button size="small" onClick={() => setTabValue(4)}> {/* Adjusted index */}
                        View All Issues
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tasks Tab Panel */}
        <TabPanel value={tabValue} index={1}>
          <ProjectTasksTab projectId={id} /> {/* Render the new component */}
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Customer Details (Read-only view) */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {project?.customer ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography>
                          {project.customer.firstName}{' '}
                          {project.customer.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography sx={{ wordBreak: 'break-all' }}>
                          {project.customer.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography>{project.customer.phone}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography>
                          {project.customer.address?.street},{' '}
                          {project.customer.address?.city},{' '}
                          {project.customer.address?.state}{' '}
                          {project.customer.address?.zipCode}
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography>No customer linked.</Typography>
                  )}
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/customers/${project?.customer?._id}`}
                    disabled={!project?.customer}
                    sx={{ mt: 2 }}
                  >
                    View Full Customer Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Installation Address (Editable) */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Installation Address
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Street Address"
                          name="installAddress.street"
                          value={
                            editData.installAddress?.street ??
                            project?.installAddress?.street
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="City"
                          name="installAddress.city"
                          value={
                            editData.installAddress?.city ??
                            project?.installAddress?.city
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="State"
                          name="installAddress.state"
                          value={
                            editData.installAddress?.state ??
                            project?.installAddress?.state
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Zip Code"
                          name="installAddress.zipCode"
                          value={
                            editData.installAddress?.zipCode ??
                            project?.installAddress?.zipCode
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <>
                      <Typography variant="body1">
                        {project?.installAddress?.street || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        {project?.installAddress?.city || 'N/A'},{' '}
                        {project?.installAddress?.state || 'N/A'}{' '}
                        {project?.installAddress?.zipCode || 'N/A'}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
              {/* Utility Information (Placeholder) */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Utility Information
                  </Typography>
                  <Divider />
                  <Typography sx={{ mt: 2 }} color="text.secondary">
                    (Utility details not yet implemented)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Project Documents</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDocumentDialog(true)}
            >
              Add Document
            </Button>
          </Box>
          {!project?.documents || project?.documents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No documents uploaded yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setDocumentDialog(true)}
              >
                Upload First Document
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Uploaded At</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(project?.documents || []).map((doc) => (
                    <TableRow key={doc._id} hover>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>{doc.notes || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
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

        {/* Issues Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Project Issues</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIssueDialog(true)}
            >
              Report Issue
            </Button>
          </Box>
          {!project?.issues || project?.issues.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No issues reported for this project.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setIssueDialog(true)}
              >
                Report First Issue
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {(project?.issues || []).map((issue, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: `${
                              priorityColors[issue.priority] || 'grey'
                            }.light`,
                            mr: 1.5,
                          }}
                        >
                          <WarningIcon
                            fontSize="small"
                            color={priorityColors[issue.priority] || 'inherit'}
                          />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {issue.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={issue.status.toUpperCase()}
                              size="small"
                              color={
                                issue.status === 'resolved'
                                  ? 'success'
                                  : 'warning'
                              }
                            />
                            <Chip
                              label={`Priority: ${issue.priority}`}
                              size="small"
                              color={
                                priorityColors[issue.priority] || 'default'
                              }
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Reported: {formatDate(issue.reportedAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1, pl: 6.5 }}>
                      {issue.description}
                    </Typography>
                    {issue.resolutionNotes && (
                      <Box
                        sx={{
                          bgcolor: 'action.hover',
                          p: 1.5,
                          borderRadius: 1,
                          mt: 1,
                          pl: 6.5,
                        }}
                      >
                        <Typography variant="subtitle2">Resolution:</Typography>
                        <Typography variant="body2">
                          {issue.resolutionNotes}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1,
                        pl: 6.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Reported by:{' '}
                        {issue.reportedBy
                          ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
                          : 'N/A'}
                      </Typography>
                      {issue.resolvedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Resolved: {formatDate(issue.resolvedAt)}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={tabValue} index={5}> {/* Adjusted index */}
          <Typography variant="h6" gutterBottom>
            Project Timeline
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Planning & Design
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Planning Completed"
                      secondary={formatDate(project?.dates?.planningCompleted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Permit Submitted"
                      secondary={formatDate(project?.dates?.permitSubmitted)}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Installation
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Permit Approved"
                      secondary={formatDate(project?.dates?.permitApproved)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Installation Scheduled"
                      secondary={formatDate(
                        project?.dates?.scheduledInstallation
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Installation Started"
                      secondary={formatDate(project?.dates?.installationStarted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Installation Completed"
                      secondary={formatDate(
                        project?.dates?.installationCompleted
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Inspection Scheduled"
                      secondary={formatDate(project?.dates?.inspectionScheduled)}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Activation & Closeout
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Utility Interconnection"
                      secondary={formatDate(
                        project?.dates?.utilityInterconnection
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="System Activation"
                      secondary={formatDate(project?.dates?.systemActivation)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Project Closed"
                      secondary={formatDate(project?.dates?.projectClosed)}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            {editMode && (
              <Box sx={{ mt: 3 }}>
                <Button variant="outlined" startIcon={<EditIcon />}>
                  Edit Timeline Dates
                </Button>
              </Box>
            )}
          </Paper>
        </TabPanel>

        {/* Financials Tab */}
        <TabPanel value={tabValue} index={6}> {/* Adjusted index */}
          <Grid container spacing={3}>
            {/* Financial Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Contract Value
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="financials.totalContractValue"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.financials?.totalContractValue ??
                            project?.financials?.totalContractValue
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={project?.financials?.totalContractValue}
                          />
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Expenses
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay
                          amount={project?.financials?.totalExpenses ?? 0}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Projected Profit
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 0.5 }}
                        color={
                          (project?.financials?.projectedProfit ?? 0) < 0
                            ? 'error.main'
                            : 'success.main'
                        }
                      >
                        <CurrencyDisplay
                          amount={project?.financials?.projectedProfit ?? 0}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {/* Placeholder */}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Schedule */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Payment Schedule</Typography>
                    <Button size="small" startIcon={<AddIcon />}>
                      Add Payment
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {!project?.financials?.paymentSchedule ||
                  project?.financials?.paymentSchedule.length === 0 ? (
                    <Typography color="text.secondary">
                      No payment schedule has been defined yet.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(project?.financials?.paymentSchedule || []).map(
                            (payment: ProjectPayment, index: number) => (
                              <TableRow key={index} hover>
                                <TableCell>{payment.name}</TableCell>
                                <TableCell>
                                  {formatDate(payment.dueDate)}
                                </TableCell>
                                <TableCell>
                                  <CurrencyDisplay amount={payment.amount} />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={payment.status.toUpperCase()}
                                    size="small"
                                    color={
                                      payment.status === 'paid'
                                        ? 'success'
                                        : payment.status === 'pending'
                                          ? 'warning'
                                          : 'default'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Expenses */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Expenses</Typography>
                    <Button size="small" startIcon={<AddIcon />}>
                      Add Expense
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {!project?.financials?.expenses ||
                  project?.financials?.expenses.length === 0 ? (
                    <Typography color="text.secondary">
                      No expenses have been recorded yet.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(project?.financials?.expenses || []).map(
                            (expense: ProjectExpense, index: number) => (
                              <TableRow key={index} hover>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>
                                  {formatDate(expense.date)}
                                </TableCell>
                                <TableCell>
                                  <CurrencyDisplay amount={expense.amount} />
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              {/* Financial Documents */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Financial Documents</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List dense>
                    {(project?.documents || []).length ? (
                      (project?.documents || [])
                        .map((doc, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar>
                                <FileIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={doc.name}
                              secondary={`Type: ${doc.type} | Uploaded: ${formatDate(doc.uploadedAt)}`}
                            />
                            <Button
                              size="small"
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Button>
                          </ListItem>
                        ))
                    ) : (
                      <Typography color="text.secondary">
                        No documents have been uploaded yet.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={7}> {/* Adjusted index */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Project Notes</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNoteDialog(true)}
            >
              Add Note
            </Button>
          </Box>
          {!project?.notes || project?.notes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No notes added for this project yet.
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
              {(project?.notes || [])
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
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
                            {new Date(note.createdAt).toLocaleDateString()} at{' '}
                            {new Date(note.createdAt).toLocaleTimeString()}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              By:{' '}
                              {note.createdBy
                                ? `${note.createdBy.firstName} ${note.createdBy.lastName}`
                                : '[Deleted User]'}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ whiteSpace: 'pre-wrap', mt: 1 }}
                            >
                              {note.text}
                            </Typography>
                          </>
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
          Are you sure you want to delete this project? This action cannot be
          undone and will remove all project data.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteProject} color="error" variant="contained">
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

      {/* Add Issue Dialog */}
      <Dialog open={issueDialog} onClose={() => setIssueDialog(false)}>
        <DialogTitle>Report New Issue</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issue Title"
                name="title"
                value={newIssue.title}
                onChange={handleIssueChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={newIssue.description}
                onChange={handleIssueChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  name="priority"
                  value={newIssue.priority}
                  onChange={handleIssueSelectChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialog(false)}>Cancel</Button>
          <Button
            onClick={addIssue}
            color="primary"
            variant="contained"
            disabled={!newIssue.title.trim()}
          >
            Report Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Document Dialog (Placeholder Structure) */}
      <Dialog open={documentDialog} onClose={() => setDocumentDialog(false)}>
        <DialogTitle>Add Document</DialogTitle>
        <DialogContent>
          {/* Form fields for document upload */}
          <Typography color="text.secondary">
            (Document upload form not yet implemented)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialog(false)}>Cancel</Button>
          <Button color="primary" variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails;
