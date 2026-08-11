import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  useTheme,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Badge,
  IconButton,
  Fab,
} from '@mui/material';
import {
  Group,
  LocationOn,
  Agriculture,
  Phone,
  Message,
  Add,
  Forum,
  Help,
  Share,
  ThumbUp,
  Comment,
  Visibility,
  People,
  Chat,
  Announcement,
  QuestionAnswer,
  LocalFlorist,
  Handshake,
  Star,
  StarBorder,
  Verified,
  Send,
  EmojiEmotions,
  Favorite,
  BookmarkAdd,
  Call,
  CloudQueue,
  AttachMoney,
  LocalShipping,
  Event,
  HowToVote,
  Save,
  Videocam,
  PhotoCamera,
  Image,
  CloudUpload,
  VideoCall,
  Mic,
  CallEnd,
  ScreenShare,
  FiberManualRecord,
  SignalWifi4Bar,
  Circle,
  Close,
  Person,
  Schedule
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';

interface FarmerProfile {
  id: string;
  name: string;
  location: string;
  crops: string[];
  experience: number;
  rating: number;
  phone: string;
  specialization: string;
  isOnline: boolean;
  avatar?: string;
}

interface CommunityPost {
  id: string;
  author: string;
  content: string;
  type: 'question' | 'tip' | 'announcement' | 'help';
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
  location: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`community-tabpanel-${index}`}
      aria-labelledby={`community-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const CommunityNetwork: React.FC = () => {
  const { t } = (useTranslation as any)();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [votedPoll, setVotedPoll] = useState<string | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState('');
  const [pollResults, setPollResults] = useState({
    'à¤§à¤¾à¤¨': 45,
    'à¤—à¥‡à¤¹à¥‚à¤‚': 32,
    'à¤®à¤•à¥à¤•à¤¾': 28,
    'à¤•à¤ªà¤¾à¤¸': 15
  });
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showPhotoShare, setShowPhotoShare] = useState(false);
  const [activeVideoCall, setActiveVideoCall] = useState<string | null>(null);
  const [sharedPhotos, setSharedPhotos] = useState<any[]>([]);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<FarmerProfile | null>(null);
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([]);

  // Mentors (top rated) and favorites
  const mentors = useMemo(() => farmers.filter(f => f.rating >= 4.8), [farmers]);
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('fav_farmers') || '[]'); } catch { return []; } });
  const toggleFav = (id: string) => {
    const set = new Set(favorites);
    set.has(id) ? set.delete(id) : set.add(id);
    const arr = Array.from(set);
    setFavorites(arr);
    try { localStorage.setItem('fav_farmers', JSON.stringify(arr)); } catch {}
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Mock data for demo - in production, these would be API calls
      setFarmers([
        {
          id: '1',
          name: 'à¤°à¤¾à¤¹à¥à¤² à¤¶à¤°à¥à¤®à¤¾',
          location: 'Delhi, India',
          crops: ['Wheat', 'Rice', 'Sugarcane'],
          experience: 15,
          rating: 4.8,
          phone: '+91 98765-43210',
          specialization: 'Organic Farming',
          isOnline: true
        },
        {
          id: '2',
          name: 'à¤ªà¥à¤°à¤¿à¤¯à¤¾ à¤ªà¤Ÿà¥‡à¤²',
          location: 'Gujarat, India',
          crops: ['Cotton', 'Groundnut'],
          experience: 8,
          rating: 4.6,
          phone: '+91 98765-43211',
          specialization: 'Crop Rotation Expert',
          isOnline: false
        },
        {
          id: '3',
          name: 'à¤…à¤®à¤¿à¤¤ à¤•à¥à¤®à¤¾à¤°',
          location: 'Punjab, India',
          crops: ['Wheat', 'Mustard'],
          experience: 12,
          rating: 4.9,
          phone: '+91 98765-43212',
          specialization: 'Modern Equipment',
          isOnline: true
        },
        {
          id: '4',
          name: 'à¤¸à¥à¤¨à¥€à¤¤à¤¾ à¤¦à¥‡à¤µà¥€',
          location: 'Haryana, India',
          crops: ['Rice', 'Vegetables'],
          experience: 10,
          rating: 4.7,
          phone: '+91 98765-43213',
          specialization: 'Water Management',
          isOnline: true
        }
      ]);

      setPosts([
        {
          id: '1',
          author: 'à¤°à¤¾à¤¹à¥à¤² à¤¶à¤°à¥à¤®à¤¾',
          content: 'à¤®à¥‡à¤°à¥‡ à¤—à¥‡à¤¹à¥‚à¤‚ à¤•à¥‡ à¤ªà¥Œà¤§à¥‹à¤‚ à¤®à¥‡à¤‚ à¤•à¥à¤› à¤ªà¥€à¤²à¥‡ à¤§à¤¬à¥à¤¬à¥‡ à¤¦à¤¿à¤– à¤°à¤¹à¥‡ à¤¹à¥ˆà¤‚à¥¤ à¤•à¥à¤¯à¤¾ à¤¯à¤¹ à¤•à¥‹à¤ˆ à¤¬à¥€à¤®à¤¾à¤°à¥€ à¤¹à¥ˆ? à¤•à¥‹à¤ˆ à¤¸à¤²à¤¾à¤¹ à¤¦à¥‡ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ?',
          type: 'question',
          timestamp: '2 hours ago',
          likes: 12,
          comments: 8,
          tags: ['wheat', 'disease', 'help'],
          location: 'Delhi'
        },
        {
          id: 'weather-alert',
          author: 'ðŸŒ¦ï¸ Weather Alert System',
          content: 'âš ï¸ à¤­à¤¾à¤°à¥€ à¤¬à¤¾à¤°à¤¿à¤¶ à¤•à¥€ à¤šà¥‡à¤¤à¤¾à¤µà¤¨à¥€! à¤…à¤—à¤²à¥‡ 48 à¤˜à¤‚à¤Ÿà¥‹à¤‚ à¤®à¥‡à¤‚ à¤¦à¤¿à¤²à¥à¤²à¥€-NCR à¤®à¥‡à¤‚ à¤¤à¥‡à¤œ à¤¬à¤¾à¤°à¤¿à¤¶ à¤¸à¤‚à¤­à¤µà¥¤ à¤«à¤¸à¤² à¤•à¥€ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¤à¥à¤°à¤‚à¤¤ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ à¤•à¤°à¥‡à¤‚à¥¤ à¤¡à¥à¤°à¥‡à¤¨à¥‡à¤œ à¤šà¥‡à¤• à¤•à¤°à¥‡à¤‚!',
          type: 'announcement',
          timestamp: '1 hour ago',
          likes: 89,
          comments: 23,
          tags: ['weather', 'alert', 'urgent'],
          location: 'Delhi-NCR'
        },
        {
          id: '2',
          author: 'à¤ªà¥à¤°à¤¿à¤¯à¤¾ à¤ªà¤Ÿà¥‡à¤²',
          content: 'ðŸŽ‰ à¤†à¤œ à¤¬à¤¾à¤œà¤¼à¤¾à¤° à¤®à¥‡à¤‚ à¤•à¤ªà¤¾à¤¸ à¤•à¤¾ à¤­à¤¾à¤µ â‚¹5,200 à¤ªà¥à¤°à¤¤à¤¿ à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤² à¤¹à¥ˆà¥¤ à¤…à¤šà¥à¤›à¤¾ à¤¸à¤®à¤¯ à¤¹à¥ˆ à¤¬à¥‡à¤šà¤¨à¥‡ à¤•à¤¾! à¤®à¥ˆà¤‚à¤¨à¥‡ 50 à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤² à¤¬à¥‡à¤šà¥€ - à¤¶à¤¾à¤¨à¤¦à¤¾à¤° à¤¦à¤¾à¤® à¤®à¤¿à¤²à¤¾!',
          type: 'announcement',
          timestamp: '4 hours ago',
          likes: 25,
          comments: 3,
          tags: ['cotton', 'price', 'market'],
          location: 'Gujarat'
        },
        {
          id: 'success-story',
          author: 'à¤µà¤¿à¤œà¤¯ à¤¸à¤¿à¤‚à¤¹',
          content: 'ðŸ† à¤¸à¤«à¤²à¤¤à¤¾ à¤•à¥€ à¤•à¤¹à¤¾à¤¨à¥€: à¤ªà¤¿à¤›à¤²à¥‡ à¤¸à¤¾à¤² à¤®à¥ˆà¤‚à¤¨à¥‡ à¤œà¥ˆà¤µà¤¿à¤• à¤–à¥‡à¤¤à¥€ à¤¶à¥à¤°à¥‚ à¤•à¥€ à¤¥à¥€à¥¤ à¤†à¤œ à¤®à¥‡à¤°à¥€ à¤†à¤®à¤¦à¤¨à¥€ 40% à¤¬à¤¢à¤¼ à¤—à¤ˆ à¤¹à¥ˆ! à¤•à¤¿à¤¸à¥€ à¤•à¥‹ à¤¸à¤²à¤¾à¤¹ à¤šà¤¾à¤¹à¤¿à¤ à¤¤à¥‹ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚à¥¤ à¤®à¥à¤«à¥à¤¤ à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤•à¤°à¥‚à¤‚à¤—à¤¾à¥¤ ðŸ“ž 98765-11111',
          type: 'tip',
          timestamp: '6 hours ago',
          likes: 156,
          comments: 45,
          tags: ['success', 'organic', 'inspiration'],
          location: 'Rajasthan'
        },
        {
          id: '3',
          author: 'à¤…à¤®à¤¿à¤¤ à¤•à¥à¤®à¤¾à¤°',
          content: 'ðŸ’¡ à¤œà¥ˆà¤µà¤¿à¤• à¤–à¤¾à¤¦ à¤¬à¤¨à¤¾à¤¨à¥‡ à¤•à¤¾ à¤†à¤¸à¤¾à¤¨ à¤¤à¤°à¥€à¤•à¤¾: à¤—à¥‹à¤¬à¤° + à¤¨à¥€à¤® à¤•à¥€ à¤ªà¤¤à¥à¤¤à¥€ + à¤¹à¤²à¥à¤¦à¥€à¥¤ 30 à¤¦à¤¿à¤¨ à¤®à¥‡à¤‚ à¤¤à¥ˆà¤¯à¤¾à¤°! à¤µà¥€à¤¡à¤¿à¤¯à¥‹ à¤Ÿà¥à¤¯à¥‚à¤Ÿà¥‹à¤°à¤¿à¤¯à¤² à¤­à¥‡à¤œ à¤¸à¤•à¤¤à¤¾ à¤¹à¥‚à¤‚à¥¤',
          type: 'tip',
          timestamp: '1 day ago',
          likes: 45,
          comments: 15,
          tags: ['organic', 'fertilizer', 'tip'],
          location: 'Punjab'
        },
        {
          id: 'marketplace',
          author: 'à¤²à¥‹à¤•à¤² à¤«à¤¼à¤¾à¤°à¥à¤® à¤®à¤¾à¤°à¥à¤•à¥‡à¤Ÿ',
          content: 'ðŸ›’ à¤‡à¤¸ à¤¹à¤«à¥à¤¤à¥‡ à¤•à¥‡ à¤¬à¥‡à¤¸à¥à¤Ÿ à¤°à¥‡à¤Ÿà¥à¤¸:\nâ€¢ à¤Ÿà¤®à¤¾à¤Ÿà¤°: â‚¹35/kg\nâ€¢ à¤ªà¥à¤¯à¤¾à¤œ: â‚¹22/kg\nâ€¢ à¤†à¤²à¥‚: â‚¹18/kg\nâ€¢ à¤¹à¤°à¥€ à¤®à¤¿à¤°à¥à¤š: â‚¹45/kg\n\nðŸ“ à¤®à¤‚à¤¡à¥€ à¤®à¥‡à¤‚ à¤¸à¥€à¤§à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚!',
          type: 'announcement',
          timestamp: '1 day ago',
          likes: 67,
          comments: 12,
          tags: ['market', 'prices', 'vegetables'],
          location: 'Local Mandi'
        },
        {
          id: '4',
          author: 'à¤¸à¥à¤¨à¥€à¤¤à¤¾ à¤¦à¥‡à¤µà¥€',
          content: 'â“ à¤•à¥à¤¯à¤¾ à¤•à¥‹à¤ˆ à¤¡à¥à¤°à¤¿à¤ª à¤‡à¤°à¤¿à¤—à¥‡à¤¶à¤¨ à¤¸à¤¿à¤¸à¥à¤Ÿà¤® à¤•à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚ à¤¬à¤¤à¤¾ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ? à¤®à¥ˆà¤‚ à¤…à¤ªà¤¨à¥‡ 5 à¤à¤•à¤¡à¤¼ à¤–à¥‡à¤¤ à¤®à¥‡à¤‚ à¤²à¤—à¤µà¤¾à¤¨à¤¾ à¤šà¤¾à¤¹à¤¤à¥€ à¤¹à¥‚à¤‚à¥¤ à¤¬à¤œà¤Ÿ à¤”à¤° à¤¸à¤¬à¥à¤¸à¤¿à¤¡à¥€ à¤•à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤šà¤¾à¤¹à¤¿à¤à¥¤',
          type: 'help',
          timestamp: '2 days ago',
          likes: 18,
          comments: 22,
          tags: ['irrigation', 'water', 'help', 'subsidy'],
          location: 'Haryana'
        },
        {
          id: 'knowledge-share',
          author: 'à¤¡à¥‰. à¤°à¤®à¥‡à¤¶ à¤•à¥à¤®à¤¾à¤° (à¤•à¥ƒà¤·à¤¿ à¤µà¥ˆà¤œà¥à¤žà¤¾à¤¨à¤¿à¤•)',
          content: 'ðŸ“š à¤®à¥à¤«à¥à¤¤ à¤œà¥à¤žà¤¾à¤¨: à¤‡à¤¸ à¤¸à¥€à¤œà¤¨ à¤®à¥‡à¤‚ à¤«à¤¸à¤² à¤•à¥€ à¤ªà¥ˆà¤¦à¤¾à¤µà¤¾à¤° à¤¬à¤¢à¤¼à¤¾à¤¨à¥‡ à¤•à¥‡ 5 à¤†à¤¸à¤¾à¤¨ à¤¤à¤°à¥€à¤•à¥‡:\n1. à¤¸à¤¹à¥€ à¤¸à¤®à¤¯ à¤ªà¤° à¤¬à¥€à¤œ à¤¬à¥‹à¤¨à¤¾\n2. à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤•à¤°à¤¾à¤¨à¤¾\n3. à¤œà¥ˆà¤µà¤¿à¤• à¤–à¤¾à¤¦ à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤—\n4. à¤¡à¥à¤°à¤¿à¤ª à¤‡à¤°à¤¿à¤—à¥‡à¤¶à¤¨\n5. à¤¨à¤¿à¤¯à¤®à¤¿à¤¤ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€\n\nà¤”à¤° à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤•à¥‡ à¤²à¤¿à¤ comment à¤•à¤°à¥‡à¤‚!',
          type: 'tip',
          timestamp: '3 days ago',
          likes: 234,
          comments: 89,
          tags: ['knowledge', 'expert', 'farming', 'tips'],
          location: 'Agriculture University'
        }
      ]);
    } catch (error) {
      console.error('Error fetching community data:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFarmerClick = (farmer: FarmerProfile) => {
    setSelectedFarmer(farmer);
    setOpenDialog(true);
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'question': return '#2196f3';
      case 'tip': return '#4caf50';
      case 'announcement': return '#ff9800';
      case 'help': return '#f44336';
      default: return '#757575';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <QuestionAnswer />;
      case 'tip': return <LocalFlorist />;
      case 'announcement': return <Announcement />;
      case 'help': return <Help />;
      default: return <Forum />;
    }
  };

  // Interactive functions
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setShowSuccessToast('ðŸ’¬ Message sent to village group!');
      setChatMessage('');
      setTimeout(() => setShowSuccessToast(''), 3000);
    }
  };

  const handleLikePost = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
      setShowSuccessToast('ðŸ’” Like removed');
    } else {
      newLiked.add(postId);
      setShowSuccessToast('ðŸ‘ Post liked!');
    }
    setLikedPosts(newLiked);
    setTimeout(() => setShowSuccessToast(''), 2000);
  };

  const handleSavePost = (postId: string) => {
    const newSaved = new Set(savedPosts);
    if (newSaved.has(postId)) {
      newSaved.delete(postId);
      setShowSuccessToast('ðŸ’¾ Post removed from saved');
    } else {
      newSaved.add(postId);
      setShowSuccessToast('ðŸ’¾ Post saved!');
    }
    setSavedPosts(newSaved);
    setTimeout(() => setShowSuccessToast(''), 2000);
  };

  const handleVotePoll = (option: string) => {
    if (!votedPoll) {
      setVotedPoll(option);
      setPollResults(prev => ({
        ...prev,
        [option]: prev[option] + 1
      }));
      setShowSuccessToast(`ðŸ—³ï¸ Vote cast for ${option}!`);
      setTimeout(() => setShowSuccessToast(''), 2000);
    }
  };

  const handleJoinEvent = (eventTitle: string) => {
    const newJoined = new Set(joinedEvents);
    if (newJoined.has(eventTitle)) {
      newJoined.delete(eventTitle);
      setShowSuccessToast(`âŒ Left event: ${eventTitle}`);
    } else {
      newJoined.add(eventTitle);
      setShowSuccessToast(`ðŸŽ‰ Joined event: ${eventTitle}!`);
    }
    setJoinedEvents(newJoined);
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  const handleCallFarmer = (name: string, phone: string) => {
    setShowSuccessToast(`ðŸ“ž Calling ${name} at ${phone}...`);
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  const handleEmergencyAction = (action: string) => {
    setShowSuccessToast(`âš¡ ${action} initiated! Help is on the way.`);
    setTimeout(() => setShowSuccessToast(''), 4000);
  };

  const handleMarketplaceAction = (action: string) => {
    setShowSuccessToast(`ðŸ›’ ${action} - Connecting you now...`);
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  const handleVideoCall = (farmerName: string) => {
    setActiveVideoCall(farmerName);
    setShowVideoCall(true);
    setShowSuccessToast(`ðŸ“¹ Starting video call with ${farmerName}...`);
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  const handlePhotoShare = (file: File) => {
    const newPhoto = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      timestamp: new Date(),
      author: 'à¤†à¤ª', // You
      description: 'à¤®à¥‡à¤°à¥€ à¤«à¤¸à¤² à¤•à¥€ à¤¤à¤¸à¥à¤µà¥€à¤° à¤¦à¥‡à¤–à¤¿à¤' // See my crop photo
    };
    setSharedPhotos(prev => [newPhoto, ...prev]);
    setShowSuccessToast('ðŸ“· Photo shared with village community!');
    setTimeout(() => setShowSuccessToast(''), 3000);
    setShowPhotoShare(false);
  };

  const handleScheduleCall = (expert: FarmerProfile) => {
    setSelectedExpert(expert);
    setShowScheduleCall(true);
  };

  const confirmScheduleCall = (date: string, time: string, topic: string) => {
    const newCall = {
      id: Date.now().toString(),
      expert: selectedExpert,
      date,
      time,
      topic,
      status: 'scheduled'
    };
    setScheduledCalls(prev => [...prev, newCall]);
    setShowSuccessToast(`ðŸ“… Call scheduled with ${selectedExpert?.name} on ${date} at ${time}!`);
    setTimeout(() => setShowSuccessToast(''), 4000);
    setShowScheduleCall(false);
    setSelectedExpert(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 2,
              minWidth: 300,
              bgcolor: 'success.main',
              color: 'white',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)'
            }}
          >
            <Typography sx={{ fontSize: 20 }}>âœ“</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {showSuccessToast}
            </Typography>
          </Paper>
        </motion.div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 50%, #3f51b5 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Group sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ðŸ‘¥ {(t as any)('community.title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {(t as any)('community.subtitle')}
          </Typography>
        </Paper>
      </motion.div>

      {/* Top Mentors strip */}
      {mentors.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 3, p:2 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
            <Verified color="success" />
            <Typography variant="subtitle1" sx={{ fontWeight:700 }}>Top Mentors in Your Network</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1, overflowX:'auto', pb:1 }}>
            {mentors.map(m => (
              <Chip key={m.id} avatar={<Avatar sx={{ bgcolor:'success.main' }}>{m.name.charAt(0)}</Avatar>} label={`${m.name} â€¢ â­ ${m.rating}`} sx={{ bgcolor:'rgba(76,175,80,0.08)' }} />
            ))}
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }}
        >
          <Tab icon={<Forum />} label="Community Feed" />
          <Tab icon={<People />} label="Local Farmers" />
          <Tab icon={<Chat />} label="Discussion" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Community Feed */}
        <Grid container spacing={3}>
          {posts.map((post, index) => (
            <Grid item xs={12} key={post.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: getPostTypeColor(post.type), mr: 2 }}>
                        {getPostTypeIcon(post.type)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
                            {post.author}
                          </Typography>
                          <Chip
                            label={post.type}
                            size="small"
                            sx={{
                              bgcolor: getPostTypeColor(post.type),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                          {post.location} â€¢ {post.timestamp}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {post.content}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          {post.tags.map((tag) => (
                            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                          ))}
                        </Box>
                        {/* Enhanced Reactions & Actions */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {/* Reaction Emojis */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {['ðŸ‘', 'â¤ï¸', 'ðŸ˜®', 'ðŸ’ª', 'ðŸ”¥'].map((emoji, idx) => (
                              <motion.div
                                key={emoji}
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 0.9 }}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowSuccessToast(`${emoji} Reaction added!`)}
                              >
                                <Paper
                                  elevation={1}
                                  sx={{
                                    p: 0.5,
                                    minWidth: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 50,
                                    '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' },
                                    '&:active': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                  }}
                                >
                                  <Typography sx={{ fontSize: 16 }}>{emoji}</Typography>
                                </Paper>
                              </motion.div>
                            ))}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              startIcon={likedPosts.has(post.id) ? <Favorite /> : <ThumbUp />}
                              size="small"
                              variant={likedPosts.has(post.id) ? "contained" : "outlined"}
                              color={likedPosts.has(post.id) ? "success" : "primary"}
                              onClick={() => handleLikePost(post.id)}
                              sx={{ 
                                borderRadius: 3, 
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                              }}
                            >
                              {post.likes + (likedPosts.has(post.id) ? 1 : 0)} {likedPosts.has(post.id) ? 'Liked' : 'Like'}
                            </Button>
                            <Button
                              startIcon={<Comment />}
                              size="small"
                              variant="outlined"
                              onClick={() => setShowSuccessToast(`ðŸ’¬ Reply to ${post.author} opened!`)}
                              sx={{ 
                                borderRadius: 3, 
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' }
                              }}
                            >
                              {post.comments} Reply
                            </Button>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {post.type === 'question' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<Call />}
                                onClick={() => setShowSuccessToast('ðŸ“ž Expert help called! Someone will contact you soon.')}
                                sx={{ borderRadius: 3, textTransform: 'none' }}
                              >
                                ðŸ“ž Call Help
                              </Button>
                            )}
                            {post.type === 'tip' && (
                              <Button
                                size="small"
                                variant={savedPosts.has(post.id) ? "contained" : "outlined"}
                                color={savedPosts.has(post.id) ? "success" : "info"}
                                startIcon={savedPosts.has(post.id) ? <BookmarkAdd /> : <Save />}
                                onClick={() => handleSavePost(post.id)}
                                sx={{ borderRadius: 3, textTransform: 'none' }}
                              >
                                {savedPosts.has(post.id) ? 'âœ“ Saved' : 'ðŸ’¾ Save Tip'}
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              sx={{ 
                                '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                              }}
                            >
                              <Share fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {/* Quick Action Buttons for specific post types */}
                        {post.id === 'weather-alert' && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(244, 67, 54, 0.05)', borderRadius: 2, border: '1px solid rgba(244, 67, 54, 0.2)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                              âš¡ Quick Actions:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                startIcon={<CloudQueue />}
                                onClick={() => handleEmergencyAction('Weather Forecast Check')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸŒ§ï¸ Check Forecast
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                startIcon={<Call />}
                                onClick={() => handleEmergencyAction('Emergency Helpline Called')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸ“ž Emergency Helpline
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                onClick={() => handleEmergencyAction('Insurance Claim Process')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸ“ Insurance Claim
                              </Button>
                            </Box>
                          </Box>
                        )}
                        
                        {post.id === 'marketplace' && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                              ðŸ›’ Marketplace Actions:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success" 
                                startIcon={<LocationOn />}
                                onClick={() => handleMarketplaceAction('Mandi Visit Scheduled')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸ“ Visit Mandi
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="success" 
                                startIcon={<AttachMoney />}
                                onClick={() => handleMarketplaceAction('Price Alert Activated')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸ’± Get Price Alert
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="success" 
                                startIcon={<LocalShipping />}
                                onClick={() => handleMarketplaceAction('Transport Booking')}
                                sx={{ borderRadius: 2 }}
                              >
                                ðŸšš Book Transport
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Local Farmers */}
        <Grid container spacing={3}>
          {farmers.map((farmer, index) => (
            <Grid item xs={12} sm={6} md={4} key={farmer.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                  onClick={() => handleFarmerClick(farmer)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: theme.palette.primary.main,
                          fontSize: 32,
                        }}
                      >
                        {farmer.name.charAt(0)}
                      </Avatar>
                      {farmer.isOnline && (
                        <Badge
                          color="success"
                          variant="dot"
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            '& .MuiBadge-dot': {
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                            },
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', gap:0.5, mb:1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {farmer.name}
                      </Typography>
                      <IconButton size="small" onClick={(e)=>{ e.stopPropagation(); toggleFav(farmer.id); }}>
                        {favorites.includes(farmer.id) ? <Star color="warning" fontSize="small" /> : <StarBorder fontSize="small" />}
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      {farmer.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ðŸŒ¾ {farmer.crops.join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {farmer.experience} years â€¢ â­ {farmer.rating}
                    </Typography>
                    <Chip
                      label={farmer.specialization}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Enhanced Discussion with Live Features */}
        <Grid container spacing={3}>
          {/* Live Discussion */}
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 3, height: 500 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chat sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                    ðŸŒ¾ Live Village Discussion
                  </Typography>
                  <Chip label="24 Active" color="success" size="small" />
                </Box>
                
                {/* Chat Messages */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 1, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                  {/* Mock live messages */}
                  {[
                    { user: 'à¤°à¤¾à¤® à¤¸à¤¿à¤‚à¤¹', msg: 'à¤•à¤² à¤¬à¤¾à¤°à¤¿à¤¶ à¤•à¤¾ à¤…à¤¨à¥à¤®à¤¾à¤¨ à¤¹à¥ˆ, à¤•à¥à¤¯à¤¾ à¤§à¤¾à¤¨ à¤•à¥€ à¤¬à¥à¤†à¤ˆ à¤•à¤° à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚?', time: '2 min ago', online: true },
                    { user: 'à¤¸à¥€à¤¤à¤¾ à¤¦à¥‡à¤µà¥€', msg: 'à¤¹à¤¾à¤‚ à¤°à¤¾à¤® à¤­à¤¾à¤ˆ, à¤…à¤­à¥€ à¤¬à¥à¤†à¤ˆ à¤•à¤¾ à¤¸à¤¹à¥€ à¤¸à¤®à¤¯ à¤¹à¥ˆà¥¤ à¤®à¥ˆà¤‚à¤¨à¥‡ à¤•à¤² à¤¹à¥€ à¤•à¥€ à¤¹à¥ˆà¥¤', time: '1 min ago', online: true },
                    { user: 'à¤®à¥‹à¤¹à¤¨ à¤•à¥à¤®à¤¾à¤°', msg: 'à¤®à¥‡à¤°à¥‡ à¤ªà¤¾à¤¸ à¤…à¤šà¥à¤›à¥‡ à¤¬à¥€à¤œ à¤¹à¥ˆà¤‚ à¤…à¤—à¤° à¤•à¤¿à¤¸à¥€ à¤•à¥‹ à¤šà¤¾à¤¹à¤¿à¤à¥¤ à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª: 98765-43210', time: '30 sec ago', online: true },
                    { user: 'à¤—à¥€à¤¤à¤¾ à¤¶à¤°à¥à¤®à¤¾', msg: 'ðŸŽ‰ à¤†à¤œ à¤®à¥‡à¤°à¥€ à¤«à¤¸à¤² à¤¬à¥‡à¤šà¥€ - â‚¹45/à¤•à¤¿à¤²à¥‹ à¤®à¤¿à¤²à¤¾ à¤Ÿà¤®à¤¾à¤Ÿà¤° à¤•à¤¾!', time: 'just now', online: true }
                  ].map((chat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <Paper elevation={1} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {chat.user.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                            {chat.user}
                          </Typography>
                          {chat.online && <Badge color="success" variant="dot" />}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {chat.time}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{chat.msg}</Typography>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
                
                {/* Chat Input */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="à¤…à¤ªà¤¨à¤¾ à¤¸à¤µà¤¾à¤² à¤¯à¤¾ à¤¸à¤²à¤¾à¤¹ à¤²à¤¿à¤–à¥‡à¤‚..."
                    variant="outlined"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    startIcon={<Send />}
                    sx={{ 
                      borderRadius: 3, 
                      px: 3,
                      minWidth: 100,
                      '&:disabled': { opacity: 0.5 }
                    }}
                  >
                    Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Side Panel - Polls & Events */}
          <Grid item xs={12} md={4}>
            {/* Live Poll */}
            <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  ðŸ“Š Village Poll
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  "à¤‡à¤¸ à¤¸à¤¾à¤² à¤•à¥Œà¤¨ à¤¸à¥€ à¤«à¤¸à¤² à¤¸à¤¬à¤¸à¥‡ à¤«à¤¾à¤¯à¤¦à¥‡à¤®à¤‚à¤¦ à¤°à¤¹à¥‡à¤—à¥€?"
                </Typography>
                
                {[
                  { crop: 'à¤§à¤¾à¤¨', votes: pollResults['à¤§à¤¾à¤¨'], color: '#4caf50' },
                  { crop: 'à¤—à¥‡à¤¹à¥‚à¤‚', votes: pollResults['à¤—à¥‡à¤¹à¥‚à¤‚'], color: '#2196f3' },
                  { crop: 'à¤®à¤•à¥à¤•à¤¾', votes: pollResults['à¤®à¤•à¥à¤•à¤¾'], color: '#ff9800' },
                  { crop: 'à¤•à¤ªà¤¾à¤¸', votes: pollResults['à¤•à¤ªà¤¾à¤¸'], color: '#9c27b0' }
                ].map((option) => {
                  const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);
                  const percentage = Math.round((option.votes / totalVotes) * 100);
                  const isSelected = votedPoll === option.crop;
                  
                  return (
                    <motion.div 
                      key={option.crop}
                      whileHover={{ scale: votedPoll ? 1 : 1.02 }}
                      whileTap={{ scale: votedPoll ? 1 : 0.98 }}
                    >
                      <Box 
                        sx={{ 
                          mb: 1,
                          cursor: votedPoll ? 'default' : 'pointer',
                          p: 1,
                          borderRadius: 2,
                          border: isSelected ? `2px solid ${option.color}` : '1px solid transparent',
                          bgcolor: isSelected ? `${option.color}15` : 'transparent',
                          '&:hover': {
                            bgcolor: votedPoll ? undefined : `${option.color}10`
                          }
                        }}
                        onClick={() => handleVotePoll(option.crop)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                              {option.crop}
                            </Typography>
                            {isSelected && <Typography sx={{ fontSize: 16 }}>âœ“</Typography>}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {percentage}% ({option.votes})
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            style={{
                              height: '100%',
                              backgroundColor: option.color,
                              borderRadius: 4
                            }}
                          />
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })}
                
                <Button 
                  variant={votedPoll ? "contained" : "outlined"} 
                  size="small" 
                  fullWidth 
                  disabled={!!votedPoll}
                  startIcon={votedPoll ? <HowToVote /> : undefined}
                  sx={{ 
                    mt: 2, 
                    borderRadius: 2,
                    '&:disabled': { opacity: 0.7 }
                  }}
                >
                  {votedPoll ? `âœ“ Voted for ${votedPoll}` : 'ðŸ—³ï¸ Vote Now'}
                </Button>
              </CardContent>
            </Card>
            
            {/* Upcoming Events */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  ðŸ“… Village Events
                </Typography>
                
                {[
                  { title: 'à¤•à¥ƒà¤·à¤¿ à¤®à¥‡à¤²à¤¾', date: 'Tomorrow', time: '10:00 AM', attendees: 45 },
                  { title: 'à¤œà¥ˆà¤µà¤¿à¤• à¤–à¤¾à¤¦ à¤µà¤°à¥à¤•à¤¶à¥‰à¤ª', date: 'Dec 30', time: '2:00 PM', attendees: 23 },
                  { title: 'à¤¸à¤¾à¤®à¥à¤¦à¤¾à¤¯à¤¿à¤• à¤¬à¥€à¤œ à¤¬à¥ˆà¤‚à¤•', date: 'Jan 5', time: '9:00 AM', attendees: 67 }
                ].map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.date} â€¢ {event.time}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          ðŸ‘¥ {event.attendees} interested
                        </Typography>
                        <Button 
                          size="small" 
                          variant={joinedEvents.has(event.title) ? "contained" : "outlined"}
                          color={joinedEvents.has(event.title) ? "success" : "primary"}
                          startIcon={joinedEvents.has(event.title) ? <Event /> : undefined}
                          onClick={() => handleJoinEvent(event.title)}
                          sx={{ borderRadius: 2 }}
                        >
                          {joinedEvents.has(event.title) ? 'âœ“ Joined' : 'Join'}
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Fab
          color="primary"
          onClick={() => setNewPostDialog(true)}
          title="Create New Post"
        >
          <Add />
        </Fab>
        
        <Fab
          color="success"
          onClick={() => setShowPhotoShare(true)}
          title="Share Photo"
          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
        >
          <PhotoCamera />
        </Fab>
        
        <Fab
          color="error"
          onClick={() => setShowVideoCall(true)}
          title="Start Video Call"
          sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
        >
          <Videocam />
        </Fab>
        
        <Fab
          color="secondary"
          onClick={() => {
            setShowVideoCall(true);
            setActiveVideoCall('Group Session');
          }}
          title="Join Group Video Session"
          sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
        >
          <VideoCall />
        </Fab>
      </Box>

      {/* Farmer Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedFarmer && (
          <>
            <DialogTitle sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main,
                  fontSize: 40,
                }}
              >
                {selectedFarmer.name.charAt(0)}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {selectedFarmer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFarmer.specialization}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText primary="Location" secondary={selectedFarmer.location} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Agriculture />
                  </ListItemIcon>
                  <ListItemText primary="Crops" secondary={selectedFarmer.crops.join(', ')} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Visibility />
                  </ListItemIcon>
                  <ListItemText
                    primary="Experience"
                    secondary={`${selectedFarmer.experience} years`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText primary="Phone" secondary={selectedFarmer.phone} />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ borderRadius: 3 }}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<Message />}
                sx={{ borderRadius: 3 }}
              >
                Send Message
              </Button>
              <Button
                variant="contained"
                startIcon={<Phone />}
                onClick={() => handleCallFarmer(selectedFarmer.name, selectedFarmer.phone)}
                sx={{ borderRadius: 3 }}
                color="success"
              >
                Call
              </Button>
              <Button
                variant="contained"
                startIcon={<Videocam />}
                onClick={() => handleVideoCall(selectedFarmer.name)}
                sx={{ borderRadius: 3 }}
                color="error"
              >
                Video Call
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Post Dialog */}
      <Dialog
        open={newPostDialog}
        onClose={() => setNewPostDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Share your knowledge, ask questions, or help fellow farmers..."
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setNewPostDialog(false)} variant="outlined" sx={{ borderRadius: 3 }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ borderRadius: 3 }}>
            Post
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Photo Sharing Dialog */}
      <Dialog open={showPhotoShare} onClose={() => setShowPhotoShare(false)} maxWidth="sm" fullWidth>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera color="success" />
            ðŸ“· Share Crop Photo
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-share-upload"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePhotoShare(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="photo-share-upload">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  component="span"
                  size="large"
                  startIcon={<CloudUpload />}
                  color="success"
                  sx={{ borderRadius: 3, px: 4, py: 2 }}
                >
                  Upload & Share Photo
                </Button>
              </motion.div>
            </label>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Share photos of your crops, equipment, or farming techniques with the village community for advice and discussion.
            </Typography>
            
            {/* Recent Shared Photos */}
            {sharedPhotos.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Recently Shared Photos:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {sharedPhotos.slice(0, 3).map((photo) => (
                    <Card key={photo.id} elevation={2} sx={{ minWidth: 120, borderRadius: 2 }}>
                      <Box
                        component="img"
                        src={photo.url}
                        alt={photo.description}
                        sx={{ width: 120, height: 80, objectFit: 'cover' }}
                      />
                      <CardContent sx={{ p: 1 }}>
                        <Typography variant="caption" display="block" noWrap>
                          {photo.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {photo.timestamp.toLocaleTimeString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setShowPhotoShare(false)}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Dialog>
      
      {/* Enhanced Video Call Dialog */}
      <Dialog 
        open={showVideoCall} 
        onClose={() => setShowVideoCall(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4, 
            maxHeight: '90vh',
            bgcolor: '#000',
            color: 'white'
          } 
        }}
      >
        <Box sx={{ p: 2, bgcolor: '#1a1a1a', borderRadius: '16px 16px 0 0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Videocam sx={{ color: '#4caf50' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                ðŸ“¹ Video Consultation
                {activeVideoCall && ` - ${activeVideoCall}`}
              </Typography>
              {activeVideoCall && (
                <Chip 
                  size="small" 
                  label="ðŸŸ¢ Live" 
                  sx={{ 
                    bgcolor: '#4caf50', 
                    color: 'white',
                    animation: 'pulse 2s infinite'
                  }} 
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Duration: {activeVideoCall ? '00:45' : '00:00'}
              </Typography>
              <IconButton 
                onClick={() => setShowVideoCall(false)}
                sx={{ color: '#f44336' }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', height: 500, bgcolor: '#000' }}>
          {/* Main Video Area */}
          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeVideoCall 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : '#000'
          }}>
            {activeVideoCall ? (
              // Mock Active Call Interface
              <Box sx={{ textAlign: 'center', color: 'white', position: 'relative', width: '100%', height: '100%' }}>
                {activeVideoCall === 'Group Session' ? (
                  // Group Video Call Layout
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: '1fr 1fr',
                    gap: 2,
                    p: 2
                  }}>
                    {/* Group Participants */}
                    {[
                      { name: 'à¤°à¤¾à¤¹à¥à¤² à¤¶à¤°à¥à¤®à¤¾', role: 'Organic Expert', color: '#4caf50' },
                      { name: 'à¤ªà¥à¤°à¤¿à¤¯à¤¾ à¤ªà¤Ÿà¥‡à¤²', role: 'Crop Rotation', color: '#2196f3' },
                      { name: 'à¤…à¤®à¤¿à¤¤ à¤•à¥à¤®à¤¾à¤°', role: 'Equipment', color: '#ff9800' },
                      { name: 'à¤†à¤ª', role: 'Farmer', color: '#9c27b0' }
                    ].map((participant, index) => (
                      <Paper key={index} sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        position: 'relative',
                        border: index === 3 ? '2px solid #9c27b0' : 'none'
                      }}>
                        <Avatar sx={{ width: 60, height: 60, mb: 1, bgcolor: participant.color }}>
                          <Person sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {participant.name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {participant.role}
                        </Typography>
                        {index === 0 && (
                          <Chip 
                            label="Speaking" 
                            size="small" 
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              bgcolor: '#4caf50', 
                              color: 'white',
                              fontSize: '0.7rem'
                            }} 
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  // Single Video Call Layout
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: '#4caf50' }}>
                      <Person sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {activeVideoCall}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Agricultural Expert â€¢ Online
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <Circle sx={{ fontSize: 8, color: '#4caf50' }} />
                      <Typography variant="body2">Good connection</Typography>
                    </Box>
                  </Box>
                )}

                {/* Mock Local Video (Picture-in-Picture) */}
                <Paper sx={{ 
                  position: 'absolute', 
                  top: 20, 
                  right: 20, 
                  width: 150, 
                  height: 100,
                  bgcolor: '#333',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4caf50'
                }}>
                  <Avatar sx={{ bgcolor: '#2196f3' }}>
                    <Person />
                  </Avatar>
                  <Typography variant="caption" sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    left: 5, 
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    px: 1,
                    borderRadius: 1
                  }}>
                    You
                  </Typography>
                </Paper>
              </Box>
            ) : (
              // Call Setup Interface
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Videocam sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                <Typography variant="h5" sx={{ mb: 1 }}>
                  Ready to Start Video Call
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
                  Connect with agricultural experts for live consultation
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                  Powered by WebRTC â€¢ End-to-end encrypted
                </Typography>
              </Box>
            )}
          </Box>

          {/* Enhanced Video Controls */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            gap: 2,
            bgcolor: 'rgba(0,0,0,0.8)',
            borderRadius: 6,
            p: 2
          }}>
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(76,175,80,0.2)', 
                color: '#4caf50',
                '&:hover': { bgcolor: 'rgba(76,175,80,0.3)' },
                width: 50,
                height: 50
              }}
              title="Toggle Camera"
            >
              <Videocam />
            </IconButton>
            
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(33,150,243,0.2)', 
                color: '#2196f3',
                '&:hover': { bgcolor: 'rgba(33,150,243,0.3)' },
                width: 50,
                height: 50
              }}
              title="Toggle Microphone"
            >
              <Mic />
            </IconButton>
            
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(255,152,0,0.2)', 
                color: '#ff9800',
                '&:hover': { bgcolor: 'rgba(255,152,0,0.3)' },
                width: 50,
                height: 50
              }}
              title="Share Screen"
            >
              <ScreenShare />
            </IconButton>
            
            <IconButton 
              sx={{ 
                bgcolor: 'rgba(156,39,176,0.2)', 
                color: '#9c27b0',
                '&:hover': { bgcolor: 'rgba(156,39,176,0.3)' },
                width: 50,
                height: 50
              }}
              title="Start Recording"
            >
              <FiberManualRecord />
            </IconButton>
            
            <IconButton 
              sx={{ 
                bgcolor: '#f44336', 
                color: 'white',
                '&:hover': { bgcolor: '#d32f2f' },
                width: 50,
                height: 50
              }}
              onClick={() => {
                setActiveVideoCall(null);
                setShowVideoCall(false);
                setShowSuccessToast('ðŸ“ž Video call ended');
                setTimeout(() => setShowSuccessToast(''), 2000);
              }}
              title="End Call"
            >
              <CallEnd />
            </IconButton>
          </Box>

          {/* Call Quality Indicator */}
          {activeVideoCall && (
            <Box sx={{ 
              position: 'absolute', 
              top: 20, 
              left: 20,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <SignalWifi4Bar sx={{ color: '#4caf50', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: 'white' }}>
                HD Quality
              </Typography>
            </Box>
          )}
        </Box>
          
        {!activeVideoCall && (
          <Box sx={{ p: 3, bgcolor: '#1a1a1a' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'white' }}>
              ðŸŒŸ Available Agricultural Experts:
            </Typography>
            
            {/* Expert Cards */}
            <Grid container spacing={2}>
              {farmers.filter(f => f.isOnline).map((farmer) => (
                <Grid item xs={12} sm={6} key={farmer.id}>
                  <Card sx={{ 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(76,175,80,0.3)',
                    '&:hover': { 
                      bgcolor: 'rgba(76,175,80,0.1)',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleVideoCall(farmer.name)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#4caf50', width: 50, height: 50 }}>
                          <Person />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {farmer.name}
                            </Typography>
                            <Circle sx={{ fontSize: 8, color: '#4caf50' }} />
                            <Typography variant="caption" sx={{ color: '#4caf50' }}>
                              Online
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                            ðŸŽ¯ {farmer.specialization}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Star sx={{ color: '#ffc107', fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: '#ffc107' }}>
                              {farmer.rating} â­ ({farmer.experience} years exp.)
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>
                            ðŸ“ {farmer.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Videocam />}
                            sx={{ 
                              bgcolor: '#4caf50', 
                              '&:hover': { bgcolor: '#388e3c' },
                              borderRadius: 3
                            }}
                          >
                            Call Now
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Schedule />}
                            sx={{ 
                              borderColor: '#2196f3', 
                              color: '#2196f3',
                              '&:hover': { bgcolor: 'rgba(33,150,243,0.1)' },
                              borderRadius: 3
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleCall(farmer);
                            }}
                          >
                            Schedule
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Quick Expert Categories */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#aaa' }}>
                ðŸ” Quick Categories:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { label: 'ðŸŒ¾ Crop Diseases', experts: 3 },
                  { label: 'ðŸšœ Equipment', experts: 2 },
                  { label: 'ðŸŒ± Organic Farming', experts: 4 },
                  { label: 'ðŸ’§ Irrigation', experts: 2 },
                  { label: 'ðŸŒ¿ Soil Health', experts: 3 }
                ].map((category) => (
                  <Chip
                    key={category.label}
                    label={`${category.label} (${category.experts})`}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)', 
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                  />
                ))}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                ðŸ‘¥ Connect with expert farmers for live consultation
              </Typography>
              <Button onClick={() => setShowVideoCall(false)} sx={{ color: 'white' }}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
        
        {activeVideoCall && (
          <Box sx={{ p: 2, bgcolor: '#1a1a1a', display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => {
                setActiveVideoCall(null);
                setShowVideoCall(false);
                setShowSuccessToast('ðŸ“ž Call ended');
                setTimeout(() => setShowSuccessToast(''), 2000);
              }}
            >
              End Call
            </Button>
          </Box>
        )}
      </Dialog>
      
      {/* Schedule Video Call Dialog */}
      <Dialog 
        open={showScheduleCall} 
        onClose={() => setShowScheduleCall(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Schedule sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ðŸ“… Schedule Video Consultation
          </Typography>
          {selectedExpert && (
            <Typography variant="body2" color="text.secondary">
              with {selectedExpert.name} - {selectedExpert.specialization}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {/* Expert Info */}
          {selectedExpert && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(76,175,80,0.05)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {selectedExpert.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ðŸŽ¯ {selectedExpert.specialization}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: '#ffc107', fontSize: 16 }} />
                    <Typography variant="caption">
                      {selectedExpert.rating} â­ ({selectedExpert.experience} years)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}
          
          {/* Scheduling Form */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Select Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Select Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 1800 // 30 minute intervals
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Consultation Topic"
                placeholder="Describe what you'd like to discuss (e.g., crop disease, fertilizer advice, equipment recommendation)..."
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          
          {/* Available Time Slots */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              âŒš Suggested Time Slots (Today):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map((time) => (
                <Chip
                  key={time}
                  label={time}
                  variant="outlined"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Auto-fill time slot
                  }}
                />
              ))}
            </Box>
          </Box>
          
          {/* Consultation Types */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              ðŸ“ Quick Topics:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'ðŸŒ¾ Crop Disease Diagnosis',
                'ðŸšœ Equipment Selection', 
                'ðŸŒ± Organic Methods',
                'ðŸ’§ Irrigation Planning',
                'ðŸŒ¿ Soil Testing',
                'ðŸ’° Market Strategy'
              ].map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  size="small"
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Auto-fill topic
                  }}
                />
              ))}
            </Box>
          </Box>
          
          {/* Scheduled Calls Preview */}
          {scheduledCalls.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                ðŸ“… Your Upcoming Calls:
              </Typography>
              {scheduledCalls.slice(0, 2).map((call) => (
                <Paper key={call.id} sx={{ p: 2, mb: 1, bgcolor: 'rgba(33,150,243,0.05)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {call.expert.name} - {call.date} at {call.time}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Topic: {call.topic}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowScheduleCall(false)} 
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Schedule />}
            sx={{ borderRadius: 3, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
            onClick={() => {
              // Mock schedule confirmation
              confirmScheduleCall('2024-01-15', '10:00 AM', 'Crop disease consultation');
            }}
          >
            Schedule Call
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityNetwork;
