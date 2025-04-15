import { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  Typography,
  Box,
  // Paper, // Removed unused import
  Button,
  Card,
  CardContent,
  IconButton,
  Divider,
  Avatar,
  useTheme,
  // LinearProgress, // Removed unused import
  CircularProgress,
  Alert,
  Menu, // Add Menu import
  MenuItem, // Add MenuItem import
} from '@mui/material';
import {
  TrendingUp,
  PeopleAlt,
  Description,
  Assignment,
  WbSunny,
  MoreVert,
  AttachMoney,
  Bolt,
  ArrowUpward,
  ArrowDownward,
  Speed,
  Refresh,
  PublishedWithChanges, // Added icon for conversion rate
  Groups as CustomerIcon, // Added for button
  Person as LeadIcon, // Added for button
  Assignment as ProjectIcon, // Added for button
} from '@mui/icons-material';
import { AuthContext } from '../features/auth/context/AuthContext';
import apiService from '../api/apiService';
import customerService from '../api/customerService';
import leadService from '../api/leadService';
import projectService from '../api/projectService';
import proposalService from '../api/proposalService';
import CurrencyDisplay from '../components/common/CurrencyDisplay';

// Dashboard data interfaces
interface DashboardStats {
  customers: {
    total: number;
    active: number;
    changePercent?: number;
  };
  proposals: {
    total: number;
    active: number;
    changePercent?: number;
  };
  projects: {
    total: number;
    active: number;
    changePercent?: number;
    avgCompletionDays?: number;
    avgValue?: number;
    avgSize?: number;
  };
  capacity: {
    total: number; // in kW
    changePercent?: number;
  };
}

interface ProjectStatus {
  status: string;
  count: number;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  date: string;
  status: string;
}

