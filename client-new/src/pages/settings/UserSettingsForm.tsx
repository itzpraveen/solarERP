import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Switch,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Divider,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';
import { UserSettings } from '../../api/settingsService';

interface UserSettingsFormProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  loading: boolean;
}

const UserSettingsForm = ({
  settings,
  onSave,
  loading,
}: UserSettingsFormProps) => {
  const [formData, setFormData] = useState<UserSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      displayTheme: event.target.value as 'light' | 'dark' | 'system',
    }));
  };

  const handleLayoutChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      dashboardLayout: {
        ...prev.dashboardLayout,
        layout: event.target.value as 'grid' | 'list',
      },
    }));
  };

  const handleWidgetChange =
    (widget: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;

      setFormData((prev) => {
        let widgets = [...prev.dashboardLayout.widgets];

        if (checked && !widgets.includes(widget)) {
          widgets.push(widget);
        } else if (!checked && widgets.includes(widget)) {
          widgets = widgets.filter((w) => w !== widget);
        }

        return {
          ...prev,
          dashboardLayout: {
            ...prev.dashboardLayout,
            widgets,
          },
        };
      });
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        User Interface Preferences
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="theme-select-label">Display Theme</InputLabel>
            <Select
              labelId="theme-select-label"
              id="displayTheme"
              name="displayTheme"
              value={formData.displayTheme}
              label="Display Theme"
              onChange={handleThemeChange}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">Use System Setting</MenuItem>
            </Select>
            <FormHelperText>
              Choose your preferred interface theme
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language"
              name="language"
              value={formData.language}
              label="Language"
              onChange={handleSelectChange}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
            </Select>
            <FormHelperText>Select your preferred language</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Dashboard Configuration
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="default-view-label">Default View</InputLabel>
            <Select
              labelId="default-view-label"
              id="defaultView"
              name="defaultView"
              value={formData.defaultView}
              label="Default View"
              onChange={handleSelectChange}
            >
              <MenuItem value="calendar">Calendar</MenuItem>
              <MenuItem value="list">Activity List</MenuItem>
              <MenuItem value="stats">Statistics</MenuItem>
              <MenuItem value="projects">Projects Overview</MenuItem>
            </Select>
            <FormHelperText>
              Choose what you see first when opening dashboard
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="layout-select-label">Dashboard Layout</InputLabel>
            <Select
              labelId="layout-select-label"
              id="dashboardLayout"
              name="dashboardLayout"
              value={formData.dashboardLayout.layout}
              label="Dashboard Layout"
              onChange={handleLayoutChange}
            >
              <MenuItem value="grid">Grid View</MenuItem>
              <MenuItem value="list">List View</MenuItem>
            </Select>
            <FormHelperText>Select how widgets are displayed</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Dashboard Widgets
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.dashboardLayout.widgets.includes(
                    'calendar'
                  )}
                  onChange={handleWidgetChange('calendar')}
                  name="calendarWidget"
                />
              }
              label="Calendar"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.dashboardLayout.widgets.includes('tasks')}
                  onChange={handleWidgetChange('tasks')}
                  name="tasksWidget"
                />
              }
              label="Tasks"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.dashboardLayout.widgets.includes('leads')}
                  onChange={handleWidgetChange('leads')}
                  name="leadsWidget"
                />
              }
              label="Leads"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.dashboardLayout.widgets.includes(
                    'projects'
                  )}
                  onChange={handleWidgetChange('projects')}
                  name="projectsWidget"
                />
              }
              label="Projects"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.dashboardLayout.widgets.includes(
                    'statistics'
                  )}
                  onChange={handleWidgetChange('statistics')}
                  name="statisticsWidget"
                />
              }
              label="Statistics"
            />
          </FormGroup>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.emailNotifications}
                onChange={handleChange}
                name="emailNotifications"
              />
            }
            label="Email Notifications"
          />
          <FormHelperText>
            Receive updates, alerts, and notifications via email
          </FormHelperText>
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

export default UserSettingsForm;
