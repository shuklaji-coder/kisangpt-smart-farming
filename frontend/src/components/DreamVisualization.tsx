import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Paper,
  useTheme,
  Divider,
  Chip,
} from '@mui/material';
import {
  Star,
  Today,
  DateRange,
  Event,
  EmojiEvents,
  AutoAwesome,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const DreamVisualization: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const pathwaySteps = [
    {
      title: t('dreamVisualization.today'),
      task: t('dreamVisualization.todayTask'),
      icon: <Today />,
      color: '#4caf50',
      emoji: '😊',
      progress: 100,
      status: 'active',
    },
    {
      title: t('dreamVisualization.next30Days'),
      task: t('dreamVisualization.next30Task'),
      icon: <DateRange />,
      color: '#2196f3',
      emoji: '🚀',
      progress: 60,
      status: 'inProgress',
    },
    {
      title: t('dreamVisualization.oneYearGoal'),
      task: t('dreamVisualization.yearGoal'),
      icon: <Event />,
      color: '#ff9800',
      emoji: '🏆',
      progress: 25,
      status: 'future',
    },
  ];

  const achievements = [
    { icon: '🌾', label: 'Crop Yield', value: '+15%' },
    { icon: '💰', label: 'Income', value: '+25%' },
    { icon: '🏆', label: 'Success Rate', value: '85%' },
    { icon: '❤️', label: 'Happiness', value: '90%' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 50%, #AB47BC 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <AutoAwesome sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⭐ {t('dreamVisualization.title')} ⭐
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('dreamVisualization.subtitle')}
          </Typography>
        </Paper>
      </motion.div>

      {/* Success Pathway Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {pathwaySteps.map((step, index) => (
          <Grid item xs={12} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card
                elevation={4}
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  border: step.status === 'active' ? `3px solid ${step.color}` : 'none',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  transition: 'all 0.4s ease-in-out',
                }}
              >
                {/* Top Icon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: step.color,
                      width: 60,
                      height: 60,
                      border: '4px solid white',
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {step.icon}
                  </Avatar>
                </Box>

                <CardContent sx={{ textAlign: 'center', pt: 5 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      color: step.color,
                    }}
                  >
                    {step.title}
                  </Typography>
                  
                  <Typography
                    variant="h2"
                    sx={{ mb: 2 }}
                  >
                    {step.emoji}
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      fontWeight: 500,
                      lineHeight: 1.6,
                      minHeight: 50,
                    }}
                  >
                    {step.task}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Chip
                      label={`${step.progress}%`}
                      size="small"
                      sx={{
                        bgcolor: step.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(45deg, #4caf50 0%, #8bc34a 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              fontFamily: 'serif',
            }}
          >
            "{t('dreamVisualization.motivationalText')}"
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} sx={{ color: '#ffd700', fontSize: 30 }} />
            ))}
          </Box>
        </Paper>
      </motion.div>

      {/* Achievement Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            textAlign: 'center',
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          🎯 Your Journey Achievements
        </Typography>
        
        <Grid container spacing={2}>
          {achievements.map((achievement, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card
                elevation={2}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[6],
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {achievement.icon}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {achievement.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {achievement.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Success Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <Paper
          elevation={2}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #e0f2f1 100%)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <EmojiEvents sx={{ fontSize: 50, color: '#ff9800', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Success Pathway Visualization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your personalized journey towards agricultural prosperity
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {['🌱 Plant', '🌾 Grow', '📈 Prosper', '🏆 Succeed', '❤️ Happy'].map((step, index) => (
              <Chip
                key={index}
                label={step}
                variant="filled"
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  p: 2,
                }}
              />
            ))}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default DreamVisualization;