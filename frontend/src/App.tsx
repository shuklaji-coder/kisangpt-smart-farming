import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DreamVisualization from './components/DreamVisualization';
import CommunityNetwork from './components/CommunityNetwork';
import DiseaseDetection from './components/DiseaseDetection';
import CropRecommendation from './components/CropRecommendation';
import EnhancedCropRecommendation from './components/EnhancedCropRecommendation';
import AdvancedCropRecommendation from './components/AdvancedCropRecommendation';
import WeatherForecast from './components/WeatherForecast';
import MarketAnalysis from './components/MarketAnalysis';
import GovernmentSubsidy from './components/GovernmentSubsidy';
import LoanApplication from './components/LoanApplication';
import QuickHelp from './components/QuickHelp';
import AIChatbot from './components/AIChatbot';
import FloatingChatbot from './components/FloatingChatbot';
import ErrorBoundary from './components/ErrorBoundary';
import SatelliteFieldView from './components/SatelliteFieldView';
import ARPlantVisualization from './components/ARPlantVisualization';
import RainAlertSettings from './components/RainAlertSettings';
import AuthPage from './components/AuthPage';
import TestPage from './components/TestPage';
import Footer from './components/Footer';
import MobileNavigation from './components/MobileNavigation';
import { authAPI } from './services/api';

// Premium KisanGPT design system
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 992,
      xl: 1200,
    },
  },
  palette: {
    primary: {
      main: '#2e7d32', // Forest Green
      light: '#5cb860',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8bc34a', // Lime Green
      light: '#bef67a',
      dark: '#649f2d',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ffa000',
    },
    error: {
      main: '#e53935',
    },
    info: {
      main: '#039be5',
    },
    background: {
      default: '#f6fbf3',
      paper: '#ffffff',
    },
    text: {
      primary: '#22331f',
      secondary: '#5a6b57',
    },
    divider: 'rgba(46, 125, 50, 0.12)',
  },
  typography: {
    fontFamily: "'Inter', 'Noto Sans Devanagari', 'Roboto', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#1b5e20',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:768px)': {
        fontSize: '2.3rem',
      },
    },
    h2: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1b5e20',
      lineHeight: 1.3,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.9rem',
      },
    },
    h3: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#2e7d32',
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1.4rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.65,
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.55,
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    button: {
      fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  shape: {
    borderRadius: 14,
  },
  spacing: 8, // 8px base spacing
  components: {
    // Mobile-first container
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    // Premium cards
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 8px 30px rgba(31, 82, 38, 0.08)',
          border: '1px solid rgba(46, 125, 50, 0.08)',
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 45px rgba(31, 82, 38, 0.16)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { paddingBottom: '16px' },
        },
      },
    },
    // Premium paper
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(46, 125, 50, 0.08)',
        },
        rounded: {
          borderRadius: 18,
        },
      },
    },
    // Buttons: pill + gradient primary, smooth press
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.9rem',
          fontWeight: 600,
          fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
          borderRadius: 14,
          padding: '10px 22px',
          minHeight: '46px',
          touchAction: 'manipulation',
          transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, background 0.2s ease',
          '&:active': {
            transform: 'scale(0.97)',
          },
          '@media (min-width: 600px)': {
            fontSize: '0.95rem',
            padding: '10px 24px',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 55%, #66bb6a 100%)',
          backgroundSize: '150% auto',
          color: '#fff',
          boxShadow: '0 10px 24px rgba(27, 94, 32, 0.3)',
          '&:hover': {
            backgroundPosition: 'right center',
            boxShadow: '0 14px 32px rgba(27, 94, 32, 0.4)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)',
          color: '#fff',
          boxShadow: '0 10px 24px rgba(30, 136, 229, 0.3)',
          '&:hover': {
            boxShadow: '0 14px 32px rgba(30, 136, 229, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(46, 125, 50, 0.4)',
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.06)',
            borderColor: 'rgba(46, 125, 50, 0.6)',
          },
        },
      },
    },
    // Touch-friendly icon buttons
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: '46px',
          minWidth: '46px',
          touchAction: 'manipulation',
          transition: 'transform 0.2s ease, background 0.2s ease',
          '&:hover': {
            transform: 'scale(1.06)',
          },
        },
      },
    },
    // Text fields: soft rounded, green focus ring
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: '#2e7d32',
          },
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(46, 125, 50, 0.6)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'medium',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 26px rgba(27, 94, 32, 0.35)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: '0 16px 34px rgba(27, 94, 32, 0.45)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          fontSize: '0.8rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          backgroundColor: '#1b5e20',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: 'rgba(46, 125, 50, 0.12)',
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 18px 50px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 6px 24px rgba(31, 82, 38, 0.08)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '8px 0',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
        },
      },
    },
  },
});

// Component to handle authentication and routing
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  
  if (isLoginPage) {
    return <AuthPage />;
  }
  
  return (
    <div className="app-background">
      <Navbar />
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 1, sm: 2 }, 
          mb: { xs: 10, sm: 4 }, // Extra bottom margin for mobile nav
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="page-enter">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dream-visualization" element={<DreamVisualization />} />
            <Route path="/community" element={<CommunityNetwork />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/enhanced-crop-recommendation" element={<EnhancedCropRecommendation />} />
            <Route path="/advanced-crop-recommendation" element={<AdvancedCropRecommendation />} />
            <Route path="/government-subsidy" element={<GovernmentSubsidy />} />
            <Route path="/weather" element={<WeatherForecast />} />
            <Route path="/market-analysis" element={<MarketAnalysis />} />
            <Route path="/ai-chat" element={<ErrorBoundary><AIChatbot /></ErrorBoundary>} />
            {/* Route aliases for convenience */}
            <Route path="/ai-assistant" element={<ErrorBoundary><AIChatbot /></ErrorBoundary>} />
            <Route path="/assistant" element={<ErrorBoundary><AIChatbot /></ErrorBoundary>} />
            <Route path="/satellite-view" element={<SatelliteFieldView />} />
            <Route path="/ar-visualization" element={<ARPlantVisualization />} />
            <Route path="/rain-alerts" element={<RainAlertSettings />} />
            <Route path="/loans" element={<LoanApplication />} />
            <Route path="/help" element={<QuickHelp />} />
          </Routes>
        </div>
      </Container>
      
      {/* Mobile Navigation - Shows only on mobile */}
      <MobileNavigation />
      
      {/* Footer with Developer Credits */}
      <Footer />
      
      {/* Floating Chatbot - Available on all pages except login, hidden on mobile */}
      <FloatingChatbot />
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Changed to false to skip loading
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          // Get stored user data
          const storedUser = authAPI.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // Try to get user data from backend
            const userData = await authAPI.getCurrentUser();
            if (userData.success) {
              setUser(userData.user);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.log('Authentication check failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle successful authentication
  const handleAuthenticated = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  if (isLoading) {
    return (
      <div className="app-background" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 56, animation: 'floatY 2.5s ease-in-out infinite' }}>🌾</Box>
          <Typography sx={{ mt: 2, fontWeight: 700, color: '#2e7d32' }}>KisanGPT लोड हो रहा है...</Typography>
        </Box>
      </div>
    );
  }
  
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            {!isAuthenticated ? (
              <Routes>
                <Route path="*" element={<AuthPage onAuthenticated={handleAuthenticated} />} />
              </Routes>
            ) : (
              <AppContent />
            )}
          </div>
        </Router>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
