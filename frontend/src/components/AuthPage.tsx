import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, GlobalStyles } from '@mui/material';
import { Agriculture } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { googleAuthAPI, authAPI } from '../services/api';

interface AuthPageProps {
  onAuthenticated?: (userData: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    
    if (urlParams.get('token') || urlParams.get('error')) {
      googleAuthAPI.handleCallback(urlParams)
        .then((result: any) => {
          if (result.success) {
            console.log('Google OAuth successful:', result.user);
            if (onAuthenticated) {
              onAuthenticated(result.user);
            }
            navigate('/');
          }
        })
        .catch((error) => {
          console.error('OAuth callback error:', error);
        });
    }
  }, [location, navigate, onAuthenticated]);

  const handleLogin = (user: any) => {
    console.log('Login successful:', user);
    
    if (onAuthenticated) {
      onAuthenticated(user);
    }
    
    // Force page refresh to update authentication state
    window.location.href = '/';
  };

  const handleSignUp = (user: any) => {
    console.log('Signup successful:', user);
    
    if (onAuthenticated) {
      onAuthenticated(user);
    }
    
    // Force page refresh to update authentication state
    window.location.href = '/';
  };

  const handleSwitchToSignUp = () => {
    setCurrentView('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        width: '100vw', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 2000,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--mesh-gradient)',
        backgroundAttachment: 'fixed',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: -100, 
          right: -100, 
          width: 400, 
          height: 400, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(46,125,50,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 10s infinite alternate'
        }} 
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: -150, 
          left: -150, 
          width: 500, 
          height: 500, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(46,125,50,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'pulse 15s infinite alternate-reverse'
        }} 
      />

      <GlobalStyles styles={{
        '@keyframes pulse': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.2) translate(50px, 50px)' }
        }
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box 
            className="glass-panel" 
            sx={{ 
              p: { xs: 3, md: 6 }, 
              borderRadius: '32px',
              boxShadow: 'var(--premium-shadow)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              maxWidth: '520px',
              mx: 'auto'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Agriculture sx={{ fontSize: 56, color: 'var(--primary-green)', mb: 2 }} />
              </motion.div>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 900, 
                  letterSpacing: '-0.02em',
                  background: 'var(--premium-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                KisanGPT
              </Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 400, opacity: 0.8 }}>
                {currentView === 'login' ? 'किसान जी, वापस स्वागत है! 🙏' : 'आज ही किसान कम्युनिटी से जुड़ें! 🌾'}
              </Typography>
            </Box>

            <AnimatePresence mode="wait">
              {currentView === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm
                    onLogin={handleLogin}
                    onSignUp={handleSwitchToSignUp}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignUpForm
                    onSignUp={handleSignUp}
                    onBackToLogin={handleSwitchToLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AuthPage;