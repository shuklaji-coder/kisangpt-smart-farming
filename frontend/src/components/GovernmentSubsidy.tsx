// Government Subsidy & Schemes Component for Farmers
// Comprehensive listing of Indian agricultural schemes and subsidies

import React, { useState, useEffect } from 'react';
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
  Tooltip
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
  Security
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
  const { t } = useTranslation();
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

  // Government schemes database
  const governmentSchemes: GovernmentScheme[] = [
    {
      id: 'pm-kisan',
      name: 'PM-KISAN Samman Nidhi',
      nameHindi: 'प्रधानमंत्री किसान सम्मान निधि',
      category: 'subsidy',
      department: 'Ministry of Agriculture',
      subsidy: '₹6,000 per year (₹2,000 in 3 installments)',
      eligibility: [
        'All landholding farmer families',
        'Small and marginal farmers',
        'Land records in farmer\'s name'
      ],
      benefits: [
        '₹6,000 annual direct cash transfer',
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
      nameHindi: 'किसान क्रेडिट कार्ड',
      category: 'loan',
      department: 'NABARD',
      subsidy: 'Low interest agricultural credit up to ₹3 lakh',
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
      nameHindi: 'प्रधानमंत्री फसल बीमा योजना',
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
      nameHindi: 'कृषि यंत्रीकरण पर उप मिशन',
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
      nameHindi: 'पीएम किसान मानधन योजना',
      category: 'insurance',
      department: 'Ministry of Agriculture',
      subsidy: 'Pension scheme for small & marginal farmers',
      eligibility: [
        'Age 18-40 years',
        'Small & marginal farmers',
        'Landholding up to 2 hectares'
      ],
      benefits: [
        '₹3,000 monthly pension after 60',
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
      nameHindi: 'किसान रेल योजना',
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
      nameHindi: 'जैविक उत्पादन के लिए राष्ट्रीय कार्यक्रम',
      category: 'subsidy',
      department: 'Ministry of Agriculture',
      subsidy: '₹50,000 per hectare for 3 years',
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
      nameHindi: 'प्रधानमंत्री कृषि सिंचाई योजना',
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
      
      console.log('✅ Government schemes loaded');
    } catch (error) {
      console.error('Error loading subsidy data:', error);
      setSchemes(governmentSchemes);
      setFilteredSchemes(governmentSchemes);
    }
    setLoading(false);
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
            🏛️ Government Subsidies & Schemes
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            सरकारी योजनाएं और सब्सिडी - किसानों के लिए वित्तीय सहायता
          </Typography>
          
          {userLocation && (
            <Chip
              label={`📍 ${locationService.formatLocationDisplay(userLocation)}`}
              sx={{
                mt: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          )}
        </Paper>
      </motion.div>

      {/* Search and Filters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search schemes... (योजना खोजें)"
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
            <MenuItem value="subsidy">Subsidy (सब्सिडी)</MenuItem>
            <MenuItem value="loan">Loans (ऋण)</MenuItem>
            <MenuItem value="insurance">Insurance (बीमा)</MenuItem>
            <MenuItem value="equipment">Equipment (यंत्र)</MenuItem>
            <MenuItem value="marketing">Marketing (विपणन)</MenuItem>
          </TextField>
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
              ₹50L+
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

                  {/* Subsidy Amount */}
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      💰 {scheme.subsidy}
                    </Typography>
                  </Alert>

                  {/* Key Benefits */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🎯 Key Benefits:
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
                        📋 Complete Details
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
                                  primary={`• ${criteria}`}
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
                                  primary={`• ${doc}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          📞 Contact & Application:
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
          📢 Important Information:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><Info color="primary" /></ListItemIcon>
            <ListItemText 
              primary="All schemes are subject to government terms and conditions"
              secondary="सभी योजनाएं सरकारी नियम और शर्तों के अधीन हैं"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
            <ListItemText 
              primary="Apply through official channels only to avoid fraud"
              secondary="धोखाधड़ी से बचने के लिए केवल आधिकारिक माध्यमों से आवेदन करें"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Phone color="secondary" /></ListItemIcon>
            <ListItemText 
              primary="Contact local agriculture officer for detailed guidance"
              secondary="विस्तृत मार्गदर्शन के लिए स्थानीय कृषि अधिकारी से संपर्क करें"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default GovernmentSubsidy;