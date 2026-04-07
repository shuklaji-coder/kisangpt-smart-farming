import React, { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Alert, CircularProgress,
  Avatar, Chip, List, ListItem, ListItemIcon, ListItemText, Grid, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Divider, Fab, Stepper, Step, StepLabel
} from '@mui/material';
import {
  PhotoCamera, CloudUpload, BugReport, LocalHospital, Warning,
  CheckCircle, Schedule, TrendingUp, Science, Visibility, ExpandMore,
  CameraAlt, Analytics, HealthAndSafety, WbSunny, Opacity
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

// Types
interface DiseaseAnalysis {
  detected_disease: string;
  disease_name_hindi: string;
  disease_name_english: string;
  confidence_score: number;
  severity_level: string;
  symptoms_detected: string[];
  image_analysis: {
    color_abnormalities: string[];
    texture_anomalies: string[];
    damage_assessment: {
      extent: string;
      pattern: string;
    };
  };
  environmental_factors: {
    weather_conducive: string;
    season_alignment: string;
    geographic_risk: string;
  };
  treatment_recommendations: string[];
  prevention_measures: string[];
  urgency_level: string;
  next_steps: string[];
  follow_up_schedule: {
    next_inspection: string;
    treatment_followup: string;
    monitoring_frequency: string;
  };
  analysis_timestamp: string;
}

interface ProcessingStage {
  stage: string;
  progress: number;
  message: string;
}

const API_BASE = process.env.REACT_APP_API_BASE || '';

const AdvancedDiseaseDetection: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [cropType, setCropType] = useState<string>('wheat');
  const [analysis, setAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>({
    stage: 'Ready',
    progress: 0,
    message: 'Upload an image to begin analysis'
  });
  const [error, setError] = useState<string>('');
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [weather, setWeather] = useState<any>(null);
  
  // Get user location
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
      );
    }
  }, []);
  
  // Processing stages for visual feedback
  const processingStages = [
    { label: 'Image Upload', description: 'Uploading and validating image' },
    { label: 'Computer Vision', description: 'Analyzing visual symptoms' },
    { label: 'Disease Classification', description: 'Running ML models' },
    { label: 'Environmental Analysis', description: 'Assessing context factors' },
    { label: 'Treatment Planning', description: 'Generating recommendations' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setAnalysis(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    let currentStage = 0;

    try {
      // Simulate processing stages
      const stageInterval = setInterval(() => {
        if (currentStage < processingStages.length) {
          setProcessingStage({
            stage: processingStages[currentStage].label,
            progress: ((currentStage + 1) / processingStages.length) * 100,
            message: processingStages[currentStage].description
          });
          currentStage++;
        }
      }, 1500);

      // Prepare form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('crop_type', cropType);
      
      if (location) {
        formData.append('latitude', location.latitude.toString());
        formData.append('longitude', location.longitude.toString());
      }

      // Make API call
      const response = await axios.post(
        `${API_BASE}/api/v1/disease/detect-from-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      clearInterval(stageInterval);
      
      if (response.data.status === 'success') {
        setAnalysis(response.data.analysis);
        setProcessingStage({
          stage: 'Complete',
          progress: 100,
          message: 'Analysis completed successfully!'
        });
      } else {
        throw new Error(response.data.message || 'Analysis failed');
      }

    } catch (err: any) {
      clearInterval(stageInterval);
      console.error('Disease detection failed:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to analyze image. Please try again.'
      );
      setProcessingStage({
        stage: 'Error',
        progress: 0,
        message: 'Analysis failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'very_high':
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate_action_required':
        return '#d32f2f';
      case 'urgent':
        return '#f57c00';
      case 'moderate_priority':
        return '#1976d2';
      default:
        return '#388e3c';
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
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
            background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 50%, #0d47a1 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Science sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔬 Advanced Disease Detection
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            AI-powered plant disease analysis using computer vision and machine learning
          </Typography>
        </Paper>
      </motion.div>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Image Upload & Analysis */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}>
                <PhotoCamera sx={{ mr: 1, color: theme.palette.primary.main }} />
                Image Analysis
              </Typography>

              {/* Crop Type Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Select Crop Type:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['wheat', 'rice', 'cotton', 'maize', 'sugarcane'].map((crop) => (
                    <Chip
                      key={crop}
                      label={crop.charAt(0).toUpperCase() + crop.slice(1)}
                      onClick={() => setCropType(crop)}
                      color={cropType === crop ? 'primary' : 'default'}
                      variant={cropType === crop ? 'filled' : 'outlined'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Image Upload Area */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: theme.palette.divider,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.action.hover,
                  },
                  mb: 3
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                {previewUrl ? (
                  <Box>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Click to change image
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <CloudUpload sx={{ fontSize: 48, color: theme.palette.action.disabled, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Click to upload plant image
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports JPG, PNG, WebP • Max 10MB
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Analysis Progress */}
              {loading && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {processingStage.stage}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={processingStage.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 2,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.primary.main
                      }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {processingStage.message}
                  </Typography>
                </Paper>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Analytics />}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #1e88e5, #1565c0)'
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Disease'}
                </Button>
                
                {analysis && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowDetailedAnalysis(true)}
                    startIcon={<Visibility />}
                    sx={{ borderRadius: 2 }}
                  >
                    Detailed Report
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Results */}
        <Grid item xs={12} md={6}>
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}>
                      <BugReport sx={{ mr: 1, color: getSeverityColor(analysis.severity_level) }} />
                      Disease Analysis Results
                    </Typography>

                    {/* Primary Results */}
                    <Box sx={{ mb: 3 }}>
                      <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 1 }}>
                          {analysis.disease_name_english}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                          {analysis.disease_name_hindi}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Chip
                            label={`${Math.round(analysis.confidence_score)}% Confidence`}
                            color={analysis.confidence_score > 75 ? 'success' : analysis.confidence_score > 50 ? 'warning' : 'error'}
                            variant="filled"
                          />
                          <Chip
                            label={analysis.severity_level.replace('_', ' ').toUpperCase()}
                            sx={{
                              backgroundColor: getSeverityColor(analysis.severity_level),
                              color: 'white'
                            }}
                          />
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={analysis.confidence_score}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: analysis.confidence_score > 75 ? '#4caf50' : analysis.confidence_score > 50 ? '#ff9800' : '#f44336',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Paper>
                    </Box>

                    {/* Urgency Alert */}
                    {analysis.urgency_level === 'immediate_action_required' && (
                      <Alert
                        severity="error"
                        icon={<Warning />}
                        sx={{ mb: 3 }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          🚨 Immediate Action Required!
                        </Typography>
                        Take preventive measures immediately to prevent spread.
                      </Alert>
                    )}

                    {/* Quick Insights */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Key Insights:
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                            <Visibility sx={{ fontSize: 24, color: '#1976d2', mb: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Visual Analysis
                            </Typography>
                            <Typography variant="caption">
                              {analysis.image_analysis.damage_assessment.extent} damage
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                            <WbSunny sx={{ fontSize: 24, color: '#388e3c', mb: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Weather Risk
                            </Typography>
                            <Typography variant="caption">
                              {analysis.environmental_factors.weather_conducive}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Immediate Actions */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Immediate Actions:
                      </Typography>
                      
                      <List dense>
                        {analysis.next_steps.slice(0, 3).map((step, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={step}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {/* Treatment Preview */}
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          💊 Treatment Recommendations
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {analysis.treatment_recommendations.map((treatment, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <LocalHospital sx={{ color: '#1976d2', fontSize: 18 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={treatment}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder when no analysis */}
          {!analysis && !loading && (
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <BugReport sx={{ fontSize: 64, color: theme.palette.action.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Upload an image to get started
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI will analyze the image and provide detailed disease insights, treatment recommendations, and prevention strategies.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Detailed Analysis Dialog */}
      <Dialog
        open={showDetailedAnalysis}
        onClose={() => setShowDetailedAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Science sx={{ mr: 1 }} />
            Comprehensive Disease Analysis Report
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {analysis && (
            <Box>
              {/* Detailed Analysis Content */}
              <Grid container spacing={3}>
                {/* Environmental Factors */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    🌍 Environmental Analysis
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Weather Conditions"
                        secondary={analysis.environmental_factors.weather_conducive}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Seasonal Alignment"
                        secondary={analysis.environmental_factors.season_alignment}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Geographic Risk"
                        secondary={analysis.environmental_factors.geographic_risk}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {/* Image Analysis Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    🔍 Image Analysis Details
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Damage Extent"
                        secondary={analysis.image_analysis.damage_assessment.extent}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Damage Pattern"
                        secondary={analysis.image_analysis.damage_assessment.pattern}
                      />
                    </ListItem>
                  </List>
                  
                  {analysis.image_analysis.color_abnormalities.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Color Issues:
                      </Typography>
                      {analysis.image_analysis.color_abnormalities.map((issue, index) => (
                        <Chip key={index} label={issue} size="small" sx={{ m: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Follow-up Schedule */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    📅 Follow-up Schedule
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                        <Schedule sx={{ color: theme.palette.primary.main, mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Next Inspection
                        </Typography>
                        <Typography variant="body2">
                          {analysis.follow_up_schedule.next_inspection}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                        <LocalHospital sx={{ color: theme.palette.success.main, mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Treatment Follow-up
                        </Typography>
                        <Typography variant="body2">
                          {analysis.follow_up_schedule.treatment_followup}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                        <TrendingUp sx={{ color: theme.palette.warning.main, mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Monitoring Frequency
                        </Typography>
                        <Typography variant="body2">
                          {analysis.follow_up_schedule.monitoring_frequency}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailedAnalysis(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Camera Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(45deg, #1e88e5, #1565c0)'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CameraAlt />
      </Fab>
    </Box>
  );
};

export default AdvancedDiseaseDetection;