import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { MessageSquare, Star, Zap, Shield, Copy, Check, LogOut, Menu, X, ChevronRight, Sparkles } from 'lucide-react';
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
                <li><a href="mailto:support@reviewresponder.com">Contact</a></li>
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
      features: ['5 responses per month', 'All tone options', 'Copy to clipboard', 'Response history'],
      buttonText: 'Get Started',
      plan: 'free'
    },
    {
      name: 'Starter',
      price: 29,
      responses: 100,
      features: ['100 responses per month', 'All tone options', 'Priority generation', 'Response history', 'Email support'],
      buttonText: 'Subscribe',
      plan: 'starter'
    },
    {
      name: 'Professional',
      price: 49,
      responses: 300,
      features: ['300 responses per month', 'All tone options', 'Priority generation', 'Response history', 'Priority support'],
      buttonText: 'Subscribe',
      plan: 'professional',
      popular: true
    },
    {
      name: 'Unlimited',
      price: 99,
      responses: 'Unlimited',
      features: ['Unlimited responses', 'All tone options', 'Fastest generation', 'Full history', 'Dedicated support'],
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
            ${plan.price}<span>/mo</span>
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
