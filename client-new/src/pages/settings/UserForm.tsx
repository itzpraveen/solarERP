import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { User } from '../../features/auth/types/User'; // Adjust path as needed

// Define the data structure expected by the form submission
// Include password only for creation
type UserFormData = Partial<Omit<User, 'id' | 'name'>> & {
  firstName?: string;
  lastName?: string;
  password?: string; // Optional password for creation
};

interface UserFormProps {
  initialData?: User | null; // User data for editing, null/undefined for adding
  onSubmit: (userData: UserFormData) => void;
  onCancel: () => void;
  loading: boolean;
  isEditMode: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  isEditMode,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user', // Default role
  });
  const [password, setPassword] = useState(''); // Separate state for password in add mode

  useEffect(() => {
    if (isEditMode && initialData) {
      // Use firstName and lastName directly from initialData
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        role: initialData.role || 'user',
      });
      setPassword(''); // Clear password field in edit mode
    } else {
      // Reset form for add mode
      setFormData({ firstName: '', lastName: '', email: '', role: 'user' });
      setPassword('');
    }
  }, [initialData, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: UserFormData = { ...formData };
    if (!isEditMode && password) {
      dataToSubmit.password = password; // Add password only for new users
    }
    // Basic validation example (can be expanded)
    if (
      !dataToSubmit.firstName ||
      !dataToSubmit.lastName ||
      !dataToSubmit.email ||
      (!isEditMode && !dataToSubmit.password)
    ) {
      alert('Please fill in all required fields.');
      return;
    }
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading || isEditMode} // Disable email editing for now
            helperText={isEditMode ? 'Email cannot be changed.' : ''}
          />
        </Grid>
        {!isEditMode && ( // Only show password field when adding a new user
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Password"
              name="password"
              type="password"
              value={password} // Use separate password state
              onChange={(e) => setPassword(e.target.value)} // Update separate password state
              disabled={loading}
              helperText="Password is required for new users."
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <FormControl fullWidth required disabled={loading}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleSelectChange}
            >
              {/* TODO: Fetch roles dynamically or use a predefined list */}
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* Add other fields as needed, e.g., phone, status toggle */}
        {isEditMode && (
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Password can be changed via user profile or reset functionality.
            </Typography>
          </Grid>
        )}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {isEditMode ? 'Save Changes' : 'Add User'}
        </Button>
      </Box>
    </form>
  );
};

export default UserForm;
