import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Agriculture,
  Language,
  Menu as MenuIcon,
  Dashboard,
  Visibility,
  Group,
  BugReport,
  Grass,
  CloudQueue,
  SmartToy,
  Satellite,
  ViewInAr,
  Login,
  Notifications,
  AccountCircle,
  Logout,
  Person,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const languages = [
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleLanguageClose();
  };

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      handleUserMenuClose();
      // Reload the page to update authentication state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { path: '/', label: t('navbar.dashboard'), icon: <Dashboard /> },
    { path: '/dream-visualization', label: t('navbar.dreamVisualization'), icon: <Visibility /> },
    { path: '/community', label: t('navbar.community'), icon: <Group /> },
    { path: '/disease-detection', label: t('navbar.diseaseDetection'), icon: <BugReport /> },
    { path: '/crop-recommendation', label: t('navbar.cropRecommendation'), icon: <Grass /> },
    { path: '/weather', label: t('navbar.weather'), icon: <CloudQueue /> },
    { path: '/ai-chat', label: t('navbar.aiChat', '🤖 AI Chat'), icon: <SmartToy /> },
    { path: '/satellite-view', label: t('navbar.satellite', '🛰️ Satellite'), icon: <Satellite /> },
    { path: '/ar-visualization', label: t('navbar.arView', '🌱 AR Plants'), icon: <ViewInAr /> },
    { path: '/rain-alerts', label: '🌧️ Rain Alerts', icon: <Notifications /> },
  ];

  return (
    <AppBar position="sticky" sx={{ 
      background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 25%, #4caf50 75%, #81c784 100%)',
      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
      backdropFilter: 'blur(10px)',
    }}>
      <Toolbar>
        {/* Logo and App Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Agriculture sx={{ 
            fontSize: 40, 
            mr: 2, 
            color: '#fff',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          }} />
          <Box>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: '#fff',
                fontSize: { xs: '1.3rem', md: '1.8rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
              }}
            >
              🌾 KisanGPT
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                display: { xs: 'none', sm: 'block' },
                fontStyle: 'italic',
                fontSize: '0.9rem',
              }}
            >
              {t('app.tagline')}
            </Typography>
          </Box>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {navigationItems.slice(0, 4).map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* User Profile or Login */}
        {user ? (
          <>
            <Chip
              avatar={
                <Avatar sx={{ 
                  bgcolor: '#fff', 
                  color: '#2e7d32',
                  width: 35,
                  height: 35,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  <Person sx={{ fontSize: 20 }} />
                </Avatar>
              }
              label={`🙏 ${user.name || t('navbar.farmerJi')}`}
              onClick={handleUserMenuClick}
              sx={{
                ml: 2,
                pl: 1,
                pr: 2,
                py: 0.5,
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 5,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  transform: 'scale(1.05)',
                },
                '& .MuiChip-label': {
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
            <Menu
              anchorEl={userMenuAnchorEl}
              open={Boolean(userMenuAnchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleUserMenuClose}>
                <Person sx={{ mr: 2 }} />
                {t('navbar.profile')}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} />
                {t('navbar.logout')}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            color="inherit"
            startIcon={<Login />}
            onClick={() => handleNavigation('/login')}
            sx={{
              ml: 2,
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
              },
            }}
          >
            {t('navbar.login')}
          </Button>
        )}

        {/* Language Selector */}
        <IconButton
          color="inherit"
          onClick={handleLanguageClick}
          sx={{ ml: 1 }}
        >
          <Language />
        </IconButton>

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={handleMobileMenuClick}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Language Menu */}
        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageClose}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={i18n.language === language.code}
            >
              <Typography sx={{ mr: 1 }}>{language.flag}</Typography>
              {language.name}
            </MenuItem>
          ))}
        </Menu>

        {/* Mobile Navigation Menu */}
        <Menu
          anchorEl={mobileMenuAnchorEl}
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
        >
          {navigationItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.cloneElement(item.icon, { sx: { mr: 2 } })}
                {item.label}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;