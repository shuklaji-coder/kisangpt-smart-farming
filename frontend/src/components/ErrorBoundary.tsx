import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Home } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error details for debugging
    // In production, send to monitoring (Sentry, etc.)
    // eslint-disable-next-line no-console
    console.error('AI Chat crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ py: 6 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Something went wrong in AI Chat
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please try again, or go back to the dashboard. If the issue persists, refresh the page.
            </Typography>
            <Button
              startIcon={<Home />}
              variant="contained"
              component={RouterLink}
              to="/"
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children as React.ReactNode;
  }
}

export default ErrorBoundary;
