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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import userService from '../../api/userService'; // Import user service
import { User } from '../../features/auth/types/User'; // Import User type
import { AuthContext } from '../../features/auth/context/AuthContext'; // Import AuthContext
import { PERMISSIONS } from '../../common/config/permissions'; // Import Permissions

const UserManagementPanel = () => {
  const { hasPermission } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Add state for pagination, sorting, filtering if needed
  // TODO: Add state for Add/Edit User Modals

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
    // TODO: Open Add User Modal/Form
    console.log('Add User clicked');
  };

  const handleEditUser = (userId: string) => {
    // TODO: Open Edit User Modal/Form with userId
    console.log('Edit User clicked:', userId);
  };

  const handleDeleteUser = (userId: string) => {
    // TODO: Open Delete Confirmation Dialog
    console.log('Delete User clicked:', userId);
  };
  // TODO: Fetch users from API (e.g., /api/users)
  // TODO: Implement user table (displaying name, email, role, status)
  // TODO: Implement edit user functionality (modal/form)
  // TODO: Implement create user functionality (modal/form)
  // TODO: Implement delete/deactivate user functionality

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
                      onClick={() => handleEditUser(user.id)}
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
    </Paper>
  );
};

export default UserManagementPanel;
