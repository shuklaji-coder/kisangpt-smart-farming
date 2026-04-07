import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
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

// Premium modern theme with focus on readability and aesthetics
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
      main: '#2e7d32',
      light: '#43a047',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#fb8c00',
      light: '#ffb74d',
      dark: '#e65100',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: 'rgba(0,0,0,0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", sans-serif',
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#0f172a',
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1e293b',
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#334155',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
      color: '#64748b',
    },
    button: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.06)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.06)',
    ...Array(20).fill('0 25px 50px -12px rgba(0,0,0,0.25)'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          backgroundImage: `radial-gradient(at 0% 0%, hsla(145,44%,80%,0.15) 0, transparent 50%), 
                            radial-gradient(at 100% 100%, hsla(145,44%,80%,0.15) 0, transparent 50%)`,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 0px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.03)',
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid rgba(0,0,0,0.06)',
          background: '#ffffff',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            borderColor: 'rgba(46, 125, 50, 0.2)',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
          },
        },
        outlinedPrimary: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(46, 125, 50, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.08)',
            color: '#2e7d32',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          color: '#1e293b',
          boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          height: 32,
        },
        filledPrimary: {
          background: 'rgba(46, 125, 50, 0.1)',
          color: '#2e7d32',
          '&:hover': {
            background: 'rgba(46, 125, 50, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(0,0,0,0.08)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(46, 125, 50, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2e7d32',
              borderWidth: '2px',
            },
          },
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
    <>
      <Navbar />
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 1, sm: 2 }, 
          mb: { xs: 10, sm: 4 }, // Extra bottom margin for mobile nav
          px: { xs: 2, sm: 3 },
        }}
      >
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
      </Container>
      
      {/* Mobile Navigation - Shows only on mobile */}
      <MobileNavigation />
      
      {/* Footer with Developer Credits */}
      <Footer />
      
      {/* Floating Chatbot - Available on all pages except login, hidden on mobile */}
      <FloatingChatbot />
    </>
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
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
