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
  Build as ToolIcon,
  Warning as WarningIcon,
  People as TeamIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import projectService, {
  Project,
  ProjectDocument,
  ProjectEquipment,
  ProjectIssue,
  ProjectNote,
  ProjectTeam,
  ProjectDates,
} from '../../api/projectService';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';

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
  const [equipmentDialog, setEquipmentDialog] = useState(false);

  // State for new items
  const [newNote, setNewNote] = useState('');
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [newDocument, setNewDocument] = useState({
    type: 'design',
    name: '',
    fileUrl: '',
    notes: '',
  });
  const [newEquipment, setNewEquipment] = useState({
    type: 'panel',
    manufacturer: '',
    model: '',
    quantity: 1,
    serialNumber: '',
    notes: '',
  });

  // Fetch project data
  const fetchProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await projectService.getProject(id);
      setProject(response.data.project);
      setEditData(response.data.project);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch project');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProject();
  }, [id]);

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
      setEditData({
        ...editData,
        [parent]: {
          ...(editData[parent as keyof typeof editData] as any),
          [child]: value,
        },
      });
    } else {
      setEditData({
        ...editData,
        [name]: value,
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  // Handle boolean changes
  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditData({
      ...editData,
      [name]: checked,
    });
  };

  // Handle number changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData({
        ...editData,
        [parent]: {
          ...(editData[parent as keyof typeof editData] as any),
          [child]: parseFloat(value) || 0,
        },
      });
    } else {
      setEditData({
        ...editData,
        [name]: parseFloat(value) || 0,
      });
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

  // Update project status
  const updateStatus = async (
    status: 'active' | 'on_hold' | 'completed' | 'cancelled'
  ) => {
    if (!id) return;

    try {
      await projectService.updateStatus(id, status);
      fetchProject();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  };

  // Update project stage
  const updateStage = async (
    stage:
      | 'planning'
      | 'permitting'
      | 'scheduled'
      | 'in_progress'
      | 'inspection'
      | 'completed'
  ) => {
    if (!id) return;

    try {
      await projectService.updateStage(id, stage);
      fetchProject();
    } catch (err: any) {
      setError(err?.message || 'Failed to update stage');
    }
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
        <Typography color="text.primary">{project.name}</Typography>
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
          <Typography variant="h4">{project.name}</Typography>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status and Stage Pills */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip
          label={project.status
            .replace('_', ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}
          color={
            statusColors[project.status as keyof typeof statusColors] ||
            'default'
          }
        />
        <Chip
          label={
            stageLabels[project.stage as keyof typeof stageLabels] ||
            project.stage
          }
          color={
            stageColors[project.stage as keyof typeof stageColors] || 'default'
          }
        />
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Customer" />
          <Tab label="Documents" />
          <Tab label="Equipment" />
          <Tab label="Issues" />
          <Tab label="Timeline" />
          <Tab label="Financials" />
          <Tab label="Notes" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Information
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
                          value={editData.name || project.name}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.name}
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
                            name="status"
                            value={editData.status || project.status}
                            label="Status"
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
                            label={project.status
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            color={
                              statusColors[
                                project.status as keyof typeof statusColors
                              ] || 'default'
                            }
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
                            name="stage"
                            value={editData.stage || project.stage}
                            label="Stage"
                            onChange={handleSelectChange}
                          >
                            <MenuItem value="planning">Planning</MenuItem>
                            <MenuItem value="permitting">Permitting</MenuItem>
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="inspection">Inspection</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={
                              stageLabels[
                                project.stage as keyof typeof stageLabels
                              ] || project.stage
                            }
                            color={
                              stageColors[
                                project.stage as keyof typeof stageColors
                              ] || 'default'
                            }
                            size="small"
                          />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {project.customer.firstName} {project.customer.lastName}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Installation Address
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <HomeIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {project.installAddress.street},{' '}
                        {project.installAddress.city},{' '}
                        {project.installAddress.state}{' '}
                        {project.installAddress.zipCode}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Specifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Size
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="systemSize"
                          type="number"
                          inputProps={{ min: 0, step: 0.1 }}
                          value={editData.systemSize || project.systemSize}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.systemSize} kW
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
                          inputProps={{ min: 0 }}
                          value={editData.panelCount || project.panelCount}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.panelCount} panels
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
                          value={editData.panelType || project.panelType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.panelType}
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
                          value={editData.inverterType || project.inverterType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.inverterType}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Battery System
                      </Typography>
                      {editMode ? (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={
                                  editData.includesBattery ||
                                  project.includesBattery
                                }
                                onChange={handleBooleanChange}
                                name="includesBattery"
                              />
                            }
                            label="Includes Battery"
                          />
                          {(editData.includesBattery ||
                            project.includesBattery) && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Battery Type"
                                  name="batteryType"
                                  value={
                                    editData.batteryType ||
                                    project.batteryType ||
                                    ''
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
                                  inputProps={{ min: 0 }}
                                  value={
                                    editData.batteryCount ||
                                    project.batteryCount ||
                                    0
                                  }
                                  onChange={handleNumberChange}
                                />
                              </Grid>
                            </Grid>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {project.includesBattery ? (
                            <>
                              {project.batteryCount} x {project.batteryType}
                            </>
                          ) : (
                            'No battery system'
                          )}
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
                    Project Team
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <TeamIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Project Manager"
                        secondary={
                          project.team.projectManager
                            ? `${project.team.projectManager.firstName} ${project.team.projectManager.lastName}`
                            : 'Unassigned'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <TeamIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Sales Representative"
                        secondary={
                          project.team.salesRep
                            ? `${project.team.salesRep.firstName} ${project.team.salesRep.lastName}`
                            : 'Unassigned'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <TeamIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Designer"
                        secondary={
                          project.team.designer
                            ? `${project.team.designer.firstName} ${project.team.designer.lastName}`
                            : 'Unassigned'
                        }
                      />
                    </ListItem>
                  </List>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    startIcon={<EditIcon />}
                    onClick={() => setTabValue(1)} // Change to appropriate tab for team management
                  >
                    Manage Team
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Dates
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Planning Completed
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.planningCompleted)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Permit Submitted
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.permitSubmitted)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Installation Scheduled
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.scheduledInstallation)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Installation Completed
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.installationCompleted)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Inspection Completed
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.inspectionCompleted)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Activation
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(project.dates?.systemActivation)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    startIcon={<TimelineIcon />}
                    onClick={() => setTabValue(5)} // Timeline tab
                  >
                    View Full Timeline
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
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

                  {!project.issues || project.issues.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No open issues for this project.
                    </Typography>
                  ) : (
                    <List dense>
                      {(
                        project.issues
                          .filter((issue) => issue.status !== 'closed')
                          .slice(0, 2) || []
                      ).map((issue, index) => (
                        <ListItem key={index} divider={index < 1}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  priorityColors[
                                    issue.priority as keyof typeof priorityColors
                                  ] || 'default',
                              }}
                            >
                              <WarningIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={issue.title}
                            secondary={
                              <>
                                <Typography
                                  variant="caption"
                                  component="span"
                                  color="text.secondary"
                                >
                                  {issue.priority.toUpperCase()} priority •{' '}
                                  {issue.status.replace('_', ' ')}
                                </Typography>
                                <Typography variant="body2" component="p">
                                  {issue.description.length > 60
                                    ? `${issue.description.substring(0, 60)}...`
                                    : issue.description}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                      {(project.issues?.length || 0) > 0 && (
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                          <Button size="small" onClick={() => setTabValue(4)}>
                            View All Issues
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

        {/* Customer Tab */}
        <TabPanel value={tabValue} index={1}>
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {project.customer.firstName} {project.customer.lastName}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <EmailIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {project.customer.email}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <PhoneIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {project.customer.phone}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer Address
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <HomeIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {project.customer.address.street},{' '}
                        {project.customer.address.city},{' '}
                        {project.customer.address.state}{' '}
                        {project.customer.address.zipCode}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    component={RouterLink}
                    to={`/customers/${project.customer._id}`}
                  >
                    View Customer Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>

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
                          size="small"
                          label="Street"
                          name="installAddress.street"
                          value={
                            editData.installAddress?.street ||
                            project.installAddress.street
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="City"
                          name="installAddress.city"
                          value={
                            editData.installAddress?.city ||
                            project.installAddress.city
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State"
                          name="installAddress.state"
                          value={
                            editData.installAddress?.state ||
                            project.installAddress.state
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="ZIP Code"
                          name="installAddress.zipCode"
                          value={
                            editData.installAddress?.zipCode ||
                            project.installAddress.zipCode
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Country"
                          name="installAddress.country"
                          value={
                            editData.installAddress?.country ||
                            project.installAddress.country
                          }
                          onChange={handleEditChange}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <>
                      <Typography
                        variant="body1"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <HomeIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {project.installAddress.street}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {project.installAddress.city},{' '}
                        {project.installAddress.state}{' '}
                        {project.installAddress.zipCode}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {project.installAddress.country}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Site Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    This section will contain site assessment information such
                    as roof condition, shading analysis, and other site-specific
                    details.
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    disabled={!editMode}
                  >
                    Edit Site Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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

          {!project.documents || project.documents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No documents have been added for this project yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setDocumentDialog(true)}
              >
                Add First Document
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(project.documents || []).map((doc) => (
                    <TableRow key={doc._id} hover>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>
                        {doc.type.charAt(0).toUpperCase() +
                          doc.type.slice(1).replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileIcon />}
                          href={doc.fileUrl}
                          target="_blank"
                          sx={{ mr: 1 }}
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

        {/* Equipment Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Project Equipment</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEquipmentDialog(true)}
            >
              Add Equipment
            </Button>
          </Box>

          {!project.equipment || project.equipment.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No equipment has been added for this project yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => setEquipmentDialog(true)}
              >
                Add First Equipment
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(project.equipment || []).map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.serialNumber || 'N/A'}</TableCell>
                      <TableCell>{item.notes || 'N/A'}</TableCell>
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
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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

          {!project.issues || project.issues.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No issues have been reported for this project yet.
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
              {(project.issues || []).map((issue, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor:
                              priorityColors[
                                issue.priority as keyof typeof priorityColors
                              ] || 'default',
                            mr: 2,
                          }}
                        >
                          <WarningIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{issue.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={issue.priority.toUpperCase()}
                              size="small"
                              color={
                                priorityColors[
                                  issue.priority as keyof typeof priorityColors
                                ] || 'default'
                              }
                            />
                            <Chip
                              label={issue.status
                                .replace('_', ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                              size="small"
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Reported:{' '}
                        {new Date(issue.reportedAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {issue.description}
                    </Typography>

                    {issue.resolutionNotes && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Resolution Notes:
                        </Typography>
                        <Typography variant="body2">
                          {issue.resolutionNotes}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Reported by: {issue.reportedBy.firstName}{' '}
                        {issue.reportedBy.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {issue.assignedTo
                          ? `Assigned to: ${issue.assignedTo.firstName} ${issue.assignedTo.lastName}`
                          : 'Unassigned'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Project Timeline
          </Typography>

          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Project Milestones
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Site Assessment"
                      secondary={formatDate(project.dates?.siteAssessment)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Planning Completed"
                      secondary={formatDate(project.dates?.planningCompleted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Permit Submitted"
                      secondary={formatDate(project.dates?.permitSubmitted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Permit Approved"
                      secondary={formatDate(project.dates?.permitApproved)}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Installation Phase
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Installation Scheduled"
                      secondary={formatDate(
                        project.dates?.scheduledInstallation
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Installation Started"
                      secondary={formatDate(project.dates?.installationStarted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Installation Completed"
                      secondary={formatDate(
                        project.dates?.installationCompleted
                      )}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Completion Phase
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Inspection Scheduled"
                      secondary={formatDate(project.dates?.inspectionScheduled)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Inspection Completed"
                      secondary={formatDate(project.dates?.inspectionCompleted)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Utility Interconnection"
                      secondary={formatDate(
                        project.dates?.utilityInterconnection
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="System Activation"
                      secondary={formatDate(project.dates?.systemActivation)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Project Closed"
                      secondary={formatDate(project.dates?.projectClosed)}
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
        <TabPanel value={tabValue} index={6}>
          <Grid container spacing={3}>
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
                            editData.financials?.totalContractValue ||
                            project.financials.totalContractValue
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={project.financials.totalContractValue}
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
                          amount={project.financials.totalExpenses || 0}
                        />
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Projected Profit
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 0.5,
                          color:
                            (project.financials.projectedProfit || 0) > 0
                              ? 'success.main'
                              : 'error.main',
                        }}
                      >
                        <CurrencyDisplay
                          amount={project.financials.projectedProfit || 0}
                        />
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Margin
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        {project.financials.projectedProfit &&
                        project.financials.totalContractValue
                          ? `${((project.financials.projectedProfit / project.financials.totalContractValue) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">Payment Schedule</Typography>
                    <Button size="small" startIcon={<AddIcon />}>
                      Add Payment
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {!project.financials.paymentSchedule ||
                  project.financials.paymentSchedule.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No payment schedule has been defined yet.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Due Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(project.financials.paymentSchedule || []).map(
                            (payment, index) => (
                              <TableRow key={index} hover>
                                <TableCell>{payment.name}</TableCell>
                                <TableCell>
                                  ${payment.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      payment.status.charAt(0).toUpperCase() +
                                      payment.status.slice(1)
                                    }
                                    color={
                                      payment.status === 'paid'
                                        ? 'success'
                                        : payment.status === 'overdue'
                                          ? 'error'
                                          : 'default'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {payment.dueDate
                                    ? new Date(
                                        payment.dueDate
                                      ).toLocaleDateString()
                                    : 'N/A'}
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
                    <Typography variant="h6">Expenses</Typography>
                    <Button size="small" startIcon={<AddIcon />}>
                      Add Expense
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {!project.financials.expenses ||
                  project.financials.expenses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No expenses have been recorded yet.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(project.financials.expenses || []).map(
                            (expense, index) => (
                              <TableRow key={index} hover>
                                <TableCell>
                                  {expense.category.charAt(0).toUpperCase() +
                                    expense.category.slice(1)}
                                </TableCell>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>
                                  ${expense.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(expense.date).toLocaleDateString()}
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

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Documents
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <List dense>
                    {project.documents?.filter((doc) =>
                      ['contract', 'invoice', 'receipt'].includes(doc.type)
                    ).length ? (
                      project.documents
                        ?.filter((doc) =>
                          ['contract', 'invoice', 'receipt'].includes(doc.type)
                        )
                        .map((doc, index) => (
                          <ListItem
                            key={index}
                            divider={
                              index <
                              project.documents!.filter((doc) =>
                                ['contract', 'invoice', 'receipt'].includes(
                                  doc.type
                                )
                              ).length -
                                1
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <FileIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={doc.name}
                              secondary={`${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                            />
                            <Button
                              size="small"
                              href={doc.fileUrl}
                              target="_blank"
                            >
                              View
                            </Button>
                          </ListItem>
                        ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No financial documents have been uploaded yet.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={7}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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

          {!project.notes || project.notes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No notes have been added for this project yet.
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
              {(project.notes || [])
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
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              By: {note.createdBy.firstName}{' '}
                              {note.createdBy.lastName}
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
        <DialogTitle>Report Issue</DialogTitle>
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
                rows={4}
                value={newIssue.description}
                onChange={handleIssueChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={newIssue.priority}
                  label="Priority"
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
    </Box>
  );
};

export default ProjectDetails;
