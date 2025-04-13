import { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { AuthContext } from '../features/auth/context/AuthContext';
import * as axiosModule from 'axios';
import apiService from '../api/apiService';

const axios = axiosModule.default || axiosModule;

const Profile = () => {
  const { user, setError, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    avatar: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        avatar: user.avatar || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setUpdateError('');

    try {
      // Only include password fields if user is trying to change password
      const updateData = {
        name: formData.name,
        email: formData.email,
        ...(changePassword && formData.password 
          ? { 
              password: formData.password,
              password_confirmation: formData.confirmPassword 
            } 
          : {})
      };

      // Validate passwords if changing
      if (changePassword) {
        if (formData.password !== formData.confirmPassword) {
          setUpdateError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setUpdateError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
      }

      // API call to update profile using the apiService
      const res = await apiService.put('/api/auth/profile', updateData);
      
      // Refresh auth token if needed
      if (res.token) {
        localStorage.setItem('token', res.token);
        // Update auth token header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
      }
      
      // Update user in context
      updateUser({
        name: formData.name,
        email: formData.email
      });
      
      setSuccess('Profile updated successfully');
      setLoading(false);
      setChangePassword(false);
      
      // Reset password fields
      setFormData({
        ...formData,
        password: '',
        confirmPassword: ''
      });
      
    } catch (err: any) {
      console.error('Profile update error:', err);
      setUpdateError(err.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      
      <Paper sx={{ padding: 3, marginTop: 2 }}>
        <Grid container spacing={4}>
          {/* Profile Image Section */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={user?.avatar} 
              alt={user?.name}
              sx={{ width: 150, height: 150, mb: 2 }}
            >
              {!user?.avatar && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <Typography variant="body1" gutterBottom>
              {user?.role}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              disabled={true} // To be implemented in future
            >
              Change Picture
            </Button>
          </Grid>
          
          {/* Profile Form Section */}
          <Grid item xs={12} md={9}>
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {updateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {updateError}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    name="role"
                    value={formData.role}
                    variant="outlined"
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Change Password</Typography>
                    <Button
                      sx={{ ml: 2 }}
                      size="small"
                      onClick={() => setChangePassword(!changePassword)}
                    >
                      {changePassword ? 'Cancel' : 'Change'}
                    </Button>
                  </Box>
                </Grid>
                
                {changePassword && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;