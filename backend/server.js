const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'kisangpt-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisangpt';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('🌾 KisanGPT Database is ready!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    
    // Fallback to local MongoDB if Atlas connection fails
    if (MONGODB_URI.includes('mongodb.net')) {
      console.log('🔄 Trying local MongoDB...');
      mongoose.connect('mongodb://localhost:27017/kisangpt')
        .then(() => console.log('✅ Connected to Local MongoDB!'))
        .catch((localErr) => {
          console.error('❌ Local MongoDB also failed:', localErr.message);
          console.log('ℹ️  Please install MongoDB locally or provide Atlas connection string');
        });
    }
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  farmSize: {
    type: String,
    trim: true
  },
  cropType: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    language: {
      type: String,
      default: 'hi'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Google OAuth Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      existingUser.lastLogin = new Date();
      await existingUser.save();
      return done(null, existingUser);
    }
    
    // Check if user exists with same email
    existingUser = await User.findOne({ email: profile.emails[0].value });
    
    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = profile.id;
      existingUser.authProvider = 'google';
      existingUser.isVerified = true;
      existingUser.lastLogin = new Date();
      if (!existingUser.profilePicture) {
        existingUser.profilePicture = profile.photos[0]?.value || '';
      }
      await existingUser.save();
      return done(null, existingUser);
    }
    
    // Create new user
    const newUser = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      profilePicture: profile.photos[0]?.value || '',
      authProvider: 'google',
      isVerified: true,
      lastLogin: new Date()
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT Token Generation
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET || 'kisangpt-jwt-secret-2024',
    {
      expiresIn: '7d'
    }
  );
};

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kisangpt-jwt-secret-2024');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// S3 Upload configuration
const { upload: s3Upload, saveUserDataToS3 } = require('./services/s3Service');

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌾 KisanGPT Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      location,
      farmSize,
      cropType
    } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'कृपया सभी आवश्यक फील्ड भरें / Please fill all required fields'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'पासवर्ड मेल नहीं खाते / Passwords do not match'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए / Password must be at least 6 characters'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'यह ईमेल पहले से पंजीकृत है / This email is already registered'
      });
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      phone: phone || '',
      location: location || '',
      farmSize: farmSize || '',
      cropType: cropType || '',
      authProvider: 'local'
    });
    
    await newUser.save();
    
    // Generate token
    const token = generateToken(newUser);
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Save user data to S3 (fire-and-forget)
    saveUserDataToS3(newUser._id.toString(), {
      ...userResponse,
      event: 'registered',
      savedAt: new Date().toISOString()
    }).catch(err => console.error('S3 save error on register:', err));
    
    res.status(201).json({
      success: true,
      message: 'खाता सफलतापूर्वक बनाया गया! / Account created successfully!',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि / Server error'
    });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'कृपया ईमेल और पासवर्ड दोनों भरें / Please provide both email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'गलत ईमेल या पासवर्ड / Invalid email or password'
      });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'गलत ईमेल या पासवर्ड / Invalid email or password'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Save updated user data to S3 on each login (fire-and-forget)
    saveUserDataToS3(user._id.toString(), {
      ...userResponse,
      event: 'login',
      savedAt: new Date().toISOString()
    }).catch(err => console.error('S3 save error on login:', err));
    
    res.json({
      success: true,
      message: 'सफलतापूर्वक लॉग इन! / Login successful!',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि / Server error'
    });
  }
});

// Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user);
      
      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/?token=${token}&success=oauth_login`);
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.redirect('http://localhost:3000/login?error=oauth_callback_failed');
    }
  }
);

// Get Current User
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Update User Profile
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      farmSize,
      cropType,
      preferences
    } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (farmSize !== undefined) user.farmSize = farmSize;
    if (cropType !== undefined) user.cropType = cropType;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'प्रोफ़ाइल अपडेट हो गई / Profile updated successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि / Server error'
    });
  }
});

// Logout Route
app.post('/api/auth/logout', verifyToken, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout error'
      });
    }
    
    res.json({
      success: true,
      message: 'सफलतापूर्वक लॉग आउट / Logout successful'
    });
  });
});

// Rain Alerts Routes
const RainAlert = require('./models/RainAlert');
const weatherService = require('./services/weatherService');
const whatsappService = require('./services/whatsappService');

// Get user's rain alert settings
app.get('/api/rain-alerts/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const rainAlert = await RainAlert.findOne({ userId }).populate('userId', 'name email');

    if (!rainAlert) {
      return res.json({
        success: true,
        message: 'No rain alert settings found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Rain alert settings retrieved successfully',
      data: rainAlert
    });
  } catch (error) {
    console.error('Get rain alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rain alert settings'
    });
  }
});

// Create or update rain alert settings
app.post('/api/rain-alerts/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      whatsappNumber,
      location,
      alertDays = 4,
      rainThreshold = 2.5,
      alertTime = '08:00',
      language = 'both',
      isActive = true
    } = req.body;

    // Validate required fields
    if (!whatsappNumber || !location) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number and location are required'
      });
    }

    // Validate location format
    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location must include latitude and longitude'
      });
    }

    // Check if rain alert settings already exist
    let rainAlert = await RainAlert.findOne({ userId });

    if (rainAlert) {
      // Update existing settings
      rainAlert.whatsappNumber = whatsappNumber;
      rainAlert.location = location;
      rainAlert.alertDays = alertDays;
      rainAlert.rainThreshold = rainThreshold;
      rainAlert.alertTime = alertTime;
      rainAlert.language = language;
      rainAlert.isActive = isActive;
      
      await rainAlert.save();
    } else {
      // Create new settings
      rainAlert = new RainAlert({
        userId,
        whatsappNumber,
        location,
        alertDays,
        rainThreshold,
        alertTime,
        language,
        isActive
      });
      
      await rainAlert.save();
    }

    res.json({
      success: true,
      message: 'Rain alert settings saved successfully',
      data: rainAlert
    });
  } catch (error) {
    console.error('Save rain alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving rain alert settings'
    });
  }
});

// Test WhatsApp connection
app.post('/api/rain-alerts/test-whatsapp', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number is required'
      });
    }

    // Send test message
    const result = await whatsappService.sendTestMessage(whatsappNumber, req.user.name);

    res.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
      data: result
    });
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while testing WhatsApp connection'
    });
  }
});

// Check rain prediction for user's location
app.get('/api/rain-alerts/check-rain', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const rainAlert = await RainAlert.findOne({ userId });
    
    if (!rainAlert) {
      return res.status(404).json({
        success: false,
        message: 'Rain alert settings not found. Please configure your settings first.'
      });
    }

    const { location, alertDays, rainThreshold } = rainAlert;
    
    // Check rain prediction
    const rainPrediction = await weatherService.checkRainPrediction(
      location.latitude,
      location.longitude,
      alertDays,
      rainThreshold
    );

    res.json({
      success: true,
      message: 'Rain prediction check completed',
      data: {
        ...rainPrediction,
        location: location,
        alertSettings: {
          alertDays,
          rainThreshold,
          language: rainAlert.language
        }
      }
    });
  } catch (error) {
    console.error('Check rain prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking rain prediction'
    });
  }
});

// Get All Users (Admin only - for development)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').limit(50);
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि / Server error'
    });
  }
});

// Profile Picture Upload Route
app.post('/api/auth/profile/upload', verifyToken, (req, res, next) => {
  req.uploadFolder = 'profiles';
  next();
}, s3Upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's profile picture URL
    user.profilePicture = req.file.location;
    await user.save();

    res.json({
      success: true,
      message: 'प्रोफ़ाइल चित्र अपडेट हो गई / Profile picture updated successfully',
      imageUrl: req.file.location,
      user: {
        id: user._id,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
});

// Logout Routehandling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'कुछ गलत हुआ / Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


// Start server
app.listen(PORT, () => {
  console.log('\n🚀 =================================');
  console.log('🌾 KisanGPT Backend Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log('🔐 Authentication endpoints ready');
  console.log('📱 Google OAuth configured');
  console.log('================================= 🚀\n');
});

module.exports = app;