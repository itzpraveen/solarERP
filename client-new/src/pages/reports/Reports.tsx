import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox, // Import Checkbox
} from '@mui/material';
// import CurrencyDisplay from '../../components/common/CurrencyDisplay'; // Unused
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  // TableChart as TableIcon, // Unused
  // Schedule as ScheduleIcon, // Unused
  // FileDownload as ExportIcon, // Unused
  // Dashboard as DashboardIcon, // Unused
  AttachMoney as FinancialIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  // FilterList as FilterIcon, // Unused
  // Search as SearchIcon, // Unused
  // DateRange as DateRangeIcon, // Unused
  Edit as EditIcon,
  Visibility as ViewIcon, // Import ViewIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrencySync } from '../../utils/formatters';

// Import necessary services and types
import reportService, { Report } from '../../api/reportService';
import leadService, { Lead } from '../../api/leadService'; // Import Lead type
import projectService, { Project } from '../../api/projectService'; // Import Project type
import proposalService from '../../api/proposalService';
// import userService from '../../api/userService'; // Assuming exists for sales reps

// Define colors for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

// Mock data for demo
const mockReports = [
  {
    _id: '1',
    title: 'Monthly Sales Summary',
    type: 'financial',
    description: 'Monthly overview of sales performance and revenue',
    createdBy: 'Admin User',
    createdAt: '2025-02-10T10:30:00Z',
    status: 'active',
    lastRun: '2025-03-01T15:30:00Z',
  },
  {
    _id: '2',
    title: 'Project Status Distribution',
    type: 'project',
    description: 'Analysis of current projects by status and stage',
    createdBy: 'Admin User',
    createdAt: '2025-02-15T14:20:00Z',
    status: 'active',
    lastRun: '2025-03-05T09:15:00Z',
  },
  {
    _id: '3',
    title: 'Quarterly Financial Performance',
    type: 'financial',
    description: 'Quarterly financial analysis with profit and loss statements',
    createdBy: 'Finance Manager',
    createdAt: '2025-01-05T11:45:00Z',
    status: 'scheduled',
    scheduledFrequency: 'quarterly',
    lastRun: '2025-03-01T08:00:00Z',
  },
];

