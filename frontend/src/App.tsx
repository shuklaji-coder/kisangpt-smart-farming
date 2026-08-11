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

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 840, lg: 1024, xl: 1280 },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#052e1b',
    },
    secondary: {
      main: '#2dd4bf',
      light: '#5eead4',
      dark: '#0d9488',
      contrastText: '#042f2e',
    },
    success: { main: '#4ade80' },
    warning: { main: '#fbbf24' },
    error: { main: '#f87171' },
    info: { main: '#38bdf8' },
    background: {
      default: '#0a0f0d',
      paper: '#101a15',
    },
    text: {
      primary: '#ecfdf5',
      secondary: '#a7b8ae',
    },
    divider: 'rgba(255, 255, 255, 0.09)',
  },
  typography: {
    fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
    h1: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1.05 },
    h2: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-0.03em', lineHeight: 1.08 },
    h3: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontWeight: 700, fontSize: '2.2rem', lineHeight: 1.15 },
    h4: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.2 },
    h5: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.3 },
    h6: { fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' },
    subtitle1: { fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif", fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.75, color: '#a7b8ae' },
    body2: { fontSize: '0.94rem', lineHeight: 1.7, color: '#8fa39a' },
    button: { fontFamily: "'Outfit', 'Noto Sans Devanagari', sans-serif", fontSize: '0.98rem', fontWeight: 700, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 28 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          backgroundColor: '#0a0f0d',
          color: '#ecfdf5',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          background: 'rgba(13, 20, 17, 0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.55)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': { paddingLeft: '32px', paddingRight: '32px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          background: 'rgba(20, 30, 25, 0.66)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 26px 70px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          background: 'rgba(18, 27, 22, 0.78)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: '52px',
          padding: '12px 28px',
          transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          '&:active': { transform: 'scale(0.96)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #34d399 0%, #0d9488 100%)',
          color: '#052e1b',
          boxShadow: '0 14px 26px rgba(52, 211, 153, 0.22)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6ee7b7 0%, #0d9488 100%)',
            boxShadow: '0 18px 32px rgba(52, 211, 153, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(52, 211, 153, 0.35)',
          color: '#ecfdf5',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          '&:hover': { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: '#34d399' },
        },
        text: {
          color: '#ecfdf5',
          '&:hover': {
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 18px 40px rgba(52, 211, 153, 0.25)',
          transition: 'transform 0.24s ease, box-shadow 0.24s ease',
          '&:hover': {
            transform: 'scale(1.07)',
            boxShadow: '0 24px 52px rgba(52, 211, 153, 0.35)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          '&.Mui-focused': {
            background: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 0 4px rgba(52, 211, 153, 0.14)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: '#34d399' },
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': { borderColor: '#34d399' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
          textTransform: 'none',
          letterSpacing: '0.01em',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: 'rgba(16, 26, 21, 0.96)',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: '12px',
          background: 'rgba(16, 26, 21, 0.98)',
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
      <div className="noise-overlay" />
      <Navbar />
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 3, sm: 5, md: 6 },
          mb: { xs: 12, sm: 10 },
          px: { xs: 2, sm: 4, md: 6 },
          position: 'relative',
          zIndex: 1,
          minHeight: 'calc(100vh - 140px)',
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
          <Typography sx={{ mt: 2, fontWeight: 700, color: '#34d399' }}>KisanGPT लोड हो रहा है...</Typography>
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
