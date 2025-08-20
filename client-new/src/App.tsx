import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import MainLayout from './components/Layout/MainLayout';

// Loading component
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress />
  </Box>
);

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Leads module
const Leads = lazy(() => import('./pages/leads/Leads'));
const LeadDetails = lazy(() => import('./pages/leads/LeadDetails'));

// Customers module
const Customers = lazy(() => import('./pages/customers/Customers'));
const CustomerDetails = lazy(() => import('./pages/customers/CustomerDetails'));

// Projects module
const Projects = lazy(() => import('./pages/projects/Projects'));
const ProjectDetails = lazy(() => import('./pages/projects/ProjectDetails'));

// Proposals module
const Proposals = lazy(() => import('./pages/proposals/Proposals'));
const ProposalDetails = lazy(() => import('./pages/proposals/ProposalDetails'));

// Equipment module
const Equipment = lazy(() => import('./pages/equipment/Equipment'));
const EquipmentDetails = lazy(() => import('./pages/equipment/EquipmentDetails'));

// Service Requests module
const ServiceRequests = lazy(() => import('./pages/services/ServiceRequests'));
const ServiceRequestForm = lazy(() => import('./pages/services/ServiceRequestForm'));
const ServiceRequestDetails = lazy(() => import('./pages/services/ServiceRequestDetails'));

// Other pages
const Settings = lazy(() => import('./pages/settings/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Documents = lazy(() => import('./pages/documents/Documents'));
const Reports = lazy(() => import('./pages/reports/Reports'));

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
      main: '#ff9800', // Orange secondary color
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    },
    h4: {
      fontWeight: 600
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Private Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Leads Module */}
                <Route path="leads">
                  <Route index element={<Leads />} />
                  <Route path=":id" element={<LeadDetails />} />
                </Route>

                {/* Customers Module */}
                <Route path="customers">
                  <Route index element={<Customers />} />
                  <Route path=":id" element={<CustomerDetails />} />
                </Route>

                {/* Projects Module */}
                <Route path="projects">
                  <Route index element={<Projects />} />
                  <Route path=":id" element={<ProjectDetails />} />
                </Route>

                {/* Proposals Module */}
                <Route path="proposals">
                  <Route index element={<Proposals />} />
                  <Route path=":id" element={<ProposalDetails />} />
                </Route>

                {/* Equipment Module */}
                <Route path="equipment">
                  <Route index element={<Equipment />} />
                  <Route path=":id" element={<EquipmentDetails />} />
                </Route>

                {/* Service Requests Module */}
                <Route path="service-requests">
                  <Route index element={<ServiceRequests />} />
                  <Route path="new" element={<ServiceRequestForm />} />
                  <Route path=":id" element={<ServiceRequestDetails />} />
                  <Route path=":id/edit" element={<ServiceRequestForm />} />
                </Route>

                {/* Other Pages */}
                <Route path="documents" element={<Documents />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;