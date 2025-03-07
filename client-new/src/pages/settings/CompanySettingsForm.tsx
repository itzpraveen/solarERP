import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Divider,
  Avatar,
  IconButton,
  FormHelperText
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { CompanySettings } from '../../api/settingsService';

interface CompanySettingsFormProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  loading: boolean;
}

const CompanySettingsForm = ({ settings, onSave, loading }: CompanySettingsFormProps) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo || null);

  useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logo || null);
  }, [settings]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({
          ...prev,
          logo: base64String,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Company Information
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} display="flex" justifyContent="center" flexDirection="column" alignItems="center" mb={2}>
          <Avatar
            src={logoPreview || undefined}
            alt="Company Logo"
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
          >
            Upload Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoChange}
            />
          </Button>
          <FormHelperText>Upload your company logo (recommended size: 200x200px)</FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Website"
            name="website"
            value={formData.website}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Business Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Business Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Address Information
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Street Address"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="City"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="State/Province"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="ZIP/Postal Code"
            name="address.zip"
            value={formData.address.zip}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Country"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Business Registration Information
      </Typography>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tax ID/EIN"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company Registration Number"
            name="companyRegistrationNumber"
            value={formData.companyRegistrationNumber}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default CompanySettingsForm;