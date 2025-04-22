import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material'; // Removed Typography
import InventoryForm from '../../features/inventory/components/InventoryForm';
import PageHeader from '../../components/common/PageHeader';
// import { InventoryItem } from '../../api/inventoryService'; // Removed unused import

const InventoryAdd: React.FC = () => {
  const navigate = useNavigate();

  // onSave is called by InventoryForm after successful save, no item data needed here
  const handleSave = () => {
    console.log(
      'Inventory item saved successfully (via InventoryForm). Navigating back.'
    );
    // Navigate back to the list page after save
    navigate('/inventory');
  };

  const handleClose = () => {
    // Navigate back to the list page if the form is closed/cancelled
    navigate('/inventory');
  };

  return (
    <Container maxWidth="lg">
      <PageHeader title="Add New Inventory Item" />
      <Box sx={{ mt: 3 }}>
        {/* Render InventoryForm, passing the required handlers */}
        <InventoryForm onSave={handleSave} onClose={handleClose} />
      </Box>
    </Container>
  );
};

export default InventoryAdd;
