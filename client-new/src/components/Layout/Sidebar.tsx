import { useContext, Fragment, useState } from 'react'; // Import Fragment and useState
import logoSvg from '../../logo.svg'; // Import the correct logo from src
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  // Tooltip, // Already imported below for menu trigger
  Paper,
  Menu, // Add Menu import
  MenuItem, // Add MenuItem import
  Tooltip, // Add Tooltip import
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as LeadIcon,
  Groups as CustomerIcon,
  InsertDriveFile as ProposalIcon,
  Assignment as ProjectIcon,
  ElectricBolt as EquipmentIcon,
  Description as DocumentIcon,
  BarChart as ReportIcon,
  // AccountCircle as ProfileIcon, // Use PersonIcon for consistency
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  // Construction as ConstructionIcon, // Unused
  Build as ServiceIcon,
  ExitToApp as LogoutIcon, // Add LogoutIcon import
  Person as PersonIcon, // Add PersonIcon import (used for menu items)
} from '@mui/icons-material';
import { AuthContext } from '../../features/auth/context/AuthContext';
import { useProjectContext } from '../../context/ProjectContext'; // Import project context hook

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Leads', icon: <LeadIcon />, path: '/leads' },
  { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
  { text: 'Proposals', icon: <ProposalIcon />, path: '/proposals' },
  { text: 'Projects', icon: <ProjectIcon />, path: '/projects' },
  { text: 'Equipment', icon: <EquipmentIcon />, path: '/equipment' },
  { text: 'Service Requests', icon: <ServiceIcon />, path: '/services' },
  { text: 'Documents', icon: <DocumentIcon />, path: '/documents' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }: SidebarProps) => {
  const { user, logout } = useContext(AuthContext); // Add logout
  const location = useLocation();
  const navigate = useNavigate(); // Add navigate hook
  const { totalProjects, loadingCount } = useProjectContext(); // Get project count from context
  const [anchorElUser, setAnchorElUser] = useState<HTMLElement | null>(null); // State for menu anchor
  const theme = useTheme();

  // --- User Menu Handlers ---
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout(); // Call logout from context
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };
  // --- End User Menu Handlers ---

  const drawer = (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 3,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Replace Icon and Text with Image */}
            <img
              src={logoSvg}
              alt="Tenaga Solar ERP Logo"
              style={{ height: '32px', marginRight: '8px' }}
            />
          </Box>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              display: { sm: 'none' },
              color: 'white',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1, py: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive
                      ? theme.palette.primary.light
                      : 'transparent',
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isActive
                        ? theme.palette.primary.light
                        : theme.palette.grey[100],
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      minWidth: 40,
                    },
                    transition: 'all 0.2s',
                    py: 1,
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {item.text === 'Projects' &&
                    !loadingCount &&
                    totalProjects > 0 && (
                      <Box
                        sx={{
                          backgroundColor: theme.palette.success.main,
                          color: 'white',
                          minWidth: 20, // Use minWidth for flexibility
                          height: 20,
                          borderRadius: 10,
                          display: 'inline-flex', // Use inline-flex
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                          padding: '0 6px', // Add padding for numbers > 9
                          ml: 1, // Add some margin
                        }}
                      >
                        {totalProjects} {/* Display dynamic count */}
                      </Box>
                    )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <List sx={{ px: 2 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to="/profile"
              selected={location.pathname === '/profile'}
              sx={{
                borderRadius: 2,
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                },
                py: 1,
              }}
            >
              <ListItemIcon>
                <PersonIcon /> {/* Changed to PersonIcon */}
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/settings"
              selected={location.pathname === '/settings'}
              sx={{
                borderRadius: 2,
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                },
                py: 1,
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* --- User Info Block (Menu Trigger) --- */}
      <Box sx={{ p: 2 }}>
        <Tooltip title="Account settings" placement="top">
          <Paper
            elevation={0}
            onClick={handleOpenUserMenu} // Add onClick handler
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.grey[50],
              border: `1px solid ${theme.palette.grey[200]}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer', // Add pointer cursor
              '&:hover': {
                bgcolor: theme.palette.grey[100],
              },
            }}
          >
            <Avatar
              alt={user?.name || 'User'}
              src={user?.avatar}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              {!user?.avatar && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Administrator
              </Typography>
            </Box>
          </Paper>
        </Tooltip>
        {/* --- End User Info Block --- */}

        {/* --- User Menu --- */}
        <Menu
          sx={{ mb: '40px' }} // Adjust margin if needed based on sidebar position
          id="menu-sidebar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top', // Anchor to the top of the trigger element
            horizontal: 'center',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'bottom', // Open upwards from the trigger
            horizontal: 'center',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: 2,
              minWidth: 180,
              overflow: 'visible',
              mb: 1, // Margin below the menu
              // Arrow pointing down (adjust if needed)
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
            <PersonIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.text.secondary }}
            />
            <Typography>Profile</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
            <LogoutIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.text.secondary }}
            />
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
        {/* --- End User Menu --- */}
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'white',
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.05)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'white',
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.05)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
