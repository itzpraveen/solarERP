import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Divider,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import { SystemSettings, getCurrencySymbol } from '../../api/settingsService';

interface SystemSettingsFormProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  loading: boolean;
}

const SystemSettingsForm = ({
  settings,
  onSave,
  loading,
}: SystemSettingsFormProps) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numValue = parseFloat(value);

    // Handle nested fields
    if (name.startsWith('pricingDefaults.margins.')) {
      const marginField = name.split('.')[2];
      setFormData((prev) => ({
        ...prev,
        pricingDefaults: {
          ...prev.pricingDefaults,
          margins: {
            ...prev.pricingDefaults.margins,
            [marginField]: isNaN(numValue) ? 0 : numValue,
          },
        },
      }));
    } else if (name.startsWith('pricingDefaults.')) {
      const pricingField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pricingDefaults: {
          ...prev.pricingDefaults,
          [pricingField]: isNaN(numValue) ? 0 : numValue,
        },
      }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;

    // Handle nested fields
    if (name.startsWith('unitPreferences.')) {
      const unitField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        unitPreferences: {
          ...prev.unitPreferences,
          [unitField]: value,
        },
      }));
    } else if (name.startsWith('documentTemplates.')) {
      const templateField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        documentTemplates: {
          ...prev.documentTemplates,
          [templateField]: value,
        },
      }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Pricing Default Values
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tax Rate"
            name="pricingDefaults.taxRate"
            type="number"
            value={formData.pricingDefaults.taxRate}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">%</InputAdornment>
              ),
              inputProps: {
                min: 0,
                max: 100,
                step: 0.1,
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Default Hourly Rate"
            name="pricingDefaults.hourlyRate"
            type="number"
            value={formData.pricingDefaults.hourlyRate}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getCurrencySymbol(formData.unitPreferences.currency)}
                </InputAdornment>
              ),
              inputProps: {
                min: 0,
                step: 0.1,
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Default Margin Percentages
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Equipment Margin"
            name="pricingDefaults.margins.equipment"
            type="number"
            value={formData.pricingDefaults.margins.equipment}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">%</InputAdornment>
              ),
              inputProps: {
                min: 0,
                max: 1,
                step: 0.01,
              },
            }}
            helperText="Enter as decimal (e.g., 0.2 = 20%)"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Labor Margin"
            name="pricingDefaults.margins.labor"
            type="number"
            value={formData.pricingDefaults.margins.labor}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">%</InputAdornment>
              ),
              inputProps: {
                min: 0,
                max: 1,
                step: 0.01,
              },
            }}
            helperText="Enter as decimal (e.g., 0.3 = 30%)"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Permits Margin"
            name="pricingDefaults.margins.permits"
            type="number"
            value={formData.pricingDefaults.margins.permits}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">%</InputAdornment>
              ),
              inputProps: {
                min: 0,
                max: 1,
                step: 0.01,
              },
            }}
            helperText="Enter as decimal (e.g., 0.1 = 10%)"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Unit Preferences
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="currency-select-label">Currency</InputLabel>
            <Select
              labelId="currency-select-label"
              id="unitPreferences.currency"
              name="unitPreferences.currency"
              value={formData.unitPreferences.currency}
              label="Currency"
              onChange={handleSelectChange}
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="INR">INR (₹)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="CAD">CAD ($)</MenuItem>
              <MenuItem value="AUD">AUD ($)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="distance-select-label">Distance Unit</InputLabel>
            <Select
              labelId="distance-select-label"
              id="unitPreferences.distance"
              name="unitPreferences.distance"
              value={formData.unitPreferences.distance}
              label="Distance Unit"
              onChange={handleSelectChange}
            >
              <MenuItem value="ft">Feet (ft)</MenuItem>
              <MenuItem value="m">Meters (m)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="power-select-label">Power Unit</InputLabel>
            <Select
              labelId="power-select-label"
              id="unitPreferences.power"
              name="unitPreferences.power"
              value={formData.unitPreferences.power}
              label="Power Unit"
              onChange={handleSelectChange}
            >
              <MenuItem value="W">Watts (W)</MenuItem>
              <MenuItem value="kW">Kilowatts (kW)</MenuItem>
              <MenuItem value="MW">Megawatts (MW)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="energy-select-label">Energy Unit</InputLabel>
            <Select
              labelId="energy-select-label"
              id="unitPreferences.energy"
              name="unitPreferences.energy"
              value={formData.unitPreferences.energy}
              label="Energy Unit"
              onChange={handleSelectChange}
            >
              <MenuItem value="Wh">Watt-hours (Wh)</MenuItem>
              <MenuItem value="kWh">Kilowatt-hours (kWh)</MenuItem>
              <MenuItem value="MWh">Megawatt-hours (MWh)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Document Templates
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="proposal-template-label">
              Proposal Template
            </InputLabel>
            <Select
              labelId="proposal-template-label"
              id="documentTemplates.proposal"
              name="documentTemplates.proposal"
              value={formData.documentTemplates.proposal}
              label="Proposal Template"
              onChange={handleSelectChange}
            >
              <MenuItem value="default">Default Template</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="simplified">Simplified</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="contract-template-label">
              Contract Template
            </InputLabel>
            <Select
              labelId="contract-template-label"
              id="documentTemplates.contract"
              name="documentTemplates.contract"
              value={formData.documentTemplates.contract}
              label="Contract Template"
              onChange={handleSelectChange}
            >
              <MenuItem value="default">Default Template</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="comprehensive">Comprehensive</MenuItem>
              <MenuItem value="simple">Simple</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="invoice-template-label">
              Invoice Template
            </InputLabel>
            <Select
              labelId="invoice-template-label"
              id="documentTemplates.invoice"
              name="documentTemplates.invoice"
              value={formData.documentTemplates.invoice}
              label="Invoice Template"
              onChange={handleSelectChange}
            >
              <MenuItem value="default">Default Template</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
            </Select>
          </FormControl>
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

export default SystemSettingsForm;
