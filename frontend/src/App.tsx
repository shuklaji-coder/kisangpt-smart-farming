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

// Mobile-first farmer-friendly theme
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
      light: '#60ad5e',
      dark: '#005005',
    },
    secondary: {
      main: '#4caf50', // Light Green
      light: '#80e27e',
      dark: '#087f23',
    },
    background: {
      default: '#f1f8e9', // Very light green background
      paper: '#ffffff',
    },
    text: {
      primary: '#1b5e20',
      secondary: '#2e7d32',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    // Mobile-first typography
    h1: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1b5e20',
      lineHeight: 1.2,
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:768px)': {
        fontSize: '2.2rem',
      },
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1b5e20',
      lineHeight: 1.3,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.8rem',
      },
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#2e7d32',
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1.4rem',
      },
      '@media (min-width:768px)': {
        fontSize: '1.5rem',
      },
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: 600,
      textTransform: 'none',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  shape: {
    borderRadius: 12,
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
    // Mobile-optimized cards
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'transform .2s ease, box-shadow .2s ease',
          marginBottom: '16px',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            '@media (min-width: 768px)': {
              transform: 'translateY(-4px)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.15)',
            },
          }
        },
      },
    },
    // Mobile-responsive paper
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.06)'
        }
      }
    },
    // Touch-friendly buttons
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.9rem',
          fontWeight: 600,
          borderRadius: 25,
          padding: '12px 20px',
          minHeight: '44px', // Touch target
          touchAction: 'manipulation',
          '@media (min-width: 600px)': {
            fontSize: '1rem',
            padding: '10px 18px',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #2e7d32, #66bb6a)',
          color: '#fff',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #1e88e5, #64b5f6)',
          color: '#fff',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        outlined: {
          borderColor: 'rgba(46, 125, 50, 0.35)'
        }
      }
    },
    // Touch-friendly icon buttons
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          minWidth: '48px',
          touchAction: 'manipulation',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          backgroundColor: '#fff'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
        }
      }
    }
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
