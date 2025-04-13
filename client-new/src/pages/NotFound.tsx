import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { SentimentVeryDissatisfied as SadIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <SadIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            404 - Page Not Found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            paragraph
          >
            The page you are looking for doesn't exist or has been moved.
          </Typography>
          <Button
            component={Link}
            to="/dashboard"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
