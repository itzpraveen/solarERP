import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Alert,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Assignment as TaskIcon,
  ArrowForward as ArrowIcon,
  CalendarToday as DateIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import projectService from '../../api/projectService';

// Define task status options
const taskStatusOptions = [
  { value: 'todo', label: 'To Do', color: 'default' },
  { value: 'in_progress', label: 'In Progress', color: 'primary' },
  { value: 'done', label: 'Complete', color: 'success' },
  { value: 'blocked', label: 'Blocked', color: 'error' },
];

// Define task type
type Task = {
  _id: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  dueDate?: Date;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  startDate?: Date;
  dependsOn?: string[];
};

// Define project type
type Project = {
  _id: string;
  name: string;
  tasks: Task[];
  stage: string;
  status: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
};

const ProjectTasksField: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');

  // Fetch project data
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await projectService.getProject(id);
        setProject(data.data.project);
      } catch (err) {
        console.error('Error loading project tasks:', err);
        setError('Failed to load project tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // Open status update dialog
  const handleOpenStatusDialog = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setStatusNote('');
    setStatusDialogOpen(true);
  };

  // Close status update dialog
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedTask(null);
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedTask || !project) return;

    try {
      setUpdateStatusLoading(true);

      // Make API call to update task status
      await projectService.updateProjectTask(project._id, selectedTask._id, {
        status: newStatus,
        notes: statusNote,
      });

      // Update local state
      const updatedTasks = project.tasks.map((task) =>
        task._id === selectedTask._id
          ? { ...task, status: newStatus as any }
          : task
      );

      setProject({
        ...project,
        tasks: updatedTasks,
      });

      setStatusUpdateSuccess(true);

      // Close dialog after 1 second to show success state
      setTimeout(() => {
        setStatusDialogOpen(false);
        setStatusUpdateSuccess(false);
        setSelectedTask(null);
      }, 1000);
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    const statusOption = taskStatusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.color || 'default';
  };

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Empty state
  if (!project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Project not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Project header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {project.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {project.customer.firstName} {project.customer.lastName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip
            label={`Stage: ${project.stage}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Status: ${project.status}`}
            size="small"
            color={project.status === 'active' ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Tasks list */}
      <Box sx={{ mt: 3 }}>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <TaskIcon sx={{ mr: 1 }} /> Tasks
        </Typography>

        {project.tasks.length === 0 ? (
          <Alert severity="info">No tasks available for this project.</Alert>
        ) : (
          project.tasks.map((task) => (
            <Card
              key={task._id}
              sx={{
                mb: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderLeft: `4px solid ${
                  task.status === 'done'
                    ? theme.palette.success.main
                    : task.status === 'in_progress'
                      ? theme.palette.primary.main
                      : task.status === 'blocked'
                        ? theme.palette.error.main
                        : theme.palette.grey[400]
                }`,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography
                    variant="body1"
                    component="h3"
                    sx={{ fontWeight: 500 }}
                  >
                    {task.description}
                  </Typography>
                  <Chip
                    label={
                      taskStatusOptions.find((o) => o.value === task.status)
                        ?.label || task.status
                    }
                    size="small"
                    color={getStatusColor(task.status) as any}
                  />
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {task.dueDate && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <DateIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                      Due: {formatDate(task.dueDate)}
                    </Typography>
                  )}

                  {task.assignedTo && (
                    <Typography variant="body2" color="textSecondary">
                      Assigned to: {task.assignedTo.firstName}{' '}
                      {task.assignedTo.lastName}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UpdateIcon />}
                    onClick={() => handleOpenStatusDialog(task)}
                    sx={{ borderRadius: 4 }}
                  >
                    Update Status
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleCloseStatusDialog}
        fullWidth
      >
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          {statusUpdateSuccess ? (
            <Alert severity="success" icon={<CheckIcon />}>
              Status updated successfully!
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedTask?.description}
              </Typography>

              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Current Status:{' '}
                  {
                    taskStatusOptions.find(
                      (o) => o.value === selectedTask?.status
                    )?.label
                  }
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {taskStatusOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      color={
                        option.value === newStatus
                          ? (option.color as any)
                          : 'default'
                      }
                      variant={
                        option.value === newStatus ? 'filled' : 'outlined'
                      }
                      onClick={() => setNewStatus(option.value)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: option.value === newStatus ? 600 : 400,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                label="Notes (optional)"
                multiline
                rows={3}
                fullWidth
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                variant="outlined"
              />
            </>
          )}
        </DialogContent>

        {!statusUpdateSuccess && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseStatusDialog} startIcon={<CloseIcon />}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              startIcon={
                updateStatusLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <CheckIcon />
                )
              }
              disabled={
                newStatus === selectedTask?.status || updateStatusLoading
              }
            >
              Update
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectTasksField;
