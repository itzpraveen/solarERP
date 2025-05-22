import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Fab,
  Zoom,
  alpha,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  Build as ServiceIcon,
  PhotoCamera as CameraIcon,
  Menu as MenuIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  NoteAdd as NoteIcon,
  Settings as SettingsIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import logoSvg from '../../logo.svg';

const MobileFieldLayout: React.FC = () => {
  const [value, setValue] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/services')) return 'Service Requests';
    if (path.includes('/photos')) return 'Photos';
    if (path.includes('/location')) return 'Location';
    if (path.includes('/notes')) return 'Notes';
    return 'Field App';
  };

  // Determine if we should show back button instead of menu
  const showBackButton = () => {
    const path = location.pathname;
    // Show back button if we're in a detail view
    return (
      path.includes('/projects/') ||
      path.includes('/services/') ||
      path.includes('/photos/')
    );
  };

  // Handle navigation actions
  const handleNavigation = (newValue: number) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/projects');
        break;
      case 1:
        navigate('/services');
        break;
      case 2:
        navigate('/photos');
        break;
      default:
        break;
    }
  };

  // Handle FAB (Floating Action Button) actions
  const handleFabClick = () => {
    const path = location.pathname;
    if (path.includes('/projects')) {
      navigate('/projects/update-status');
    } else if (path.includes('/services')) {
      navigate('/services/new');
    } else if (path.includes('/photos')) {
      navigate('/photos/capture');
    }
  };

  // Determine which FAB to show based on current route
  const getFabIcon = () => {
    const path = location.pathname;
    if (path.includes('/photos')) return <CameraIcon />;
    return <AddIcon />;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          {showBackButton() ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={() => navigate(-1)}
            >
              <BackIcon />
            </IconButton>
          ) : (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <img
              src={logoSvg}
              alt="Solar ERP Logo"
              style={{ height: '28px', marginRight: '8px' }}
            />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {getPageTitle()}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <img
            src={logoSvg}
            alt="Solar ERP Logo"
            style={{ height: '32px', marginRight: '12px' }}
          />
          <Typography variant="h6" color="primary">
            Solar ERP Field
          </Typography>
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/projects');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/projects')}
            >
              <ListItemIcon>
                <ProjectIcon
                  color={
                    location.pathname.includes('/projects')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Projects" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/services');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/services')}
            >
              <ListItemIcon>
                <ServiceIcon
                  color={
                    location.pathname.includes('/services')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Service Requests" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/photos');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/photos')}
            >
              <ListItemIcon>
                <CameraIcon
                  color={
                    location.pathname.includes('/photos')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Photos" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/location');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/location')}
            >
              <ListItemIcon>
                <LocationIcon
                  color={
                    location.pathname.includes('/location')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Location" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/notes');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/notes')}
            >
              <ListItemIcon>
                <NoteIcon
                  color={
                    location.pathname.includes('/notes') ? 'primary' : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Notes" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/documents');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/documents')}
            >
              <ListItemIcon>
                <DocumentIcon
                  color={
                    location.pathname.includes('/documents')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Documents" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/settings');
                setMenuOpen(false);
              }}
              selected={location.pathname.includes('/settings')}
            >
              <ListItemIcon>
                <SettingsIcon
                  color={
                    location.pathname.includes('/settings')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          mt: '56px', // Adjust for AppBar height
          mb: '56px', // Adjust for BottomNavigation height
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>

      {/* FAB - Floating Action Button */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleFabClick}
          sx={{
            position: 'fixed',
            bottom: 76, // Position above bottom navigation
            right: 16,
            zIndex: 1000,
          }}
        >
          {getFabIcon()}
        </Fab>
      </Zoom>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={value}
          onChange={(_, newValue) => handleNavigation(newValue)}
          showLabels
          sx={{
            height: 56,
            '& .MuiBottomNavigationAction-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <BottomNavigationAction label="Projects" icon={<ProjectIcon />} />
          <BottomNavigationAction label="Services" icon={<ServiceIcon />} />
          <BottomNavigationAction label="Photos" icon={<CameraIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default MobileFieldLayout;
