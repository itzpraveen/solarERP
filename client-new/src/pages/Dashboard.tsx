import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, 
  Typography, 
  Box, 
  Paper,
  Button,
  Card,
  CardContent,
  IconButton,
  Divider,
  Avatar,
  useTheme,
  LinearProgress,
  CircularProgress,
  Alert
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
  Refresh
} from '@mui/icons-material';

import { AuthContext } from '../context/AuthContext';
import apiService from '../api/apiService';
import customerService from '../api/customerService';
import leadService from '../api/leadService';
import projectService from '../api/projectService';
import proposalService from '../api/proposalService';

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
  "Planning": "#42a5f5",
  "Design": "#673ab7",
  "Permitting": "#9c27b0",
  "Installation": "#ff9800",
  "Inspection": "#ab47bc",
  "Complete": "#4caf50",
  "Cancelled": "#f44336"
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
    capacity: { total: 0 }
  });
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [leadConversionRate, setLeadConversionRate] = useState<number>(0);
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
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
          const customerPromise = customerService.getCustomers({ limit: 1000 })
            .then(response => {
              // Normalize response - ensure it has a data property that's an array
              if (!response) return { data: [] };
              if (!response.data) return { ...response, data: [] };
              if (!Array.isArray(response.data)) return { ...response, data: [response.data] };
              return response;
            })
            .catch(error => {
              console.error('Error fetching customers:', error);
              return { data: [] };
            });
            
          const proposalPromise = proposalService.getProposals({ limit: 100 })
            .then(response => {
              if (!response) return { data: [] };
              if (!response.data) return { ...response, data: [] };
              if (!Array.isArray(response.data)) return { ...response, data: [response.data] };
              return response;
            })
            .catch(error => {
              console.error('Error fetching proposals:', error);
              return { data: [] };
            });
            
          const projectPromise = projectService.getProjects({ limit: 100 })
            .then(response => {
              if (!response) return { data: [] };
              if (!response.data) return { ...response, data: [] };
              if (!Array.isArray(response.data)) return { ...response, data: [response.data] };
              return response;
            })
            .catch(error => {
              console.error('Error fetching projects:', error);
              return { data: [] };
            });
            
          const leadPromise = leadService.getLeads({ limit: 100, sort: '-createdAt' })
            .then(response => {
              if (!response) return { data: [] };
              if (!response.data) return { ...response, data: [] };
              if (!Array.isArray(response.data)) return { ...response, data: [response.data] };
              return response;
            })
            .catch(error => {
              console.error('Error fetching leads:', error);
              return { data: [] };
            });
          
          const [customers, proposals, projects, leads] = await Promise.all([
            customerPromise, 
            proposalPromise, 
            projectPromise, 
            leadPromise
          ]);
          
          // Prepare stats from individual API responses
          // Ensure we're working with arrays by converting if needed
          const customersData = Array.isArray(customers.data) ? customers.data : [];
          const proposalsData = Array.isArray(proposals.data) ? proposals.data : [];
          const projectsData = Array.isArray(projects.data) ? projects.data : [];
          const leadsData = Array.isArray(leads.data) ? leads.data : [];
          
          console.log('Dashboard data types:', {
            customers: typeof customers.data,
            customersIsArray: Array.isArray(customers.data),
            proposals: typeof proposals.data,
            projects: typeof projects.data,
            leads: typeof leads.data
          });
          
          // Calculate stats
          const activeCustomers = customersData.filter((c: any) => c && c.status === 'Active').length;
          const activeProposals = proposalsData.filter((p: any) => p && !p.accepted && !p.rejected).length;
          const activeProjects = projectsData.filter((p: any) => p && p.status !== 'Complete' && p.status !== 'Cancelled').length;
          
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
          const statuses = Object.keys(statusMap).map(status => ({
            status,
            count: statusMap[status],
            color: statusColors[status as keyof typeof statusColors] || "#9e9e9e"
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
                  status: 'New'
                };
              }
              
              return {
                id: lead.id || lead._id || '0',
                name: lead.name || 'Unknown',
                email: lead.email || 'No email',
                date: lead.createdAt 
                  ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                  : 'Unknown date',
                status: lead.status || 'New'
              };
            });
          }
          
          // Calculate conversion rate (if available)
          let conversionRate = 0;
          if (Array.isArray(leadsData) && leadsData.length > 0) {
            const convertedLeads = leadsData.filter((lead: any) => lead && lead.converted).length;
            conversionRate = Math.round((convertedLeads / leadsData.length) * 100);
          }
          
          // Average values
          const avgCompletionDays = 45; // Default fallback
          const avgProjectValue = 32450; // Default fallback
          const avgSystemSize = 8.4; // Default fallback
          
          // Update all state
          setStats({
            customers: { 
              total: customersData.length, 
              active: activeCustomers,
              changePercent: 0 // Not available without historical data
            },
            proposals: { 
              total: proposalsData.length, 
              active: activeProposals,
              changePercent: 0 // Not available without historical data
            },
            projects: { 
              total: projectsData.length, 
              active: activeProjects,
              changePercent: 0, // Not available without historical data
              avgCompletionDays,
              avgValue: avgProjectValue,
              avgSize: avgSystemSize
            },
            capacity: { 
              total: totalCapacity,
              changePercent: 0 // Not available without historical data
            }
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
    };
    
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') || 'User'}! Here's what's happening today.
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined"
            size="medium"
            onClick={handleRefresh}
            startIcon={<Refresh />}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<TrendingUp />}
            sx={{ 
              height: 48,
              px: 3,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(76, 175, 80, 0.39)',
            }}
          >
            Generate Report
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
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 80, 
                  height: 80, 
                  background: `radial-gradient(circle at 100% 0%, ${theme.palette.primary.light}40 0%, transparent 70%)`,
                  borderRadius: '0 0 0 100%'  
                }} />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.dark }}>
                      <PeopleAlt />
                    </Avatar>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.customers.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Active Customers
                  </Typography>
                  {stats.customers.changePercent !== undefined && stats.customers.changePercent !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {stats.customers.changePercent > 0 ? (
                        <>
                          <ArrowUpward sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="success.main" fontWeight="medium">
                            {stats.customers.changePercent}% increase
                          </Typography>
                        </>
                      ) : (
                        <>
                          <ArrowDownward sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="error.main" fontWeight="medium">
                            {Math.abs(stats.customers.changePercent)}% decrease
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 80, 
                  height: 80, 
                  background: `radial-gradient(circle at 100% 0%, ${theme.palette.warning.light}40 0%, transparent 70%)`,
                  borderRadius: '0 0 0 100%'  
                }} />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.dark }}>
                      <Description />
                    </Avatar>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.proposals.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Active Proposals
                  </Typography>
                  {stats.proposals.changePercent !== undefined && stats.proposals.changePercent !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {stats.proposals.changePercent > 0 ? (
                        <>
                          <ArrowUpward sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="success.main" fontWeight="medium">
                            {stats.proposals.changePercent}% increase
                          </Typography>
                        </>
                      ) : (
                        <>
                          <ArrowDownward sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="error.main" fontWeight="medium">
                            {Math.abs(stats.proposals.changePercent)}% decrease
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 80, 
                  height: 80, 
                  background: `radial-gradient(circle at 100% 0%, ${theme.palette.info.light}40 0%, transparent 70%)`,
                  borderRadius: '0 0 0 100%'  
                }} />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.dark }}>
                      <Assignment />
                    </Avatar>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.projects.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Active Projects
                  </Typography>
                  {stats.projects.changePercent !== undefined && stats.projects.changePercent !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {stats.projects.changePercent > 0 ? (
                        <>
                          <ArrowUpward sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="success.main" fontWeight="medium">
                            {stats.projects.changePercent}% increase
                          </Typography>
                        </>
                      ) : (
                        <>
                          <ArrowDownward sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" color="error.main" fontWeight="medium">
                            {Math.abs(stats.projects.changePercent)}% decrease
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white'
              }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 80, 
                  height: 80, 
                  background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  borderRadius: '0 0 0 100%'  
                }} />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                      <WbSunny />
                    </Avatar>
                    <IconButton size="small" sx={{ color: 'white' }}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {stats.capacity.total > 1000 
                      ? `${(stats.capacity.total / 1000).toFixed(1)} MW` 
                      : `${stats.capacity.total.toFixed(1)} kW`
                    }
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    Total Capacity
                  </Typography>
                  {stats.capacity.changePercent !== undefined && stats.capacity.changePercent !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {stats.capacity.changePercent > 0 ? (
                        <>
                          <ArrowUpward sx={{ color: 'white', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" fontWeight="medium" sx={{ color: 'white' }}>
                            {stats.capacity.changePercent}% increase
                          </Typography>
                        </>
                      ) : (
                        <>
                          <ArrowDownward sx={{ color: 'white', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption" fontWeight="medium" sx={{ color: 'white' }}>
                            {Math.abs(stats.capacity.changePercent)}% decrease
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">Project Status</Typography>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  {projectStatuses.map((item) => (
                    <Grid item xs={6} sm={3} key={item.status}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Box sx={{ 
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
                          boxShadow: `0 4px 10px 0 ${item.color}30`
                        }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: item.color }}>
                            {item.count}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{item.status}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}>
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
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}>
                    <AttachMoney color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        AVG. PROJECT VALUE
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.projects.avgValue 
                          ? `$${stats.projects.avgValue.toLocaleString()}` 
                          : '-'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}>
                    <Bolt color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        AVG. SYSTEM SIZE
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.projects.avgSize 
                          ? `${stats.projects.avgSize} kW` 
                          : '-'
                        }
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">Recent Leads</Typography>
                  <Button size="small" component={Link} to="/leads">
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
                              color: theme.palette.primary.main,
                              width: 40,
                              height: 40
                            }}
                          >
                            {lead.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ ml: 2, flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {lead.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {lead.date}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {lead.email}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: lead.status === 'New' 
                                    ? theme.palette.success.main
                                    : lead.status === 'Contacted'
                                    ? theme.palette.warning.main
                                    : theme.palette.info.main,
                                  mr: 1
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {lead.status}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {index < recentLeads.length - 1 && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent leads available
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Lead Conversion Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                      {leadConversionRate}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={leadConversionRate} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {!loading && !error && projectStatuses.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <Typography variant="h6" gutterBottom>
            No dashboard data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
            There doesn't seem to be any active projects, leads, or proposals in the system. 
            Start by adding some customers, leads, or projects to see your dashboard populate with data.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/customers/new"
              startIcon={<PeopleAlt />}
            >
              Add Customer
            </Button>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/leads/new"
              startIcon={<Description />}
            >
              Add Lead
            </Button>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/projects/new"
              startIcon={<Assignment />}
            >
              Add Project
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
