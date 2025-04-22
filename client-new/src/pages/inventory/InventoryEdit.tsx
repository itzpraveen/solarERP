import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import InventoryForm from '../../features/inventory/components/InventoryForm';
import PageHeader from '../../components/common/PageHeader';

const InventoryEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get the inventory ID from URL params

  // onSave is called by InventoryForm after successful save
  const handleSave = () => {
    console.log(
      `Inventory item ${id} saved successfully (via InventoryForm). Navigating back.`
    );
    // Navigate back to the list page after save
    navigate('/inventory');
  };

  const handleClose = () => {
    // Navigate back to the list page if the form is closed/cancelled
    navigate('/inventory');
  };

  // Ensure id is available before rendering the form
  if (!id) {
    // Optionally, redirect or show an error message if ID is missing
    return <Typography color="error">Inventory ID is missing.</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <PageHeader title={`Edit Inventory Item`} />{' '}
      {/* Can enhance title later if needed */}
      <Box sx={{ mt: 3 }}>
        {/* Render InventoryForm for editing, passing the ID and handlers */}
        <InventoryForm
          inventoryId={id}
          onSave={handleSave}
          onClose={handleClose}
        />
      </Box>
    </Container>
  );
};

export default InventoryEdit;
