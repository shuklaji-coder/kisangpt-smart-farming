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
  Mic,
  MicOff,
  PlayArrow,
  Pause,
  Animation,
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

// Mock plant data - moved outside component to avoid dependency issues
const mockPlants: PlantModel[] = [
  {
    id: 'wheat',
    name: 'Wheat (à¤—à¥‡à¤¹à¥‚à¤‚)',
    category: 'crop',
    growth_stages: ['Seed', 'Germination', 'Tillering', 'Jointing', 'Heading', 'Maturity'],
    current_stage: 3,
    water_level: 75,
    health: 85,
    diseases: [],
    nutrients: { nitrogen: 80, phosphorus: 70, potassium: 85 },
    icon: 'ðŸŒ¾',
    color: '#d4a574'
  },
  {
    id: 'rice',
    name: 'Rice (à¤šà¤¾à¤µà¤²)',
    category: 'crop',
    growth_stages: ['Seed', 'Germination', 'Seedling', 'Tillering', 'Flowering', 'Ripening'],
    current_stage: 2,
    water_level: 90,
    health: 92,
    diseases: [],
    nutrients: { nitrogen: 85, phosphorus: 75, potassium: 80 },
    icon: 'ðŸŒ¾',
    color: '#8bc34a'
  },
  {
    id: 'tomato',
    name: 'Tomato (à¤Ÿà¤®à¤¾à¤Ÿà¤°)',
    category: 'vegetable',
    growth_stages: ['Seed', 'Germination', 'Seedling', 'Flowering', 'Fruiting', 'Ripening'],
    current_stage: 4,
    water_level: 65,
    health: 78,
    diseases: ['Leaf curl'],
    nutrients: { nitrogen: 70, phosphorus: 85, potassium: 90 },
    icon: 'ðŸ…',
    color: '#f44336'
  },
  {
    id: 'corn',
    name: 'Corn (à¤®à¤•à¥à¤•à¤¾)',
    category: 'crop',
    growth_stages: ['Seed', 'Emergence', 'V6 Stage', 'Tasseling', 'Silking', 'Maturity'],
    current_stage: 3,
    water_level: 80,
    health: 88,
    diseases: [],
    nutrients: { nitrogen: 90, phosphorus: 80, potassium: 75 },
    icon: 'ðŸŒ½',
    color: '#ffeb3b'
  }
];

