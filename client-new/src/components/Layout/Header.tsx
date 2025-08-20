import { useContext, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Badge, 
  Menu, 
  MenuItem, 
  Box, 
  Avatar, 
  Tooltip,
  InputBase,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  WbSunny as SunIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const drawerWidth = 240;

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header = ({ handleDrawerToggle }: HeaderProps) => {
  const [anchorElUser, setAnchorElUser] = useState<HTMLElement | null>(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };

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
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: theme.palette.grey[100], 
            borderRadius: '50px',
            padding: '4px 16px',
            width: { xs: '120px', sm: '220px', md: '300px' },
            marginRight: { xs: 1, sm: 2 }
          }}>
            <SearchIcon sx={{ color: theme.palette.grey[500], mr: 1 }} />
            <InputBase
              placeholder="Search..."
              inputProps={{ 'aria-label': 'search' }}
              sx={{ color: theme.palette.grey[700] }}
            />
          </Box>
        </Box>

        {/* Right side icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={<SunIcon sx={{ color: theme.palette.warning.main }} />}
            label="12.4 kWh" 
            size="small"
            sx={{ 
              backgroundColor: theme.palette.warning.light,
              color: theme.palette.warning.dark,
              fontWeight: 500,
              display: { xs: 'none', md: 'flex' }
            }}
          />
          
          <IconButton color="inherit" size="small" sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <HelpIcon />
          </IconButton>
          
          <IconButton color="inherit" size="small">
            <Badge badgeContent={4} color="error" sx={{ '& .MuiBadge-badge': { top: 3, right: 3 } }}>
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
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            ml: { xs: 1, sm: 2 }, 
            backgroundColor: theme.palette.grey[100],
            padding: '4px 12px',
            borderRadius: '50px'
          }}>
            <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 1 }}>
              <Typography variant="body2" fontWeight={500} color="text.primary">
                {(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Administrator
              </Typography>
            </Box>

            <Tooltip title="Account settings">
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ p: 0, background: theme.palette.primary.main }}
              >
                <Avatar 
                  alt={(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') || 'User'} 
                  src={user?.avatar || (user as any)?.profilePicture || ''}
                  sx={{ width: 36, height: 36 }}
                >
                  {!user?.avatar && !(user as any)?.profilePicture && (((user?.firstName || user?.lastName || 'U')[0]) || 'U')}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            sx={{ mt: '40px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              elevation: 3,
              sx: {
                borderRadius: 2,
                minWidth: 180,
                overflow: 'visible',
                mt: 1.5,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
              <PersonIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
              <Typography>Profile</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
              <Typography>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
