import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 260; // Slightly wider for better content display

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pageLoaded, setPageLoaded] = useState(false);

  // Close drawer automatically when switching to mobile view
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Add a small delay for fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <CssBaseline />

      {/* Header */}
      <Header handleDrawerToggle={handleDrawerToggle} />

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main content with fade-in effect */}
      <Fade in={pageLoaded} timeout={800}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            overflowX: 'hidden',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar />
          <Box
            sx={{
              maxWidth: '1600px',
              marginX: 'auto',
              borderRadius: theme.shape.borderRadius * 1.5,
              // overflow: 'hidden', // Removed to prevent potential clipping of Outlet content
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.03)',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default MainLayout;
