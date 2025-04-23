import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, IconButton, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ProjectForm from '../../features/projects/components/ProjectForm';
import { useSnackbar } from 'notistack'; // For success notifications

const ProjectAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  // Extract proposalId from URL query parameters
  const [initialProposalId, setInitialProposalId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const proposalId = searchParams.get('proposalId');
    setInitialProposalId(proposalId);
  }, [location.search]);

  const handleCloseForm = () => {
    // Navigate back to the projects list or previous page when closing
    navigate('/projects');
  };

  const handleSubmitSuccess = (newProjectId: string) => {
    enqueueSnackbar('Project created successfully!', { variant: 'success' });
    // Navigate to the newly created project's detail page
    navigate(`/projects/${newProjectId}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
       {/* Breadcrumbs */}
       <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink color="inherit" href="/dashboard" underline="hover">
          Dashboard
        </MuiLink>
        <MuiLink color="inherit" href="/projects" underline="hover">
          Projects
        </MuiLink>
        <Typography color="text.primary">Add Project</Typography>
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
          <IconButton sx={{ mr: 1 }} onClick={() => navigate('/projects')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {initialProposalId ? 'Create Project from Proposal' : 'Add New Project'}
          </Typography>
        </Box>
      </Box>

      {/* Render the form directly on the page */}
      {/* We control visibility via routing, not a dialog state here */}
      <Paper sx={{ p: 3 }}>
         {/* Pass necessary props to ProjectForm */}
         {/* Since the form isn't in a dialog controlled by this page's state,
             we pass 'true' for open and handle close via navigation */}
        <ProjectForm
          open={true} // Form is always "open" when on this page
          onClose={handleCloseForm} // Navigate back on close attempt
          onSubmitSuccess={handleSubmitSuccess}
          initialProposalId={initialProposalId}
        />
         {/* Add a cancel button outside the form component if needed */}
         {/* <Button onClick={handleCloseForm} sx={{ mt: 2 }}>Cancel</Button> */}
      </Paper>

       {/*
         Note: The ProjectForm component itself is designed as a Dialog.
         Rendering it directly might look slightly off.
         A cleaner approach might be to refactor ProjectForm to be a
         plain form component and wrap it in a Dialog *only* when needed
         (e.g., opening from the Projects list page).
         However, for this implementation, we'll render it directly.
         The form's internal Dialog structure will be ignored when rendered here.
         We might need to adjust ProjectForm later if this causes layout issues.
       */}
    </Box>
  );
};

export default ProjectAdd;