const ARPlantVisualization: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = (useTranslation as any)();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARActive, setIsARActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showInfo, setShowInfo] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [plantScale, setPlantScale] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [plantRotation, setPlantRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isAnimatingGrowth, setIsAnimatingGrowth] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // milliseconds per stage
  const [windStrength, setWindStrength] = useState(2); // 1-5 scale
  const [isRaining, setIsRaining] = useState(false);
  const [season, setSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('summer');
  const [showParticleEffects, setShowParticleEffects] = useState(true);

  useEffect(() => {
    setPlantModels(mockPlants);
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check voice recognition support
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    
    return () => window.removeEventListener('resize', checkMobile);
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
    if (plantModels.length === 0) {
      // Return a safe default plant when data is loading
      return {
        id: 'wheat',
        name: 'Wheat (à¤—à¥‡à¤¹à¥‚à¤‚)',
        category: 'crop' as const,
        growth_stages: ['Seed', 'Germination', 'Tillering', 'Jointing', 'Heading', 'Maturity'],
        current_stage: 3,
        water_level: 75,
        health: 85,
        diseases: [],
        nutrients: { nitrogen: 80, phosphorus: 70, potassium: 85 },
        icon: 'ðŸŒ¾',
        color: '#d4a574'
      };
    }
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

  const renderRealistic3DPlant = (plant: PlantModel) => {
    const healthFactor = plant.health / 100;
    const growthStage = plant.current_stage;
    const maxStages = plant.growth_stages.length - 1;
    const growthFactor = growthStage / maxStages;

    // Dynamic animation based on wind strength and season
    const swayDuration = `${Math.max(1, 5 - windStrength)}s`;
    const swayAngle = 2 + windStrength; // degrees
    const brightnessBoost = season === 'spring' ? 0.15 : season === 'winter' ? -0.1 : 0;
    const saturationBoost = season === 'autumn' ? 0.2 : 0;
    
    const baseProps = {
      style: {
        filter: `brightness(${0.7 + healthFactor * 0.3 + brightnessBoost}) saturate(${healthFactor + saturationBoost})`,
        animation: `sway ${swayDuration} ease-in-out infinite, grow 2.5s ease-in-out infinite alternate`,
        transformStyle: 'preserve-3d' as 'preserve-3d',
      }
    };

    // Different plant types with realistic 3D SVG representations
    switch (plant.id) {
      case 'wheat':
        return (
          <Box
            sx={{
              width: `${80 + growthFactor * 60}px`,
              height: `${100 + growthFactor * 80}px`,
              transform: 'rotateX(15deg)',
              transformStyle: 'preserve-3d' as 'preserve-3d',
              position: 'relative',
              '@keyframes sway': {
                '0%': { transform: `rotateX(15deg) rotateZ(-${swayAngle / 2}deg) translateY(${windStrength * 0.5}px)` },
                '25%': { transform: `rotateX(15deg) rotateZ(${swayAngle}deg) translateY(-${windStrength * 0.3}px)` },
                '50%': { transform: `rotateX(15deg) rotateZ(-${swayAngle * 0.7}deg) translateY(${windStrength * 0.8}px)` },
                '75%': { transform: `rotateX(15deg) rotateZ(${swayAngle * 0.5}deg) translateY(-${windStrength * 0.4}px)` },
                '100%': { transform: `rotateX(15deg) rotateZ(-${swayAngle / 2}deg) translateY(${windStrength * 0.5}px)` },
              },
              '@keyframes grow': {
                '0%': { transform: 'scale(0.98) rotateY(-1deg)' },
                '50%': { transform: 'scale(1.02) rotateY(1deg)' },
                '100%': { transform: 'scale(1) rotateY(0deg)' },
              },
              '@keyframes leafRustle': {
                '0%, 100%': { transform: 'rotateZ(0deg) scale(1)' },
                '25%': { transform: 'rotateZ(1deg) scale(1.02)' },
                '75%': { transform: 'rotateZ(-1deg) scale(0.98)' },
              },
              '@keyframes particleFloat': {
                '0%': { transform: 'translateY(0px) opacity(1)' },
                '100%': { transform: 'translateY(-30px) opacity(0)' },
              },
            }}
            {...baseProps}
          >
            <svg width="100%" height="100%" viewBox="0 0 140 180">
              <defs>
                {/* Gradient for seasonal color changes */}
                <linearGradient id={`wheatGradient-${season}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={season === 'autumn' ? '#D4A574' : season === 'spring' ? '#90EE90' : '#7CB342'} />
                  <stop offset="100%" stopColor={season === 'autumn' ? '#8B4513' : season === 'winter' ? '#8FBC8F' : '#558B2F'} />
                </linearGradient>
                
                {/* Wind particle effects */}
                {showParticleEffects && Array.from({ length: windStrength + 2 }).map((_, p) => (
                  <circle key={p} r="1" fill="rgba(255,255,255,0.6)">
                    <animateMotion
                      dur={`${2 + Math.random()}s`}
                      repeatCount="indefinite"
                      path={`M${20 + p * 15},${60 + p * 10} Q${50 + p * 20},${40 + p * 15} ${100 + p * 10},${20 + p * 8}`}
                    />
                    <animate attributeName="opacity" values="0;0.8;0" dur={`${1 + Math.random()}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </defs>
              
              {/* Animated Wheat stalks */}
              {Array.from({ length: 5 + Math.floor(growthFactor * 3) }).map((_, i) => {
                const stalkDelay = i * 0.2;
                const stalkSwayAngle = (windStrength * (1 + i * 0.3)) % 8;
                
                return (
                  <g key={i} style={{
                    animation: `leafRustle ${swayDuration} ease-in-out infinite`,
                    animationDelay: `${stalkDelay}s`,
                    transformOrigin: `${60 + i * 8 - 16}px 160px`
                  }}>
                    {/* Main Stem with wind bending */}
                    <path
                      d={`M${60 + i * 8 - 16} 160 Q${58 + i * 8 - 16 + stalkSwayAngle} ${140 - growthFactor * 30} ${55 + i * 8 - 16 + stalkSwayAngle * 1.5} ${80 - growthFactor * 20}`}
                      stroke={`url(#wheatGradient-${season})`}
                      strokeWidth={`${2.5 + growthFactor}`}
                      fill="none"
                      strokeLinecap="round"
                    />
                    
                    {/* Individual leaves with rustle animation */}
                    {Array.from({ length: 3 + Math.floor(growthFactor * 2) }).map((_, leafIdx) => (
                      <path
                        key={leafIdx}
                        d={`M${55 + i * 8 - 16} ${150 - leafIdx * 25} Q${65 + i * 8 - 16 + (leafIdx % 2 ? 8 : -8)} ${145 - leafIdx * 25} ${70 + i * 8 - 16 + (leafIdx % 2 ? 12 : -12)} ${140 - leafIdx * 25}`}
                        stroke={`hsl(${100 + healthFactor * 30}, 65%, ${45 + healthFactor * 15}%)`}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          animation: `leafRustle ${swayDuration} ease-in-out infinite`,
                          animationDelay: `${stalkDelay + leafIdx * 0.1}s`,
                          transformOrigin: `${55 + i * 8 - 16}px ${150 - leafIdx * 25}px`
                        }}
                      />
                    ))}
                    
                    {/* Wheat grains with blooming animation */}
                    {growthStage >= 3 && Array.from({ length: 6 + Math.floor(growthFactor * 4) }).map((_, j) => {
                      const grainSize = 1.5 + growthFactor * 1.5;
                      const bloomDelay = j * 0.05;
                      
                      return (
                        <g key={j}>
                          <ellipse
                            cx={55 + i * 8 - 16 + (j % 2 ? 2 : -2)}
                            cy={85 - growthFactor * 20 + j * 2.5}
                            rx={grainSize}
                            ry={grainSize * 2}
                            fill={`hsl(${35 + growthFactor * 25 + (season === 'autumn' ? 15 : 0)}, 75%, ${55 + healthFactor * 20}%)`}
                            transform={`rotate(${j % 2 ? 15 : -15} ${55 + i * 8 - 16} ${85 - growthFactor * 20 + j * 2.5})`}
                            style={{
                              animation: `grow ${swayDuration} ease-in-out infinite, leafRustle ${swayDuration} ease-in-out infinite`,
                              animationDelay: `${bloomDelay}s`,
                              transformOrigin: 'center'
                            }}
                          />
                          
                          {/* Grain shine effect */}
                          <ellipse
                            cx={55 + i * 8 - 16 + (j % 2 ? 2 : -2)}
                            cy={85 - growthFactor * 20 + j * 2.5}
                            rx={grainSize * 0.3}
                            ry={grainSize}
                            fill="rgba(255,255,255,0.4)"
                            transform={`rotate(${j % 2 ? 15 : -15} ${55 + i * 8 - 16} ${85 - growthFactor * 20 + j * 2.5})`}
                            style={{
                              animation: `grow ${swayDuration} ease-in-out infinite`,
                              animationDelay: `${bloomDelay + 0.2}s`
                            }}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Floating pollen particles */}
                    {showParticleEffects && growthStage >= 4 && windStrength > 2 && (
                      <circle
                        cx={55 + i * 8 - 16}
                        cy={80 - growthFactor * 20}
                        r="0.8"
                        fill={`hsl(${50 + Math.random() * 20}, 80%, 70%)`}
                        opacity="0.7"
                        style={{
                          animation: `particleFloat 3s ease-out infinite`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Base/Soil with seasonal variation */}
              <ellipse 
                cx="70" 
                cy="165" 
                rx="50" 
                ry="8" 
                fill={season === 'winter' ? '#A0A0A0' : season === 'spring' ? '#4A4A4A' : '#8B4513'} 
                opacity={season === 'winter' ? '0.8' : '0.6'} 
              />
              
              {/* Rain drops effect */}
              {isRaining && showParticleEffects && Array.from({ length: 8 }).map((_, r) => (
                <line
                  key={r}
                  x1={10 + r * 15}
                  y1="0"
                  x2={8 + r * 15}
                  y2="10"
                  stroke="rgba(135,206,235,0.6)"
                  strokeWidth="1"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0,-20; 0,180`}
                    dur="1s"
                    repeatCount="indefinite"
                    begin={`${r * 0.1}s`}
                  />
                  <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin={`${r * 0.1}s`} />
                </line>
              ))}
            </svg>
          </Box>
        );

      case 'rice':
        return (
          <Box
            sx={{
              width: `${90 + growthFactor * 50}px`,
              height: `${120 + growthFactor * 60}px`,
              transform: 'rotateX(10deg)',
              transformStyle: 'preserve-3d' as 'preserve-3d',
              '@keyframes sway': {
                '0%, 100%': { transform: 'rotateX(10deg) rotateZ(0deg)' },
                '50%': { transform: 'rotateX(10deg) rotateZ(-2deg)' },
              },
              '@keyframes grow': {
                '0%': { transform: 'rotateX(10deg) scale(0.98)' },
                '100%': { transform: 'rotateX(10deg) scale(1.02)' },
              },
            }}
            {...baseProps}
          >
            <svg width="100%" height="100%" viewBox="0 0 140 180">
              {/* Rice stalks - more slender */}
              {Array.from({ length: 6 + Math.floor(growthFactor * 4) }).map((_, i) => (
                <g key={i}>
                  {/* Stem */}
                  <path
                    d={`M${55 + i * 6 - 15} 160 Q${53 + i * 6 - 15} ${130 - growthFactor * 25} ${50 + i * 6 - 15} ${70 - growthFactor * 15}`}
                    stroke={`hsl(${90 + healthFactor * 30}, 65%, ${35 + healthFactor * 25}%)`}
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Rice grains - drooping */}
                  {growthStage >= 4 && (
                    <path
                      d={`M${50 + i * 6 - 15} ${70 - growthFactor * 15} Q${45 + i * 6 - 15} ${75 - growthFactor * 15} ${48 + i * 6 - 15} ${85 - growthFactor * 15}`}
                      stroke={`hsl(${45 + growthFactor * 15}, 80%, ${55 + healthFactor * 20}%)`}
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              ))}
              {/* Water reflection effect */}
              <ellipse cx="70" cy="165" rx="45" ry="6" fill="url(#waterGradient)" opacity="0.4" />
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#29B6F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#03A9F4" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
          </Box>
        );

      case 'tomato':
        return (
          <Box
            sx={{
              width: `${100 + growthFactor * 40}px`,
              height: `${80 + growthFactor * 70}px`,
              transform: 'rotateX(20deg)',
              transformStyle: 'preserve-3d' as 'preserve-3d',
              '@keyframes sway': {
                '0%, 100%': { transform: 'rotateX(20deg) rotateZ(0deg)' },
                '50%': { transform: 'rotateX(20deg) rotateZ(2deg)' },
              },
              '@keyframes grow': {
                '0%': { transform: 'rotateX(20deg) scale(0.96)' },
                '100%': { transform: 'rotateX(20deg) scale(1.04)' },
              },
            }}
            {...baseProps}
          >
            <svg width="100%" height="100%" viewBox="0 0 140 150">
              {/* Main stem */}
              <path
                d="M70 130 Q72 100 70 70 Q68 40 70 20"
                stroke={`hsl(${120 + healthFactor * 20}, 50%, ${30 + healthFactor * 20}%)`}
                strokeWidth="4"
                fill="none"
              />
              
              {/* Branches and leaves */}
              {Array.from({ length: 4 + Math.floor(growthFactor * 3) }).map((_, i) => (
                <g key={i}>
                  {/* Branch */}
                  <path
                    d={`M70 ${120 - i * 25} Q${85 + (i % 2 ? 10 : -10)} ${115 - i * 25} ${95 + (i % 2 ? 15 : -15)} ${110 - i * 25}`}
                    stroke={`hsl(${120 + healthFactor * 20}, 45%, ${35 + healthFactor * 15}%)`}
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Leaves */}
                  <ellipse
                    cx={95 + (i % 2 ? 15 : -15)}
                    cy={110 - i * 25}
                    rx="12"
                    ry="8"
                    fill={`hsl(${120 + healthFactor * 30}, 60%, ${40 + healthFactor * 20}%)`}
                    transform={`rotate(${i % 2 ? 30 : -30} ${95 + (i % 2 ? 15 : -15)} ${110 - i * 25})`}
                  />
                  {/* Tomatoes (if fruiting stage) */}
                  {growthStage >= 4 && i < 3 && (
                    <circle
                      cx={90 + (i % 2 ? 10 : -10)}
                      cy={115 - i * 25}
                      r={`${6 + growthFactor * 3}`}
                      fill={growthStage >= 5 ? `hsl(${5 + healthFactor * 15}, 80%, ${50 + healthFactor * 20}%)` : `hsl(${90 + healthFactor * 20}, 60%, ${45 + healthFactor * 15}%)`}
                    />
                  )}
                </g>
              ))}
              {/* Soil */}
              <ellipse cx="70" cy="135" rx="40" ry="6" fill="#8B4513" opacity="0.7" />
            </svg>
          </Box>
        );

      case 'corn':
        return (
          <Box
            sx={{
              width: `${70 + growthFactor * 50}px`,
              height: `${130 + growthFactor * 70}px`,
              transform: 'rotateX(12deg)',
              transformStyle: 'preserve-3d' as 'preserve-3d',
              '@keyframes sway': {
                '0%, 100%': { transform: 'rotateX(12deg) rotateZ(0deg)' },
                '50%': { transform: 'rotateX(12deg) rotateZ(-3deg)' },
              },
              '@keyframes grow': {
                '0%': { transform: 'rotateX(12deg) scale(0.94)' },
                '100%': { transform: 'rotateX(12deg) scale(1.06)' },
              },
            }}
            {...baseProps}
          >
            <svg width="100%" height="100%" viewBox="0 0 120 200">
              {/* Main stalk */}
              <path
                d="M60 180 Q62 130 60 80 Q58 40 60 20"
                stroke={`hsl(${80 + healthFactor * 25}, 55%, ${35 + healthFactor * 20}%)`}
                strokeWidth="6"
                fill="none"
              />
              
              {/* Corn leaves */}
              {Array.from({ length: 6 + Math.floor(growthFactor * 2) }).map((_, i) => (
                <path
                  key={i}
                  d={`M60 ${160 - i * 20} Q${80 + (i % 2 ? 20 : -20)} ${150 - i * 20} ${90 + (i % 2 ? 25 : -25)} ${140 - i * 20}`}
                  stroke={`hsl(${100 + healthFactor * 30}, 65%, ${40 + healthFactor * 20}%)`}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
              
              {/* Corn cob */}
              {growthStage >= 4 && (
                <g>
                  <ellipse
                    cx="75"
                    cy={`${90 - growthFactor * 10}`}
                    rx="8"
                    ry={`${15 + growthFactor * 10}`}
                    fill={`hsl(${50 + growthFactor * 20}, 70%, ${60 + healthFactor * 15}%)`}
                    transform="rotate(-20 75 90)"
                  />
                  {/* Corn silk */}
                  {Array.from({ length: 8 }).map((_, j) => (
                    <path
                      key={j}
                      d={`M${72 + j} ${75 - growthFactor * 10} Q${70 + j} ${65 - growthFactor * 10} ${68 + j} ${60 - growthFactor * 10}`}
                      stroke={`hsl(${30 + healthFactor * 10}, 60%, ${70 + healthFactor * 10}%)`}
                      strokeWidth="1"
                      fill="none"
                    />
                  ))}
                </g>
              )}
              
              {/* Soil */}
              <ellipse cx="60" cy="185" rx="35" ry="5" fill="#8B4513" opacity="0.8" />
            </svg>
          </Box>
        );

      default:
        return (
          <Box {...baseProps}>
            <Typography sx={{ fontSize: '80px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              {plant.icon}
            </Typography>
          </Box>
        );
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!e.changedTouches[0]) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Swipe gestures
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - rotate right
        setPlantRotation(prev => prev + 45);
      } else {
        // Swipe left - rotate left
        setPlantRotation(prev => prev - 45);
      }
    }
    
    if (Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        // Swipe up - zoom in
        setPlantScale(prev => Math.min(prev + 0.3, 3));
      } else {
        // Swipe down - zoom out
        setPlantScale(prev => Math.max(prev - 0.3, 0.5));
      }
    }
    
    // Double tap to reset
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected - reset plant
      setPlantScale(1);
      setPlantRotation(0);
    }
    setLastTap(currentTime);
  };

  // Voice command handler
  const startVoiceCommand = () => {
    if (!voiceSupported) {
      setError('Voice commands not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log('Voice command:', command);
      
      // Process voice commands
      if (command.includes('wheat') || command.includes('à¤—à¥‡à¤¹à¥‚à¤‚')) {
        setSelectedPlant('wheat');
      } else if (command.includes('rice') || command.includes('à¤šà¤¾à¤µà¤²')) {
        setSelectedPlant('rice');
      } else if (command.includes('tomato') || command.includes('à¤Ÿà¤®à¤¾à¤Ÿà¤°')) {
        setSelectedPlant('tomato');
      } else if (command.includes('corn') || command.includes('à¤®à¤•à¥à¤•à¤¾')) {
        setSelectedPlant('corn');
      } else if (command.includes('zoom in') || command.includes('à¤¬à¤¡à¤¼à¤¾ à¤•à¤°à¥‹')) {
        setPlantScale(prev => Math.min(prev + 0.5, 3));
      } else if (command.includes('zoom out') || command.includes('à¤›à¥‹à¤Ÿà¤¾ à¤•à¤°à¥‹')) {
        setPlantScale(prev => Math.max(prev - 0.5, 0.5));
      } else if (command.includes('rotate') || command.includes('à¤˜à¥à¤®à¤¾à¤“')) {
        setPlantRotation(prev => prev + 90);
      } else if (command.includes('reset') || command.includes('à¤°à¥€à¤¸à¥‡à¤Ÿ')) {
        setPlantScale(1);
        setPlantRotation(0);
      } else if (command.includes('start camera') || command.includes('à¤•à¥ˆà¤®à¤°à¤¾ à¤šà¤¾à¤²à¥‚')) {
        startARSession();
      } else if (command.includes('stop camera') || command.includes('à¤•à¥ˆà¤®à¤°à¤¾ à¤¬à¤‚à¤¦')) {
        stopARSession();
      } else if (command.includes('wind') || command.includes('à¤¹à¤µà¤¾')) {
        if (command.includes('high') || command.includes('à¤¤à¥‡à¤œ')) {
          setWindStrength(5);
        } else if (command.includes('low') || command.includes('à¤§à¥€à¤®à¥€')) {
          setWindStrength(1);
        } else if (command.includes('medium') || command.includes('à¤®à¤§à¥à¤¯à¤®')) {
          setWindStrength(3);
        }
      } else if (command.includes('rain') || command.includes('à¤¬à¤¾à¤°à¤¿à¤¶')) {
        if (command.includes('start') || command.includes('à¤¶à¥à¤°à¥‚')) {
          setIsRaining(true);
        } else if (command.includes('stop') || command.includes('à¤¬à¤‚à¤¦')) {
          setIsRaining(false);
        } else {
          setIsRaining(!isRaining);
        }
      } else if (command.includes('spring') || command.includes('à¤¬à¤¸à¤‚à¤¤')) {
        setSeason('spring');
      } else if (command.includes('summer') || command.includes('à¤—à¤°à¥à¤®à¥€')) {
        setSeason('summer');
      } else if (command.includes('autumn') || command.includes('fall') || command.includes('à¤ªà¤¤à¤à¤¡à¤¼')) {
        setSeason('autumn');
      } else if (command.includes('winter') || command.includes('à¤¸à¤°à¥à¤¦à¥€')) {
        setSeason('winter');
      } else if (command.includes('particles') || command.includes('effects') || command.includes('à¤ªà¥à¤°à¤­à¤¾à¤µ')) {
        setShowParticleEffects(!showParticleEffects);
      } else if (command.includes('animate growth') || command.includes('à¤µà¥ƒà¤¦à¥à¤§à¤¿ à¤¦à¤¿à¤–à¤¾à¤“')) {
        animateGrowth();
      } else {
        setError(`Voice command "${command}" not recognized. Try: "show wheat", "zoom in", "start rain", "high wind", etc.`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setError(`Voice recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Growth animation
  const animateGrowth = async () => {
    if (isAnimatingGrowth) return;
    
    setIsAnimatingGrowth(true);
    const plant = getCurrentPlant();
    const maxStages = plant.growth_stages.length - 1;
    
    // Start from stage 0 and animate to current stage
    for (let stage = 0; stage <= plant.current_stage; stage++) {
      setPlantModels(prev => prev.map(p => 
        p.id === selectedPlant 
          ? { ...p, current_stage: stage }
          : p
      ));
      
      if (stage < plant.current_stage) {
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
      }
    }
    
    setIsAnimatingGrowth(false);
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
            ðŸŒ± AR/VR Plant Visualization
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Camera à¤šà¤¾à¤²à¥‚ à¤•à¤°à¤•à¥‡ plants à¤•à¥‹ 3D à¤®à¥‡à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚ à¤”à¤° à¤¸à¤®à¤à¥‡à¤‚!
          </Typography>
        </Paper>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Mobile Quick Access Panel */}
      {isMobile && (
        <Card elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ðŸŽ¤ Voice: "{isListening ? 'Listening...' : 'Say "show wheat" or "zoom in"'}"
              </Typography>
              {voiceSupported && (
                <Button
                  size="small"
                  variant={isListening ? 'contained' : 'outlined'}
                  onClick={startVoiceCommand}
                  disabled={isListening}
                  startIcon={isListening ? <MicOff /> : <Mic />}
                  sx={{
                    bgcolor: isListening ? '#ff5722' : 'transparent',
                    minWidth: 'auto',
                  }}
                >
                  {isListening ? 'Stop' : 'Voice'}
                </Button>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {mockPlants.slice(0, 4).map((plant) => (
                <Chip
                  key={plant.id}
                  icon={<Typography sx={{ fontSize: '16px' }}>{plant.icon}</Typography>}
                  label={plant.name.split(' ')[0]}
                  onClick={() => setSelectedPlant(plant.id)}
                  variant={selectedPlant === plant.id ? 'filled' : 'outlined'}
                  size="small"
                  color={selectedPlant === plant.id ? 'primary' : 'default'}
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Current: {getCurrentPlant().growth_stages[getCurrentPlant().current_stage]}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={animateGrowth}
                  disabled={isAnimatingGrowth}
                  startIcon={<Animation />}
                >
                  {isAnimatingGrowth ? 'Playing' : 'Animate'}
                </Button>
              </Box>
            </Box>
            
            {/* Mobile 3D Controls */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ðŸŒ¬ï¸ Wind: Level {windStrength}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[1,2,3,4,5].map(level => (
                    <Button
                      key={level}
                      size="small"
                      variant={windStrength === level ? 'contained' : 'outlined'}
                      onClick={() => setWindStrength(level)}
                      sx={{ minWidth: '24px', height: '24px', p: 0 }}
                    >
                      {level}
                    </Button>
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant={isRaining ? 'contained' : 'outlined'}
                  onClick={() => setIsRaining(!isRaining)}
                  sx={{ minWidth: 'auto', bgcolor: isRaining ? '#2196F3' : 'transparent' }}
                >
                  {isRaining ? 'ðŸŒ§ï¸' : 'â˜ï¸'}
                </Button>
                
                {['ðŸŒ¸', 'â˜€ï¸', 'ðŸ‚', 'â„ï¸'].map((emoji, idx) => {
                  const seasons = ['spring', 'summer', 'autumn', 'winter'];
                  return (
                    <Button
                      key={seasons[idx]}
                      size="small"
                      variant={season === seasons[idx] ? 'contained' : 'outlined'}
                      onClick={() => setSeason(seasons[idx] as any)}
                      sx={{ minWidth: 'auto' }}
                    >
                      {emoji}
                    </Button>
                  );
                })}
                
                <Button
                  size="small"
                  variant={showParticleEffects ? 'contained' : 'outlined'}
                  onClick={() => setShowParticleEffects(!showParticleEffects)}
                  sx={{ minWidth: 'auto' }}
                >
                  âœ¨
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={{ xs: 1, md: 3 }}>
        {/* AR Camera View */}
        <Grid item xs={12} lg={8} md={7}>
          <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 0, position: 'relative' }}>
              <Box
                id="ar-container"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                  height: isFullscreen ? '100vh' : { xs: '350px', md: '500px' },
                  backgroundColor: '#000',
                  borderRadius: isFullscreen ? 0 : 3,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMobile ? 'default' : 'grab',
                  userSelect: 'none',
                  '&:active': {
                    cursor: isMobile ? 'default' : 'grabbing',
                  },
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
                  // Demo Mode - Simulated AR background with realistic environment
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: `
                        linear-gradient(180deg, 
                          #87CEEB 0%, 
                          #98FB98 30%, 
                          #90EE90 60%, 
                          #8FBC8F 80%, 
                          #6B8E23 100%
                        ),
                        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grass" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 10 Q3 5 5 0" stroke="%2334A853" stroke-width="0.5" fill="none" opacity="0.3"/><path d="M2 10 Q4 6 2 2" stroke="%2316A34A" stroke-width="0.3" fill="none" opacity="0.2"/><path d="M8 10 Q6 4 8 1" stroke="%2322C55E" stroke-width="0.4" fill="none" opacity="0.25"/></pattern></defs><rect width="100" height="100" fill="url(%23grass)"/></svg>')
                      `,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'><circle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.6\'><animate attributeName=\'opacity\' values=\'0.6;0.1;0.6\' dur=\'3s\' repeatCount=\'indefinite\'/></circle><circle cx=\'60\' cy=\'80\' r=\'0.8\' fill=\'%23ffffff\' opacity=\'0.4\'><animate attributeName=\'opacity\' values=\'0.4;0.1;0.4\' dur=\'4s\' repeatCount=\'indefinite\'/></circle><circle cx=\'140\' cy=\'40\' r=\'1.2\' fill=\'%23ffffff\' opacity=\'0.5\'><animate attributeName=\'opacity\' values=\'0.5;0.2;0.5\' dur=\'2.5s\' repeatCount=\'indefinite\'/></circle><circle cx=\'180\' cy=\'120\' r=\'0.9\' fill=\'%23ffffff\' opacity=\'0.3\'><animate attributeName=\'opacity\' values=\'0.3;0.1;0.3\' dur=\'3.5s\' repeatCount=\'indefinite\'/></circle></svg>")',
                        animation: 'float 6s ease-in-out infinite',
                        pointerEvents: 'none',
                      },
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                        '33%': { transform: 'translateY(-5px) rotate(1deg)' },
                        '66%': { transform: 'translateY(-3px) rotate(-1deg)' },
                      },
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
                        ðŸ“¹ Demo Mode - Camera Not Available
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
                      Camera à¤šà¤¾à¤²à¥‚ à¤•à¤°à¤•à¥‡ à¤…à¤ªà¤¨à¥‡ plants à¤•à¥‹ 3D à¤®à¥‡à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚
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
                        top: isMobile ? 10 : 20,
                        left: isMobile ? 10 : 20,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        p: isMobile ? 1.5 : 2,
                        borderRadius: 2,
                        maxWidth: isMobile ? '200px' : '300px',
                        fontSize: isMobile ? '0.8rem' : '1rem',
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

                    {/* Virtual Plant (Realistic 3D SVG representation) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '50%',
                        transform: `translate(-50%, 0) scale(${plantScale}) rotate(${plantRotation}deg)`,
                        transition: 'all 0.3s ease',
                        perspective: '1000px',
                      }}
                    >
                      {/* Render Realistic 3D Plant */}
                      {renderRealistic3DPlant(getCurrentPlant())}
                      
                      {/* Plant Shadow */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '120px',
                          height: '20px',
                          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>

                    {/* Mobile Gesture Helper */}
                    {isMobile && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 80,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(255, 193, 7, 0.9)',
                          color: '#000',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          textAlign: 'center',
                          maxWidth: '280px',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                          ðŸ‘† Touch Gestures:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '10px' }}>
                          Swipe up/down: Zoom â€¢ Swipe left/right: Rotate â€¢ Double tap: Reset
                        </Typography>
                      </Box>
                    )}

                    {/* AR Controls */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: isMobile ? 0.5 : 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        p: isMobile ? 0.5 : 1,
                        borderRadius: 3,
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        maxWidth: isMobile ? '320px' : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Voice Command Button */}
                      {voiceSupported && (
                        <Tooltip title={isListening ? "Listening..." : "Voice Commands"}>
                          <IconButton
                            size={isMobile ? "medium" : "small"}
                            onClick={startVoiceCommand}
                            disabled={isListening}
                            sx={{
                              color: isListening ? '#ff5722' : 'white',
                              animation: isListening ? 'pulse 1.5s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 },
                              },
                            }}
                          >
                            {isListening ? <MicOff /> : <Mic />}
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Desktop Only - Zoom Controls */}
                      {!isMobile && (
                        <>
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
                        </>
                      )}

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
        <Grid item xs={12} lg={4} md={5}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Plant Selection */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  ðŸŒ± Select Plant
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

                {/* Growth Stage Simulation */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ðŸš€ Growth Simulation
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const plant = getCurrentPlant();
                        const newStage = Math.max(0, plant.current_stage - 1);
                        setPlantModels(prev => prev.map(p => 
                          p.id === selectedPlant 
                            ? { ...p, current_stage: newStage }
                            : p
                        ));
                      }}
                      disabled={getCurrentPlant().current_stage <= 0}
                    >
                      âª Earlier
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const plant = getCurrentPlant();
                        const newStage = Math.min(plant.growth_stages.length - 1, plant.current_stage + 1);
                        setPlantModels(prev => prev.map(p => 
                          p.id === selectedPlant 
                            ? { ...p, current_stage: newStage }
                            : p
                        ));
                      }}
                      disabled={getCurrentPlant().current_stage >= getCurrentPlant().growth_stages.length - 1}
                    >
                      Later â©
                    </Button>
                  </Box>
                  
                  {/* Growth Animation Controls */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      ðŸŽ¥ Time-lapse Animation
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={animateGrowth}
                        disabled={isAnimatingGrowth}
                        startIcon={isAnimatingGrowth ? <Pause /> : <PlayArrow />}
                        sx={{ bgcolor: '#4caf50' }}
                      >
                        {isAnimatingGrowth ? 'Playing...' : 'Play Growth'}
                      </Button>
                      <Tooltip title="Animation Speed">
                        <IconButton size="small">
                          <Animation />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Slider
                      value={animationSpeed}
                      onChange={(_, value) => setAnimationSpeed(value as number)}
                      min={200}
                      max={2000}
                      step={200}
                      size="small"
                      disabled={isAnimatingGrowth}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}ms`}
                    />
                  </Box>
                </Box>

                {/* 3D Animation Controls */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    ðŸƒ 3D Plant Animations
                  </Typography>
                  
                  {/* Wind Strength */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      ðŸŒ¬ï¸ Wind Strength: Level {windStrength}
                    </Typography>
                    <Slider
                      value={windStrength}
                      onChange={(_, value) => setWindStrength(value as number)}
                      min={1}
                      max={5}
                      step={1}
                      size="small"
                      marks
                      valueLabelDisplay="auto"
                      sx={{ color: '#4caf50' }}
                    />
                  </Box>
                  
                  {/* Season Selection */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      ðŸŒ³ Season Effects
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {['spring', 'summer', 'autumn', 'winter'].map((seasonOption) => (
                        <Button
                          key={seasonOption}
                          size="small"
                          variant={season === seasonOption ? 'contained' : 'outlined'}
                          onClick={() => setSeason(seasonOption as any)}
                          sx={{
                            minWidth: 'auto',
                            bgcolor: season === seasonOption ? {
                              spring: '#8BC34A',
                              summer: '#FF9800', 
                              autumn: '#FF5722',
                              winter: '#2196F3'
                            }[seasonOption] : 'transparent'
                          }}
                        >
                          {{
                            spring: 'ðŸŒ¸',
                            summer: 'â˜€ï¸', 
                            autumn: 'ðŸ‚',
                            winter: 'â„ï¸'
                          }[seasonOption]}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                  
                  {/* Weather Effects */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      ðŸŒ§ï¸ Weather Effects
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant={isRaining ? 'contained' : 'outlined'}
                        onClick={() => setIsRaining(!isRaining)}
                        startIcon={isRaining ? 'ðŸŒ§ï¸' : 'â˜ï¸'}
                        sx={{ bgcolor: isRaining ? '#2196F3' : 'transparent' }}
                      >
                        {isRaining ? 'Stop Rain' : 'Start Rain'}
                      </Button>
                      <Button
                        size="small"
                        variant={showParticleEffects ? 'contained' : 'outlined'}
                        onClick={() => setShowParticleEffects(!showParticleEffects)}
                        startIcon={'âœ¨'}
                        sx={{ bgcolor: showParticleEffects ? '#FF9800' : 'transparent' }}
                      >
                        Particles
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Environmental Simulation */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    ðŸŒ¦ï¸ Environmental Conditions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Button
                      size="small"
                      variant={arSession.lighting_condition === 'good' ? 'contained' : 'outlined'}
                      onClick={() => setArSession(prev => ({ ...prev, lighting_condition: 'good' }))}
                      startIcon={<WbSunny />}
                    >
                      Sunny
                    </Button>
                    <Button
                      size="small"
                      variant={arSession.lighting_condition === 'dim' ? 'contained' : 'outlined'}
                      onClick={() => setArSession(prev => ({ ...prev, lighting_condition: 'dim' }))}
                      startIcon={<FilterHdr />}
                    >
                      Cloudy
                    </Button>
                    <Button
                      size="small"
                      variant={arSession.lighting_condition === 'bright' ? 'contained' : 'outlined'}
                      onClick={() => setArSession(prev => ({ ...prev, lighting_condition: 'bright' }))}
                      startIcon={<WbSunny />}
                    >
                      Bright
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Different lighting affects plant growth and AR tracking quality
                  </Typography>
                </Box>

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
                  ðŸ“Š Plant Health
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
                    ðŸ“± AR Session Info
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
                      ðŸ’¡ Point your camera at a flat surface for better tracking
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
                ðŸŒ± Growth Stages Timeline
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
                      {index <= getCurrentPlant().current_stage ? 'âœ“' : index + 1}
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