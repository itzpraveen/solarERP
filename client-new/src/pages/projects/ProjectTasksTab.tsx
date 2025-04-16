import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List, // Keep List for dialogs if needed, but not for main layout
  ListItem, // Keep for dialogs
  ListItemText, // Keep for dialogs
  ListItemSecondaryAction, // Keep for dialogs
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
  Grid, // Keep Grid for dialog form layout
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy, // Use for columns
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import projectService, { ProjectTask } from '../../api/projectService';
import userService from '../../api/userService';
import { User } from '../../features/auth/types/User';

// --- Interfaces & Types ---

interface ProjectTasksTabProps {
  projectId: string | undefined;
}

interface TaskFormData {
  _id?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'blocked';
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
  duration?: number;
  dependsOn?: string[];
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

// --- Constants ---

const taskStatusColors: Record<
  TaskStatus,
  'default' | 'info' | 'success' | 'error'
> = {
  todo: 'default',
  in_progress: 'info',
  done: 'success',
  blocked: 'error',
};

const columnOrder: TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];

const columnTitles: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

// --- Helper Functions ---

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  try {
    // Handles both YYYY-MM-DD and full ISO strings
    return new Date(dateString.split('T')[0]).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
};

// --- Task Card Component ---

interface TaskCardProps {
  task: ProjectTask;
  users: User[];
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  isOverlay?: boolean; // Optional prop for drag overlay styling
  dragActive?: boolean; // For defensive overlay check
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onEdit,
  onDelete,
  isOverlay,
  dragActive,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id || 'new-task', // Provide a fallback id if needed
    data: { task }, // Pass task data for context
  });

  useEffect(() => {
    if (isOverlay && !dragActive) {
      // Defensive warning if overlay is rendered outside of drag event
      // eslint-disable-next-line no-console
      console.warn('Overlay TaskCard rendered outside of drag event!');
    }
  }, [isOverlay, dragActive]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging && !isOverlay ? 'none' : transition, // Disable transition during drag for main item
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    marginBottom: '8px',
    cursor: isOverlay ? 'grabbing' : 'grab',
    touchAction: 'none',
    boxShadow: isOverlay ? '0px 5px 15px rgba(0, 0, 0, 0.2)' : undefined, // Style overlay
  };

  const getUserFullName = (
    userId?:
      | string
      | { _id: string; firstName?: string; lastName?: string; name?: string }
  ) => {
    if (!userId) return 'Unassigned';
    let id: string | undefined;
    let name: string | undefined;

    if (typeof userId === 'object' && userId !== null) {
      id = userId._id;
      name =
        userId.name ||
        `${userId.firstName || ''} ${userId.lastName || ''}`.trim();
    } else if (typeof userId === 'string') {
      id = userId;
    }

    if (!id) return 'Unassigned';
    const user = users.find((u) => u.id === id);
    return name || user?.name || 'Unknown';
  };

  const assigneeName = getUserFullName(task.assignedTo);
  const dueDate = formatDate(task.dueDate);

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 1} // More elevation when dragging
      sx={{ p: 1.5, '&:hover .task-actions': { opacity: 1 } }}
      {...attributes}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {task.description}
        </Typography>
        {/* Drag handle: only this area is draggable */}
        <Box
          sx={{
            cursor: isOverlay ? 'grabbing' : 'grab',
            ml: 1,
            display: 'flex',
            alignItems: 'center',
          }}
          {...listeners}
          tabIndex={0}
          aria-label="Drag task"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            style={{ opacity: 0.5 }}
          >
            <circle cx="5" cy="5" r="1.5" />
            <circle cx="5" cy="9" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="13" cy="9" r="1.5" />
            <circle cx="13" cy="13" r="1.5" />
          </svg>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {task.assignedTo && assigneeName !== 'Unassigned' && (
            <Tooltip title={`Assigned to: ${assigneeName}`}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: 'primary.light',
                }}
              >
                {assigneeName.charAt(0)}
              </Avatar>
            </Tooltip>
          )}
          {dueDate && (
            <Typography variant="caption" color="text.secondary">
              Due: {dueDate}
            </Typography>
          )}
        </Box>
        {!isOverlay && ( // Don't show actions on the overlay
          <Box
            className="task-actions"
            sx={{ opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s' }}
          >
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Task">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// --- Kanban Column Component ---
interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: ProjectTask[];
  users: User[];
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (task: ProjectTask) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  users,
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef } = useSortable({ id }); // Make column itself sortable if needed later

  return (
    <Box
      ref={setNodeRef} // Use setNodeRef from useSortable for the column
      sx={{
        flex: '1 1 280px',
        minWidth: 280,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
        p: 1.5,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 300px)', // Adjust as needed
        boxShadow: 1,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ mb: 2, fontWeight: 600, px: 1, color: 'text.secondary' }}
      >
        {title} ({tasks.length})
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
        <SortableContext
          items={tasks.map((t) => t._id || '')}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              users={users}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
      </Box>
    </Box>
  );
};

// --- Main Tab Component ---

const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskFormData>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null); // For DragOverlay

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, ProjectTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
      blocked: [],
    };
    tasks.forEach((task) => {
      grouped[task.status as TaskStatus]?.push(task);
    });
    // Ensure consistent order within columns if needed (e.g., by creation date)
    Object.values(grouped).forEach((group) =>
      group.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    );
    return grouped;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getProject(projectId);
      setTasks(response.data.project.tasks || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to fetch tasks'
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers({ limit: 1000 });
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      console.log('Fetched users and updated state:', fetchedUsers); // Add log here
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleOpenDialog = (task?: ProjectTask) => {
    console.log('handleOpenDialog called', task);
    if (task) {
      setIsEditing(true);
      setCurrentTask({
        _id: task._id,
        description: task.description,
        status: task.status,
        assignedTo:
          typeof task.assignedTo === 'object' && task.assignedTo !== null
            ? task.assignedTo._id
            : task.assignedTo || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        duration: task.duration || 0,
        dependsOn: task.dependsOn || [],
      });
    } else {
      setIsEditing(false);
      setCurrentTask({
        description: '',
        status: 'todo',
        assignedTo: '',
        dueDate: '',
        startDate: '',
        duration: 0,
        dependsOn: [],
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
    setCurrentTask((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTask((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleSaveTask = async () => {
    if (!projectId || !currentTask.description) return;
    setLoading(true);
    setError(null);
    try {
      const taskPayload = {
        ...currentTask,
        dueDate: currentTask.dueDate || undefined,
        startDate: currentTask.startDate || undefined,
        duration: currentTask.duration || 0,
        dependsOn: currentTask.dependsOn || [],
        // Convert empty string assignedTo to undefined for backend compatibility
        assignedTo: currentTask.assignedTo || undefined,
      };
      if (isEditing && currentTask._id) {
        await projectService.updateTask(
          projectId,
          currentTask._id,
          taskPayload
        );
      } else {
        await projectService.addTask(projectId, taskPayload);
      }
      handleCloseDialog();
      await fetchTasks();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to save task'
      );
    } finally {
      setLoading(false);
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
      await fetchTasks();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to delete task'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null); // Clear overlay task
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Check if dropping onto a column (over.id is a status) or reordering within a column (over.id is another task id)
      const overIsColumn = columnOrder.includes(over.id as TaskStatus);

      if (overIsColumn) {
        const activeTask = tasks.find((t) => t._id === active.id);
        const newStatus = over.id as TaskStatus;

        if (activeTask && activeTask.status !== newStatus) {
          // Optimistic UI update
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t._id === active.id ? { ...t, status: newStatus } : t
            )
          );
          // Backend update
          try {
            if (projectId && activeTask._id) {
              await projectService.updateTask(projectId, activeTask._id, {
                status: newStatus,
              });
              // fetchTasks(); // Re-fetch on success if needed, or rely on optimistic
            }
          } catch (err: any) {
            console.error('Failed to update task status:', err);
            setError(
              err?.response?.data?.message ||
                err.message ||
                'Failed to update task status'
            );
            fetchTasks(); // Revert on error
          }
        }
      } else {
        // Handle reordering within the same column if needed
        // Find the columns involved
        const activeColumn = tasks.find((t) => t._id === active.id)
          ?.status as TaskStatus;
        const overTask = tasks.find((t) => t._id === over.id);
        const overColumn = overTask?.status as TaskStatus;

        if (activeColumn === overColumn) {
          setTasks((prevTasks) => {
            const oldIndex = prevTasks.findIndex((t) => t._id === active.id);
            const newIndex = prevTasks.findIndex((t) => t._id === over.id);
            // Only move if indices are valid and different
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              return arrayMove(prevTasks, oldIndex, newIndex);
            }
            return prevTasks; // Return unchanged if indices invalid or same
          });
          // Note: Backend update for reordering is often not implemented unless explicit order is stored.
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box>
        {/* Header: Title + Add Task Button */}
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

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading / Empty State */}
        {loading && tasks.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && tasks.length === 0 && !error && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No tasks added yet.
            </Typography>
          </Paper>
        )}

        {/* Kanban Board Layout */}
        {!loading && tasks.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {/* Render columns using SortableContext if columns themselves are reorderable */}
            {/* For now, columns are static */}
            {columnOrder.map((status) => (
              <KanbanColumn
                key={status}
                id={status}
                title={columnTitles[status]}
                tasks={tasksByStatus[status]}
                users={users}
                onEditTask={handleOpenDialog}
                onDeleteTask={handleDeleteClick}
              />
            ))}
          </Box>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              users={users}
              onEdit={() => {}}
              onDelete={() => {}}
              isOverlay
              dragActive={!!activeTask}
            />
          ) : null}
        </DragOverlay>

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
                    value={currentTask.assignedTo || ''}
                    label="Assignee"
                    onChange={handleSelectChange}
                    disabled={loading || users.length === 0}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {/* Add check for users array before mapping */}
                    {/* Map using correct properties (_id, firstName, lastName) from fetched data */}
                    {users &&
                      users.map(
                        (
                          user: any // Use any temporarily or define a fetchedUser type
                        ) => (
                          <MenuItem key={user._id} value={user._id}>
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                              user.email}{' '}
                            {/* Display name or email */}
                          </MenuItem>
                        )
                      )}
                    {/* Removed duplicate map line above */}
                  </Select>
                </FormControl>
              </Grid>
              {/* Add Start Date, Duration, Depends On */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={currentTask.startDate || ''}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  name="duration"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={currentTask.duration || 0}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={loading || tasks.length === 0}>
                  <InputLabel>Depends On (Prerequisites)</InputLabel>
                  <Select
                    multiple
                    name="dependsOn"
                    value={currentTask.dependsOn || []}
                    onChange={handleSelectChange}
                    label="Depends On (Prerequisites)"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const task = tasks.find((t) => t._id === value);
                          return (
                            <Chip
                              key={value}
                              label={task?.description || value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {tasks
                      .filter((task) => task._id !== currentTask._id)
                      .map((task) => (
                        <MenuItem key={task._id} value={task._id}>
                          {task.description}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
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
    </DndContext> // Closing DndContext
  );
};

export default ProjectTasksTab;
