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
import WeatherForecast from './components/WeatherForecast';
import MarketAnalysis from './components/MarketAnalysis';
import AIChatbot from './components/AIChatbot';
import FloatingChatbot from './components/FloatingChatbot';
import SatelliteFieldView from './components/SatelliteFieldView';
import ARPlantVisualization from './components/ARPlantVisualization';
import RainAlertSettings from './components/RainAlertSettings';
import AuthPage from './components/AuthPage';
import TestPage from './components/TestPage';
import Footer from './components/Footer';
import { authAPI } from './services/api';

// Farmer-friendly theme with green agricultural colors
const theme = createTheme({
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
    h1: {
      fontSize: '2.2rem',
      fontWeight: 600,
      color: '#1b5e20',
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 500,
      color: '#1b5e20',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#2e7d32',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          borderRadius: 25,
          padding: '10px 24px',
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
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dream-visualization" element={<DreamVisualization />} />
          <Route path="/community" element={<CommunityNetwork />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/crop-recommendation" element={<CropRecommendation />} />
          <Route path="/weather" element={<WeatherForecast />} />
          <Route path="/market-analysis" element={<MarketAnalysis />} />
          <Route path="/ai-chat" element={<AIChatbot />} />
          <Route path="/satellite-view" element={<SatelliteFieldView />} />
          <Route path="/ar-visualization" element={<ARPlantVisualization />} />
          <Route path="/rain-alerts" element={<RainAlertSettings />} />
        </Routes>
      </Container>
      {/* Footer with Developer Credits */}
      <Footer />
      {/* Floating Chatbot - Available on all pages except login */}
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
