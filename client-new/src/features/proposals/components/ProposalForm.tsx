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
  // Checkbox, // Removed unused import
  // FormControlLabel, // Removed unused import
  Autocomplete,
  // Box, // Removed unused import
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import leadService, { Lead } from '../../../api/leadService';
import inventoryService, { InventoryItem } from '../../../api/inventoryService';
import { FinancingOption } from '../../../api/proposalService'; // Import FinancingOption type

// Define structure for equipment line items in the form
interface EquipmentLineItem {
  item: string; // Inventory item ID
  quantity: number;
  unitPrice?: number; // Optional: capture price at time of adding
  // Add temporary fields for display if needed, like name/category
  itemName?: string;
  itemCategory?: string;
}

// Updated structure for the form data to match new model
export interface ProposalFormData {
  lead: string;
  name: string;
  proposalId?: string; // Added proposalId
  systemSize: number;
  panelCount: number; // Keep or remove based on final decision
  equipment: EquipmentLineItem[];
  projectCostExcludingStructure: number; // New field
  structureCost: number; // New field
  subsidyAmount: number; // New field
  additionalCosts: number; // New field
  currency: string; // New field
  financingOptions: FinancingOption[]; // Added financing options
  energyMeter?: string; // Added energy meter field
  notes: string;
  // Removed: yearlyProductionEstimate, estimatedSavings, pricing object
}

// Define props for the component
interface ProposalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposalData: ProposalFormData) => void;
  loading: boolean;
  initialLeadId?: string | null; // Make it optional
}

