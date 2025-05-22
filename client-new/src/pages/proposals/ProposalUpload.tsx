import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import * as proposalService from '../../api/proposalService'; // Use namespace import
import PageHeader from '../../components/common/PageHeader'; // Assuming PageHeader component exists

const DropzoneContainer = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  transition: theme.transitions.create(['border-color', 'background-color']),
  minHeight: 150,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ProposalUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Basic validation (can add more specific checks)
      if (
        file.type === 'application/pdf' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setSelectedFile(file);
        setError(null); // Clear previous errors
      } else {
        setError('Invalid file type. Please upload a PDF or XLSX file.');
        setSelectedFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // const ingestedProposal = await proposalService.default.uploadProposal(selectedFile);
      await proposalService.default.uploadProposal(selectedFile);
      setUploading(false);
      enqueueSnackbar('Proposal uploaded and ingested successfully!', {
        variant: 'success',
      });
      // Optionally navigate to the details page of the newly ingested proposal
      // navigate(`/proposals/${ingestedProposal._id}`);
      // Or navigate back to the list
      navigate('/proposals');
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Upload failed. Check console for details.';
      setError(`Upload failed: ${errorMsg}`);
      setUploading(false);
      enqueueSnackbar(`Upload failed: ${errorMsg}`, { variant: 'error' });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Box>
      <PageHeader title="Upload Proposal" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DropzoneContainer {...getRootProps()} elevation={0}>
        <input {...getInputProps()} />
        <CloudUploadIcon
          sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
        />
        {isDragActive ? (
          <Typography>Drop the file here ...</Typography>
        ) : (
          <Typography>
            Drag 'n' drop a PDF or XLSX file here, or click to select file
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Supported formats: .pdf, .xlsx
        </Typography>
      </DropzoneContainer>

      {selectedFile && (
        <Paper
          sx={{
            p: 2,
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          elevation={1}
        >
          <Typography>
            Selected: {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </Typography>
          <IconButton
            onClick={handleRemoveFile}
            size="small"
            title="Remove file"
          >
            <CloseIcon />
          </IconButton>
        </Paper>
      )}

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={
            uploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudUploadIcon />
            )
          }
        >
          {uploading ? 'Uploading...' : 'Upload and Ingest'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProposalUpload;
