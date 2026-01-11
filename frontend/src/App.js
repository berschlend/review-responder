import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { MessageSquare, Star, Zap, Shield, Copy, Check, LogOut, LogIn, Menu, X, ChevronRight, Sparkles, Globe, Mail, Send, HelpCircle, Settings, Building, Save, Chrome, Download, RefreshCw, Users, Lock, CreditCard, Award, Layers, FileText, Clock, AlertCircle, BookOpen, Trash2, BarChart2, TrendingUp, TrendingDown, PieChart, Key, Eye, EyeOff, ExternalLink, Code, Sun, Moon, Calendar, Filter, Info, ArrowRight, PartyPopper, Utensils, CheckCircle, Keyboard, Store, MapPin, Wrench, Scissors, Car, Heart, User, Bell, ChevronDown, Edit3, LayoutDashboard, Play, Video } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Lazy loaded components for code splitting
const LazyApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
import ApiTab from './components/ApiTab';

// Loading Spinner for Suspense fallback
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
  </div>
);

// Google Sign-In Client ID (set in environment or hardcode for production)
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '395576602784-inhppfo12c9o26okl6g3dgnb2cslqdv1.apps.googleusercontent.com';

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

// Google Sign-In Button Component
const GoogleSignInButton = ({ onSuccess, onError, text = 'Sign in with Google' }) => {
  const buttonRef = React.useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      onError?.('Failed to load Google Sign-In');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup not needed as script should persist
    };
  }, [onError]);

  useEffect(() => {
    if (!scriptLoaded || !GOOGLE_CLIENT_ID || !buttonRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('No credential received from Google');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Responsive width: use container width or max 280px
      const containerWidth = buttonRef.current?.parentElement?.offsetWidth || 280;
      const buttonWidth = Math.min(containerWidth - 20, 280);

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: text === 'Sign up with Google' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        width: buttonWidth
      });
    } catch (error) {
      console.error('Google Sign-In initialization error:', error);
      onError?.('Failed to initialize Google Sign-In');
    }
  }, [scriptLoaded, onSuccess, onError, text]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Don't render if no client ID configured
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
      <div ref={buttonRef}></div>
    </div>
  );
};

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'https://review-responder.onrender.com/api';
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
    // Check for referral/affiliate codes in localStorage
    const referralCode = localStorage.getItem('referralCode');
    const affiliateCode = localStorage.getItem('affiliateCode');

    // Get UTM parameters from sessionStorage (saved from landing pages)
    let utmParams = {};
    try {
      const storedUtm = sessionStorage.getItem('utm_params');
      if (storedUtm) {
        utmParams = JSON.parse(storedUtm);
      }
    } catch (e) {
      console.log('No UTM params found');
    }

    const res = await api.post('/auth/register', {
      email,
      password,
      businessName,
      referralCode,
      affiliateCode,
      utmSource: utmParams.utm_source,
      utmMedium: utmParams.utm_medium,
      utmCampaign: utmParams.utm_campaign,
      utmContent: utmParams.utm_content,
      utmTerm: utmParams.utm_term,
      landingPage: utmParams.landing_page
    });
    localStorage.setItem('token', res.data.token);
    // Clear codes after successful registration
    if (referralCode) localStorage.removeItem('referralCode');
    if (affiliateCode) localStorage.removeItem('affiliateCode');
    // Clear UTM params after registration
    sessionStorage.removeItem('utm_params');
    setUser(res.data.user);
    return res.data;
  };

  const loginWithGoogle = async (credential) => {
    // Get referral/affiliate codes from localStorage
    const referralCode = localStorage.getItem('referralCode');
    const affiliateCode = localStorage.getItem('affiliateCode');

    // Get UTM parameters from sessionStorage
    let utmParams = {};
    try {
      const storedUtm = sessionStorage.getItem('utm_params');
      if (storedUtm) {
        utmParams = JSON.parse(storedUtm);
      }
    } catch (e) {
      console.log('No UTM params found');
    }

    const res = await api.post('/auth/google', {
      credential,
      referralCode,
      affiliateCode,
      utmParams
    });

    localStorage.setItem('token', res.data.token);
    // Clear codes after successful login/registration
    if (referralCode) localStorage.removeItem('referralCode');
    if (affiliateCode) localStorage.removeItem('affiliateCode');
    sessionStorage.removeItem('utm_params');
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

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        return res.data.user;
      } catch (error) {
        console.error('Failed to refresh user:', error);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading, updateUser, refreshUser }}>
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

// Protected Route with optional admin check
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admin check - only specific email can access admin routes
  if (requireAdmin && user.email?.toLowerCase() !== 'berend.mainz@web.de') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Navbar Component
// Profile Menu Dropdown Component
const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Get user initials
  const getInitials = () => {
    if (user?.businessName) {
      return user.businessName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '4px 12px 4px 4px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {getInitials()}
          </div>
        )}
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: 'var(--text-secondary)'
          }}
        />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          minWidth: '240px',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* User Info Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)'
          }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
              {user?.businessName || 'Your Account'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              {user?.email}
            </div>
            <span
              className={`badge ${user?.plan === 'free' ? 'badge-warning' : 'badge-success'}`}
              style={{ marginTop: '8px', display: 'inline-block' }}
            >
              {user?.plan?.toUpperCase()} Plan
            </span>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px' }}>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <User size={16} />
              Account Settings
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Building size={16} />
              Business Settings
            </Link>

            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          {/* Logout */}
          <div style={{
            padding: '8px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--danger)',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-content">
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <MessageSquare size={24} />
            ReviewResponder
          </Link>

          {/* Desktop Menu */}
          <div className="navbar-menu">
            {user ? (
              <>
                <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                <Link to="/pricing" className="navbar-link">Upgrade</Link>
                <ProfileMenu />
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

          {/* Hamburger Button (Mobile) */}
          <button
            className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        {user ? (
          <>
            <Link to="/dashboard" onClick={closeMobileMenu}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link to="/pricing" onClick={closeMobileMenu}>
              <CreditCard size={20} />
              Upgrade Plan
            </Link>
            <Link to="/profile" onClick={closeMobileMenu}>
              <User size={20} />
              Profile
            </Link>
            <button onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button onClick={handleLogout} style={{ color: 'var(--danger)' }}>
              <LogOut size={20} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/pricing" onClick={closeMobileMenu}>
              <CreditCard size={20} />
              Pricing
            </Link>
            <Link to="/support" onClick={closeMobileMenu}>
              <HelpCircle size={20} />
              Support
            </Link>
            <Link to="/login" onClick={closeMobileMenu}>
              <LogIn size={20} />
              Login
            </Link>
            <button onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <Link to="/register" onClick={closeMobileMenu} style={{ background: 'var(--primary)', color: 'white' }}>
              <Sparkles size={20} />
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </>
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
      // Double-check: Prevent multiple triggers
      if (sessionStorage.getItem('exitIntentShown')) return;

      // Detect when mouse moves to top of viewport (likely going to tabs/address bar)
      if (e.clientY <= 0) {
        // 1. Sofort sessionStorage setzen
        sessionStorage.setItem('exitIntentShown', 'true');
        // 2. Event-Listener entfernen (verhindert weitere Aufrufe)
        document.removeEventListener('mouseleave', handleMouseLeave);
        // 3. Popup anzeigen
        setIsVisible(true);
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
        discountCode: 'EARLY50',
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
            Get 50% off your subscription - forever!
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
                  🎁 Exclusive Offer: Save 50%
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
                  {loading ? 'Processing...' : 'Get My 50% Discount'}
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
                background: '#d1fae5',
                borderRadius: '50%',
                marginBottom: '16px'
              }}>
                <Check size={32} style={{ color: '#10b981' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                🎉 50% OFF Unlocked!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                Your exclusive discount is ready. We also sent the link to your email.
              </p>
              <Link
                to="/pricing?discount=EARLY50"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => setIsVisible(false)}
              >
                🎁 Claim 50% Discount
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ PRODUCT HUNT LAUNCH COMPONENTS ============

// Configuration - Set these on launch day!
const PRODUCT_HUNT_CONFIG = {
  isLaunched: false, // Set to true on launch day
  launchEndTime: null, // Set to new Date('2025-01-20T23:59:59-08:00') on launch day (24h after launch)
  productHuntUrl: 'https://www.producthunt.com/posts/reviewresponder', // Update with actual URL
};

// Product Hunt Badge Component
const ProductHuntBadge = ({ style = {} }) => {
  if (!PRODUCT_HUNT_CONFIG.isLaunched) return null;

  return (
    <a
      href={PRODUCT_HUNT_CONFIG.productHuntUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #DA552F 0%, #FF6154 100%)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(218, 85, 47, 0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(218, 85, 47, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(218, 85, 47, 0.3)';
      }}
    >
      <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40Z" fill="white"/>
        <path d="M22.5 20H17.5V12.5H22.5C24.575 12.5 26.25 14.175 26.25 16.25C26.25 18.325 24.575 20 22.5 20Z" fill="#DA552F"/>
        <path d="M17.5 12.5H15V27.5H17.5V12.5Z" fill="#DA552F"/>
        <path d="M22.5 22.5H17.5V27.5H22.5V22.5Z" fill="#DA552F"/>
      </svg>
      Featured on Product Hunt
    </a>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.expired) return null;

  const TimeBlock = ({ value, label }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        minWidth: '50px',
        fontSize: '24px',
        fontWeight: '700',
        fontFamily: 'monospace'
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <span style={{ fontSize: '24px', fontWeight: '700' }}>:</span>
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <span style={{ fontSize: '24px', fontWeight: '700' }}>:</span>
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </div>
  );
};

// Product Hunt Launch Banner - Shows at top of page on launch day
const ProductHuntLaunchBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  // Check URL for Product Hunt launch mode
  const urlParams = new URLSearchParams(window.location.search);
  const isFromProductHunt = urlParams.get('ref') === 'producthunt' || PRODUCT_HUNT_CONFIG.isLaunched;

  if (!isFromProductHunt || !isVisible || isExpired) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #DA552F 0%, #FF6154 100%)',
      color: 'white',
      padding: '12px 20px',
      position: 'relative',
      zIndex: 1000
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PartyPopper size={24} />
          <span style={{ fontSize: '16px', fontWeight: '600' }}>
            Product Hunt Launch Special: <strong>60% OFF</strong> for the next 24 hours!
          </span>
        </div>

        {PRODUCT_HUNT_CONFIG.launchEndTime && (
          <CountdownTimer
            endTime={PRODUCT_HUNT_CONFIG.launchEndTime}
            onExpire={() => setIsExpired(true)}
          />
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <code style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            HUNTLAUNCH
          </code>
          <button
            onClick={() => navigate('/pricing?discount=HUNTLAUNCH')}
            style={{
              background: 'white',
              color: '#DA552F',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Claim Offer <ArrowRight size={16} />
          </button>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.7
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// ============ END PRODUCT HUNT COMPONENTS ============

// Feedback Popup Component (shown after 3 responses)
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
              : 'We\'d love to hear your thoughts!'}
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
  const location = useLocation();
  const [testimonials, setTestimonials] = useState([]);
  const [referralBanner, setReferralBanner] = useState(null);
  const [affiliateBanner, setAffiliateBanner] = useState(null);

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

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    if (refCode) {
      // Validate referral code
      api.get(`/referrals/validate/${refCode}`)
        .then(res => {
          if (res.data.valid) {
            setReferralBanner({
              referrerName: res.data.referrerName,
              bonus: res.data.bonus
            });
            // Store referral code for registration
            localStorage.setItem('referralCode', refCode.toUpperCase());
          }
        })
        .catch(() => {
          // Invalid code, ignore
        });
    }
  }, [location.search]);

  // Check for affiliate code in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const affCode = params.get('aff');
    if (affCode) {
      // Validate affiliate code
      api.get(`/affiliate/validate/${affCode}`)
        .then(res => {
          if (res.data.valid) {
            setAffiliateBanner({
              affiliateName: res.data.affiliateName
            });
            // Store affiliate code for registration
            localStorage.setItem('affiliateCode', affCode.toUpperCase());
          }
        })
        .catch(() => {
          // Invalid code, ignore
        });
    }
  }, [location.search]);

  return (
    <div>
      <ExitIntentPopup />
      <ProductHuntLaunchBanner />

      {/* Referral Banner */}
      {referralBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '15px'
        }}>
          <span style={{ fontWeight: '600' }}>{referralBanner.referrerName}</span> invited you!
          Sign up now and get <span style={{ fontWeight: '600' }}>{referralBanner.bonus}</span>
        </div>
      )}

      {/* Affiliate Banner */}
      {affiliateBanner && !referralBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '15px'
        }}>
          Recommended by <span style={{ fontWeight: '600' }}>{affiliateBanner.affiliateName}</span>!
          Sign up now to get started.
        </div>
      )}
      <section className="hero">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Link to="/pricing?discount=EARLY50" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Zap size={14} />
              🎁 50% OFF - Click to Claim
            </Link>
            <ProductHuntBadge />
          </div>
          <h1 className="hero-title">
            Respond to Reviews<br />in Seconds, Not Hours
          </h1>
          <p className="hero-subtitle">
            AI-powered review responses for busy business owners. Generate professional,
            personalized replies to Google, Yelp, and other platform reviews instantly.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">
              <Sparkles size={20} />
              Start Free Trial
            </Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg">
              View Pricing
            </Link>
          </div>
          <p style={{ marginTop: '16px', color: 'var(--gray-500)', fontSize: '14px' }}>
            20 free responses included. No credit card required.
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

          {/* Demo Video Section - Hidden until video is ready
          <div style={{
            marginTop: '48px',
            maxWidth: '800px',
            margin: '48px auto 0',
            position: 'relative'
          }}>
            ... Video content here - uncomment when YouTube video ID is ready ...
          </div>
          */}
        </div>
      </section>

      {/* Chrome Extension Section - Key Selling Point */}
      <section className="container" style={{ marginBottom: '60px', marginTop: '60px' }}>
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

            {/* Extension Demo Video Preview */}
            <div style={{ flex: '0 0 280px', minWidth: '240px' }}>
              <div style={{
                background: '#0d0d1a',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '16/9',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="extension-video-preview"
              >
                {/* Play Button */}
                <div className="play-overlay" style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(79, 70, 229, 0.9)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s, background 0.2s',
                  zIndex: 2
                }}>
                  <Play size={28} fill="white" style={{ marginLeft: '3px' }} />
                </div>
                {/* Duration Badge */}
                <span style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  0:45
                </span>
                {/* Label */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Video size={14} style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>Extension Demo</span>
                </div>
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
          <p style={{ fontSize: '16px', color: 'var(--gray-600)', marginBottom: '24px' }}>
            We just launched! Get 50% off your subscription - limited time only.
          </p>

          <Link
            to="/pricing?discount=EARLY50"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: '700',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'; }}
          >
            🎁 Claim 50% Discount
            <ArrowRight size={20} />
          </Link>

          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '16px' }}>
            Limited time • 30-day money-back guarantee
          </p>
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
                "Really happy the crust worked for you. We let our dough rest 48 hours, and it makes all the difference. See you next time."
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
                "45 minutes and cold food. That's on us, and we're sorry. Not the experience we want anyone to have. Reach out to us directly and we'll make it right."
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
                "Den Hinweis zu den Portionen nehmen wir uns zu Herzen. Danke für die Ehrlichkeit. Freut uns, dass der Rest gepasst hat."
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
            Generate 20 responses free • No credit card required
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
            <Link
              to="/pricing?discount=EARLY50"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              🎁 Get 50% OFF
              <ArrowRight size={14} />
            </Link>
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
                <li><a href="mailto:support@tryreviewresponder.com">Contact</a></li>
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
      <p style={{ marginTop: '12px' }}>To exercise these rights, email us at <a href="mailto:support@tryreviewresponder.com" style={{ color: 'var(--primary-600)' }}>support@tryreviewresponder.com</a></p>

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
      <p>Questions about this policy? Contact us at <a href="mailto:support@tryreviewresponder.com" style={{ color: 'var(--primary-600)' }}>support@tryreviewresponder.com</a></p>
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
        <li>Free tier: 20 responses per month, no payment required</li>
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
      <p>Questions? Email us at <a href="mailto:support@tryreviewresponder.com" style={{ color: 'var(--primary-600)' }}>support@tryreviewresponder.com</a></p>
    </div>
  </div>
);