// Helper type for categorized inventory
interface CategorizedInventory {
  panel: InventoryItem[];
  inverter: InventoryItem[];
  battery: InventoryItem[];
  other: InventoryItem[]; // For racking, wiring etc.
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
    equipment: [],
    // yearlyProductionEstimate: 0, // Removed
    // estimatedSavings: { firstYear: 0, twentyFiveYear: 0 }, // Removed
    // pricing: { ... }, // Removed old pricing object
    projectCostExcludingStructure: 0, // Initialize new field
    structureCost: 0, // Initialize new field
    subsidyAmount: 0, // Initialize new field
    additionalCosts: 0, // Initialize new field
    currency: 'INR', // Initialize new field
    financingOptions: [], // Initialize financing options array
    energyMeter: '', // Initialize energy meter
    notes: '',
    proposalId: '', // Initialize proposalId
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [inventory, setInventory] = useState<CategorizedInventory>({
    panel: [],
    inverter: [],
    battery: [],
    other: [],
  });
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Fetch leads AND inventory data
  useEffect(() => {
    const fetchLeads = async () => {
      setLeadsLoading(true);
      setLeads([]);
      setFormData((prev) => ({ ...prev, lead: '', name: '' }));
      try {
        if (initialLeadId) {
          const response = await leadService.getLead(initialLeadId);
          const { lead } = response.data;
          if (lead) {
            setLeads([lead]);
            setFormData((prev) => ({
              ...prev,
              lead: lead._id,
              name: `Solar Proposal for ${lead.firstName} ${lead.lastName}`,
            }));
          } else {
            const response = await leadService.getLeads({ limit: 100 });
            setLeads(response.data.leads || []);
          }
        } else {
          const response = await leadService.getLeads({ limit: 100 });
          const fetchedLeads = response.data.leads || [];
          setLeads(fetchedLeads);
          if (fetchedLeads.length > 0) {
            setFormData((prev) => ({
              ...prev,
              lead: fetchedLeads[0]._id,
              name: `Solar Proposal for ${fetchedLeads[0].firstName} ${fetchedLeads[0].lastName}`,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch lead data for form', error);
      } finally {
        setLeadsLoading(false);
      }
    };

    const fetchInventory = async () => {
      setInventoryLoading(true);
      setInventory({ panel: [], inverter: [], battery: [], other: [] }); // Reset
      try {
        // Fetch all inventory items using the correct function name
        // Assuming getAllInventory returns the array directly or adjust based on actual API response structure
        const items: InventoryItem[] = await inventoryService.getAllInventory();
        // Categorize items with explicit types
        const categorized: CategorizedInventory = {
          panel: items.filter(
            (item: InventoryItem) => item.category === 'panel'
          ),
          inverter: items.filter(
            (item: InventoryItem) => item.category === 'inverter'
          ),
          battery: items.filter(
            (item: InventoryItem) => item.category === 'battery'
          ),
          other: items.filter(
            (item: InventoryItem) =>
              !['panel', 'inverter', 'battery'].includes(item.category)
          ),
        };
        setInventory(categorized);
      } catch (error) {
        console.error('Failed to fetch inventory items', error);
      } finally {
        setInventoryLoading(false);
      }
    };

    if (open) {
      fetchLeads();
      fetchInventory();
    }
    // Only re-run if open status or initialLeadId changes
  }, [open, initialLeadId]);

  // Removed useEffect for pricing calculation as it's handled by backend pre-save hook

  // --- Handlers for Equipment Array ---

  const handleEquipmentChange = (
    index: number,
    field: keyof EquipmentLineItem,
    value: string | number | InventoryItem | null
  ) => {
    const updatedEquipment = [...formData.equipment];

    if (field === 'item' && value && typeof value === 'object') {
      // Handling Autocomplete change where value is the InventoryItem object
      const selectedItem = value as InventoryItem;
      updatedEquipment[index] = {
        ...updatedEquipment[index],
        item: selectedItem._id, // Store the ID
        unitPrice: selectedItem.unitPrice, // Capture current price
        itemName: selectedItem.name, // Store name for display
        itemCategory: selectedItem.category, // Store category for display
      };
    } else if (field === 'quantity') {
      updatedEquipment[index] = {
        ...updatedEquipment[index],
        quantity: Number(value) || 0,
      };
    }
    // Add handling for other fields if necessary

    setFormData((prev) => ({ ...prev, equipment: updatedEquipment }));
  };

  const addEquipmentItem = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: [...prev.equipment, { item: '', quantity: 1 }], // Add a new empty item
    }));
  };

  const removeEquipmentItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  // --- Handlers for Financing Options Array ---

  const handleFinancingChange = (
    index: number,
    field: keyof FinancingOption,
    value: string | number
  ) => {
    const updatedFinancing = [...formData.financingOptions];
    // Ensure numeric fields are stored as numbers
    const isNumericField = [
      'termYears',
      'interestRate',
      'downPayment',
      'monthlyPayment',
    ].includes(field);
    updatedFinancing[index] = {
      ...updatedFinancing[index],
      [field]: isNumericField ? Number(value) || 0 : value,
    };
    setFormData((prev) => ({ ...prev, financingOptions: updatedFinancing }));
  };

  const addFinancingOption = () => {
    setFormData((prev) => ({
      ...prev,
      financingOptions: [
        ...prev.financingOptions,
        // Add a default loan option - adjust defaults as needed
        {
          type: 'loan',
          provider: '',
          termYears: 0,
          interestRate: 0,
          downPayment: 0,
          monthlyPayment: 0,
          notes: '',
        },
      ],
    }));
  };

  const removeFinancingOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      financingOptions: prev.financingOptions.filter((_, i) => i !== index),
    }));
  };

  // --- Standard Handlers (adjust as needed) ---

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

  // Keep handleSelectChange for the Lead dropdown
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
      // No need to handle other selects here if they are replaced by Autocomplete
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // handleCheckboxChange is removed as includesBattery is removed

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Construct the data object strictly based on ProposalFormData and backend expectations
    const dataToSubmit: ProposalFormData = {
      lead: formData.lead,
      name: formData.name,
      systemSize: Number(formData.systemSize) || 0,
      panelCount: Number(formData.panelCount) || 0,
      equipment: formData.equipment
        .filter((eq) => eq.item && eq.quantity > 0) // Filter out incomplete items before mapping
        .map(({ item, quantity, unitPrice }) => ({
          item, // Already the ID string
          quantity: Number(quantity) || 1, // Ensure quantity is a number >= 1
          unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined, // Ensure unitPrice is number or undefined
        })),
      projectCostExcludingStructure:
        Number(formData.projectCostExcludingStructure) || 0,
      structureCost: Number(formData.structureCost) || 0,
      subsidyAmount: Number(formData.subsidyAmount) || 0,
      additionalCosts: Number(formData.additionalCosts) || 0,
      currency: formData.currency || 'INR', // Default if empty
      financingOptions: formData.financingOptions, // Add financing options to payload
      energyMeter: formData.energyMeter || '', // Add energy meter to payload
      notes: formData.notes || '',
      // proposalId is optional and might not be part of the initial creation payload structure expected by backend
      // Only include if it's explicitly part of the creation API contract
      // proposalId: formData.proposalId,
    };

    // Remove proposalId if it's empty or not intended for creation payload
    if (!formData.proposalId) {
      delete dataToSubmit.proposalId;
    }

    // Basic client-side check before submitting
    if (!dataToSubmit.lead) {
      console.error('Submission Error: Lead ID is missing.');
      // Optionally show a user-friendly error message here
      return; // Prevent submission
    }
    if (dataToSubmit.equipment.length === 0) {
      console.error(
        'Submission Error: At least one valid equipment item is required.'
      );
      // Optionally show a user-friendly error message here
      return; // Prevent submission
    }
    if (dataToSubmit.equipment.some((eq) => !eq.item)) {
      console.error('Submission Error: An equipment item is missing its ID.');
      // Optionally show a user-friendly error message here
      return; // Prevent submission
    }

    onSubmit(dataToSubmit);
  };

  // Helper to get all inventory items for the general Autocomplete
  const allInventoryItems = [
    ...inventory.panel,
    ...inventory.inverter,
    ...inventory.battery,
    ...inventory.other,
  ];

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
                label="Energy Meter Details"
                name="energyMeter"
                value={formData.energyMeter || ''}
                onChange={handleChange}
                helperText="e.g., L&T Schneider elect, Single directional meter"
              />
            </Grid>
            {/* Removed Panel Type, Inverter Type, Battery Type/Count/Checkbox */}

            {/* Equipment Selection Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Equipment
              </Typography>
            </Grid>
            {formData.equipment.map((equipItem, index) => (
              <Grid
                container
                item
                spacing={2}
                key={index}
                xs={12}
                alignItems="center"
              >
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={allInventoryItems}
                    getOptionLabel={(option) =>
                      `${option.name} (${option.category}) - ${option.modelNumber || 'N/A'}`
                    }
                    value={
                      allInventoryItems.find(
                        (inv) => inv._id === equipItem.item
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      handleEquipmentChange(index, 'item', newValue)
                    }
                    loading={inventoryLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Equipment"
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {inventoryLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option._id === value._id
                    }
                  />
                </Grid>
                <Grid item xs={8} sm={4}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={equipItem.quantity}
                    onChange={(e) =>
                      handleEquipmentChange(index, 'quantity', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={4} sm={2}>
                  <IconButton
                    onClick={() => removeEquipmentItem(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addEquipmentItem}
                disabled={inventoryLoading}
              >
                Add Equipment Item
              </Button>
            </Grid>

            {/* Removed Production & Savings Estimates */}

            {/* New Pricing Structure */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Pricing Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                // Match label from image (A)
                label={`A. Project cost (EXCLUDING STRUCTURE COST) (${formData.currency})`}
                name="projectCostExcludingStructure"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.projectCostExcludingStructure}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                // Match label from image (B)
                label={`B. Structure Cost (${formData.currency})`}
                name="structureCost"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.structureCost}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                // Match label from image
                label={`SUBSIDY : PM SURYA GHAR (${formData.currency})`}
                name="subsidyAmount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.subsidyAmount}
                onChange={handleNumberChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                // Match label from image
                label={`KSEB Feasibility, Registration, etc. (${formData.currency})`}
                name="additionalCosts"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.additionalCosts}
                onChange={handleNumberChange}
              />
            </Grid>
            {/* Display calculated fields (read-only) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`FINAL PROJET COST (A+B) (${formData.currency})`}
                value={
                  (formData.projectCostExcludingStructure || 0) +
                  (formData.structureCost || 0)
                }
                InputProps={{ readOnly: true }}
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`Net investment (${formData.currency})`}
                value={
                  (formData.projectCostExcludingStructure || 0) +
                  (formData.structureCost || 0) -
                  (formData.subsidyAmount || 0)
                }
                InputProps={{ readOnly: true }}
                type="number"
              />
            </Grid>

            {/* Financing Options Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
                Financing Options
              </Typography>
            </Grid>
            {formData.financingOptions.map((option, index) => (
              <Grid
                container
                item
                spacing={2}
                key={index}
                xs={12}
                alignItems="center"
                sx={{
                  borderTop: index > 0 ? '1px solid #eee' : 'none',
                  pt: index > 0 ? 2 : 0,
                  mt: index > 0 ? 1 : 0,
                }}
              >
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={option.type}
                      label="Type"
                      onChange={(e) =>
                        handleFinancingChange(index, 'type', e.target.value)
                      }
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="loan">Loan</MenuItem>
                      <MenuItem value="lease">Lease</MenuItem>
                      <MenuItem value="ppa">PPA</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Provider (e.g., Bank Name)"
                    value={option.provider || ''}
                    onChange={(e) =>
                      handleFinancingChange(index, 'provider', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Term (Years)"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={option.termYears || ''}
                    onChange={(e) =>
                      handleFinancingChange(index, 'termYears', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Interest Rate (%)"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={option.interestRate || ''}
                    onChange={(e) =>
                      handleFinancingChange(
                        index,
                        'interestRate',
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label={`Down Payment (${formData.currency})`}
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={option.downPayment || ''}
                    onChange={(e) =>
                      handleFinancingChange(
                        index,
                        'downPayment',
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label={`Monthly Payment (${formData.currency})`}
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={option.monthlyPayment || ''}
                    onChange={(e) =>
                      handleFinancingChange(
                        index,
                        'monthlyPayment',
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={10}>
                  <TextField
                    fullWidth
                    label="Financing Notes"
                    value={option.notes || ''}
                    onChange={(e) =>
                      handleFinancingChange(index, 'notes', e.target.value)
                    }
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'right' }}>
                  <IconButton
                    onClick={() => removeFinancingOption(index)}
                    color="error"
                    title="Remove Option"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button startIcon={<AddIcon />} onClick={addFinancingOption}>
                Add Financing Option
              </Button>
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