const statusColors = {
  Planning: '#42a5f5',
  Design: '#673ab7',
  Permitting: '#9c27b0',
  Installation: '#ff9800',
  Inspection: '#ab47bc',
  Complete: '#4caf50',
  Cancelled: '#f44336',
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    customers: { total: 0, active: 0 },
    proposals: { total: 0, active: 0 },
    projects: { total: 0, active: 0 },
    capacity: { total: 0 },
  });
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [leadConversionRate, setLeadConversionRate] = useState<number>(0);
  const [cardMenuAnchorEl, setCardMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedCardContext, setSelectedCardContext] = useState<string | null>(
    null
  ); // To know which card's menu is open

  // Define data fetching function using useCallback
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch dashboard summary data
      let dashboardData;
      try {
        dashboardData = await apiService.get('/api/reports/dashboard');
      } catch (e) {
        console.log('Dashboard API unavailable, fetching individual data');
      }

      // If dashboard API is not available, fetch data from individual endpoints
      if (!dashboardData) {
        // Create safe promises that handle errors and ensure we always get a valid response structure
        const customerPromise = customerService
          .getCustomers({ limit: 1000 })
          .then((response) => {
            console.log('Raw Customer API Response Data:', response?.data);
            // Ensure the response structure is always { data: { customers: [...] } }
            const customers = response?.data?.customers;
            if (Array.isArray(customers)) {
              return { data: { customers } };
            }
            return { data: { customers: [] } }; // Default empty structure
          })
          .catch((error) => {
            console.error('Error fetching customers:', error);
            return { data: { customers: [] } }; // Consistent error structure
          });

        const proposalPromise = proposalService
          .getProposals({ limit: 100 })
          .then((response) => {
            console.log('Raw Proposal API Response Data:', response?.data);
            // Ensure the response structure is always { data: { proposals: [...] } }
            const proposals = response?.data?.proposals;
            if (Array.isArray(proposals)) {
              return { data: { proposals } };
            }
            return { data: { proposals: [] } }; // Default empty structure
          })
          .catch((error) => {
            console.error('Error fetching proposals:', error);
            return { data: { proposals: [] } }; // Consistent error structure
          });

        const projectPromise = projectService
          .getProjects({ limit: 100 })
          .then((response) => {
            console.log('Raw Project API Response Data:', response?.data); // Add log
            // Ensure the response structure is always { data: { projects: [...] } }
            const projects = response?.data?.projects; // Assume nested 'projects'
            if (Array.isArray(projects)) {
              return { data: { projects } };
            }
            return { data: { projects: [] } }; // Default empty structure
          })
          .catch((error) => {
            console.error('Error fetching projects:', error);
            return { data: { projects: [] } }; // Consistent error structure
          });

        const leadPromise = leadService
          .getLeads({ limit: 100, sort: '-createdAt' })
          .then((response) => {
            // Correctly normalize the leads response structure
            if (
              !response ||
              !response.data ||
              !Array.isArray(response.data.leads)
            ) {
              // If response, data, or data.leads is missing/invalid, return empty leads array
              return { data: { leads: [] } };
            }
            // Otherwise, return the original response (it has the correct structure)
            return response;
          })
          .catch((error) => {
            console.error('Error fetching leads:', error);
            return { data: { leads: [] } }; // Consistent error structure
          });

        const [customers, proposals, projects, leads] = await Promise.all([
          customerPromise,
          proposalPromise,
          projectPromise,
          leadPromise,
        ]);

        // Prepare stats from individual API responses
        // Ensure we're working with arrays by converting if needed
        // Access the data reliably after normalization
        const customersData = customers.data.customers;
        const proposalsData = proposals.data.proposals;
        const projectsData = projects.data.projects; // Access nested projects
        const leadsData = leads.data.leads; // Access nested leads array

        console.log('Dashboard data types:', {
          customers: typeof customers.data,
          customersIsArray: Array.isArray(customers.data),
          proposals: typeof proposals.data,
          projects: typeof projects.data,
          leads: typeof leads.data,
        });

        // Calculate stats
        const activeCustomers = customersData.filter(
          (c: any) => c && c.status === 'Active'
        ).length;
        const activeProposals = proposalsData.filter(
          (p: any) => p && !p.accepted && !p.rejected
        ).length;
        const activeProjects = projectsData.filter(
          (p: any) => p && p.status !== 'Complete' && p.status !== 'Cancelled'
        ).length;

        // Calculate total capacity (if data available)
        let totalCapacity = 0;
        if (Array.isArray(projectsData)) {
          projectsData.forEach((project: any) => {
            if (project && project.systemSize) {
              const sizeValue = parseFloat(project.systemSize);
              if (!isNaN(sizeValue)) {
                totalCapacity += sizeValue;
              }
            }
          });
        }

        // Group projects by status
        const statusMap: Record<string, number> = {};
        if (Array.isArray(projectsData)) {
          projectsData.forEach((project: any) => {
            if (project) {
              const status = project.status || 'Unknown';
              statusMap[status] = (statusMap[status] || 0) + 1;
            }
          });
        }

        // Convert to project statuses array
        const statuses = Object.keys(statusMap).map((status) => ({
          status,
          count: statusMap[status],
          color: statusColors[status as keyof typeof statusColors] || '#9e9e9e',
        }));

        // Get recent leads
        let recent: Lead[] = [];
        if (Array.isArray(leadsData)) {
          recent = leadsData.slice(0, 3).map((lead: any) => {
            if (!lead) {
              return {
                id: '0',
                name: 'Unknown',
                email: 'No email',
                date: 'Unknown date',
                status: 'New',
              };
            }

            return {
              id: lead.id || lead._id || '0',
              name: lead.name || 'Unknown',
              email: lead.email || 'No email',
              date: lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : 'Unknown date',
              status: lead.status || 'New',
            };
          });
        }

        // Calculate conversion rate (if available)
        let conversionRate = 0;
        if (Array.isArray(leadsData) && leadsData.length > 0) {
          const convertedLeads = leadsData.filter(
            (lead: any) => lead && lead.converted
          ).length;
          conversionRate =
            leadsData.length > 0
              ? Math.round((convertedLeads / leadsData.length) * 100)
              : 0;
        }

        // Calculate average values from actual project data
        let avgCompletionDays = 0;
        let avgProjectValue = 0;
        let avgSystemSize = 0;

        if (Array.isArray(projectsData) && projectsData.length > 0) {
          // Calculate average system size
          const projectsWithSize = projectsData.filter(
            (project: any) =>
              project &&
              project.systemSize &&
              !isNaN(parseFloat(project.systemSize))
          );

          if (projectsWithSize.length > 0) {
            const totalSize = projectsWithSize.reduce(
              (sum: number, project: any) =>
                sum + parseFloat(project.systemSize),
              0
            );
            avgSystemSize =
              projectsWithSize.length > 0
                ? parseFloat((totalSize / projectsWithSize.length).toFixed(1))
                : 0;
          }

          // Calculate average project value
          const projectsWithValue = projectsData.filter(
            (project: any) =>
              project &&
              project.financials &&
              project.financials.totalContractValue &&
              !isNaN(parseFloat(project.financials.totalContractValue))
          );

          if (projectsWithValue.length > 0) {
            const totalValue = projectsWithValue.reduce(
              (sum: number, project: any) =>
                sum + parseFloat(project.financials.totalContractValue),
              0
            );
            avgProjectValue =
              projectsWithValue.length > 0
                ? Math.round(totalValue / projectsWithValue.length)
                : 0;
          }

          // Calculate average completion days for completed projects
          const completedProjects = projectsData.filter(
            (project: any) =>
              project &&
              project.status === 'completed' &&
              project.dates &&
              project.dates.projectClosed &&
              project.createdAt
          );

          if (completedProjects.length > 0) {
            const totalDays = completedProjects.reduce(
              (sum: number, project: any) => {
                const closedDate = new Date(project.dates.projectClosed);
                const createdDate = new Date(project.createdAt);
                const diffTime = Math.abs(
                  closedDate.getTime() - createdDate.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return sum + diffDays;
              },
              0
            );

            avgCompletionDays =
              completedProjects.length > 0
                ? Math.round(totalDays / completedProjects.length)
                : 0;
          }
        }

        // Update all state
        setStats({
          customers: {
            total: customersData.length,
            active: activeCustomers,
            changePercent: 0, // Not available without historical data
          },
          proposals: {
            total: proposalsData.length,
            active: activeProposals,
            changePercent: 0, // Not available without historical data
          },
          projects: {
            total: projectsData.length,
            active: activeProjects,
            changePercent: 0, // Not available without historical data
            avgCompletionDays,
            avgValue: avgProjectValue,
            avgSize: avgSystemSize,
          },
          capacity: {
            total: totalCapacity,
            changePercent: 0, // Not available without historical data
          },
        });

        setProjectStatuses(statuses);
        setRecentLeads(recent);
        setLeadConversionRate(conversionRate);
      } else {
        // Use the dashboard API response
        setStats(dashboardData.stats);
        setProjectStatuses(dashboardData.projectStatuses);
        setRecentLeads(dashboardData.recentLeads);
        setLeadConversionRate(dashboardData.leadConversionRate);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  }, []); // Empty dependency array means this function itself doesn't depend on props/state

  // Load dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Include fetchDashboardData in dependency array

  const handleRefresh = () => {
    fetchDashboardData(); // Call the data fetching function directly
  };

  // Card Menu Handlers
  const handleCardMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    cardContext: string
  ) => {
    setCardMenuAnchorEl(event.currentTarget);
    setSelectedCardContext(cardContext);
  };

  const handleCardMenuClose = () => {
    setCardMenuAnchorEl(null);
    setSelectedCardContext(null);
  };

  const handleViewDetails = () => {
    console.log(`View Details clicked for: ${selectedCardContext}`);
    handleCardMenuClose();
    // TODO: Implement navigation or modal logic based on selectedCardContext
  };

  const handleRefreshCard = () => {
    console.log(`Refresh Card clicked for: ${selectedCardContext}`);
    // Potentially re-fetch data specific to this card if applicable
    handleCardMenuClose();
  };

  const handleConfigureCard = () => {
    console.log(`Configure Card clicked for: ${selectedCardContext}`);
    handleCardMenuClose();
    // TODO: Implement configuration logic
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start', // Align items at the top
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name || 'User'}! Here's what's happening today.
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile, side-by-side on larger screens
          alignItems: { xs: 'stretch', sm: 'center' }, // Full width on mobile, centered on larger screens
          gap: 2,
        }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<Refresh />}
            sx={{
              borderRadius: 28, // Make it pill-shaped like in the screenshot
              px: 3,
              height: 40,
            }}
          >
            Refresh
          </Button>
          <Button
            component={Link}
            to="/reports"
            variant="contained"
            startIcon={<TrendingUp />}
            sx={{
              borderRadius: 2,
              px: 3,
              height: 40,
              boxShadow: '0 4px 14px 0 rgba(76, 175, 80, 0.39)',
            }}
          >
            Report
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Highlight Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background: `radial-gradient(circle at 100% 0%, ${theme.palette.primary.light}40 0%, transparent 70%)`,
                    borderRadius: '0 0 0 100%',
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.light,
                        color: theme.palette.success.dark,
                      }}
                    >
                      <PeopleAlt />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCardMenuOpen(e, 'activeCustomers')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.customers.active}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Active Customers
                  </Typography>
                  {stats.customers.changePercent !== undefined &&
                    stats.customers.changePercent !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {stats.customers.changePercent > 0 ? (
                          <>
                            <ArrowUpward
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: 16,
                                mr: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="success.main"
                              fontWeight="medium"
                            >
                              {stats.customers.changePercent}% increase
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ArrowDownward
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: 16,
                                mr: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="error.main"
                              fontWeight="medium"
                            >
                              {Math.abs(stats.customers.changePercent)}%
                              decrease
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background: `radial-gradient(circle at 100% 0%, ${theme.palette.warning.light}40 0%, transparent 70%)`,
                    borderRadius: '0 0 0 100%',
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.warning.light,
                        color: theme.palette.warning.dark,
                      }}
                    >
                      <Description />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCardMenuOpen(e, 'activeProposals')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.proposals.active}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Active Proposals
                  </Typography>
                  {stats.proposals.changePercent !== undefined &&
                    stats.proposals.changePercent !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {stats.proposals.changePercent > 0 ? (
                          <>
                            <ArrowUpward
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: 16,
                                mr: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="success.main"
                              fontWeight="medium"
                            >
                              {stats.proposals.changePercent}% increase
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ArrowDownward
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: 16,
                                mr: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="error.main"
                              fontWeight="medium"
                            >
                              {Math.abs(stats.proposals.changePercent)}%
                              decrease
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background:
                      'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    borderRadius: '0 0 0 100%',
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    >
                      <WbSunny />
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{ color: 'white' }}
                      onClick={(e) => handleCardMenuOpen(e, 'totalCapacity')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.capacity.total > 1000
                      ? `${(stats.capacity.total / 1000).toFixed(1)} MW`
                      : `${stats.capacity.total.toFixed(1)} kW`}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    Total Capacity
                  </Typography>
                  {stats.capacity.changePercent !== undefined &&
                    stats.capacity.changePercent !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {stats.capacity.changePercent > 0 ? (
                          <>
                            <ArrowUpward
                              sx={{ color: 'white', fontSize: 16, mr: 0.5 }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="medium"
                              sx={{ color: 'white' }}
                            >
                              {stats.capacity.changePercent}% increase
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ArrowDownward
                              sx={{ color: 'white', fontSize: 16, mr: 0.5 }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="medium"
                              sx={{ color: 'white' }}
                            >
                              {Math.abs(stats.capacity.changePercent)}% decrease
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Grid>

            {/* Total Customers Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.info.light,
                        color: theme.palette.info.dark,
                      }}
                    >
                      <PeopleAlt />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCardMenuOpen(e, 'totalCustomers')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.customers.total}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Total Customers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Proposals Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.secondary.light,
                        color: theme.palette.secondary.dark,
                      }}
                    >
                      <Description />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCardMenuOpen(e, 'totalProposals')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.proposals.total}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Total Proposals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Project Value Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.light,
                        color: theme.palette.success.dark,
                      }}
                    >
                      <AttachMoney />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => handleCardMenuOpen(e, 'avgProjectValue')}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    <CurrencyDisplay amount={stats.projects.avgValue || 0} />
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Avg. Project Value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Lead Conversion Rate Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.light,
                        color: theme.palette.primary.dark,
                      }}
                    >
                      <PublishedWithChanges />
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handleCardMenuOpen(e, 'leadConversionRate')
                      }
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {leadConversionRate}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Lead Conversion Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !error && projectStatuses.length > 0 && (
        <Grid container spacing={3}>
          {/* Project Status Chart */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Project Status
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCardMenuOpen(e, 'projectStatus')}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  {projectStatuses.map((item) => (
                    <Grid item xs={6} sm={3} key={item.status}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 70,
                            height: 70,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            mb: 1,
                            background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}40 100%)`,
                            border: `2px solid ${item.color}`,
                            boxShadow: `0 4px 10px 0 ${item.color}30`,
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ color: item.color }}
                          >
                            {item.count}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{item.status}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.grey[50],
                      border: `1px solid ${theme.palette.grey[200]}`,
                    }}
                  >
                    <Speed color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        AVG. COMPLETION TIME
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.projects.avgCompletionDays || '-'} Days
                      </Typography>
                    </Box>
                  </Box>

                  {/* Removed AVG. PROJECT VALUE from here - kept in dedicated card */}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.grey[50],
                      border: `1px solid ${theme.palette.grey[200]}`,
                    }}
                  >
                    <Bolt color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        AVG. SYSTEM SIZE
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.projects.avgSize || '-'} kW
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Leads */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Recent Leads
                  </Typography>
                  <Button
                    component={Link}
                    to="/leads"
                    size="small"
                    endIcon={
                      <ArrowUpward sx={{ transform: 'rotate(45deg)' }} />
                    }
                  >
                    View All
                  </Button>
                </Box>

                {recentLeads.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {recentLeads.map((lead, index) => (
                      <Box key={lead.id}>
                        <Box sx={{ display: 'flex', py: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.light,
                              color: theme.palette.primary.dark,
                              width: 40,
                              height: 40,
                            }}
                          >
                            {lead.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ ml: 2, flex: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                {lead.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lead.date}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {lead.email}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor:
                                    lead.status === 'New'
                                      ? theme.palette.info.light
                                      : theme.palette.warning.light,
                                  color:
                                    lead.status === 'New'
                                      ? theme.palette.info.dark
                                      : theme.palette.warning.dark,
                                  px: 1,
                                  py: 0.2,
                                  borderRadius: 1,
                                  fontSize: 10,
                                  fontWeight: 500,
                                  display: 'inline-block',
                                }}
                              >
                                {lead.status}
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {lead.id.substring(0, 6)}...
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {index < recentLeads.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No recent leads.
                    </Typography>
                  </Box>
                )}
                {/* Removed Lead Conversion Rate display from here - kept in dedicated card */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {!loading && !error && projectStatuses.length === 0 && (
        <Box
          sx={{
            mt: 4,
            p: 3,
            textAlign: 'center',
            bgcolor: theme.palette.grey[50],
            borderRadius: 2,
            border: `1px dashed ${theme.palette.grey[300]}`,
          }}
        >
          <Assignment
            sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Project Data Yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start by creating customers, leads, or projects to see statistics
            here.
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
            alignItems: { xs: 'stretch', sm: 'center' } // Stretch buttons on mobile
          }}>
            <Button
              component={Link}
              to="/customers/new"
              variant="contained"
              startIcon={<CustomerIcon />}
            >
              Add Customer
            </Button>
            <Button
              component={Link}
              to="/leads/new"
              variant="outlined"
              startIcon={<LeadIcon />}
            >
              Add Lead
            </Button>
            <Button
              component={Link}
              to="/projects/new"
              variant="outlined"
              startIcon={<ProjectIcon />}
            >
              Add Project
            </Button>
          </Box>
        </Box>
      )}
      {/* Card Action Menu */}
      <Menu
        anchorEl={cardMenuAnchorEl}
        open={Boolean(cardMenuAnchorEl)}
        onClose={handleCardMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
        <MenuItem onClick={handleRefreshCard}>Refresh Card</MenuItem>
        <MenuItem onClick={handleConfigureCard}>Configure</MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;