// Pricing Cards Component
const PricingCards = ({ showFree = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState(null); // Track which plan is loading

  // Get discount code from URL parameter (e.g., ?discount=EARLY50)
  const urlParams = new URLSearchParams(location.search);
  const discountFromUrl = urlParams.get('discount');

  // Valid discount codes
  const validDiscountCodes = ['EARLY50', 'SAVE20', 'HUNTLAUNCH'];
  const activeDiscount = validDiscountCodes.includes(discountFromUrl?.toUpperCase())
    ? discountFromUrl.toUpperCase()
    : null;

  const handleSubscribe = async (plan) => {
    if (!user) {
      // Preserve discount code when redirecting to register
      const registerUrl = activeDiscount ? `/register?discount=${activeDiscount}` : '/register';
      navigate(registerUrl);
      return;
    }

    setLoadingPlan(plan); // Start loading
    try {
      const checkoutData = {
        plan,
        billing: billingCycle
      };

      // Only add discount code if valid one is present in URL
      if (activeDiscount) {
        checkoutData.discountCode = activeDiscount;
      }

      const res = await api.post('/billing/create-checkout', checkoutData);
      window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
      setLoadingPlan(null); // Stop loading on error
    }
  };

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      responses: 20,
      features: ['✨ 3 Smart AI responses', '⚡ 17 Standard responses', '20 total per month', 'All tone options', '50+ languages'],
      buttonText: 'Get Started',
      plan: 'free'
    },
    {
      name: 'Starter',
      monthlyPrice: 29,
      yearlyPrice: 23.20, // 20% off
      responses: 300,
      features: ['✨ 100 Smart AI responses', '⚡ 200 Standard responses', '300 total per month', 'Response history', 'Email support'],
      buttonText: 'Subscribe',
      plan: 'starter'
    },
    {
      name: 'Professional',
      monthlyPrice: 49,
      yearlyPrice: 39.20, // 20% off
      responses: 800,
      features: ['✨ 300 Smart AI responses', '⚡ 500 Standard responses', '800 total per month', 'Bulk generation (20 at once)', 'Analytics dashboard', 'Team members (3)'],
      buttonText: 'Subscribe',
      plan: 'professional',
      popular: true
    },
    {
      name: 'Unlimited',
      monthlyPrice: 99,
      yearlyPrice: 79.20, // 20% off
      responses: 'Unlimited',
      features: ['✨ Unlimited Smart AI', '⚡ Unlimited Standard', 'All premium features', 'Team members (10)', 'API access', 'Priority support'],
      buttonText: 'Subscribe',
      plan: 'unlimited'
    }
  ];

  const displayPlans = showFree ? plans : plans.filter(p => p.plan !== 'free');
  const isYearly = billingCycle === 'yearly';

  // Discount details for each code
  const discountDetails = {
    'EARLY50': { percent: 50, label: 'Launch Special' },
    'SAVE20': { percent: 20, label: 'Special Offer' },
    'HUNTLAUNCH': { percent: 60, label: 'Product Hunt Special' }
  };
  const currentDiscount = activeDiscount ? discountDetails[activeDiscount] : null;

  return (
    <div>
      {/* Active Discount Banner - only shown when discount code is in URL */}
      {currentDiscount && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            ✨ {currentDiscount.percent}% OFF Applied!
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {currentDiscount.label} - Code <strong>{activeDiscount}</strong> will be applied at checkout
          </div>
        </div>
      )}

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
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.plan ? 'Processing...' : plan.buttonText}
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
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

  const handleGoogleSuccess = async (credential) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google Sign-In error:', error);
    toast.error('Google sign-in failed. Please try again.');
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {/* Google Sign-In Button */}
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="Sign in with Google"
        />

        {googleLoading && (
          <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Signing in with Google...
          </div>
        )}

        {/* Divider */}
        {GOOGLE_CLIENT_ID && (
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>
        )}

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, businessName);
      toast.success('Account created! You have 20 free responses.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Account created! You have 20 free responses.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google Sign-In error:', error);
    toast.error('Google sign-up failed. Please try again.');
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start generating review responses for free</p>

        {/* Google Sign-Up Button */}
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="Sign up with Google"
        />

        {googleLoading && (
          <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Creating account with Google...
          </div>
        )}

        {/* Divider */}
        {GOOGLE_CLIENT_ID && (
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>
        )}

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

