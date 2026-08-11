import React, { useState, useEffect, useRef } from 'react';
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
  PhotoCamera,
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch { }
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await authAPI.uploadProfilePicture(formData);
      if (response && response.success && response.user) {
        setUser(response.user); // Update UI
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Photo upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      handleUserMenuClose();
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
        top: 24,
        margin: '0 auto',
        maxWidth: { xs: 'calc(100% - 32px)', xl: '1240px' },
        borderRadius: '999px',
        background: 'rgba(13, 20, 17, 0.78)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 28px 80px rgba(0, 0, 0, 0.5)',
        py: 0.5,
        px: { xs: 1, md: 2 },
        zIndex: 1200,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 68, px: { xs: 1.5, md: 2.5 } }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer' }} onClick={() => handleNavigation('/')}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.95), rgba(15, 118, 110, 0.95))',
                boxShadow: '0 12px 28px rgba(22, 163, 74, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
              }}
            >
              <Agriculture sx={{ fontSize: { xs: 22, md: 26 }, color: '#fff' }} />
            </Box>
            <Box sx={{ lineHeight: 1 }}>
              <Typography
                variant="h6"
                component="div"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: '#ecfdf5',
                  letterSpacing: '0.2px',
                  fontSize: { xs: '1rem', md: '1.2rem' },
                }}
              >
                <Box component="span" sx={{ color: '#34d399' }}>Kisan</Box>GPT
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: 'rgba(236, 253, 245, 0.55)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Premium Farming Hub
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75, ml: 2, overflowX: 'auto', whiteSpace: 'nowrap', flexGrow: 1, minWidth: 0, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {primaryNav.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  startIcon={item.icon}
                  sx={{
                    color: isActive ? '#052e1b' : 'rgba(236, 253, 245, 0.9)',
                    background: isActive ? 'linear-gradient(135deg, rgba(52, 211, 153, 1), rgba(13, 148, 136, 1))' : 'rgba(255,255,255,0.06)',
                    borderRadius: '999px',
                    px: 2,
                    py: 1.05,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: isActive ? '0 18px 28px rgba(52, 211, 153, 0.22)' : '0 10px 24px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      color: '#052e1b',
                      background: 'linear-gradient(135deg, rgba(110, 231, 183, 1), rgba(13, 148, 136, 1))',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
            <Button
              onClick={handleModulesMenuClick}
              startIcon={<Dashboard />}
              sx={{
                color: 'rgba(236, 253, 245, 0.9)',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '999px',
                px: 2,
                py: 1.05,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                '&:hover': { background: 'rgba(52, 211, 153, 0.14)', transform: 'translateY(-1px)' },
              }}
            >
              {t('navbar.modules', 'More')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Button
              onClick={handleLanguageClick}
              sx={{
                textTransform: 'none',
                color: 'rgba(236, 253, 245, 0.92)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                px: 2,
                py: 0.9,
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
                '&:hover': { background: 'rgba(52, 211, 153, 0.12)' },
              }}
              startIcon={<Language sx={{ color: '#34d399' }} />}
            >
              {currentLang.flag}
            </Button>
            <IconButton
              onClick={handleUserMenuClick}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 14px 25px rgba(0, 0, 0, 0.25)',
                '&:hover': { background: 'rgba(52, 211, 153, 0.12)' },
              }}
            >
              {user?.name ? <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{user.name[0]}</Avatar> : <AccountCircle sx={{ color: '#34d399' }} />}
            </IconButton>
            {isMobile && (
              <IconButton
                onClick={handleMobileMenuClick}
                sx={{ color: 'rgba(236, 253, 245, 0.9)' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Container>

        <Menu anchorEl={languageAnchorEl} open={Boolean(languageAnchorEl)} onClose={handleLanguageClose} PaperProps={{ sx: { mt: 1, borderRadius: '18px', px: 0.5 } }}>
          {languages.map((language) => (
            <MenuItem key={language.code} onClick={() => handleLanguageChange(language.code)} selected={i18n.language === language.code}>
              <Typography sx={{ mr: 1 }}>{language.flag}</Typography>
              {language.name}
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={mobileMenuAnchorEl} open={Boolean(mobileMenuAnchorEl)} onClose={handleMobileMenuClose} PaperProps={{ sx: { mt: 1, borderRadius: '18px', px: 0.5 } }}>
          {navigationItems.map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.cloneElement(item.icon, { sx: { mr: 2 } })}
                {item.label}
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={modulesMenuAnchorEl} open={Boolean(modulesMenuAnchorEl)} onClose={handleModulesMenuClose} PaperProps={{ sx: { mt: 1, borderRadius: '18px', px: 0.5 } }}>
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
