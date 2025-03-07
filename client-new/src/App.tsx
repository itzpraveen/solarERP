import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';
import Leads from './pages/leads/Leads';
import LeadDetails from './pages/leads/LeadDetails';
import Customers from './pages/customers/Customers';
import CustomerDetails from './pages/customers/CustomerDetails';
import Projects from './pages/projects/Projects';
import ProjectDetails from './pages/projects/ProjectDetails';
import Proposals from './pages/proposals/Proposals';
import ProposalDetails from './pages/proposals/ProposalDetails';
import Settings from './pages/settings/Settings';
import Profile from './pages/Profile';
import Equipment from './pages/equipment/Equipment';
import EquipmentDetails from './pages/equipment/EquipmentDetails';
import Documents from './pages/documents/Documents';
import Reports from './pages/reports/Reports';

// Service Request Module
import ServiceRequests from './pages/services/ServiceRequests';
import ServiceRequestForm from './pages/services/ServiceRequestForm';
import ServiceRequestDetails from './pages/services/ServiceRequestDetails';

// Extend the Theme interface to include our custom properties
declare module '@mui/material/styles' {
  interface PaletteColor {
    lightest?: string;
  }
  interface SimplePaletteColorOptions {
    lightest?: string;
  }
}

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // Green primary color
      light: '#80e27e',
      dark: '#087f23',
      contrastText: '#fff',
      lightest: '#f1f8e9' // Custom lightest shade for subtle backgrounds
    },
    secondary: {
      main: '#2196f3', // Blue secondary color
      light: '#6ec6ff',
      dark: '#0069c0',
      contrastText: '#fff',
    },
    background: {
      default: '#f8f9fc',
      paper: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#03a9f4',
    },
    success: {
      main: '#4caf50',
    },
    grey: {
      50: '#f8f9fc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 10px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff',
          color: '#2d3748',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Private Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Implemented Routes */}
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetails />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="proposals" element={<Proposals />} />
              <Route path="proposals/:id" element={<ProposalDetails />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="equipment/:id" element={<EquipmentDetails />} />
              <Route path="documents" element={<Documents />} />
              <Route path="reports" element={<Reports />} />
              
              {/* Service Request Routes */}
              <Route path="services" element={<ServiceRequests />} />
              <Route path="services/new" element={<ServiceRequestForm />} />
              <Route path="services/:id" element={<ServiceRequestDetails />} />
              <Route path="services/:id/edit" element={<ServiceRequestForm />} />
              
              {/* Profile & Settings */}
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
