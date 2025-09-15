import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Satellite,
  LocationOn,
  ZoomIn,
  ZoomOut,
  Layers,
  MyLocation,
  Refresh,
  Download,
  Share,
  Timeline,
  Agriculture,
  TrendingUp,
  WbSunny,
  Opacity,
  Terrain,
  FilterHdr,
  Nature,
  Visibility,
  CameraAlt,
  ThreeDRotation,
  ViewInAr,
  PhotoCamera,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface FieldData {
  coordinates: {
    lat: number;
    lng: number;
  };
  area: number;
  soilType: string;
  cropHistory: string[];
  currentCrop?: string;
  lastUpdated: Date;
}

interface SatelliteLayer {
  id: string;
  name: string;
  type: 'satellite' | 'terrain' | 'hybrid' | 'ndvi' | 'moisture';
  opacity: number;
  visible: boolean;
  date?: string;
}

interface CropRecommendation {
  crop: string;
  suitability: number;
  expectedYield: string;
  season: string;
  waterRequirement: string;
  soilSuitability: string;
  marketPrice: string;
  roi: string;
  pros: string[];
  cons: string[];
  icon: string;
}

const SatelliteFieldView: React.FC = () => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [fieldData, setFieldData] = useState<FieldData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [selectedLayer, setSelectedLayer] = useState('satellite');
  const [layerOpacity, setLayerOpacity] = useState(100);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [error, setError] = useState('');
  const [isARMode, setIsARMode] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  
  // Satellite layers configuration
  const [layers, setLayers] = useState<SatelliteLayer[]>([
    { id: 'satellite', name: 'Satellite View', type: 'satellite', opacity: 1, visible: true },
    { id: 'terrain', name: 'Terrain', type: 'terrain', opacity: 0.7, visible: false },
    { id: 'ndvi', name: 'NDVI (Crop Health)', type: 'ndvi', opacity: 0.8, visible: false, date: '2024-01-15' },
    { id: 'moisture', name: 'Soil Moisture', type: 'moisture', opacity: 0.8, visible: false, date: '2024-01-14' },
  ]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      // Default to Delhi coordinates
      setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
      loadFieldData(28.6139, 77.2090);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        await loadFieldData(latitude, longitude);
        await getLocationBasedCropRecommendations(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Using default location.');
        // Fallback to Delhi
        setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
        loadFieldData(28.6139, 77.2090);
        getLocationBasedCropRecommendations(28.6139, 77.2090);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const loadFieldData = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      
      // Simulate API call to get field data
      // In real implementation, this would call your backend API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      
      const mockFieldData: FieldData = {
        coordinates: { lat, lng },
        area: 2.5, // acres
        soilType: 'Loamy',
        cropHistory: ['Wheat', 'Rice', 'Sugarcane'],
        currentCrop: 'Wheat',
        lastUpdated: new Date()
      };
      
      setFieldData(mockFieldData);
    } catch (error) {
      console.error('Error loading field data:', error);
      setError('Failed to load field data');
    } finally {
      setLoading(false);
    }
  };

  const getLocationBasedCropRecommendations = async (lat: number, lng: number) => {
    try {
      // Mock location-based crop recommendations
      // In real implementation, this would analyze:
      // - Climate data for the location
      // - Soil analysis
      // - Market conditions
      // - Seasonal patterns
      
      const mockRecommendations: CropRecommendation[] = [
        {
          crop: 'Wheat',
          suitability: 92,
          expectedYield: '40-45 quintals/acre',
          season: 'Rabi',
          waterRequirement: 'Medium',
          soilSuitability: 'Excellent',
          marketPrice: '₹2,200/quintal',
          roi: '145%',
          pros: ['High market demand', 'Good storage life', 'Government procurement'],
          cons: ['Requires good water management', 'Pest susceptible'],
          icon: '🌾'
        },
        {
          crop: 'Mustard',
          suitability: 88,
          expectedYield: '18-22 quintals/acre',
          season: 'Rabi',
          waterRequirement: 'Low',
          soilSuitability: 'Very Good',
          marketPrice: '₹5,500/quintal',
          roi: '165%',
          pros: ['Less water requirement', 'Oil seed crop', 'High price'],
          cons: ['Market fluctuation', 'Processing required'],
          icon: '🌻'
        },
        {
          crop: 'Potato',
          suitability: 85,
          expectedYield: '150-200 quintals/acre',
          season: 'Rabi',
          waterRequirement: 'High',
          soilSuitability: 'Good',
          marketPrice: '₹1,200/quintal',
          roi: '125%',
          pros: ['High yield', 'Short duration', 'Multiple uses'],
          cons: ['High water requirement', 'Storage issues', 'Price volatile'],
          icon: '🥔'
        },
        {
          crop: 'Barley',
          suitability: 78,
          expectedYield: '25-30 quintals/acre',
          season: 'Rabi',
          waterRequirement: 'Low',
          soilSuitability: 'Good',
          marketPrice: '₹1,800/quintal',
          roi: '110%',
          pros: ['Drought tolerant', 'Multi-purpose crop', 'Low input cost'],
          cons: ['Lower market price', 'Limited demand'],
          icon: '🌾'
        }
      ];

      setCropRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error getting crop recommendations:', error);
    }
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity: opacity / 100 }
        : layer
    ));
  };

  const downloadSatelliteImage = async () => {
    try {
      setLoading(true);
      // In real implementation, this would download the satellite image
      // For now, we'll simulate the download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a download link (mock)
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Satellite image downloaded!');
      link.download = `field_satellite_${new Date().toISOString().split('T')[0]}.jpg`;
      link.click();
      
    } catch (error) {
      setError('Failed to download satellite image');
    } finally {
      setLoading(false);
    }
  };

  const startARVisualization = () => {
    setIsARMode(true);
    // In real implementation, this would start AR camera
    alert('AR Mode activated! Point your camera at the field to see crop visualizations.');
  };

  const getSuitabilityColor = (suitability: number) => {
    if (suitability >= 90) return '#4caf50';
    if (suitability >= 80) return '#8bc34a';
    if (suitability >= 70) return '#ff9800';
    if (suitability >= 60) return '#ff5722';
    return '#f44336';
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
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #03a9f4 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Satellite sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🛰️ Satellite Field View
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            अपने खेत को satellite से देखें और बेहतर फसल के लिए AI recommendations पाएं
          </Typography>
        </Paper>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Satellite Map View */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 0, position: 'relative' }}>
                {/* Map Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Tooltip title="Zoom In">
                    <Fab
                      size="small"
                      onClick={() => setZoomLevel(prev => Math.min(prev + 1, 20))}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <ZoomIn />
                    </Fab>
                  </Tooltip>
                  
                  <Tooltip title="Zoom Out">
                    <Fab
                      size="small"
                      onClick={() => setZoomLevel(prev => Math.max(prev - 1, 5))}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <ZoomOut />
                    </Fab>
                  </Tooltip>
                  
                  <Tooltip title="My Location">
                    <Fab
                      size="small"
                      onClick={getCurrentLocation}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <MyLocation />
                    </Fab>
                  </Tooltip>
                  
                  <Tooltip title="Layers">
                    <Fab
                      size="small"
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <Layers />
                    </Fab>
                  </Tooltip>
                </Box>

                {/* Satellite Map Placeholder */}
                <Box
                  ref={mapRef}
                  sx={{
                    height: '500px',
                    background: `linear-gradient(45deg, #1976d2 0%, #4caf50 50%, #ff9800 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-opacity=\'0.1\'%3E%3Cpolygon fill=\'%23fff\' points=\'50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40\'/%3E%3C/g%3E%3C/svg%3E")',
                  }}
                >
                  {loading ? (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                      <Typography variant="h6">Loading satellite imagery...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Satellite sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
                      <Typography variant="h5" sx={{ mb: 1 }}>
                        Your Field View
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        {currentLocation ? 
                          `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}` :
                          'Detecting location...'
                        }
                      </Typography>
                      {fieldData && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={<Agriculture />}
                            label={`Area: ${fieldData.area} acres`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 1 }}
                          />
                          <Chip
                            icon={<Terrain />}
                            label={`Soil: ${fieldData.soilType}`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Field Boundary Overlay */}
                  {fieldData && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '30%',
                        left: '35%',
                        right: '35%',
                        bottom: '30%',
                        border: '3px solid #ff9800',
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        Your Field Boundary
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Bottom Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 1000,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={downloadSatelliteImage}
                      size="small"
                      sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      Download
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<ViewInAr />}
                      onClick={startARVisualization}
                      size="small"
                      sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                    >
                      AR View
                    </Button>
                  </Box>

                  <Chip
                    icon={<ZoomIn />}
                    label={`Zoom: ${zoomLevel}x`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Satellite Layers Panel */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Layer Controls */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <Layers sx={{ mr: 1 }} />
                  Satellite Layers
                </Typography>
                
                <List dense>
                  {layers.map((layer) => (
                    <ListItem key={layer.id} sx={{ px: 0 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={layer.visible}
                            onChange={() => toggleLayer(layer.id)}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {layer.name}
                            </Typography>
                            {layer.date && (
                              <Typography variant="caption" color="text.secondary">
                                Updated: {layer.date}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Field Information */}
            {fieldData && (
              <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <Agriculture sx={{ mr: 1 }} />
                    Field Information
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><Terrain /></ListItemIcon>
                      <ListItemText 
                        primary="Area"
                        secondary={`${fieldData.area} acres`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><FilterHdr /></ListItemIcon>
                      <ListItemText 
                        primary="Soil Type"
                        secondary={fieldData.soilType}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><Nature /></ListItemIcon>
                      <ListItemText 
                        primary="Current Crop"
                        secondary={fieldData.currentCrop || 'Not planted'}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><Timeline /></ListItemIcon>
                      <ListItemText 
                        primary="Crop History"
                        secondary={fieldData.cropHistory.join(', ')}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>

        {/* Location-based Crop Recommendations */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  🌾 Location-based Crop Recommendations
                  <Chip
                    icon={<LocationOn />}
                    label="Based on your location & climate"
                    sx={{ ml: 2 }}
                    color="primary"
                    size="small"
                  />
                </Typography>

                <Grid container spacing={3}>
                  {cropRecommendations.map((crop, index) => (
                    <Grid item xs={12} sm={6} md={3} key={crop.crop}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card
                          elevation={2}
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `2px solid ${getSuitabilityColor(crop.suitability)}`,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 6,
                            },
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedCrop(crop.crop)}
                        >
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ mb: 1 }}>
                              {crop.icon}
                            </Typography>
                            
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {crop.crop}
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Chip
                                label={`${crop.suitability}% Suitable`}
                                sx={{
                                  bgcolor: getSuitabilityColor(crop.suitability),
                                  color: 'white',
                                  fontWeight: 'bold',
                                  mb: 1,
                                }}
                                size="small"
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Yield:</strong> {crop.expectedYield}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>ROI:</strong> {crop.roi}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              <strong>Season:</strong> {crop.season}
                            </Typography>

                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ViewInAr />}
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`AR visualization for ${crop.crop} coming soon!`);
                              }}
                            >
                              AR Preview
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Crop Details Dialog */}
      <Dialog
        open={!!selectedCrop}
        onClose={() => setSelectedCrop('')}
        maxWidth="md"
        fullWidth
      >
        {selectedCrop && cropRecommendations.find(c => c.crop === selectedCrop) && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mr: 1 }}>
                  {cropRecommendations.find(c => c.crop === selectedCrop)?.icon}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {selectedCrop} - Detailed Analysis
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              {(() => {
                const crop = cropRecommendations.find(c => c.crop === selectedCrop)!;
                return (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        📊 Key Metrics
                      </Typography>
                      
                      <List>
                        <ListItem>
                          <ListItemText 
                            primary="Suitability Score"
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <Slider
                                    value={crop.suitability}
                                    min={0}
                                    max={100}
                                    disabled
                                    sx={{
                                      color: getSuitabilityColor(crop.suitability),
                                      '& .MuiSlider-thumb': {
                                        backgroundColor: getSuitabilityColor(crop.suitability),
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: 35 }}>
                                  {crop.suitability}%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText primary="Expected Yield" secondary={crop.expectedYield} />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText primary="Market Price" secondary={crop.marketPrice} />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText primary="ROI" secondary={crop.roi} />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText primary="Water Requirement" secondary={crop.waterRequirement} />
                        </ListItem>
                      </List>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                        ✅ Advantages
                      </Typography>
                      <List dense>
                        {crop.pros.map((pro, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <TrendingUp color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={pro} />
                          </ListItem>
                        ))}
                      </List>
                      
                      <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 'bold', color: 'warning.main' }}>
                        ⚠️ Considerations
                      </Typography>
                      <List dense>
                        {crop.cons.map((con, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Visibility color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={con} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                );
              })()}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setSelectedCrop('')}>Close</Button>
              <Button 
                variant="contained" 
                startIcon={<ViewInAr />}
                onClick={() => alert('AR/VR crop visualization coming soon!')}
              >
                View in AR/VR
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SatelliteFieldView;