// Extension Promo Card Component
const ExtensionPromoCard = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="extension-promo-card">
      <div className="extension-promo-header">
        <Chrome size={24} />
        <h3>Chrome Extension</h3>
        <span className="badge-new">NEW</span>
      </div>

      <div className="extension-promo-content">
        <div className="video-preview" onClick={() => setShowVideo(!showVideo)}>
          {showVideo ? (
            <div className="video-placeholder">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Demo Video Coming Soon
              </p>
            </div>
          ) : (
            <div className="video-thumbnail">
              <img
                src="/extension-preview.png"
                alt="Chrome Extension Preview"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="video-thumbnail-fallback" style={{ display: 'none' }}>
                <Chrome size={32} style={{ opacity: 0.5 }} />
              </div>
              <div className="play-overlay">
                <Play size={32} fill="white" />
              </div>
              <span className="video-duration">Demo</span>
            </div>
          )}
        </div>

        <div className="extension-benefits">
          <h4>Respond to Reviews 10x Faster</h4>
          <ul>
            <li><CheckCircle size={16} /> One-click responses on Google Maps</li>
            <li><CheckCircle size={16} /> Works on Yelp, TripAdvisor & more</li>
            <li><CheckCircle size={16} /> Auto-detects review language</li>
          </ul>

          <div className="extension-ctas">
            <Link to="/extension" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} />
              Get Chrome Extension
            </Link>
          </div>
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
  const [aiModel, setAiModel] = useState('auto'); // 'auto', 'smart', 'standard'
  const [lastAiModel, setLastAiModel] = useState(null); // Track which AI was used
  const [generating, setGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');
  const [updatingTemplate, setUpdatingTemplate] = useState(false);

  // Bulk generation state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkPlatform, setBulkPlatform] = useState('google');
  const [bulkTone, setBulkTone] = useState('professional');
  const [bulkOutputLanguage, setBulkOutputLanguage] = useState('auto');
  const [bulkAiModel, setBulkAiModel] = useState('auto'); // 'auto', 'smart', 'standard'
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

  // Keyboard shortcuts help modal
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Dashboard error state
  const [dashboardError, setDashboardError] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Effective plan (uses team owner's plan if user is a team member)
  const effectivePlan = stats?.subscription?.plan || user?.plan || 'free';
  const isTeamMember = stats?.isTeamMember || false;

  // Blog Generator state
  const [blogTopics, setBlogTopics] = useState([]);
  const [blogTopic, setBlogTopic] = useState('');
  const [blogCustomTopic, setBlogCustomTopic] = useState('');
  const [blogKeywords, setBlogKeywords] = useState('');
  const [blogLength, setBlogLength] = useState(800);
  const [blogTone, setBlogTone] = useState('informative');
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [blogHistory, setBlogHistory] = useState([]);
  const [loadingBlogHistory, setLoadingBlogHistory] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [copiedBlog, setCopiedBlog] = useState(false);

  // Referral state
  const [referralData, setReferralData] = useState(null);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input/textarea
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+/ or Cmd+/ - Show keyboard help
      if (ctrlOrCmd && e.key === '/') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
        return;
      }

      // Ctrl+Enter or Cmd+Enter - Generate Response (works even when typing)
      if (ctrlOrCmd && e.key === 'Enter' && activeTab === 'single') {
        e.preventDefault();
        // Trigger generate button click
        document.querySelector('[data-action="generate"]')?.click();
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping) return;

      // Ctrl+Shift+C or Cmd+Shift+C - Copy Response
      if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (response) {
          navigator.clipboard.writeText(response);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Response copied!');
        }
        return;
      }

      // Ctrl+1/2/3/4 - Change Tone
      const tones = ['professional', 'friendly', 'formal', 'apologetic'];
      if (ctrlOrCmd && !e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const toneIndex = parseInt(e.key) - 1;
        setTone(tones[toneIndex]);
        toast.success(`Tone: ${tones[toneIndex].charAt(0).toUpperCase() + tones[toneIndex].slice(1)}`);
        return;
      }

      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, response, setTone, setReviewText, setResponse, setRating, setCopied]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    const stripeSuccess = params.get('success');

    const loadDashboard = async () => {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      try {
        // If coming from admin plan change or Stripe, fetch fresh user data FIRST
        if (planParam || stripeSuccess) {
          try {
            console.log('🔄 Fetching fresh user data...');
            const res = await api.get('/auth/me');
            console.log('✅ Got user data:', res.data.user);
            console.log('📋 Plan from API:', res.data.user.plan);
            updateUser(res.data.user);
            console.log('✅ updateUser called');
          } catch (e) {
            console.error('❌ Failed to refresh user data:', e);
          }
        }

        await Promise.all([fetchStats(), fetchHistory(), fetchTemplates(), fetchAllHistory()]);
      } catch (error) {
        console.error('Dashboard load error:', error);
        setDashboardError('Failed to load dashboard data. Please check your connection and try again.');
      } finally {
        setIsLoadingDashboard(false);
      }
    };
    loadDashboard();

    // Check if user needs onboarding
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
    if (user && user.responsesUsed === 0) setIsFirstResponse(true);

    // Handle plan change from admin (new format with ?plan=xxx&_t=timestamp)
    if (planParam) {
      toast.success(`Plan changed to ${planParam.toUpperCase()}!`);
      window.history.replaceState({}, '', '/dashboard');
    }

    // Handle Stripe success
    if (stripeSuccess) {
      window.history.replaceState({}, '', '/dashboard');
      toast.success('Subscription activated! Thank you for subscribing.');
    }
  }, []);

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
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/responses/history?limit=10');
      setHistory(res.data.responses || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      throw error;
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Templates are optional, don't throw
    }
  };

  const fetchReferral = async () => {
    setLoadingReferral(true);
    try {
      const res = await api.get('/referrals');
      setReferralData(res.data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      // Referrals are optional, don't throw
    } finally {
      setLoadingReferral(false);
    }
  };

  const fetchAllHistory = async () => {
    try {
      const res = await api.get('/responses/history?limit=1000');
      setAllHistory(res.data.responses || []);
    } catch (error) {
      console.error('Failed to fetch all history:', error);
      // All history is for export, don't throw
    }
  };

  // Blog Generator functions
  const fetchBlogTopics = async () => {
    try {
      const res = await api.get('/blog/topics');
      setBlogTopics(res.data.topics || []);
    } catch (error) {
      console.error('Failed to fetch blog topics:', error);
    }
  };

  const fetchBlogHistory = async () => {
    setLoadingBlogHistory(true);
    try {
      const res = await api.get('/blog/history');
      setBlogHistory(res.data.articles || []);
    } catch (error) {
      if (error.response?.status !== 403) {
        console.error('Failed to fetch blog history:', error);
      }
    } finally {
      setLoadingBlogHistory(false);
    }
  };

  const generateBlogArticle = async () => {
    const topic = blogTopic || '';
    const customTopic = blogCustomTopic.trim();

    if (!topic && !customTopic) {
      toast.error('Please select a topic or enter a custom topic');
      return;
    }

    setGeneratingBlog(true);
    setGeneratedArticle(null);

    try {
      const res = await api.post('/blog/generate', {
        topic,
        customTopic,
        keywords: blogKeywords,
        length: blogLength,
        tone: blogTone
      });

      setGeneratedArticle(res.data.article);
      fetchBlogHistory();
      toast.success('Blog article generated!');
    } catch (error) {
      if (error.response?.data?.upgrade) {
        toast.error('Blog Generator requires a Pro or Unlimited plan');
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate article');
      }
    } finally {
      setGeneratingBlog(false);
    }
  };

  const loadArticle = async (articleId) => {
    try {
      const res = await api.get(`/blog/${articleId}`);
      setSelectedArticle(res.data.article);
      setGeneratedArticle(res.data.article);
    } catch (error) {
      toast.error('Failed to load article');
    }
  };

  const deleteBlogArticle = async (articleId) => {
    if (!window.confirm('Delete this article?')) return;

    try {
      await api.delete(`/blog/${articleId}`);
      toast.success('Article deleted');
      fetchBlogHistory();
      if (generatedArticle?.id === articleId) {
        setGeneratedArticle(null);
      }
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const copyBlogContent = () => {
    if (!generatedArticle) return;
    const fullContent = `# ${generatedArticle.title}\n\n${generatedArticle.content}`;
    navigator.clipboard.writeText(fullContent);
    setCopiedBlog(true);
    toast.success('Article copied to clipboard!');
    setTimeout(() => setCopiedBlog(false), 2000);
  };

  const downloadBlogAsMarkdown = () => {
    if (!generatedArticle) return;
    const fullContent = `# ${generatedArticle.title}\n\n${generatedArticle.content}`;
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${generatedArticle.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    link.click();
    toast.success('Downloaded as Markdown!');
  };

  const downloadBlogAsText = () => {
    if (!generatedArticle) return;
    // Remove markdown formatting for plain text
    const plainContent = generatedArticle.content
      .replace(/^##\s+/gm, '')
      .replace(/^###\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '');
    const fullContent = `${generatedArticle.title}\n\n${plainContent}`;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${generatedArticle.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    link.click();
    toast.success('Downloaded as Text!');
  };

  // Check if user should see feedback popup (after 3 responses)
  const checkFeedbackStatus = async () => {
    // Don't show if user dismissed in this session
    if (sessionStorage.getItem('feedbackDismissed')) {
      return;
    }
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

  const exportToCSV = () => { if (!canExport) { toast.info('Upgrade to Starter to export your responses'); return; } setExporting(true); try { const f = getFilteredHistory(); if (f.length === 0) { toast.error('No responses'); setExporting(false); return; } const d = f.map(i => ({ Date: new Date(i.created_at).toLocaleDateString(), Platform: i.review_platform||'N/A', Rating: i.review_rating||'N/A', Tone: i.tone||'professional', Review: i.review_text, Response: i.generated_response })); const csv = Papa.unparse(d); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `responses-${new Date().toISOString().split('T')[0]}.csv`; link.click(); toast.success(`Exported ${f.length} to CSV`); } catch (e) { toast.error('Export failed'); } finally { setExporting(false); } };

  const exportToPDF = () => { if (!canExport) { toast.info('Upgrade to Starter to export your responses'); return; } setExporting(true); try { const f = getFilteredHistory(); if (f.length === 0) { toast.error('No responses'); setExporting(false); return; } const doc = new jsPDF(); doc.setFontSize(18); doc.text('Response History', 14, 20); doc.setFontSize(10); doc.text(`${new Date().toLocaleDateString()} | ${f.length} responses`, 14, 28); const t = f.map(i => [new Date(i.created_at).toLocaleDateString(), i.review_platform||'-', i.review_rating||'-', i.review_text.substring(0,40)+'...', i.generated_response.substring(0,50)+'...']); doc.autoTable({ startY: 35, head: [['Date','Platform','Rating','Review','Response']], body: t, styles: { fontSize: 7 }, headStyles: { fillColor: [79,70,229] } }); doc.save(`responses-${new Date().toISOString().split('T')[0]}.pdf`); toast.success(`Exported ${f.length} to PDF`); } catch (e) { toast.error('Export failed'); } finally { setExporting(false); } };

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

  const openEditTemplateModal = (templateId) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setEditingTemplate(template);
      setEditTemplateName(template.name);
      setEditTemplateContent(template.content);
      setShowEditTemplateModal(true);
    }
  };

  const updateTemplate = async () => {
    if (!editTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!editTemplateContent.trim()) {
      toast.error('Template content cannot be empty');
      return;
    }

    setUpdatingTemplate(true);
    try {
      await api.put(`/templates/${editingTemplate.id}`, {
        name: editTemplateName.trim(),
        content: editTemplateContent.trim()
      });
      toast.success('Template updated!');
      setShowEditTemplateModal(false);
      setEditingTemplate(null);
      setEditTemplateName('');
      setEditTemplateContent('');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update template');
    } finally {
      setUpdatingTemplate(false);
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
    setLastAiModel(null);

    try {
      const res = await api.post('/responses/generate', {
        reviewText,
        reviewRating: rating || null,
        platform,
        tone: useTone,
        outputLanguage,
        aiModel,
        businessName: user.businessName,
        customInstructions: customInstructions.trim() || undefined
      });

      setResponse(res.data.response);
      setLastAiModel(res.data.aiModel || 'standard');
      updateUser({
        responsesUsed: res.data.responsesUsed,
        responsesLimit: res.data.responsesLimit
      });
      fetchStats(); // Refresh smart/standard usage
      fetchHistory();

      // Fire confetti on first response!
      if (isFirstResponse) {
        fireConfetti();
        toast.success('Congratulations on your first response!', { icon: '🎉', duration: 4000 });
        setIsFirstResponse(false);
      } else {
        const aiLabel = res.data.aiModel === 'smart' ? 'Smart AI' : 'Standard';
        toast.success(`Response generated with ${aiLabel}!`);
      }
      // Check if user should see feedback popup
      checkFeedbackStatus();
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
        if (error.response.data.suggestion) {
          toast.info(error.response.data.suggestion, { duration: 5000 });
        }
      } else if (error.response?.data?.upgrade) {
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
    // Try separator format: ---
    if (input.includes('---')) {
      return input.split('---').map(r => r.trim()).filter(r => r.length > 0);
    }
    // Try numbered format: "1.", "2.", etc. at start of line
    const numberedPattern = /^\d+\.\s/m;
    if (numberedPattern.test(input)) {
      const reviews = [];
      let currentReview = '';
      const lines = input.split('\n');
      for (const line of lines) {
        if (/^\d+\.\s/.test(line.trim())) {
          if (currentReview.trim()) {
            reviews.push(currentReview.trim());
          }
          currentReview = line.trim().replace(/^\d+\.\s*/, '');
        } else if (line.trim()) {
          currentReview += ' ' + line.trim();
        }
      }
      if (currentReview.trim()) {
        reviews.push(currentReview.trim());
      }
      if (reviews.length > 0) {
        return reviews;
      }
    }
    // Try double-newline separated (paragraphs)
    if (input.includes('\n\n')) {
      const paragraphs = input.split(/\n\n+/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 0);
      if (paragraphs.length > 1) {
        return paragraphs;
      }
    }
    // Fallback: single-line separated
    const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 1) {
      return lines;
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
        outputLanguage: bulkOutputLanguage,
        aiModel: bulkAiModel
      });
      setBulkResults(res.data);
      updateUser({
        responsesUsed: res.data.responsesUsed,
        responsesLimit: res.data.responsesLimit
      });
      fetchStats(); // Refresh smart/standard usage
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

  // Use effectivePlan for team members (they get access to team owner's plan features)
  const canUseBulk = ['starter', 'professional', 'unlimited'].includes(effectivePlan);
  const canUseBlog = ['professional', 'unlimited'].includes(effectivePlan);
  const canUseApi = effectivePlan === 'unlimited';
  const canExport = ['starter', 'professional', 'unlimited'].includes(effectivePlan);

  // Load blog data when switching to blog tab
  useEffect(() => {
    if (activeTab === 'blog') {
      fetchBlogTopics();
      if (canUseBlog) {
        fetchBlogHistory();
      }
    }
  }, [activeTab, canUseBlog]);

  // Calculate usage percentages from stats
  const usagePercent = stats?.usage?.total?.limit
    ? (stats.usage.total.used / stats.usage.total.limit) * 100
    : (user ? (user.responsesUsed / user.responsesLimit) * 100 : 0);
  const smartRemaining = stats?.usage?.smart?.remaining ?? 0;
  const standardRemaining = stats?.usage?.standard?.remaining ?? 0;

  return (
    <div className="dashboard container">
      {/* Onboarding Modal */}
      <OnboardingModal
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Dashboard Error Banner */}
      {dashboardError && (
        <div style={{
          background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          border: '1px solid #F87171',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#B91C1C' }}>Connection Error</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#DC2626' }}>{dashboardError}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ padding: '8px 16px', background: '#DC2626', border: 'none' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingDashboard && !dashboardError && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 0',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--gray-500)' }}>Loading dashboard...</p>
        </div>
      )}

      <div className="dashboard-header" style={{ display: isLoadingDashboard && !dashboardError ? 'none' : undefined }}>
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
            {!['professional', 'unlimited'].includes(effectivePlan) && (
              <span style={{ background: 'var(--primary-600)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', marginLeft: '4px' }}>PRO</span>
            )}
          </Link>
          <Link to="/team" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <Users size={16} />
            Team
            {!['professional', 'unlimited'].includes(effectivePlan) && !isTeamMember && (
              <span style={{ background: 'var(--primary-600)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '600', marginLeft: '4px' }}>PRO</span>
            )}
          </Link>
          <Link to="/settings" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <Settings size={16} />
            Settings
          </Link>
          <span className={`badge ${effectivePlan === 'free' ? 'badge-warning' : 'badge-success'}`}>
            {isTeamMember ? `TEAM (${effectivePlan?.toUpperCase()})` : `${effectivePlan?.toUpperCase()} Plan`}
          </span>
          {effectivePlan === 'free' && !isTeamMember && (
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
        {/* Smart AI Usage */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid var(--primary-200)' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>✨</span> Smart AI
          </div>
          <div className="stat-value primary">
            {stats?.usage?.smart?.used ?? 0}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--gray-500)' }}>
              /{stats?.usage?.smart?.limit ?? 3}
            </span>
          </div>
          <div className="usage-bar" style={{ background: 'rgba(255,255,255,0.5)' }}>
            <div
              className="usage-fill"
              style={{
                width: `${stats?.usage?.smart?.limit ? Math.min((stats.usage.smart.used / stats.usage.smart.limit) * 100, 100) : 0}%`,
                background: 'linear-gradient(90deg, var(--primary-500), var(--primary-600))'
              }}
            />
          </div>
          <p className="mt-1" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
            Best quality responses
          </p>
        </div>

        {/* Standard AI Usage */}
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span> Standard
          </div>
          <div className="stat-value">
            {stats?.usage?.standard?.used ?? 0}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--gray-500)' }}>
              /{stats?.usage?.standard?.limit ?? 17}
            </span>
          </div>
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${stats?.usage?.standard?.limit ? Math.min((stats.usage.standard.used / stats.usage.standard.limit) * 100, 100) : 0}%`,
                background: 'var(--gray-400)'
              }}
            />
          </div>
          <p className="mt-1" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
            Fast & reliable
          </p>
        </div>

        {/* Total / Monthly */}
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">
            {stats?.usage?.total?.used ?? user?.responsesUsed ?? 0}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--gray-500)' }}>
              /{stats?.usage?.total?.limit ?? user?.responsesLimit ?? 20}
            </span>
          </div>
          <div className="usage-bar">
            <div
              className={`usage-fill ${usagePercent > 80 ? 'warning' : ''} ${usagePercent >= 100 ? 'danger' : ''}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="mt-1" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
            {stats?.usage?.total?.remaining ?? (user?.responsesLimit - user?.responsesUsed) ?? 0} remaining
          </p>
        </div>
      </div>

      {/* Chrome Extension Promotion */}
      <ExtensionPromoCard />

      {/* Referral Widget */}
      {referralData && (
        <div style={{ background: 'linear-gradient(135deg, var(--primary-50) 0%, #EDE9FE 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid var(--primary-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} />
                Invite Friends, Get 1 Month Free
              </h3>
              <p style={{ margin: '0 0 12px 0', color: 'var(--gray-600)', fontSize: '14px' }}>
                Share your referral link. When friends subscribe, you both get rewarded!
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <code style={{ background: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: 'var(--primary-600)', border: '1px solid var(--primary-200)' }}>
                  {referralData.referralLink}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralData.referralLink);
                    setCopiedReferralLink(true);
                    setTimeout(() => setCopiedReferralLink(false), 2000);
                    toast.success('Referral link copied!');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedReferralLink ? <Check size={16} /> : <Copy size={16} />}
                  {copiedReferralLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-600)' }}>{referralData.stats?.totalInvited || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Invited</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green-600)' }}>{referralData.stats?.converted || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Converted</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--purple-600)' }}>{referralData.stats?.creditsEarned || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Credits</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0' }}>
        <button
          className="dashboard-tab"
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
          className="dashboard-tab"
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
          className="dashboard-tab"
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
        <button
          className="dashboard-tab"
          onClick={() => setActiveTab('blog')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'blog' ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'blog' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'blog' ? 'var(--primary-600)' : 'var(--gray-600)',
            fontWeight: activeTab === 'blog' ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            marginBottom: '-1px'
          }}
        >
          <BookOpen size={18} />
          Blog Generator
          {!canUseBlog && (
            <span style={{
              background: 'var(--primary-600)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>PRO</span>
          )}
        </button>
        <button
          className="dashboard-tab"
          onClick={() => setActiveTab('api')}
          style={{
            padding: '12px 20px',
            background: activeTab === 'api' ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'api' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'api' ? 'var(--primary-600)' : 'var(--gray-600)',
            fontWeight: activeTab === 'api' ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            marginBottom: '-1px'
          }}
        >
          <Code size={18} />
          API
          {!canUseApi && (
            <span style={{
              background: 'var(--primary-600)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>UNLIMITED</span>
          )}
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
          </div>

          {/* AI Model Selector */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              AI Model
              <FeatureTooltip text="Auto: Uses Smart AI first, then Standard. Smart AI: Best quality. Standard: Fast and reliable.">
                <Info size={14} style={{ color: 'var(--gray-400)', cursor: 'help' }} />
              </FeatureTooltip>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setAiModel('auto')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  border: aiModel === 'auto' ? '2px solid var(--primary-500)' : '2px solid var(--gray-200)',
                  background: aiModel === 'auto' ? 'var(--primary-50)' : 'white'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔄</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Auto</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Best available</div>
              </button>
              <button
                type="button"
                onClick={() => smartRemaining > 0 && setAiModel('smart')}
                disabled={smartRemaining <= 0}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', textAlign: 'center',
                  border: aiModel === 'smart' ? '2px solid var(--primary-500)' : '2px solid var(--gray-200)',
                  background: aiModel === 'smart' ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 'white',
                  cursor: smartRemaining > 0 ? 'pointer' : 'not-allowed',
                  opacity: smartRemaining <= 0 ? 0.5 : 1
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>✨</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Smart AI</div>
                <div style={{ fontSize: '11px', color: smartRemaining > 0 ? 'var(--primary-600)' : 'var(--gray-400)' }}>{smartRemaining} left</div>
              </button>
              <button
                type="button"
                onClick={() => standardRemaining > 0 && setAiModel('standard')}
                disabled={standardRemaining <= 0}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', textAlign: 'center',
                  border: aiModel === 'standard' ? '2px solid var(--gray-500)' : '2px solid var(--gray-200)',
                  background: aiModel === 'standard' ? 'var(--gray-100)' : 'white',
                  cursor: standardRemaining > 0 ? 'pointer' : 'not-allowed',
                  opacity: standardRemaining <= 0 ? 0.5 : 1
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Standard</div>
                <div style={{ fontSize: '11px', color: standardRemaining > 0 ? 'var(--gray-600)' : 'var(--gray-400)' }}>{standardRemaining} left</div>
              </button>
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
                      onClick={() => openEditTemplateModal(selectedTemplate)}
                      style={{ padding: '8px 12px' }}
                      title="Edit template"
                    >
                      <Edit3 size={16} />
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

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">
              <Edit3 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Custom Instructions (optional)
            </label>
            <textarea
              className="form-textarea"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Add specific instructions for the AI, e.g.: 'Always mention our 24/7 support' or 'Include a discount code SAVE10'"
              rows={2}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
              Guide the AI with specific requirements for your response
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => generateResponse()}
            disabled={generating || !reviewText.trim()}
            style={{ width: '100%', marginTop: '8px' }}
            data-action="generate"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Generated Response
            </h2>
            {lastAiModel && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: lastAiModel === 'smart'
                  ? 'linear-gradient(135deg, var(--primary-100), var(--primary-200))'
                  : 'var(--gray-100)',
                color: lastAiModel === 'smart' ? 'var(--primary-700)' : 'var(--gray-600)'
              }}>
                {lastAiModel === 'smart' ? '✨ Smart AI' : '⚡ Standard'}
              </span>
            )}
          </div>

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
                    rows={25}
                    style={{ fontFamily: 'inherit', minHeight: '700px' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
                    Supported formats: One review per line, CSV format ("review1","review2"), or separated by ---
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                </div>

                {/* Bulk AI Model Selector */}
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">AI Model</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setBulkAiModel('auto')} style={{
                      flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                      border: bulkAiModel === 'auto' ? '2px solid var(--primary-500)' : '2px solid var(--gray-200)',
                      background: bulkAiModel === 'auto' ? 'var(--primary-50)' : 'white'
                    }}>
                      <span style={{ marginRight: '6px' }}>🔄</span>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Auto</span>
                    </button>
                    <button type="button" onClick={() => smartRemaining > 0 && setBulkAiModel('smart')} disabled={smartRemaining <= 0} style={{
                      flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center',
                      border: bulkAiModel === 'smart' ? '2px solid var(--primary-500)' : '2px solid var(--gray-200)',
                      background: bulkAiModel === 'smart' ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : 'white',
                      cursor: smartRemaining > 0 ? 'pointer' : 'not-allowed', opacity: smartRemaining <= 0 ? 0.5 : 1
                    }}>
                      <span style={{ marginRight: '6px' }}>✨</span>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Smart ({smartRemaining})</span>
                    </button>
                    <button type="button" onClick={() => standardRemaining > 0 && setBulkAiModel('standard')} disabled={standardRemaining <= 0} style={{
                      flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center',
                      border: bulkAiModel === 'standard' ? '2px solid var(--gray-500)' : '2px solid var(--gray-200)',
                      background: bulkAiModel === 'standard' ? 'var(--gray-100)' : 'white',
                      cursor: standardRemaining > 0 ? 'pointer' : 'not-allowed', opacity: standardRemaining <= 0 ? 0.5 : 1
                    }}>
                      <span style={{ marginRight: '6px' }}>⚡</span>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Standard ({standardRemaining})</span>
                    </button>
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

      {/* Blog Generator Tab */}
      {activeTab === 'blog' && (
        <div>
          {!canUseBlog ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-100), var(--primary-50))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <BookOpen size={40} style={{ color: 'var(--primary-600)' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>SEO Blog Generator</h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Generate SEO-optimized blog articles about review management to drive organic traffic to your business.
                Available for Professional and Unlimited plans.
              </p>
              <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '24px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>What you get:</h3>
                <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} /> AI-generated SEO articles
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} /> 12+ pre-defined topics
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} /> Custom keyword targeting
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} /> Meta descriptions included
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} style={{ color: 'var(--success)' }} /> Export as Markdown or Text
                  </li>
                </ul>
              </div>
              <Link to="/pricing" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Generator Form */}
              <div className="card">
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} />
                  Generate Blog Article
                </h2>

                <div className="form-group">
                  <label className="form-label">Select Topic</label>
                  <select
                    className="form-select"
                    value={blogTopic}
                    onChange={(e) => {
                      setBlogTopic(e.target.value);
                      if (e.target.value) {
                        const topic = blogTopics.find(t => t.id === e.target.value);
                        if (topic) {
                          setBlogKeywords(topic.keywords.join(', '));
                          setBlogCustomTopic('');
                        }
                      }
                    }}
                  >
                    <option value="">-- Select a topic --</option>
                    {blogTopics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Or Enter Custom Topic</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., How to Respond to Restaurant Reviews"
                    value={blogCustomTopic}
                    onChange={(e) => {
                      setBlogCustomTopic(e.target.value);
                      if (e.target.value) setBlogTopic('');
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Keywords (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="review management, customer feedback, online reputation"
                    value={blogKeywords}
                    onChange={(e) => setBlogKeywords(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Article Length: {blogLength} words</label>
                  <input
                    type="range"
                    min="500"
                    max="2000"
                    step="100"
                    value={blogLength}
                    onChange={(e) => setBlogLength(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-500)' }}>
                    <span>500 (Short)</span>
                    <span>1000 (Medium)</span>
                    <span>2000 (Long)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select
                    className="form-select"
                    value={blogTone}
                    onChange={(e) => setBlogTone(e.target.value)}
                  >
                    <option value="informative">Informative (Educational)</option>
                    <option value="persuasive">Persuasive (Marketing)</option>
                    <option value="casual">Casual (Friendly)</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={generateBlogArticle}
                  disabled={generatingBlog || (!blogTopic && !blogCustomTopic.trim())}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {generatingBlog ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                      Generating Article...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Article
                    </>
                  )}
                </button>

                {/* Article History */}
                {blogHistory.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray-700)' }}>
                      Recent Articles
                    </h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {blogHistory.map(article => (
                        <div
                          key={article.id}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--gray-200)',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: generatedArticle?.id === article.id ? 'var(--primary-50)' : 'transparent'
                          }}
                          onClick={() => loadArticle(article.id)}
                        >
                          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--gray-900)' }}>
                            {article.title.substring(0, 50)}{article.title.length > 50 ? '...' : ''}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--gray-500)' }}>
                            <span>{article.wordCount} words</span>
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Article Preview */}
              <div className="card" style={{ height: 'fit-content' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} />
                  Article Preview
                </h2>

                {generatedArticle ? (
                  <>
                    {/* Article Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={copyBlogContent} style={{ padding: '8px 12px', fontSize: '13px' }}>
                        {copiedBlog ? <Check size={14} /> : <Copy size={14} />}
                        {copiedBlog ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="btn btn-secondary" onClick={downloadBlogAsMarkdown} style={{ padding: '8px 12px', fontSize: '13px' }}>
                        <Download size={14} /> .md
                      </button>
                      <button className="btn btn-secondary" onClick={downloadBlogAsText} style={{ padding: '8px 12px', fontSize: '13px' }}>
                        <Download size={14} /> .txt
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteBlogArticle(generatedArticle.id)} style={{ padding: '8px 12px', fontSize: '13px', marginLeft: 'auto' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>

                    {/* Meta Description */}
                    {generatedArticle.metaDescription && (
                      <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '4px' }}>
                          META DESCRIPTION
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--gray-700)' }}>
                          {generatedArticle.metaDescription}
                        </div>
                      </div>
                    )}

                    {/* Article Stats */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: 'var(--gray-500)' }}>
                      <span><strong>{generatedArticle.wordCount}</strong> words</span>
                      <span>Tone: <strong>{generatedArticle.tone}</strong></span>
                      {generatedArticle.keywords && <span>Keywords: {generatedArticle.keywords.split(',').slice(0, 3).join(', ')}</span>}
                    </div>

                    {/* Article Content */}
                    <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px' }}>
                      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--gray-900)' }}>
                        {generatedArticle.title}
                      </h1>
                      <div
                        style={{
                          fontSize: '15px',
                          lineHeight: '1.7',
                          color: 'var(--gray-700)',
                          maxHeight: '500px',
                          overflowY: 'auto'
                        }}
                        className="blog-content"
                      >
                        {generatedArticle.content.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return <h2 key={i} style={{ fontSize: '20px', fontWeight: '600', marginTop: '24px', marginBottom: '12px', color: 'var(--gray-900)' }}>{line.replace('## ', '')}</h2>;
                          } else if (line.startsWith('### ')) {
                            return <h3 key={i} style={{ fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '8px', color: 'var(--gray-800)' }}>{line.replace('### ', '')}</h3>;
                          } else if (line.startsWith('- ')) {
                            return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px' }}>{line.replace('- ', '')}</li>;
                          } else if (line.startsWith('* ')) {
                            return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px' }}>{line.replace('* ', '')}</li>;
                          } else if (line.match(/^\d+\. /)) {
                            return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px', listStyleType: 'decimal' }}>{line.replace(/^\d+\. /, '')}</li>;
                          } else if (line.trim() === '') {
                            return <br key={i} />;
                          } else {
                            // Handle bold text
                            const parts = line.split(/(\*\*[^*]+\*\*)/g);
                            return (
                              <p key={i} style={{ marginBottom: '12px' }}>
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray-500)' }}>
                    <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Select a topic and generate an article to see the preview here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && <ApiTab user={user} api={api} effectivePlan={effectivePlan} isTeamMember={isTeamMember} />}

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

      {/* Edit Template Modal */}
      {showEditTemplateModal && editingTemplate && (
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
        }} onClick={() => setShowEditTemplateModal(false)}>
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} />
              Edit Template
            </h2>

            <div className="form-group">
              <label className="form-label">Template Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Positive 5-star response"
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Template Content</label>
              <textarea
                className="form-textarea"
                placeholder="Template response content..."
                value={editTemplateContent}
                onChange={(e) => setEditTemplateContent(e.target.value)}
                rows={8}
                style={{ resize: 'vertical', minHeight: '150px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditTemplateModal(false);
                  setEditingTemplate(null);
                  setEditTemplateName('');
                  setEditTemplateContent('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={updateTemplate}
                disabled={updatingTemplate || !editTemplateName.trim() || !editTemplateContent.trim()}
                style={{ flex: 1 }}
              >
                {updatingTemplate ? 'Saving...' : 'Save Changes'}
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
                <span style={{ color: 'var(--gray-700)' }}>Generate / New Response</span>
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
        onClose={() => {
          setShowFeedbackPopup(false);
          sessionStorage.setItem('feedbackDismissed', 'true');
        }}
        onSubmit={() => setShowFeedbackPopup(false)}
      />
    </div>
  );
};

// Profile / Account Settings Page
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('account');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailWeeklySummary: true,
    emailUsageAlerts: true,
    emailBillingUpdates: true
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load notification settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const res = await api.get('/settings/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle email change request
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) {
      return toast.error('Please enter a new email address');
    }
    setChangingEmail(true);
    try {
      await api.post('/auth/change-email-request', { newEmail, password: emailPassword });
      toast.success('Confirmation email sent! Check your inbox.');
      setNewEmail('');
      setEmailPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to request email change');
    } finally {
      setChangingEmail(false);
    }
  };

  // Handle notification settings save
  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await api.put('/settings/notifications', notifications);
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return toast.error('Please type DELETE to confirm');
    }
    setDeleting(true);
    try {
      await api.delete('/auth/delete-account', {
        data: { password: deletePassword, confirmation: deleteConfirmation }
      });
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  // Format join date
  const formatJoinDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: AlertCircle }
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px', textDecoration: 'none' }}>
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your account, security, and notification preferences</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 1 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? '600' : '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <tab.icon size={16} />
            <span className="hide-mobile">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} /> Account Information
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Profile Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '600' }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>{user?.businessName || 'No business name set'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{user?.email}</div>
                {user?.oauthProvider && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Signed in with {user.oauthProvider}
                  </span>
                )}
              </div>
            </div>

            {/* Account Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</div>
                <div style={{ fontWeight: '500' }}>{user?.email}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Member Since</div>
                <div style={{ fontWeight: '500' }}>{formatJoinDate(user?.createdAt)}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Plan</div>
                <div style={{ fontWeight: '500' }}>
                  {user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1)}
                  {user?.subscriptionStatus === 'active' && <span style={{ color: 'var(--secondary)', marginLeft: '8px' }}>Active</span>}
                  {user?.teamInfo?.isTeamMember && (
                    <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>
                      via {user.teamInfo.teamOwnerBusiness || user.teamInfo.teamOwnerEmail}'s Team
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Responses Used</div>
                <div style={{ fontWeight: '500' }}>{user?.responsesUsed || 0} / {user?.responsesLimit === 999999 ? '∞' : user?.responsesLimit}</div>
              </div>
            </div>

            {/* Change Email Section */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Change Email Address</h3>
              <form onSubmit={handleChangeEmail} style={{ display: 'grid', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Email Address</label>
                  <input type="email" className="form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email address" />
                </div>
                {user?.hasPassword && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-input" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="Enter your password to confirm" />
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={changingEmail || !newEmail} style={{ width: 'fit-content' }}>
                  {changingEmail ? 'Sending...' : 'Send Confirmation Email'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} /> Security
          </h2>

          {user?.oauthProvider && !user?.hasPassword ? (
            <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                You signed in with Google. Password management is handled by Google.
              </p>
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Manage Google Security <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <input type={showPasswords ? 'text' : 'password'} className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input type={showPasswords ? 'text' : 'password'} className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 8 characters)" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input type={showPasswords ? 'text' : 'password'} className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
                Show passwords
              </label>
              <button type="submit" className="btn btn-primary" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} style={{ width: 'fit-content' }}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} /> Email Notifications
          </h2>

          {loadingNotifications ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { key: 'emailWeeklySummary', title: 'Weekly Summary', description: 'Get a weekly email with your response stats and tips' },
                { key: 'emailUsageAlerts', title: 'Usage Alerts', description: 'Get notified when you reach 80% of your monthly limit' },
                { key: 'emailBillingUpdates', title: 'Billing Updates', description: 'Receive emails about subscription renewals and invoices' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: notifications[item.key] ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '26px', transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute', height: '20px', width: '20px',
                        left: notifications[item.key] ? '24px' : '3px', bottom: '3px',
                        background: 'white', borderRadius: '50%', transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleSaveNotifications} disabled={savingNotifications} style={{ width: 'fit-content', marginTop: '8px' }}>
                {savingNotifications ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="card" style={{ border: '1px solid var(--danger)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <AlertCircle size={20} /> Danger Zone
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>These actions are irreversible. Please proceed with caution.</p>

          <div style={{ padding: '20px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Delete Account</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
              Your subscription will be cancelled and you will lose access immediately.
            </p>
            <button className="btn" onClick={() => setShowDeleteModal(true)} style={{ background: 'var(--danger)', color: 'white' }}>
              <Trash2 size={16} /> Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', maxWidth: '450px', width: '100%' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={24} /> Delete Account
            </h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>This will permanently delete:</p>
            <ul style={{ marginBottom: '20px', paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <li>All your generated responses</li>
              <li>Your saved templates</li>
              <li>Your team members</li>
              <li>Your subscription (will be cancelled)</li>
              <li>All associated data</li>
            </ul>

            {user?.hasPassword && (
              <div className="form-group">
                <label className="form-label">Enter your password</label>
                <input type="password" className="form-input" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Type DELETE to confirm</label>
              <input type="text" className="form-input" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmation(''); }} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmation !== 'DELETE'} style={{ flex: 1, background: 'var(--danger)', color: 'white' }}>
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Verify Email Page (for new user registration verification)
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const res = await api.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      // Refresh user from backend to get updated emailVerified status
      await refreshUser();
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to verify email');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '500px', textAlign: 'center' }}>
      <div className="card">
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Verifying Your Email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: 'var(--secondary)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your email has been verified. You're all set!
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{message}</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Email Verification Banner Component
const EmailVerificationBanner = () => {
  const { user, updateUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#78350f',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <Mail size={18} />
      <span>Please verify your email address. Check your inbox for the verification link.</span>
      {resent ? (
        <span style={{
          background: 'rgba(255,255,255,0.3)',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <CheckCircle size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Email sent!
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            background: 'rgba(255,255,255,0.9)',
            color: '#78350f',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {resending ? (
            <>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
              Sending...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Resend
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Confirm Email Change Page
const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link');
      return;
    }
    confirmEmailChange(token);
  }, [searchParams]);

  const confirmEmailChange = async (token) => {
    try {
      const res = await api.post('/auth/confirm-email-change', { token });
      setStatus('success');
      setNewEmail(res.data.newEmail);
      setMessage('Email changed successfully!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to confirm email change');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '500px', textAlign: 'center' }}>
      <div className="card">
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Confirming Email Change...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: 'var(--secondary)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Email Changed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your email has been changed to <strong>{newEmail}</strong>
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Confirmation Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{message}</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              Back to Profile
            </button>
          </>
        )}
      </div>
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

// Team Management Page (Pro & Unlimited)
const TeamPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [teamRes, myTeamRes] = await Promise.all([
        api.get('/team').catch(() => null),
        api.get('/team/my-team').catch(() => null)
      ]);
      setTeamData(teamRes?.data || null);
      setMyTeam(myTeamRes?.data || null);
    } catch (e) {
      console.error('Load team error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeamData(); }, []);

  const [lastInviteUrl, setLastInviteUrl] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      // Show invite URL in case email doesn't arrive
      if (res.data.inviteUrl) {
        setLastInviteUrl(res.data.inviteUrl);
      }
      setInviteEmail('');
      loadTeamData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.delete(`/team/${memberId}`);
      toast.success('Member removed');
      loadTeamData();
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.put(`/team/${memberId}/role`, { role: newRole });
      toast.success('Role updated');
      loadTeamData();
    } catch (e) {
      toast.error('Failed to update role');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this team? You will lose access to the shared subscription.')) return;
    setLeaving(true);
    try {
      await api.post('/team/leave');
      toast.success('You have left the team');
      loadTeamData();
    } catch (e) {
      toast.error('Failed to leave team');
    } finally {
      setLeaving(false);
    }
  };

  const canManageTeam = ['professional', 'unlimited'].includes(user?.plan);
  const maxMembers = user?.plan === 'unlimited' ? 10 : (user?.plan === 'professional' ? 3 : 0);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--gray-500)', marginTop: '16px' }}>Loading team...</p>
      </div>
    );
  }

  // User is a team member (belongs to someone else's team)
  if (myTeam?.isTeamMember) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
        <Link to="/dashboard" style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          <Users size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Team Membership
        </h1>
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{myTeam.teamOwner.businessName || myTeam.teamOwner.email}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Your team owner</p>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'var(--gray-50)', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--gray-600)' }}>Your Role</span>
              <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{myTeam.role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gray-600)' }}>Team Usage</span>
              <span style={{ fontWeight: '500' }}>{myTeam.teamUsage?.used || 0} / {myTeam.teamUsage?.limit || 0}</span>
            </div>
          </div>
          <button onClick={handleLeave} disabled={leaving} className="btn btn-secondary" style={{ color: 'var(--error-600)' }}>
            {leaving ? 'Leaving...' : 'Leave Team'}
          </button>
        </div>
      </div>
    );
  }

  // User is not on a Pro/Unlimited plan - show upgrade prompt
  if (!canManageTeam) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
        <Link to="/dashboard" style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Users size={48} style={{ color: 'var(--gray-400)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Team Features</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Invite team members to share your subscription. Pro plan allows 3 members, Unlimited allows 10.
          </p>
          <Link to="/pricing" className="btn btn-primary">Upgrade to Pro</Link>
        </div>
      </div>
    );
  }

  // User can manage team (Pro or Unlimited)
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <Link to="/dashboard" style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px' }}>
        ← Back to Dashboard
      </Link>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
        <Users size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Team Management
      </h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: '32px' }}>
        Invite team members to generate responses using your subscription
      </p>

      {/* Invite Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Invite Team Member</h3>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="email" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="form-input" style={{ flex: '1', minWidth: '200px' }} required />
          <button type="submit" className="btn btn-primary" disabled={inviting || (teamData?.members?.length >= maxMembers)}>
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '12px' }}>
          {teamData?.members?.length || 0} / {maxMembers} team members used
          {user?.plan === 'professional' && <span> · <Link to="/pricing" style={{ color: 'var(--primary-600)' }}>Upgrade for more</Link></span>}
        </p>
        {lastInviteUrl && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--primary-700)', marginBottom: '8px' }}>
              📧 Email not arriving? Share this invite link directly:
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={lastInviteUrl}
                readOnly
                className="form-input"
                style={{ flex: '1', fontSize: '12px', fontFamily: 'monospace' }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(lastInviteUrl);
                  toast.success('Link copied!');
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setLastInviteUrl(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--gray-400)' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Team Members</h3>
        {!teamData?.members?.length ? (
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>No team members yet. Invite someone to get started!</p>
        ) : (
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
            {teamData.members.map((member, idx) => (
              <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: idx < teamData.members.length - 1 ? '1px solid var(--gray-200)' : 'none', background: member.status === 'pending' ? 'var(--gray-50)' : 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: member.status === 'active' ? 'var(--primary-100)' : 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} style={{ color: member.status === 'active' ? 'var(--primary-600)' : 'var(--gray-400)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{member.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {member.status === 'pending' ? 'Invitation pending...' : `Joined ${new Date(member.acceptedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--gray-600)', background: 'var(--gray-100)', padding: '4px 10px', borderRadius: '4px' }}>Member</span>
                  <button onClick={() => handleRemove(member.id)} className="btn btn-sm" style={{ color: 'var(--error-600)', padding: '6px' }} title="Remove member">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Join Team Page (for accepting invitations)
const JoinTeamPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) { setError('No invitation token provided'); setLoading(false); return; }
      try {
        const res = await api.get(`/team/invite/${token}`);
        setInvitation(res.data);
      } catch (e) {
        setError(e.response?.data?.error || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      sessionStorage.setItem('pendingTeamInvite', token);
      toast.info('Please log in or create an account to join the team');
      navigate('/login');
      return;
    }
    setAccepting(true);
    try {
      const res = await api.post('/team/accept', { token });
      toast.success(res.data.message);
      navigate('/team');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    const pendingToken = sessionStorage.getItem('pendingTeamInvite');
    if (user && pendingToken) {
      sessionStorage.removeItem('pendingTeamInvite');
      api.post('/team/accept', { token: pendingToken })
        .then(res => { toast.success(res.data.message); navigate('/team'); })
        .catch(e => toast.error(e.response?.data?.error || 'Failed to accept invitation'));
    }
  }, [user, navigate]);

  if (loading) return <div className="auth-container"><div className="card auth-card" style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto 16px' }} /><p>Validating invitation...</p></div></div>;
  if (error) return <div className="auth-container"><div className="card auth-card" style={{ textAlign: 'center' }}><AlertCircle size={48} style={{ color: 'var(--error-600)', marginBottom: '16px' }} /><h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Invalid Invitation</h2><p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>{error}</p><Link to="/" className="btn btn-primary">Go Home</Link></div></div>;

  return (
    <div className="auth-container">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Users size={32} style={{ color: 'var(--primary-600)' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Team Invitation</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
          <strong>{invitation?.invitedBy}</strong> invited you to join their ReviewResponder team as a <strong style={{ textTransform: 'capitalize' }}>{invitation?.role}</strong>.
        </p>
        {user ? (
          user.email.toLowerCase() === invitation?.invitedEmail?.toLowerCase() ? (
            <button onClick={handleAccept} disabled={accepting} className="btn btn-primary" style={{ width: '100%' }}>
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          ) : (
            <div>
              <p style={{ color: 'var(--error-600)', marginBottom: '16px' }}>This invitation was sent to {invitation?.invitedEmail}. You are logged in as {user.email}.</p>
              <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} className="btn btn-secondary" style={{ width: '100%' }}>Log out and try again</button>
            </div>
          )
        ) : (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>Log in with <strong>{invitation?.invitedEmail}</strong> to accept</p>
            <button onClick={handleAccept} className="btn btn-primary" style={{ width: '100%' }}>Log In to Accept</button>
          </div>
        )}
      </div>
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
      a: 'You get 20 free response generations when you sign up. No credit card required. Use them to test the quality of our AI responses.'
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
                <a href="mailto:support@tryreviewresponder.com" style={{ color: 'var(--primary-600)', fontWeight: '500' }}>
                  support@tryreviewresponder.com
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
  const location = useLocation();

  useEffect(() => {
    // Save UTM parameters to sessionStorage for registration
    const params = new URLSearchParams(location.search);
    const utmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      landing_page: '/google-review-response-generator'
    };
    if (utmParams.utm_source) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

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
        "description": "Free trial with 20 responses"
      }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, [location.search]);

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
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>20 free responses • No credit card required</p>
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
  const location = useLocation();

  useEffect(() => {
    // Save UTM parameters to sessionStorage for registration
    const params = new URLSearchParams(location.search);
    const utmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      landing_page: '/yelp-review-reply-tool'
    };
    if (utmParams.utm_source) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

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
  }, [location.search]);

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
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>20 free responses • Works with any Yelp review</p>
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
            Try Free - 20 Responses Included
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
  const location = useLocation();

  useEffect(() => {
    // Save UTM parameters to sessionStorage for registration
    const params = new URLSearchParams(location.search);
    const utmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      landing_page: '/restaurant-review-responses'
    };
    if (utmParams.utm_source) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

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
  }, [location.search]);

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
            Start Free - 20 Responses Included
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
  const location = useLocation();

  useEffect(() => {
    // Save UTM parameters to sessionStorage for registration
    const params = new URLSearchParams(location.search);
    const utmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      landing_page: '/hotel-review-management'
    };
    if (utmParams.utm_source) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

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
  }, [location.search]);

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

// SEO Landing Page Component - Local Business Review Responses (Google Ads)
const LocalBusinessReviewPage = () => {
  const location = useLocation();

  useEffect(() => {
    // Save UTM parameters to sessionStorage for registration
    const params = new URLSearchParams(location.search);
    const utmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      landing_page: '/local-business-reviews'
    };
    if (utmParams.utm_source) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

    document.title = 'AI Review Responses for Local Businesses | ReviewResponder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'AI-powered review response generator for local businesses. Respond to Google, Yelp, Facebook reviews professionally. Perfect for plumbers, salons, dentists, auto shops & more.');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ReviewResponder - Local Business Review Response Tool",
      "description": "AI tool for local businesses to respond to customer reviews professionally",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    });
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, [location.search]);

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '80px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', marginBottom: '24px' }}>
            <Store size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>For Local Businesses</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '20px', lineHeight: '1.2' }}>
            AI Review Responses for Local Businesses
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.95, marginBottom: '32px', lineHeight: '1.6' }}>
            You're busy running your business. Let AI write professional, personalized responses to
            every review - from glowing 5-stars to tough complaints.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#059669', fontWeight: '600', padding: '16px 32px' }}>
            <Sparkles size={20} />
            Try Free - 20 Responses
          </Link>
          <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>Works with Google, Yelp, Facebook, and more</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          Perfect for Every Local Business
        </h2>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
            <Wrench size={24} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>Plumbers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
            <Scissors size={24} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>Salons</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
            <Heart size={24} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>Dentists</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
            <Car size={24} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>Auto Shops</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
            <MapPin size={24} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>Any Local Biz</span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ padding: '24px' }}>
            <Clock size={32} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>30 Seconds Per Review</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Stop spending 10+ minutes crafting the perfect response. Our AI generates professional replies instantly.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Star size={32} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Boost Your Rating</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Businesses that respond to reviews see 12% higher ratings on average. Show customers you care.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <Shield size={32} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Handle Complaints Like a Pro</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              Turn angry reviewers into loyal customers with thoughtful, apologetic responses that address their concerns.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '60px', background: 'var(--gray-50)', borderRadius: '16px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Common Local Business Review Scenarios</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Great service, highly recommend!"</strong> - Thank them warmly, mention your team's dedication</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Had to wait too long"</strong> - Apologize sincerely, explain improvements you're making</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Price was too high"</strong> - Highlight the value and quality they received</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle size={20} style={{ color: '#10b981', marginTop: '2px' }} />
              <div><strong>"Problem wasn't fixed properly"</strong> - Offer to make it right, provide contact info</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
            Stop Ignoring Reviews. Start Growing Your Business.
          </h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
            Join local businesses saving hours each week on review management.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Sparkles size={20} />
            Start Free - No Credit Card
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <Link to="/" style={{ color: 'var(--primary-600)' }}>ReviewResponder</Link> •
            <Link to="/google-review-response-generator" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Google Reviews</Link> •
            <Link to="/restaurant-review-responses" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Restaurants</Link> •
            <Link to="/hotel-review-management" style={{ color: 'var(--gray-500)', marginLeft: '16px' }}>Hotels</Link>
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
        Need help? <a href="mailto:support@tryreviewresponder.com" style={{ color: 'var(--primary-600)' }}>Contact support</a>
      </div>
    </div>
  );
};

// Pricing Page
const PricingPage = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [testimonials, setTestimonials] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showAdminSubscriptionModal, setShowAdminSubscriptionModal] = useState(false);

  // Check if discount is already active in URL
  const urlParams = new URLSearchParams(location.search);
  const discountActive = urlParams.get('discount')?.toUpperCase() === 'EARLY50';

  useEffect(() => {
    // Fetch testimonials
    api.get('/testimonials').then(res => setTestimonials(res.data.testimonials || [])).catch(() => {});
  }, []);

  const openBillingPortal = async () => {
    try {
      const res = await api.post('/billing/portal');
      window.location.href = res.data.url;
    } catch (error) {
      // Check if user has no Stripe customer (admin-upgraded)
      if (error.response?.data?.noStripeCustomer) {
        setShowAdminSubscriptionModal(true);
      } else {
        toast.error('Failed to open billing portal');
      }
    }
  };

  const handleAdminPlanChange = async (planId) => {
    try {
      await api.post('/admin/self-set-plan', { plan: planId });
      toast.success(`Plan changed to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`);
      setShowAdminSubscriptionModal(false);
      refreshUser();
    } catch (error) {
      toast.error('Failed to change plan');
    }
  };

  // FAQ data
  const faqs = [
    { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we prorate the billing.' },
    { q: 'What happens if I exceed my response limit?', a: 'You\'ll receive a notification when you reach 80% of your limit. After reaching your limit, you can upgrade or wait for the next billing cycle.' },
    { q: 'Is there a free trial?', a: 'Yes! The Free plan gives you 20 responses per month forever - no credit card required. Try it out and upgrade when ready.' },
    { q: 'What payment methods do you accept?', a: 'We accept credit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay, and Link via our secure Stripe payment processor.' },
    { q: 'Can I cancel anytime?', a: 'Absolutely! No contracts, no hidden fees. Cancel with one click from your dashboard. Plus, we offer a 30-day money-back guarantee.' },
    { q: 'Do you offer refunds?', a: 'Yes! We have a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.' }
  ];

  // Feature comparison data - Updated with Hybrid AI limits (Smart + Standard)
  const features = [
    { name: 'Monthly Responses', free: '20', starter: '300', pro: '800', unlimited: 'Unlimited' },
    { name: 'Smart AI', free: '3', starter: '100', pro: '300', unlimited: 'Unlimited' },
    { name: 'Standard AI', free: '17', starter: '200', pro: '500', unlimited: 'Unlimited' },
    { name: 'AI Tone Options', free: true, starter: true, pro: true, unlimited: true },
    { name: '50+ Languages', free: true, starter: true, pro: true, unlimited: true },
    { name: 'Response History', free: true, starter: true, pro: true, unlimited: true },
    { name: 'Response Templates', free: false, starter: true, pro: true, unlimited: true },
    { name: 'Bulk Generation (20 at once)', free: false, starter: false, pro: true, unlimited: true },
    { name: 'Analytics Dashboard', free: false, starter: false, pro: true, unlimited: true },
    { name: 'CSV/PDF Export', free: false, starter: true, pro: true, unlimited: true },
    { name: 'API Access', free: false, starter: false, pro: false, unlimited: true },
    { name: 'Team Members', free: '-', starter: '-', pro: '3', unlimited: '10' },
    { name: 'Priority Support', free: false, starter: false, pro: true, unlimited: true }
  ];

  return (
    <div style={{ paddingBottom: '100px' }}>
      {/* Hero Section */}
      <div className="pricing-section">
        <div className="container">
          <div className="pricing-header">
            {!discountActive && (
              <Link
                to="/pricing?discount=EARLY50"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                🎁 Click to Activate 50% OFF
                <ArrowRight size={14} />
              </Link>
            )}
            <h1 className="pricing-title">Simple, Transparent Pricing</h1>
            <p style={{ color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
              No hidden fees. No surprises. Choose the plan that fits your business.
            </p>
          </div>

          <PricingCards />

          {user && user.plan !== 'free' && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={openBillingPortal} className="btn btn-secondary">
                Manage Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="container" style={{ marginTop: '40px', marginBottom: '60px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '32px',
          alignItems: 'center',
          padding: '24px',
          background: 'var(--gray-50)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)' }}>
            <Shield size={20} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>SSL Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)' }}>
            <CreditCard size={20} style={{ color: 'var(--primary-600)' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Powered by Stripe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)' }}>
            <RefreshCw size={20} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>30-Day Money Back</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)' }}>
            <Check size={20} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Cancel Anytime</span>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container" style={{ marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>
          Compare All Features
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '16px', paddingTop: '32px', textAlign: 'left', fontWeight: '600', verticalAlign: 'bottom' }}>Feature</th>
                <th style={{ padding: '16px', paddingTop: '32px', textAlign: 'center', fontWeight: '600', verticalAlign: 'bottom' }}>Free</th>
                <th style={{ padding: '16px', paddingTop: '32px', textAlign: 'center', fontWeight: '600', verticalAlign: 'bottom' }}>Starter</th>
                <th style={{ padding: '16px', paddingTop: '32px', textAlign: 'center', fontWeight: '600', background: 'var(--primary-50)', position: 'relative', verticalAlign: 'bottom' }}>
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                    color: 'white',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase'
                  }}>
                    MOST POPULAR
                  </div>
                  Professional
                </th>
                <th style={{ padding: '16px', paddingTop: '32px', textAlign: 'center', fontWeight: '600', verticalAlign: 'bottom' }}>Unlimited</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>{feature.name}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? <Check size={18} style={{ color: 'var(--success)' }} /> : <X size={18} style={{ color: 'var(--gray-300)' }} />
                    ) : <span style={{ fontWeight: '500' }}>{feature.free}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {typeof feature.starter === 'boolean' ? (
                      feature.starter ? <Check size={18} style={{ color: 'var(--success)' }} /> : <X size={18} style={{ color: 'var(--gray-300)' }} />
                    ) : <span style={{ fontWeight: '500' }}>{feature.starter}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--primary-50)' }}>
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? <Check size={18} style={{ color: 'var(--success)' }} /> : <X size={18} style={{ color: 'var(--gray-300)' }} />
                    ) : <span style={{ fontWeight: '500' }}>{feature.pro}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {typeof feature.unlimited === 'boolean' ? (
                      feature.unlimited ? <Check size={18} style={{ color: 'var(--success)' }} /> : <X size={18} style={{ color: 'var(--gray-300)' }} />
                    ) : <span style={{ fontWeight: '500' }}>{feature.unlimited}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <div className="container" style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            Loved by Businesses
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '32px' }}>
            See what our customers have to say
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {testimonials.slice(0, 3).map((t, idx) => (
              <div key={idx} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} fill={s <= t.rating ? '#f59e0b' : 'none'} color={s <= t.rating ? '#f59e0b' : '#d1d5db'} />
                  ))}
                </div>
                {t.comment && <p style={{ color: 'var(--gray-700)', fontStyle: 'italic', marginBottom: '16px', lineHeight: '1.6' }}>"{t.comment}"</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-100)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {(t.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>{t.user_name || 'Verified User'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="container" style={{ marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '32px' }}>
          Got questions? We've got answers.
        </p>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                marginBottom: '12px',
                padding: '0',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div style={{
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: '500'
              }}>
                <span>{faq.q}</span>
                <ChevronRight
                  size={20}
                  style={{
                    color: 'var(--gray-400)',
                    transform: expandedFaq === idx ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>
              {expandedFaq === idx && (
                <div style={{
                  padding: '0 20px 18px',
                  color: 'var(--gray-600)',
                  lineHeight: '1.6',
                  borderTop: '1px solid var(--gray-100)',
                  paddingTop: '16px'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="container">
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
          textAlign: 'center',
          padding: '48px 24px'
        }}>
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            Ready to Save Hours on Review Responses?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Join businesses who respond to reviews in seconds, not hours.
          </p>
          <Link to="/register" className="btn" style={{
            background: 'white',
            color: 'var(--primary-600)',
            fontWeight: '600',
            padding: '14px 32px',
            fontSize: '16px'
          }}>
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid var(--gray-200)',
        padding: '12px 16px',
        display: 'none',
        zIndex: 1000,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }} className="mobile-sticky-cta">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Start Free</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>20 responses/month</div>
          </div>
          <Link to="/register" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
            Get Started
          </Link>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .mobile-sticky-cta {
              display: block !important;
            }
          }
        `}
      </style>

      {/* Admin Subscription Modal - for users without Stripe customer ID */}
      {showAdminSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowAdminSubscriptionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button
              onClick={() => setShowAdminSubscriptionModal(false)}
              className="modal-close"
              style={{ position: 'absolute', right: '16px', top: '16px' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '8px' }}>Manage Subscription</h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '14px', marginBottom: '24px' }}>
              Admin Mode - Switch plans instantly
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { id: 'free', name: 'Free', responses: '20 responses/mo' },
                { id: 'starter', name: 'Starter', responses: '300 responses/mo' },
                { id: 'professional', name: 'Professional', responses: '800 responses/mo' },
                { id: 'unlimited', name: 'Unlimited', responses: 'Unlimited' }
              ].map(plan => (
                <button
                  key={plan.id}
                  onClick={() => handleAdminPlanChange(plan.id)}
                  disabled={user?.plan === plan.id}
                  className={`btn ${user?.plan === plan.id ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: user?.plan === plan.id ? 0.6 : 1
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{plan.name}</span>
                  <span style={{ fontSize: '13px', opacity: 0.8 }}>
                    {user?.plan === plan.id ? '(Current)' : plan.responses}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdminSubscriptionModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '16px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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

// Affiliate Landing Page (Public)
const AffiliateLandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [affiliateStatus, setAffiliateStatus] = useState(null);
  const [formData, setFormData] = useState({
    website: '',
    marketingChannels: '',
    audienceSize: '',
    payoutMethod: 'paypal',
    payoutEmail: ''
  });

  useEffect(() => {
    if (user) {
      api.get('/affiliate/stats')
        .then(res => {
          if (res.data.isAffiliate) {
            setAffiliateStatus(res.data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/affiliate/apply', formData);
      toast.success(res.data.message);
      fireConfetti();
      navigate('/affiliate/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  if (affiliateStatus?.isAffiliate) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px' }}>
          <Award size={56} style={{ color: 'var(--primary-600)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>You're Already an Affiliate!</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>
            Welcome back! Check your dashboard to see your earnings and stats.
          </p>
          <Link to="/affiliate/dashboard" className="btn btn-primary">Go to Affiliate Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #8B5CF6 100%)', color: 'white', padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            <Award size={18} /> Affiliate Partner Program
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '20px', lineHeight: '1.2' }}>Earn 20% Recurring<br />Commission</h1>
          <p style={{ fontSize: '20px', opacity: '0.9', maxWidth: '600px', margin: '0 auto 32px' }}>
            Join our affiliate program and earn 20% on every payment from customers you refer. Not just once - on every single payment, forever.
          </p>
          {user ? (
            <a href="#apply" className="btn btn-primary" style={{ background: 'white', color: '#4F46E5', padding: '16px 32px', fontSize: '18px' }}>Apply Now</a>
          ) : (
            <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: '#4F46E5', padding: '16px 32px', fontSize: '18px' }}>Sign Up to Become an Affiliate</Link>
          )}
        </div>
      </section>

      <section style={{ padding: '60px 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {[{ value: '20%', label: 'Commission Rate' }, { value: 'Recurring', label: 'Lifetime Earnings' }, { value: '$50', label: 'Min. Payout' }, { value: '30 Days', label: 'Cookie Duration' }].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary-600)' }}>{s.value}</div>
                <div style={{ color: 'var(--gray-600)', fontSize: '14px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', textAlign: 'center', marginBottom: '48px' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[{ num: '1', title: 'Sign Up', desc: 'Create a free account and apply to our affiliate program. Approval is instant!' },
              { num: '2', title: 'Share Your Link', desc: 'Get your unique affiliate link and share it with your audience via blog, social media, or email.' },
              { num: '3', title: 'Earn Commission', desc: 'Earn 20% of every payment made by customers you refer - recurring, for life!' }].map(s => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', margin: '0 auto 16px' }}>{s.num}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0', background: 'var(--gray-50)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '32px' }}>Potential Earnings</h2>
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Plan</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Monthly Price</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Your Commission</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Yearly Earnings</th>
              </tr></thead>
              <tbody>
                {[{ plan: 'Starter', price: '$29/mo', comm: '$5.80/mo', yearly: '$69.60/year' },
                  { plan: 'Professional', price: '$49/mo', comm: '$9.80/mo', yearly: '$117.60/year' },
                  { plan: 'Unlimited', price: '$99/mo', comm: '$19.80/mo', yearly: '$237.60/year' }].map((r, i) => (
                  <tr key={r.plan} style={{ borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{r.plan}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{r.price}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--primary-600)', fontWeight: '600' }}>{r.comm}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--secondary)', fontWeight: '700' }}>{r.yearly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: '8px', marginTop: '16px', textAlign: 'center' }}>
              <strong>Example:</strong> Refer 10 Professional customers = <strong style={{ color: 'var(--primary-600)' }}>$1,176/year</strong> in passive income!
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section id="apply" style={{ padding: '80px 0' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '8px' }}>Apply to Become an Affiliate</h2>
            <p style={{ color: 'var(--gray-600)', textAlign: 'center', marginBottom: '32px' }}>Fill out the form below. Approval is typically instant!</p>
            <div className="card">
              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label className="form-label">Website URL (Optional)</label>
                  <input type="url" className="form-input" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} placeholder="https://yourwebsite.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">How will you promote ReviewResponder?</label>
                  <select className="form-input" value={formData.marketingChannels} onChange={(e) => setFormData({...formData, marketingChannels: e.target.value})} required>
                    <option value="">Select...</option>
                    <option value="blog">Blog / Website</option>
                    <option value="social">Social Media</option>
                    <option value="youtube">YouTube</option>
                    <option value="email">Email Newsletter</option>
                    <option value="podcast">Podcast</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Audience Size</label>
                  <select className="form-input" value={formData.audienceSize} onChange={(e) => setFormData({...formData, audienceSize: e.target.value})} required>
                    <option value="">Select...</option>
                    <option value="small">Small (Under 1,000)</option>
                    <option value="medium">Medium (1,000 - 10,000)</option>
                    <option value="large">Large (10,000 - 100,000)</option>
                    <option value="enterprise">Enterprise (100,000+)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Payout Method</label>
                  <select className="form-input" value={formData.payoutMethod} onChange={(e) => setFormData({...formData, payoutMethod: e.target.value})} required>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payout Email</label>
                  <input type="email" className="form-input" value={formData.payoutEmail} onChange={(e) => setFormData({...formData, payoutEmail: e.target.value})} placeholder="payments@youremail.com" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Processing...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {!user && (
        <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: 'white', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>Ready to Start Earning?</h2>
            <p style={{ fontSize: '18px', opacity: '0.9', marginBottom: '24px' }}>Create a free account to apply for our affiliate program.</p>
            <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: '#4F46E5', padding: '16px 32px', fontSize: '18px' }}>Sign Up Now</Link>
          </div>
        </section>
      )}
    </div>
  );
};

// Affiliate Dashboard Page (Protected)
const AffiliateDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsForm, setSettingsForm] = useState({ payoutMethod: 'paypal', payoutEmail: '' });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        api.get('/affiliate/stats'),
        api.get('/affiliate/payouts')
      ]);
      setData(statsRes.data);
      setPayouts(payoutsRes.data);
      if (statsRes.data.affiliate) {
        setSettingsForm({ payoutMethod: statsRes.data.affiliate.payoutMethod || 'paypal', payoutEmail: statsRes.data.affiliate.payoutEmail || '' });
      }
    } catch (error) {
      console.error('Load affiliate data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCopyLink = () => {
    if (data?.links?.affiliateLink) {
      navigator.clipboard.writeText(data.links.affiliateLink);
      setCopied(true);
      toast.success('Affiliate link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequestPayout = async () => {
    setRequestingPayout(true);
    try {
      const res = await api.post('/affiliate/payout');
      toast.success(res.data.message);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      await api.put('/affiliate/settings', settingsForm);
      toast.success('Settings updated');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const chartData = data?.clicksChart?.slice(0, 30).reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: parseInt(d.clicks)
  })) || [];

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--gray-500)', marginTop: '16px' }}>Loading affiliate dashboard...</p>
      </div>
    );
  }

  if (!data?.isAffiliate) {
    return (
      <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '48px' }}>
          <Award size={48} style={{ color: 'var(--gray-400)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Not an Affiliate Yet</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>Apply to our affiliate program and start earning 20% recurring commission on every referral.</p>
          <Link to="/affiliate" className="btn btn-primary">Apply Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            <Award size={28} style={{ verticalAlign: 'middle', marginRight: '12px', color: 'var(--primary-600)' }} />
            Affiliate Dashboard
          </h1>
          <p style={{ color: 'var(--gray-500)' }}>Track your earnings, clicks, and conversions</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
      </div>

      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-600)', marginBottom: '4px' }}>Your Affiliate Link</div>
            <div style={{ fontSize: '16px', fontFamily: 'monospace', color: 'var(--gray-700)' }}>{data?.links?.affiliateLink}</div>
          </div>
          <button onClick={handleCopyLink} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--gray-600)' }}>
          Affiliate Code: <strong>{data?.affiliate?.code}</strong> | Status: <strong style={{ color: data?.affiliate?.status === 'approved' ? 'var(--secondary)' : 'var(--warning)' }}>{data?.affiliate?.status}</strong>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value primary">{data?.stats?.totalClicks || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conversions</div>
          <div className="stat-value">{data?.stats?.totalConversions || 0}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>{data?.stats?.conversionRate || 0}% rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>${data?.stats?.totalEarned?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Balance</div>
          <div className="stat-value">${data?.stats?.pendingBalance?.toFixed(2) || '0.00'}</div>
          {(data?.stats?.pendingBalance || 0) >= 50 && (
            <button onClick={handleRequestPayout} disabled={requestingPayout} className="btn btn-primary" style={{ marginTop: '12px', fontSize: '13px', padding: '8px 16px' }}>
              {requestingPayout ? 'Processing...' : 'Request Payout'}
            </button>
          )}
          {(data?.stats?.pendingBalance || 0) < 50 && <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>Min. $50 for payout</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '8px' }}>
        {[{ id: 'overview', label: 'Overview', icon: TrendingUp }, { id: 'conversions', label: 'Conversions', icon: Users }, { id: 'payouts', label: 'Payouts', icon: CreditCard }, { id: 'materials', label: 'Marketing Materials', icon: Download }, { id: 'settings', label: 'Settings', icon: Settings }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', background: activeTab === tab.id ? 'var(--primary-100)' : 'transparent', color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--gray-600)', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary-600)' }} /> Clicks Over Time (Last 30 Days)
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="clicks" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>No click data yet. Share your affiliate link to get started!</div>
          )}
        </div>
      )}

      {activeTab === 'conversions' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Recent Conversions</h3>
          {data?.recentConversions?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Plan</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Payment</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Commission</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Date</th>
              </tr></thead>
              <tbody>
                {data.recentConversions.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px' }}>{c.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center', textTransform: 'capitalize' }}>{c.plan}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>${c.amount?.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--secondary)', fontWeight: '600' }}>${c.commission?.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', background: c.status === 'paid' ? 'var(--secondary-light)' : (c.status === 'approved' ? 'var(--primary-100)' : 'var(--gray-100)'), color: c.status === 'paid' ? 'var(--secondary)' : (c.status === 'approved' ? 'var(--primary-700)' : 'var(--gray-600)') }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--gray-500)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)' }}>No conversions yet. Keep sharing your affiliate link!</div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Payout History</h3>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Total Paid Out: <strong style={{ color: 'var(--secondary)' }}>${payouts?.totalPaid?.toFixed(2) || '0.00'}</strong></div>
          </div>
          {payouts?.payouts?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Requested</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Processed</th>
              </tr></thead>
              <tbody>
                {payouts.payouts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>${p.amount?.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', textTransform: 'capitalize' }}>{p.method}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', background: p.status === 'completed' ? 'var(--secondary-light)' : (p.status === 'processing' ? 'var(--warning-light)' : 'var(--gray-100)'), color: p.status === 'completed' ? 'var(--secondary)' : (p.status === 'processing' ? 'var(--warning)' : 'var(--gray-600)') }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--gray-500)' }}>{new Date(p.requestedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--gray-500)' }}>{p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)' }}>No payouts yet. Earn at least $50 in commissions to request your first payout.</div>
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Marketing Materials</h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>Use these resources to promote ReviewResponder to your audience.</p>
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Your Affiliate Link</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="text" className="form-input" value={data?.links?.affiliateLink || ''} readOnly style={{ fontFamily: 'monospace', flex: 1 }} />
              <button onClick={handleCopyLink} className="btn btn-primary">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Email Template</h4>
            <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
{`Subject: Save Hours on Review Responses with AI

Hi [Name],

I wanted to share a tool that's been a game-changer for managing customer reviews: ReviewResponder.

It uses AI to generate professional, personalized responses to customer reviews in seconds.

Check it out here: ${data?.links?.affiliateLink}

Best,
[Your Name]`}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`Subject: Save Hours on Review Responses with AI\n\nHi [Name],\n\nI wanted to share a tool that's been a game-changer for managing customer reviews: ReviewResponder.\n\nIt uses AI to generate professional, personalized responses to customer reviews in seconds.\n\nCheck it out here: ${data?.links?.affiliateLink}\n\nBest,\n[Your Name]`); toast.success('Email template copied!'); }} className="btn btn-secondary" style={{ marginTop: '12px' }}><Copy size={16} /> Copy Email Template</button>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Social Media Post</h4>
            <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
              {`Struggling to respond to customer reviews? Check out ReviewResponder - AI that generates professional review responses in seconds. ${data?.links?.affiliateLink}`}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`Struggling to respond to customer reviews? Check out ReviewResponder - AI that generates professional review responses in seconds. ${data?.links?.affiliateLink}`); toast.success('Social post copied!'); }} className="btn btn-secondary" style={{ marginTop: '12px' }}><Copy size={16} /> Copy Social Post</button>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Key Selling Points</h4>
            <ul style={{ paddingLeft: '20px', color: 'var(--gray-600)' }}>
              <li style={{ marginBottom: '8px' }}>AI-powered responses save hours of manual work</li>
              <li style={{ marginBottom: '8px' }}>Supports 50+ languages with automatic detection</li>
              <li style={{ marginBottom: '8px' }}>4 tone options: Professional, Friendly, Formal, Apologetic</li>
              <li style={{ marginBottom: '8px' }}>Works with Google, Yelp, TripAdvisor, and more</li>
              <li style={{ marginBottom: '8px' }}>Chrome extension for one-click responses</li>
              <li style={{ marginBottom: '8px' }}>Free plan with 20 responses to try</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Payout Settings</h3>
          <form onSubmit={handleUpdateSettings}>
            <div className="form-group">
              <label className="form-label">Payout Method</label>
              <select className="form-input" value={settingsForm.payoutMethod} onChange={(e) => setSettingsForm({...settingsForm, payoutMethod: e.target.value})}>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payout Email</label>
              <input type="email" className="form-input" value={settingsForm.payoutEmail} onChange={(e) => setSettingsForm({...settingsForm, payoutEmail: e.target.value})} placeholder="payments@youremail.com" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={updatingSettings}>{updatingSettings ? 'Saving...' : 'Save Settings'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

// Admin Panel Page (Protected with Admin Key)
const AdminPage = () => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, suspended: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [affiliateDetails, setAffiliateDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Use the same API_URL as the rest of the app (already includes /api)
  // Remove /api suffix if present to build admin URLs correctly
  const API_BASE = API_URL.replace(/\/api$/, '');

  const authenticate = async (keyToUse) => {
    const key = keyToUse || adminKey;
    if (!key || !key.trim()) {
      toast.error('Please enter an admin key');
      return;
    }
    setLoading(true);
    try {
      console.log('Authenticating with key:', key.substring(0, 8) + '...');
      const res = await axios.get(`${API_BASE}/api/admin/stats`, {
        headers: { 'X-Admin-Key': key }
      });
      setStats(res.data);
      setIsAuthenticated(true);
      setAdminKey(key);
      localStorage.setItem('adminKey', key);
      toast.success('Admin authenticated');
      loadAffiliatesWithKey(key);
    } catch (err) {
      console.error('Auth error:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Invalid admin key');
      localStorage.removeItem('adminKey');
      setAdminKey('');
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = () => ({ 'X-Admin-Key': adminKey });

  const loadAffiliatesWithKey = async (key) => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/affiliates`, { headers: { 'X-Admin-Key': key } });
      setAffiliates(res.data.affiliates);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Load affiliates error:', err);
    }
  };

  const loadAffiliates = async () => {
    if (!adminKey) return;
    try {
      const url = filter === 'all' ? '/api/admin/affiliates' : `/api/admin/affiliates?status=${filter}`;
      const res = await axios.get(`${API_BASE}${url}`, { headers: getHeaders() });
      setAffiliates(res.data.affiliates);
      setCounts(res.data.counts);
    } catch (err) {
      toast.error('Failed to load affiliates');
    }
  };

  const loadAffiliateDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/affiliates/${id}`, { headers: getHeaders() });
      setAffiliateDetails(res.data);
      setSelectedAffiliate(id);
    } catch (err) {
      toast.error('Failed to load details');
    }
  };

  const updateStatus = async (id, status, note = '') => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/api/admin/affiliates/${id}/status`, { status, note }, { headers: getHeaders() });
      toast.success(`Affiliate ${status}`);
      loadAffiliates();
      if (selectedAffiliate === id) loadAffiliateDetails(id);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const processPayout = async (id, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(`${API_BASE}/api/admin/affiliates/${id}/payout`, { amount: parseFloat(amount) }, { headers: getHeaders() });
      toast.success('Payout processed');
      loadAffiliateDetails(id);
      loadAffiliates();
    } catch (err) {
      toast.error('Failed to process payout');
    } finally {
      setActionLoading(false);
    }
  };

  // Check for saved admin key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey');
    if (savedKey && savedKey.trim()) {
      setAdminKey(savedKey);
      authenticate(savedKey);
    }
  }, []);

  // Reload affiliates when filter changes
  useEffect(() => {
    if (isAuthenticated && adminKey) loadAffiliates();
  }, [filter]);

  if (!isAuthenticated) {
    return (
      <div className="page-container" style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
        <div className="card">
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Admin Login</h1>
          <div className="form-group">
            <label className="form-label">Admin Key</label>
            <input
              type="password"
              className="form-input"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin secret key"
              onKeyDown={(e) => e.key === 'Enter' && authenticate(adminKey)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => authenticate(adminKey)} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Admin Dashboard</h1>
        <button className="btn btn-secondary" onClick={() => { localStorage.removeItem('adminKey'); setIsAuthenticated(false); setAdminKey(''); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary)' }}>{stats.users?.total || 0}</div>
            <div style={{ color: 'var(--gray-600)' }}>Total Users</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981' }}>{stats.users?.paying || 0}</div>
            <div style={{ color: 'var(--gray-600)' }}>Paying Users</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B' }}>{counts.pending}</div>
            <div style={{ color: 'var(--gray-600)' }}>Pending Affiliates</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#8B5CF6' }}>{counts.approved}</div>
            <div style={{ color: 'var(--gray-600)' }}>Active Affiliates</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981' }}>${stats.affiliates?.totalEarnings?.toFixed(2) || '0.00'}</div>
            <div style={{ color: 'var(--gray-600)' }}>Total Affiliate Earnings</div>
          </div>
        </div>
      )}

      {/* Affiliate Management */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Affiliate Applications</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${counts[f] || 0})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedAffiliate ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Affiliates List */}
          <div>
            {affiliates.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px' }}>No affiliates found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {affiliates.map(aff => (
                  <div
                    key={aff.id}
                    onClick={() => loadAffiliateDetails(aff.id)}
                    style={{
                      padding: '16px',
                      border: selectedAffiliate === aff.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedAffiliate === aff.id ? 'var(--primary-light)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{aff.email}</div>
                        <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{aff.affiliate_code}</div>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: aff.status === 'approved' ? '#D1FAE5' : aff.status === 'pending' ? '#FEF3C7' : aff.status === 'rejected' ? '#FEE2E2' : '#E5E7EB',
                        color: aff.status === 'approved' ? '#065F46' : aff.status === 'pending' ? '#92400E' : aff.status === 'rejected' ? '#991B1B' : '#374151'
                      }}>
                        {aff.status}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--gray-600)' }}>
                      Website: {aff.website || 'N/A'} | Audience: {aff.audience_size || 'N/A'}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--gray-500)' }}>
                      Applied: {new Date(aff.applied_at).toLocaleDateString()} | Earned: ${parseFloat(aff.total_earned || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affiliate Details Panel */}
          {selectedAffiliate && affiliateDetails && (
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Details</h3>
                <button onClick={() => { setSelectedAffiliate(null); setAffiliateDetails(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p><strong>Email:</strong> {affiliateDetails.affiliate?.email}</p>
                <p><strong>Business:</strong> {affiliateDetails.affiliate?.business_name || 'N/A'}</p>
                <p><strong>Code:</strong> {affiliateDetails.affiliate?.affiliate_code}</p>
                <p><strong>Commission:</strong> {affiliateDetails.affiliate?.commission_rate}%</p>
                <p><strong>Website:</strong> {affiliateDetails.affiliate?.website || 'N/A'}</p>
                <p><strong>Marketing:</strong> {affiliateDetails.affiliate?.marketing_channels || 'N/A'}</p>
                <p><strong>Audience:</strong> {affiliateDetails.affiliate?.audience_size || 'N/A'}</p>
                <p><strong>Total Earned:</strong> ${parseFloat(affiliateDetails.affiliate?.total_earned || 0).toFixed(2)}</p>
                <p><strong>Pending Balance:</strong> ${parseFloat(affiliateDetails.affiliate?.pending_balance || 0).toFixed(2)}</p>
                <p><strong>Payout Method:</strong> {affiliateDetails.affiliate?.payout_method} ({affiliateDetails.affiliate?.payout_email || 'Not set'})</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {affiliateDetails.affiliate?.status !== 'approved' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(selectedAffiliate, 'approved')} disabled={actionLoading}>
                    <Check size={16} /> Approve
                  </button>
                )}
                {affiliateDetails.affiliate?.status !== 'rejected' && (
                  <button className="btn btn-secondary" style={{ background: '#FEE2E2', color: '#991B1B' }} onClick={() => updateStatus(selectedAffiliate, 'rejected')} disabled={actionLoading}>
                    <X size={16} /> Reject
                  </button>
                )}
                {affiliateDetails.affiliate?.status === 'approved' && (
                  <button className="btn btn-secondary" onClick={() => updateStatus(selectedAffiliate, 'suspended')} disabled={actionLoading}>
                    Suspend
                  </button>
                )}
              </div>

              {/* Payout Form */}
              {affiliateDetails.affiliate?.status === 'approved' && parseFloat(affiliateDetails.affiliate?.pending_balance || 0) > 0 && (
                <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Process Payout</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      id={`payout-${selectedAffiliate}`}
                      className="form-input"
                      placeholder="Amount"
                      defaultValue={affiliateDetails.affiliate?.pending_balance}
                      style={{ width: '120px' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => processPayout(selectedAffiliate, document.getElementById(`payout-${selectedAffiliate}`).value)}
                      disabled={actionLoading}
                    >
                      Pay Out
                    </button>
                  </div>
                </div>
              )}

              {/* Conversions */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Conversions ({affiliateDetails.conversions?.length || 0})</h4>
                {affiliateDetails.conversions?.length > 0 ? (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {affiliateDetails.conversions.map(c => (
                      <div key={c.id} style={{ fontSize: '13px', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        {c.converted_email} - ${parseFloat(c.commission_amount || 0).toFixed(2)} - {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>No conversions yet</p>}
              </div>

              {/* Payouts */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Payouts ({affiliateDetails.payouts?.length || 0})</h4>
                {affiliateDetails.payouts?.length > 0 ? (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {affiliateDetails.payouts.map(p => (
                      <div key={p.id} style={{ fontSize: '13px', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        ${parseFloat(p.amount || 0).toFixed(2)} via {p.method} - {p.status} - {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>No payouts yet</p>}
              </div>
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
          <Route path="/local-business-reviews" element={<LocalBusinessReviewPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
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
            path="/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route path="/join-team" element={<JoinTeamPage />} />
          <Route path="/affiliate" element={<AffiliateLandingPage />} />
          <Route
            path="/affiliate/dashboard"
            element={
              <ProtectedRoute>
                <AffiliateDashboardPage />
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
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          {/* Catch-all route for 404 - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
