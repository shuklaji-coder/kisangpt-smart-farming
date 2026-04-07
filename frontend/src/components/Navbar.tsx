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
  Divider,
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
  // Cast to any to avoid TS deep instantiation on some CI environments
  // This does not affect runtime; only loosens types here
  const { t, i18n } = (useTranslation as any)();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // Treat only phones as mobile; tablets/MD and above get desktop navbar
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    { path: '/advanced-crop-recommendation', label: 'Advanced AI Crops', icon: <SmartToy /> },
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
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        color: '#0f172a'
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 1, md: 2 } }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
          {/* Left: Logo and App Name */}
          <Box 
            sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              boxShadow: '0 4px 12px rgba(46,125,50,0.2)'
            }}>
              <Agriculture sx={{ fontSize: 24, color: '#fff' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#1e293b',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                fontFamily: '"Outfit", sans-serif'
              }}
            >
              KisanGPT
            </Typography>
          </Box>

          {/* Middle: Desktop Navigation */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            ml: 4,
            flexGrow: 1,
          }}>
            {primaryNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isActive ? '#2e7d32' : '#64748b',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 3,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    backgroundColor: isActive ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                    '&:hover': { 
                      backgroundColor: 'rgba(46, 125, 50, 0.04)',
                      color: '#2e7d32'
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: '#2e7d32', color: '#fff' }}>
                      {user.name?.[0] || <Person />}
                    </Avatar>
                  }
                  label={user.name || 'Farmer'}
                  onClick={handleUserMenuClick}
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    borderColor: 'rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
                  }}
                />
                <IconButton color="inherit" onClick={handleLanguageClick} className="glass-panel">
                  <Language sx={{ fontSize: 20, color: '#64748b' }} />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={() => handleNavigation('/login')}
                sx={{ borderRadius: 3 }}
              >
                Login
              </Button>
            )}

            {isMobile && (
              <IconButton 
                onClick={handleMobileMenuClick} 
                sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Container>

        {/* Menus remain largely the same but with style updates if needed */}
        <Menu 
          anchorEl={languageAnchorEl} 
          open={Boolean(languageAnchorEl)} 
          onClose={handleLanguageClose}
          PaperProps={{ sx: { borderRadius: 4, mt: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} onClick={() => handleLanguageChange(language.code)} sx={{ borderRadius: 2, mx: 1 }}>
              <Typography sx={{ mr: 1.5 }}>{language.flag}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{language.name}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { borderRadius: 4, mt: 1, minWidth: 180, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}}
        >
          <MenuItem onClick={handleUserMenuClose} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <Person sx={{ mr: 1.5, fontSize: 20, color: '#64748b' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Profile</Typography>
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, my: 0.5, color: '#ef4444' }}>
            <Logout sx={{ mr: 1.5, fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Logout</Typography>
          </MenuItem>
        </Menu>

        <Menu 
          anchorEl={mobileMenuAnchorEl} 
          open={Boolean(mobileMenuAnchorEl)} 
          onClose={handleMobileMenuClose}
          PaperProps={{ sx: { borderRadius: 4, mt: 1, minWidth: 240, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}}
        >
          {navigationItems.map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigation(item.path)} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {React.cloneElement(item.icon, { sx: { fontSize: 20, color: '#64748b' } })}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;