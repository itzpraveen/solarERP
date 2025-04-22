import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 2,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Something went wrong.
          </Typography>
          <Typography variant="body1" gutterBottom>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReload}
          >
            Reload
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
