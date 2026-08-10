import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Link, 
  Stack
} from '@mui/material';
import { 
  GitHub, 
  Favorite,
  LinkedIn
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = (useTranslation as any)();
  
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #0d2f15 0%, #165a2b 55%, #1b5e20 100%)',
        color: 'white',
        py: 4,
        mt: 6,
        borderTop: '1px solid rgba(139, 195, 74, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #8bc34a, transparent)',
        },
        '&::after': {
          content: '"ðŸŒ¾"',
          position: 'absolute',
          right: 30,
          bottom: -10,
          fontSize: '64px',
          opacity: 0.12,
        },
      }}
    >
      <Container maxWidth="lg">
        {/* Developer Credits */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif" }}>
            {t('footer.developedWith')} <Favorite sx={{ color: '#ff5252', fontSize: 22, animation: 'floatY 2s ease-in-out infinite' }} /> {t('footer.by')}
          </Typography>
          
          {/* Developer Names - Compact */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            sx={{ justifyContent: 'center', mb: 2 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Link 
                href="https://www.linkedin.com/in/rohan-shukla-0b8889321/" 
                target="_blank"
                sx={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  '&:hover': { 
                    textDecoration: 'underline',
                    color: '#c5e1a5',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif" }}>
                  ðŸ‘¨â€ðŸ’» Rohan Shukla
                </Typography>
              </Link>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {t('footer.fullStackDeveloper')}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link 
                href="https://www.linkedin.com/in/abhishek-sharma-354b0b268/s" 
                target="_blank"
                sx={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  '&:hover': { 
                    textDecoration: 'underline',
                    color: '#c5e1a5',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif" }}>
                  ðŸ‘¨â€ðŸ’» Abhishek Sharma
                </Typography>
              </Link>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {t('footer.fullStackDeveloper')}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Bar */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            pt: 2,
            borderTop: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Â© {new Date().getFullYear()} KisanGPT â€¢ Smart Farming Assistant
          </Typography>
          <Link 
            href="https://github.com/shuklaji-coder/kisangpt-smart-farming" 
            target="_blank"
            sx={{ 
              color: 'white', 
              opacity: 0.85, 
              '&:hover': { opacity: 1, transform: 'scale(1.15) rotate(8deg)' },
              transition: 'all 0.25s ease'
            }}
          >
            <GitHub sx={{ fontSize: 22 }} />
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
