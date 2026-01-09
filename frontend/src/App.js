import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { MessageSquare, Star, Zap, Shield, Copy, Check, LogOut, Menu, X, ChevronRight, Sparkles, Globe, Mail, Send, HelpCircle, Settings, Building, Save, Chrome, Download } from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, businessName) => {
    const res = await api.post('/auth/register', { email, password, businessName });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <MessageSquare size={24} />
          ReviewResponder
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <Link to="/pricing" className="navbar-link">Upgrade</Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing" className="navbar-link">Pricing</Link>
              <Link to="/support" className="navbar-link">Support</Link>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Landing Page
const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Respond to Reviews<br />in Seconds, Not Hours
          </h1>
          <p className="hero-subtitle">
            AI-powered review responses for busy business owners. Generate professional,
            personalized replies to Google, Yelp, and other platform reviews instantly.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
              <Sparkles size={20} />
              Start Free Trial
            </Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg">
              View Pricing
            </Link>
          </div>
          <p style={{ marginTop: '16px', color: 'var(--gray-500)', fontSize: '14px' }}>
            5 free responses included. No credit card required.
          </p>
        </div>
      </section>

      <section className="container">
        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon">
              <Zap size={28} />
            </div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-description">
              Generate professional review responses in under 10 seconds.
              Save hours every week on reputation management.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">
              <Star size={28} />
            </div>
            <h3 className="feature-title">Tone Perfect</h3>
            <p className="feature-description">
              Choose from professional, friendly, formal, or apologetic tones.
              Every response matches your brand voice.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">
              <Shield size={28} />
            </div>
            <h3 className="feature-title">Review Smart</h3>
            <p className="feature-description">
              Handles positive 5-star reviews and negative 1-star complaints equally well.
              Turn unhappy customers into loyal fans.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon">
              <Globe size={28} />
            </div>
            <h3 className="feature-title">50+ Languages</h3>
            <p className="feature-description">
              Respond to reviews in any language. German, Spanish, French, Chinese, Arabic -
              our AI detects and responds in the customer's language automatically.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: '60px', marginBottom: '60px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'linear-gradient(135deg, var(--primary-50), var(--gray-50))' }}>
          <Globe size={48} style={{ color: 'var(--primary-600)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
            Works in Any Language
          </h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto 24px' }}>
            Got a review in German? Spanish? Japanese? Our AI automatically detects the language
            and generates a native-quality response. No translation needed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {['Deutsch', 'Español', 'Français', '中文', '日本語', 'Italiano', 'Português', 'Nederlands', 'العربية', 'Polski'].map(lang => (
              <span key={lang} style={{
                background: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ marginBottom: '60px' }}>
        <div className="card" style={{ padding: '40px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Chrome size={32} />
                <span style={{ background: '#4285f4', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>NEW</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
                Chrome Extension Available
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.6' }}>
                Respond to Google Reviews without leaving the page. Our Chrome extension adds a "Generate Response"
                button directly to each review. One click generates a professional response.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="https://github.com/berschlend/review-responder/archive/refs/heads/main.zip"
                  className="btn"
                  style={{ background: 'white', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18} />
                  Download Extension
                </a>
                <Link to="/register" className="btn" style={{ background: 'transparent', border: '2px solid white', color: 'white' }}>
                  Create Free Account First
                </Link>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}>
                After download: Unzip, open chrome://extensions, enable Developer Mode, click "Load unpacked", select the chrome-extension folder
              </p>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                <div style={{ color: '#333', fontSize: '14px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1a1a2e' }}>How it works:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</span>
                    <span>Install extension</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>2</span>
                    <span>Login with your account</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</span>
                    <span>Click button on any review</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}><Check size={12} /></span>
                    <span>Copy & paste response</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="pricing-header">
            <h2 className="pricing-title">Simple, Transparent Pricing</h2>
            <p style={{ color: 'var(--gray-600)' }}>Start free, upgrade when you need more</p>
          </div>
          <PricingCards />
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div>
              <div className="footer-brand">ReviewResponder</div>
              <p className="footer-description">
                AI-powered review response generator helping small businesses
                maintain their online reputation effortlessly.
              </p>
            </div>
            <div>
              <div className="footer-title">Product</div>
              <ul className="footer-links">
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/register">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-title">Support</div>
              <ul className="footer-links">
                <li><Link to="/support">Help Center</Link></li>
                <li><a href="mailto:berend.mainz@web.de">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} ReviewResponder. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Pricing Cards Component
const PricingCards = ({ showFree = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/register');
      return;
    }

    try {
      const res = await api.post('/billing/create-checkout', { plan });
      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const plans = [
    {
      name: 'Free',
      price: 0,
      responses: 5,
      features: ['5 responses per month', 'All tone options', '50+ languages', 'Copy to clipboard'],
      buttonText: 'Get Started',
      plan: 'free'
    },
    {
      name: 'Starter',
      price: 29,
      responses: 100,
      features: ['100 responses per month', 'All tone options', '50+ languages', 'Priority generation', 'Email support'],
      buttonText: 'Subscribe',
      plan: 'starter'
    },
    {
      name: 'Professional',
      price: 49,
      responses: 300,
      features: ['300 responses per month', 'All tone options', '50+ languages', 'Priority generation', 'Priority support'],
      buttonText: 'Subscribe',
      plan: 'professional',
      popular: true
    },
    {
      name: 'Unlimited',
      price: 99,
      responses: 'Unlimited',
      features: ['Unlimited responses', 'All tone options', '50+ languages', 'Fastest generation', 'Dedicated support'],
      buttonText: 'Subscribe',
      plan: 'unlimited'
    }
  ];

  const displayPlans = showFree ? plans : plans.filter(p => p.plan !== 'free');

  return (
    <div className="pricing-grid">
      {displayPlans.map((plan) => (
        <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
          {plan.popular && <span className="pricing-badge">Most Popular</span>}
          <h3 className="pricing-plan">{plan.name}</h3>
          <div className="pricing-price">
            €{plan.price}<span>/mo</span>
          </div>
          <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>
            {typeof plan.responses === 'number' ? `${plan.responses} responses` : plan.responses}
          </p>
          <ul className="pricing-features">
            {plan.features.map((feature, i) => (
              <li key={i}>
                <Check size={16} />
                {feature}
              </li>
            ))}
          </ul>
          {plan.plan === 'free' ? (
            <Link to="/register" className="btn btn-secondary" style={{ width: '100%' }}>
              {plan.buttonText}
            </Link>
          ) : (
            <button
              onClick={() => handleSubscribe(plan.plan)}
              className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              {plan.buttonText}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, businessName);
      toast.success('Account created! You have 5 free responses.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start generating review responses for free</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              type="text"
              className="form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [platform, setPlatform] = useState('google');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchHistory();

    // Check for success param from Stripe
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      toast.success('Subscription activated! Thank you for subscribing.');
      // Refresh user data
      api.get('/auth/me').then(res => updateUser(res.data.user));
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/responses/history?limit=10');
      setHistory(res.data.responses);
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  const generateResponse = async () => {
    if (!reviewText.trim()) {
      toast.error('Please enter a review to respond to');
      return;
    }

    setGenerating(true);
    setResponse('');

    try {
      const res = await api.post('/responses/generate', {
        reviewText,
        reviewRating: rating || null,
        platform,
        tone,
        businessName: user.businessName
      });

      setResponse(res.data.response);
      updateUser({
        responsesUsed: res.data.responsesUsed,
        responsesLimit: res.data.responsesLimit
      });
      fetchHistory();
      toast.success('Response generated!');
    } catch (error) {
      if (error.response?.data?.upgrade) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to generate response');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePercent = user ? (user.responsesUsed / user.responsesLimit) * 100 : 0;

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, {user?.businessName || 'there'}!</h1>
          <p style={{ color: 'var(--gray-500)' }}>Generate professional review responses</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/settings" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <Settings size={16} />
            Settings
          </Link>
          <span className={`badge ${user?.plan === 'free' ? 'badge-warning' : 'badge-success'}`}>
            {user?.plan?.toUpperCase()} Plan
          </span>
          {user?.plan === 'free' && (
            <Link to="/pricing" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {!user?.businessContext && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-50), var(--gray-50))', border: '1px solid var(--primary-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building size={24} style={{ color: 'var(--primary-600)' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Improve Your Responses</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                Add information about your business to get more personalized AI responses.
              </p>
            </div>
            <Link to="/settings" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              Set Up Now
            </Link>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Responses Used</div>
          <div className="stat-value primary">{user?.responsesUsed || 0}</div>
          <div className="usage-bar">
            <div
              className={`usage-fill ${usagePercent > 80 ? 'warning' : ''} ${usagePercent >= 100 ? 'danger' : ''}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="mt-1" style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {user?.responsesLimit - user?.responsesUsed} remaining this month
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-label">Monthly Limit</div>
          <div className="stat-value">{user?.responsesLimit || 5}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Generated</div>
          <div className="stat-value">{stats?.stats?.totalResponses || 0}</div>
        </div>
      </div>

      <div className="generator-section">
        <div className="card">
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Paste Your Review
          </h2>

          <div className="form-group">
            <label className="form-label">Customer Review</label>
            <textarea
              className="form-textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Paste the customer review here..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Star Rating (optional)</label>
            <div className="rating-select">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`rating-star ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(rating === star ? 0 : star)}
                >
                  <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select
                className="form-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="google">Google Reviews</option>
                <option value="yelp">Yelp</option>
                <option value="facebook">Facebook</option>
                <option value="tripadvisor">TripAdvisor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Response Tone</label>
              <select
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="apologetic">Apologetic</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={generateResponse}
            disabled={generating || !reviewText.trim()}
            style={{ width: '100%' }}
          >
            {generating ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Response
              </>
            )}
          </button>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Generated Response
          </h2>

          <div className="response-output">
            {response || 'Your AI-generated response will appear here...'}
          </div>

          {response && (
            <div className="response-actions">
              <button className="btn btn-success" onClick={copyToClipboard}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Response'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResponse('');
                  setReviewText('');
                  setRating(0);
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card mt-4">
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Recent Responses
          </h2>

          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-review">
                <strong>Review:</strong> {item.review_text.substring(0, 150)}
                {item.review_text.length > 150 && '...'}
              </div>
              <div className="history-response">
                <strong>Response:</strong> {item.generated_response}
              </div>
              <div className="history-meta">
                {item.review_rating && <span>{item.review_rating} stars</span>}
                <span>{item.review_platform}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [businessContext, setBusinessContext] = useState(user?.businessContext || '');
  const [responseStyle, setResponseStyle] = useState(user?.responseStyle || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || '');
      setBusinessType(user.businessType || '');
      setBusinessContext(user.businessContext || '');
      setResponseStyle(user.responseStyle || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put('/auth/profile', {
        businessName,
        businessType,
        businessContext,
        responseStyle
      });
      updateUser(res.data.user);
      toast.success('Settings saved! Your responses will now be more personalized.');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const businessTypes = [
    'Restaurant',
    'Cafe / Coffee Shop',
    'Hotel / Accommodation',
    'Bar / Nightclub',
    'Spa / Wellness',
    'Hair Salon / Barbershop',
    'Dental Practice',
    'Medical Practice',
    'Auto Repair / Service',
    'Gym / Fitness Studio',
    'Retail Store',
    'E-commerce',
    'Professional Services',
    'Real Estate',
    'Home Services',
    'Other'
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          <Settings size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Business Settings
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Add details about your business to get more personalized AI responses
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} />
            Basic Information
          </h2>

          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              type="text"
              className="form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Mario's Italian Restaurant"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Type</label>
            <select
              className="form-select"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              <option value="">Select your business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Business Context
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
            Tell us about your business so AI can mention specific details in responses
          </p>

          <div className="form-group">
            <label className="form-label">About Your Business</label>
            <textarea
              className="form-textarea"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder={`Examples:
• We're a family-owned Italian restaurant since 1985
• Our signature dishes are homemade pasta and wood-fired pizza
• Our chef Marco trained in Naples
• We have a cozy outdoor terrace
• We're known for our Sunday brunch specials
• Our manager Sarah handles customer service`}
              rows={8}
            />
            <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '8px' }}>
              The more details you provide, the more personalized your responses will be
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            Response Style Preferences
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
            Any specific instructions for how you want responses written
          </p>

          <div className="form-group">
            <label className="form-label">Style Instructions (optional)</label>
            <textarea
              className="form-textarea"
              value={responseStyle}
              onChange={(e) => setResponseStyle(e.target.value)}
              placeholder={`Examples:
• Always sign off with "The [Business Name] Team"
• Use casual language, we're a beach bar
• Never offer discounts or compensation
• Always invite them to contact us directly at (555) 123-4567
• Keep responses short, max 3 sentences`}
              rows={5}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Saving...' : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// Support Page
const SupportPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await api.post('/support/contact', { name, email, subject, message });
      setSent(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch (error) {
      toast.error('Failed to send message. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    {
      q: 'How many languages are supported?',
      a: 'Our AI supports over 50 languages including German, Spanish, French, Chinese, Japanese, Arabic, and many more. It automatically detects the review language and responds accordingly.'
    },
    {
      q: 'How does the free trial work?',
      a: 'You get 5 free response generations when you sign up. No credit card required. Use them to test the quality of our AI responses.'
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes! You can cancel your subscription at any time from your dashboard. No questions asked, no hidden fees.'
    },
    {
      q: 'How fast are the responses generated?',
      a: 'Most responses are generated in under 10 seconds. Professional and Unlimited plans get priority processing for even faster results.'
    },
    {
      q: 'Do you store my review data?',
      a: 'We store your response history so you can access it later. We never share your data with third parties and you can delete your data anytime.'
    },
    {
      q: 'Which platforms are supported?',
      a: 'Our responses work for Google Reviews, Yelp, TripAdvisor, Facebook, and any other review platform. Just paste the review and we generate the perfect response.'
    }
  ];

  if (sent) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <Check size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
          <h1 className="auth-title">Message Sent!</h1>
          <p className="auth-subtitle">We'll get back to you within 24 hours.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
          How can we help?
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Check our FAQ or send us a message
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} />
            Frequently Asked Questions
          </h2>

          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-800)' }}>
                {faq.q}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} />
            Contact Us
          </h2>

          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Question</option>
                  <option value="billing">Billing & Subscription</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feedback">Feedback & Suggestions</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={5}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={sending}>
                {sending ? 'Sending...' : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                Or email us directly at<br />
                <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)', fontWeight: '500' }}>
                  berend.mainz@web.de
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pricing Page
const PricingPage = () => {
  const { user } = useAuth();

  const openBillingPortal = async () => {
    try {
      const res = await api.post('/billing/portal');
      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };

  return (
    <div className="pricing-section">
      <div className="container">
        <div className="pricing-header">
          <h1 className="pricing-title">Choose Your Plan</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Scale your review response workflow with the right plan for your business
          </p>
        </div>

        <PricingCards />

        {user && user.plan !== 'free' && (
          <div className="text-center mt-4">
            <button onClick={openBillingPortal} className="btn btn-secondary">
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
