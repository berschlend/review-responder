import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { MessageSquare, Star, Zap, Shield, Copy, Check, LogOut, Menu, X, ChevronRight, Sparkles, Globe, Mail, Send, HelpCircle, Settings, Building, Save, Chrome, Download, RefreshCw, Users, Lock, CreditCard, Award, Layers, FileText, Clock, AlertCircle, BookOpen, Trash2, BarChart2, TrendingUp, TrendingDown, PieChart, Key, Eye, EyeOff, ExternalLink, Code, Sun, Moon, Calendar, Filter, Info, ArrowRight, PartyPopper, Utensils, CheckCircle } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Lazy loaded components for code splitting
const LazyApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));

// Loading Spinner for Suspense fallback
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
  </div>
);

// Confetti celebration function
const fireConfetti = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};


// Tooltip Component
const FeatureTooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const positions = { top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }, bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' } };
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div style={{ position: 'absolute', ...positions[position], background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000 }}>{text}</div>}
    </div>
  );
};

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
    // Check for referral code in localStorage
    const referralCode = localStorage.getItem('referralCode');
    const res = await api.post('/auth/register', { email, password, businessName, referralCode });
    localStorage.setItem('token', res.data.token);
    // Clear referral code after successful registration
    if (referralCode) localStorage.removeItem('referralCode');
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

// Theme Context
const ThemeContext = createContext(null);

const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
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
  const { theme, toggleTheme } = useTheme();
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
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
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
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
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

// Exit Intent Popup Component
const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem('exitIntentShown');
    if (popupShown) return;

    const handleMouseLeave = (e) => {
      // Detect when mouse moves to top of viewport (likely going to tabs/address bar)
      if (e.clientY <= 0) {
        setIsVisible(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    // Add event listener after a delay (don't show immediately)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // Wait 5 seconds before activating

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/capture-email', {
        email,
        discountCode: 'SAVE20',
        source: 'exit_intent'
      });
      
      if (response.data.success) {
        setSubmitted(true);
        console.log('✅ Email captured:', email);
      }
    } catch (error) {
      console.error('Failed to capture email:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={() => setIsVisible(false)}>
      <div 
        className="card" 
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--gray-400)',
            zIndex: 1
          }}
        >
          <X size={20} />
        </button>

        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
          padding: '32px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            marginBottom: '16px'
          }}>
            <Sparkles size={32} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Wait! Don't Leave Empty-Handed
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.95 }}>
            Get 20% off your first month of ReviewResponder
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {!submitted ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  🎁 Exclusive Offer: Save 20%
                </div>
                <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                  Enter your email to unlock this limited-time discount
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: '16px', padding: '12px 16px' }}
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '16px', padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get My 20% Discount'}
                </button>
              </form>

              <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--gray-500)',
                marginTop: '16px'
              }}>
                No spam, unsubscribe anytime. Discount valid for 7 days.
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'var(--success-light)',
                borderRadius: '50%',
                marginBottom: '16px'
              }}>
                <Check size={32} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                Discount Code Sent!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                Check your email for your exclusive 20% off code: <strong>SAVE20</strong>
              </p>
              <Link
                to="/register"
                className="btn btn-primary"
                onClick={() => setIsVisible(false)}
              >
                Sign Up Now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Feedback Popup Component (shown after 10 responses)
