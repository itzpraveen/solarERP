import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material'; // Import Container
import PageHeader from '../../components/common/PageHeader';
import DataTable, {
  Column as DataTableColumn,
} from '../../components/common/DataTable';
import ContentCard from '../../components/common/ContentCard'; // Import ContentCard
import inventoryService, { InventoryItem } from '../../api/inventoryService';

const InventoryList: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  // Explicitly type the state with InventoryItem[]
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const result = await inventoryService.getAllInventory();
        // Ensure the result is an array before setting state
        if (Array.isArray(result)) {
          setInventory(result);
        } else {
          console.warn('Received non-array data from getAllInventory:', result);
          setInventory([]); // Default to empty array if data is not as expected
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch inventory');
        setInventory([]); // Also set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Removed local InventoryItem and RenderCellParams interfaces

  // Define columns according to DataTable's Column interface
  const columns: DataTableColumn<InventoryItem>[] = [
    // Use DataTable's Column type
    { id: 'name', label: 'Name', minWidth: 170 }, // Use minWidth/maxWidth instead of width/flex
    { id: 'quantity', label: 'Quantity', minWidth: 100, align: 'right' }, // Added align
    {
      id: 'unitPrice',
      label: 'Unit Price',
      minWidth: 150,
      align: 'right', // Added align
      format: (value: number) => `₹${value.toFixed(2)}`, // Changed $ to ₹
    },
    // Add more columns as needed
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      align: 'center', // Center align actions
      sortable: false,
      format: (
        _: any,
        row: InventoryItem // Explicitly type row as InventoryItem
      ) => (
        <Box>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row._id);
            }}
          >
            Edit
          </Button>{' '}
          {/* Added stopPropagation */}
          <Button
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
          >
            Delete
          </Button>{' '}
          {/* Added stopPropagation */}
        </Box>
      ),
    },
  ];

  const handleEdit = (id: string) => {
    console.log('Edit inventory item:', id);
    // Navigate to an edit page (adjust path as needed)
    navigate(`/inventory/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    // Optional: Add a confirmation dialog here
    console.log('Delete inventory item:', id);
    try {
      await inventoryService.deleteInventory(id);
      // Refresh inventory list after deletion, ensuring it's an array
      const result = await inventoryService.getAllInventory();
      if (Array.isArray(result)) {
        setInventory(result);
      } else {
        console.warn('Received non-array data after delete refresh:', result);
        setInventory([]);
      }
    } catch (err: any) {
      console.error('Failed to delete inventory item:', err);
      // Show an error message to the user
      alert(
        `Failed to delete inventory item: ${err.message || 'Unknown error'}`
      );
    }
  };

  const handleAddInventory = () => {
    console.log('Add new inventory item');
    // Navigate to an add page (adjust path as needed)
    navigate('/inventory/add');
  };

  if (loading) {
    return <Typography>Loading inventory...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container maxWidth="xl">
      {' '}
      {/* Use Container for consistent padding */}
      <PageHeader
        title="Inventory"
        action={
          <Button variant="contained" onClick={handleAddInventory}>
            Add Inventory Item
          </Button>
        }
      />
      {/* Wrap DataTable in ContentCard */}
      <Box sx={{ mt: 3 }}>
        {' '}
        {/* Add margin top */}
        <ContentCard noPadding>
          {' '}
          {/* Use noPadding since DataTable has its own Paper */}
          <DataTable
            data={inventory}
            columns={columns}
            keyField="_id"
            loading={loading} // Pass loading state to DataTable
            // onRefresh={handleRefresh} // Optional: Add refresh button
          />
        </ContentCard>
      </Box>
    </Container>
  );
};

export default InventoryList;
