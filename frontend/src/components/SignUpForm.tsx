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
        avatar: '🧑‍🌾',
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
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Main SignUp Form Content */}
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        
        {error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Form Fields Container */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          
          {/* Name */}
          <TextField
            fullWidth
            label="पूरा नाम / Full Name *"
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange('name')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'var(--primary-green)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.4)',
                '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: '2px' },
              }
            }}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="ईमेल / Email *"
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
                '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--primary-green)', borderWidth: '2px' },
              }
            }}
          />

          {/* Phone & Location Row */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="फोन / Phone"
              variant="outlined"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: 'var(--primary-green)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                }
              }}
            />
            <TextField
              fullWidth
              label="स्थान / Location"
              variant="outlined"
              value={formData.location}
              onChange={handleInputChange('location')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: 'var(--primary-green)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                }
              }}
            />
          </Box>

          {/* Farm Details Row */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="खेत का आकार / Size"
              variant="outlined"
              value={formData.farmSize}
              onChange={handleInputChange('farmSize')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  '&:hover fieldset': { borderColor: 'var(--primary-green)' },
                }
              }}
            />
            <FormControl fullWidth>
              <InputLabel>मुख्य फसल / Main Crop</InputLabel>
              <Select
                value={formData.cropType}
                label="मुख्य फसल / Main Crop"
                onChange={handleInputChange('cropType')}
                sx={{
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-green)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-green)' },
                }}
              >
                {cropTypes.map((crop) => (
                  <MenuItem key={crop} value={crop}>{crop}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Password */}
          <TextField
            fullWidth
            label="पासवर्ड / Password *"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
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
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.4)',
                '&:hover fieldset': { borderColor: 'var(--primary-green)' },
              }
            }}
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="पासवर्ड पुष्टि / Confirm Password *"
            type={showConfirmPassword ? 'text' : 'password'}
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'var(--primary-green)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.4)',
                '&:hover fieldset': { borderColor: 'var(--primary-green)' },
              }
            }}
          />

          {/* Terms & Conditions */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.agreeToTerms}
                onChange={handleInputChange('agreeToTerms')}
                sx={{ color: 'var(--primary-green)', '&.Mui-checked': { color: 'var(--primary-green)' } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                मैं <Link href="#" sx={{ color: 'var(--primary-green)', fontWeight: 700 }}>नियम व शर्तों</Link> से सहमत हूं *
              </Typography>
            }
          />

          {/* Submit Button */}
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
              }
            }}
          >
            {loading ? 'अकाउंट बनाया जा रहा है...' : 'अकाउंट बनाएं / Sign Up'}
          </Button>

          {/* Back to Login Link */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
              पहले से अकाउंट है?{' '}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onBackToLogin?.();
                }}
                sx={{
                  color: 'var(--primary-green)',
                  textDecoration: 'none',
                  fontWeight: 900,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                लॉग इन करें
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUpForm;