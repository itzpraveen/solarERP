import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog, // Import Dialog components
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import userService from '../../api/userService'; // Import user service
import { User } from '../../features/auth/types/User'; // Import User type
import { AuthContext } from '../../features/auth/context/AuthContext'; // Import AuthContext
import { PERMISSIONS } from '../../common/config/permissions'; // Import Permissions
import UserForm from './UserForm'; // Import the UserForm component

const UserManagementPanel = () => {
  const { hasPermission } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // For fetching users
  const [error, setError] = useState<string | null>(null); // For fetching users

  // State for Add/Edit User Dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [submitError, setSubmitError] = useState<string | null>(null); // For form submission error

  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers({ limit: 50 }); // Fetch first 50 for now
      setUsers(response.data.users);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err?.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission(PERMISSIONS.VIEW_USERS)) {
      fetchUsers();
    } else {
      setError('You do not have permission to view users.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]); // Re-fetch if permission changes (unlikely but good practice)

  const handleAddUser = () => {
    setIsEditMode(false);
    setEditingUser(null);
    setSubmitError(null); // Clear previous errors
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setIsEditMode(true);
    setEditingUser(user);
    setSubmitError(null); // Clear previous errors
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDeleteId(userId);
    setIsDeleteDialogOpen(true);
  };
  const handleDialogClose = () => {
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setSubmitError(null);
  };

  // Use the specific form data type here
  const handleDialogSubmit = async (userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    password?: string; // Include password for creation
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditMode && editingUser) {
        // Update existing user (ensure ID is included if needed by API)
        await userService.updateUser(editingUser.id, userData);
      } else {
        // Create new user (API expects password here)
        // Ensure required fields for creation are present
        if (
          !userData.firstName ||
          !userData.lastName ||
          !userData.email ||
          !userData.role ||
          !userData.password
        ) {
          throw new Error('Missing required fields for new user.');
        }
        await userService.createUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          password: userData.password,
        });
      }
      handleDialogClose();
      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setSubmitError(err?.response?.data?.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDeleteId) return;
    // Consider adding loading state for delete
    try {
      await userService.deleteUser(userToDeleteId);
      setIsDeleteDialogOpen(false);
      setUserToDeleteId(null);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err?.response?.data?.message || 'Failed to delete user.'); // Show error in main panel for now
      setIsDeleteDialogOpen(false);
      setUserToDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setUserToDeleteId(null);
  };

  // Render logic
  let content;
  if (loading) {
    content = (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    content = (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  } else {
    content = (
      <TableContainer>
        <Table stickyHeader aria-label="user table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                <TableCell align="right">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {/* Assuming 'active' field exists, might need to add to User type */}
                  <Chip
                    label={
                      (user as any).active !== false ? 'Active' : 'Inactive'
                    }
                    color={
                      (user as any).active !== false ? 'success' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)} // Pass full user object
                      title="Edit User"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* TODO: Add TablePagination */}
      </TableContainer>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">User Management</Typography>
        {hasPermission(PERMISSIONS.MANAGE_USERS) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        )}
      </Box>
      {content}

      {/* Add/Edit User Dialog */}
      <Dialog
        open={isUserDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          {/* Display submission error inside dialog */}
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <UserForm
            initialData={editingUser}
            onSubmit={handleDialogSubmit}
            onCancel={handleDialogClose}
            loading={isSubmitting}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagementPanel;