const FeedbackPopup = ({ isVisible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback', {
        rating,
        comment: comment.trim() || null,
        displayName: displayName.trim() || null
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(() => {
        onClose();
        if (onSubmit) onSubmit();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--gray-400)',
            zIndex: 1
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
          padding: '32px 24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <MessageSquare size={40} style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
            {submitted ? 'Thank You!' : 'How do you like ReviewResponder?'}
          </h2>
          <p style={{ opacity: 0.9, fontSize: '14px' }}>
            {submitted
              ? 'Your feedback helps us improve!'
              : 'You\'ve generated 10+ responses! We\'d love to hear your thoughts.'}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Check size={32} color="white" />
              </div>
              <p style={{ color: 'var(--gray-600)' }}>Your feedback has been submitted!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Star Rating */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                  Rate your experience
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.1s'
                      }}
                    >
                      <Star
                        size={32}
                        fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                        color={(hoverRating || rating) >= star ? '#f59e0b' : '#d1d5db'}
                        style={{ transition: 'all 0.1s' }}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--primary-600)', marginTop: '8px', fontWeight: '500' }}>
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </p>
                )}
              </div>

              {/* Comment (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Tell us more (optional)
                </label>
                <textarea
                  className="form-input"
                  placeholder="What do you like? What could be better?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Display Name (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Your name (optional, for testimonial)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., John from ABC Restaurant"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                />
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                  If approved, your feedback may appear on our website
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || rating === 0}
                style={{ width: '100%', marginTop: '16px' }}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Maybe later
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Landing Page
const LandingPage = () => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/testimonials');
        setTestimonials(res.data.testimonials || []);
      } catch (err) {
        // Silently fail - testimonials are optional
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div>
      <ExitIntentPopup />
      <section className="hero">
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            <Zap size={14} />
            NEW: 50% OFF for Early Adopters
          </div>
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

          {/* Trust Badges */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '13px' }}>
              <Lock size={16} />
              <span>SSL Secured</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '13px' }}>
              <CreditCard size={16} />
              <span>Stripe Payments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '13px' }}>
              <Shield size={16} />
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Announcement */}
      <section style={{ background: 'linear-gradient(135deg, var(--primary-50), var(--gray-50))', padding: '40px 0', marginTop: '-40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} />
          JUST LAUNCHED
        </div>

        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--gray-900)' }}>
            🎉 Launch Special: 50% OFF
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--gray-600)', marginBottom: '20px' }}>
            We just launched! Use code <strong style={{ color: 'var(--primary-600)' }}>EARLY50</strong> at checkout for 50% off your subscription.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '24px',
            padding: '16px 32px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Launch Discount</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>50% OFF</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--gray-200)' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Code</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-600)', fontFamily: 'monospace' }}>EARLY50</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--gray-200)' }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Risk-Free</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>30-Day Refund</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="container" style={{ marginTop: '60px', marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            See ReviewResponder in Action
          </h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
            Watch how easy it is to generate professional review responses in seconds
          </p>
        </div>

        {/* Video Placeholder - Replace with actual video later */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          position: 'relative',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          aspectRatio: '16/9'
        }}>
          {/* Placeholder Content */}
          <div style={{
            position: 'absolute',
            inset: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {/* Play Button */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(79, 70, 229, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(79, 70, 229, 0.4)';
            }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Demo Video Coming Soon
            </p>
            <p style={{ fontSize: '14px', opacity: '0.7' }}>
              2 minute walkthrough of all features
            </p>
          </div>

          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            gap: '8px'
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27ca40' }} />
          </div>
        </div>

        {/* TODO: Replace placeholder with actual video embed */}
        {/*
        <div style={{ maxWidth: '800px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' }}>
          <iframe
            width="100%"
            style={{ aspectRatio: '16/9' }}
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
            title="ReviewResponder Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        */}
      </section>

      <section className="container" style={{ marginTop: '60px' }}>
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
                <Link
                  to="/extension"
                  className="btn"
                  style={{ background: 'white', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18} />
                  Get Extension
                </Link>
                <Link to="/register" className="btn" style={{ background: 'transparent', border: '2px solid white', color: 'white' }}>
                  Create Free Account First
                </Link>
              </div>
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

      {/* Live Demo Examples */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            See It In Action
          </h2>
          <p style={{ color: 'var(--gray-600)' }}>
            Real examples of AI-generated responses for different scenarios
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Example 1: 5-Star Review */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gray-50)', padding: '16px 20px', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-600)' }}>POSITIVE REVIEW</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray-700)', lineHeight: '1.5' }}>
                "Amazing pizza! The crust was perfectly crispy and the toppings were fresh. Service was quick and friendly. Will definitely come back!"
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>AI</div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Generated in 3 seconds</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--gray-800)', lineHeight: '1.6' }}>
                "Thank you so much for the wonderful review! We're thrilled you enjoyed our pizza and experienced our team's dedication to great service. Your kind words mean the world to us, and we can't wait to welcome you back soon! 🍕✨"
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '12px' }}>Friendly Tone</span>
              </div>
            </div>
          </div>

          {/* Example 2: Negative Review */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gray-50)', padding: '16px 20px', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-600)' }}>NEGATIVE REVIEW</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= 2 ? "#f59e0b" : "none"} color="#f59e0b" />)}
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray-700)', lineHeight: '1.5' }}>
                "Waited 45 minutes for our food. When it finally arrived, it was cold. Very disappointed with the service."
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>AI</div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Generated in 2 seconds</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--gray-800)', lineHeight: '1.6' }}>
                "We sincerely apologize for the unacceptable wait time and cold food. This is not the standard we aim for, and we understand your disappointment. Please contact us directly at (555) 123-4567 so we can make this right and ensure a much better experience next time."
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--error-light)', color: 'var(--error)', borderRadius: '12px' }}>Apologetic Tone</span>
              </div>
            </div>
          </div>

          {/* Example 3: Multi-language */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gray-50)', padding: '16px 20px', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-600)' }}>GERMAN REVIEW</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= 4 ? "#f59e0b" : "none"} color="#f59e0b" />)}
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray-700)', lineHeight: '1.5' }}>
                "Sehr gutes Essen und freundliche Bedienung. Die Portionen könnten etwas größer sein, aber insgesamt empfehlenswert!"
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>AI</div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Auto-detected: German</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--gray-800)', lineHeight: '1.6' }}>
                "Vielen Dank für Ihre positive Bewertung! Es freut uns sehr, dass Ihnen unser Essen und der Service gefallen haben. Ihr Feedback zu den Portionsgrößen nehmen wir gerne auf. Wir freuen uns auf Ihren nächsten Besuch!"
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '12px' }}>Professional Tone</span>
                <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--gray-100)', color: 'var(--gray-700)', borderRadius: '12px' }}>🇩🇪 German</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Try It Free Now
          </Link>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--gray-500)' }}>
            Generate 5 responses free • No credit card required
          </p>
        </div>
      </section>

      {/* Testimonials Section - Real User Feedback */}
      {testimonials.length > 0 && (
        <section className="container" style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
              What Our Users Say
            </h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
              Real feedback from businesses using ReviewResponder
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      fill={star <= testimonial.rating ? '#f59e0b' : 'none'}
                      color={star <= testimonial.rating ? '#f59e0b' : '#d1d5db'}
                    />
                  ))}
                </div>
                {testimonial.comment && (
                  <p style={{
                    fontSize: '15px',
                    color: 'var(--gray-700)',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    "{testimonial.comment}"
                  </p>
                )}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary-100)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {testimonial.user_name ? testimonial.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--gray-900)' }}>
                      {testimonial.user_name || 'ReviewResponder User'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      Verified User
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Money Back Guarantee */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #10b981, #059669)', 
          color: 'white', 
          padding: '40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          
          <Shield size={48} style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            30-Day Money-Back Guarantee
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto', opacity: 0.95 }}>
            Try ReviewResponder risk-free. If you're not completely satisfied within 30 days, 
            we'll refund 100% of your money. No questions asked. We're that confident you'll love it.
          </p>
          
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '32px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>100%</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Refund</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>30</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Days</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>0</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Risk</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="pricing-header">
            <h2 className="pricing-title">Simple, Transparent Pricing</h2>
            <p style={{ color: 'var(--gray-600)' }}>Start free, upgrade when you need more</p>
            <div style={{ 
              display: 'inline-block', 
              marginTop: '16px',
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              🎉 Launch Special: Use code EARLY50 for 50% off any plan!
            </div>
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
            <div>
              <div className="footer-title">Legal</div>
              <ul className="footer-links">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
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

// Privacy Policy Page
const PrivacyPage = () => (
  <div className="container" style={{ maxWidth: '800px', padding: '60px 20px' }}>
    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px' }}>Privacy Policy</h1>
    <p style={{ color: 'var(--gray-500)', marginBottom: '32px' }}>Last updated: January 9, 2026</p>

    <div style={{ lineHeight: '1.8', color: 'var(--gray-700)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>1. Information We Collect</h2>
      <p>When you use ReviewResponder, we collect:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li><strong>Account Information:</strong> Email address, business name, and password (encrypted)</li>
        <li><strong>Usage Data:</strong> Review texts you submit and generated responses</li>
        <li><strong>Payment Information:</strong> Processed securely by Stripe - we never store your card details</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>2. How We Use Your Data</h2>
      <p>We use your information to:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>Provide and improve our AI response generation service</li>
        <li>Process payments and manage your subscription</li>
        <li>Send important service updates (no marketing spam)</li>
        <li>Respond to support requests</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>3. Data Storage & Security</h2>
      <p>Your data is stored securely on servers in the EU/US (Render.com). We use:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>HTTPS encryption for all data transfers</li>
        <li>Encrypted password storage (bcrypt)</li>
        <li>Secure PostgreSQL database</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>4. Third-Party Services</h2>
      <p>We use the following services:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li><strong>OpenAI:</strong> To generate review responses (your review text is sent to their API)</li>
        <li><strong>Stripe:</strong> For payment processing</li>
        <li><strong>Resend:</strong> For transactional emails</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>5. Your Rights (GDPR)</h2>
      <p>You have the right to:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li><strong>Access:</strong> Request a copy of your data</li>
        <li><strong>Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Erasure:</strong> Request deletion of your account and data</li>
        <li><strong>Portability:</strong> Export your data</li>
      </ul>
      <p style={{ marginTop: '12px' }}>To exercise these rights, email us at <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)' }}>berend.mainz@web.de</a></p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>6. Chrome Extension</h2>
      <p>Our Chrome Extension requires specific permissions to function:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li><strong>activeTab:</strong> To detect reviews on Google Maps pages you visit</li>
        <li><strong>storage:</strong> To save your login session locally</li>
        <li><strong>clipboardWrite:</strong> To copy generated responses to your clipboard</li>
        <li><strong>host_permissions:</strong> To communicate with Google Maps and our API</li>
      </ul>
      <p style={{ marginTop: '12px' }}>The extension does NOT collect browsing history, personal data from other sites, or any data when you're not actively using it.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>7. Data Retention</h2>
      <p>We retain your data for as long as your account is active. Upon account deletion, we remove your personal data within 30 days.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>8. Contact</h2>
      <p>Questions about this policy? Contact us at <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)' }}>berend.mainz@web.de</a></p>
    </div>
  </div>
);

// Terms of Service Page
const TermsPage = () => (
  <div className="container" style={{ maxWidth: '800px', padding: '60px 20px' }}>
    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px' }}>Terms of Service</h1>
    <p style={{ color: 'var(--gray-500)', marginBottom: '32px' }}>Last updated: January 9, 2026</p>

    <div style={{ lineHeight: '1.8', color: 'var(--gray-700)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>1. Service Description</h2>
      <p>ReviewResponder provides AI-powered review response generation for businesses. We use artificial intelligence to help you craft professional responses to customer reviews.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>2. Account Terms</h2>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>You must be 18 years or older to use this service</li>
        <li>You are responsible for maintaining the security of your account</li>
        <li>You may not use the service for illegal purposes</li>
        <li>One person or business per account</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>3. Acceptable Use</h2>
      <p>You agree NOT to use ReviewResponder to:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>Generate fake reviews or misleading content</li>
        <li>Harass, abuse, or harm others</li>
        <li>Violate any laws or regulations</li>
        <li>Infringe on intellectual property rights</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>4. Payment & Refunds</h2>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>Free tier: 5 responses per month, no payment required</li>
        <li>Paid plans: Billed monthly or yearly via Stripe</li>
        <li><strong>30-Day Money Back Guarantee:</strong> If you're not satisfied within 30 days, contact us for a full refund</li>
        <li>Cancel anytime - no long-term contracts</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>5. AI-Generated Content</h2>
      <p>Responses generated by our AI are suggestions only. You are responsible for:</p>
      <ul style={{ marginLeft: '24px', marginTop: '12px' }}>
        <li>Reviewing and editing responses before posting</li>
        <li>Ensuring accuracy of any claims made</li>
        <li>The final content you publish</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>6. Limitation of Liability</h2>
      <p>ReviewResponder is provided "as is" without warranties. We are not liable for any damages arising from your use of the service or AI-generated content.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>7. Changes to Terms</h2>
      <p>We may update these terms. Continued use after changes constitutes acceptance.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>8. Contact</h2>
      <p>Questions? Email us at <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)' }}>berend.mainz@web.de</a></p>
    </div>
  </div>
);

// Pricing Cards Component
const PricingCards = ({ showFree = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/register');
      return;
    }

    try {
      const res = await api.post('/billing/create-checkout', { 
        plan, 
        billing: billingCycle,
        discountCode: 'EARLY50' // Automatically apply launch discount
      });
      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      responses: 5,
      features: ['5 responses per month', 'All tone options', '50+ languages', 'Copy to clipboard'],
      buttonText: 'Get Started',
      plan: 'free'
    },
    {
      name: 'Starter',
      monthlyPrice: 29,
      yearlyPrice: 23.20, // 20% off
      responses: 100,
      features: ['100 responses per month', 'All tone options', '50+ languages', 'Response history', 'Email support'],
      buttonText: 'Subscribe',
      plan: 'starter'
    },
    {
      name: 'Professional',
      monthlyPrice: 49,
      yearlyPrice: 39.20, // 20% off
      responses: 300,
      features: ['300 responses per month', 'All tone options', '50+ languages', 'Bulk generation (20 at once)', 'Analytics dashboard'],
      buttonText: 'Subscribe',
      plan: 'professional',
      popular: true
    },
    {
      name: 'Unlimited',
      monthlyPrice: 99,
      yearlyPrice: 79.20, // 20% off
      responses: 'Unlimited',
      features: ['Unlimited responses', 'All tone options', '50+ languages', 'Bulk generation (20 at once)', 'Analytics dashboard'],
      buttonText: 'Subscribe',
      plan: 'unlimited'
    }
  ];

  const displayPlans = showFree ? plans : plans.filter(p => p.plan !== 'free');
  const isYearly = billingCycle === 'yearly';

  return (
    <div>
      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontWeight: billingCycle === 'monthly' ? '600' : '400', color: billingCycle === 'monthly' ? 'var(--gray-900)' : 'var(--gray-500)' }}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
          style={{
            width: '56px',
            height: '28px',
            borderRadius: '14px',
            background: isYearly ? 'var(--primary-600)' : 'var(--gray-300)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s'
          }}
        >
          <span style={{
            position: 'absolute',
            top: '2px',
            left: isYearly ? '30px' : '2px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </button>
        <span style={{ fontWeight: billingCycle === 'yearly' ? '600' : '400', color: billingCycle === 'yearly' ? 'var(--gray-900)' : 'var(--gray-500)' }}>
          Yearly
        </span>
        <span style={{
          background: 'var(--success)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          marginLeft: '8px'
        }}>
          Save 20%
        </span>
      </div>

      <div className="pricing-grid">
        {displayPlans.map((plan) => {
          const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const savings = plan.monthlyPrice > 0 ? Math.round((plan.monthlyPrice - plan.yearlyPrice) * 12) : 0;

          return (
            <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="pricing-badge">Most Popular</span>}
              <h3 className="pricing-plan">{plan.name}</h3>
              <div className="pricing-price">
                ${displayPrice.toFixed(2).replace('.00', '')}<span>/mo</span>
              </div>
              {isYearly && plan.monthlyPrice > 0 && (
                <p style={{ color: 'var(--success)', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                  Save ${savings}/year
                </p>
              )}
              {isYearly && plan.monthlyPrice > 0 && (
                <p style={{ color: 'var(--gray-400)', fontSize: '12px', textDecoration: 'line-through', marginTop: '2px' }}>
                  ${plan.monthlyPrice}/mo
                </p>
              )}
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
          );
        })}
      </div>
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

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/forgot-password" style={{ color: 'var(--primary-600)', fontSize: '14px' }}>
            Forgot your password?
          </Link>
        </p>

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

// Forgot Password Page
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <Mail size={48} style={{ color: 'var(--primary-600)', marginBottom: '16px' }} />
          <h1 className="auth-title">Check Your Email</h1>
          <p className="auth-subtitle">
            If an account exists for {email}, you will receive a password reset link shortly.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginTop: '16px' }}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>

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

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

// Reset Password Page
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <X size={48} style={{ color: 'var(--error)', marginBottom: '16px' }} />
          <h1 className="auth-title">Invalid Link</h1>
          <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <Check size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
          <h1 className="auth-title">Password Reset!</h1>
          <p className="auth-subtitle">Your password has been reset successfully.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Onboarding Modal Component
const OnboardingModal = ({ isVisible, onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Business Name
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  
  // Step 2: Sample Review
  const [sampleReview, setSampleReview] = useState('');
  const [sampleResponse, setSampleResponse] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const sampleReviews = [
    "Great service and fast delivery! Really happy with my experience. Will definitely come back again.",
    "The food was amazing and the staff was very friendly. Highly recommend this place to everyone!",
    "Terrible experience. The product broke after one day and customer service was unhelpful."
  ];

  useEffect(() => {
    if (isVisible && sampleReview === '') {
      setSampleReview(sampleReviews[0]);
    }
  }, [isVisible]);

  const nextStep = () => {
    if (currentStep === 1 && businessName.trim()) {
      updateBusinessProfile();
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateBusinessProfile = async () => {
    try {
      await api.put('/auth/profile', {
        businessName: businessName.trim()
      });
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to update business name:', error);
      toast.error('Failed to save business name');
    }
  };

  const generateSampleResponse = async () => {
    if (!sampleReview.trim()) return;
    
    setGenerating(true);
    try {
      const response = await api.post('/generate', {
        reviewText: sampleReview,
        tone: 'professional',
        platform: 'google'
      });
      
      setSampleResponse(response.data.response);
      toast.success('Sample response generated!');
    } catch (error) {
      console.error('Failed to generate sample response:', error);
      toast.error('Failed to generate response');
    } finally {
      setGenerating(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await api.put('/auth/complete-onboarding');
      toast.success('Welcome to ReviewResponder! 🎉');
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    try {
      await api.put('/auth/complete-onboarding');
      onSkip();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="card" 
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
            Welcome to ReviewResponder! 🎉
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Let's get you set up in just 3 quick steps
          </p>
          
          {/* Progress bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  width: '32px',
                  height: '4px',
                  borderRadius: '2px',
                  background: step <= currentStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Step 1: Business Name */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                What's your business name?
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
                This helps us personalize your review responses
              </p>
              
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Tony's Pizza, Smith & Co Law Firm"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && businessName.trim() && nextStep()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Generate Sample Response */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Let's generate your first response!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
                Here's a sample review. Click "Generate Response" to see the magic ✨
              </p>
              
              <div className="form-group">
                <label className="form-label">Sample Review</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={sampleReview}
                  onChange={(e) => setSampleReview(e.target.value)}
                />
              </div>
              
              {!sampleResponse && (
                <button
                  className="btn btn-primary"
                  onClick={generateSampleResponse}
                  disabled={generating || !sampleReview.trim()}
                  style={{ width: '100%', marginBottom: '16px' }}
                >
                  {generating ? 'Generating...' : '🪄 Generate Response'}
                </button>
              )}
              
              {sampleResponse && (
                <div>
                  <label className="form-label" style={{ color: 'var(--primary)' }}>
                    ✨ AI-Generated Response
                  </label>
                  <div style={{
                    background: 'var(--gray-50)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {sampleResponse}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
                    Pretty cool, right? You can customize tone, add business context, and more!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Chrome Extension */}
          {currentStep === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                You're all set!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '14px' }}>
                Want to make responding even faster? Install our Chrome extension to respond directly from Google Reviews, Yelp, and more.
              </p>
              
              <div style={{
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <Chrome size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Chrome Extension
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '16px' }}>
                  Generate responses without leaving the review page
                </p>
                <Link
                  to="/extension"
                  className="btn btn-secondary"
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  <Download size={16} />
                  Install Extension
                </Link>
              </div>
              
              <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                Don't worry - you can always install it later from the dashboard
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--gray-200)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            className="btn btn-secondary"
            onClick={skipOnboarding}
            disabled={loading}
            style={{ fontSize: '14px' }}
          >
            Skip for now
          </button>
          
          {currentStep < 3 ? (
            <button
              className="btn btn-primary"
              onClick={nextStep}
              disabled={(currentStep === 1 && !businessName.trim()) || (currentStep === 2 && !sampleResponse)}
            >
              {currentStep === 1 ? 'Continue' : 'Next'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={completeOnboarding}
              disabled={loading}
            >
              {loading ? 'Finishing...' : '🚀 Start Using ReviewResponder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('single');
  const [stats, setStats] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [platform, setPlatform] = useState('google');
  const [tone, setTone] = useState('professional');
  const [outputLanguage, setOutputLanguage] = useState('auto');
  const [generating, setGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Bulk generation state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkPlatform, setBulkPlatform] = useState('google');
  const [bulkTone, setBulkTone] = useState('professional');
  const [bulkOutputLanguage, setBulkOutputLanguage] = useState('auto');
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Export state
  const [allHistory, setAllHistory] = useState([]);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  // Feedback popup state
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackDisplayName, setFeedbackDisplayName] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstResponse, setIsFirstResponse] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchTemplates();
    fetchAllHistory();

    // Check if user needs onboarding
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
    if (user && user.responsesUsed === 0) setIsFirstResponse(true);

    // Check for success param from Stripe
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      toast.success('Subscription activated! Thank you for subscribing.');
      // Refresh user data
      api.get('/auth/me').then(res => updateUser(res.data.user));
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateUser({ onboardingCompleted: true });
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    updateUser({ onboardingCompleted: true });
  };

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

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates');
    }
  };

  const fetchAllHistory = async () => { try { const res = await api.get('/responses/history?limit=1000'); setAllHistory(res.data.responses); } catch (e) { console.error('Failed to fetch all history'); } };

  // Check if user should see feedback popup (after 10 responses)
  const checkFeedbackStatus = async () => {
    try {
      const res = await api.get('/feedback/status');
      if (res.data.shouldShowPopup) {
        setTimeout(() => setShowFeedbackPopup(true), 1500);
      }
    } catch (error) {
      console.error('Failed to check feedback status');
    }
  };

  // Submit feedback
  const submitFeedback = async (e) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingFeedback(true);
    try {
      await api.post('/feedback', {
        rating: feedbackRating,
        comment: feedbackComment.trim() || null,
        displayName: feedbackDisplayName.trim() || null
      });
      toast.success('Thank you for your feedback!');
      setShowFeedbackPopup(false);
      setFeedbackRating(0);
      setFeedbackComment('');
      setFeedbackDisplayName('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getFilteredHistory = () => { let f = allHistory; if (exportDateFrom) f = f.filter(i => new Date(i.created_at) >= new Date(exportDateFrom)); if (exportDateTo) { const e = new Date(exportDateTo); e.setHours(23,59,59,999); f = f.filter(i => new Date(i.created_at) <= e); } return f; };

  const exportToCSV = () => { setExporting(true); try { const f = getFilteredHistory(); if (f.length === 0) { toast.error('No responses'); setExporting(false); return; } const d = f.map(i => ({ Date: new Date(i.created_at).toLocaleDateString(), Platform: i.review_platform||'N/A', Rating: i.review_rating||'N/A', Tone: i.tone||'professional', Review: i.review_text, Response: i.generated_response })); const csv = Papa.unparse(d); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `responses-${new Date().toISOString().split('T')[0]}.csv`; link.click(); toast.success(`Exported ${f.length} to CSV`); } catch (e) { toast.error('Export failed'); } finally { setExporting(false); } };

  const exportToPDF = () => { setExporting(true); try { const f = getFilteredHistory(); if (f.length === 0) { toast.error('No responses'); setExporting(false); return; } const doc = new jsPDF(); doc.setFontSize(18); doc.text('Response History', 14, 20); doc.setFontSize(10); doc.text(`${new Date().toLocaleDateString()} | ${f.length} responses`, 14, 28); const t = f.map(i => [new Date(i.created_at).toLocaleDateString(), i.review_platform||'-', i.review_rating||'-', i.review_text.substring(0,40)+'...', i.generated_response.substring(0,50)+'...']); doc.autoTable({ startY: 35, head: [['Date','Platform','Rating','Review','Response']], body: t, styles: { fontSize: 7 }, headStyles: { fillColor: [79,70,229] } }); doc.save(`responses-${new Date().toISOString().split('T')[0]}.pdf`); toast.success(`Exported ${f.length} to PDF`); } catch (e) { toast.error('Export failed'); } finally { setExporting(false); } };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setSavingTemplate(true);
    try {
      await api.post('/templates', {
        name: templateName.trim(),
        content: response,
        tone,
        platform
      });
      toast.success('Template saved!');
      setShowSaveTemplateModal(false);
      setTemplateName('');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;

    try {
      await api.delete(`/templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
      if (selectedTemplate === templateId.toString()) {
        setSelectedTemplate('');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setResponse(template.content);
      setTone(template.tone || 'professional');
      setPlatform(template.platform || 'google');
      toast.success('Template applied as starting point');
    }
  };

  const generateResponse = async (overrideTone = null) => {
    if (!reviewText.trim()) {
      toast.error('Please enter a review to respond to');
      return;
    }

    const useTone = overrideTone || tone;
    if (overrideTone) {
      setTone(overrideTone);
    }

    setGenerating(true);
    setResponse('');

    try {
      const res = await api.post('/responses/generate', {
        reviewText,
        reviewRating: rating || null,
        platform,
        tone: useTone,
        outputLanguage,
        businessName: user.businessName
      });

      setResponse(res.data.response);
      updateUser({
        responsesUsed: res.data.responsesUsed,
        responsesLimit: res.data.responsesLimit
      });
      fetchHistory();

      // Fire confetti on first response!
      if (isFirstResponse) {
        fireConfetti();
        toast.success('Congratulations on your first response!', { icon: '🎉', duration: 4000 });
        setIsFirstResponse(false);
      } else {
        toast.success('Response generated!');
      }
      // Check if user should see feedback popup
      checkFeedbackStatus();
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

  // Parse bulk input (supports multiple formats)
  const parseBulkInput = (input) => {
    if (!input) return [];
    // Try to detect CSV format (quoted strings with commas)
    if (input.includes('","') || input.startsWith('"')) {
      const matches = input.match(/"([^"]+)"/g);
      if (matches) {
        return matches.map(m => m.slice(1, -1).trim()).filter(r => r.length > 0);
      }
    }
    // Try line-separated format (each line is a review)
    const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 1) {
      return lines;
    }
    // Try separator format: ---
    if (input.includes('---')) {
      return input.split('---').map(r => r.trim()).filter(r => r.length > 0);
    }
    // Single review
    return [input.trim()].filter(r => r.length > 0);
  };

  const generateBulkResponses = async () => {
    const reviews = parseBulkInput(bulkInput);
    if (reviews.length === 0) {
      toast.error('Please enter at least one review');
      return;
    }
    if (reviews.length > 20) {
      toast.error('Maximum 20 reviews per batch');
      return;
    }
    setBulkGenerating(true);
    setBulkResults(null);
    try {
      const res = await api.post('/generate-bulk', {
        reviews,
        platform: bulkPlatform,
        tone: bulkTone,
        outputLanguage: bulkOutputLanguage
      });
      setBulkResults(res.data);
      updateUser({
        responsesUsed: res.data.responsesUsed,
        responsesLimit: res.data.responsesLimit
      });
      fetchHistory();
      toast.success(`Generated ${res.data.summary.successful} responses!`);
    } catch (error) {
      if (error.response?.data?.upgrade) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.requiredPlan) {
        toast.error('Bulk generation requires a paid plan (Starter, Pro, or Unlimited)');
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate responses');
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  const copyBulkResponse = (responseText, index) => {
    navigator.clipboard.writeText(responseText);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllResponses = () => {
    if (!bulkResults) return;
    const allResponses = bulkResults.results
      .filter(r => r.success)
      .map((r, i) => `Review ${i + 1}:\n${r.review}\n\nResponse:\n${r.response}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allResponses);
    toast.success('All responses copied!');
  };

  const canUseBulk = ['starter', 'professional', 'unlimited'].includes(user?.plan);

  const usagePercent = user ? (user.responsesUsed / user.responsesLimit) * 100 : 0;

  return (
    <div className="dashboard container">
      {/* Onboarding Modal */}
      <OnboardingModal
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, {user?.businessName || 'there'}!</h1>
          <p style={{ color: 'var(--gray-500)' }}>Generate professional review responses</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <Keyboard size={16} />
          </button>
          <Link to="/analytics" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <BarChart2 size={16} />
            Analytics
            {!['professional', 'unlimited'].includes(user?.plan) && (
              <span style={{ background: 'var(--primary-600)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', marginLeft: '4px' }}>PRO</span>
            )}
          </Link>
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

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('single')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'single' ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'single' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'single' ? 'var(--primary-600)' : 'var(--gray-600)',
            fontWeight: activeTab === 'single' ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            marginBottom: '-1px'
          }}
        >
          <FileText size={18} />
          Single Response
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'bulk' ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'bulk' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'bulk' ? 'var(--primary-600)' : 'var(--gray-600)',
            fontWeight: activeTab === 'bulk' ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            marginBottom: '-1px'
          }}
        >
          <Layers size={18} />
          Bulk Generate
          {!canUseBulk && (
            <span style={{
              background: 'var(--primary-600)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>PAID</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'history' ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--primary-600)' : 'var(--gray-600)',
            fontWeight: activeTab === 'history' ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            marginBottom: '-1px'
          }}
        >
          <Clock size={18} />
          History
        </button>
      </div>

      {/* Single Response Tab */}
      {activeTab === 'single' && (
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Response Tone
                <FeatureTooltip text="Professional: Business-appropriate. Friendly: Warm and personal. Formal: Corporate style. Apologetic: For negative reviews.">
                  <Info size={14} style={{ color: 'var(--gray-400)', cursor: 'help' }} />
                </FeatureTooltip>
              </label>
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

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Response Language
                <FeatureTooltip text="Auto-detect matches the customer's language automatically. Great for multilingual businesses!">
                  <Info size={14} style={{ color: 'var(--gray-400)', cursor: 'help' }} />
                </FeatureTooltip>
              </label>
              <select
                className="form-select"
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
              >
                <option value="auto">Auto-detect (match review)</option>
                <option value="en">English</option>
                <option value="de">German (Deutsch)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="it">Italian (Italiano)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="nl">Dutch (Nederlands)</option>
                <option value="pl">Polish (Polski)</option>
                <option value="ru">Russian (Русский)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="ko">Korean (한국어)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="tr">Turkish (Türkçe)</option>
                <option value="sv">Swedish (Svenska)</option>
                <option value="da">Danish (Dansk)</option>
                <option value="no">Norwegian (Norsk)</option>
                <option value="fi">Finnish (Suomi)</option>
              </select>
            </div>
          </div>

          {templates.length > 0 && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">
                <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Use Template as Starting Point (optional)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="form-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select a template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {selectedTemplate && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => applyTemplate(selectedTemplate)}
                      style={{ padding: '8px 12px' }}
                      title="Use this template"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => deleteTemplate(parseInt(selectedTemplate))}
                      style={{ padding: '8px 12px', color: 'var(--error)' }}
                      title="Delete template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                Select a saved template to use as a starting point, then generate to customize it
              </p>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => generateResponse()}
            disabled={generating || !reviewText.trim()}
            style={{ width: '100%', marginTop: '8px' }}
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
            <>
              <div className="response-actions">
                <button className="btn btn-success" onClick={copyToClipboard}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Response'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSaveTemplateModal(true)}
                  title="Save as template for future use"
                >
                  <BookOpen size={16} />
                  Save as Template
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

              {/* Regenerate with different tone */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                  <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Try a different tone:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['professional', 'friendly', 'formal', 'apologetic'].filter(t => t !== tone).map((newTone) => (
                    <button
                      key={newTone}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => generateResponse(newTone)}
                      disabled={generating}
                    >
                      {newTone.charAt(0).toUpperCase() + newTone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Bulk Generate Tab */}
      {activeTab === 'bulk' && (
        <div>
          {!canUseBulk ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--primary-50)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <Layers size={40} style={{ color: 'var(--primary-600)' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                Bulk Generation is a Paid Feature
              </h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Generate responses for up to 20 reviews at once with any paid plan.
                Perfect for businesses with high review volume.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link to="/pricing" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  <Zap size={18} />
                  View Plans
                </Link>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-600)' }}>20</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Reviews per batch</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-600)' }}>Parallel</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Processing</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-600)' }}>CSV</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Import support</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
                  <Layers size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Bulk Generate Responses
                </h2>
                <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
                  Enter multiple reviews to generate responses for all of them at once. Maximum 20 per batch.
                </p>

                <div className="form-group">
                  <label className="form-label">Customer Reviews</label>
                  <textarea
                    className="form-textarea"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={`Enter multiple reviews, one per line. Example:

Great service! The staff was very helpful and friendly.

Terrible experience. Waited 30 minutes and nobody helped me.

Food was amazing, will definitely come back!`}
                    rows={10}
                    style={{ fontFamily: 'inherit' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
                    Supported formats: One review per line, CSV format ("review1","review2"), or separated by ---
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select
                      className="form-select"
                      value={bulkPlatform}
                      onChange={(e) => setBulkPlatform(e.target.value)}
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
                      value={bulkTone}
                      onChange={(e) => setBulkTone(e.target.value)}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="apologetic">Apologetic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Response Language</label>
                    <select
                      className="form-select"
                      value={bulkOutputLanguage}
                      onChange={(e) => setBulkOutputLanguage(e.target.value)}
                    >
                      <option value="auto">Auto-detect (match review)</option>
                      <option value="en">English</option>
                      <option value="de">German (Deutsch)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="fr">French (Français)</option>
                      <option value="it">Italian (Italiano)</option>
                      <option value="pt">Portuguese (Português)</option>
                      <option value="nl">Dutch (Nederlands)</option>
                      <option value="pl">Polish (Polski)</option>
                      <option value="ru">Russian (Русский)</option>
                      <option value="zh">Chinese (中文)</option>
                      <option value="ja">Japanese (日本語)</option>
                      <option value="ko">Korean (한국어)</option>
                      <option value="ar">Arabic (العربية)</option>
                      <option value="tr">Turkish (Türkçe)</option>
                      <option value="sv">Swedish (Svenska)</option>
                      <option value="da">Danish (Dansk)</option>
                      <option value="no">Norwegian (Norsk)</option>
                      <option value="fi">Finnish (Suomi)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    className="btn btn-primary"
                    onClick={generateBulkResponses}
                    disabled={bulkGenerating || !bulkInput.trim()}
                    style={{ flex: 1 }}
                  >
                    {bulkGenerating ? (
                      <>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Generating {parseBulkInput(bulkInput).length} responses...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate All Responses ({parseBulkInput(bulkInput).length || 0})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bulk Results */}
              {bulkResults && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                        Generated Responses
                      </h2>
                      <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                        {bulkResults.summary.successful} of {bulkResults.summary.total} responses generated
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={copyAllResponses}
                      style={{ padding: '8px 16px' }}
                    >
                      <Copy size={16} />
                      Copy All
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bulkResults.results.map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          background: result.success ? 'var(--gray-50)' : 'var(--danger-light)',
                          borderRadius: '8px',
                          border: result.success ? '1px solid var(--gray-200)' : '1px solid var(--danger)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{
                            background: result.success ? 'var(--primary-100)' : 'var(--danger)',
                            color: result.success ? 'var(--primary-700)' : 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Review #{index + 1}
                          </span>
                          {result.success && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => copyBulkResponse(result.response, index)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                              {copiedIndex === index ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '4px' }}>
                            REVIEW:
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--gray-700)' }}>
                            {result.review?.substring(0, 200)}{result.review?.length > 200 ? '...' : ''}
                          </div>
                        </div>

                        {result.success ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '4px' }}>
                              RESPONSE:
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--gray-900)', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
                              {result.response}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                            <AlertCircle size={16} />
                            <span style={{ fontSize: '14px' }}>{result.error}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}><Clock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Response History</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }} />
              <span style={{ color: 'var(--gray-400)' }}>to</span>
              <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontSize: '13px' }} />
              <button onClick={exportToCSV} disabled={exporting || allHistory.length === 0} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}><Download size={14} /> CSV</button>
              <button onClick={exportToPDF} disabled={exporting || allHistory.length === 0} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}><Download size={14} /> PDF</button>
            </div>
          </div>
          {allHistory.length > 0 && <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '16px' }}>{allHistory.length} responses available for export</p>}

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray-500)' }}>
              <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No responses generated yet. Start by generating your first response!</p>
            </div>
          ) : (
            history.map((item) => (
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
            ))
          )}
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowSaveTemplateModal(false)}>
          <div
            className="card"
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} />
              Save as Template
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '16px' }}>
              Save this response as a template to quickly use it as a starting point for future reviews.
            </p>

            <div className="form-group">
              <label className="form-label">Template Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Positive 5-star response"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveAsTemplate}
                disabled={savingTemplate || !templateName.trim()}
                style={{ flex: 1 }}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowKeyboardHelp(false)}>
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={20} />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gray-400)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-700)' }}>Generate Response</span>
                <kbd style={{ background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + Enter
                </kbd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-700)' }}>Copy Response</span>
                <kbd style={{ background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + Shift + C
                </kbd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-700)' }}>New Response (Clear)</span>
                <kbd style={{ background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + N
                </kbd>
              </div>

              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>Change Tone:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '13px' }}>Professional</span>
                    <kbd style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                      {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + 1
                    </kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '13px' }}>Friendly</span>
                    <kbd style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                      {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + 2
                    </kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '13px' }}>Formal</span>
                    <kbd style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                      {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + 3
                    </kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '13px' }}>Apologetic</span>
                    <kbd style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                      {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + 4
                    </kbd>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', marginTop: '8px', borderTop: '1px solid var(--gray-200)' }}>
                <span style={{ color: 'var(--gray-700)' }}>Show This Help</span>
                <kbd style={{ background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + /
                </kbd>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowKeyboardHelp(false)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Feedback Popup */}
      <FeedbackPopup
        isVisible={showFeedbackPopup}
        onClose={() => setShowFeedbackPopup(false)}
        onSubmit={() => setShowFeedbackPopup(false)}
      />
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
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const loadApiKeys = async () => { setLoadingKeys(true); try { const res = await api.get('/keys'); setApiKeys(res.data.keys || []); } catch (e) {} finally { setLoadingKeys(false); } };
  const createApiKey = async () => { setCreatingKey(true); try { const res = await api.post('/keys', { name: newKeyName || 'API Key' }); setGeneratedKey(res.data.key); setNewKeyName(''); loadApiKeys(); toast.success('API key created!'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } finally { setCreatingKey(false); } };
  const deleteApiKey = async (keyId) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/keys/${keyId}`); setApiKeys(apiKeys.filter(k => k.id !== keyId)); toast.success('Deleted'); } catch (e) { toast.error('Failed'); } };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || '');
      if (user.plan === 'unlimited' && user.subscriptionStatus === 'active') loadApiKeys();
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
          {saving ? 'Saving...' : (<><Save size={18} /> Save Settings</>)}
        </button>
      </form>

      {/* API Key Management - Only for Unlimited Plan */}
      {user?.plan === 'unlimited' && user?.subscriptionStatus === 'active' && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} />
            API Access
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
            Generate API keys to integrate ReviewResponder with your applications. <Link to="/api-docs" style={{ color: 'var(--primary-600)' }}>View API Documentation</Link>
          </p>

          {generatedKey && (
            <div style={{ background: 'var(--success-50)', border: '1px solid var(--success-200)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontWeight: '600', color: 'var(--success-700)', marginBottom: '8px' }}>New API Key Created!</p>
              <p style={{ fontSize: '12px', color: 'var(--success-600)', marginBottom: '8px' }}>Copy this key now. It won't be shown again.</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ flex: 1, background: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', wordBreak: 'break-all' }}>{generatedKey}</code>
                <button onClick={() => copyToClipboard(generatedKey)} className="btn btn-sm" style={{ whiteSpace: 'nowrap' }}><Copy size={14} /> Copy</button>
              </div>
              <button onClick={() => setGeneratedKey(null)} style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success-600)', background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" className="form-input" placeholder="Key name (optional)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} style={{ flex: 1 }} />
            <button onClick={createApiKey} className="btn btn-primary" disabled={creatingKey}>{creatingKey ? 'Creating...' : 'Generate Key'}</button>
          </div>

          {loadingKeys ? <p>Loading keys...</p> : apiKeys.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>No API keys yet. Generate one to get started.</p>
          ) : (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
              {apiKeys.map((key, idx) => (
                <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx < apiKeys.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{key.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{key.key_prefix}... | {key.requests_today}/100 today | {key.requests_total} total</div>
                  </div>
                  <button onClick={() => deleteApiKey(key.id)} className="btn btn-sm" style={{ color: 'var(--error-600)' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
      a: 'Most responses are generated in under 10 seconds. Our AI analyzes your review and generates a contextual, personalized response instantly.'
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

// SEO Landing Page Component - Google Review Response Generator
const GoogleReviewPage = () => {
  useEffect(() => {
    document.title = 'Google Review Response Generator | AI-Powered Replies | ReviewResponder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Generate professional Google review responses in seconds with AI. Reply to Google Maps reviews instantly with our free tool. Try now!');

    // Add Schema.org structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ReviewResponder - Google Review Response Generator",
      "description": "AI-powered tool to generate professional responses to Google reviews",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free trial with 5 responses"
      }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)', padding: '80px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <Star size={16} fill="white" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Google Maps Integration</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            Google Review Response Generator
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.95, marginBottom: '32px', lineHeight: '1.6' }}>
            Respond to Google reviews in seconds with AI. Generate professional, personalized replies
            that improve your business reputation and show customers you care.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#4285f4', fontWeight: '600', padding: '16px 32px' }}>
            <Sparkles size={20} />
            Generate Free Responses
          </Link>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>5 free responses • No credit card required</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          Why Use an AI Google Review Response Generator?
        </h2>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ padding: '24px' }}>
            <Clock size={32} style={{ color: 'var(--primary-600)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Save Hours Weekly</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Stop spending 10-15 minutes per review. Generate thoughtful Google review responses in under 30 seconds.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Shield size={32} style={{ color: '#34a853', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Protect Your Reputation</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Respond to negative Google reviews quickly and professionally to show potential customers you care.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#4285f4', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Boost Local SEO</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Active review responses signal to Google that your business is engaged, improving local search rankings.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '60px', background: 'var(--gray-50)', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>How to Respond to Google Reviews with AI</h2>
          <ol style={{ lineHeight: '2', color: 'var(--gray-700)' }}>
            <li><strong>Copy the review</strong> from your Google Business Profile</li>
            <li><strong>Paste it</strong> into ReviewResponder</li>
            <li><strong>Select your tone</strong> (Professional, Friendly, Formal, or Apologetic)</li>
            <li><strong>Click Generate</strong> and get your personalized response instantly</li>
            <li><strong>Copy & paste</strong> the response back to Google</li>
          </ol>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
            Start Responding to Google Reviews Today
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
            Join thousands of businesses using AI to manage their Google reputation.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Try Free - No Card Required
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)' }}>ReviewResponder</Link> •
            <Link to="/yelp-review-reply-tool" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Yelp Reviews</Link> •
            <Link to="/restaurant-review-responses" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Restaurant Reviews</Link> •
            <Link to="/hotel-review-management" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Hotel Reviews</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

// SEO Landing Page Component - Yelp Review Reply Tool
const YelpReviewPage = () => {
  useEffect(() => {
    document.title = 'Yelp Review Reply Tool | AI Response Generator | ReviewResponder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Generate professional Yelp review responses instantly. AI-powered tool to reply to Yelp reviews quickly and professionally. Free trial available.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ReviewResponder - Yelp Review Reply Tool",
      "description": "AI-powered tool to generate professional responses to Yelp reviews",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #d32323 0%, #ff5a5f 100%)', padding: '80px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <Star size={16} fill="white" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Yelp Business Owners</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            Yelp Review Reply Tool
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.95, marginBottom: '32px', lineHeight: '1.6' }}>
            Never let a Yelp review go unanswered. Generate professional, thoughtful responses
            to all your Yelp reviews with AI - from 5-star praise to 1-star complaints.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#d32323', fontWeight: '600', padding: '16px 32px' }}>
            <Sparkles size={20} />
            Reply to Yelp Reviews Free
          </Link>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>5 free responses • Works with any Yelp review</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          Why Responding to Yelp Reviews Matters
        </h2>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ padding: '24px' }}>
            <Users size={32} style={{ color: '#d32323', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>97% Read Responses</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Studies show 97% of consumers who read reviews also read business responses. Make yours count.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <MessageSquare size={32} style={{ color: '#d32323', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Turn Negatives Positive</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              A thoughtful response to a negative Yelp review can convert critics into loyal customers.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Clock size={32} style={{ color: '#d32323', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Respond in 30 Seconds</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Stop agonizing over the perfect response. Our AI crafts professional Yelp replies instantly.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '60px', background: 'var(--gray-50)', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Perfect Responses for Every Yelp Review Type</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div>
                <strong>5-Star Reviews:</strong> Thank customers and encourage return visits
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div>
                <strong>3-4 Star Reviews:</strong> Acknowledge feedback and show commitment to improvement
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div>
                <strong>1-2 Star Reviews:</strong> Apologize professionally and offer to make things right
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
            Start Managing Your Yelp Reputation Today
          </h2>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Try Free - 5 Responses Included
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)' }}>ReviewResponder</Link> •
            <Link to="/google-review-response-generator" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Google Reviews</Link> •
            <Link to="/restaurant-review-responses" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Restaurant Reviews</Link> •
            <Link to="/hotel-review-management" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Hotel Reviews</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

// SEO Landing Page Component - Restaurant Review Responses
const RestaurantReviewPage = () => {
  useEffect(() => {
    document.title = 'Restaurant Review Response Generator | AI Reply Tool | ReviewResponder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'AI-powered review response generator for restaurants. Reply to Google, Yelp, TripAdvisor reviews professionally. Save time and boost your restaurant reputation.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ReviewResponder - Restaurant Review Response Generator",
      "description": "AI tool for restaurants to respond to customer reviews professionally",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', padding: '80px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <Utensils size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>For Restaurant Owners</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            Restaurant Review Response Generator
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.95, marginBottom: '32px', lineHeight: '1.6' }}>
            Running a restaurant is hard enough. Let AI handle your review responses so you can
            focus on what matters - great food and happy customers.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#ef4444', fontWeight: '600', padding: '16px 32px' }}>
            <Sparkles size={20} />
            Try Free for Restaurants
          </Link>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>Perfect for Google, Yelp, TripAdvisor & more</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          Why Restaurants Need AI Review Responses
        </h2>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ padding: '24px' }}>
            <Clock size={32} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>You're Too Busy</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Between managing staff, inventory, and customers, who has time to write thoughtful review responses?
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Star size={32} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Reviews Make or Break You</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              94% of diners choose restaurants based on online reviews. Your responses show you care.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <MessageSquare size={32} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Every Platform Covered</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Google, Yelp, TripAdvisor, OpenTable, Uber Eats - respond to reviews from any platform.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '60px', background: 'var(--gray-50)', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Common Restaurant Review Scenarios We Handle</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"The food was amazing!"</strong> - Thank them and invite them back</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Service was slow"</strong> - Apologize and explain how you'll improve</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Food was cold"</strong> - Show genuine concern and offer to make it right</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Loved the atmosphere"</strong> - Highlight what makes your restaurant special</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
            Focus on Cooking, Not Typing
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
            Join hundreds of restaurants saving hours weekly with AI-powered review responses.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Start Free - 5 Responses Included
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)' }}>ReviewResponder</Link> •
            <Link to="/google-review-response-generator" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Google Reviews</Link> •
            <Link to="/yelp-review-reply-tool" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Yelp Reviews</Link> •
            <Link to="/hotel-review-management" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Hotel Reviews</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

// SEO Landing Page Component - Hotel Review Management
const HotelReviewPage = () => {
  useEffect(() => {
    document.title = 'Hotel Review Management Tool | AI Response Generator | ReviewResponder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'AI-powered hotel review response tool. Manage reviews on Booking.com, TripAdvisor, Google, and more. Professional responses in seconds for hotels and B&Bs.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ReviewResponder - Hotel Review Management Tool",
      "description": "AI tool for hotels to respond to guest reviews professionally",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', padding: '80px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <Building size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>For Hotels & B&Bs</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            Hotel Review Management Tool
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.95, marginBottom: '32px', lineHeight: '1.6' }}>
            Manage guest reviews across all platforms with AI. From Booking.com to TripAdvisor,
            respond professionally to every review and boost your hotel's reputation.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#6366f1', fontWeight: '600', padding: '16px 32px' }}>
            <Sparkles size={20} />
            Try Free for Hotels
          </Link>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>Works with Booking.com, TripAdvisor, Expedia, Google & more</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          Why Hotels Choose AI for Review Management
        </h2>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ padding: '24px' }}>
            <Globe size={32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Multi-Language Support</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Respond to international guests in their language. Our AI auto-detects and replies in 50+ languages.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Clock size={32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>24/7 Response Ready</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Late-night review? Generate a response anytime. Never let a guest review wait.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Improve OTA Rankings</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Active review responses improve your ranking on Booking.com and other OTAs.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '60px', background: 'var(--gray-50)', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Hospitality-Specific Response Styles</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>Warm & Welcoming:</strong> Perfect for positive reviews - thank guests and invite them back</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>Professional & Apologetic:</strong> Address complaints about rooms, service, or amenities</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>Constructive:</strong> Acknowledge mixed reviews and highlight improvements</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>Multi-language:</strong> Respond to German, French, Spanish, Chinese guests in their language</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
            Elevate Your Guest Experience
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
            Show every guest their feedback matters with thoughtful, timely responses.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Start Free - Hotels Welcome
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)' }}>ReviewResponder</Link> •
            <Link to="/google-review-response-generator" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Google Reviews</Link> •
            <Link to="/yelp-review-reply-tool" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Yelp Reviews</Link> •
            <Link to="/restaurant-review-responses" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Restaurant Reviews</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

// Extension Page
const ExtensionPage = () => {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Chrome size={48} style={{ color: 'var(--primary-600)', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
          Install Chrome Extension
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          3 simple steps - takes less than 1 minute
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
          Download & Unzip
        </h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
          Download the ZIP file and extract it to any folder (e.g. Desktop).
        </p>
        <a
          href="/extension-download.zip"
          download="ReviewResponder-Extension.zip"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={18} />
          Download Extension
        </a>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: 'var(--primary-600)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
          Add to Chrome
        </h2>
        <ol style={{ color: 'var(--gray-600)', paddingLeft: '20px', lineHeight: '2.2', marginBottom: '16px' }}>
          <li>Type <code style={{ background: 'var(--gray-100)', padding: '4px 10px', borderRadius: '4px', fontWeight: '600' }}>chrome://extensions</code> in your address bar</li>
          <li>Turn on <strong>Developer mode</strong> (top-right toggle)</li>
          <li>Click <strong>Load unpacked</strong></li>
          <li>Select the extracted folder</li>
        </ol>
        <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--gray-600)' }}>
          <strong>Tip:</strong> The extension icon will appear in your Chrome toolbar (puzzle piece icon)
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-50), var(--gray-50))', border: '1px solid var(--primary-200)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
          Login & Go!
        </h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
          Click the ReviewResponder icon, login with your account, and start generating responses!
        </p>
        <Link to="/register" className="btn btn-primary">
          Create Free Account
        </Link>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
        Need help? <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)' }}>Contact support</a>
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

// Analytics Page (Pro/Unlimited Only)
const AnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const TONE_COLORS = {
    professional: '#4F46E5',
    friendly: '#10B981',
    formal: '#6366F1',
    apologetic: '#F59E0B'
  };

  const PLATFORM_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setAnalytics(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('upgrade');
      } else {
        setError('Failed to load analytics');
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  // Upgrade required view
  if (error === 'upgrade') {
    return (
      <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <BarChart2 size={40} style={{ color: 'var(--primary-600)' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '16px' }}>
            Get detailed insights into your review response patterns with beautiful charts and statistics.
          </p>

          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>What you'll get:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Total responses over time (line chart)',
                'Responses by tone distribution (pie chart)',
                'Platform breakdown',
                'Weekly comparison insights',
                'Average responses per day'
              ].map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: 'var(--gray-700)' }}>
                  <Check size={18} style={{ color: 'var(--secondary)' }} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--primary-700)' }}>
              <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Available on <strong>Professional</strong> and <strong>Unlimited</strong> plans
            </p>
          </div>

          <Link to="/pricing" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Upgrade to Unlock Analytics
          </Link>
          <Link to="/dashboard" style={{ display: 'block', marginTop: '16px', color: 'var(--gray-500)' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--gray-500)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && error !== 'upgrade') {
    return (
      <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
        <h2 style={{ marginTop: '16px' }}>Failed to load analytics</h2>
        <button onClick={fetchAnalytics} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Try Again
        </button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Capitalize first letter
  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            <BarChart2 size={28} style={{ verticalAlign: 'middle', marginRight: '12px', color: 'var(--primary-600)' }} />
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--gray-500)' }}>Track your review response patterns and insights</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Responses</div>
          <div className="stat-value primary">{analytics?.totalResponses || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{analytics?.insights?.thisWeek || 0}</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            color: analytics?.insights?.weeklyChange >= 0 ? 'var(--secondary)' : 'var(--danger)',
            fontSize: '13px'
          }}>
            {analytics?.insights?.weeklyChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(analytics?.insights?.weeklyChange || 0)} vs last week
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg per Day</div>
          <div className="stat-value">{analytics?.insights?.avgPerDay || '0'}</div>
          <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>Last 30 days</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Most Used Tone</div>
          <div className="stat-value" style={{ fontSize: '20px', textTransform: 'capitalize' }}>
            {analytics?.insights?.mostUsedTone || 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Responses Over Time */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary-600)' }} />
            Responses Over Time
          </h3>
          {analytics?.overTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="responses"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>

        {/* Responses by Tone */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={20} style={{ color: 'var(--primary-600)' }} />
            Responses by Tone
          </h3>
          {analytics?.byTone?.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="60%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={analytics.byTone}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.byTone.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TONE_COLORS[entry.name] || PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {analytics.byTone.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: TONE_COLORS[entry.name] || PLATFORM_COLORS[index % PLATFORM_COLORS.length]
                    }} />
                    <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{entry.name}</span>
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', marginLeft: 'auto' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Responses by Platform */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} style={{ color: 'var(--primary-600)' }} />
            Responses by Platform
          </h3>
          {analytics?.byPlatform?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.byPlatform} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={capitalize}
                  width={80}
                />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>

        {/* Responses by Rating */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} style={{ color: 'var(--primary-600)' }} />
            Responses by Review Rating
          </h3>
          {analytics?.byRating?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.byRating.sort((a, b) => a.rating - b.rating)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="rating"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(v) => `${v} ★`}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => `${v} Star Reviews`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No rating data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/extension" element={<ExtensionPage />} />
          <Route path="/google-review-response-generator" element={<GoogleReviewPage />} />
          <Route path="/yelp-review-reply-tool" element={<YelpReviewPage />} />
          <Route path="/restaurant-review-responses" element={<RestaurantReviewPage />} />
          <Route path="/hotel-review-management" element={<HotelReviewPage />} />
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
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-docs"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <LazyApiDocsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
