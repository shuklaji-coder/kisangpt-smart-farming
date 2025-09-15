import React, { useState, useEffect } from 'react';
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
    <AnimatePresence mode="wait">
      {currentView === 'login' ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <LoginForm
            onLogin={handleLogin}
            onSignUp={handleSwitchToSignUp}
          />
        </motion.div>
      ) : (
        <motion.div
          key="signup"
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <SignUpForm
            onSignUp={handleSignUp}
            onBackToLogin={handleSwitchToLogin}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthPage;