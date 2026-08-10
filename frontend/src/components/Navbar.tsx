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
        background: 'rgba(21, 93, 46, 0.88)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(20, 87, 45, 0.25)',
        zIndex: 1200,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 62, px: { xs: 1, md: 2 } }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
          {/* Left: Logo and App Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }} onClick={() => handleNavigation('/')}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 38, md: 44 },
                height: { xs: 38, md: 44 },
                mr: 1,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8bc34a, #4caf50)',
                boxShadow: '0 6px 18px rgba(139, 195, 74, 0.45)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'logoPulse 3s ease-in-out infinite',
                '@keyframes logoPulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.06)' },
                },
              }}
            >
              <Agriculture sx={{ fontSize: { xs: 24, md: 28 }, color: '#fff' }} />
            </Box>
            <Box sx={{ lineHeight: 1 }}>
              <Typography
                variant="h6"
                component="div"
                noWrap
                sx={{
                  fontWeight: 800,
                  fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
                  color: '#fff',
                  letterSpacing: '0.3px',
                  fontSize: { xs: '1.05rem', md: '1.25rem' },
                  maxWidth: { xs: '42vw', md: 'max-content' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  textShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                Kisan<span style={{ color: '#c5e1a5' }}>GPT</span>
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.55rem', md: '0.6rem' },
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 500,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Smart Farming Assistant
              </Typography>
            </Box>
          </Box>

          {/* Middle: Desktop Navigation */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            ml: 2,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            flexGrow: 1,
            minWidth: 0,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
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
                    borderRadius: '12px',
                    px: 1.5,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '0.92rem',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                    border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                    backdropFilter: isActive ? 'blur(4px)' : 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.14)',
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
              color="inherit"
              onClick={handleModulesMenuClick}
              startIcon={<Dashboard />}
              sx={{
                color: '#ffffff',
                borderRadius: '12px',
                px: 1.5,
                py: 1,
                textTransform: 'none',
                fontSize: '0.92rem',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)' },
                flexShrink: 0,
              }}
            >
              {t('navbar.modules', 'More')}
            </Button>
          </Box>

          {/* Right: Language + User + Mobile menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
            {/* Language icon (phones) */}
            <Box sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
              <IconButton
                color="inherit"
                onClick={handleLanguageClick}
                aria-label="language"
                sx={{ color: '#fff' }}
              >
                <Language />
              </IconButton>
            </Box>

            {/* User Profile or Login (desktop) */}
            {user ? (
              <>
                <IconButton color="inherit" onClick={handleUserMenuClick} aria-label="account" sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#fff' }}>
                  <AccountCircle />
                </IconButton>
                <Chip
                  avatar={
                    <Avatar
                      src={user.profilePicture || ''}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: '#2e7d32',
                        width: 34,
                        height: 34,
                        border: '2px solid rgba(255,255,255,0.5)',
                      }}>
                      {!user.profilePicture && <Person sx={{ fontSize: 20 }} />}
                    </Avatar>
                  }
                  label={`🙏 ${user.name || t('navbar.farmerJi')}`}
                  onClick={handleUserMenuClick}
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    ml: 1,
                    pl: 1,
                    pr: 2,
                    py: 0.5,
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 5,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      transform: 'scale(1.04)',
                    },
                    '& .MuiChip-label': {
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    },
                    transition: 'all 0.25s ease',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <Menu
                  anchorEl={userMenuAnchorEl}
                  open={Boolean(userMenuAnchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: '16px',
                      boxShadow: '0 18px 50px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <MenuItem onClick={() => { fileInputRef.current?.click(); }}>
                    <PhotoCamera sx={{ mr: 2 }} />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </MenuItem>
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
                  display: { xs: 'none', md: 'inline-flex' },
                  ml: 1,
                  color: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.25s ease',
                }}
              >
                {t('navbar.login')}
              </Button>
            )}

            {/* Language (desktop) */}
            <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              <Button
                color="inherit"
                onClick={handleLanguageClick}
                startIcon={<Language />}
                sx={{ ml: 0.5, textTransform: 'none', color: 'rgba(255,255,255,0.95)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}
              >
                {currentLang.name}
              </Button>
            </Box>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton color="inherit" onClick={handleMobileMenuClick} sx={{ ml: 0.5, color: '#fff' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Container>

        {/* Language Menu */}
        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageClose}
          PaperProps={{ sx: { mt: 1, borderRadius: '16px' } }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} onClick={() => handleLanguageChange(language.code)} selected={i18n.language === language.code}>
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
          PaperProps={{ sx: { mt: 1, borderRadius: '16px' } }}
        >
          {navigationItems.map((item) => (
            <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.cloneElement(item.icon, { sx: { mr: 2 } })}
                {item.label}
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* More Menu */}
        <Menu
          anchorEl={modulesMenuAnchorEl}
          open={Boolean(modulesMenuAnchorEl)}
          onClose={handleModulesMenuClose}
          PaperProps={{ sx: { mt: 1, borderRadius: '16px' } }}
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
