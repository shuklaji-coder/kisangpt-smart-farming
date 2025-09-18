import React, { useState, useEffect } from 'react';
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
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [newPostDialog, setNewPostDialog] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Mock data for demo - in production, these would be API calls
      setFarmers([
        {
          id: '1',
          name: 'राहुल शर्मा',
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
          name: 'प्रिया पटेल',
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
          name: 'अमित कुमार',
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
          name: 'सुनीता देवी',
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
          author: 'राहुल शर्मा',
          content: 'मेरे गेहूं के पौधों में कुछ पीले धब्बे दिख रहे हैं। क्या यह कोई बीमारी है? कोई सलाह दे सकता है?',
          type: 'question',
          timestamp: '2 hours ago',
          likes: 12,
          comments: 8,
          tags: ['wheat', 'disease', 'help'],
          location: 'Delhi'
        },
        {
          id: '2',
          author: 'प्रिया पटेल',
          content: 'आज बाज़ार में कपास का भाव ₹5,200 प्रति क्विंटल है। अच्छा समय है बेचने का!',
          type: 'announcement',
          timestamp: '4 hours ago',
          likes: 25,
          comments: 3,
          tags: ['cotton', 'price', 'market'],
          location: 'Gujarat'
        },
        {
          id: '3',
          author: 'अमित कुमार',
          content: 'जैविक खाद बनाने का आसान तरीका: गोबर + नीम की पत्ती + हल्दी। 30 दिन में तैयार!',
          type: 'tip',
          timestamp: '1 day ago',
          likes: 45,
          comments: 15,
          tags: ['organic', 'fertilizer', 'tip'],
          location: 'Punjab'
        },
        {
          id: '4',
          author: 'सुनीता देवी',
          content: 'क्या कोई ड्रिप इरिगेशन सिस्टम के बारे में बता सकता है? मैं अपने खेत में लगवाना चाहती हूं।',
          type: 'help',
          timestamp: '2 days ago',
          likes: 18,
          comments: 22,
          tags: ['irrigation', 'water', 'help'],
          location: 'Haryana'
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
            👥 {(t as any)('community.title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {(t as any)('community.subtitle')}
          </Typography>
        </Paper>
      </motion.div>

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
                          {post.location} • {post.timestamp}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {post.content}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          {post.tags.map((tag) => (
                            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            startIcon={<ThumbUp />}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                          >
                            {post.likes}
                          </Button>
                          <Button
                            startIcon={<Comment />}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                          >
                            {post.comments}
                          </Button>
                          <Button
                            startIcon={<Share />}
                            size="small"
                            sx={{ color: 'text.secondary' }}
                          >
                            Share
                          </Button>
                        </Box>
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
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {farmer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      {farmer.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      🌾 {farmer.crops.join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {farmer.experience} years • ⭐ {farmer.rating}
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
        {/* Discussion */}
        <Card elevation={2} sx={{ borderRadius: 3, minHeight: 400 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Chat sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Group Discussion
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>
              Real-time chat feature coming soon!
              <br />Join discussions with farmers in your area.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setNewPostDialog(true)}
      >
        <Add />
      </Fab>

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
                sx={{ borderRadius: 3 }}
                color="success"
              >
                Call
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
    </Box>
  );
};

export default CommunityNetwork;
