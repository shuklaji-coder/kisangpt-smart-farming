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
  PhotoCamera,
  DeleteForever,
  RestartAlt,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';
import { diseaseDetectionService } from '../services/diseaseDetectionService';
import { detectDiseaseOnDevice } from '../services/onnxDiseaseModel';
import { Tooltip } from '@mui/material';

interface DiseaseInfo {
  name: string;
  severity: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  prevention: string[];
  economic_impact: string;
  healthScore?: number;
  recommendations?: string[];
  urgentActions?: string[];
  imageQuality?: 'excellent' | 'good' | 'poor';
  plantPart?: string;
}

const DiseaseDetection: React.FC = () => {
  const { t } = (useTranslation as any)();
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [cropType, setCropType] = useState('wheat');
  const [location, setLocation] = useState('Delhi');
  const [dragActive, setDragActive] = useState(false);

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

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    
    try {
      // Try on-device ONNX model first (if configured)
      const onnx = await detectDiseaseOnDevice(selectedImage);
      if (onnx) {
        const diseaseInfo: DiseaseInfo = {
          name: `Detected: ${onnx.label}`,
          severity: onnx.confidence > 0.8 ? 'High' : onnx.confidence > 0.6 ? 'Medium' : 'Low',
          confidence: onnx.confidence,
          symptoms: ['à¤®à¥‰à¤¡à¤² à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤ªà¤¹à¤šà¤¾à¤¨à¤¾ à¤—à¤¯à¤¾ à¤ªà¥ˆà¤Ÿà¤°à¥à¤¨'],
          treatments: ['à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤•à¥ƒà¤·à¤¿ à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž à¤¸à¥‡ à¤¸à¤²à¤¾à¤¹ à¤²à¥‡à¤‚', 'à¤²à¤•à¥à¤·à¤£-à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤‰à¤ªà¤šà¤¾à¤° à¤…à¤ªà¤¨à¤¾à¤à¤'],
          prevention: ['à¤¸à¥à¤µà¤šà¥à¤› à¤–à¥‡à¤¤à¥€', 'à¤‰à¤šà¤¿à¤¤ à¤ªà¥‹à¤·à¤£', 'à¤¸à¤®à¤¯ à¤ªà¤° à¤¸à¥à¤ªà¥à¤°à¥‡'],
          economic_impact: 'à¤®à¥‰à¤¡à¤² à¤…à¤¨à¥à¤®à¤¾à¤¨ (on-device)'
        };
        setDiseaseResult(diseaseInfo);
        setOpenDialog(true);
        return;
      }

      // Use server-side AI disease detection service
      const healthAnalysis = await diseaseDetectionService.detectDisease(selectedImage);
      
      // Convert AI analysis to component format
      if (healthAnalysis.diseases.length > 0) {
        const primaryDisease = healthAnalysis.diseases[0];
        const diseaseInfo: DiseaseInfo = {
          name: `${primaryDisease.name} (${primaryDisease.hindiName})`,
          severity: primaryDisease.severity === 'severe' ? 'High' : 
                   primaryDisease.severity === 'moderate' ? 'Medium' : 'Low',
          confidence: primaryDisease.confidence / 100,
          symptoms: primaryDisease.symptoms,
          treatments: [
            ...primaryDisease.organicTreatments.slice(0, 3),
            ...primaryDisease.chemicalTreatments.slice(0, 2)
          ],
          prevention: primaryDisease.preventions || [
            'à¤¨à¤¿à¤¯à¤®à¤¿à¤¤ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤•à¤°à¥‡à¤‚',
            'à¤ªà¥à¤°à¤¤à¤¿à¤°à¥‹à¤§à¥€ à¤•à¤¿à¤¸à¥à¤®à¥‹à¤‚ à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¥‡à¤‚'
          ],
          economic_impact: `à¤¸à¤‚à¤­à¤¾à¤µà¤¿à¤¤ à¤¨à¥à¤•à¤¸à¤¾à¤¨: ${primaryDisease.economicImpact.yieldLoss}% à¤‰à¤¤à¥à¤ªà¤¾à¤¦à¤¨ à¤•à¤®à¥€ | à¤‡à¤²à¤¾à¤œ à¤•à¥€ à¤²à¤¾à¤—à¤¤: â‚¹${primaryDisease.economicImpact.treatmentCost}`,
          healthScore: healthAnalysis.overallHealth,
          recommendations: healthAnalysis.recommendations,
          urgentActions: healthAnalysis.urgentActions,
          imageQuality: healthAnalysis.imageMetadata.quality,
          plantPart: healthAnalysis.imageMetadata.plantPart
        };
        
        setDiseaseResult(diseaseInfo);
      } else {
        // Healthy crop detected
        setDiseaseResult({
          name: 'à¤¸à¥à¤µà¤¸à¥à¤¥ à¤«à¤¸à¤² (Healthy Crop)',
          severity: 'None',
          confidence: healthAnalysis.overallHealth / 100,
          symptoms: ['à¤•à¥‹à¤ˆ à¤¬à¥€à¤®à¤¾à¤°à¥€ à¤•à¥‡ à¤²à¤•à¥à¤·à¤£ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¥‡'],
          treatments: ['à¤•à¥‹à¤ˆ à¤‡à¤²à¤¾à¤œ à¤•à¥€ à¤œà¤°à¥‚à¤°à¤¤ à¤¨à¤¹à¥€à¤‚'],
          prevention: healthAnalysis.recommendations,
          economic_impact: 'à¤•à¥‹à¤ˆ à¤†à¤°à¥à¤¥à¤¿à¤• à¤¨à¥à¤•à¤¸à¤¾à¤¨ à¤¨à¤¹à¥€à¤‚',
          healthScore: healthAnalysis.overallHealth,
          imageQuality: healthAnalysis.imageMetadata.quality
        });
      }
      
      setOpenDialog(true);

    } catch (error) {
      console.error('AI Disease Detection Error:', error);
      
      // Enhanced fallback response
      setDiseaseResult({
        name: 'à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤…à¤¸à¤«à¤² (Analysis Failed)',
        severity: 'Unknown',
        confidence: 0.5,
        symptoms: ['à¤‡à¤®à¥‡à¤œ à¤•à¥€ à¤—à¥à¤£à¤µà¤¤à¥à¤¤à¤¾ à¤¬à¥‡à¤¹à¤¤à¤° à¤•à¤°à¤•à¥‡ à¤«à¤¿à¤° à¤•à¥‹à¤¶à¤¿à¤¶ à¤•à¤°à¥‡à¤‚'],
        treatments: ['à¤…à¤šà¥à¤›à¥€ à¤°à¥‹à¤¶à¤¨à¥€ à¤®à¥‡à¤‚ à¤«à¥‹à¤Ÿà¥‹ à¤²à¥‡à¤‚', 'à¤ªà¤¤à¥à¤¤à¤¿à¤¯à¥‹à¤‚ à¤•à¥‹ à¤ªà¤¾à¤¸ à¤¸à¥‡ à¤¦à¤¿à¤–à¤¾à¤à¤‚'],
        prevention: ['à¤¨à¤¿à¤¯à¤®à¤¿à¤¤ à¤®à¤¾à¤¨à¤¿à¤Ÿà¤°à¤¿à¤‚à¤— à¤•à¤°à¥‡à¤‚'],
        economic_impact: 'à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤…à¤¸à¤«à¤²'
      });
      setOpenDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const quickDiseaseChecks = [
    { disease: 'Wheat Rust', crops: ['Wheat', 'Barley'], icon: 'ðŸŒ¾', severity: 'High' },
    { disease: 'Powdery Mildew', crops: ['Rice', 'Wheat'], icon: 'ðŸƒ', severity: 'Medium' },
    { disease: 'Blight', crops: ['Tomato', 'Potato'], icon: 'ðŸ…', severity: 'High' },
    { disease: 'Mosaic Virus', crops: ['Cucumber', 'Pepper'], icon: 'ðŸ¥’', severity: 'Medium' },
  ];

  const cropOptions = [
    { value: 'wheat', label: 'Wheat (à¤—à¥‡à¤¹à¥‚à¤‚)' },
    { value: 'rice', label: 'Rice (à¤šà¤¾à¤µà¤²)' },
    { value: 'tomato', label: 'Tomato (à¤Ÿà¤®à¤¾à¤Ÿà¤°)' },
    { value: 'potato', label: 'Potato (à¤†à¤²à¥‚)' },
    { value: 'sugarcane', label: 'Sugarcane (à¤—à¤¨à¥à¤¨à¤¾)' },
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
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #4caf50 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <BugReport sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ðŸ” {t('diseaseDetection.title', 'Disease Detection')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('diseaseDetection.subtitle', 'à¤«à¤¸à¤² à¤•à¥€ à¤¬à¥€à¤®à¤¾à¤°à¥€ à¤•à¥€ à¤ªà¤¹à¤šà¤¾à¤¨ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤¤à¥à¤°à¤‚à¤¤ à¤‡à¤²à¤¾à¤œ à¤ªà¤¾à¤à¤‚')}
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
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
                  ðŸ“¸ Leaf Photo (à¤«à¤¸à¤² à¤•à¥€ à¤ªà¤¤à¥à¤¤à¥€ à¤•à¥€ à¤«à¥‹à¤Ÿà¥‹)
                </Typography>

                {/* Friendly steps */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label="1ï¸âƒ£ à¤«à¤¸à¤² à¤šà¥à¤¨à¥‡à¤‚ / Choose crop" color="default" variant="outlined" />
                  <Chip label="2ï¸âƒ£ à¤«à¥‹à¤Ÿà¥‹ à¤²à¥‡à¤‚ / Take photo" color="default" variant="outlined" />
                  <Chip label="3ï¸âƒ£ à¤¨à¤¿à¤¦à¤¾à¤¨ / Analyze" color="default" variant="outlined" />
                </Box>
                
                {/* Crop and Location Selection */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleImageUpload(event);
                    }
                  }}
                  sx={{
                    border: `2px dashed ${dragActive ? theme.palette.primary.main : '#ccc'}`,
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    mb: 3,
                    minHeight: 240,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: imagePreview ? `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url(${imagePreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {!imagePreview && (
                    <>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%', justifyContent: 'center' }}>
                        <label htmlFor="image-capture">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<PhotoCamera />}
                            size="large"
                            sx={{ borderRadius: 3, minWidth: 220 }}
                          >
                            à¤•à¥ˆà¤®à¤°à¤¾ à¤¸à¥‡ à¤«à¥‹à¤Ÿà¥‹ à¤²à¥‡à¤‚
                          </Button>
                        </label>
                        <label htmlFor="image-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                            size="large"
                            sx={{ borderRadius: 3, minWidth: 220 }}
                          >
                            à¤—à¥ˆà¤²à¤°à¥€ à¤¸à¥‡ à¤šà¥à¤¨à¥‡à¤‚
                          </Button>
                        </label>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        à¤¯à¤¾ à¤«à¥‹à¤Ÿà¥‹ à¤¯à¤¹à¤¾à¤ à¤¡à¥à¤°à¥ˆà¤— à¤”à¤° à¤¡à¥à¤°à¥‰à¤ª à¤•à¤°à¥‡à¤‚ â€¢ Or, drag & drop here
                      </Typography>
                    </>
                  )}
                  <>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    {/* Camera capture for mobile devices */}
                    <input
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      id="image-capture"
                      type="file"
                      onChange={handleImageUpload}
                    />
                  </>

                  {imagePreview && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      display: 'flex',
                      gap: 1,
                      background: 'rgba(0,0,0,0.35)',
                      p: 1,
                      borderRadius: 2,
                    }}>
                      <Tooltip title={t('diseaseDetection.takePhoto', 'Take Photo')}>
                        <Button size="small" variant="contained" color="secondary" startIcon={<RestartAlt />} onClick={() => (document.getElementById('image-capture') as HTMLInputElement)?.click()} sx={{ borderRadius: 2 }}>
                          Retake
                        </Button>
                      </Tooltip>
                      <Tooltip title="Remove image">
                        <Button size="small" variant="outlined" color="inherit" startIcon={<DeleteForever />} onClick={clearImage} sx={{ borderRadius: 2, color: 'white', borderColor: 'rgba(255,255,255,0.7)' }}>
                          Remove
                        </Button>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip label="JPG/PNG â€¢ up to ~10MB" size="small" sx={{ opacity: 0.7 }} />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={analyzeImage}
                    disabled={!selectedImage || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
                    sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #ef5350, #ff7043)', px: 4 }}
                    fullWidth
                  >
                    {loading ? 'à¤œà¤¾à¤‚à¤š à¤¹à¥‹ à¤°à¤¹à¥€ à¤¹à¥ˆ...' : 'Analyze Now / à¤…à¤­à¥€ à¤œà¤¾à¤à¤š à¤•à¤°à¥‡à¤‚'}
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
                  ðŸš¨ Common Diseases
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
                      ðŸ’° Economic Impact
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
