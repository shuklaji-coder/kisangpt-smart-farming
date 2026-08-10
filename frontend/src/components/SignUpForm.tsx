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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';

interface SignUpFormProps {
  onSignUp?: (userData: any) => void;
  onBackToLogin?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUp, onBackToLogin }) => {
  const { t } = (useTranslation as any)();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    farmSize: '',
    cropType: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; icon: string; delay: number }>>([]);

  // Create floating farming elements
  useEffect(() => {
    const elements: Array<{ id: number; x: number; y: number; icon: string; delay: number }> = [];
    const icons = ['🌾', '🚜', '🌱', '🌽', '🍅', '🥕', '🌻', '🐄', '🐓', '🍀', '☀️', '🌧️', '🏡', '🌳'];
    
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        icon: icons[Math.floor(Math.random() * icons.length)],
        delay: Math.random() * 5,
      });
    }
    setFloatingElements(elements);
  }, []);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('auth.errors.fillAllRequired'));
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('auth.errors.invalidEmail'));
      setLoading(false);
      return;
    }

    // Password strength validation
    if (formData.password.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordsDontMatch'));
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t('auth.errors.agreeToTerms'));
      setLoading(false);
      return;
    }

    try {
      // Try calling the real API first
      const response = await authAPI.register(formData);
      
      if (response && response.success) {
        // Store user data
        localStorage.setItem('authToken', response.token || 'demo-token');
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (onSignUp) {
          onSignUp(response.user);
        }
      } else {
        setError(response?.message || t('auth.errors.signupFailed'));
      }
    } catch (err: any) {
      console.warn('API call failed, creating demo account:', err.message);
      
      // Fallback: Create demo account
      const userData = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'N/A',
        location: formData.location || 'India',
        farmSize: formData.farmSize || '1-2 acres',
        cropType: formData.cropType || 'Mixed Crops',
        role: 'farmer',
        avatar: '👨‍🌾',
        joinDate: new Date().toISOString().split('T')[0],
        verified: true
      };

      // Store demo user data
      localStorage.setItem('authToken', 'demo-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Also store in demo users list for future login
      const existingDemoUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      const updatedDemoUsers = [...existingDemoUsers, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'farmer'
      }];
      localStorage.setItem('demoUsers', JSON.stringify(updatedDemoUsers));
      
      if (onSignUp) {
        onSignUp(userData);
      }
    } finally {
      setLoading(false);
    }
  };

  const cropTypes = [
    'गेहूं / Wheat',
    'चावल / Rice', 
    'मक्का / Corn',
    'टमाटर / Tomato',
    'आलू / Potato',
    'प्याज / Onion',
    'गन्ना / Sugarcane',
    'कपास / Cotton',
    'सोयाबीन / Soybean',
    'अन्य / Other'
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2332&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        py: 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(11, 43, 21, 0.72) 0%, rgba(27, 94, 32, 0.6) 45%, rgba(8, 32, 16, 0.78) 100%)',
          zIndex: 1,
        },
      }}
    >
      {/* Floating animated particles */}
      {floatingElements.map((el) => (
        <Box
          key={el.id}
          sx={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: { xs: '1rem', sm: '1.3rem' },
            opacity: 0.35,
            zIndex: 2,
            pointerEvents: 'none',
            animation: 'floatY 7s ease-in-out infinite',
            animationDelay: `${el.delay}s`,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
          }}
        >
          {el.icon}
        </Box>
      ))}

      {/* Main SignUp Form */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ zIndex: 15, perspective: '1000px', width: '100%', maxWidth: 520 }}
      >
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 520,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            mx: 'auto',
            borderRadius: '26px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(24px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: `
              0 24px 70px rgba(0, 0, 0, 0.35),
              0 4px 20px rgba(27, 94, 32, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.7)
            `,
            transform: 'translateZ(0)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #4CAF50, #8BC34A, #4CAF50, #8BC34A)',
              backgroundSize: '300% auto',
              borderRadius: '26px 26px 0 0',
              animation: 'gradientShift 5s ease infinite',
              zIndex: 2,
            },
            '&:hover': {
              transform: 'translateZ(15px) rotateX(1deg) scale(1.01)',
              boxShadow: `
                0 20px 50px rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.4),
                inset 0 2px 0 rgba(255, 255, 255, 0.6),
                0 8px 30px rgba(76, 175, 80, 0.15)
              `,
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotateY: [0, 360],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                }}
              >
                <Agriculture sx={{ fontSize: 30, color: 'white' }} />
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
              🌱 नया अकाउंट बनाएं
            </Typography>
            <Typography variant="body2" color="text.secondary">
              KisanGPT में आपका स्वागत है
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

          {/* SignUp Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TextField
                fullWidth
                label="पूरा नाम / Full Name *"
                value={formData.name}
                onChange={handleInputChange('name')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#4CAF50' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#4CAF50' },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TextField
                fullWidth
                label="ईमेल / Email *"
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
                    '&:hover fieldset': { borderColor: '#4CAF50' },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

            {/* Phone & Location Row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ flex: 1 }}
              >
                <TextField
                  fullWidth
                  label="फोन / Phone"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: '#4CAF50' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#4CAF50' },
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
                transition={{ delay: 0.4 }}
                style={{ flex: 1 }}
              >
                <TextField
                  fullWidth
                  label="Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¥Ã Â¤Â¾Ã Â¤Â¨ / Location"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: '#4CAF50' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#4CAF50' },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4CAF50',
                        boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                      },
                    },
                  }}
                />
              </motion.div>
            </Box>

            {/* Farm Details Row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                style={{ flex: 1 }}
              >
                <TextField
                  fullWidth
                  label="खेत का आकार / Farm Size (acres)"
                  value={formData.farmSize}
                  onChange={handleInputChange('farmSize')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#4CAF50' },
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
                transition={{ delay: 0.6 }}
                style={{ flex: 1 }}
              >
                <FormControl fullWidth>
                  <InputLabel>Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â«Ã Â¤Â¸Ã Â¤Â² / Main Crop</InputLabel>
                  <Select
                    value={formData.cropType}
                    label="Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â«Ã Â¤Â¸Ã Â¤Â² / Main Crop"
                    onChange={handleInputChange('cropType')}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4CAF50' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4CAF50',
                        boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                      },
                    }}
                  >
                    {cropTypes.map((crop) => (
                      <MenuItem key={crop} value={crop}>{crop}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Box>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <TextField
                fullWidth
                label="Ã Â¤ÂªÃ Â¤Â¾Ã Â¤Â¸Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â¡ / Password *"
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
                    '&:hover fieldset': { borderColor: '#4CAF50' },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <TextField
                fullWidth
                label="Ã Â¤ÂªÃ Â¤Â¾Ã Â¤Â¸Ã Â¤ÂµÃ Â¤Â°Ã Â¥ÂÃ Â¤Â¡ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â·Ã Â¥ÂÃ Â¤Å¸Ã Â¤Â¿ / Confirm Password *"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#4CAF50' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#4CAF50' },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                    },
                  },
                }}
              />
            </motion.div>

            {/* Terms & Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange('agreeToTerms')}
                    sx={{ color: '#4CAF50' }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Ã Â¤Â®Ã Â¥Ë†Ã Â¤â€š{' '}
                    <Link href="#" sx={{ color: '#4CAF50' }}>
                      Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Â¯Ã Â¤Â® Ã Â¤Âµ Ã Â¤Â¶Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¤Ã Â¥â€¹Ã Â¤â€š
                    </Link>
                    {' '}Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤Â¸Ã Â¤Â¹Ã Â¤Â®Ã Â¤Â¤ Ã Â¤Â¹Ã Â¥â€šÃ Â¤â€š *
                  </Typography>
                }
                sx={{ mb: 3 }}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                className="shine-btn"
                sx={{
                  py: 1.6,
                  mb: 2,
                  borderRadius: '16px',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  boxShadow: '0 12px 32px rgba(46, 125, 50, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #43a047, #1b5e20)',
                    boxShadow: '0 16px 40px rgba(46, 125, 50, 0.5)',
                  },
                }}
              >
                {loading ? 'Ã Â¤â€¦Ã Â¤â€¢Ã Â¤Â¾Ã Â¤â€°Ã Â¤â€šÃ Â¤Å¸ Ã Â¤Â¬Ã Â¤Â¨Ã Â¤Â¾Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾ Ã Â¤Â°Ã Â¤Â¹Ã Â¤Â¾ Ã Â¤Â¹Ã Â¥Ë†...' : 'Ã Â¤â€¦Ã Â¤â€¢Ã Â¤Â¾Ã Â¤â€°Ã Â¤â€šÃ Â¤Å¸ Ã Â¤Â¬Ã Â¤Â¨Ã Â¤Â¾Ã Â¤ÂÃ Â¤â€š / Sign Up'}
              </Button>
            </motion.div>
          </Box>

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                पहले से अकाउंट है?{' '}
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onBackToLogin?.();
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
                  लॉग इन करें
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default SignUpForm;