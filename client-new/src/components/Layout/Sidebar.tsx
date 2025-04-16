import { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Paper,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  alpha,
  Badge,
  useMediaQuery,
  Zoom,
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
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Build as ServiceIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import logoSvg from '../../logo.svg';
import { AuthContext } from '../../features/auth/context/AuthContext';
import { useProjectContext } from '../../context/ProjectContext';

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Leads', icon: <LeadIcon />, path: '/leads' },
  { text: 'Proposals', icon: <ProposalIcon />, path: '/proposals' }, // Moved Proposals up
  { text: 'Customers', icon: <CustomerIcon />, path: '/customers' }, // Moved Customers down
  { text: 'Projects', icon: <ProjectIcon />, path: '/projects' },
  { text: 'Equipment', icon: <EquipmentIcon />, path: '/equipment' },
  { text: 'Service Requests', icon: <ServiceIcon />, path: '/services' },
  { text: 'Documents', icon: <DocumentIcon />, path: '/documents' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }: SidebarProps) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalProjects, loadingCount } = useProjectContext();
  const [anchorElUser, setAnchorElUser] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Group menu items by category
  const mainMenuItems = menuItems.slice(0, 5); // Dashboard, Leads, Customers, Proposals, Projects
  const resourceMenuItems = menuItems.slice(5); // Equipment, Service Requests, Documents, Reports

  // State for collapsible sections
  const [resourcesOpen, setResourcesOpen] = useState(true);

  // Check if any resource item is active to auto-expand the section
  useEffect(() => {
    const isAnyResourceActive = resourceMenuItems.some((item) =>
      location.pathname.startsWith(item.path)
    );

    if (isAnyResourceActive && !resourcesOpen) {
      setResourcesOpen(true);
    }
  }, [location.pathname, resourceMenuItems, resourcesOpen]);

  const toggleResources = () => {
    setResourcesOpen(!resourcesOpen);
  };

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
          padding: 2, // Reduced padding
          background: theme.palette.background.paper, // Changed background to white
          color: theme.palette.text.primary, // Changed default text color for contrast
          position: 'relative',
          // overflow: 'hidden', // Removed overflow to prevent clipping
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            mb: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logoSvg}
              alt="Tenaga Solar ERP Logo"
              style={{
                height: '36px',
                marginRight: '10px',
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.5px',
                display: { xs: 'none', sm: 'block' },
                // textShadow: '0px 2px 4px rgba(0,0,0,0.2)', // Remove text shadow if background is light
                color: theme.palette.primary.main, // Use primary color for text
              }}
            >
              Solar ERP
            </Typography>
          </Box>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              display: { sm: 'none' },
              color: theme.palette.primary.main, // Changed icon color for contrast
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1, py: 2 }}>
        {/* Main menu items */}
        <List sx={{ px: 2 }}>
          {mainMenuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isActive
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.primary.main, 0.05),
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      minWidth: 40,
                    },
                    transition: 'all 0.2s ease-in-out',
                    py: 1.2,
                    boxShadow: isActive
                      ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                      : 'none',
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem',
                    }}
                  />
                  {item.text === 'Projects' &&
                    !loadingCount &&
                    totalProjects > 0 && (
                      <Badge
                        badgeContent={totalProjects}
                        color="success"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: '20px',
                            height: '20px',
                          },
                        }}
                      />
                    )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Resources section with collapsible header */}
        <List sx={{ px: 2 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={toggleResources}
              sx={{
                borderRadius: 2,
                py: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemText
                primary="Resources"
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
              {resourcesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={resourcesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {resourceMenuItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <ListItem
                    key={item.text}
                    disablePadding
                    sx={{ mb: 0.75, pl: 1 }}
                  >
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      selected={isActive}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: isActive
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                        color: isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.primary.main, 0.05),
                        },
                        '& .MuiListItemIcon-root': {
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                          minWidth: 36,
                        },
                        transition: 'all 0.2s ease-in-out',
                        py: 1,
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.95rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Settings and Profile */}
        <List sx={{ px: 2 }}>
          <ListItem disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              component={Link}
              to="/profile"
              selected={location.pathname === '/profile'}
              sx={{
                borderRadius: 2,
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color:
                    location.pathname === '/profile'
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                },
                py: 1.2,
                backgroundColor:
                  location.pathname === '/profile'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                '&:hover': {
                  backgroundColor:
                    location.pathname === '/profile'
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="Profile"
                primaryTypographyProps={{
                  fontWeight: location.pathname === '/profile' ? 600 : 500,
                  fontSize: '0.95rem',
                }}
              />
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
                  color:
                    location.pathname === '/settings'
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                },
                py: 1.2,
                backgroundColor:
                  location.pathname === '/settings'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                '&:hover': {
                  backgroundColor:
                    location.pathname === '/settings'
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  fontWeight: location.pathname === '/settings' ? 600 : 500,
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* User profile section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Tooltip
          title="Account settings"
          placement="top"
          TransitionComponent={Zoom}
          arrow
        >
          <Paper
            elevation={0}
            onClick={handleOpenUserMenu}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius * 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
              },
            }}
          >
            <Avatar
              alt={user?.name || 'User'}
              src={user?.avatar}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 42,
                height: 42,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              {!user?.avatar && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  display: 'block',
                  marginTop: '-2px',
                }}
              >
                Administrator
              </Typography>
            </Box>
          </Paper>
        </Tooltip>

        {/* User menu */}
        <Menu
          sx={{ mt: '16px' }}
          id="menu-sidebar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: theme.shape.borderRadius * 1.5,
              minWidth: 200,
              overflow: 'visible',
              mt: 1.5,
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                transform: 'translateX(-50%) translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          TransitionComponent={Zoom}
          transitionDuration={200}
        >
          <MenuItem
            onClick={handleProfile}
            sx={{
              py: 1.5,
              borderRadius: theme.shape.borderRadius,
              mx: 0.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <PersonIcon
              fontSize="small"
              sx={{ mr: 1.5, color: theme.palette.primary.main }}
            />
            <Typography fontWeight={500}>Profile</Typography>
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.5,
              borderRadius: theme.shape.borderRadius,
              mx: 0.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            <LogoutIcon
              fontSize="small"
              sx={{ mr: 1.5, color: theme.palette.error.main }}
            />
            <Typography fontWeight={500} color="error.main">
              Logout
            </Typography>
          </MenuItem>
        </Menu>
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
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.1)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
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
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.1)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
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
