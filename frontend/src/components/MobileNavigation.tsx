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
          bottom: 90,
          right: 16,
          zIndex: 1000,
          background: 'linear-gradient(45deg, #2e7d32, #66bb6a)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1b5e20, #4caf50)',
          },
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(46, 125, 50, 0.2)',
        }}
        elevation={8}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleNavigationChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            height: 70,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
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
              <Badge color="error" variant="dot" invisible={false}>
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
          bottom: 80,
          left: 16,
          zIndex: 999,
          borderRadius: 8,
          padding: 1,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
        elevation={4}
      >
        <Fab
          size="small"
          color="secondary"
          aria-label="Weather"
          onClick={() => navigate('/weather')}
          sx={{
            width: 40,
            height: 40,
            minHeight: 40,
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
            width: 40,
            height: 40,
            minHeight: 40,
            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
            '&:hover': {
              background: 'linear-gradient(45deg, #e55a2b, #e6851a)',
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