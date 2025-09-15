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
  const { t } = useTranslation();
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
    const elements = [];
    const icons = ['🌾', '🚜', '🌱', '🌽', '🍅', '🥕', '🌻', '🐄', '🐔', '🍀', '☀️', '🌧️', '🏡', '🌳'];
    
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
      setError('कृपया सभी आवश्यक फील्ड भरें / Please fill all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('पासवर्ड मेल नहीं खाते / Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('कृपया नियम व शर्तों से सहमत हों / Please agree to terms and conditions');
      setLoading(false);
      return;
    }

    try {
      // Call real API
      const response = await authAPI.register(formData);
      
      if (response.success) {
        if (onSignUp) {
          onSignUp(response.user);
        }
      } else {
        setError(response.message || 'साइन अप में समस्या / Signup failed');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'साइन अप में समस्या / Signup failed');
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
      }}
    >

      {/* Main SignUp Form */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ zIndex: 15, perspective: '1000px' }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              0 4px 20px rgba(76, 175, 80, 0.1)
            `,
            transform: 'translateZ(0)',
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
                  label="स्थान / Location"
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
                  <InputLabel>मुख्य फसल / Main Crop</InputLabel>
                  <Select
                    value={formData.cropType}
                    label="मुख्य फसल / Main Crop"
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
                label="पासवर्ड / Password *"
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
                label="पासवर्ड पुष्टि / Confirm Password *"
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
                    मैं{' '}
                    <Link href="#" sx={{ color: '#4CAF50' }}>
                      नियम व शर्तों
                    </Link>
                    {' '}से सहमत हूं *
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
                {loading ? 'अकाउंट बनाया जा रहा है...' : 'अकाउंट बनाएं / Sign Up'}
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