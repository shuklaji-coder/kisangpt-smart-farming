const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User, syncDatabase } = require('./database');

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

// Google OAuth Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ where: { googleId: profile.id } });
    
    if (existingUser) {
      existingUser.lastLogin = new Date();
      await existingUser.save();
      return done(null, existingUser);
    }
    
    // Check if user exists with same email
    existingUser = await User.findOne({ where: { email: profile.emails[0].value } });
    
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
    const newUser = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      profilePicture: profile.photos[0]?.value || '',
      authProvider: 'google',
      isVerified: true,
      lastLogin: new Date()
    });
    
    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// JWT Token Generation
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
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
    const user = await User.findByPk(decoded.id);
    
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

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌾 KisanGPT Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'SQLite'
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
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'यह ईमेल पहले से पंजीकृत है / This email is already registered'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      location: location || '',
      farmSize: farmSize || '',
      cropType: cropType || '',
      authProvider: 'local'
    });
    
    // Generate token
    const token = generateToken(newUser);
    
    // Remove password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password;
    
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
    const user = await User.findOne({ where: { email } });
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
    const userResponse = user.toJSON();
    delete userResponse.password;
    
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
  const userResponse = req.user.toJSON();
  delete userResponse.password;
  
  res.json({
    success: true,
    user: userResponse
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
    
    const user = await User.findByPk(req.user.id);
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
    
    const userResponse = user.toJSON();
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

// Get All Users (Admin only - for development)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      limit: 50
    });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'कुछ गलत हुआ / Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialize database and start server
const startServer = async () => {
  const dbConnected = await syncDatabase();
  
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log('\n🚀 =================================');
    console.log('🌾 KisanGPT Backend Server Started!');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log('🔐 Authentication endpoints ready');
    console.log('📱 Google OAuth configured');
    console.log('💾 SQLite Database Connected');
    console.log('================================= 🚀\n');
  });
};

startServer();

module.exports = app;