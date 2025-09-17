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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ViewInAr,
  CameraAlt,
  ThreeDRotation,
  Nature,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  FlipCameraAndroid,
  Fullscreen,
  FullscreenExit,
  Stop,
  FilterHdr,
  WbSunny,
  Opacity as OpacityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface PlantModel {
  id: string;
  name: string;
  category: 'crop' | 'tree' | 'flower' | 'vegetable';
  growth_stages: string[];
  current_stage: number;
  water_level: number;
  health: number;
  diseases: string[];
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  icon: string;
  color: string;
}

interface ARSession {
  active: boolean;
  camera_access: boolean;
  tracking_quality: 'good' | 'fair' | 'poor';
  detected_surfaces: number;
  lighting_condition: 'good' | 'dim' | 'bright';
}

const ARPlantVisualization: React.FC = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string>('wheat');
  const [plantModels, setPlantModels] = useState<PlantModel[]>([]);
  const [arSession, setArSession] = useState<ARSession>({
    active: false,
    camera_access: false,
    tracking_quality: 'good',
    detected_surfaces: 0,
    lighting_condition: 'good'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [plantScale, setPlantScale] = useState(1);
  const [plantRotation, setPlantRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');

  // Mock plant data
  const mockPlants: PlantModel[] = [
    {
      id: 'wheat',
      name: 'Wheat (गेहूं)',
      category: 'crop',
      growth_stages: ['Seed', 'Germination', 'Tillering', 'Jointing', 'Heading', 'Maturity'],
      current_stage: 3,
      water_level: 75,
      health: 85,
      diseases: [],
      nutrients: { nitrogen: 80, phosphorus: 70, potassium: 85 },
      icon: '🌾',
      color: '#d4a574'
    },
    {
      id: 'rice',
      name: 'Rice (चावल)',
      category: 'crop',
      growth_stages: ['Seed', 'Germination', 'Seedling', 'Tillering', 'Flowering', 'Ripening'],
      current_stage: 2,
      water_level: 90,
      health: 92,
      diseases: [],
      nutrients: { nitrogen: 85, phosphorus: 75, potassium: 80 },
      icon: '🌾',
      color: '#8bc34a'
    },
    {
      id: 'tomato',
      name: 'Tomato (टमाटर)',
      category: 'vegetable',
      growth_stages: ['Seed', 'Germination', 'Seedling', 'Flowering', 'Fruiting', 'Ripening'],
      current_stage: 4,
      water_level: 65,
      health: 78,
      diseases: ['Leaf curl'],
      nutrients: { nitrogen: 70, phosphorus: 85, potassium: 90 },
      icon: '🍅',
      color: '#f44336'
    },
    {
      id: 'corn',
      name: 'Corn (मक्का)',
      category: 'crop',
      growth_stages: ['Seed', 'Emergence', 'V6 Stage', 'Tasseling', 'Silking', 'Maturity'],
      current_stage: 3,
      water_level: 80,
      health: 88,
      diseases: [],
      nutrients: { nitrogen: 90, phosphorus: 80, potassium: 75 },
      icon: '🌽',
      color: '#ffeb3b'
    }
  ];

  useEffect(() => {
    setPlantModels(mockPlants);
  }, []);

  const startARSession = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Request camera permission with fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        });
      } catch (cameraError) {
        console.warn('Specific camera settings failed, trying basic settings:', cameraError);
        // Fallback to basic camera settings
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setArSession(prev => ({
        ...prev,
        active: true,
        camera_access: true,
        detected_surfaces: Math.floor(Math.random() * 5) + 1,
        lighting_condition: 'good'
      }));

      setIsARActive(true);
      
      // Simulate AR tracking
      setTimeout(() => {
        setArSession(prev => ({
          ...prev,
          tracking_quality: 'good',
          detected_surfaces: 3
        }));
      }, 2000);

    } catch (err: any) {
      console.error('Error starting AR session:', err);
      let errorMessage = 'AR session could not start. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setError(errorMessage);
      
      // Enable demo mode when camera fails
      setIsARActive(true);
      setArSession(prev => ({
        ...prev,
        active: true,
        camera_access: false,
        detected_surfaces: 2,
        lighting_condition: 'good'
      }));
    } finally {
      setLoading(false);
    }
  };

  const stopARSession = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setArSession(prev => ({
      ...prev,
      active: false,
      camera_access: false
    }));

    setIsARActive(false);
    setIsFullscreen(false);
  };

  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing },
          audio: false
        });
        
        setCameraStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        setError('Failed to switch camera');
      }
    }
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('ar-container');
    if (!isFullscreen) {
      element?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const takeScreenshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx?.drawImage(video, 0, 0);
      
      // Add plant overlay (mock)
      if (ctx) {
        ctx.font = '48px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(20, 20, 300, 100);
        ctx.fillStyle = '#000';
        ctx.fillText('AR Plant View', 30, 70);
        ctx.fillText(selectedPlant, 30, 100);
      }
      
      // Download the image
      const link = document.createElement('a');
      link.download = `ar-plant-${selectedPlant}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const getCurrentPlant = () => {
    return plantModels.find(p => p.id === selectedPlant) || plantModels[0];
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#4caf50';
    if (health >= 60) return '#ff9800';
    return '#f44336';
  };

  const getNutrientColor = (value: number) => {
    if (value >= 80) return '#4caf50';
    if (value >= 60) return '#ff9800';
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
            background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #f44336 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <ViewInAr sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🌱 AR/VR Plant Visualization
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Camera चालू करके plants को 3D में देखें और समझें!
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
        {/* AR Camera View */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 0, position: 'relative' }}>
              <Box
                id="ar-container"
                sx={{
                  height: isFullscreen ? '100vh' : '500px',
                  backgroundColor: '#000',
                  borderRadius: isFullscreen ? 0 : 3,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Camera Video or Demo Mode */}
                {arSession.camera_access ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : isARActive ? (
                  {/* Demo Mode - Simulated AR background */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: `
                        linear-gradient(45deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%),
                        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>')
                      `,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Demo Mode Notice */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(255, 193, 7, 0.9)',
                        color: '#000',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        📹 Demo Mode - Camera Not Available
                      </Typography>
                    </Box>
                  </Box>
                ) : null}

                {/* Canvas for screenshots */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />

                {/* AR Placeholder */}
                {!isARActive && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      color: 'white',
                      p: 4,
                    }}
                  >
                    <ViewInAr sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      AR Plant Visualization
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
                      Camera चालू करके अपने plants को 3D में देखें
                    </Typography>
                    
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CameraAlt />}
                      onClick={startARSession}
                      disabled={loading}
                      sx={{
                        bgcolor: '#4caf50',
                        '&:hover': { bgcolor: '#388e3c' },
                        px: 4,
                        py: 1.5,
                      }}
                    >
                      {loading ? 'Starting Camera...' : 'Start AR Camera'}
                    </Button>
                  </Box>
                )}

                {/* AR Overlays */}
                {isARActive && (
                  <>
                    {/* AR Plant Information Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        p: 2,
                        borderRadius: 2,
                        maxWidth: '300px',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        {getCurrentPlant().icon} {getCurrentPlant().name}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Growth Stage: {getCurrentPlant().growth_stages[getCurrentPlant().current_stage]}
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption">Health: {getCurrentPlant().health}%</Typography>
                        <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2, mt: 0.5 }}>
                          <Box
                            sx={{
                              width: `${getCurrentPlant().health}%`,
                              height: '100%',
                              bgcolor: getHealthColor(getCurrentPlant().health),
                              borderRadius: 2,
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption">Water Level: {getCurrentPlant().water_level}%</Typography>
                        <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2, mt: 0.5 }}>
                          <Box
                            sx={{
                              width: `${getCurrentPlant().water_level}%`,
                              height: '100%',
                              bgcolor: '#2196f3',
                              borderRadius: 2,
                            }}
                          />
                        </Box>
                      </Box>

                      {getCurrentPlant().diseases.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                          <Typography variant="caption">
                            Issues: {getCurrentPlant().diseases.join(', ')}
                          </Typography>
                        </Alert>
                      )}
                    </Box>

                    {/* AR Tracking Info */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Tracking: {arSession.tracking_quality}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Surfaces: {arSession.detected_surfaces}
                      </Typography>
                      <Typography variant="caption">
                        Light: {arSession.lighting_condition}
                      </Typography>
                    </Box>

                    {/* Virtual Plant (Mock 3D representation) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '50%',
                        transform: `translate(-50%, 0) scale(${plantScale}) rotate(${plantRotation}deg)`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '120px',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                          animation: 'float 3s ease-in-out infinite',
                          '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-10px)' },
                          },
                        }}
                      >
                        {getCurrentPlant().icon}
                      </Typography>
                    </Box>

                    {/* AR Controls */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        p: 1,
                        borderRadius: 3,
                      }}
                    >
                      <Tooltip title="Zoom In">
                        <IconButton
                          size="small"
                          onClick={() => setPlantScale(prev => Math.min(prev + 0.2, 3))}
                          sx={{ color: 'white' }}
                        >
                          <ZoomIn />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Zoom Out">
                        <IconButton
                          size="small"
                          onClick={() => setPlantScale(prev => Math.max(prev - 0.2, 0.5))}
                          sx={{ color: 'white' }}
                        >
                          <ZoomOut />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Rotate Left">
                        <IconButton
                          size="small"
                          onClick={() => setPlantRotation(prev => prev - 45)}
                          sx={{ color: 'white' }}
                        >
                          <RotateLeft />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Rotate Right">
                        <IconButton
                          size="small"
                          onClick={() => setPlantRotation(prev => prev + 45)}
                          sx={{ color: 'white' }}
                        >
                          <RotateRight />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Switch Camera">
                        <IconButton
                          size="small"
                          onClick={switchCamera}
                          sx={{ color: 'white' }}
                        >
                          <FlipCameraAndroid />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Take Screenshot">
                        <IconButton
                          size="small"
                          onClick={takeScreenshot}
                          sx={{ color: 'white' }}
                        >
                          <CameraAlt />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton
                          size="small"
                          onClick={toggleFullscreen}
                          sx={{ color: 'white' }}
                        >
                          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Stop AR">
                        <IconButton
                          size="small"
                          onClick={stopARSession}
                          sx={{ color: '#f44336' }}
                        >
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Plant Selection & Controls */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Plant Selection */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  🌱 Select Plant
                </Typography>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Choose Plant</InputLabel>
                  <Select
                    value={selectedPlant}
                    label="Choose Plant"
                    onChange={(e) => setSelectedPlant(e.target.value)}
                  >
                    {plantModels.map((plant) => (
                      <MenuItem key={plant.id} value={plant.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 1 }}>{plant.icon}</Typography>
                          {plant.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Current Plant Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Current Stage: {getCurrentPlant().growth_stages[getCurrentPlant().current_stage]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Progress: {getCurrentPlant().current_stage + 1} of {getCurrentPlant().growth_stages.length} stages
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Plant Health Metrics */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  📊 Plant Health
                </Typography>
                
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Nature sx={{ color: getHealthColor(getCurrentPlant().health) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Overall Health"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Slider
                            value={getCurrentPlant().health}
                            min={0}
                            max={100}
                            disabled
                            sx={{ color: getHealthColor(getCurrentPlant().health), mr: 2 }}
                          />
                          <Typography variant="body2">{getCurrentPlant().health}%</Typography>
                        </Box>
                      }
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <OpacityIcon sx={{ color: '#2196f3' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Water Level"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Slider
                            value={getCurrentPlant().water_level}
                            min={0}
                            max={100}
                            disabled
                            sx={{ color: '#2196f3', mr: 2 }}
                          />
                          <Typography variant="body2">{getCurrentPlant().water_level}%</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </List>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Nutrient Levels
                </Typography>

                {Object.entries(getCurrentPlant().nutrients).map(([nutrient, value]) => (
                  <Box key={nutrient} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {nutrient}: {value}%
                    </Typography>
                    <Box sx={{ width: '100%', height: 6, bgcolor: 'grey.200', borderRadius: 1, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: `${value}%`,
                          height: '100%',
                          bgcolor: getNutrientColor(value),
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* AR Session Info */}
            {isARActive && (
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📱 AR Session Info
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CameraAlt color={arSession.camera_access ? 'success' : 'error'} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Camera Access"
                        secondary={arSession.camera_access ? 'Active' : 'Inactive'}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ThreeDRotation color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tracking Quality"
                        secondary={arSession.tracking_quality}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <FilterHdr color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Detected Surfaces"
                        secondary={`${arSession.detected_surfaces} surfaces`}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <WbSunny color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Lighting"
                        secondary={arSession.lighting_condition}
                      />
                    </ListItem>
                  </List>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      💡 Point your camera at a flat surface for better tracking
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* VR Mode (Coming Soon) */}
            <Card elevation={3} sx={{ borderRadius: 3, mt: 3, opacity: 0.7 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ThreeDRotation sx={{ fontSize: 40, mb: 1, color: 'grey.500' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  VR Mode
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete VR plant experience coming soon!
                </Typography>
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<ThreeDRotation />}
                >
                  Enter VR (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Growth Stages Timeline */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                🌱 Growth Stages Timeline
              </Typography>

              <Box sx={{ position: 'relative', pl: 4 }}>
                {getCurrentPlant().growth_stages.map((stage, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      mb: 3,
                      pb: 2,
                      borderLeft: index < getCurrentPlant().growth_stages.length - 1 ? '2px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Avatar
                      sx={{
                        position: 'absolute',
                        left: -22,
                        top: 0,
                        width: 44,
                        height: 44,
                        bgcolor: index <= getCurrentPlant().current_stage ? '#4caf50' : '#e0e0e0',
                        border: '3px solid white',
                        boxShadow: 2,
                      }}
                    >
                      {index <= getCurrentPlant().current_stage ? '✓' : index + 1}
                    </Avatar>
                    
                    <Box sx={{ ml: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          color: index <= getCurrentPlant().current_stage ? '#4caf50' : 'text.secondary',
                        }}
                      >
                        Stage {index + 1}: {stage}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {index === getCurrentPlant().current_stage && (
                          <Chip
                            size="small"
                            label="Current Stage"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        )}
                        {index < getCurrentPlant().current_stage && (
                          <Chip
                            size="small"
                            label="Completed"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                        )}
                        {index > getCurrentPlant().current_stage && (
                          <Chip
                            size="small"
                            label="Upcoming"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ARPlantVisualization;