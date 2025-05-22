import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  PhotoCamera,
  Close as CloseIcon,
  Check as CheckIcon,
  AddAPhoto as AddPhotoIcon,
  FlipCameraAndroid as FlipCameraIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import documentService from '../../api/documentService';

// Photo types/categories
const PHOTO_TYPES = [
  { value: 'site_survey', label: 'Site Survey' },
  { value: 'installation_progress', label: 'Installation Progress' },
  { value: 'installation_complete', label: 'Installation Complete' },
  { value: 'issue_documentation', label: 'Issue Documentation' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'site_conditions', label: 'Site Conditions' },
  { value: 'other', label: 'Other' },
];

// Main component
const FieldPhotoCaptureView: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const [photoType, setPhotoType] = useState('');
  const [description, setDescription] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dropzone for file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
  });

  // Camera functionality
  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Start a new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      setOpenCamera(true);
    } catch (err) {
      setError(
        'Failed to access camera. Please check your camera permissions.'
      );
      console.error('Camera access error:', err);
    }
  };

  // Switch camera
  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
    // Restart camera with new facing mode
    if (openCamera) {
      startCamera();
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        setOpenCamera(false);

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      }
    }
  };

  // Close camera
  const handleCloseCamera = () => {
    setOpenCamera(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Upload photo
  const handleUpload = async () => {
    if (!capturedImage || !photoType) {
      setError('Please capture an image and select a photo type');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'photo.jpg');
      formData.append('type', photoType);
      formData.append(
        'name',
        description ||
          `${PHOTO_TYPES.find((t) => t.value === photoType)?.label} Photo`
      );

      if (projectId) {
        formData.append('projectId', projectId);
      }

      // Upload to server
      await documentService.uploadDocument(formData);

      setSuccess(true);
      setTimeout(() => {
        navigate(projectId ? `/projects/${projectId}` : '/photos');
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Validation
  const isValid = capturedImage && photoType;

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Capture Project Photo
      </Typography>

      {projectId && (
        <Typography variant="subtitle1" color="primary" gutterBottom>
          Project ID: {projectId}
        </Typography>
      )}

      {/* Photo preview area */}
      <Paper
        sx={{
          p: 2,
          mt: 2,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 200,
          backgroundColor: theme.palette.grey[50],
          border: `1px dashed ${theme.palette.grey[400]}`,
        }}
      >
        {capturedImage ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: 4,
              }}
            />
            <IconButton
              onClick={() => setCapturedImage(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : openCamera ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: 400, borderRadius: 4 }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCloseCamera}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={toggleCamera}
                startIcon={<FlipCameraIcon />}
              >
                Switch Camera
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={capturePhoto}
                startIcon={<PhotoCamera />}
              >
                Capture
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            {/* Dropzone */}
            <Box
              {...getRootProps()}
              sx={{
                border: `2px dashed ${theme.palette.primary.main}`,
                borderRadius: 2,
                p: 3,
                mb: 2,
                backgroundColor: isDragActive
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <input {...getInputProps()} />
              <AddPhotoIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? 'Drop the photo here...'
                  : 'Drag & drop a photo here, or click to select'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports: JPG, PNG, GIF
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Or
            </Typography>

            <Button
              variant="contained"
              color="primary"
              startIcon={<PhotoCamera />}
              onClick={startCamera}
              fullWidth
            >
              Open Camera
            </Button>
          </Box>
        )}
      </Paper>

      {/* Photo details form */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="photo-type-label">Photo Type *</InputLabel>
        <Select
          labelId="photo-type-label"
          value={photoType}
          onChange={(e) => setPhotoType(e.target.value)}
          label="Photo Type *"
          disabled={uploading}
          error={!photoType && capturedImage !== null}
        >
          {PHOTO_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
        {!photoType && capturedImage !== null && (
          <FormHelperText error>Please select a photo type</FormHelperText>
        )}
      </FormControl>

      <TextField
        label="Description (optional)"
        multiline
        rows={3}
        fullWidth
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={uploading}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!isValid || uploading}
        onClick={handleUpload}
        startIcon={uploading ? <CircularProgress size={24} /> : <CheckIcon />}
        sx={{ py: 1.5 }}
      >
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </Button>

      {/* Error and success messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000}>
        <Alert severity="success">Photo uploaded successfully!</Alert>
      </Snackbar>

      {/* Camera Dialog */}
      <Dialog
        open={openCamera}
        onClose={handleCloseCamera}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Capture Photo</DialogTitle>
        <DialogContent>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: 4 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCamera} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={toggleCamera}
            startIcon={<FlipCameraIcon />}
          >
            Switch Camera
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={capturePhoto}
            startIcon={<PhotoCamera />}
          >
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FieldPhotoCaptureView;
