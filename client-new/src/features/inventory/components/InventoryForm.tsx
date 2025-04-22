import React, { useEffect } from 'react';
// Add Select, MenuItem, FormControl, InputLabel
import {
  Box,
  Button,
  TextField,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import inventoryService from '../../../api/inventoryService'; // Adjust path as needed

// Define the schema for inventory validation
// Define allowed categories
const categories = [
  'panel',
  'inverter',
  'battery',
  'racking',
  'wiring',
  'other',
] as const;

const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  // Add category to the schema
  category: z.enum(categories, { required_error: 'Category is required' }),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unitPrice: z.number().min(0, 'Unit Price cannot be negative'),
  // Add optional fields if they should be editable in the form
  supplier: z.string().optional(),
  modelNumber: z.string().optional(),
  // specifications might be too complex for a simple form, handle separately if needed
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  inventoryId?: string; // Optional ID for editing
  onClose: () => void;
  onSave: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  inventoryId,
  onClose,
  onSave,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'other', // Default category
      quantity: 0,
      unitPrice: 0,
      supplier: '',
      modelNumber: '',
    },
  });

  const isEditing = !!inventoryId;

  useEffect(() => {
    if (isEditing && inventoryId) {
      const fetchInventory = async () => {
        try {
          const inventoryData =
            await inventoryService.getInventory(inventoryId);
          reset(inventoryData); // Populate form with existing data
        } catch (error) {
          console.error('Failed to fetch inventory for editing:', error);
          // TODO: Show an error message to the user
        }
      };
      fetchInventory();
    } else {
      reset({
        // Reset form for new item including category
        name: '',
        description: '',
        category: 'other',
        quantity: 0,
        unitPrice: 0,
        supplier: '',
        modelNumber: '',
      });
    }
  }, [inventoryId, isEditing, reset]);

  const onSubmit = async (data: InventoryFormData) => {
    try {
      if (isEditing && inventoryId) {
        await inventoryService.updateInventory(inventoryId, data);
      } else {
        await inventoryService.createInventory(data);
      }
      onSave(); // Notify parent component to refresh list
      onClose(); // Close the form
    } catch (error) {
      console.error('Failed to save inventory:', error);
      // TODO: Show an error message to the user
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            // Add explicit type for field
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'name'>;
            }) => (
              <TextField
                {...field}
                label="Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                margin="normal"
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          {/* Category Field */}
          <Controller
            name="category"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'category'>;
            }) => (
              <FormControl fullWidth margin="normal" error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select {...field} label="Category">
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {/* Capitalize first letter for display */}
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <p
                    style={{
                      color: '#d32f2f',
                      fontSize: '0.75rem',
                      margin: '3px 14px 0',
                    }}
                  >
                    {errors.category.message}
                  </p>
                )}
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            // Add explicit type for field
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'description'>;
            }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
                margin="normal"
              />
            )}
          />
        </Grid>
        {/* Optional Fields */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="supplier"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'supplier'>;
            }) => (
              <TextField
                {...field}
                label="Supplier (Optional)"
                fullWidth
                margin="normal"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="modelNumber"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'modelNumber'>;
            }) => (
              <TextField
                {...field}
                label="Model Number (Optional)"
                fullWidth
                margin="normal"
              />
            )}
          />
        </Grid>
        {/* Quantity and Price */}
        <Grid item xs={6}>
          <Controller
            name="quantity"
            control={control}
            // Add explicit type for field
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'quantity'>;
            }) => (
              <TextField
                {...field}
                label="Quantity"
                type="number"
                fullWidth
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                } // Ensure number type
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="unitPrice"
            control={control}
            // Add explicit type for field
            render={({
              field,
            }: {
              field: ControllerRenderProps<InventoryFormData, 'unitPrice'>;
            }) => (
              <TextField
                {...field}
                label="Unit Price"
                type="number"
                fullWidth
                error={!!errors.unitPrice}
                helperText={errors.unitPrice?.message}
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: '0.01' } }}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                } // Ensure number type
              />
            )}
          />
        </Grid>
      </Grid>
      <DialogActions sx={{ mt: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Add Inventory'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default InventoryForm;
