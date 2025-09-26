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
  Container,
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
  AccountBalance,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [modulesMenuAnchorEl, setModulesMenuAnchorEl] = useState<null | HTMLElement>(null);
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
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[languages.length - 1];

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    try {
      localStorage.setItem('appLanguage', languageCode);
    } catch {}
    i18n.changeLanguage(languageCode);
    handleLanguageClose();
  };

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleModulesMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setModulesMenuAnchorEl(event.currentTarget);
  };

  const handleModulesMenuClose = () => {
    setModulesMenuAnchorEl(null);
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
    { path: '/market-analysis', label: t('navbar.marketAnalysis'), icon: <SmartToy /> },
    { path: '/weather', label: t('navbar.weather'), icon: <CloudQueue /> },
    { path: '/ai-chat', label: t('navbar.aiChat'), icon: <SmartToy /> },
    // Secondary modules
    { path: '/loans', label: t('navbar.loans', 'Loans'), icon: <AccountBalance /> },
    { path: '/enhanced-crop-recommendation', label: t('navbar.satelliteAnalysis'), icon: <Satellite /> },
    { path: '/government-subsidy', label: t('navbar.governmentSchemes'), icon: <AccountBalance /> },
    { path: '/disease-detection', label: t('navbar.diseaseDetection'), icon: <BugReport /> },
    { path: '/crop-recommendation', label: t('navbar.cropRecommendation'), icon: <Grass /> },
    { path: '/dream-visualization', label: t('navbar.dreamVisualization'), icon: <Visibility /> },
    { path: '/community', label: t('navbar.community'), icon: <Group /> },
    { path: '/satellite-view', label: t('navbar.satellite'), icon: <Satellite /> },
    { path: '/ar-visualization', label: t('navbar.arView'), icon: <ViewInAr /> },
    { path: '/rain-alerts', label: t('navbar.rainAlerts'), icon: <Notifications /> },
    { path: '/help', label: t('navbar.help', 'Help'), icon: <SmartToy /> },
  ];

  const primaryNavPaths = ['/', '/market-analysis', '/weather', '/ai-chat'];
  const primaryNav = navigationItems.filter(item => primaryNavPaths.includes(item.path));
  const secondaryNav = navigationItems.filter(item => !primaryNavPaths.includes(item.path));

  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: '#2e7d32',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <Toolbar disableGutters>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', px: { xs: 1, md: 2 } }}>
          {/* Logo and App Name */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Agriculture sx={{ 
              fontSize: { xs: 26, md: 32 }, 
              mr: 1, 
              color: '#fff'
            }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '0.3px',
                fontSize: { xs: '1.05rem', md: '1.25rem' }
              }}
            >
              KisanGPT
            </Typography>
          </Box>
        </Container>

        {/* Desktop Navigation */}
{/* Desktop Navigation (hidden on phones) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, ml: 2, overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {primaryNav.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: '#ffffff',
                    opacity: isActive ? 1 : 0.9,
                    borderRadius: 2,
                    px: 1.25,
                    textTransform: 'none',
                    borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                    '&:hover': { opacity: 1 }
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
            {/* More menu */}
            <Button
              color="inherit"
              onClick={handleModulesMenuClick}
              startIcon={<Dashboard />}
              sx={{ color: '#ffffff', opacity: 0.9, textTransform: 'none', '&:hover': { opacity: 1 } }}
            >
              {t('navbar.modules', 'More')}
            </Button>
          </Box>

        {/* Spacer to push user controls to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Language Selector (icon on phones) */}
        <Box sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
          <IconButton color="inherit" onClick={handleLanguageClick} aria-label="language">
            <Language />
          </IconButton>
        </Box>

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
                color: '#ffeb3b',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '2px solid rgba(255, 235, 59, 0.6)',
                borderRadius: 5,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  border: '2px solid rgba(255, 235, 59, 0.85)',
                  transform: 'scale(1.05)',
                },
                '& .MuiChip-label': {
                  color: '#ffeb3b',
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

        {/* Language Selector (hidden on phones, shows icon above) */}
        <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          <Button color="inherit" onClick={handleLanguageClick} startIcon={<Language />} sx={{ ml: 1, textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}>
            {currentLang.name}
          </Button>
        </Box>

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

        {/* More Menu (simple list) */}
        <Menu
          anchorEl={modulesMenuAnchorEl}
          open={Boolean(modulesMenuAnchorEl)}
          onClose={handleModulesMenuClose}
        >
          {secondaryNav.map((item) => (
            <MenuItem key={item.path} onClick={() => { handleNavigation(item.path); handleModulesMenuClose(); }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.cloneElement(item.icon, { sx: { mr: 1 } })}
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