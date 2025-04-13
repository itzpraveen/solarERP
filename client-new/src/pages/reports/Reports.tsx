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
  TableRow
} from '@mui/material';
import { formatCurrencySync } from '../../utils/formatters';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableIcon,
  Schedule as ScheduleIcon,
  FileDownload as ExportIcon,
  Dashboard as DashboardIcon,
  AttachMoney as FinancialIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import reportService, { Report } from '../../api/reportService';

// Dummy chart image
const BarChartImg = 'https://mui.com/static/images/cards/contemplative-reptile.jpg';
const LineChartImg = 'https://mui.com/static/images/cards/contemplative-reptile.jpg';
const PieChartImg = 'https://mui.com/static/images/cards/contemplative-reptile.jpg';

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
    lastRun: '2025-03-01T15:30:00Z'
  },
  {
    _id: '2',
    title: 'Project Status Distribution',
    type: 'project',
    description: 'Analysis of current projects by status and stage',
    createdBy: 'Admin User',
    createdAt: '2025-02-15T14:20:00Z',
    status: 'active',
    lastRun: '2025-03-05T09:15:00Z'
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
    lastRun: '2025-03-01T08:00:00Z'
  }
];

// Mock dashboard data
const mockDashboardData = {
  leadsBySource: [
    { source: 'Website', count: 45 },
    { source: 'Referral', count: 32 },
    { source: 'Sales Call', count: 28 },
    { source: 'Social Media', count: 19 },
    { source: 'Trade Show', count: 12 }
  ],
  projectsByStatus: [
    { status: 'active', count: 24 },
    { status: 'on_hold', count: 5 },
    { status: 'completed', count: 18 },
    { status: 'cancelled', count: 3 }
  ],
  revenueByMonth: [
    { month: 'Jan', value: 78500 },
    { month: 'Feb', value: 82300 },
    { month: 'Mar', value: 91000 },
    { month: 'Apr', value: 86500 },
    { month: 'May', value: 94800 },
    { month: 'Jun', value: 105200 }
  ],
  topSalesReps: [
    { name: 'Jane Smith', revenue: 425000 },
    { name: 'John Davis', revenue: 387500 },
    { name: 'Sarah Johnson', revenue: 362000 },
    { name: 'Michael Chen', revenue: 310500 },
    { name: 'Emma Wilson', revenue: 298000 }
  ]
};

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
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState<any[]>(mockReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
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

  // Fetch dashboard reports
  const fetchDashboardReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would normally call the API, but we're using mock data for now
      // const response = await reportService.getDashboardReports();
      // setDashboardData(response.data);
      
      // Simulate API delay
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard reports');
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
      [name]: value
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
// Format number as currency
const formatCurrency = (value: number) => {
  return formatCurrencySync(value);
    return formatCurrencySync(value);
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Revenue Trend (Last 6 Months)
                    </Typography>
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  
                  {/* This would be a real chart component in production */}
                  <Box
                    component="img"
                    src={LineChartImg}
                    alt="Revenue Trend Chart"
                    sx={{
                      width: '100%',
                      height: 300,
                      objectFit: 'cover',
                      borderRadius: 1,
                      bgcolor: '#f5f5f5',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Chart visualization shows monthly revenue trend for the past 6 months
                  </Typography>
                </CardContent>
              </Card>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Project Status Distribution
                        </Typography>
                        <IconButton size="small">
                          <PieChartIcon />
                        </IconButton>
                      </Box>
                      
                      {/* This would be a real chart component in production */}
                      <Box
                        component="img"
                        src={PieChartImg}
                        alt="Project Status Chart"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                          bgcolor: '#f5f5f5'
                        }}
                      />
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {dashboardData.projectsByStatus.map((item) => (
                          <Chip 
                            key={item.status}
                            label={`${item.status.replace('_', ' ').toUpperCase()}: ${item.count}`}
                            color={
                              item.status === 'active' ? 'primary' :
                              item.status === 'completed' ? 'success' :
                              item.status === 'on_hold' ? 'warning' : 'error'
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Leads by Source
                        </Typography>
                        <IconButton size="small">
                          <BarChartIcon />
                        </IconButton>
                      </Box>
                      
                      {/* This would be a real chart component in production */}
                      <Box
                        component="img"
                        src={BarChartImg}
                        alt="Leads by Source Chart"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                          bgcolor: '#f5f5f5'
                        }}
                      />
                      
                      <Box sx={{ mt: 1 }}>
                        {dashboardData.leadsBySource.map((item) => (
                          <Box key={item.source} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">{item.source}</Typography>
                            <Typography variant="body2" fontWeight="bold">{item.count}</Typography>
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
                      <ListItem key={rep.name} sx={{ px: 0, py: 1 }} divider={index < dashboardData.topSalesReps.length - 1}>
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
                      <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                        <ListItemIcon>
                          <FinancialIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Monthly Financial Summary" 
                        />
                      </ListItemButton>
                    </ListItem>
                    
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                        <ListItemIcon>
                          <BarChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Sales Pipeline Report" 
                        />
                      </ListItemButton>
                    </ListItem>
                    
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                        <ListItemIcon>
                          <PieChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Project Performance" 
                        />
                      </ListItemButton>
                    </ListItem>
                    
                    <ListItem disablePadding>
                      <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                        <ListItemIcon>
                          <LineChartIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Year-to-Date Analysis" 
                        />
                      </ListItemButton>
                    </ListItem>
                  </List>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => setTabValue(2)}
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
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={handleTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="inventory">Inventory</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setTabValue(2)}
            >
              Create Report
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : reports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No reports found matching your criteria.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
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
                    <TableCell>Report Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id} hover>
                      <TableCell>
                        <Typography variant="body1">{report.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>{report.lastRun ? formatDate(report.lastRun) : 'Never'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={report.status.toUpperCase()}
                          color={report.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                          >
                            Run
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                          >
                            Export
                          </Button>
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
            <Typography variant="h6" gutterBottom>
              Create New Report
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Report Title"
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Report Type</InputLabel>
                      <Select
                        label="Report Type"
                        defaultValue="financial"
                      >
                        <MenuItem value="financial">Financial</MenuItem>
                        <MenuItem value="performance">Performance</MenuItem>
                        <MenuItem value="project">Project</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                        <MenuItem value="inventory">Inventory</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Visualization Type</InputLabel>
                      <Select
                        label="Visualization Type"
                        defaultValue="bar"
                      >
                        <MenuItem value="bar">Bar Chart</MenuItem>
                        <MenuItem value="line">Line Chart</MenuItem>
                        <MenuItem value="pie">Pie Chart</MenuItem>
                        <MenuItem value="table">Table</MenuItem>
                        <MenuItem value="card">KPI Cards</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Data Filtering
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <TextField
                        label="Start Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Data Source</InputLabel>
                        <Select
                          label="Data Source"
                          defaultValue="projects"
                        >
                          <MenuItem value="projects">Projects</MenuItem>
                          <MenuItem value="customers">Customers</MenuItem>
                          <MenuItem value="leads">Leads</MenuItem>
                          <MenuItem value="proposals">Proposals</MenuItem>
                          <MenuItem value="invoices">Invoices</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Group By</InputLabel>
                        <Select
                          label="Group By"
                          defaultValue="month"
                        >
                          <MenuItem value="day">Day</MenuItem>
                          <MenuItem value="week">Week</MenuItem>
                          <MenuItem value="month">Month</MenuItem>
                          <MenuItem value="quarter">Quarter</MenuItem>
                          <MenuItem value="year">Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Box>
                    <Button
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      Preview Report
                    </Button>
                    <Button
                      variant="contained"
                    >
                      Create Report
                    </Button>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Report Templates
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Start with a pre-configured template to save time
                    </Typography>
                    
                    <List>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                          <ListItemIcon>
                            <FinancialIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Sales Dashboard" 
                            secondary="Key sales metrics overview"
                          />
                        </ListItemButton>
                      </ListItem>
                      
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                          <ListItemIcon>
                            <BarChartIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Monthly Financial Report" 
                            secondary="Revenue, expenses and profit analysis"
                          />
                        </ListItemButton>
                      </ListItem>
                      
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                          <ListItemIcon>
                            <PieChartIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Project Distribution" 
                            secondary="Analysis of projects by status and type"
                          />
                        </ListItemButton>
                      </ListItem>
                      
                      <ListItem disablePadding>
                        <ListItemButton sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                          <ListItemIcon>
                            <LineChartIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Lead Conversion Funnel" 
                            secondary="Lead to customer conversion analysis"
                          />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Schedule Options
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Scheduled Frequency</InputLabel>
                      <Select
                        label="Scheduled Frequency"
                        defaultValue="none"
                      >
                        <MenuItem value="none">No Schedule</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Recipients (Email)"
                      placeholder="Enter email addresses separated by commas"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Export Format</InputLabel>
                      <Select
                        label="Export Format"
                        defaultValue="pdf"
                      >
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>
        
        {/* Scheduled Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Scheduled Reports
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setTabValue(2)}
            >
              Schedule New Report
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.filter(r => r.scheduledFrequency).map((report) => (
                  <TableRow key={report._id} hover>
                    <TableCell>
                      <Typography variant="body1">{report.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {report.scheduledFrequency?.charAt(0).toUpperCase() + report.scheduledFrequency?.slice(1)}
                    </TableCell>
                    <TableCell>
                      {/* This would be calculated based on last run and frequency in real app */}
                      {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.recipients?.join(', ') || 'No recipients'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                        >
                          Delete
                        </Button>
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