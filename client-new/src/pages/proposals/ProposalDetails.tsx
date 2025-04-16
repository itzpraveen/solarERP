import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Description as ProposalIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  EventNote as NoteIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  BarChart as ChartIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import proposalService, {
  Proposal,
  ProposalFinancingOption,
} from '../../api/proposalService';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import { getCurrencySymbol } from '../../api/settingsService';

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
      id={`proposal-tabpanel-${index}`}
      aria-labelledby={`proposal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Status colors
const statusColors = {
  draft: 'default',
  sent: 'primary',
  viewed: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
} as const;

// Financing type labels
const financingTypeLabels = {
  cash: 'Cash Purchase',
  loan: 'Solar Loan',
  lease: 'Solar Lease',
  ppa: 'Power Purchase Agreement (PPA)',
};

const ProposalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for proposal data
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Proposal>>({});

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // State for dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [sendDialog, setOpenSendDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    status: '',
    title: '',
    message: '',
  });

  // State for new financing option
  const [financingDialog, setFinancingDialog] = useState(false);
  const [newFinancing, setNewFinancing] = useState<ProposalFinancingOption>({
    type: 'cash',
    termYears: 0,
    downPayment: 0,
    apr: 0,
    monthlyPayment: 0,
    totalCost: 0,
    selected: false,
  });

  // Fetch proposal data
  const fetchProposal = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await proposalService.getProposal(id);
      setProposal(response.data.proposal);
      setEditData(response.data.proposal);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch proposal');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProposal();
  }, [id]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate netCost whenever pricing values change in edit mode
  useEffect(() => {
    if (!editMode || !editData.pricing) return;

    const {
      grossCost,
      centralSubsidy, // Updated name
      stateSubsidy, // Updated name
      gstRate, // Added
      utilityRebate,
      otherIncentives,
    } = editData.pricing;

    if (grossCost !== undefined && gstRate !== undefined) {
      // Calculate GST Amount
      const calculatedGstAmount = (grossCost * gstRate) / 100;

      // Calculate Net Cost (Gross + GST - Subsidies/Rebates)
      const calculatedNetCost =
        grossCost +
        calculatedGstAmount -
        (centralSubsidy || 0) -
        (stateSubsidy || 0) -
        (utilityRebate || 0) -
        (otherIncentives || 0);

      setEditData((prev) => ({
        ...prev,
        pricing: {
          ...prev.pricing!,
          gstAmount: calculatedGstAmount > 0 ? calculatedGstAmount : 0, // Update gstAmount
          netCost: calculatedNetCost > 0 ? calculatedNetCost : 0, // Update netCost
        },
      }));
    }
  }, [
    // Update dependencies
    editMode,
    editData.pricing?.grossCost,
    editData.pricing?.centralSubsidy,
    editData.pricing?.stateSubsidy,
    editData.pricing?.gstRate,
    editData.pricing?.utilityRebate,
    editData.pricing?.otherIncentives,
  ]);

  // Handle edit form changes
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData({
        ...editData,
        [parent]: {
          ...(editData[parent as keyof typeof editData] as any),
          [child]: value,
        },
      });
    } else {
      setEditData({
        ...editData,
        [name]: value,
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  // Handle boolean changes
  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditData({
      ...editData,
      [name]: checked,
    });
  };

  // Handle number changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData({
        ...editData,
        [parent]: {
          ...(editData[parent as keyof typeof editData] as any),
          [child]: parseFloat(value) || 0,
        },
      });
    } else {
      setEditData({
        ...editData,
        [name]: parseFloat(value) || 0,
      });
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Canceling edit - reset data
      setEditData(proposal || {});
    }
    setEditMode(!editMode);
  };

  // Save proposal changes
  const saveProposal = async () => {
    if (!id || !editData) return;

    try {
      setLoading(true);
      console.log(
        'Saving proposal with data:',
        JSON.stringify(editData, null, 2)
      ); // Log data being sent
      await proposalService.updateProposal(id, editData);
      await fetchProposal();
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update proposal');
      setLoading(false);
    }
  };

  // Delete proposal
  const deleteProposal = async () => {
    if (!id) return;

    try {
      await proposalService.deleteProposal(id);
      navigate('/proposals');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete proposal');
    }
  };

  // Send proposal
  const sendProposal = async () => {
    if (!id) return;

    try {
      await proposalService.sendProposal(id);
      setOpenSendDialog(false);
      fetchProposal();
    } catch (err: any) {
      setError(err?.message || 'Failed to send proposal');
    }
  };

  // Update proposal status
  const updateStatus = async () => {
    if (!id || !statusDialog.status) return;

    try {
      await proposalService.updateStatus(id, statusDialog.status as any);
      setStatusDialog({ ...statusDialog, open: false });
      fetchProposal();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  };

  // Open status update dialog
  const openStatusDialog = (status: string) => {
    let title = '';
    let message = '';

    switch (status) {
      case 'accepted':
        title = 'Mark as Accepted';
        message =
          'This will mark the proposal as accepted and update the lead status to "Won". Do you want to continue?';
        break;
      case 'rejected':
        title = 'Mark as Rejected';
        message =
          'This will mark the proposal as rejected and update the lead status to "Lost". Do you want to continue?';
        break;
      default:
        title = `Update Status to ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        message = `Are you sure you want to change the proposal status to "${status}"?`;
        break;
    }

    setStatusDialog({
      open: true,
      status,
      title,
      message,
    });
  };

  // Handle financing option changes
  const handleFinancingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewFinancing({
      ...newFinancing,
      [name]: name === 'type' ? value : parseFloat(value) || 0,
    });
  };

  // Add financing option
  const addFinancingOption = () => {
    if (!editData.financingOptions) {
      setEditData({
        ...editData,
        financingOptions: [newFinancing],
      });
    } else {
      setEditData({
        ...editData,
        financingOptions: [...editData.financingOptions, newFinancing],
      });
    }

    setFinancingDialog(false);
    setNewFinancing({
      type: 'cash',
      termYears: 0,
      downPayment: 0,
      apr: 0,
      monthlyPayment: 0,
      totalCost: 0,
      selected: false,
    });
  };

  // Remove financing option
  const removeFinancingOption = (index: number) => {
    if (!editData.financingOptions) return;

    const updatedOptions = [...editData.financingOptions];
    updatedOptions.splice(index, 1);

    setEditData({
      ...editData,
      financingOptions: updatedOptions,
    });
  };

  // Set selected financing option
  const selectFinancingOption = (index: number) => {
    if (!editData.financingOptions) return;

    const updatedOptions = editData.financingOptions.map((option, i) => ({
      ...option,
      selected: i === index,
    }));

    setEditData({
      ...editData,
      financingOptions: updatedOptions,
    });
  };

  if (loading && !proposal) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !proposal) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!proposal) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Proposal not found
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          color="inherit"
          to="/dashboard"
          underline="hover"
        >
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          color="inherit"
          to="/proposals"
          underline="hover"
        >
          Proposals
        </Link>
        <Typography color="text.primary">{proposal.name}</Typography>
      </Breadcrumbs>

      {/* Header with actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/proposals')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{proposal.name}</Typography>
          <Chip
            label={
              proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)
            }
            color={statusColors[proposal.status as keyof typeof statusColors]}
            sx={{ ml: 2 }}
          />
        </Box>

        <Box>
          {!editMode ? (
            <>
              {proposal.status === 'draft' && (
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={() => setOpenSendDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Send to Lead
                </Button>
              )}

              {['sent', 'viewed'].includes(proposal.status) && (
                <>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => openStatusDialog('accepted')}
                    sx={{ mr: 1 }}
                  >
                    Mark Accepted
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => openStatusDialog('rejected')}
                    sx={{ mr: 1 }}
                  >
                    Mark Rejected
                  </Button>
                </>
              )}

              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={toggleEditMode}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveProposal}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={toggleEditMode}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Lead Info" />
          <Tab label="System Specs" />
          <Tab label="Financials" />
          <Tab label="Timeline" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Proposal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Proposal Name
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="name"
                          value={editData.name || proposal.name}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.name}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={
                            proposal.status.charAt(0).toUpperCase() +
                            proposal.status.slice(1)
                          }
                          color={
                            statusColors[
                              proposal.status as keyof typeof statusColors
                            ]
                          }
                          size="small"
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Valid Until
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          name="validUntil"
                          value={
                            editData.validUntil
                              ? new Date(editData.validUntil)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(proposal.validUntil).toLocaleDateString()}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Lead
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.lead.firstName} {proposal.lead.lastName}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.createdBy.firstName}{' '}
                        {proposal.createdBy.lastName}
                      </Typography>
                    </Grid>

                    {proposal.sentDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sent Date
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(proposal.sentDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}

                    {proposal.viewedDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Viewed Date
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(proposal.viewedDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}

                    {proposal.acceptedDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Accepted Date
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(proposal.acceptedDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}

                    {proposal.rejectedDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Rejected Date
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(proposal.rejectedDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Overview
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Size
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.systemSize} kW
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Count
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.panelCount} panels
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Type
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.panelType}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Inverter Type
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.inverterType}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Battery System
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.includesBattery ? (
                          <>
                            {proposal.batteryCount} x {proposal.batteryType}
                          </>
                        ) : (
                          'No battery system'
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gross Cost
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay amount={proposal.pricing.grossCost} />
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Cost
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay amount={proposal.pricing.netCost} />
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Yearly Production
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {proposal.yearlyProductionEstimate.toLocaleString()} kWh
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        25-Year Savings
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, color: 'success.main' }}
                      >
                        <CurrencyDisplay
                          amount={proposal.estimatedSavings.twentyFiveYear}
                        />
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {editMode ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="notes"
                      value={editData.notes || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <Typography variant="body1">
                      {proposal.notes || 'No notes added to this proposal.'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Lead Info Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lead Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <PersonIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {proposal.lead.firstName} {proposal.lead.lastName}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <EmailIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {proposal.lead.email}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <PhoneIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {proposal.lead.phone}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <HomeIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: 'action.active' }}
                        />
                        {proposal.lead.address.street},{' '}
                        {proposal.lead.address.city},{' '}
                        {proposal.lead.address.state}{' '}
                        {proposal.lead.address.zipCode}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    component={RouterLink}
                    to={`/leads/${proposal.lead._id}`}
                  >
                    View Lead Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Installation Address
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Typography
                    variant="body1"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <HomeIcon
                      fontSize="small"
                      sx={{ mr: 0.5, color: 'action.active' }}
                    />
                    {proposal.lead.address.street}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {proposal.lead.address.city}, {proposal.lead.address.state}{' '}
                    {proposal.lead.address.zipCode}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {proposal.lead.address.country}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Specs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Configuration
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        System Size
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="systemSize"
                          type="number"
                          inputProps={{ min: 0, step: 0.1 }}
                          value={editData.systemSize || proposal.systemSize}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.systemSize} kW
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Count
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="panelCount"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={editData.panelCount || proposal.panelCount}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.panelCount} panels
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Panel Type
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="panelType"
                          value={editData.panelType || proposal.panelType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.panelType}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Inverter Type
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="inverterType"
                          value={editData.inverterType || proposal.inverterType}
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.inverterType}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Battery System
                      </Typography>
                      {editMode ? (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={
                                  editData.includesBattery ||
                                  proposal.includesBattery
                                }
                                onChange={handleBooleanChange}
                                name="includesBattery"
                              />
                            }
                            label="Includes Battery"
                          />
                          {(editData.includesBattery ||
                            proposal.includesBattery) && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Battery Type"
                                  name="batteryType"
                                  value={
                                    editData.batteryType ||
                                    proposal.batteryType ||
                                    ''
                                  }
                                  onChange={handleEditChange}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Battery Count"
                                  name="batteryCount"
                                  type="number"
                                  inputProps={{ min: 0 }}
                                  value={
                                    editData.batteryCount ||
                                    proposal.batteryCount ||
                                    0
                                  }
                                  onChange={handleNumberChange}
                                />
                              </Grid>
                            </Grid>
                          )}
                        </>
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.includesBattery ? (
                            <>
                              {proposal.batteryCount} x {proposal.batteryType}
                            </>
                          ) : (
                            'No battery system'
                          )}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Production & Savings Estimates
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Yearly Production
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="yearlyProductionEstimate"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={
                            editData.yearlyProductionEstimate ||
                            proposal.yearlyProductionEstimate
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.yearlyProductionEstimate.toLocaleString()}{' '}
                          kWh
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        First Year Savings
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="estimatedSavings.firstYear"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.estimatedSavings?.firstYear ||
                            proposal.estimatedSavings.firstYear
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.estimatedSavings.firstYear}
                          />
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        25-Year Savings
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="estimatedSavings.twentyFiveYear"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.estimatedSavings?.twentyFiveYear ||
                            proposal.estimatedSavings.twentyFiveYear
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{ mt: 0.5, color: 'success.main' }}
                        >
                          <CurrencyDisplay
                            amount={proposal.estimatedSavings.twentyFiveYear}
                          />
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Design Images
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {!proposal.designImages ||
                  proposal.designImages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No design images have been added to this proposal.
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {proposal.designImages.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img
                            src={image}
                            alt={`Design ${index + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: 4,
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {editMode && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                    >
                      Add Design Image
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Financials Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pricing & Incentives
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gross Cost
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.grossCost"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.pricing?.grossCost ||
                            proposal.pricing.grossCost
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.pricing.grossCost}
                          />
                        </Typography>
                      )}
                    </Grid>

                    {/* Updated to Central Subsidy */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Central Subsidy
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.centralSubsidy" // Updated name
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.pricing?.centralSubsidy ?? // Use nullish coalescing
                            proposal.pricing.centralSubsidy
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.pricing.centralSubsidy}
                          />
                        </Typography>
                      )}
                    </Grid>

                    {/* Updated to State Subsidy */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        State Subsidy
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.stateSubsidy" // Updated name
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.pricing?.stateSubsidy ?? // Use nullish coalescing
                            proposal.pricing.stateSubsidy ??
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.pricing.stateSubsidy || 0}
                          />
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Utility Rebate
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.utilityRebate"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.pricing?.utilityRebate ||
                            proposal.pricing.utilityRebate ||
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.pricing.utilityRebate || 0}
                          />
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Other Incentives
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.otherIncentives"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.pricing?.otherIncentives ||
                            proposal.pricing.otherIncentives ||
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.pricing.otherIncentives || 0}
                          />
                        </Typography>
                      )}
                    </Grid>

                    {/* Added GST Rate */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        GST Rate (%)
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="pricing.gstRate"
                          type="number"
                          inputProps={{ min: 0, step: 0.1 }}
                          value={
                            editData.pricing?.gstRate ??
                            proposal.pricing.gstRate ??
                            12 // Default example
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.pricing.gstRate || 0}%
                        </Typography>
                      )}
                    </Grid>

                    {/* Added GST Amount (Read Only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        GST Amount
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay
                          amount={proposal.pricing.gstAmount || 0}
                        />
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Cost (Incl. GST, After Incentives)
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 0.5, color: 'primary.main' }}
                      >
                        <CurrencyDisplay amount={proposal.pricing.netCost} />
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">Financing Options</Typography>
                    {editMode && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setFinancingDialog(true)}
                      >
                        Add Option
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {!proposal.financingOptions ||
                  proposal.financingOptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No financing options have been defined for this proposal.
                    </Typography>
                  ) : (
                    <List>
                      {(editMode
                        ? editData.financingOptions
                        : proposal.financingOptions
                      )?.map((option, index) => (
                        <Paper
                          key={index}
                          sx={{
                            mb: 2,
                            p: 2,
                            border: option.selected ? '2px solid' : 'none',
                            borderColor: 'primary.main',
                            position: 'relative',
                          }}
                        >
                          {editMode && (
                            <IconButton
                              size="small"
                              color="error"
                              sx={{ position: 'absolute', top: 5, right: 5 }}
                              onClick={() => removeFinancingOption(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}

                          <Typography
                            variant="subtitle1"
                            fontWeight="medium"
                            color="primary"
                          >
                            {financingTypeLabels[
                              option.type as keyof typeof financingTypeLabels
                            ] || option.type}
                            {option.selected && (
                              <Chip
                                label="Selected"
                                color="primary"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            {option.type !== 'cash' && (
                              <>
                                <Grid item xs={6}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Term Length
                                  </Typography>
                                  <Typography variant="body1">
                                    {option.termYears}{' '}
                                    {option.termYears === 1 ? 'year' : 'years'}
                                  </Typography>
                                </Grid>

                                {(option.type === 'loan' ||
                                  option.type === 'lease') && (
                                  <Grid item xs={6}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Down Payment
                                    </Typography>
                                    <Typography variant="body1">
                                      <CurrencyDisplay
                                        amount={option.downPayment || 0}
                                      />
                                    </Typography>
                                  </Grid>
                                )}

                                {option.type === 'loan' && (
                                  <Grid item xs={6}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      APR
                                    </Typography>
                                    <Typography variant="body1">
                                      {option.apr}%
                                    </Typography>
                                  </Grid>
                                )}

                                <Grid item xs={6}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {option.type === 'ppa'
                                      ? 'Price per kWh'
                                      : 'Monthly Payment'}
                                  </Typography>
                                  <Typography variant="body1">
                                    {option.type === 'ppa' ? (
                                      <>
                                        {getCurrencySymbol('INR')}
                                        {option.monthlyPayment}/kWh
                                      </>
                                    ) : (
                                      <>
                                        <CurrencyDisplay
                                          amount={option.monthlyPayment || 0}
                                        />
                                        /month
                                      </>
                                    )}
                                  </Typography>
                                </Grid>
                              </>
                            )}

                            <Grid item xs={12}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Total Cost
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                <CurrencyDisplay
                                  amount={option.totalCost || 0}
                                />
                              </Typography>
                            </Grid>
                          </Grid>

                          {editMode && !option.selected && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => selectFinancingOption(index)}
                              sx={{ mt: 1 }}
                            >
                              Set as Primary Option
                            </Button>
                          )}
                        </Paper>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proposal Timeline
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: 'primary.light',
                    zIndex: 0,
                  }}
                />

                <List sx={{ position: 'relative', zIndex: 1 }}>
                  <ListItem sx={{ pb: 3 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ProposalIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Proposal Created"
                      secondary={`Created on ${new Date(proposal.createdAt).toLocaleDateString()} by ${proposal.createdBy.firstName} ${proposal.createdBy.lastName}`}
                    />
                  </ListItem>

                  {proposal.sentDate && (
                    <ListItem sx={{ pb: 3 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <SendIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Proposal Sent"
                        secondary={`Sent to ${proposal.lead.firstName} ${proposal.lead.lastName} on ${new Date(proposal.sentDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {proposal.viewedDate && (
                    <ListItem sx={{ pb: 3 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <ViewIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Proposal Viewed"
                        secondary={`Viewed by lead on ${new Date(proposal.viewedDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {proposal.acceptedDate && (
                    <ListItem sx={{ pb: 3 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Proposal Accepted"
                        secondary={`Accepted on ${new Date(proposal.acceptedDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {proposal.rejectedDate && (
                    <ListItem sx={{ pb: 3 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <CloseIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Proposal Rejected"
                        secondary={`Rejected on ${new Date(proposal.rejectedDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {!proposal.sentDate &&
                    !proposal.viewedDate &&
                    !proposal.acceptedDate &&
                    !proposal.rejectedDate && (
                      <ListItem>
                        <ListItemText
                          primary="No additional events"
                          secondary="This proposal has not been sent yet"
                        />
                      </ListItem>
                    )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this proposal? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteProposal} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog open={sendDialog} onClose={() => setOpenSendDialog(false)}>
        <DialogTitle>Send Proposal</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to send this proposal to {proposal.lead.email}
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will email the proposal to the lead and update the proposal
            status to "Sent".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button
            onClick={sendProposal}
            color="primary"
            variant="contained"
            startIcon={<SendIcon />}
          >
            Send Proposal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ ...statusDialog, open: false })}
      >
        <DialogTitle>{statusDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{statusDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setStatusDialog({ ...statusDialog, open: false })}
          >
            Cancel
          </Button>
          <Button onClick={updateStatus} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Financing Option Dialog */}
      <Dialog open={financingDialog} onClose={() => setFinancingDialog(false)}>
        <DialogTitle>Add Financing Option</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Financing Type</InputLabel>
                <Select
                  name="type"
                  value={newFinancing.type}
                  label="Financing Type"
                  onChange={handleFinancingChange as any}
                >
                  <MenuItem value="cash">Cash Purchase</MenuItem>
                  <MenuItem value="loan">Solar Loan</MenuItem>
                  <MenuItem value="lease">Solar Lease</MenuItem>
                  <MenuItem value="ppa">
                    Power Purchase Agreement (PPA)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {newFinancing.type !== 'cash' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Term (Years)"
                    name="termYears"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={newFinancing.termYears}
                    onChange={handleFinancingChange}
                  />
                </Grid>

                {(newFinancing.type === 'loan' ||
                  newFinancing.type === 'lease') && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={`Down Payment (${getCurrencySymbol('INR')})`}
                      name="downPayment"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={newFinancing.downPayment}
                      onChange={handleFinancingChange}
                    />
                  </Grid>
                )}

                {newFinancing.type === 'loan' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="APR (%)"
                      name="apr"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={newFinancing.apr}
                      onChange={handleFinancingChange}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={
                      newFinancing.type === 'ppa'
                        ? `Price per kWh (${getCurrencySymbol('INR')})`
                        : `Monthly Payment (${getCurrencySymbol('INR')})`
                    }
                    name="monthlyPayment"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={newFinancing.monthlyPayment}
                    onChange={handleFinancingChange}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`Total Cost (${getCurrencySymbol('INR')})`}
                name="totalCost"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={newFinancing.totalCost}
                onChange={handleFinancingChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newFinancing.selected}
                    onChange={(e) =>
                      setNewFinancing({
                        ...newFinancing,
                        selected: e.target.checked,
                      })
                    }
                  />
                }
                label="Set as Primary Financing Option"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinancingDialog(false)}>Cancel</Button>
          <Button
            onClick={addFinancingOption}
            color="primary"
            variant="contained"
          >
            Add Option
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalDetails;
