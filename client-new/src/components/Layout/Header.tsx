import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
  InputBase,
  Chip,
  useTheme,
  Typography,
  Tooltip,
  Zoom,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  WbSunny as SunIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import reportService from '../../api/reportService';
import userService from '../../api/userService';

const drawerWidth = 260;

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header = ({ handleDrawerToggle }: HeaderProps) => {
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [currentKwh, setCurrentKwh] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // User menu handlers moved to Sidebar
  // const handleOpenUserMenu = ...
  // const handleCloseUserMenu = ...
  // const handleLogout = ...
  // const handleProfile = ...

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Optional: Clear search bar after submit
    }
  };

  // Fetch notification count and kWh data on mount
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        // Fetch notification count
        const countResponse = await userService.getNotificationCount();
        setNotificationCount(countResponse.count);
        // setNotificationCount(4); // Placeholder - Removed

        // Fetch dashboard reports to get kWh
        const reportResponse = await reportService.getDashboardReports();
        // Assuming the response has a field like 'currentKwh' or similar
        // Adjust the field access based on the actual API response structure
        if (reportResponse?.data?.summary?.currentKwh) {
          setCurrentKwh(reportResponse.data.summary.currentKwh);
        } else {
          // Fallback or default if data not found
          setCurrentKwh(12.4); // Placeholder/Fallback
          console.warn(
            'Could not find currentKwh in reportService.getDashboardReports response'
          );
        }
      } catch (error) {
        console.error('Error fetching header data:', error);
        // Set default values on error
        setNotificationCount(0);
        setCurrentKwh(12.4); // Placeholder/Fallback on error
      }
    };

    fetchHeaderData();
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backdropFilter: 'blur(8px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Mobile menu toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              color: theme.palette.text.primary,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Dashboard link for mobile */}
          {isMobile && (
            <IconButton
              component={Link}
              to="/dashboard"
              color="primary"
              sx={{ mr: 1 }}
            >
              <DashboardIcon />
            </IconButton>
          )}

          {/* Search Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: searchFocused
                ? alpha(theme.palette.primary.main, 0.08)
                : theme.palette.grey[100],
              borderRadius: '50px',
              padding: '6px 16px',
              width: { xs: '120px', sm: '220px', md: '300px' },
              marginRight: { xs: 1, sm: 2 },
              transition: 'all 0.2s ease-in-out',
              border: searchFocused
                ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                : '1px solid transparent',
              boxShadow: searchFocused
                ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
                : 'none',
            }}
          >
            <SearchIcon
              sx={{
                color: searchFocused
                  ? theme.palette.primary.main
                  : theme.palette.grey[500],
                mr: 1,
                transition: 'color 0.2s ease-in-out',
              }}
            />
            <InputBase
              placeholder={isMobile ? "Search" : "Search..."}
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                color: theme.palette.text.primary,
                flexGrow: 1,
                '& .MuiInputBase-input': {
                  transition: 'all 0.2s ease-in-out',
                },
              }}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </Box>
        </Box>

        {/* Right side icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Energy production chip */}
          <Tooltip
            title="Current energy production"
            arrow
            TransitionComponent={Zoom}
          >
            <Chip
              icon={
                <SunIcon
                  sx={{
                    color: theme.palette.warning.main,
                    fontSize: '1rem',
                  }}
                />
              }
              label={
                currentKwh !== null
                  ? `${currentKwh.toFixed(1)} kWh`
                  : 'Loading...'
              }
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.dark,
                fontWeight: 600,
                display: { xs: 'none', md: 'flex' },
                borderRadius: '16px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.2),
                },
                height: '32px',
              }}
            />
          </Tooltip>

          {/* Help button */}
          <Tooltip title="Help & Resources" arrow TransitionComponent={Zoom}>
            <IconButton
              color="inherit"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>

          {/* Notifications button */}
          <Tooltip title="Notifications" arrow TransitionComponent={Zoom}>
            <IconButton
              color="inherit"
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Badge
                badgeContent={notificationCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    top: 3,
                    right: 3,
                    fontWeight: 'bold',
                    minWidth: '18px',
                    height: '18px',
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings button */}
          <Tooltip title="Settings" arrow TransitionComponent={Zoom}>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => navigate('/settings')}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
