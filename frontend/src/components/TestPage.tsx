import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const TestPage: React.FC = () => {
  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: '#f5f5f5'
      }}
    >
      <Typography variant="h2" color="primary">
        🌾 KisanGPT Test Page
      </Typography>
      <Typography variant="body1">
        Frontend is working! अब login page दिखना चाहिए।
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => console.log('Button clicked!')}
      >
        Test Button
      </Button>
    </Box>
  );
};

export default TestPage;