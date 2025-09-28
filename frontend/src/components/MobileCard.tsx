import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface MobileCardProps {
  title: string;
  subtitle?: string;
  description: string;
  icon?: React.ReactNode;
  avatar?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  status?: {
    label: string;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
  trending?: boolean;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  avatar,
  primaryAction,
  secondaryAction,
  status,
  trending,
  onShare,
  onFavorite,
  isFavorite,
  onClick,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Card
      className="farmer-card"
      sx={{
        borderRadius: isMobile ? 16 : 20,
        boxShadow: isMobile 
          ? '0 4px 16px rgba(0, 0, 0, 0.08)' 
          : '0 8px 24px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(46, 125, 50, 0.1)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        marginBottom: isMobile ? 16 : 20,
        '&:hover': {
          transform: isMobile ? 'translateY(-2px)' : 'translateY(-4px)',
          boxShadow: isMobile 
            ? '0 8px 24px rgba(0, 0, 0, 0.12)' 
            : '0 16px 36px rgba(0, 0, 0, 0.15)',
        },
        '&:active': {
          transform: onClick ? 'scale(0.98)' : 'none',
        },
      }}
      onClick={onClick}
    >
      {/* Status Bar */}
      {(status || trending) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: status 
              ? `linear-gradient(90deg, ${theme.palette[status.color].main}, ${theme.palette[status.color].light})`
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          }}
        />
      )}

      <CardContent
        sx={{
          padding: isMobile ? '16px' : '20px',
          paddingBottom: isMobile ? '12px' : '16px',
        }}
      >
        {/* Header with Icon/Avatar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {avatar && (
              <Avatar
                src={avatar}
                sx={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  bgcolor: theme.palette.primary.main,
                }}
              />
            )}
            {icon && !avatar && (
              <Box
                sx={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.main,
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    marginTop: 0.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Status Chip and Trending Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trending && (
              <TrendingIcon
                sx={{
                  color: theme.palette.success.main,
                  fontSize: isMobile ? '1rem' : '1.2rem',
                }}
              />
            )}
            {status && (
              <Chip
                label={status.label}
                color={status.color}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  height: isMobile ? 24 : 28,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            lineHeight: 1.6,
            marginBottom: children ? 2 : 0,
          }}
        >
          {description}
        </Typography>

        {/* Custom Children Content */}
        {children && (
          <Box sx={{ marginTop: 2 }}>
            {children}
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      {(primaryAction || secondaryAction || onShare || onFavorite) && (
        <CardActions
          sx={{
            padding: isMobile ? '8px 16px 16px' : '12px 20px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Primary Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {primaryAction && (
              <Button
                variant="contained"
                color={primaryAction.color || 'primary'}
                onClick={(e) => {
                  e.stopPropagation();
                  primaryAction.onClick();
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  minHeight: 40,
                }}
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  secondaryAction.onClick();
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  minHeight: 40,
                }}
              >
                {secondaryAction.label}
              </Button>
            )}
          </Box>

          {/* Secondary Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {onFavorite && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  color: isFavorite ? theme.palette.error.main : theme.palette.text.secondary,
                  minHeight: 48,
                  minWidth: 48,
                }}
              >
                <FavoriteIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
            {onShare && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  color: theme.palette.text.secondary,
                  minHeight: 48,
                  minWidth: 48,
                }}
              >
                <ShareIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
            <IconButton
              size={isMobile ? 'small' : 'medium'}
              sx={{
                color: theme.palette.text.secondary,
                minHeight: 48,
                minWidth: 48,
              }}
            >
              <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        </CardActions>
      )}
    </Card>
  );
};

export default MobileCard;