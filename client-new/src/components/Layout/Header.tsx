import { useState, useEffect } from 'react'; // Removed unused useContext
import {
  AppBar,
  Toolbar,
  IconButton,
  // Typography, // Removed unused import
  Badge,
  // Menu, // Moved to Sidebar
  // MenuItem, // Moved to Sidebar
  Box,
  // Avatar, // Removed unused import
  // Tooltip, // Moved to Sidebar
  InputBase,
  // Button, // Removed unused import
  Chip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  // ExitToApp as LogoutIcon, // Moved to Sidebar
  // Person as PersonIcon, // Moved to Sidebar
  WbSunny as SunIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// import { AuthContext } from '../../features/auth/context/AuthContext'; // Removed unused import
import reportService from '../../api/reportService'; // Import report service
import userService from '../../api/userService'; // Import user service (will add function later)

const drawerWidth = 240;

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header = ({ handleDrawerToggle }: HeaderProps) => {
  // const [anchorElUser, setAnchorElUser] = useState<HTMLElement | null>(null); // Moved to Sidebar
  const [notificationCount, setNotificationCount] = useState<number>(0); // State for notification count
  const [currentKwh, setCurrentKwh] = useState<number | null>(null); // State for kWh
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search input
  // Removed useContext(AuthContext) as it's no longer used here
  const navigate = useNavigate();
  const theme = useTheme();

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
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: theme.palette.grey[100],
              borderRadius: '50px',
              padding: '4px 16px',
              width: { xs: '120px', sm: '220px', md: '300px' },
              marginRight: { xs: 1, sm: 2 },
            }}
          >
            <SearchIcon sx={{ color: theme.palette.grey[500], mr: 1 }} />
            <InputBase
              placeholder="Search..."
              inputProps={{ 'aria-label': 'search' }}
              sx={{ color: theme.palette.grey[700], flexGrow: 1 }}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
            />
          </Box>
        </Box>

        {/* Right side icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={
              <SunIcon
                sx={{ color: theme.palette.warning.main, fontSize: '1.1rem' }}
              />
            }
            label={
              currentKwh !== null
                ? `${currentKwh.toFixed(1)} kWh`
                : 'Loading...'
            }
            size="small"
            sx={{
              backgroundColor: theme.palette.warning.light,
              color: theme.palette.warning.dark,
              fontWeight: 500,
              display: { xs: 'none', md: 'flex' },
            }}
          />

          <IconButton
            color="inherit"
            size="small"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <HelpIcon />
          </IconButton>

          <IconButton color="inherit" size="small">
            <Badge
              badgeContent={notificationCount}
              color="error"
              sx={{ '& .MuiBadge-badge': { top: 3, right: 3 } }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            size="small"
            onClick={() => navigate('/settings')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <SettingsIcon />
          </IconButton>

          {/* User Info Box Removed - Kept in Sidebar */}
          {/* User Menu Trigger Removed - Moved to Sidebar */}

          {/* Menu component moved to Sidebar */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
