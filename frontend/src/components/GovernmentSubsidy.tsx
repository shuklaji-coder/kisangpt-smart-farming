// Government Subsidy & Schemes Component for Farmers
// Comprehensive listing of Indian agricultural schemes and subsidies

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  useTheme,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  AccountBalance,
  Agriculture,
  MonetizationOn,
  CheckCircle,
  Info,
  ExpandMore,
  Search,
  LocationOn,
  Person,
  Assignment,
  Phone,
  Language,
  Download,
  OpenInNew,
  LocalAtm,
  Savings,
  TrendingUp,
  Security,
  Star,
  StarBorder
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { locationService } from '../services/locationService';

// Interfaces for government schemes
interface GovernmentScheme {
  id: string;
  name: string;
  nameHindi: string;
  category: 'subsidy' | 'loan' | 'insurance' | 'equipment' | 'training' | 'marketing';
  department: string;
  subsidy: string;
  eligibility: string[];
  benefits: string[];
  documents: string[];
  applicationProcess: string;
  contactInfo: string;
  website: string;
  isActive: boolean;
  targetGroup: string[];
  maxAmount: number;
  timeline: string;
}

interface SubsidyFilter {
  category: string;
  state: string;
  cropType: string;
  farmSize: string;
}

const GovernmentSubsidy: React.FC = () => {
  const { t } = (useTranslation as any)();
  const theme = useTheme();
  
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<GovernmentScheme[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SubsidyFilter>({
    category: 'all',
    state: 'all',
    cropType: 'all',
    farmSize: 'all'
  });
  const [userLocation, setUserLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // User profile for quick eligibility scoring
  const [profile, setProfile] = useState({
    farmSize: 2,
    isOwner: true,
    isSCST: false,
    age: 30
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fav_schemes') || '[]'); } catch { return []; }
  });
  const toggleFav = (id: string) => {
    const set = new Set(favorites);
    set.has(id) ? set.delete(id) : set.add(id);
    const arr = Array.from(set);
    setFavorites(arr);
    try { localStorage.setItem('fav_schemes', JSON.stringify(arr)); } catch {}
  };

  // Government schemes database
  const governmentSchemes: GovernmentScheme[] = [
    {
      id: 'pm-kisan',
      name: 'PM-KISAN Samman Nidhi',
      nameHindi: 'à¤ªà¥à¤°à¤§à¤¾à¤¨à¤®à¤‚à¤¤à¥à¤°à¥€ à¤•à¤¿à¤¸à¤¾à¤¨ à¤¸à¤®à¥à¤®à¤¾à¤¨ à¤¨à¤¿à¤§à¤¿',
      category: 'subsidy',
      department: 'Ministry of Agriculture',
      subsidy: 'â‚¹6,000 per year (â‚¹2,000 in 3 installments)',
      eligibility: [
        'All landholding farmer families',
        'Small and marginal farmers',
        'Land records in farmer\'s name'
      ],
      benefits: [
        'â‚¹6,000 annual direct cash transfer',
        'No paperwork hassle',
        'Direct bank transfer'
      ],
      documents: [
        'Aadhaar Card',
        'Bank Account Details',
        'Land Ownership Papers',
        'Mobile Number'
      ],
      applicationProcess: 'Online through PM-KISAN portal or CSC centers',
      contactInfo: '011-24300606',
      website: 'https://pmkisan.gov.in',
      isActive: true,
      targetGroup: ['Small Farmers', 'Marginal Farmers', 'All Landowners'],
      maxAmount: 6000,
      timeline: 'Quarterly payments'
    },
    {
      id: 'kcc',
      name: 'Kisan Credit Card',
      nameHindi: 'à¤•à¤¿à¤¸à¤¾à¤¨ à¤•à¥à¤°à¥‡à¤¡à¤¿à¤Ÿ à¤•à¤¾à¤°à¥à¤¡',
      category: 'loan',
      department: 'NABARD',
      subsidy: 'Low interest agricultural credit up to â‚¹3 lakh',
      eligibility: [
        'All farmers (Owner/Tenant)',
        'SHG members',
        'Joint liability groups'
      ],
      benefits: [
        'Flexible repayment',
        'Low interest rates (7% with subsidy)',
        'No processing fee',
        'Accident insurance cover'
      ],
      documents: [
        'Application form',
        'Identity proof',
        'Address proof',
        'Land documents'
      ],
      applicationProcess: 'Apply at any bank branch',
      contactInfo: 'Contact local bank branch',
      website: 'https://www.nabard.org',
      isActive: true,
      targetGroup: ['All Farmers', 'Tenant Farmers', 'Sharecroppers'],
      maxAmount: 300000,
      timeline: '15-30 days processing'
    },
    {
      id: 'pradhan-mantri-fasal-bima',
      name: 'Pradhan Mantri Fasal Bima Yojana',
      nameHindi: 'à¤ªà¥à¤°à¤§à¤¾à¤¨à¤®à¤‚à¤¤à¥à¤°à¥€ à¤«à¤¸à¤² à¤¬à¥€à¤®à¤¾ à¤¯à¥‹à¤œà¤¨à¤¾',
      category: 'insurance',
      department: 'Ministry of Agriculture',
      subsidy: 'Crop insurance with 2% premium for food crops',
      eligibility: [
        'All farmers growing notified crops',
        'Sharecroppers and tenant farmers',
        'Loanee and non-loanee farmers'
      ],
      benefits: [
        'Comprehensive risk coverage',
        'Low premium rates',
        'Quick claim settlement',
        'Technology-based claim assessment'
      ],
      documents: [
        'Aadhaar Card',
        'Bank Account',
        'Land Records',
        'Sowing Certificate'
      ],
      applicationProcess: 'Through banks, CSCs, or insurance companies',
      contactInfo: '1800-180-1551',
      website: 'https://pmfby.gov.in',
      isActive: true,
      targetGroup: ['All Farmers', 'Crop Growers'],
      maxAmount: 200000,
      timeline: 'Claims settled in 30 days'
    },
    {
      id: 'sub-mission-agricultural-mechanization',
      name: 'Sub Mission on Agricultural Mechanization',
      nameHindi: 'à¤•à¥ƒà¤·à¤¿ à¤¯à¤‚à¤¤à¥à¤°à¥€à¤•à¤°à¤£ à¤ªà¤° à¤‰à¤ª à¤®à¤¿à¤¶à¤¨',
      category: 'equipment',
      department: 'Ministry of Agriculture',
      subsidy: '40-50% subsidy on agricultural machinery',
      eligibility: [
        'Individual farmers',
        'Groups of farmers',
        'Cooperative societies'
      ],
      benefits: [
        '40% subsidy for general category',
        '50% for SC/ST farmers',
        'Custom hiring centers support',
        'High-tech equipment access'
      ],
      documents: [
        'Application form',
        'Aadhaar Card',
        'Bank details',
        'Caste certificate (if applicable)'
      ],
      applicationProcess: 'Through state agriculture departments',
      contactInfo: 'Contact District Collector Office',
      website: 'https://agrimachinery.nic.in',
      isActive: true,
      targetGroup: ['Individual Farmers', 'Farmer Groups', 'FPOs'],
      maxAmount: 500000,
      timeline: '60-90 days processing'
    },
    {
      id: 'pm-kisan-mandhan',
      name: 'PM Kisan Maandhan Yojana',
      nameHindi: 'à¤ªà¥€à¤à¤® à¤•à¤¿à¤¸à¤¾à¤¨ à¤®à¤¾à¤¨à¤§à¤¨ à¤¯à¥‹à¤œà¤¨à¤¾',
      category: 'insurance',
      department: 'Ministry of Agriculture',
      subsidy: 'Pension scheme for small & marginal farmers',
      eligibility: [
        'Age 18-40 years',
        'Small & marginal farmers',
        'Landholding up to 2 hectares'
      ],
      benefits: [
        'â‚¹3,000 monthly pension after 60',
        'Government co-contribution',
        'Family pension available',
        'Voluntary and contributory'
      ],
      documents: [
        'Aadhaar Card',
        'Bank Account',
        'Land Records',
        'Age Proof'
      ],
      applicationProcess: 'Online enrollment through CSCs',
      contactInfo: '1800-267-6888',
      website: 'https://maandhan.in',
      isActive: true,
      targetGroup: ['Small Farmers', 'Marginal Farmers', 'Young Farmers'],
      maxAmount: 36000,
      timeline: 'Immediate enrollment'
    },
    {
      id: 'kisan-rail',
      name: 'Kisan Rail Scheme',
      nameHindi: 'à¤•à¤¿à¤¸à¤¾à¤¨ à¤°à¥‡à¤² à¤¯à¥‹à¤œà¤¨à¤¾',
      category: 'marketing',
      department: 'Ministry of Railways',
      subsidy: '50% subsidy on transportation of perishable goods',
      eligibility: [
        'All farmers',
        'FPOs',
        'Cooperative societies'
      ],
      benefits: [
        'Fast transportation of produce',
        'Reduced transportation cost',
        'Cold storage facilities',
        'Direct market access'
      ],
      documents: [
        'Farmer registration',
        'Produce quality certificate',
        'Transportation booking'
      ],
      applicationProcess: 'Book through Indian Railways',
      contactInfo: '139 (Railway Enquiry)',
      website: 'https://indianrailways.gov.in',
      isActive: true,
      targetGroup: ['Commercial Farmers', 'FPOs', 'Exporters'],
      maxAmount: 100000,
      timeline: 'Real-time booking'
    },
    {
      id: 'organic-farming',
      name: 'National Programme for Organic Production',
      nameHindi: 'à¤œà¥ˆà¤µà¤¿à¤• à¤‰à¤¤à¥à¤ªà¤¾à¤¦à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤¾à¤·à¥à¤Ÿà¥à¤°à¥€à¤¯ à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤®',
      category: 'subsidy',
      department: 'Ministry of Agriculture',
      subsidy: 'â‚¹50,000 per hectare for 3 years',
      eligibility: [
        'Individual farmers',
        'Group of farmers',
        'Interested in organic farming'
      ],
      benefits: [
        'Financial support for transition',
        'Organic certification support',
        'Market linkage',
        'Premium prices for produce'
      ],
      documents: [
        'Application form',
        'Land documents',
        'Group formation certificate',
        'Bank details'
      ],
      applicationProcess: 'Through state agriculture departments',
      contactInfo: 'Contact Agriculture Extension Officer',
      website: 'https://www.apeda.gov.in',
      isActive: true,
      targetGroup: ['Progressive Farmers', 'Organic Enthusiasts', 'Groups'],
      maxAmount: 150000,
      timeline: '3-year program'
    },
    {
      id: 'micro-irrigation',
      name: 'Pradhan Mantri Krishi Sinchayee Yojana',
      nameHindi: 'à¤ªà¥à¤°à¤§à¤¾à¤¨à¤®à¤‚à¤¤à¥à¤°à¥€ à¤•à¥ƒà¤·à¤¿ à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ à¤¯à¥‹à¤œà¤¨à¤¾',
      category: 'subsidy',
      department: 'Ministry of Agriculture',
      subsidy: '55% subsidy on drip/sprinkler irrigation',
      eligibility: [
        'All category of farmers',
        'Minimum 0.5 hectare land',
        'Assured water source'
      ],
      benefits: [
        'Water use efficiency',
        '55% cost subsidy',
        'Increased crop productivity',
        'Technical support'
      ],
      documents: [
        'Application with DPR',
        'Land documents',
        'Water source certificate',
        'Bank details'
      ],
      applicationProcess: 'Through District Horticulture Officer',
      contactInfo: 'Contact District Collector',
      website: 'https://pmksy.gov.in',
      isActive: true,
      targetGroup: ['All Farmers', 'Horticulture Farmers'],
      maxAmount: 400000,
      timeline: '90-120 days'
    }
  ];

  useEffect(() => {
    initializeSubsidyData();
  }, []);

  useEffect(() => {
    filterSchemes();
  }, [searchTerm, filters, schemes]);

  const initializeSubsidyData = async () => {
    setLoading(true);
    try {
      // Get user location for state-specific schemes
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      
      // Set schemes data
      setSchemes(governmentSchemes);
      setFilteredSchemes(governmentSchemes);
      
      console.log('âœ… Government schemes loaded');
    } catch (error) {
      console.error('Error loading subsidy data:', error);
      setSchemes(governmentSchemes);
      setFilteredSchemes(governmentSchemes);
    }
    setLoading(false);
  };

  const scoreEligibility = (scheme: GovernmentScheme) => {
    let score = 0;
    const txt = (scheme.eligibility.join(' ') + ' ' + scheme.targetGroup.join(' ')).toLowerCase();
    if (profile.farmSize <= 2 && (txt.includes('small') || txt.includes('marginal'))) score += 2;
    if (profile.isOwner && (txt.includes('land') || txt.includes('landholding'))) score += 1;
    if (profile.isSCST && (txt.includes('sc/st') || txt.includes('sc/st') || txt.includes('sc') || txt.includes('st'))) score += 2;
    if (scheme.category === 'loan' && profile.age >= 18) score += 1;
    if (scheme.category === 'equipment') score += 1;
    return Math.min(5, score);
  };

  const filterSchemes = () => {
    let filtered = schemes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(scheme =>
        scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.nameHindi.includes(searchTerm) ||
        scheme.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(scheme => scheme.category === filters.category);
    }

    // Active schemes only
    filtered = filtered.filter(scheme => scheme.isActive);

    setFilteredSchemes(filtered);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      subsidy: '#4caf50',
      loan: '#2196f3',
      insurance: '#ff9800',
      equipment: '#9c27b0',
      training: '#f44336',
      marketing: '#00bcd4'
    };
    return colors[category as keyof typeof colors] || '#757575';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      subsidy: <MonetizationOn />,
      loan: <LocalAtm />,
      insurance: <Security />,
      equipment: <Agriculture />,
      training: <Assignment />,
      marketing: <TrendingUp />
    };
    return icons[category as keyof typeof icons] || <Info />;
  };

  const handleFilterChange = (filterType: keyof SubsidyFilter, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

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
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <AccountBalance sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ðŸ›ï¸ Government Subsidies & Schemes
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚ à¤”à¤° à¤¸à¤¬à¥à¤¸à¤¿à¤¡à¥€ - à¤•à¤¿à¤¸à¤¾à¤¨à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾
          </Typography>
          
          {userLocation && (
            <Chip
              label={`ðŸ“ ${locationService.formatLocationDisplay(userLocation)}`}
              sx={{
                mt: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          )}
        </Paper>
      </motion.div>

      {/* Search, Filters & Profile */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search schemes... (à¤¯à¥‹à¤œà¤¨à¤¾ à¤–à¥‹à¤œà¥‡à¤‚)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ borderRadius: 3 }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="subsidy">Subsidy (à¤¸à¤¬à¥à¤¸à¤¿à¤¡à¥€)</MenuItem>
            <MenuItem value="loan">Loans (à¤‹à¤£)</MenuItem>
            <MenuItem value="insurance">Insurance (à¤¬à¥€à¤®à¤¾)</MenuItem>
            <MenuItem value="equipment">Equipment (à¤¯à¤‚à¤¤à¥à¤°)</MenuItem>
            <MenuItem value="marketing">Marketing (à¤µà¤¿à¤ªà¤£à¤¨)</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p:2, borderRadius:2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight:700, mb:1 }}>ðŸ‘¤ Your Profile (Eligibility)</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}><TextField size="small" type="number" label="Farm Size (ha)" value={profile.farmSize} onChange={(e)=>setProfile({ ...profile, farmSize:+e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField size="small" type="number" label="Age" value={profile.age} onChange={(e)=>setProfile({ ...profile, age:+e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><FormControlLabel control={<Checkbox checked={profile.isOwner} onChange={(e)=>setProfile({ ...profile, isOwner:e.target.checked })} />} label="Land Owner" /></Grid>
              <Grid item xs={6}><FormControlLabel control={<Checkbox checked={profile.isSCST} onChange={(e)=>setProfile({ ...profile, isSCST:e.target.checked })} />} label="SC/ST" /></Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {filteredSchemes.length}
            </Typography>
            <Typography variant="body2">Available Schemes</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
              â‚¹50L+
            </Typography>
            <Typography variant="body2">Max Subsidy Amount</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
              8+
            </Typography>
            <Typography variant="body2">Active Categories</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(156, 39, 176, 0.1)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
              24/7
            </Typography>
            <Typography variant="body2">Online Access</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Schemes List */}
      <Grid container spacing={3}>
        {filteredSchemes.map((scheme, index) => (
          <Grid item xs={12} lg={6} key={scheme.id}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getCategoryColor(scheme.category),
                        mr: 2,
                        width: 56,
                        height: 56
                      }}
                    >
                      {getCategoryIcon(scheme.category)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {scheme.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        {scheme.nameHindi}
                      </Typography>
                      <Chip
                        label={scheme.category.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(scheme.category),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Subsidy Amount + Score + Favorite */}
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
                    <Alert severity="success" sx={{ flex:1, borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ðŸ’° {scheme.subsidy}
                      </Typography>
                    </Alert>
                    <Tooltip title={favorites.includes(scheme.id) ? 'Remove Favorite' : 'Add Favorite'}>
                      <IconButton onClick={()=>toggleFav(scheme.id)}>
                        {favorites.includes(scheme.id) ? <Star color="warning" /> : <StarBorder />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:2 }}>
                    Eligibility score: {scoreEligibility(scheme)}/5
                  </Typography>

                  {/* Key Benefits */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ðŸŽ¯ Key Benefits:
                  </Typography>
                  <List dense sx={{ mb: 2 }}>
                    {scheme.benefits.slice(0, 3).map((benefit, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {/* Details Accordion */}
                  <Accordion sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ðŸ“‹ Complete Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                            Eligibility:
                          </Typography>
                          <List dense>
                            {scheme.eligibility.map((criteria, idx) => (
                              <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                                <ListItemText 
                                  primary={`â€¢ ${criteria}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                            Required Documents:
                          </Typography>
                          <List dense>
                            {scheme.documents.map((doc, idx) => (
                              <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                                <ListItemText 
                                  primary={`â€¢ ${doc}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          ðŸ“ž Contact & Application:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Process:</strong> {scheme.applicationProcess}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Contact:</strong> {scheme.contactInfo}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Timeline:</strong> {scheme.timeline}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<OpenInNew />}
                      onClick={() => window.open(scheme.website, '_blank')}
                      sx={{ borderRadius: 2 }}
                    >
                      Apply Online
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Phone />}
                      onClick={() => window.open(`tel:${scheme.contactInfo}`, '_blank')}
                      sx={{ borderRadius: 2 }}
                    >
                      Call Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* No Results */}
      {filteredSchemes.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No schemes found for your search criteria
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setFilters({
                category: 'all',
                state: 'all',
                cropType: 'all',
                farmSize: 'all'
              });
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}

      {/* Footer Info */}
      <Paper elevation={2} sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          ðŸ“¢ Important Information:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Info color="primary" /></ListItemIcon>
            <ListItemText 
              primary="All schemes are subject to government terms and conditions"
              secondary="à¤¸à¤­à¥€ à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚ à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤¨à¤¿à¤¯à¤® à¤”à¤° à¤¶à¤°à¥à¤¤à¥‹à¤‚ à¤•à¥‡ à¤…à¤§à¥€à¤¨ à¤¹à¥ˆà¤‚"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
            <ListItemText 
              primary="Apply through official channels only to avoid fraud"
              secondary="à¤§à¥‹à¤–à¤¾à¤§à¤¡à¤¼à¥€ à¤¸à¥‡ à¤¬à¤šà¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥‡à¤µà¤² à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤®à¤¾à¤§à¥à¤¯à¤®à¥‹à¤‚ à¤¸à¥‡ à¤†à¤µà¥‡à¤¦à¤¨ à¤•à¤°à¥‡à¤‚"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Phone color="secondary" /></ListItemIcon>
            <ListItemText 
              primary="Contact local agriculture officer for detailed guidance"
              secondary="à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤•à¥ƒà¤·à¤¿ à¤…à¤§à¤¿à¤•à¤¾à¤°à¥€ à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default GovernmentSubsidy;