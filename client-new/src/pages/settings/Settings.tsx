import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Person as UserIcon, 
  Business as CompanyIcon, 
  Settings as SystemIcon 
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import UserSettingsForm from './UserSettingsForm';
import CompanySettingsForm from './CompanySettingsForm';
import SystemSettingsForm from './SystemSettingsForm';
import {
  UserSettings,
  CompanySettings,
  SystemSettings,
  getUserSettings,
  getCompanySettings,
  getSystemSettings,
  updateUserSettings,
  updateCompanySettings,
  updateSystemSettings
} from '../../api/settingsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Fetch all settings in parallel
        const [user, company, system] = await Promise.all([
          getUserSettings(),
          getCompanySettings(),
          getSystemSettings()
        ]);
        
        setUserSettings(user);
        setCompanySettings(company);
        setSystemSettings(system);
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSaveUserSettings = async (settings: UserSettings) => {
    try {
      setLoading(true);
      const updated = await updateUserSettings(settings);
      setUserSettings(updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving user settings:', err);
      setError('Failed to save user settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanySettings = async (settings: CompanySettings) => {
    try {
      setLoading(true);
      const updated = await updateCompanySettings(settings);
      setCompanySettings(updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving company settings:', err);
      setError('Failed to save company settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async (settings: SystemSettings) => {
    try {
      setLoading(true);
      const updated = await updateSystemSettings(settings);
      setSystemSettings(updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving system settings:', err);
      setError('Failed to save system settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
    setError(null);
  };

  if (loading && !userSettings && !companySettings && !systemSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ mt: 3, mb: 4 }}>
        <Box p={2}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="settings tabs"
              variant="fullWidth"
            >
              <Tab icon={<UserIcon />} label="User Settings" id="settings-tab-0" />
              <Tab icon={<CompanyIcon />} label="Company Settings" id="settings-tab-1" />
              <Tab icon={<SystemIcon />} label="System Settings" id="settings-tab-2" />
            </Tabs>
          </Box>

          {userSettings && (
            <TabPanel value={activeTab} index={0}>
              <UserSettingsForm 
                settings={userSettings} 
                onSave={handleSaveUserSettings}
                loading={loading}
              />
            </TabPanel>
          )}

          {companySettings && (
            <TabPanel value={activeTab} index={1}>
              <CompanySettingsForm 
                settings={companySettings} 
                onSave={handleSaveCompanySettings}
                loading={loading}
              />
            </TabPanel>
          )}

          {systemSettings && (
            <TabPanel value={activeTab} index={2}>
              <SystemSettingsForm 
                settings={systemSettings} 
                onSave={handleSaveSystemSettings}
                loading={loading}
              />
            </TabPanel>
          )}
        </Box>
      </Paper>

      <Snackbar 
        open={saveSuccess} 
        autoHideDuration={5000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Settings saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={5000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;