// Define structure for dashboard data state
interface DashboardData {
  leadsBySource: { source: string; count: number }[];
  projectsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; value: number }[];
  topSalesReps: { name: string; revenue: number }[];
}

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState<any[]>(mockReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize dashboard data state with empty arrays
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    leadsBySource: [],
    projectsByStatus: [],
    revenueByMonth: [],
    topSalesReps: [],
  });
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would normally call the API, but we're using mock data for now
      // const response = await reportService.getAll();
      // setReports(response.data);

      // Simulate API delay
      setTimeout(() => {
        setReports(mockReports);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch reports');
      setLoading(false);
    }
  };

  // Fetch and process dashboard reports data
  const fetchDashboardReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Leads for "Leads by Source"
      const leadsResponse = await leadService.getLeads({ limit: 1000 });
      const leads: Lead[] = leadsResponse.data.leads || []; // Add Lead type
      const leadsBySource = leads.reduce(
        (acc: Record<string, number>, lead: Lead) => {
          const source = lead.source || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const leadsBySourceData = Object.entries(leadsBySource)
        .map(([source, count]) => ({ source, count: count as number })) // Assert count is number
        .sort((a, b) => b.count - a.count);

      // Fetch Projects for "Projects by Status"
      const projectsResponse = await projectService.getProjects({
        limit: 1000,
      });
      const projects: Project[] = projectsResponse.data.projects || []; // Add Project type
      const projectsByStatus = projects.reduce(
        (acc: Record<string, number>, project: Project) => {
          const status = project.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const projectsByStatusData = Object.entries(projectsByStatus).map(
        ([status, count]) => ({ status, count: count as number })
      );
      // Keep original order or define a specific sort order if needed

      // --- Placeholder Data for Complex Reports ---
      // TODO: Implement actual data fetching/aggregation for Revenue Trend & Top Sales Reps
      // This likely requires dedicated backend endpoints or more complex frontend logic.
      const revenueByMonthData = [
        { month: 'Jan', value: 0 },
        { month: 'Feb', value: 0 },
        { month: 'Mar', value: 0 },
        { month: 'Apr', value: 0 },
        { month: 'May', value: 0 },
        { month: 'Jun', value: 0 },
      ];
      const topSalesRepsData = [
        { name: 'Rep 1', revenue: 0 },
        { name: 'Rep 2', revenue: 0 },
      ];
      // --- End Placeholder Data ---

      setDashboardData({
        leadsBySource: leadsBySourceData,
        projectsByStatus: projectsByStatusData,
        revenueByMonth: revenueByMonthData, // Use placeholder for now
        topSalesReps: topSalesRepsData, // Use placeholder for now
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err?.message || 'Failed to fetch dashboard reports');
      // Clear data on error?
      setDashboardData({
        leadsBySource: [],
        projectsByStatus: [],
        revenueByMonth: [],
        topSalesReps: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReports();
    fetchDashboardReports();
  }, []);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle report type filter change
  const handleTypeChange = (event: any) => {
    setReportType(event.target.value);
  };

  // Handle date range change
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  // Format number as currency
  const formatCurrency = (value: number) => {
    return formatCurrencySync(value);
    // return formatCurrencySync(value); // Duplicate line removed
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dashboard" />
          <Tab label="My Reports" />
          <Tab label="Create Report" />
          <Tab label="Scheduled Reports" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">
                      Revenue Trend (Last 6 Months)
                    </Typography>
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Box>

                  {/* Revenue Trend Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                        <Typography variant="h6">
                          Project Status Distribution
                        </Typography>
                        <IconButton size="small">
                          <PieChartIcon />
                        </IconButton>
                      </Box>

                      {/* Project Status Chart */}
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={dashboardData.projectsByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="status"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {dashboardData.projectsByStatus.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>

                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        {dashboardData.projectsByStatus.map((item) => (
                          <Chip
                            key={item.status}
                            label={`${item.status.replace('_', ' ').toUpperCase()}: ${item.count}`}
                            color={
                              item.status === 'active'
                                ? 'primary'
                                : item.status === 'completed'
                                  ? 'success'
                                  : item.status === 'on_hold'
                                    ? 'warning'
                                    : 'error'
                            }
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
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
                        <Typography variant="h6">Leads by Source</Typography>
                        <IconButton size="small">
                          <BarChartIcon />
                        </IconButton>
                      </Box>

                      {/* Leads by Source Chart */}
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={dashboardData.leadsBySource}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="source" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#82ca9d" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>

                      <Box sx={{ mt: 1 }}>
                        {dashboardData.leadsBySource.map((item) => (
                          <Box
                            key={item.source}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2">
                              {item.source}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {item.count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Sales Representatives
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <List disablePadding>
                    {dashboardData.topSalesReps.map((rep, index) => (
                      <ListItem
                        key={rep.name}
                        sx={{ px: 0, py: 1 }}
                        divider={index < dashboardData.topSalesReps.length - 1}
                      >
                        <ListItemText
                          primary={rep.name}
                          secondary={`Revenue: ${formatCurrency(rep.revenue)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Reports
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <List>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        sx={{
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      >
                        <ListItemIcon>
                          <FinancialIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Monthly Financial Summary" />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        sx={{
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      >
                        <ListItemIcon>
                          <BarChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Sales Pipeline Report" />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        sx={{
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      >
                        <ListItemIcon>
                          <PieChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Project Performance" />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemButton
                        sx={{
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      >
                        <ListItemIcon>
                          <LineChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Year-to-Date Analysis" />
                      </ListItemButton>
                    </ListItem>
                  </List>

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ mt: 3 }}
                  >
                    Create Custom Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* My Reports Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={reportType}
                label="Filter by Type"
                onChange={handleTypeChange}
                size="small"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Search Reports" variant="outlined" size="small" />
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : reports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Reports Found
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                You haven't created or saved any reports yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setTabValue(2)}
              >
                Create Your First Report
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Last Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {report.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{report.type}</TableCell>
                      <TableCell>{report.createdBy}</TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>
                        {report.lastRun ? formatDate(report.lastRun) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={
                            report.status === 'active'
                              ? 'success'
                              : report.status === 'scheduled'
                                ? 'info'
                                : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<ViewIcon />}>
                            View
                          </Button>
                          <Button size="small" startIcon={<DownloadIcon />}>
                            Download
                          </Button>
                          {/* Add Edit/Delete later */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Create Report Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Create New Report
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography variant="h6" gutterBottom>
                  Report Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Report Title" required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Report Type</InputLabel>
                      <Select label="Report Type" defaultValue="financial">
                        <MenuItem value="financial">Financial</MenuItem>
                        <MenuItem value="project">Project</MenuItem>
                        <MenuItem value="lead">Lead</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Visualization Type</InputLabel>
                      <Select label="Visualization Type" defaultValue="bar">
                        <MenuItem value="bar">Bar Chart</MenuItem>
                        <MenuItem value="line">Line Chart</MenuItem>
                        <MenuItem value="pie">Pie Chart</MenuItem>
                        <MenuItem value="table">Table</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Filters (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        label="Start Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Data Source</InputLabel>
                        <Select label="Data Source" defaultValue="projects">
                          <MenuItem value="projects">Projects</MenuItem>
                          <MenuItem value="leads">Leads</MenuItem>
                          <MenuItem value="proposals">Proposals</MenuItem>
                          <MenuItem value="customers">Customers</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Group By</InputLabel>
                        <Select label="Group By" defaultValue="month">
                          <MenuItem value="month">Month</MenuItem>
                          <MenuItem value="quarter">Quarter</MenuItem>
                          <MenuItem value="year">Year</MenuItem>
                          <MenuItem value="status">Status</MenuItem>
                          <MenuItem value="source">Source</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="h6" gutterBottom>
                  Report Options
                </Typography>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Fields to Include
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List dense>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton dense>
                          <Checkbox edge="start" checked tabIndex={-1} />
                          <ListItemText primary="Project Name" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton dense>
                          <Checkbox edge="start" checked tabIndex={-1} />
                          <ListItemText primary="Status" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton dense>
                          <Checkbox edge="start" checked tabIndex={-1} />
                          <ListItemText primary="Start Date" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton dense>
                          <Checkbox edge="start" checked tabIndex={-1} />
                          <ListItemText primary="Total Cost" />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Scheduling & Export
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Scheduled Frequency</InputLabel>
                      <Select label="Scheduled Frequency" defaultValue="none">
                        <MenuItem value="none">None (Manual Run)</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Email Recipients (comma-separated)"
                      sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Export Format</InputLabel>
                      <Select label="Export Format" defaultValue="pdf">
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Report
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Scheduled Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              Refresh Schedules
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Title</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Run Time</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports
                  .filter((report) => report.status === 'scheduled') // Filter only scheduled reports
                  .map((report) => (
                    <TableRow key={report._id} hover>
                      <TableCell>{report.title}</TableCell>
                      <TableCell>{report.scheduledFrequency}</TableCell>
                      <TableCell>
                        {/* Calculate next run time - Placeholder */}
                        {'2025-04-01 08:00'}
                      </TableCell>
                      <TableCell>
                        {/* Placeholder */ 'finance@example.com'}
                      </TableCell>
                      <TableCell>
                        <Chip label="Active" color="success" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<EditIcon />}>
                            Edit
                          </Button>
                          {/* Add Pause/Delete later */}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports;
