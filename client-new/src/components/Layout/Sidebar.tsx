import { useContext } from 'react';
import logoSvg from '../../logo.svg'; // Import the correct logo from src
import { Link, useLocation } from 'react-router-dom';
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
  Tooltip,
  Paper,
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
  AccountCircle as ProfileIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Construction as ConstructionIcon,
  Build as ServiceIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../features/auth/context/AuthContext';

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
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const theme = useTheme();

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

        <Paper
          elevation={0}
          sx={{
            p: 2,
            width: '100%',
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            mt: 1,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.secondary.main,
              borderRadius: '50%',
              p: 1,
              mr: 1.5,
            }}
          >
            <ConstructionIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="caption" fontSize={10} sx={{ opacity: 0.8 }}>
              ACTIVE PROJECTS
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              12
            </Typography>
          </Box>
        </Paper>
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
                  {item.text === 'Projects' && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.success.main,
                        color: 'white',
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      3
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
                <ProfileIcon />
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

      <Box sx={{ p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.grey[50],
            border: `1px solid ${theme.palette.grey[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            alt={user?.name || 'User'}
            src={user?.avatar}
            sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}
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
