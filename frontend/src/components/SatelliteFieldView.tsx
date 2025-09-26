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
  TextField,
  LinearProgress,
  Menu,
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
import { enhancedSatelliteService, type SatelliteAnalysis } from '../services/enhancedSatelliteService';

// BHUVAN WMS configuration via env (provide actual layer names via env for production)
const BHUVAN_WMS_URL_ENV = process.env.REACT_APP_BHUVAN_WMS_URL || 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms';
const BHUVAN_LANDUSE_LAYER_ENV = process.env.REACT_APP_BHUVAN_LANDUSE_LAYER || '';
const BHUVAN_SOIL_LAYER_ENV = process.env.REACT_APP_BHUVAN_SOIL_LAYER || '';
const BHUVAN_CROPMASK_LAYER_ENV = process.env.REACT_APP_BHUVAN_CROPMASK_LAYER || '';
const BHUVAN_WMS_VERSION = process.env.REACT_APP_BHUVAN_WMS_VERSION || '1.3.0';

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
  const [autoCapture, setAutoCapture] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Map readiness flag
  const [mapReady, setMapReady] = useState(false);
  const [basemapMenuEl, setBasemapMenuEl] = useState<null | HTMLElement>(null);

  // Moisture analysis dialog/report
  const [moistureOpen, setMoistureOpen] = useState(false);
  const [moistureReport, setMoistureReport] = useState<null | { image?: string; high: number; medium: number; low: number }>(null);

  // Enhanced satellite analysis state
  const [analysis, setAnalysis] = useState<SatelliteAnalysis | null>(null);
  const [ndviSeries, setNdviSeries] = useState<number[]>([]);
  
  // Leaflet map refs
  const leafletLoadedRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const imageryLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const ndviTileLayerRef = useRef<any>(null);
  // BHUVAN WMS layers refs
  const bhuvanLayersRef = useRef<{ [key: string]: any }>({});
  
  // Editable BHUVAN settings (persist to localStorage)
  const [bhuvanWmsUrl, setBhuvanWmsUrl] = useState<string>(() => {
    try { return localStorage.getItem('bhuvan_wms_url') || BHUVAN_WMS_URL_ENV; } catch { return BHUVAN_WMS_URL_ENV; }
  });
  const [bhuvanLanduseLayer, setBhuvanLanduseLayer] = useState<string>(() => {
    try { return localStorage.getItem('bhuvan_layer_landuse') || BHUVAN_LANDUSE_LAYER_ENV; } catch { return BHUVAN_LANDUSE_LAYER_ENV; }
  });
  const [bhuvanSoilLayer, setBhuvanSoilLayer] = useState<string>(() => {
    try { return localStorage.getItem('bhuvan_layer_soil') || BHUVAN_SOIL_LAYER_ENV; } catch { return BHUVAN_SOIL_LAYER_ENV; }
  });
  const [bhuvanCropmaskLayer, setBhuvanCropmaskLayer] = useState<string>(() => {
    try { return localStorage.getItem('bhuvan_layer_cropmask') || BHUVAN_CROPMASK_LAYER_ENV; } catch { return BHUVAN_CROPMASK_LAYER_ENV; }
  });
  
  // Satellite layers configuration
  const [layers, setLayers] = useState<SatelliteLayer[]>([
    { id: 'satellite', name: 'Satellite View', type: 'satellite', opacity: 1, visible: true },
    { id: 'terrain', name: 'Terrain', type: 'terrain', opacity: 0.7, visible: false },
    { id: 'ndvi', name: 'NDVI (Crop Health)', type: 'ndvi', opacity: 0.8, visible: false, date: new Date().toISOString().split('T')[0] },
    { id: 'moisture', name: 'Soil Moisture', type: 'moisture', opacity: 0.8, visible: false, date: new Date().toISOString().split('T')[0] },
    { id: 'labels', name: 'Labels (OSM)', type: 'hybrid', opacity: 1, visible: false },
  ]);

  // NDVI tile configuration (from env or localStorage)
  const [ndviTileTemplate, setNdviTileTemplate] = useState<string>(() => {
    const fromStorage = (() => { try { return localStorage.getItem('ndvi_tile_url') || ''; } catch { return ''; } })();
    if (fromStorage) return fromStorage;
    const envUrl = process.env.REACT_APP_NDVI_TILE_URL || '';
    if (envUrl) return envUrl;
    const api = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    if (api) return `${api}/api/v1/satellite/ndvi-tiles/{z}/{x}/{y}.png?date={date}`;
    return '';
  });
  const [showNdviConfig, setShowNdviConfig] = useState(false);
  const [ndviDate, setNdviDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Basemap selector state
  const [basemapSource, setBasemapSource] = useState<string>(() => { try { return localStorage.getItem('basemap_source') || 'esri'; } catch { return 'esri'; } });
  const [basemapKey, setBasemapKey] = useState<string>(() => { try { return localStorage.getItem('basemap_key') || ''; } catch { return ''; } });
  const [basemapTemplate, setBasemapTemplate] = useState<string>(() => { try { return localStorage.getItem('basemap_template') || ''; } catch { return ''; } });
  const [basemapLabel, setBasemapLabel] = useState<string>('Esri World Imagery');
  const [basemapAttribution, setBasemapAttribution] = useState<string>('');

  // NDVI tile source presets
  const NDVI_SOURCES: { key: string; label: string; template: string }[] = [
    { key: 'custom', label: 'Custom', template: '' },
    { key: 'sentinel', label: 'Sentinel (demo)', template: 'https://tiles.example.com/sentinel/ndvi/{z}/{x}/{y}.png?date={date}' },
    { key: 'landsat', label: 'Landsat (demo)', template: 'https://tiles.example.com/landsat/ndvi/{z}/{x}/{y}.png?date={date}' },
  ];
  const [ndviSource, setNdviSource] = useState<string>(() => {
    try { return localStorage.getItem('ndvi_tile_source') || 'custom'; } catch { return 'custom'; }
  });

  const handleNdviSourceChange = (key: string) => {
    setNdviSource(key);
    try { localStorage.setItem('ndvi_tile_source', key); } catch {}
    const src = NDVI_SOURCES.find(s => s.key === key);
    if (src && src.template) {
      setNdviTileTemplate(src.template);
      try { localStorage.setItem('ndvi_tile_url', src.template); } catch {}
      // Update active layer if visible
      const L: any = (window as any).L;
      if (L && mapInstanceRef.current && layers.find(l => l.id === 'ndvi')?.visible) {
        if (!ndviTileLayerRef.current) {
          ndviTileLayerRef.current = L.tileLayer(src.template.replace('{date}', ndviDate), { opacity: layers.find(l => l.id === 'ndvi')?.opacity || 0.8 });
          ndviTileLayerRef.current.addTo(mapInstanceRef.current);
        } else {
          ndviTileLayerRef.current.setUrl(src.template.replace('{date}', ndviDate));
        }
      }
    }
  };

  useEffect(() => {
    getCurrentLocation();
    // Load Leaflet assets once
    const ensureLeaflet = async () => {
      if ((window as any).L || leafletLoadedRef.current) {
        // also ensure leaflet-image plugin
        if (!(window as any).leafletImage) {
          await new Promise<void>((resolve) => {
            const plugin = document.createElement('script');
            plugin.src = 'https://unpkg.com/leaflet-image/leaflet-image.js';
            plugin.async = true;
            plugin.onload = () => resolve();
            document.body.appendChild(plugin);
          });
        }
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
      // load leaflet-image after leaflet
      await new Promise<void>((resolve) => {
        const plugin = document.createElement('script');
        plugin.src = 'https://unpkg.com/leaflet-image/leaflet-image.js';
        plugin.async = true;
        plugin.onload = () => resolve();
        document.body.appendChild(plugin);
      });
      leafletLoadedRef.current = true;
    };
    ensureLeaflet();
  }, []);

  // Fix: on window resize or visibility change, invalidate map size
  useEffect(() => {
    const onResize = () => ensureMapSize(mapInstanceRef);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ensure imagery is attached whenever Satellite View is ON
  useEffect(() => {
    try {
      const L: any = (window as any).L;
      const satOn = layers.find(l => l.id === 'satellite')?.visible;
      if (mapReady && satOn && !imageryLayerRef.current && L) {
        addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); });
      }
    } catch {}
  }, [mapReady, layers, basemapSource, basemapKey, basemapTemplate]);

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

      // Initialize or update the Leaflet map with Esri World Imagery
      await initializeMap(lat, lng);
      
      // Simulate API call to get field data
      // In real implementation, this would call your backend API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockFieldData: FieldData = {
        coordinates: { lat, lng },
        area: 2.5, // acres
        soilType: 'Loamy',
        cropHistory: ['Wheat', 'Rice', 'Sugarcane'],
        currentCrop: 'Wheat',
        lastUpdated: new Date()
      };
      
      setFieldData(mockFieldData);

      // Fetch enhanced satellite analysis for this location
      const enhanced = await enhancedSatelliteService.getEnhancedSatelliteAnalysis({ latitude: lat, longitude: lng });
      setAnalysis(enhanced);

      // Generate a lightweight NDVI time series for sparkline (last 8 weeks)
      const base = enhanced.ndviData.ndvi;
      const trend = enhanced.ndviData.trend; // improving | stable | declining
      const series: number[] = Array.from({ length: 8 }, (_, i) => {
        const drift = trend === 'improving' ? i * 0.01 : trend === 'declining' ? -i * 0.01 : 0;
        const noise = (Math.random() - 0.5) * 0.03;
        return Math.max(0.1, Math.min(0.9, base + drift + noise - 0.07)); // older points slightly lower
      });
      setNdviSeries(series);

    } catch (error) {
      console.error('Error loading field data:', error);
      setError('Failed to load field data');
    } finally {
      setLoading(false);
    }
  };

  const captureSatellitePhoto = () => {
    try {
      const leafletImage = (window as any).leafletImage;
      const map = mapInstanceRef.current;
      if (!leafletImage || !map) {
        setError('Photo capture not ready yet.');
        return;
      }
      leafletImage(map, (err: any, canvas: HTMLCanvasElement) => {
        if (err) {
          setError('Failed to capture photo');
          return;
        }
        const url = canvas.toDataURL('image/jpeg');
        setPhotoUrl(url);
      });
    } catch (e) {
      console.error(e);
      setError('Failed to capture photo');
    }
  };

  // Analyze moisture from current map render (heuristic on RGB)
  const analyzeMoistureFromMap = () => {
    try {
      const leafletImage = (window as any).leafletImage;
      const map = mapInstanceRef.current;
      if (!leafletImage || !map) {
        setError('Moisture analysis not ready yet.');
        return;
      }
      leafletImage(map, (err: any, canvas: HTMLCanvasElement) => {
        if (err) {
          setError('Failed to analyze moisture');
          return;
        }
        const w = canvas.width;
        const h = canvas.height;
        const srcCtx = canvas.getContext('2d');
        if (!srcCtx) return;
        const src = srcCtx.getImageData(0, 0, w, h);
        // Output annotated image
        const outCanvas = document.createElement('canvas');
        outCanvas.width = w; outCanvas.height = h;
        const outCtx = outCanvas.getContext('2d')!;
        outCtx.drawImage(canvas, 0, 0);
        const out = outCtx.getImageData(0, 0, w, h);

        let high = 0, medium = 0, low = 0;
        for (let i = 0; i < src.data.length; i += 4) {
          const r = src.data[i];
          const g = src.data[i + 1];
          const b = src.data[i + 2];
          const a = src.data[i + 3];
          if (a < 10) { low++; continue; }
          const brightness = (r + g + b) / 3;
          const blueDom = b - Math.max(r, g);
          const greenDom = g - r;
          let cls: 'high' | 'medium' | 'low' = 'low';
          if (blueDom > 30 && brightness < 150) cls = 'high';
          else if (greenDom > 20 && brightness < 170) cls = 'medium';

          if (cls === 'high') {
            high++;
            // overlay blue tint
            out.data[i] = Math.min(255, r * 0.6);
            out.data[i + 1] = Math.min(255, g * 0.6);
            out.data[i + 2] = Math.min(255, b + 80);
          } else if (cls === 'medium') {
            medium++;
            // overlay cyan tint
            out.data[i] = Math.min(255, r * 0.7);
            out.data[i + 1] = Math.min(255, g + 60);
            out.data[i + 2] = Math.min(255, b + 60);
          } else {
            low++;
          }
        }
        outCtx.putImageData(out, 0, 0);
        const total = Math.max(1, (w * h));
        setMoistureReport({
          image: outCanvas.toDataURL('image/png'),
          high: Math.round((high / total) * 100),
          medium: Math.round((medium / total) * 100),
          low: Math.max(0, 100 - Math.round((high / total) * 100) - Math.round((medium / total) * 100)),
        });
        setMoistureOpen(true);
      });
    } catch (e) {
      console.error(e);
      setError('Failed to analyze moisture');
    }
  };

  const initializeMap = async (lat: number, lng: number) => {
    try {
      // Ensure Leaflet has loaded before initializing
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          let attempts = 0;
          const iv = setInterval(() => {
            attempts++;
            if ((window as any).L || attempts > 50) { // ~5s max wait
              clearInterval(iv);
              resolve();
            }
          }, 100);
        });
      }

      const L: any = (window as any).L;
      if (!L || !mapRef.current) return; // give up if still not available

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: zoomLevel,
          zoomControl: false,
        });
        // Add base imagery with fallback
        await addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); });
        setMapReady(true);
      } else {
        mapInstanceRef.current.setView([lat, lng], zoomLevel);
        if (!imageryLayerRef.current) {
          await addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); });
        }
        setMapReady(true);
      }
      // Labels layer if enabled
      const labelsEnabled = layers.find(l => l.id === 'labels')?.visible;
      if (labelsEnabled && !labelsLayerRef.current) {
        labelsLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });
        labelsLayerRef.current.addTo(mapInstanceRef.current);
      } else if (!labelsEnabled && labelsLayerRef.current) {
        mapInstanceRef.current.removeLayer(labelsLayerRef.current);
        labelsLayerRef.current = null;
      }
      // marker for exact position
      L.marker([lat, lng]).addTo(mapInstanceRef.current);

      // Make sure map sizes correctly (prevents blank tiles)
      ensureMapSize(mapInstanceRef);

      // Auto capture if enabled
      if (autoCapture) setTimeout(() => captureSatellitePhoto(), 1000);
    } catch (e) {
      console.warn('Map init error', e);
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

  const toggleLayer = async (layerId: string) => {
    // Determine target visibility before state update
    const current = layers.find(l => l.id === layerId);
    const willShow = current ? !current.visible : true;

    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));

    // Manage Leaflet layers side-effects
    const L: any = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    if (layerId === 'labels') {
      if (!willShow && labelsLayerRef.current) {
        mapInstanceRef.current.removeLayer(labelsLayerRef.current);
        labelsLayerRef.current = null;
      } else if (willShow && !labelsLayerRef.current) {
        labelsLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });
        labelsLayerRef.current.setOpacity(layers.find(l => l.id === 'labels')?.opacity || 1);
        labelsLayerRef.current.addTo(mapInstanceRef.current);
      }
    }

    if (layerId === 'satellite') {
      if (!willShow && imageryLayerRef.current) {
        mapInstanceRef.current.removeLayer(imageryLayerRef.current);
        imageryLayerRef.current = null;
      } else if (willShow && !imageryLayerRef.current) {
        await addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef);
        if (imageryLayerRef.current) {
          imageryLayerRef.current.setOpacity(layers.find(l => l.id === 'satellite')?.opacity || 1);
        }
      }
    }

    if (layerId === 'ndvi') {
      // If template available, add real tile overlay
      if (ndviTileLayerRef.current) {
        mapInstanceRef.current.removeLayer(ndviTileLayerRef.current);
        ndviTileLayerRef.current = null;
      }
      if (willShow && ndviTileTemplate) {
        const url = ndviTileTemplate.replace('{date}', ndviDate);
        ndviTileLayerRef.current = L.tileLayer(url, { opacity: layers.find(l => l.id === 'ndvi')?.opacity || 0.8 });
        ndviTileLayerRef.current.addTo(mapInstanceRef.current);
      }
    }
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity: opacity / 100 }
        : layer
    ));
    if (layerId === 'satellite' && imageryLayerRef.current) {
      imageryLayerRef.current.setOpacity(opacity / 100);
    }
    if (layerId === 'labels' && labelsLayerRef.current) {
      labelsLayerRef.current.setOpacity(opacity / 100);
    }
    if (layerId === 'ndvi' && ndviTileLayerRef.current) {
      ndviTileLayerRef.current.setOpacity(opacity / 100);
    }
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

  // Inline component to toggle BHUVAN WMS layers
  const BhuvanToggle: React.FC<{ label: string; envLayer: string; layerKey: string }> = ({ label, envLayer, layerKey }) => {
    const [on, setOn] = useState(false);
    const handleToggle = () => {
      const next = !on;
      setOn(next);
      const L: any = (window as any).L;
      const map = mapInstanceRef.current;
      if (!L || !map) return;
      if (!envLayer) {
        setError('BHUVAN layer not configured. Set env variable for this layer.');
        setTimeout(() => setError(''), 2500);
        setOn(false);
        return;
      }
      if (next) {
        const wms = L.tileLayer.wms(bhuvanWmsUrl, {
          layers: envLayer,
          format: 'image/png',
          transparent: true,
          version: BHUVAN_WMS_VERSION,
          crossOrigin: true,
        });
        bhuvanLayersRef.current[layerKey] = wms.addTo(map);
      } else {
        const wms = bhuvanLayersRef.current[layerKey];
        if (wms) {
          try { map.removeLayer(wms); } catch {}
          bhuvanLayersRef.current[layerKey] = null;
        }
      }
    };
    return (
      <ListItem sx={{ px: 0 }}>
        <FormControlLabel
          control={<Switch checked={on} onChange={handleToggle} size="small" />}
          label={`${label}${envLayer ? '' : ' (configure)'}`}
        />
      </ListItem>
    );
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
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                    borderRadius: 3,
                    p: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    backdropFilter: 'blur(6px)'
                  }}>
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

                  <Tooltip title="Basemap">
                    <Fab
                      size="small"
                      onClick={(e) => setBasemapMenuEl(e.currentTarget as HTMLElement)}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <Satellite />
                    </Fab>
                  </Tooltip>
                  <Menu anchorEl={basemapMenuEl} open={Boolean(basemapMenuEl)} onClose={() => setBasemapMenuEl(null)}>
                    <MenuItem onClick={() => { setBasemapSource('esri'); try { localStorage.setItem('basemap_source','esri'); } catch {}; const L: any = (window as any).L; if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: 'esri', key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Esri'); setBasemapAttribution(info.attribution || ''); }); setBasemapMenuEl(null);} }>Esri World Imagery</MenuItem>
                    <MenuItem onClick={() => { setBasemapSource('esriAlt'); try { localStorage.setItem('basemap_source','esriAlt'); } catch {}; const L: any = (window as any).L; if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: 'esriAlt', key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Esri Alt'); setBasemapAttribution(info.attribution || ''); }); setBasemapMenuEl(null);} }>Esri (Alternate)</MenuItem>
                    <MenuItem onClick={() => { setBasemapSource('osm'); try { localStorage.setItem('basemap_source','osm'); } catch {}; const L: any = (window as any).L; if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: 'osm', key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'OSM'); setBasemapAttribution(info.attribution || ''); }); setBasemapMenuEl(null);} }>OSM Standard</MenuItem>
                  </Menu>

                  <Tooltip title="Reload Imagery">
                    <Fab
                      size="small"
                      onClick={() => {
                        const L: any = (window as any).L;
                        if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); });
                      }}
                      sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      <Refresh />
                    </Fab>
                  </Tooltip>
                  </Box>
                </Box>

                {/* Satellite Map */}
                <Box
                  ref={mapRef}
                  id="ndvi-map-container"
                  sx={{
                    height: '500px',
                    position: 'relative',
                    '& .leaflet-container': { height: '100%', width: '100%', borderRadius: '12px' }
                  }}
                >
                  {loading && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(2px)' }}>
                      <CircularProgress size={60} />
                    </Box>
                  )}

                  {/* Field Boundary Overlay */}
                  {fieldData && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '28%',
                        left: '34%',
                        right: '34%',
                        bottom: '28%',
                        border: '2px dashed #ffa726',
                        borderRadius: 3,
                        boxShadow: '0 8px 20px rgba(255,167,38,0.25) inset, 0 2px 10px rgba(0,0,0,0.08)',
                        background: 'rgba(255, 183, 77, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(255,167,38,0.5)',
                        color: '#ef6c00',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        Your Field Boundary
                      </Box>
                    </Box>
                  )}

                  {/* Basemap legend/attribution */}
                  <Box sx={{ position: 'absolute', left: 12, bottom: 56, p: 0.75, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>{basemapLabel}</Typography>
                    {basemapAttribution && (
                      <Typography variant="caption" color="text.secondary">{basemapAttribution}</Typography>
                    )}
                  </Box>

                  {/* NDVI overlay simulation when NDVI layer is visible */}
                  {layers.find(l => l.id === 'ndvi')?.visible && (
                    <>
                      {/* Visual overlay in absence of tile source */}
                      {!ndviTileTemplate && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '12px',
                            pointerEvents: 'none',
                            background: 'radial-gradient(circle at 50% 50%, rgba(76,175,80,0.25), rgba(76,175,80,0.05) 60%, transparent 70%)',
                            mixBlendMode: 'multiply'
                          }}
                        />
                      )}
                      {/* NDVI Legend */}
                      <Box sx={{ position: 'absolute', left: 12, bottom: 12, p: 1, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 1, boxShadow: 1, minWidth: 180 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>NDVI Legend</Typography>
                        <Box sx={{ height: 10, borderRadius: 1, background: 'linear-gradient(90deg, #9e2a2a 0%, #f44336 10%, #ffeb3b 50%, #8bc34a 80%, #4caf50 100%)' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          {['0.0','0.2','0.4','0.6','0.8','1.0'].map(t => (
                            <Typography key={t} variant="caption" sx={{ color: 'text.secondary' }}>{t}</Typography>
                          ))}
                        </Box>
                      </Box>
                    </>
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
                      sx={{
                        bgcolor: 'linear-gradient(45deg, #2e7d32, #66bb6a)',
                        color: 'white',
                        borderRadius: 999,
                        px: 2,
                        '&:hover': { filter: 'brightness(0.95)' }
                      }}
                    >
                      Download
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<PhotoCamera />}
                      onClick={captureSatellitePhoto}
                      size="small"
                      sx={{
                        bgcolor: 'linear-gradient(45deg, #1e88e5, #64b5f6)',
                        color: 'white',
                        borderRadius: 999,
                        px: 2,
                        '&:hover': { filter: 'brightness(0.95)' }
                      }}
                    >
                      Capture Photo
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<Opacity />}
                      onClick={analyzeMoistureFromMap}
                      size="small"
                      sx={{
                        bgcolor: 'linear-gradient(45deg, #0288d1, #26c6da)',
                        color: 'white',
                        borderRadius: 999,
                        px: 2,
                        '&:hover': { filter: 'brightness(0.95)' }
                      }}
                    >
                      Analyze Moisture
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<ViewInAr />}
                      onClick={startARVisualization}
                      size="small"
                      sx={{
                        bgcolor: 'linear-gradient(45deg, #43a047, #81c784)',
                        color: 'white',
                        borderRadius: 999,
                        px: 2,
                        '&:hover': { filter: 'brightness(0.95)' }
                      }}
                    >
                      AR View
                    </Button>
                  </Box>

                  <Chip
                    icon={<ZoomIn />}
                    label={`Zoom: ${zoomLevel}x`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                  />
                  <FormControlLabel
                    control={<Switch checked={autoCapture} onChange={() => setAutoCapture(!autoCapture)} size="small" />}
                    label="Auto Capture"
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
                
                {/* Basemap selector */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Basemap</InputLabel>
                    <Select value={basemapSource} label="Basemap" onChange={(e) => {
                      const val = e.target.value as string;
                      setBasemapSource(val);
                      try { localStorage.setItem('basemap_source', val); } catch {}
                      const L: any = (window as any).L;
                      if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: val, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); });
                    }}>
                      <MenuItem value="esri">Esri World Imagery</MenuItem>
                      <MenuItem value="esriAlt">Esri (Alternate)</MenuItem>
                      <MenuItem value="osm">OSM Standard</MenuItem>
                      <MenuItem value="mapbox">Mapbox Satellite (key)</MenuItem>
                      <MenuItem value="custom">Custom Template</MenuItem>
                    </Select>
                  </FormControl>
                  {(basemapSource === 'mapbox') && (
                    <TextField size="small" label="Mapbox Access Token" value={basemapKey} onChange={(e) => setBasemapKey(e.target.value)} onBlur={() => { try { localStorage.setItem('basemap_key', basemapKey); } catch {}; const L: any = (window as any).L; if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); }); }} sx={{ minWidth: 280 }} placeholder="pk.ey..." />
                  )}
                  {(basemapSource === 'custom') && (
                    <TextField size="small" fullWidth label="Custom Tile URL" value={basemapTemplate} onChange={(e) => setBasemapTemplate(e.target.value)} onBlur={() => { try { localStorage.setItem('basemap_template', basemapTemplate); } catch {}; const L: any = (window as any).L; if (L) addBaseImageryLayer(L, mapInstanceRef, imageryLayerRef, { type: basemapSource, key: basemapKey, template: basemapTemplate }, (info) => { setBasemapLabel(info.name || 'Basemap'); setBasemapAttribution(info.attribution || ''); }); }} placeholder="https://tiles.example.com/{z}/{x}/{y}.png?key={key}" />
                  )}
                </Box>

                <List dense>
                  {layers.map((layer) => (
                    <ListItem key={layer.id} sx={{ px: 0, alignItems: 'flex-start', flexDirection: 'column' }}>
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

                      {/* Per-layer controls */}
                      {layer.id === 'ndvi' && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%', pl: 5, pb: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Source</InputLabel>
                            <Select value={ndviSource} label="Source" onChange={(e) => handleNdviSourceChange(e.target.value as string)}>
                              {NDVI_SOURCES.map(s => (
                                <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            label="Date"
                            type="date"
                            size="small"
                            value={ndviDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setNdviDate(newDate);
                              setLayers(prev => prev.map(l => l.id === 'ndvi' ? { ...l, date: newDate } : l));
                              // Update tile URL if active
                              const L: any = (window as any).L;
                              if ((window as any).L && mapInstanceRef.current && ndviTileLayerRef.current && ndviTileTemplate) {
                                const url = ndviTileTemplate.replace('{date}', newDate);
                                ndviTileLayerRef.current.setUrl(url);
                              }
                            }}
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            label="Opacity"
                            type="number"
                            size="small"
                            value={Math.round((layers.find(l => l.id === 'ndvi')?.opacity || 0.8) * 100)}
                            onChange={(e) => updateLayerOpacity('ndvi', Number(e.target.value))}
                            inputProps={{ min: 10, max: 100 }}
                          />
                          <Button size="small" variant="outlined" onClick={() => setShowNdviConfig(!showNdviConfig)}>
                            {showNdviConfig ? 'Hide Tile URL' : 'Configure Tile URL'}
                          </Button>
                          {(showNdviConfig || ndviSource === 'custom') && (
                            <TextField
                              fullWidth
                              placeholder="https://tiles.example.com/ndvi/{z}/{x}/{y}.png?date={date}"
                              label="NDVI Tile URL Template"
                              size="small"
                              value={ndviTileTemplate}
                              onChange={(e) => setNdviTileTemplate(e.target.value)}
                              onBlur={() => {
                                try { localStorage.setItem('ndvi_tile_url', ndviTileTemplate); } catch {}
                                // Update active NDVI tile if visible
                                const L: any = (window as any).L;
                                if (L && mapInstanceRef.current && ndviTileLayerRef.current && ndviTileTemplate) {
                                  ndviTileLayerRef.current.setUrl(ndviTileTemplate.replace('{date}', ndviDate));
                                }
                              }}
                              helperText="Use placeholders {z}, {x}, {y}, and {date}"
                            />
                          )}
                        </Box>
                      )}
                    </ListItem>
                  ))}

                  {/* BHUVAN WMS Layers */}
                  <ListItem sx={{ px: 0, mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>BHUVAN Layers</Typography>
                  </ListItem>
                  <Box sx={{ pl: 0.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField size="small" label="WMS URL" value={bhuvanWmsUrl} onChange={(e) => setBhuvanWmsUrl(e.target.value)} onBlur={() => { try { localStorage.setItem('bhuvan_wms_url', bhuvanWmsUrl); } catch {} }} placeholder="https://.../wms" />
                    <TextField size="small" label="Landuse Layer Name" value={bhuvanLanduseLayer} onChange={(e) => setBhuvanLanduseLayer(e.target.value)} onBlur={() => { try { localStorage.setItem('bhuvan_layer_landuse', bhuvanLanduseLayer); } catch {} }} placeholder="e.g. bhuwan:landuse_..." />
                    <TextField size="small" label="Soil Layer Name" value={bhuvanSoilLayer} onChange={(e) => setBhuvanSoilLayer(e.target.value)} onBlur={() => { try { localStorage.setItem('bhuvan_layer_soil', bhuvanSoilLayer); } catch {} }} placeholder="e.g. bhuwan:soil_..." />
                    <TextField size="small" label="Crop Mask Layer Name" value={bhuvanCropmaskLayer} onChange={(e) => setBhuvanCropmaskLayer(e.target.value)} onBlur={() => { try { localStorage.setItem('bhuvan_layer_cropmask', bhuvanCropmaskLayer); } catch {} }} placeholder="e.g. bhuwan:cropmask_..." />
                  </Box>
                  <BhuvanToggle label="Land Use / Land Cover" envLayer={bhuvanLanduseLayer} layerKey="landuse" />
                  <BhuvanToggle label="Soil Map" envLayer={bhuvanSoilLayer} layerKey="soil" />
                  <BhuvanToggle label="Crop Mask" envLayer={bhuvanCropmaskLayer} layerKey="cropmask" />
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

            {analysis ? (
              <Card elevation={4} sx={{ borderRadius: 3, mb: 3, border: '1px solid #9c27b0', background: '#f8e5ff' }}>
                <CardContent id="advanced-analysis-panel">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: '#6a1b9a', display: 'flex', alignItems: 'center' }}>
                      🧠 Advanced Satellite Analysis {ndviDate ? `(for ${ndviDate})` : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" onClick={exportAnalysisAsPng}>Export PNG</Button>
                      <Button size="small" variant="outlined" onClick={exportAnalysisAsPdf}>Export PDF</Button>
                      <Button size="small" variant="outlined" color="secondary" onClick={exportFullReportPdf}>Export Full PDF</Button>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label={`NDVI ${analysis.ndviData.ndvi.toFixed(2)}`} color={analysis.ndviData.ndvi >= 0.6 ? 'success' : analysis.ndviData.ndvi >= 0.4 ? 'warning' : 'error'} />
                    <Chip label={`EVI ${analysis.ndviData.evi.toFixed(2)}`} />
                    <Chip label={`SAVI ${analysis.ndviData.savi.toFixed(2)}`} />
                    <Chip label={`NDWI ${analysis.ndviData.ndwi.toFixed(2)}`} />
                    <Chip label={`LAI ${analysis.ndviData.lai.toFixed(1)}`} />
                    <Chip label={`Cloud ${Math.round(analysis.ndviData.cloudCover)}%`} />
                    <Chip label={`${analysis.ndviData.resolution}m`} />
                    <Chip label={`Quality: ${analysis.ndviData.quality}`} color={analysis.ndviData.quality === 'excellent' ? 'success' : analysis.ndviData.quality === 'good' ? 'success' : analysis.ndviData.quality === 'fair' ? 'warning' : 'error'} />
                  </Box>

                  {/* NDVI Sparkline */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#6a1b9a' }}>NDVI Trend (last 8 weeks)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 60, p: 0.5, borderRadius: 1, background: 'rgba(255,255,255,0.7)' }}>
                      {ndviSeries.map((v, i) => (
                        <Box key={i} sx={{ width: 10, height: `${Math.round(v * 100)}%`, bgcolor: v >= 0.6 ? '#4caf50' : v >= 0.4 ? '#ff9800' : '#f44336', borderRadius: '2px 2px 0 0' }} />
                      ))}
                    </Box>
                  </Box>

                  {/* AI Scores */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">Crop Health</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#e0e0e0', borderRadius: 4 }}>
                          <Box sx={{ width: `${analysis.analysis.cropHealthScore}%`, height: '100%', bgcolor: '#4caf50', borderRadius: 4 }} />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 36 }}>{analysis.analysis.cropHealthScore}%</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">Soil Fertility</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#e0e0e0', borderRadius: 4 }}>
                          <Box sx={{ width: `${analysis.analysis.soilFertilityIndex}%`, height: '100%', bgcolor: '#8bc34a', borderRadius: 4 }} />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 36 }}>{analysis.analysis.soilFertilityIndex}%</Typography>
                      </Box>
                    </Grid>

                    {/* Weather Forecast & Temperature Trend */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">7-day Precipitation Forecast (mm)</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80, p: 0.5, borderRadius: 1, background: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                        {analysis.weatherData.precipitation.forecast7Days.map((mm, i) => (
                          <Box key={i} sx={{ width: 12, height: `${Math.min(100, Math.round(mm * 4))}%`, bgcolor: mm > 5 ? '#2196f3' : '#90caf9', borderRadius: '2px 2px 0 0' }} />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">Temperature Trend (°C)</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80, p: 0.5, borderRadius: 1, background: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                        {Array.from({ length: 7 }, (_, i) => {
                          const base = (analysis.weatherData.temperature.min + analysis.weatherData.temperature.max) / 2;
                          const variation = Math.sin((i / 6) * Math.PI) * 4;
                          const temp = Math.round(base + variation);
                          return <Box key={i} sx={{ width: 12, height: `${Math.min(100, (temp / (analysis.weatherData.temperature.max + 10)) * 100)}%`, bgcolor: '#ff7043', borderRadius: '2px 2px 0 0' }} title={`${temp}°C`} />
                        })}
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip label={`Water Stress: ${analysis.analysis.waterStressLevel}`} color={analysis.analysis.waterStressLevel === 'low' ? 'success' : analysis.analysis.waterStressLevel === 'medium' ? 'warning' : 'error'} />
                        <Chip label={`Growth: ${analysis.analysis.growthStage}`} />
                        {analysis.soilData.location?.district && (
                          <Chip label={`${analysis.soilData.location.district}${analysis.soilData.location.state ? ', ' + analysis.soilData.location.state : ''}`} />
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Recommended Crops & Insights */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Recommended Crops</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {analysis.analysis.recommendedCrops.map((c, idx) => (
                        <Chip key={idx} label={c} color="primary" variant="outlined" />
                      ))}
                    </Box>

                    {analysis.analysis.actionableInsights?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Insights</Typography>
                        <List dense sx={{ py: 0 }}>
                          {analysis.analysis.actionableInsights.slice(0, 4).map((ins, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <TrendingUp sx={{ color: '#6a1b9a' }} fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={ins} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Data Quality: ${analysis.dataQuality.overall}%`} />
                      <Chip label={`Vegetation: ${analysis.dataQuality.vegetation}%`} />
                      <Chip label={`Soil: ${analysis.dataQuality.soil}%`} />
                      <Chip label={`Weather: ${analysis.dataQuality.weather}%`} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : null}
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

      {/* Captured Satellite Photo Dialog */}
      <Dialog open={!!photoUrl} onClose={() => setPhotoUrl('')} maxWidth="md" fullWidth>
        <DialogTitle>📸 Satellite Photo</DialogTitle>
        <DialogContent>
          {photoUrl && (
            <Box sx={{ textAlign: 'center' }}>
              <img src={photoUrl} alt="Satellite" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoUrl('')}>Close</Button>
          {photoUrl && (
            <Button component="a" href={photoUrl} download={`satellite_photo_${Date.now()}.jpg`} variant="contained">
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Moisture Analysis Dialog */}
      <Dialog open={moistureOpen} onClose={() => setMoistureOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>💧 Surface Moisture Analysis (heuristic)</DialogTitle>
        <DialogContent>
          {moistureReport ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Box sx={{ textAlign: 'center' }}>
                  {moistureReport.image && (
                    <img src={moistureReport.image} alt="Moisture Map" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>High moisture / waterlogged</Typography>
                  <LinearProgress variant="determinate" value={moistureReport.high} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#2196f3' } }} />
                  <Typography variant="caption" color="text.secondary">{moistureReport.high}% of view</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Medium moisture</Typography>
                  <LinearProgress variant="determinate" value={moistureReport.medium} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#4dd0e1' } }} />
                  <Typography variant="caption" color="text.secondary">{moistureReport.medium}% of view</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Low moisture</Typography>
                  <LinearProgress variant="determinate" value={moistureReport.low} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#a5d6a7' } }} />
                  <Typography variant="caption" color="text.secondary">{moistureReport.low}% of view</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Note: This is an RGB-based heuristic. For accurate soil moisture, enable NDWI tiles or Sentinel-based analysis.
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2">Analyzing...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoistureOpen(false)}>Close</Button>
          {moistureReport?.image && (
            <Button component="a" href={moistureReport.image} download={`moisture_analysis_${Date.now()}.png`} variant="contained">
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

// Export helpers: PNG/PDF using dynamic CDN scripts
async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(s);
  });
}

async function exportAnalysisAsPng() {
  const panel = document.getElementById('advanced-analysis-panel');
  if (!panel) return;
  const w: any = window as any;
  if (!w.html2canvas) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
  const canvas = await (window as any).html2canvas(panel, { backgroundColor: '#ffffff', scale: 2 });
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `satellite_analysis_${new Date().toISOString().split('T')[0]}.png`;
  link.click();
}

async function exportAnalysisAsPdf() {
  const panel = document.getElementById('advanced-analysis-panel');
  if (!panel) return;
  const w: any = window as any;
  if (!w.html2canvas) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
  if (!w.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  const canvas = await (window as any).html2canvas(panel, { backgroundColor: '#ffffff', scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20; // margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
  pdf.save(`satellite_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
}

async function exportFullReportPdf() {
  const map = document.getElementById('ndvi-map-container');
  const panel = document.getElementById('advanced-analysis-panel');
  if (!map || !panel) return;
  const w: any = window as any;
  if (!w.html2canvas) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
  if (!w.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  const [mapCanvas, panelCanvas] = await Promise.all([
    (window as any).html2canvas(map, { backgroundColor: '#ffffff', scale: 2, useCORS: true }),
    (window as any).html2canvas(panel, { backgroundColor: '#ffffff', scale: 2 })
  ]);
  const mapImg = mapCanvas.toDataURL('image/png');
  const panelImg = panelCanvas.toDataURL('image/png');
  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Map page
  let imgWidth = pageWidth - 20;
  let imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;
  if (imgHeight > pageHeight - 20) {
    imgHeight = pageHeight - 20;
    imgWidth = (mapCanvas.width * imgHeight) / mapCanvas.height;
  }
  pdf.addImage(mapImg, 'PNG', (pageWidth - imgWidth) / 2, 10, imgWidth, imgHeight);

  // Analysis page
  pdf.addPage();
  let aImgWidth = pageWidth - 20;
  let aImgHeight = (panelCanvas.height * aImgWidth) / panelCanvas.width;
  if (aImgHeight > pageHeight - 20) {
    aImgHeight = pageHeight - 20;
    aImgWidth = (panelCanvas.width * aImgHeight) / panelCanvas.height;
  }
  pdf.addImage(panelImg, 'PNG', (pageWidth - aImgWidth) / 2, 10, aImgWidth, aImgHeight);

  pdf.save(`satellite_full_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Adds Esri World Imagery with automatic fallback to OSM if tiles fail
// Invalidate map size safely to avoid blank tiles after layout changes
function ensureMapSize(mapRefInst: any) {
  try {
    if (!mapRefInst.current) return;
    mapRefInst.current.invalidateSize(true);
    // A couple of delayed invalidations to cover animations/layout changes
    setTimeout(() => { try { mapRefInst.current && mapRefInst.current.invalidateSize(true); } catch {} }, 200);
    requestAnimationFrame(() => { try { mapRefInst.current && mapRefInst.current.invalidateSize(true); } catch {} });
  } catch {}
}

async function addBaseImageryLayer(L: any, mapRefInst: any, imageryLayerRefObj: any, preferred?: { type?: string; key?: string; template?: string }, onLoaded?: (info: { name?: string; attribution?: string }) => void): Promise<void> {
  if (!mapRefInst.current) return;
  // Clean previous if any
  if (imageryLayerRefObj.current) {
    try { mapRefInst.current.removeLayer(imageryLayerRefObj.current); } catch {}
    imageryLayerRefObj.current = null;
  }
  return new Promise<void>((resolve) => {
    // Providers chain; preferred goes first if configured
    const providers: { name: string; url: string; options: any }[] = [];

    const mapboxUrl = preferred?.key ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${preferred.key}` : '';
    const customUrl = preferred?.template ? preferred.template.replace('{key}', preferred?.key || '') : '';

    // Bing factory (requires quadkey)
    const createBingLayer = (apiKey: string) => {
      const tileXYToQuadKey = (x: number, y: number, z: number) => {
        let quadKey = '';
        for (let i = z; i > 0; i--) {
          let digit = 0;
          const mask = 1 << (i - 1);
          if ((x & mask) !== 0) digit += 1;
          if ((y & mask) !== 0) digit += 2;
          quadKey += digit.toString();
        }
        return quadKey;
      };
      const Bing = (L.TileLayer as any).extend({
        getTileUrl: function(coords: any) {
          const sub = Math.floor(Math.random() * 4);
          const qk = tileXYToQuadKey(coords.x, coords.y, coords.z);
          return `https://ecn.t${sub}.tiles.virtualearth.net/tiles/a${qk}.jpeg?g=1&key=${apiKey}`;
        }
      });
      return new Bing(undefined, { attribution: '© Bing', crossOrigin: true });
    };

    const lib = {
      esri: { name: 'Esri', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', options: { attribution: '&copy; Esri WorldImagery', crossOrigin: true } },
      esriAlt: { name: 'EsriAlt', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', options: { attribution: '&copy; Esri WorldImagery', crossOrigin: true } },
      osm: { name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options: { attribution: '&copy; OSM', crossOrigin: true } },
      mapbox: mapboxUrl ? { name: 'Mapbox', url: mapboxUrl, options: { tileSize: 512, zoomOffset: -1, attribution: '&copy; Mapbox', crossOrigin: true } } : null,
      custom: customUrl ? { name: 'Custom', url: customUrl, options: { crossOrigin: true } } : null,
      bing: preferred?.key ? { name: 'Bing', factory: () => createBingLayer(preferred.key), options: { attribution: '© Bing' } } : null,
    } as any;

    const order = [preferred?.type, 'esri', 'esriAlt', 'osm', 'mapbox', 'bing', 'custom'].filter(Boolean) as string[];
    for (const key of order) {
      const p = lib[key];
      if (p && !providers.find(x => x.name === p.name)) providers.push(p);
    }

    let idx = 0;
    let activeLayer: any = null;
    let loaded = false;
    let errorCount = 0;
    const maxErrorsBeforeSwitch = 6;

    const attachProvider = () => {
      const p = providers[idx];
      if (!p) { resolve(); return; }
      try { if (activeLayer) mapRefInst.current.removeLayer(activeLayer); } catch {}
      activeLayer = (p as any).factory ? (p as any).factory() : L.tileLayer(p.url, p.options);

      const onLoad = () => {
        loaded = true;
        cleanup();
        imageryLayerRefObj.current = activeLayer;
        ensureMapSize(mapRefInst);
        try { onLoaded && onLoaded({ name: p.name, attribution: p.options?.attribution }); } catch {}
        resolve();
      };
      const onTileError = () => {
        errorCount++;
        // If many tile errors quickly, switch provider
        if (!loaded && errorCount >= maxErrorsBeforeSwitch) {
          switchProvider();
        }
      };
      const onTimeout = setTimeout(() => {
        if (!loaded) switchProvider();
      }, 2500);

      const cleanup = () => {
        activeLayer.off('load', onLoad);
        activeLayer.off('tileerror', onTileError);
        clearTimeout(onTimeout as any);
      };

      activeLayer.on('load', onLoad);
      activeLayer.on('tileerror', onTileError);
      imageryLayerRefObj.current = activeLayer.addTo(mapRefInst.current);
    };

    const switchProvider = () => {
      try { if (activeLayer) mapRefInst.current.removeLayer(activeLayer); } catch {}
      idx++;
      errorCount = 0;
      attachProvider();
    };

    attachProvider();
  });
}

export default SatelliteFieldView;
