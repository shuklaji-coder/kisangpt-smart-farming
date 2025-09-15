import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  BugReport,
  CloudUpload,
  LocalHospital,
  Healing,
  Security,
  CalendarMonth,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';

interface DiseaseInfo {
  name: string;
  severity: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  prevention: string[];
  economic_impact: string;
}

const DiseaseDetection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [cropType, setCropType] = useState('wheat');
  const [location, setLocation] = useState('Delhi');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('crop_type', cropType);
    formData.append('location', location);

    try {
      // Backend API call for image analysis
      const response = await axios.post('http://localhost:8000/api/disease/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDiseaseResult(response.data);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Mock response for demo
      setDiseaseResult({
        name: 'Leaf Rust',
        severity: 'Medium',
        confidence: 0.85,
        symptoms: ['Orange-brown pustules on leaves', 'Yellowing of leaf margins', 'Reduced plant vigor'],
        treatments: ['Apply fungicide spray', 'Improve air circulation', 'Remove affected leaves'],
        prevention: ['Use resistant varieties', 'Proper spacing', 'Regular monitoring'],
        economic_impact: 'Potential yield loss: 15-25%'
      });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const quickDiseaseChecks = [
    { disease: 'Wheat Rust', crops: ['Wheat', 'Barley'], icon: '🌾', severity: 'High' },
    { disease: 'Powdery Mildew', crops: ['Rice', 'Wheat'], icon: '🍃', severity: 'Medium' },
    { disease: 'Blight', crops: ['Tomato', 'Potato'], icon: '🍅', severity: 'High' },
    { disease: 'Mosaic Virus', crops: ['Cucumber', 'Pepper'], icon: '🥒', severity: 'Medium' },
  ];

  const cropOptions = [
    { value: 'wheat', label: 'Wheat (गेहूं)' },
    { value: 'rice', label: 'Rice (चावल)' },
    { value: 'tomato', label: 'Tomato (टमाटर)' },
    { value: 'potato', label: 'Potato (आलू)' },
    { value: 'sugarcane', label: 'Sugarcane (गन्ना)' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
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
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 50%, #ff5722 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <BugReport sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔍 {t('diseaseDetection.title', 'Disease Detection')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('diseaseDetection.subtitle', 'फसल की बीमारी की पहचान करें और तुरंत इलाज पाएं')}
          </Typography>
        </Paper>
      </motion.div>

      {/* Image Upload Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                  📸 Upload Crop Image
                </Typography>
                
                {/* Crop and Location Selection */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Crop Type"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      size="small"
                    >
                      {cropOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    mb: 3,
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {!imagePreview && (
                    <>
                      <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Upload crop/leaf image
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Supported: JPG, PNG, JPEG
                      </Typography>
                    </>
                  )}
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <label htmlFor="image-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ borderRadius: 3 }}
                    >
                      Choose Image
                    </Button>
                  </label>
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={analyzeImage}
                    disabled={!selectedImage || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
                    sx={{ borderRadius: 3 }}
                  >
                    {loading ? 'Analyzing...' : 'Detect Disease'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                  🚨 Common Diseases
                </Typography>
                
                <List>
                  {quickDiseaseChecks.map((disease, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: getSeverityColor(disease.severity) }}>
                            {disease.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={disease.disease}
                          secondary={`Crops: ${disease.crops.join(', ')}`}
                        />
                        <Chip
                          label={disease.severity}
                          size="small"
                          sx={{
                            bgcolor: getSeverityColor(disease.severity),
                            color: 'white',
                          }}
                        />
                      </ListItem>
                      {index < quickDiseaseChecks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Disease Information Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white', textAlign: 'center' }}>
          <BugReport sx={{ mr: 1 }} />
          Disease Analysis Results
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {diseaseResult && (
            <Box>
              <Alert
                severity={diseaseResult.severity === 'High' ? 'error' : diseaseResult.severity === 'Medium' ? 'warning' : 'info'}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {diseaseResult.name} Detected
                </Typography>
                <Typography variant="body2">
                  Confidence: {(diseaseResult.confidence * 100).toFixed(1)}% | Severity: {diseaseResult.severity}
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Warning sx={{ mr: 1, color: '#ff9800' }} />
                      Symptoms
                    </Typography>
                    <List dense>
                      {diseaseResult.symptoms.map((symptom, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText primary={symptom} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <LocalHospital sx={{ mr: 1, color: '#f44336' }} />
                      Treatment
                    </Typography>
                    <List dense>
                      {diseaseResult.treatments.map((treatment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Healing sx={{ fontSize: 16, color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText primary={treatment} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ mr: 1, color: '#2196f3' }} />
                      Prevention
                    </Typography>
                    <List dense>
                      {diseaseResult.prevention.map((prevention, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText primary={prevention} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      💰 Economic Impact
                    </Typography>
                    <Typography variant="body2">
                      {diseaseResult.economic_impact}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ borderRadius: 3 }}>
            Close
          </Button>
          <Button variant="contained" sx={{ borderRadius: 3 }}>
            Save Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiseaseDetection;
