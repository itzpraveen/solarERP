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
} from '@mui/material';
import {
  Description as ProposalIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import proposalService, {
  Proposal,
  // ProposalEquipmentItem, // Removed unused import
  ProposalUpdatePayload,
} from '../../api/proposalService';
import CurrencyDisplay from '../../components/common/CurrencyDisplay'; // Ensure this component handles undefined amount gracefully

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

const ProposalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Proposal>>({});
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [sendDialog, setOpenSendDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    status: '',
    title: '',
    message: '',
  });
  const [downloading, setDownloading] = useState(false); // State for download loading
  const [downloadError, setDownloadError] = useState<string | null>(null); // State for download error

  const fetchProposal = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await proposalService.getProposal(id);
      const fetchedProposal = response.data.proposal;
      setProposal(fetchedProposal);
      setEditData(fetchedProposal); // Initialize editData
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch proposal');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [id, fetchProposal]); // Added fetchProposal to dependency array

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Ensure empty string results in undefined or 0 based on field requirements
    const numValue = value === '' ? undefined : parseFloat(value);
    setEditData((prev) => ({
      ...prev,
      // Use 0 if parsing fails or value is empty for required number fields
      [name]: isNaN(numValue as number) ? 0 : numValue,
    }));
  };

  const toggleEditMode = () => {
    if (editMode) {
      setEditData(proposal || {});
    }
    setEditMode(!editMode);
  };

  const saveProposal = async () => {
    if (!id || !editData) return;

    const finalPayload: ProposalUpdatePayload = {
      name: editData.name,
      status: editData.status,
      systemSize: editData.systemSize,
      panelCount: editData.panelCount,
      equipment: editData.equipment?.map((eq) => ({
        item: typeof eq.item === 'string' ? eq.item : eq.item._id,
        quantity: eq.quantity,
        unitPrice: eq.unitPrice,
      })),
      projectCostExcludingStructure: editData.projectCostExcludingStructure,
      structureCost: editData.structureCost,
      subsidyAmount: editData.subsidyAmount,
      additionalCosts: editData.additionalCosts,
      currency: editData.currency,
      validUntil: editData.validUntil,
      notes: editData.notes,
      active: editData.active,
    };

    Object.keys(finalPayload).forEach(
      (key) =>
        finalPayload[key as keyof ProposalUpdatePayload] === undefined &&
        delete finalPayload[key as keyof ProposalUpdatePayload]
    );

    try {
      setLoading(true);
      await proposalService.updateProposal(id, finalPayload);
      await fetchProposal();
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update proposal');
      setLoading(false);
    }
  };

  const deleteProposal = async () => {
    if (!id) return;
    try {
      await proposalService.deleteProposal(id);
      navigate('/proposals');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete proposal');
    }
  };

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

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await proposalService.downloadProposalPdf(id);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to download PDF. Please check console for details.'
      );
    } finally {
      setDownloading(false);
    }
  };

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
    setStatusDialog({ open: true, status, title, message });
  };

  if (loading && !proposal)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error && !proposal)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  if (!proposal)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Proposal not found
      </Alert>
    );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs */}
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
      {/* Header */}
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
                sx={{ mr: 1 }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={
                  downloading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
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
      {downloadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setDownloadError(null)}
        >
          {downloadError}
        </Alert>
      )}{' '}
      {/* Show download error */}
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
                          value={editData.name ?? proposal.name}
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
                        Proposal ID
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="proposalId"
                          value={
                            editData.proposalId ?? proposal.proposalId ?? ''
                          }
                          onChange={handleEditChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.proposalId || 'N/A'}
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
                    Financial Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Final Project Cost
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay
                          amount={proposal.finalProjectCost ?? 0}
                          currencyCode={proposal.currency}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Investment
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ mt: 0.5, color: 'primary.main' }}
                      >
                        <CurrencyDisplay
                          amount={proposal.netInvestment ?? 0}
                          currencyCode={proposal.currency}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Subsidy Amount
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay
                          amount={proposal.subsidyAmount ?? 0}
                          currencyCode={proposal.currency}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Costs
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        <CurrencyDisplay
                          amount={proposal.additionalCosts ?? 0}
                          currencyCode={proposal.currency}
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
                      {proposal.notes || 'No notes added.'}
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
                          value={editData.systemSize ?? proposal.systemSize}
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
                          value={editData.panelCount ?? proposal.panelCount}
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {proposal.panelCount} panels
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
                    Equipment
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {/* TODO: Add equipment editing UI when in editMode */}
                  <List dense>
                    {proposal.equipment.map((eq, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${eq.quantity} x ${eq.item.name}`}
                          secondary={`${eq.item.category} - ${eq.item.modelNumber || 'N/A'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Financials Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pricing Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Project Cost (Excl. Structure)
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="projectCostExcludingStructure"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.projectCostExcludingStructure ??
                            proposal.projectCostExcludingStructure ??
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.projectCostExcludingStructure ?? 0}
                            currencyCode={proposal.currency}
                          />
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Structure Cost
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="structureCost"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.structureCost ??
                            proposal.structureCost ??
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.structureCost ?? 0}
                            currencyCode={proposal.currency}
                          />
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Final Project Cost
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, fontWeight: 'medium' }}
                      >
                        <CurrencyDisplay
                          amount={proposal.finalProjectCost ?? 0}
                          currencyCode={proposal.currency}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Subsidy Amount
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="subsidyAmount"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.subsidyAmount ??
                            proposal.subsidyAmount ??
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.subsidyAmount ?? 0}
                            currencyCode={proposal.currency}
                          />
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Investment
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 0.5,
                          fontWeight: 'medium',
                          color: 'primary.main',
                        }}
                      >
                        <CurrencyDisplay
                          amount={proposal.netInvestment ?? 0}
                          currencyCode={proposal.currency}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Costs
                      </Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          name="additionalCosts"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={
                            editData.additionalCosts ??
                            proposal.additionalCosts ??
                            0
                          }
                          onChange={handleNumberChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <CurrencyDisplay
                            amount={proposal.additionalCosts ?? 0}
                            currencyCode={proposal.currency}
                          />
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
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
      {/* Dialogs */}
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
    </Box>
  );
};

export default ProposalDetails;
