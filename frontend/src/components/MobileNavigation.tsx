import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
  Fab,
  Badge,
} from '@mui/material';
import {
  Home as HomeIcon,
  Agriculture as AgricultureIcon,
  TrendingUp as MarketIcon,
  Forum as CommunityIcon,
  AccountBalance as GovIcon,
  SmartToy as AIIcon,
  CloudQueue as WeatherIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavigation: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Don't show on login page
  if (location.pathname === '/login' || location.pathname === '/auth') {
    return null;
  }

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  // Get current path value for bottom navigation
  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 0;
    if (path === '/disease-detection' || path.includes('crop')) return 1;
    if (path === '/market-analysis') return 2;
    if (path === '/community') return 3;
    if (path === '/government-subsidy') return 4;
    return 0;
  };

  const handleNavigationChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/disease-detection');
        break;
      case 2:
        navigate('/market-analysis');
        break;
      case 3:
        navigate('/community');
        break;
      case 4:
        navigate('/government-subsidy');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <>
      {/* Floating AI Chat Button */}
      <Fab
        color="primary"
        aria-label="AI Chat"
        sx={{
          position: 'fixed',
          bottom: 92,
          right: 16,
          zIndex: 1000,
          width: 58,
          height: 58,
          background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
          boxShadow: '0 12px 30px rgba(27, 94, 32, 0.45)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1b5e20, #4caf50)',
          },
          '@keyframes wiggle': {
            '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
            '25%': { transform: 'rotate(-6deg) scale(1.04)' },
            '75%': { transform: 'rotate(6deg) scale(1.04)' },
          },
          animation: 'wiggle 4s ease-in-out infinite',
        }}
        onClick={() => navigate('/ai-chat')}
      >
        <AIIcon />
      </Fab>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(18px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          borderTop: '1px solid rgba(46, 125, 50, 0.12)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -10px 40px rgba(31, 82, 38, 0.12)',
        }}
        elevation={8}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleNavigationChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            height: 72,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              fontSize: '0.72rem',
              fontWeight: 600,
              fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
              color: theme.palette.text.secondary,
              transition: 'transform 0.2s ease, color 0.2s ease',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                transform: 'translateY(-3px)',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.68rem',
              fontWeight: 700,
            },
            '& .MuiBottomNavigationAction-icon': {
              fontSize: '1.5rem',
              marginBottom: '2px',
            },
          }}
        >
          <BottomNavigationAction
            label="होम"
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            label="फसल"
            icon={
              <Badge color="error" variant="dot">
                <AgricultureIcon />
              </Badge>
            }
          />
          <BottomNavigationAction
            label="मंडी"
            icon={<MarketIcon />}
          />
          <BottomNavigationAction
            label="समुदाय"
            icon={
              <Badge color="primary" badgeContent={3} max={9}>
                <CommunityIcon />
              </Badge>
            }
          />
          <BottomNavigationAction
            label="योजना"
            icon={<GovIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* Quick Action Menu */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 82,
          left: 16,
          zIndex: 999,
          borderRadius: '16px',
          padding: 1,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          boxShadow: '0 12px 35px rgba(31, 82, 38, 0.18)',
          border: '1px solid rgba(46, 125, 50, 0.12)',
        }}
        elevation={4}
      >
        <Fab
          size="small"
          color="secondary"
          aria-label="Weather"
          onClick={() => navigate('/weather')}
          sx={{
            width: 42,
            height: 42,
            minHeight: 42,
            background: 'linear-gradient(135deg, #0288d1, #4fc3f7)',
            boxShadow: '0 8px 20px rgba(2, 136, 209, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #01579b, #0288d1)',
            },
          }}
        >
          <WeatherIcon fontSize="small" />
        </Fab>

        <Fab
          size="small"
          color="secondary"
          aria-label="Camera"
          onClick={() => navigate('/disease-detection')}
          sx={{
            width: 42,
            height: 42,
            minHeight: 42,
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            boxShadow: '0 8px 20px rgba(255, 107, 53, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #e55a2b, #e6851a)',
            },
          }}
        >
          <CameraIcon fontSize="small" />
        </Fab>
      </Paper>
    </>
  );
};

export default MobileNavigation;
