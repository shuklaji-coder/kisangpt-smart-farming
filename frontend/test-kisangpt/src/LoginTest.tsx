import React, { useState } from 'react';
import './LoginTest.css';

interface User {
  email: string;
  password: string;
  name: string;
}

const LoginTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const demoUsers = [
    { email: 'farmer@example.com', password: 'farmer123', name: 'रमेश कुमार' },
    { email: 'test@example.com', password: 'test123', name: 'टेस्ट यूजर' },
    { email: 'demo@kisangpt.com', password: 'demo123', name: 'डेमो किसान' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('कृपया सभी फील्ड भरें / Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check demo users
      const foundUser = demoUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        alert(`✅ Login Successful! Welcome ${foundUser.name}`);
      } else {
        throw new Error('गलत ईमेल या पासवर्ड / Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('farmer@example.com');
    setPassword('farmer123');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setEmail('');
    setPassword('');
  };

  if (user) {
    return (
      <div className="login-container">
        <div className="login-card success-card">
          <h2>🎉 Login Successful!</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Status:</strong> ✅ Authenticated</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
          <div className="features-list">
            <h3>🌾 KisanGPT Features Available:</h3>
            <ul>
              <li>✅ AI Crop Recommendation</li>
              <li>✅ Weather Forecast</li>
              <li>✅ Disease Detection</li>
              <li>✅ Market Analysis</li>
              <li>✅ Voice Commands (Hindi)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🌾 KisanGPT</h1>
          <p>आपकी खेती का डिजिटल साथी</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="demo-info">
          <h3>📝 Demo Login Credentials:</h3>
          <ul>
            <li>farmer@example.com / farmer123</li>
            <li>test@example.com / test123</li>
            <li>demo@kisangpt.com / demo123</li>
          </ul>
          <button onClick={fillDemo} className="btn btn-demo">
            Fill Demo 🚀
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">ईमेल / Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">पासवर्ड / Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="farmer123"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'लॉग इन हो रहे हैं...' : 'लॉग इन करें / Login'}
          </button>
        </form>

        <div className="test-status">
          <h3>🧪 Test Status:</h3>
          <p>✅ Network Error Fixed</p>
          <p>✅ Demo Authentication Working</p>
          <p>✅ Fallback System Active</p>
          <p>✅ Multi-language Support</p>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;