import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { clearDummyData } from './utils/clearDummyData';
import PrivateRoute from './components/routing/PrivateRoute';
import MainLayout from './components/Layout/MainLayout';
import theme from './theme';

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
import Documents from './pages/documents/Documents';
import Reports from './pages/reports/Reports';
import InventoryList from './pages/inventory/InventoryList';
// import InventoryForm from './features/inventory/components/InventoryForm'; // No longer needed directly here
import InventoryAdd from './pages/inventory/InventoryAdd'; // Import Add page
import InventoryEdit from './pages/inventory/InventoryEdit'; // Import Edit page
import ProjectAdd from './pages/projects/ProjectAdd'; // Import Project Add page

// Service Request Module
import ServiceRequests from './pages/services/ServiceRequests';
import ServiceRequestForm from './pages/services/ServiceRequestForm';
import ServiceRequestDetails from './pages/services/ServiceRequestDetails';

function App() {
  // Clear any dummy data from localStorage on app startup
  const clearResult = clearDummyData();
  if (clearResult.cleared) {
    console.log('Cleared dummy data from localStorage:', clearResult.items);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Private Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    {/* Wrap MainLayout */}
                    <MainLayout />
                  </ProjectProvider>
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* Implemented Routes */}
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetails />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/add" element={<ProjectAdd />} /> {/* Add route for ProjectAdd */}
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="proposals" element={<Proposals />} />
              <Route path="proposals/:id" element={<ProposalDetails />} />
              <Route path="documents" element={<Documents />} />
              <Route path="reports" element={<Reports />} />
              {/* Inventory Routes */}
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/add" element={<InventoryAdd />} />{' '}
              {/* Use InventoryAdd page */}
              <Route
                path="inventory/edit/:id"
                element={<InventoryEdit />}
              />{' '}
              {/* Use InventoryEdit page */}
              {/* Service Request Routes */}
              <Route path="services" element={<ServiceRequests />} />
              <Route path="services/new" element={<ServiceRequestForm />} />
              <Route path="services/:id" element={<ServiceRequestDetails />} />
              <Route
                path="services/:id/edit"
                element={<ServiceRequestForm />}
              />
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
