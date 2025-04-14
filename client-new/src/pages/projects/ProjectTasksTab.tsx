import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountCircle as UserIcon,
} from '@mui/icons-material';
import projectService, { Project, ProjectTask } from '../../api/projectService'; // Import Project interface too
import userService from '../../api/userService'; // Import default export
import { User } from '../../features/auth/types/User'; // Import User type directly

interface ProjectTasksTabProps {
  projectId: string | undefined;
}

// Interface for the task form data state
interface TaskFormData {
  _id?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'blocked';
  assignedTo?: string; // Store only the ID string or empty string for unassigned
  dueDate?: string;
}

// Task status colors mapping
const taskStatusColors = {
  todo: 'default',
  in_progress: 'info',
  done: 'success',
  blocked: 'error',
} as const;

const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For assignee dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskFormData>({}); // Use TaskFormData for state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch the full project data to get tasks
      const response = await projectService.getProject(projectId);
      setTasks(response.data.project.tasks || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to fetch tasks'
      );
      setTasks([]); // Clear tasks on error
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchUsers = useCallback(async () => {
    try {
      // Fetch users for the assignee dropdown
      // Adjust filters as needed (e.g., only active users, specific roles)
      const response = await userService.getUsers({ limit: 1000 }); // Fetch a large number to likely get all relevant users
      setUsers(response.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      // Handle error fetching users if necessary, maybe show a message
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleOpenDialog = (task?: ProjectTask) => {
    if (task) {
      setIsEditing(true);
      // Adapt the existing task to TaskFormData
      setCurrentTask({
        _id: task._id,
        description: task.description,
        status: task.status,
        assignedTo:
          typeof task.assignedTo === 'object' && task.assignedTo !== null
            ? task.assignedTo._id
            : task.assignedTo || '', // Handle object or string ID
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Format for date input
      });
    } else {
      setIsEditing(false);
      // Initialize with default TaskFormData structure
      setCurrentTask({
        description: '',
        status: 'todo',
        assignedTo: '',
        dueDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTask({});
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTask((prev) => ({
      ...prev,
      dueDate: e.target.value || undefined,
    }));
  };

  const handleSaveTask = async () => {
    if (!projectId || !currentTask.description) return; // Basic validation

    setLoading(true); // Indicate loading state during save
    setError(null);

    try {
      const taskPayload = {
        ...currentTask,
        // Convert empty string dueDate back to undefined if necessary
        dueDate: currentTask.dueDate || undefined,
      };

      if (isEditing && currentTask._id) {
        // Payload type should now match the updated ProjectTask interface in projectService
        await projectService.updateTask(
          projectId,
          currentTask._id,
          taskPayload
        );
      } else {
        // Payload type should now match the updated ProjectTask interface in projectService
        await projectService.addTask(projectId, taskPayload);
      }
      handleCloseDialog();
      await fetchTasks(); // Re-fetch tasks to show the latest data
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to save task'
      );
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const handleDeleteClick = (task: ProjectTask) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !taskToDelete?._id) return;

    setLoading(true);
    setError(null);

    try {
      await projectService.deleteTask(projectId, taskToDelete._id);
      handleCloseDeleteConfirm();
      await fetchTasks(); // Re-fetch tasks
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to delete task'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      // Attempt to format, handle potential invalid date strings gracefully
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getUserFullName = (
    userId?: string | { _id: string; firstName: string; lastName: string }
  ) => {
    if (!userId) return 'Unassigned';
    // Determine the ID whether userId is a string or an object with _id
    const id =
      typeof userId === 'object' && userId !== null && '_id' in userId
        ? userId._id
        : typeof userId === 'string'
          ? userId
          : undefined;
    if (!id) return 'Unassigned';
    const user = users.find((u) => u.id === id); // Find user by id (from User type)
    return user ? user.name : 'Unknown User'; // Return user.name
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Project Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Task
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && tasks.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && tasks.length === 0 && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No tasks have been added to this project yet.
          </Typography>
        </Paper>
      )}

      {tasks.length > 0 && (
        <List component={Paper} sx={{ mb: 3 }}>
          {tasks.map((task) => (
            <ListItem key={task._id} divider>
              <ListItemText
                primary={task.description}
                secondary={
                  <>
                    <Chip
                      label={task.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        taskStatusColors[
                          task.status as keyof typeof taskStatusColors
                        ] || 'default'
                      }
                      sx={{ mr: 1, mt: 0.5 }}
                    />
                    <Typography
                      variant="caption"
                      display="inline"
                      sx={{ mr: 1 }}
                    >
                      Due: {formatDate(task.dueDate)}
                    </Typography>
                    <Typography variant="caption" display="inline">
                      Assignee: {getUserFullName(task.assignedTo)}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Edit Task">
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleOpenDialog(task)}
                    disabled={loading}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Task">
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteClick(task)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Add/Edit Task Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Description"
                name="description"
                value={currentTask.description || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={currentTask.status || 'todo'}
                  label="Status"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  <MenuItem value="todo">To Do</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  name="assignedTo"
                  value={currentTask.assignedTo || ''} // Use empty string for 'Unassigned'
                  label="Assignee"
                  onChange={handleSelectChange}
                  disabled={loading || users.length === 0}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={
                  currentTask.dueDate ? currentTask.dueDate.split('T')[0] : ''
                } // Format for date input
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTask}
            color="primary"
            variant="contained"
            disabled={!currentTask.description || loading}
          >
            {isEditing ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the task: "
            {taskToDelete?.description}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTasksTab;
