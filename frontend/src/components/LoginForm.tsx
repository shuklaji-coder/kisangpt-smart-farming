import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  Agriculture,
  Email,
  Google,
  Facebook,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authAPI, googleAuthAPI } from '../services/api';

interface LoginFormProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onSignUp?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSignUp }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo users helper (used when backend is unavailable OR returns non-success)
  const tryDemoLogin = (email: string, password: string) => {
    const defaultDemoUsers = [
      { email: 'farmer@example.com', password: 'farmer123', name: 'रमेश कुमार', role: 'farmer' },
      { email: 'test@example.com', password: 'test123', name: 'टेस्ट यूजर', role: 'farmer' },
      { email: 'demo@kisangpt.com', password: 'demo123', name: 'डेमो किसान', role: 'farmer' },
      { email: 'admin@kisangpt.com', password: 'admin123', name: 'एडमिन', role: 'admin' }
    ];
    const registeredDemoUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
    const demoUsers = [...defaultDemoUsers, ...registeredDemoUsers];
    const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return null;
    const userData = {
      id: Date.now(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: '🧑‍🌾',
      location: 'Delhi, India',
      joinDate: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('authToken', 'demo-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Normalize inputs
    const email = (formData.email || '').trim();
    const password = (formData.password || '').trim();

    // Basic validation
    if (!email || !password) {
      setError(t('auth.errors.fillAllFields'));
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.errors.invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      // If user entered a known demo account, bypass API and login instantly
      const demoUserEarly = tryDemoLogin(email, password);
      if (demoUserEarly) {
        if (onLogin) onLogin({ email, password });
        return;
      }

      // Try calling the real API first
      const response = await authAPI.login({
        email,
        password
      });
      
      if (response && response.success) {
        // Store user data
        localStorage.setItem('authToken', response.token || 'demo-token');
        localStorage.setItem('user', JSON.stringify(response.user || {
          id: Date.now(),
          name: 'किसान जी',
          email,
          role: 'farmer'
        }));
        
        if (onLogin) {
          onLogin(response.user || { email, password });
        }
      } else {
        // Backend responded but did not authenticate — try demo users
        const demoUser = tryDemoLogin(email, password);
        if (demoUser) {
          if (onLogin) onLogin({ email, password });
        } else {
          setError(response?.message || t('auth.errors.loginFailed'));
        }
      }
    } catch (err: any) {
      console.warn('API call failed, using demo mode:', err.message);
      
      // Fallback: Demo login for development/demo purposes
      const demoUser = tryDemoLogin(email, password);
      if (demoUser) {
        if (onLogin) onLogin({ email, password });
      } else {
        setError(t('auth.errors.invalidCredentialsWithDemo'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Main Login Form Content */}
      <Box component="form" onSubmit={handleSubmit}>

          {error && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Demo Credentials Info - Styled as a floating subtle card */}
          <Box sx={{ 
            mb: 4, 
            p: 2.5, 
            borderRadius: 4, 
            bgcolor: 'rgba(46, 125, 50, 0.05)', 
            border: '1px solid rgba(46, 125, 50, 0.1)' 
          }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--primary-green)', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 18 }} /> {t('auth.demoCredentials')}
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 2, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              • <strong>farmer@example.com</strong> / farmer123<br/>
              • <strong>test@example.com</strong> / test123<br/>
              • <strong>demo@kisangpt.com</strong> / demo123
            </Typography>
            <Button 
              size="small" 
              variant="contained" 
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  email: 'farmer@example.com',
                  password: 'farmer123'
                }));
              }}
              sx={{ 
                fontSize: '0.75rem', 
                borderRadius: 2,
                bgcolor: 'var(--primary-green)',
                '&:hover': { bgcolor: 'var(--dark-green)' }
              }}
              >
                {t('auth.fillDemo')}
              </Button>
          </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label={t('auth.email')}
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleInputChange('email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'var(--primary-green)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: '2px' },
                  },
                  mb: 3
                }}
              />

              <TextField
                fullWidth
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'var(--primary-green)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'var(--text-muted)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: '2px' },
                  }
                }}
              />
            </Box>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={handleInputChange('rememberMe')}
                      sx={{ color: 'var(--primary-green)', '&.Mui-checked': { color: 'var(--primary-green)' } }}
                    />
                  }
                  label={<Typography variant="body2">{t('auth.rememberMe')}</Typography>}
                />
                <Link
                  href="#"
                  variant="body2"
                  sx={{ color: 'var(--primary-green)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  borderRadius: '16px',
                  background: 'var(--primary-gradient)',
                  boxShadow: '0 10px 20px -5px rgba(27, 94, 32, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 25px -5px rgba(27, 94, 32, 0.4)',
                    background: 'var(--secondary-gradient)',
                  },
                  '&:disabled': {
                    opacity: 0.7,
                    bgcolor: 'var(--text-muted)'
                  }
                }}
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </Button>
            </motion.div>
          </Box>

          <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(0,0,0,0.06)' } }}>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              या
            </Typography>
          </Divider>

          {/* Social Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={() => googleAuthAPI.redirectToGoogle()}
                sx={{
                  borderRadius: 2,
                  borderColor: '#db4437',
                  color: '#db4437',
                  '&:hover': {
                    borderColor: '#db4437',
                    backgroundColor: 'rgba(219, 68, 55, 0.04)',
                  },
                }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                sx={{
                  borderRadius: 2,
                  borderColor: '#4267B2',
                  color: '#4267B2',
                  '&:hover': {
                    borderColor: '#4267B2',
                    backgroundColor: 'rgba(66, 103, 178, 0.04)',
                  },
                }}
              >
                Facebook
              </Button>
            </Box>
          </motion.div>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
              {t('auth.newHere')} {' '}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSignUp?.();
                }}
                sx={{
                  color: 'var(--primary-green)',
                  textDecoration: 'none',
                  fontWeight: 900,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'var(--light-green)',
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('auth.signUp')}
              </Link>
            </Typography>
          </Box>
      </Box>
  );
};

export default LoginForm;