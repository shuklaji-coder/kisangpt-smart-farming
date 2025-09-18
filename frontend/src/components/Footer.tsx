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
  const { t } = useTranslation();
  
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        py: 3,
        mt: 6,
        borderTop: '2px solid',
        borderColor: 'secondary.main',
      }}
    >
      <Container maxWidth="lg">
        {/* Developer Credits */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {t('footer.developedWith')} <Favorite sx={{ color: '#ff4444', fontSize: 20 }} /> {t('footer.by')}
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
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  👨‍💻 Rohan Shukla
                </Typography>
              </Link>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
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
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  👨‍💻 Abhishek Sharma
                </Typography>
              </Link>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {t('footer.fullStackDeveloper')}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Bottom Bar - Compact */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            pt: 2,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
            {t('footer.copyright')}
          </Typography>
          
          <Link 
            href="https://github.com/shuklaji-coder/kisangpt-smart-farming" 
            target="_blank"
            sx={{ 
              color: 'white', 
              opacity: 0.8, 
              '&:hover': { opacity: 1, transform: 'scale(1.1)' },
              transition: 'all 0.2s ease'
            }}
          >
            <GitHub sx={{ fontSize: 20 }} />
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;