import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://kisangpt-backendddddddd-production.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('🚀 API Base URL:', API_BASE_URL);
      console.log('🚀 Login request:', credentials);
      const response = await api.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      
      if (response.data.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get stored user data
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },
};

// General API calls
export const generalAPI = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Backend not reachable' };
    }
  },

  // Get all users (admin)
  getUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
};

// Google OAuth helper
export const googleAuthAPI = {
  // Redirect to Google OAuth
  redirectToGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Handle OAuth callback (called when redirected back from Google)
  handleCallback: (urlParams) => {
    const token = urlParams.get('token');
    const success = urlParams.get('success');
    
    if (token && success === 'oauth_login') {
      localStorage.setItem('authToken', token);
      
      // Get user data after OAuth login
      return authAPI.getCurrentUser()
        .then(userData => {
          if (userData.success) {
            localStorage.setItem('user', JSON.stringify(userData.user));
            return { success: true, user: userData.user };
          }
          throw new Error('Failed to get user data');
        });
    }
    
    const error = urlParams.get('error');
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    return Promise.resolve({ success: false });
  },
};

// Export the main axios instance for custom calls
export default api;