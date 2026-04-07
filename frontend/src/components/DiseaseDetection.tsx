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
  const { t } = useTranslation();
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
          symptoms: ['मॉडल द्वारा पहचाना गया पैटर्न'],
          treatments: ['स्थानीय कृषि विशेषज्ञ से सलाह लें', 'लक्षण-आधारित उपचार अपनाएँ'],
          prevention: ['स्वच्छ खेती', 'उचित पोषण', 'समय पर स्प्रे'],
          economic_impact: 'मॉडल अनुमान (on-device)'
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
            'नियमित निगरानी करें',
            'प्रतिरोधी किस्मों का उपयोग करें'
          ],
          economic_impact: `संभावित नुकसान: ${primaryDisease.economicImpact.yieldLoss}% उत्पादन कमी | इलाज की लागत: ₹${primaryDisease.economicImpact.treatmentCost}`,
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
          name: 'स्वस्थ फसल (Healthy Crop)',
          severity: 'None',
          confidence: healthAnalysis.overallHealth / 100,
          symptoms: ['कोई बीमारी के लक्षण नहीं मिले'],
          treatments: ['कोई इलाज की जरूरत नहीं'],
          prevention: healthAnalysis.recommendations,
          economic_impact: 'कोई आर्थिक नुकसान नहीं',
          healthScore: healthAnalysis.overallHealth,
          imageQuality: healthAnalysis.imageMetadata.quality
        });
      }
      
      setOpenDialog(true);

    } catch (error) {
      console.error('AI Disease Detection Error:', error);
      
      // Enhanced fallback response
      setDiseaseResult({
        name: 'विश्लेषण असफल (Analysis Failed)',
        severity: 'Unknown',
        confidence: 0.5,
        symptoms: ['इमेज की गुणवत्ता बेहतर करके फिर कोशिश करें'],
        treatments: ['अच्छी रोशनी में फोटो लें', 'पत्तियों को पास से दिखाएं'],
        prevention: ['नियमित मानिटरिंग करें'],
        economic_impact: 'विश्लेषण असफल'
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
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
                  📸 Leaf Photo (फसल की पत्ती की फोटो)
                </Typography>

                {/* Friendly steps */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label="1️⃣ फसल चुनें / Choose crop" color="default" variant="outlined" />
                  <Chip label="2️⃣ फोटो लें / Take photo" color="default" variant="outlined" />
                  <Chip label="3️⃣ निदान / Analyze" color="default" variant="outlined" />
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
                            कैमरा से फोटो लें
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
                            गैलरी से चुनें
                          </Button>
                        </label>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        या फोटो यहाँ ड्रैग और ड्रॉप करें • Or, drag & drop here
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
                  <Chip label="JPG/PNG • up to ~10MB" size="small" sx={{ opacity: 0.7 }} />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={analyzeImage}
                    disabled={!selectedImage || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
                    sx={{ borderRadius: 3, background: 'linear-gradient(45deg, #ef5350, #ff7043)', px: 4 }}
                    fullWidth
                  >
                    {loading ? 'जांच हो रही है...' : 'Analyze Now / अभी जाँच करें'}
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
