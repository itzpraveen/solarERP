import { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import leadService from '../../../api/leadService'; // Adjust path as needed
import { Lead } from '../../../api/leadService'; // Adjust path as needed

// Define the structure for the form data more explicitly
interface ProposalFormData {
  lead: string;
  name: string;
  systemSize: number;
  panelCount: number;
  panelType: string;
  inverterType: string;
  includesBattery: boolean;
  batteryType: string;
  batteryCount: number;
  yearlyProductionEstimate: number;
  estimatedSavings: {
    firstYear: number;
    twentyFiveYear: number;
  };
  pricing: {
    grossCost: number;
    federalTaxCredit: number;
    stateTaxCredit: number;
    utilityRebate: number;
    otherIncentives: number;
    netCost: number;
  };
  notes: string;
}

// Define props for the component
interface ProposalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposalData: ProposalFormData) => void;
  loading: boolean;
  initialLeadId?: string | null; // Make it optional
}

const ProposalForm = ({
  open,
  onClose,
  onSubmit,
  loading,
  initialLeadId,
}: ProposalFormProps) => {
  const [formData, setFormData] = useState<ProposalFormData>({
    lead: '',
    name: '',
    systemSize: 0,
    panelCount: 0,
    panelType: '',
    inverterType: '',
    includesBattery: false,
    batteryType: '',
    batteryCount: 0,
    yearlyProductionEstimate: 0,
    estimatedSavings: { firstYear: 0, twentyFiveYear: 0 },
    pricing: {
      grossCost: 0,
      federalTaxCredit: 0,
      stateTaxCredit: 0,
      utilityRebate: 0,
      otherIncentives: 0,
      netCost: 0,
    },
    notes: '',
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Fetch leads for dropdown or pre-select based on initialLeadId
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return; // Don't fetch if the dialog isn't open

      setLeadsLoading(true);
      setLeads([]); // Clear previous leads
      setFormData((prev) => ({
        // Reset relevant parts of form
        ...prev,
        lead: '',
        name: '',
      }));

      try {
        if (initialLeadId) {
          console.log('Fetching specific lead for form:', initialLeadId);
          const response = await leadService.getLead(initialLeadId);
          const lead = response.data.lead;
          if (lead) {
            setLeads([lead]);
            setFormData((prev) => ({
              ...prev,
              lead: lead._id,
              name: `Solar Proposal for ${lead.firstName} ${lead.lastName}`,
            }));
            console.log('Pre-selected lead:', lead._id);
          } else {
            console.error('Initial lead not found:', initialLeadId);
            // Fetch all leads as a fallback
            const response = await leadService.getLeads({ limit: 100 });
            setLeads(response.data.leads || []);
          }
        } else {
          console.log('Fetching all leads for form');
          const response = await leadService.getLeads({ limit: 100 });
          const fetchedLeads = response.data.leads || [];
          setLeads(fetchedLeads);
          // Set the first lead as default if available and no initial lead was set
          if (fetchedLeads.length > 0 && !initialLeadId) {
            setFormData((prev) => ({
              ...prev,
              lead: fetchedLeads[0]._id,
              name: `Solar Proposal for ${fetchedLeads[0].firstName} ${fetchedLeads[0].lastName}`,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch lead data for form', error);
        setLeads([]);
      } finally {
        setLeadsLoading(false);
      }
    };

    fetchData();
    // Only re-run if open status or initialLeadId changes
  }, [open, initialLeadId]);

  // Calculate netCost whenever pricing values change
  useEffect(() => {
    const {
      grossCost,
      federalTaxCredit,
      stateTaxCredit,
      utilityRebate,
      otherIncentives,
    } = formData.pricing;
    const netCost =
      grossCost -
      federalTaxCredit -
      stateTaxCredit -
      utilityRebate -
      otherIncentives;

    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        netCost: netCost > 0 ? netCost : 0,
      },
    }));
  }, [
    formData.pricing.grossCost,
    formData.pricing.federalTaxCredit,
    formData.pricing.stateTaxCredit,
    formData.pricing.utilityRebate,
    formData.pricing.otherIncentives,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProposalFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0; // Ensure it's a number

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProposalFormData] as any),
          [child]: numValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;

    if (name === 'lead') {
      const selectedLead = leads.find((lead) => lead._id === value);
      if (selectedLead) {
        setFormData((prev) => ({
          ...prev,
          lead: value,
          name: `Solar Proposal for ${selectedLead.firstName} ${selectedLead.lastName}`,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      // Reset battery fields if battery is unchecked
      ...(name === 'includesBattery' &&
        !checked && { batteryType: '', batteryCount: 0 }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure numeric fields are numbers before submitting
    const dataToSubmit: ProposalFormData = {
      ...formData,
      systemSize: Number(formData.systemSize),
      panelCount: Number(formData.panelCount),
      batteryCount: Number(formData.batteryCount),
      yearlyProductionEstimate: Number(formData.yearlyProductionEstimate),
      estimatedSavings: {
        firstYear: Number(formData.estimatedSavings.firstYear),
        twentyFiveYear: Number(formData.estimatedSavings.twentyFiveYear),
      },
      pricing: {
        grossCost: Number(formData.pricing.grossCost),
        federalTaxCredit: Number(formData.pricing.federalTaxCredit),
        stateTaxCredit: Number(formData.pricing.stateTaxCredit),
        utilityRebate: Number(formData.pricing.utilityRebate),
        otherIncentives: Number(formData.pricing.otherIncentives),
        netCost: Number(formData.pricing.netCost),
      },
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Lead Selection */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                required
                disabled={!!initialLeadId || leadsLoading}
              >
                <InputLabel>Select Lead</InputLabel>
                <Select
                  name="lead"
                  value={formData.lead}
                  label="Select Lead"
                  onChange={handleSelectChange}
                >
                  {leadsLoading ? (
                    <MenuItem value="" disabled>
                      Loading leads...
                    </MenuItem>
                  ) : leads.length === 0 ? (
                    <MenuItem value="" disabled>
                      No leads available
                    </MenuItem>
                  ) : (
                    leads.map((lead) => (
                      <MenuItem key={lead._id} value={lead._id}>
                        {lead.firstName} {lead.lastName} - {lead.email}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Proposal Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Proposal Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            {/* System Specifications */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                System Specifications
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="System Size (kW)"
                name="systemSize"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.systemSize}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Panel Count"
                name="panelCount"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.panelCount}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Panel Type"
                name="panelType"
                value={formData.panelType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Inverter Type"
                name="inverterType"
                value={formData.inverterType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.includesBattery}
                    onChange={handleCheckboxChange}
                    name="includesBattery"
                  />
                }
                label="Includes Battery?"
              />
            </Grid>

            {/* Battery Details (Conditional) */}
            {formData.includesBattery && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Battery Type"
                    name="batteryType"
                    value={formData.batteryType}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Battery Count"
                    name="batteryCount"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={formData.batteryCount}
                    onChange={handleNumberChange}
                  />
                </Grid>
              </>
            )}

            {/* Production & Savings Estimates */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Production & Savings Estimates
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Yearly Production (kWh)"
                name="yearlyProductionEstimate"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.yearlyProductionEstimate}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={`First Year Savings (₹)`}
                name="estimatedSavings.firstYear"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.estimatedSavings.firstYear}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={`25-Year Savings (₹)`}
                name="estimatedSavings.twentyFiveYear"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.estimatedSavings.twentyFiveYear}
                onChange={handleNumberChange}
              />
            </Grid>

            {/* Pricing & Incentives */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Pricing & Incentives
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={`Gross Cost (₹)`}
                name="pricing.grossCost"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.grossCost}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={`Federal Tax Credit (₹)`}
                name="pricing.federalTaxCredit"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.federalTaxCredit}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`State Tax Credit (₹)`}
                name="pricing.stateTaxCredit"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.stateTaxCredit}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Utility Rebate (₹)`}
                name="pricing.utilityRebate"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.utilityRebate}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Other Incentives (₹)`}
                name="pricing.otherIncentives"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.pricing.otherIncentives}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={`Net Cost After Incentives (₹)`}
                name="pricing.netCost"
                type="number"
                value={formData.pricing.netCost}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.lead} // Disable if loading or no lead selected
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Proposal
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProposalForm;
