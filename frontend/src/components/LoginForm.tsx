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
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; icon: string; delay: number }>>([]);

  // Create floating farming elements to match field image
  useEffect(() => {
    const elements = [];
    const fieldIcons = ['🌾', '🌱', '🌽', '🍅', '🥕', '🌻', '🍀'];
    const farmIcons = ['🚜', '🐄', '🐔', '🏡', '🌳'];
    const weatherIcons = ['☀️', '🌧️', '☁️'];
    
    // Add field crop elements (more frequent, like crop rows)
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        icon: fieldIcons[Math.floor(Math.random() * fieldIcons.length)],
        delay: Math.random() * 8,
      });
    }
    
    // Add farm elements (less frequent)
    for (let i = 15; i < 20; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        icon: farmIcons[Math.floor(Math.random() * farmIcons.length)],
        delay: Math.random() * 10,
      });
    }
    
    // Add weather elements (sparse)
    for (let i = 20; i < 23; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        icon: weatherIcons[Math.floor(Math.random() * weatherIcons.length)],
        delay: Math.random() * 12,
      });
    }
    
    setFloatingElements(elements);
  }, []);

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

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('कृपया सभी फील्ड भरें / Please fill all fields');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('कृपया वैध ईमेल पता दर्ज करें / Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Try calling the real API first
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      if (response && response.success) {
        // Store user data
        localStorage.setItem('authToken', response.token || 'demo-token');
        localStorage.setItem('user', JSON.stringify(response.user || {
          id: Date.now(),
          name: 'किसान जी',
          email: formData.email,
          role: 'farmer'
        }));
        
        if (onLogin) {
          onLogin(response.user || { email: formData.email, password: formData.password });
        }
      } else {
        setError(response?.message || 'लॉगिन में समस्या / Login failed');
      }
    } catch (err: any) {
      console.warn('API call failed, using demo mode:', err.message);
      
      // Fallback: Demo login for development/demo purposes
      const defaultDemoUsers = [
        { email: 'farmer@example.com', password: 'farmer123', name: 'रमेश कुमार', role: 'farmer' },
        { email: 'test@example.com', password: 'test123', name: 'टेस्ट यूजर', role: 'farmer' },
        { email: 'demo@kisangpt.com', password: 'demo123', name: 'डेमो किसान', role: 'farmer' },
        { email: 'admin@kisangpt.com', password: 'admin123', name: 'एडमिन', role: 'admin' }
      ];
      
      // Add dynamically registered demo users
      const registeredDemoUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      const demoUsers = [...defaultDemoUsers, ...registeredDemoUsers];

      const user = demoUsers.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase() && 
        u.password === formData.password
      );

      if (user) {
        // Demo login successful
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
        
        if (onLogin) {
          onLogin({ email: formData.email, password: formData.password });
        }
      } else {
        setError('गलत ईमेल या पासवर्ड / Invalid email or password\n\nDemo Users:\n• farmer@example.com / farmer123\n• test@example.com / test123\n• demo@kisangpt.com / demo123');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2332&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >

      {/* Main Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ zIndex: 10, perspective: '1000px' }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            maxWidth: 420,
            width: '90vw',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.15),
              0 2px 10px rgba(85, 139, 47, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4CAF50, #8BC34A, #4CAF50)',
              borderRadius: '3px 3px 0 0',
            },
            transform: 'translateZ(0)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `
                0 16px 50px rgba(0, 0, 0, 0.2),
                0 4px 15px rgba(85, 139, 47, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.7)
              `,
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotateY: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                }}
              >
                <Agriculture sx={{ fontSize: 32, color: 'white' }} />
              </Avatar>
            </motion.div>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #2E7D32, #388E3C, #4CAF50)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
              }}
            >
              🌾 KisanGPT
            </Typography>
            <Typography variant="body2" color="text.secondary">
              आपकी खेती का डिजिटल साथी
            </Typography>
          </Box>

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

          {/* Demo Credentials Info */}
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📝 Demo Login Credentials:
            </Typography>
            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
              • <strong>farmer@example.com</strong> / farmer123<br/>
              • <strong>test@example.com</strong> / test123<br/>
              • <strong>demo@kisangpt.com</strong> / demo123
            </Typography>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  email: 'farmer@example.com',
                  password: 'farmer123'
                }));
              }}
              sx={{ mr: 1, mt: 1 }}
            >
              Fill Demo 🚀
            </Button>
          </Alert>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TextField
                fullWidth
                label="ईमेल / Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#4CAF50' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TextField
                fullWidth
                label="पासवर्ड / Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#4CAF50' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

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
                      sx={{ color: '#4CAF50' }}
                    />
                  }
                  label={<Typography variant="body2">याद रखें</Typography>}
                />
                <Link
                  href="#"
                  variant="body2"
                  sx={{ color: '#4CAF50', textDecoration: 'none' }}
                >
                  पासवर्ड भूल गए?
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
                  py: 1.5,
                  mb: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #45a049, #7cb342)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                  },
                }}
              >
                {loading ? 'लॉग इन हो रहे हैं...' : 'लॉग इन करें / Login'}
              </Button>
            </motion.div>
          </Box>

          <Divider sx={{ my: 2, '&::before, &::after': { borderColor: '#e0e0e0' } }}>
            <Typography variant="body2" color="text.secondary">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                नया उपयोगकर्ता हैं?{' '}
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSignUp?.();
                  }}
                  sx={{
                    color: '#4CAF50',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  साइन अप करें
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Paper>
      </motion.div>

    </Box>
  );
};

export default LoginForm;