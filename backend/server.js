require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Stripe = require('stripe');
const OpenAI = require('openai');
const validator = require('validator');
const crypto = require('crypto');
const { Resend } = require('resend');
const { OAuth2Client } = require('google-auth-library');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Track database connection status
let dbConnected = false;

pool.on('error', err => {
  console.error('Unexpected PostgreSQL pool error:', err);
  dbConnected = false;
});

pool.on('connect', () => {
  console.log('PostgreSQL pool: client connected');
  dbConnected = true;
});

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Email sender addresses (configurable via ENV)
const FROM_EMAIL = process.env.FROM_EMAIL || 'ReviewResponder <hello@tryreviewresponder.com>';
const OUTREACH_FROM_EMAIL =
  process.env.OUTREACH_FROM_EMAIL || 'Berend von ReviewResponder <outreach@tryreviewresponder.com>';

// ==========================================
// EMAIL NOTIFICATION HELPER FUNCTIONS
// ==========================================

// Send Usage Alert Email (when user reaches 80% of limit)
async function sendUsageAlertEmail(user) {
  if (!resend) return false;
  if (!user.email_usage_alerts) return false; // Respect user preference

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "You've used 80% of your monthly responses",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
            .progress-bar { background: #E5E7EB; border-radius: 999px; height: 12px; margin: 20px 0; }
            .progress-fill { background: #F59E0B; border-radius: 999px; height: 12px; width: 80%; }
            .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Usage Alert</h1>
              <p>You're running low on responses</p>
            </div>
            <div class="content">
              <p>Hi${user.business_name ? ' ' + user.business_name : ''},</p>

              <p>You've used <strong>80%</strong> of your monthly response limit on your <strong>${user.subscription_plan}</strong> plan.</p>

              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>

              <p>To ensure uninterrupted service, consider upgrading your plan:</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/pricing" class="cta-button">View Upgrade Options</a>
              </p>

              <p style="color: #6B7280; font-size: 14px;">Or continue using your remaining responses - they'll reset at the start of your next billing cycle.</p>
            </div>
            <div class="footer">
              <p>ReviewResponder - AI-Powered Review Responses</p>
              <p><a href="${FRONTEND_URL}/profile" style="color: #6B7280;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`Usage alert email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send usage alert email:', error);
    return false;
  }
}

// Send Plan Renewal Email (when subscription renews)
async function sendPlanRenewalEmail(user) {
  if (!resend) return false;
  if (!user.email_billing_updates) return false; // Respect user preference

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Your ReviewResponder subscription has renewed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
            .plan-box { background: #F0FDF4; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Renewed</h1>
              <p>Thank you for your continued support!</p>
            </div>
            <div class="content">
              <p>Hi${user.business_name ? ' ' + user.business_name : ''},</p>

              <p>Your ReviewResponder subscription has been successfully renewed.</p>

              <div class="plan-box">
                <p style="margin: 0; color: #059669; font-weight: 600;">Current Plan</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">${user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)}</p>
                <p style="margin: 5px 0 0 0; color: #6B7280;">Your response counter has been reset</p>
              </div>

              <p>Your monthly responses have been refreshed and you're ready to continue creating perfect review responses!</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/dashboard" class="cta-button">Go to Dashboard</a>
              </p>
            </div>
            <div class="footer">
              <p>ReviewResponder - AI-Powered Review Responses</p>
              <p><a href="${FRONTEND_URL}/profile" style="color: #6B7280;">Manage billing & notifications</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`Plan renewal email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send plan renewal email:', error);
    return false;
  }
}

// Middleware
app.use(helmet());

// CORS configuration - allow all origins for Chrome extension compatibility
// Security is handled via JWT tokens, not CORS
app.use(
  cors({
    origin: true, // Allow all origins - extension needs to work on any review site
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key', 'X-API-Key'],
  })
);

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// Rate limiting (increased for testing - 500 req/15min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Database helper functions
async function dbQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

async function dbGet(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.rows[0] || null;
}

async function dbAll(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.rows;
}

// Initialize database tables
async function initDatabase() {
  try {
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        business_name TEXT,
        business_type TEXT,
        business_context TEXT,
        response_style TEXT,
        stripe_customer_id TEXT,
        subscription_status TEXT DEFAULT 'inactive',
        subscription_plan TEXT DEFAULT 'free',
        responses_used INTEGER DEFAULT 0,
        responses_limit INTEGER DEFAULT 20,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        review_text TEXT NOT NULL,
        review_rating INTEGER,
        review_platform TEXT,
        generated_response TEXT NOT NULL,
        tone TEXT DEFAULT 'professional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS response_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        tone TEXT DEFAULT 'professional',
        platform TEXT DEFAULT 'google',
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS email_captures (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        discount_code TEXT DEFAULT 'SAVE20',
        source TEXT DEFAULT 'exit_intent',
        converted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_owner_id INTEGER NOT NULL REFERENCES users(id),
        member_email TEXT NOT NULL,
        member_user_id INTEGER REFERENCES users(id),
        role TEXT DEFAULT 'member',
        invite_token TEXT,
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        UNIQUE(team_owner_id, member_email)
      )
    `);

    // API Keys table for public API access
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        name TEXT DEFAULT 'Default API Key',
        requests_today INTEGER DEFAULT 0,
        requests_total INTEGER DEFAULT 0,
        last_request_at TIMESTAMP,
        last_reset_date DATE DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add onboarding_completed column if it doesn't exist
    try {
      await dbQuery(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      // Column might already exist, that's okay
    }

    // User Feedback / Testimonials table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        user_name TEXT,
        approved BOOLEAN DEFAULT FALSE,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add feedback_submitted column to users table
    try {
      await dbQuery(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS feedback_submitted BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      // Column might already exist
    }

    // Drip email tracking table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS drip_emails (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        email_day INTEGER NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, email_day)
      )
    `);

    // Blog articles table for SEO content generation
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS blog_articles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        meta_description TEXT,
        keywords TEXT,
        topic TEXT,
        tone TEXT DEFAULT 'informative',
        word_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Referrals table for referral system
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id),
        referred_email TEXT NOT NULL,
        referred_user_id INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        reward_given BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        converted_at TIMESTAMP,
        UNIQUE(referrer_id, referred_email)
      )
    `);

    // Add referral columns to users table
    try {
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE`);
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id)`
      );
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0`
      );
    } catch (error) {
      // Columns might already exist
    }

    // Add UTM tracking columns to users table for Google Ads attribution
    try {
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_content TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_term TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_page TEXT`);
    } catch (error) {
      // Columns might already exist
    }

    // Outreach email tracking table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS outreach_tracking (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        campaign TEXT NOT NULL,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT
      )
    `);

    // Add index for faster lookups
    try {
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_outreach_email ON outreach_tracking(email)`);
      await dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_tracking(campaign)`
      );
    } catch (error) {
      // Index might already exist
    }

    // Affiliates table for affiliate/partner program
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        affiliate_code TEXT NOT NULL UNIQUE,
        commission_rate DECIMAL(5,2) DEFAULT 20.00,
        payout_method TEXT DEFAULT 'paypal',
        payout_email TEXT,
        total_earned DECIMAL(10,2) DEFAULT 0.00,
        total_paid DECIMAL(10,2) DEFAULT 0.00,
        pending_balance DECIMAL(10,2) DEFAULT 0.00,
        status TEXT DEFAULT 'pending',
        website TEXT,
        marketing_channels TEXT,
        audience_size TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
      )
    `);

    // Affiliate clicks tracking
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Affiliate conversions (when referred user pays)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS affiliate_conversions (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
        referred_user_id INTEGER NOT NULL REFERENCES users(id),
        subscription_plan TEXT NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        stripe_invoice_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        CONSTRAINT conversion_status CHECK (status IN ('pending', 'approved', 'paid', 'refunded'))
      )
    `);

    // Affiliate payouts
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS affiliate_payouts (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
        amount DECIMAL(10,2) NOT NULL,
        payout_method TEXT NOT NULL,
        payout_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        transaction_id TEXT,
        notes TEXT,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        CONSTRAINT payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
      )
    `);

    // Add affiliate_id column to users table for tracking who referred them
    try {
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_id INTEGER REFERENCES affiliates(id)`
      );
    } catch (error) {
      // Column might already exist
    }

    // Add indexes for affiliate tables
    try {
      await dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_affiliate_clicks ON affiliate_clicks(affiliate_id)`
      );
      await dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_affiliate_conversions ON affiliate_conversions(affiliate_id)`
      );
      await dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_affiliate_payouts ON affiliate_payouts(affiliate_id)`
      );
    } catch (error) {
      // Indexes might already exist
    }

    // Add OAuth columns for Google Sign-In
    try {
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT`);
      await dbQuery(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
    } catch (error) {
      // Columns might already exist or password column already nullable
    }

    // Add Smart AI / Standard AI usage tracking columns
    try {
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS smart_responses_used INTEGER DEFAULT 0`
      );
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS standard_responses_used INTEGER DEFAULT 0`
      );
      await dbQuery(
        `ALTER TABLE responses ADD COLUMN IF NOT EXISTS ai_model VARCHAR(20) DEFAULT 'standard'`
      );
      // Migrate existing usage to standard (backward compatibility)
      await dbQuery(
        `UPDATE users SET standard_responses_used = responses_used WHERE smart_responses_used = 0 AND standard_responses_used = 0 AND responses_used > 0`
      );
    } catch (error) {
      // Columns might already exist
    }

    // Add email notification preferences columns
    try {
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_weekly_summary BOOLEAN DEFAULT TRUE`
      );
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_usage_alerts BOOLEAN DEFAULT TRUE`
      );
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_billing_updates BOOLEAN DEFAULT TRUE`
      );
    } catch (error) {
      // Columns might already exist
    }

    // Add email change columns for secure email updates
    try {
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_token TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_new_email TEXT`);
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMP`);
    } catch (error) {
      // Columns might already exist
    }

    // Add email verification columns (optional banner-based verification)
    try {
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`
      );
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT`);
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP`
      );
    } catch (error) {
      // Columns might already exist
    }

    // Add ai_response column to user_feedback for "dogfooding" section
    try {
      await dbQuery(`ALTER TABLE user_feedback ADD COLUMN IF NOT EXISTS ai_response TEXT`);
    } catch (error) {
      // Column might already exist
    }

    // Add AI context generation rate limiting columns
    try {
      await dbQuery(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS context_generations_today INTEGER DEFAULT 0`
      );
      await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS context_gen_reset_date TEXT`);
    } catch (error) {
      // Columns might already exist
    }

    console.log('📊 Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API Key authentication middleware (for public API)
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required. Include X-API-Key header.' });
  }

  try {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = await dbGet(
      `SELECT ak.*, u.email, u.subscription_plan, u.subscription_status, u.business_name, u.business_type, u.business_context, u.response_style
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.key_hash = $1 AND ak.is_active = TRUE`,
      [keyHash]
    );

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (keyRecord.subscription_plan !== 'unlimited' || keyRecord.subscription_status !== 'active') {
      return res.status(403).json({ error: 'API access requires an active Unlimited plan' });
    }

    const today = new Date().toISOString().split('T')[0];
    let requestsToday = keyRecord.requests_today;

    if (keyRecord.last_reset_date !== today) {
      await dbQuery(`UPDATE api_keys SET requests_today = 0, last_reset_date = $1 WHERE id = $2`, [
        today,
        keyRecord.id,
      ]);
      requestsToday = 0;
    }

    if (requestsToday >= 100) {
      return res
        .status(429)
        .json({
          error: 'Rate limit exceeded. Maximum 100 requests per day.',
          reset_at: 'midnight UTC',
        });
    }

    await dbQuery(
      `UPDATE api_keys SET requests_today = requests_today + 1, requests_total = requests_total + 1, last_request_at = NOW() WHERE id = $1`,
      [keyRecord.id]
    );

    req.apiKeyUser = {
      id: keyRecord.user_id,
      email: keyRecord.email,
      subscription_plan: keyRecord.subscription_plan,
      business_name: keyRecord.business_name,
      business_type: keyRecord.business_type,
      business_context: keyRecord.business_context,
      response_style: keyRecord.response_style,
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Plan limits (monthly and yearly pricing)
// Smart AI = Claude (better quality), Standard = GPT-4o-mini (fast & cheap)
const PLAN_LIMITS = {
  free: {
    smartResponses: 3, // Claude - teaser to show quality
    standardResponses: 17, // GPT-4o-mini
    responses: 20, // Total (for backward compatibility)
    price: 0,
    teamMembers: 0,
  },
  starter: {
    smartResponses: 100,
    standardResponses: 200,
    responses: 300,
    price: 2900,
    yearlyPrice: 27840, // 20% off: $29 * 12 * 0.8 = $278.40
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    teamMembers: 0,
  },
  professional: {
    smartResponses: 300,
    standardResponses: 500,
    responses: 800,
    price: 4900,
    yearlyPrice: 47040, // 20% off: $49 * 12 * 0.8 = $470.40
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    teamMembers: 3,
  },
  unlimited: {
    smartResponses: 999999,
    standardResponses: 999999,
    responses: 999999,
    price: 9900,
    yearlyPrice: 95040, // 20% off: $99 * 12 * 0.8 = $950.40
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_UNLIMITED_YEARLY_PRICE_ID,
    teamMembers: 10,
  },
};

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      businessName,
      referralCode,
      affiliateCode,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landingPage,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Case-insensitive email check
    const existingUser = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [
      email,
    ]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for valid referral code
    let referrerId = null;
    if (referralCode) {
      const referrer = await dbGet('SELECT id FROM users WHERE referral_code = $1', [
        referralCode.toUpperCase(),
      ]);
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Check for valid affiliate code (for 20% recurring commission)
    let affiliateId = null;
    if (affiliateCode) {
      const affiliate = await dbGet(
        'SELECT id FROM affiliates WHERE affiliate_code = $1 AND status = $2',
        [affiliateCode.toUpperCase(), 'approved']
      );
      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code for new user
    let newUserReferralCode;
    let attempts = 0;
    do {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      newUserReferralCode = 'REF-';
      for (let i = 0; i < 8; i++) {
        newUserReferralCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await dbGet('SELECT id FROM users WHERE referral_code = $1', [
        newUserReferralCode,
      ]);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        business_name: businessName || '',
        referred_by: referrerId || '',
        affiliate_id: affiliateId || '',
      },
    });

    const result = await dbQuery(
      `INSERT INTO users (email, password, business_name, stripe_customer_id, responses_limit, referral_code, referred_by, affiliate_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        email,
        hashedPassword,
        businessName || '',
        customer.id,
        PLAN_LIMITS.free.responses,
        newUserReferralCode,
        referrerId,
        affiliateId,
        utmSource || null,
        utmMedium || null,
        utmCampaign || null,
        utmContent || null,
        utmTerm || null,
        landingPage || null,
      ]
    );

    const userId = result.rows[0].id;

    // Create referral record if user was referred
    if (referrerId) {
      await dbQuery(
        `INSERT INTO referrals (referrer_id, referred_email, referred_user_id, status)
         VALUES ($1, $2, $3, 'registered')
         ON CONFLICT (referrer_id, referred_email) DO UPDATE SET referred_user_id = $3, status = 'registered'`,
        [referrerId, email, userId]
      );
      console.log(`✅ User ${email} registered via referral from user ${referrerId}`);
    }

    // Log affiliate registration
    if (affiliateId) {
      console.log(`🤝 User ${email} registered via affiliate ID ${affiliateId}`);
    }

    // Generate email verification token and send verification email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await dbQuery(
      `UPDATE users SET email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3`,
      [verificationToken, verificationExpires, userId]
    );

    // Send verification email (non-blocking - user can still use app)
    if (resend) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'https://tryreviewresponder.com'}/verify-email?token=${verificationToken}`;
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Verify your email - ReviewResponder',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome to ReviewResponder!</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px; color: #374151;">Hi${businessName ? ' ' + businessName : ''},</p>
                <p style="font-size: 16px; color: #374151;">Thanks for signing up! Please verify your email address to get the most out of ReviewResponder.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy this link: <a href="${verifyUrl}" style="color: #667eea;">${verifyUrl}</a></p>
                <p style="font-size: 14px; color: #6b7280;">This link expires in 24 hours.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 12px; color: #9ca3af;">You're receiving this email because you signed up for ReviewResponder. If you didn't sign up, you can ignore this email.</p>
              </div>
            </div>
          `,
        });
        console.log(`📧 Verification email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails - user can resend later
      }
    }

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        businessName,
        plan: 'free',
        responsesUsed: 0,
        responsesLimit: PLAN_LIMITS.free.responses,
        onboardingCompleted: false,
        referralCode: newUserReferralCode,
        emailVerified: false,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email endpoint
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const user = await dbGet(
      `SELECT id, email, email_verified, email_verification_expires_at
       FROM users WHERE email_verification_token = $1`,
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email already verified', alreadyVerified: true });
    }

    if (new Date() > new Date(user.email_verification_expires_at)) {
      return res
        .status(400)
        .json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Mark email as verified and clear token
    await dbQuery(
      `UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires_at = NULL WHERE id = $1`,
      [user.id]
    );

    console.log(`✅ Email verified for user ${user.email}`);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, email, email_verified, business_name FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await dbQuery(
      `UPDATE users SET email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3`,
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    if (resend) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'https://tryreviewresponder.com'}/verify-email?token=${verificationToken}`;
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: 'Verify your email - ReviewResponder',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Verify Your Email</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px; color: #374151;">Hi${user.business_name ? ' ' + user.business_name : ''},</p>
                <p style="font-size: 16px; color: #374151;">Click the button below to verify your email address.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy this link: <a href="${verifyUrl}" style="color: #667eea;">${verifyUrl}</a></p>
                <p style="font-size: 14px; color: #6b7280;">This link expires in 24 hours.</p>
              </div>
            </div>
          `,
        });
        console.log(`📧 Verification email resent to ${user.email}`);
        res.json({ success: true, message: 'Verification email sent' });
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        res.status(500).json({ error: 'Failed to send verification email' });
      }
    } else {
      res.status(500).json({ error: 'Email service not configured' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Case-insensitive email lookup
    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user has a password (OAuth users don't have one)
    if (!user.password) {
      return res.status(400).json({ error: 'Please sign in with Google' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is a team member to get effective plan
    const teamMembership = await dbGet(
      `SELECT tm.*, u.email as owner_email, u.business_name as owner_business,
              u.subscription_plan as owner_plan, u.subscription_status as owner_status
       FROM team_members tm
       JOIN users u ON tm.team_owner_id = u.id
       WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [user.id]
    );

    let effectivePlan = user.subscription_plan || 'free';
    let effectiveStatus = user.subscription_status;
    let teamInfo = null;

    if (teamMembership) {
      effectivePlan = teamMembership.owner_plan || 'free';
      effectiveStatus = teamMembership.owner_status;
      teamInfo = {
        isTeamMember: true,
        teamOwnerEmail: teamMembership.owner_email,
        teamOwnerBusiness: teamMembership.owner_business,
        role: teamMembership.role,
      };
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        plan: effectivePlan,
        ownPlan: user.subscription_plan,
        responsesUsed: user.responses_used,
        responsesLimit: user.responses_limit,
        subscriptionStatus: effectiveStatus,
        ownSubscriptionStatus: user.subscription_status,
        onboardingCompleted: user.onboarding_completed,
        teamInfo: teamInfo,
        emailVerified: user.email_verified || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a team member to get effective plan
    const teamMembership = await dbGet(
      `SELECT tm.*, u.email as owner_email, u.business_name as owner_business,
              u.subscription_plan as owner_plan, u.subscription_status as owner_status,
              u.smart_responses_used as owner_smart_used, u.standard_responses_used as owner_standard_used
       FROM team_members tm
       JOIN users u ON tm.team_owner_id = u.id
       WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [req.user.id]
    );

    let effectivePlan = user.subscription_plan || 'free';
    let effectiveStatus = user.subscription_status;
    let teamInfo = null;

    if (teamMembership) {
      effectivePlan = teamMembership.owner_plan || 'free';
      effectiveStatus = teamMembership.owner_status;
      teamInfo = {
        isTeamMember: true,
        teamOwnerEmail: teamMembership.owner_email,
        teamOwnerBusiness: teamMembership.owner_business,
        role: teamMembership.role,
      };
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        businessType: user.business_type,
        businessContext: user.business_context,
        responseStyle: user.response_style,
        plan: effectivePlan,
        ownPlan: user.subscription_plan,
        responsesUsed: user.responses_used,
        responsesLimit: user.responses_limit,
        subscriptionStatus: effectiveStatus,
        ownSubscriptionStatus: user.subscription_status,
        onboardingCompleted: user.onboarding_completed,
        referralCode: user.referral_code,
        referralCredits: user.referral_credits || 0,
        // Profile page additions
        createdAt: user.created_at,
        oauthProvider: user.oauth_provider,
        profilePicture: user.profile_picture,
        hasPassword: !!user.password,
        // Notification preferences
        emailWeeklySummary: user.email_weekly_summary ?? true,
        emailUsageAlerts: user.email_usage_alerts ?? true,
        emailBillingUpdates: user.email_billing_updates ?? true,
        // Smart/Standard AI usage
        smartResponsesUsed: user.smart_responses_used || 0,
        standardResponsesUsed: user.standard_responses_used || 0,
        // Team info
        teamInfo: teamInfo,
        // Email verification
        emailVerified: user.email_verified || false,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Complete onboarding
app.put('/api/auth/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    await dbQuery('UPDATE users SET onboarding_completed = TRUE WHERE id = $1', [req.user.id]);

    res.json({ success: true, message: 'Onboarding completed' });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Update business profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { businessName, businessType, businessContext, responseStyle } = req.body;

    await dbQuery(
      `UPDATE users SET business_name = $1, business_type = $2, business_context = $3, response_style = $4 WHERE id = $5`,
      [
        businessName || '',
        businessType || '',
        businessContext || '',
        responseStyle || '',
        req.user.id,
      ]
    );

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        businessType: user.business_type,
        businessContext: user.business_context,
        responseStyle: user.response_style,
        plan: user.subscription_plan,
        responsesUsed: user.responses_used,
        responsesLimit: user.responses_limit,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============ AI PERSONALIZATION ============

// Generate Business Context or Response Style with AI
app.post('/api/personalization/generate-context', authenticateToken, async (req, res) => {
  try {
    const { keywords, businessType, businessName, field } = req.body;

    if (!keywords || keywords.trim().length === 0) {
      return res.status(400).json({ error: 'Keywords are required' });
    }

    if (!field || !['context', 'style', 'sample_review'].includes(field)) {
      return res
        .status(400)
        .json({ error: 'Field must be "context", "style", or "sample_review"' });
    }

    // Check if Anthropic is available
    if (!anthropic) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    // Rate limiting: Max 10 generations per day per user
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const today = new Date().toISOString().split('T')[0];

    // Reset counter if new day
    if (user.context_gen_reset_date !== today) {
      await dbQuery(
        'UPDATE users SET context_generations_today = 0, context_gen_reset_date = $1 WHERE id = $2',
        [today, req.user.id]
      );
    } else if ((user.context_generations_today || 0) >= 10) {
      return res.status(429).json({
        error: 'Daily limit reached (10 generations). Try again tomorrow.',
        remaining: 0,
      });
    }

    // Build the prompt based on field type
    let systemPrompt;
    let userMessage;

    if (field === 'context') {
      systemPrompt = `You help a business owner create a professional description of their business.
This description will be used to personalize AI-generated responses to customer reviews.

Business Type: ${businessType || 'General Business'}
Business Name: ${businessName || 'the business'}

Create a professional business description (2-3 sentences) based on the keywords.
Focus on: unique selling points, atmosphere, what makes the business special.
Keep it authentic and not too promotional.
AVOID phrases like "We strive" or "We are committed".
Write in first person plural (we, our).
Respond ONLY with the generated text, no introduction or explanation.`;
      userMessage = `Keywords: ${keywords.trim()}`;
    } else if (field === 'style') {
      systemPrompt = `You help a business owner define their response style for customer reviews.
These guidelines will be used to personalize AI-generated responses.

Business Type: ${businessType || 'General Business'}
Business Name: ${businessName || 'the business'}

Create 3-5 brief style guidelines based on the keywords.
Examples: signature sign-offs, tone of voice, what to always/never mention.
Keep each point short and actionable.
Respond ONLY with the guidelines as bullet points, no introduction.`;
      userMessage = `Keywords: ${keywords.trim()}`;
    } else if (field === 'sample_review') {
      // Generate a sample review that references the business context
      systemPrompt = `You create a realistic 5-star customer review for a business.
The review should subtly reference the business's unique features.

Business Type: ${businessType || 'General Business'}
Business Name: ${businessName || 'the business'}

Create an authentic, positive customer review (2 sentences MAX - keep it SHORT).
- Mention 1 specific detail from the business description
- Sound like a real customer (natural, not promotional)
Respond ONLY with the review text, no quotes.`;
      userMessage = `Business description: ${keywords.trim()}`;
    }

    // Use Claude Sonnet for best quality
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: `${systemPrompt}\n\n${userMessage}` }],
    });

    const generated = response.content[0].text.trim();

    // Update daily counter
    await dbQuery(
      'UPDATE users SET context_generations_today = COALESCE(context_generations_today, 0) + 1 WHERE id = $1',
      [req.user.id]
    );

    // Get remaining generations
    const remaining = 10 - ((user.context_generations_today || 0) + 1);

    res.json({
      generated,
      remaining: Math.max(0, remaining),
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
    });
  } catch (error) {
    console.error('Context generation error:', error);
    res.status(500).json({ error: 'Failed to generate context. Please try again.' });
  }
});

// ============ PROFILE & ACCOUNT MANAGEMENT ============

// Change Password (or Set Password for OAuth users)
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // OAuth user - can always set/change password without current (Google is their primary auth)
    if (user.oauth_provider) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
      return res.json({
        success: true,
        message: 'Password set successfully! You can now login with email & password.',
      });
    }

    // Non-OAuth user - require current password
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password required' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request Email Change
app.post('/api/auth/change-email-request', authenticateToken, async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !validator.isEmail(newEmail)) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Check if email already exists
    const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [newEmail]);
    if (existing) {
      return res.status(400).json({ error: 'This email is already in use' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Verify password if user has one (not pure OAuth)
    if (user.password) {
      if (!password) {
        return res.status(400).json({ error: 'Password required for verification' });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await dbQuery(
      `UPDATE users SET
        email_change_token = $1,
        email_change_new_email = $2,
        email_change_expires_at = $3
      WHERE id = $4`,
      [token, newEmail.toLowerCase(), expiresAt, req.user.id]
    );

    // Send confirmation email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmUrl = `${frontendUrl}/confirm-email?token=${token}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: newEmail,
          subject: 'Confirm Your New Email - ReviewResponder',
          html: `
            <h2>Confirm Your Email Change</h2>
            <p>Hi there,</p>
            <p>You requested to change your ReviewResponder account email to <strong>${newEmail}</strong>.</p>
            <p>Click the button below to confirm this change:</p>
            <p><a href="${confirmUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Change</a></p>
            <p>Or copy this link: ${confirmUrl}</p>
            <p>This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br>ReviewResponder Team</p>
          `,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Confirmation email sent to ${newEmail}. Please check your inbox.`,
    });
  } catch (error) {
    console.error('Change email request error:', error);
    res.status(500).json({ error: 'Failed to process email change request' });
  }
});

// Confirm Email Change
app.post('/api/auth/confirm-email-change', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate token
    const user = await dbGet(
      `SELECT * FROM users
       WHERE email_change_token = $1
         AND email_change_expires_at > NOW()`,
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired confirmation link' });
    }

    const newEmail = user.email_change_new_email;

    // Check again if email is taken (race condition protection)
    const existing = await dbGet(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [newEmail, user.id]
    );
    if (existing) {
      return res.status(400).json({ error: 'This email is already in use' });
    }

    // Update email
    await dbQuery(
      `UPDATE users SET
        email = $1,
        email_change_token = NULL,
        email_change_new_email = NULL,
        email_change_expires_at = NULL
      WHERE id = $2`,
      [newEmail, user.id]
    );

    // Update Stripe customer email
    if (user.stripe_customer_id) {
      try {
        await stripe.customers.update(user.stripe_customer_id, { email: newEmail });
      } catch (stripeError) {
        console.error('Stripe email update error:', stripeError);
      }
    }

    console.log(`✅ User ${user.id} changed email from ${user.email} to ${newEmail}`);

    res.json({
      success: true,
      message: 'Email changed successfully',
      newEmail,
    });
  } catch (error) {
    console.error('Confirm email change error:', error);
    res.status(500).json({ error: 'Failed to confirm email change' });
  }
});

// Get Notification Settings
app.get('/api/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT email_weekly_summary, email_usage_alerts, email_billing_updates FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      emailWeeklySummary: user.email_weekly_summary ?? true,
      emailUsageAlerts: user.email_usage_alerts ?? true,
      emailBillingUpdates: user.email_billing_updates ?? true,
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update Notification Settings
app.put('/api/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const { emailWeeklySummary, emailUsageAlerts, emailBillingUpdates } = req.body;

    await dbQuery(
      `UPDATE users SET
        email_weekly_summary = $1,
        email_usage_alerts = $2,
        email_billing_updates = $3
      WHERE id = $4`,
      [
        emailWeeklySummary ?? true,
        emailUsageAlerts ?? true,
        emailBillingUpdates ?? true,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: 'Notification settings updated',
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Delete Account
app.delete('/api/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password, confirmation } = req.body;

    // Require typing DELETE
    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        error: 'Please type DELETE to confirm account deletion',
      });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Verify password if user has one
    if (user.password) {
      if (!password) {
        return res.status(400).json({ error: 'Password required for verification' });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }
    }

    // Cancel Stripe subscription and delete customer
    if (user.stripe_customer_id) {
      try {
        // Cancel all active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
        });

        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }

        // Delete Stripe customer
        await stripe.customers.del(user.stripe_customer_id);
        console.log(`🗑️ Deleted Stripe customer ${user.stripe_customer_id}`);
      } catch (stripeError) {
        console.error('Stripe cleanup error:', stripeError);
        // Continue with account deletion even if Stripe cleanup fails
      }
    }

    // Delete all user data
    await dbQuery('DELETE FROM responses WHERE user_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM response_templates WHERE user_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM team_members WHERE team_owner_id = $1 OR member_user_id = $1', [
      req.user.id,
    ]);
    await dbQuery('DELETE FROM api_keys WHERE user_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM blog_articles WHERE user_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM referrals WHERE referrer_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM user_feedback WHERE user_id = $1', [req.user.id]);
    await dbQuery('DELETE FROM drip_emails WHERE user_id = $1', [req.user.id]);

    // Delete the user
    await dbQuery('DELETE FROM users WHERE id = $1', [req.user.id]);

    console.log(`🗑️ User ${user.email} (ID: ${user.id}) deleted their account`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Google OAuth Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, referralCode, affiliateCode, utmParams } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!googleClient) {
      return res
        .status(500)
        .json({ error: 'Google Sign-In is not configured. Please contact support.' });
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'] || '';
    const picture = payload['picture'] || null;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Check if user already exists (by email or Google ID)
    let user = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR oauth_id = $2', [
      email,
      googleId,
    ]);

    if (user) {
      // Existing user - update OAuth info and mark email as verified (Google verified it)
      if (!user.oauth_provider) {
        await dbQuery(
          'UPDATE users SET oauth_provider = $1, oauth_id = $2, profile_picture = $3, email_verified = TRUE WHERE id = $4',
          ['google', googleId, picture, user.id]
        );
      } else {
        // Update profile picture and ensure email is verified for Google users
        await dbQuery(
          'UPDATE users SET profile_picture = $1, email_verified = TRUE WHERE id = $2',
          [picture, user.id]
        );
      }

      // Check if user is a team member to get effective plan
      const teamMembership = await dbGet(
        `SELECT tm.*, u.email as owner_email, u.business_name as owner_business,
                u.subscription_plan as owner_plan, u.subscription_status as owner_status
         FROM team_members tm
         JOIN users u ON tm.team_owner_id = u.id
         WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
        [user.id]
      );

      let effectivePlan = user.subscription_plan || 'free';
      let effectiveStatus = user.subscription_status;
      let teamInfo = null;

      if (teamMembership) {
        effectivePlan = teamMembership.owner_plan || 'free';
        effectiveStatus = teamMembership.owner_status;
        teamInfo = {
          isTeamMember: true,
          teamOwnerEmail: teamMembership.owner_email,
          teamOwnerBusiness: teamMembership.owner_business,
          role: teamMembership.role,
        };
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          businessContext: user.business_context,
          responseStyle: user.response_style,
          plan: effectivePlan,
          ownPlan: user.subscription_plan,
          responsesUsed: user.responses_used,
          responsesLimit: user.responses_limit,
          subscriptionStatus: effectiveStatus,
          ownSubscriptionStatus: user.subscription_status,
          onboardingCompleted: user.onboarding_completed,
          profilePicture: picture,
          referralCode: user.referral_code,
          teamInfo: teamInfo,
          emailVerified: true, // Google OAuth users are always verified
        },
      });
    }

    // New user - create account
    const newReferralCode = 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create Stripe customer
    let stripeCustomerId = null;
    try {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: { source: 'google_oauth' },
      });
      stripeCustomerId = customer.id;
    } catch (stripeError) {
      console.error('Stripe customer creation failed:', stripeError);
    }

    // Handle referral
    let referredById = null;
    if (referralCode) {
      const referrer = await dbGet('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Handle affiliate
    let affiliateId = null;
    if (affiliateCode) {
      const affiliate = await dbGet(
        'SELECT id FROM affiliates WHERE code = $1 AND is_active = TRUE',
        [affiliateCode]
      );
      if (affiliate) {
        affiliateId = affiliate.id;
        await dbQuery(
          'INSERT INTO affiliate_clicks (affiliate_id, ip_address, user_agent) VALUES ($1, $2, $3)',
          [affiliateId, req.ip, req.headers['user-agent']]
        );
      }
    }

    // Insert new user (email_verified = true for Google OAuth users)
    const result = await dbQuery(
      `INSERT INTO users (
        email, password, business_name, oauth_provider, oauth_id, profile_picture,
        stripe_customer_id, referral_code, referred_by, affiliate_id,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page,
        email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        email,
        null, // No password for OAuth users
        name,
        'google',
        googleId,
        picture,
        stripeCustomerId,
        newReferralCode,
        referredById,
        affiliateId,
        utmParams?.utm_source || null,
        utmParams?.utm_medium || null,
        utmParams?.utm_campaign || null,
        utmParams?.utm_content || null,
        utmParams?.utm_term || null,
        utmParams?.landing_page || null,
        true, // Google has already verified the email
      ]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        businessName: newUser.business_name,
        plan: 'free',
        responsesUsed: 0,
        responsesLimit: 20,
        onboardingCompleted: false,
        profilePicture: picture,
        referralCode: newReferralCode,
        emailVerified: true, // Google OAuth users are always verified
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

// Password Reset - Request
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Case-insensitive email lookup
    const user = await dbGet('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a reset link will be sent.',
      });
    }

    // Delete any existing tokens for this user
    await dbQuery('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await dbQuery(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send email if Resend is configured
    if (resend && process.env.NODE_ENV === 'production') {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: 'Reset Your Password - ReviewResponder',
          html: `
            <h2>Reset Your Password</h2>
            <p>Hi there,</p>
            <p>You requested a password reset for your ReviewResponder account. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>Or copy this link: ${resetUrl}</p>
            <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br>ReviewResponder Team</p>
          `,
        });
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Continue anyway - don't reveal email sending failed
      }
    } else {
      // Development mode or Resend not configured
      console.log(`📧 Password reset requested for ${email}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      if (!resend) {
        console.log('⚠️  Resend not configured - add RESEND_API_KEY to environment variables');
      }
    }

    res.json({ success: true, message: 'If an account exists, a reset link will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Password Reset - Reset with Token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find valid token
    const resetToken = await dbGet(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (!resetToken) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 12);
    await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      resetToken.user_id,
    ]);

    // Mark token as used
    await dbQuery('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetToken.id]);

    console.log(`✅ Password reset successful for user ID ${resetToken.user_id}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============ RESPONSE GENERATION ============

// Alias for Chrome extension (shorter path)
app.post('/api/generate', authenticateToken, (req, res) => generateResponseHandler(req, res));

// Main response generation endpoint
app.post('/api/responses/generate', authenticateToken, (req, res) =>
  generateResponseHandler(req, res)
);

// ========== RESPONSE QUALITY SCORING ==========
function evaluateResponseQuality(response, reviewText, tone, reviewRating) {
  let score = 70; // Base score
  const feedback = [];
  const suggestions = [];

  // 1. Length Check (ideal: 100-400 chars)
  const len = response.length;
  if (len >= 100 && len <= 400) {
    score += 10;
    feedback.push('Good length');
  } else if (len < 80) {
    score -= 10;
    suggestions.push('Response is quite short');
  } else if (len > 500) {
    score -= 5;
    suggestions.push('Consider shortening for better engagement');
  }

  // 2. Personalization (references review content)
  const reviewWords = reviewText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4);
  const responseWords = response.toLowerCase();
  const matchedWords = reviewWords.filter(
    w =>
      responseWords.includes(w) &&
      !['their', 'about', 'would', 'could', 'should', 'which', 'there'].includes(w)
  );
  if (matchedWords.length >= 2) {
    score += 10;
    feedback.push('Personalized response');
  } else if (matchedWords.length === 0) {
    suggestions.push('Add specific details from the review');
  }

  // 3. Avoid generic openings
  const genericStarts = [
    'dear customer',
    'dear valued',
    'thank you for your feedback',
    'we appreciate your',
  ];
  const lowerResponse = response.toLowerCase();
  const hasGenericStart = genericStarts.some(g => lowerResponse.startsWith(g));
  if (!hasGenericStart) {
    score += 5;
  } else {
    suggestions.push('Avoid generic openings');
  }

  // 4. Call to action / invitation
  const ctaPhrases = [
    'visit',
    'return',
    'come back',
    'see you',
    'welcome back',
    'next time',
    'look forward',
    'contact',
    'reach out',
    'call us',
    'email',
  ];
  const hasCTA = ctaPhrases.some(p => lowerResponse.includes(p));
  if (hasCTA) {
    score += 5;
    feedback.push('Includes call to action');
  }

  // 5. Appropriate for rating (negative reviews need more empathy)
  if (reviewRating && reviewRating <= 2) {
    const empathyWords = [
      'sorry',
      'apologize',
      'understand',
      'concerned',
      'disappointing',
      'frustrating',
    ];
    const hasEmpathy = empathyWords.some(w => lowerResponse.includes(w));
    if (hasEmpathy) {
      score += 5;
      feedback.push('Shows empathy for negative experience');
    } else if (tone === 'apologetic') {
      suggestions.push('Add more empathetic language');
    }
  }

  // 6. No defensive language
  const defensiveWords = [
    'but actually',
    'however you',
    "that's not true",
    'you must have',
    'impossible',
  ];
  const hasDefensive = defensiveWords.some(w => lowerResponse.includes(w));
  if (hasDefensive) {
    score -= 15;
    suggestions.push('Avoid defensive language');
  }

  // Determine level
  let level = 'good';
  if (score >= 85) level = 'excellent';
  else if (score < 70) level = 'needs_work';

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level,
    feedback: feedback.length > 0 ? feedback.join(', ') : 'Solid response',
    suggestions,
  };
}

async function generateResponseHandler(req, res) {
  try {
    const {
      reviewText,
      reviewRating,
      platform,
      tone,
      outputLanguage,
      businessName,
      customInstructions,
      responseLength,
      includeEmojis,
      aiModel = 'auto',
      templateContent,
    } = req.body;

    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    // Check usage limits (with team support)
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check if user is a team member
    const teamMembership = await dbGet(
      `SELECT tm.*, u.id as owner_id, u.subscription_plan as owner_plan, u.smart_responses_used as owner_smart_used, u.standard_responses_used as owner_standard_used, u.business_name as owner_business, u.business_type as owner_business_type, u.business_context as owner_context, u.response_style as owner_style
       FROM team_members tm
       JOIN users u ON tm.team_owner_id = u.id
       WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [req.user.id]
    );

    let usageOwner = user; // Who's usage we check/update
    let isTeamMember = false;
    let effectivePlan = user.subscription_plan || 'free';

    if (teamMembership) {
      isTeamMember = true;
      effectivePlan = teamMembership.owner_plan || 'free';
      // All team members can generate responses (simplified role system)
      // Use team owner's usage limits
      usageOwner = {
        id: teamMembership.owner_id,
        subscription_plan: teamMembership.owner_plan,
        smart_responses_used: teamMembership.owner_smart_used || 0,
        standard_responses_used: teamMembership.owner_standard_used || 0,
        business_name: teamMembership.owner_business,
        business_type: teamMembership.owner_business_type,
        business_context: teamMembership.owner_context,
        response_style: teamMembership.owner_style,
      };
    }

    // Get plan limits
    const planLimits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;
    const smartUsed = usageOwner.smart_responses_used || 0;
    const standardUsed = usageOwner.standard_responses_used || 0;
    const smartRemaining = planLimits.smartResponses - smartUsed;
    const standardRemaining = planLimits.standardResponses - standardUsed;

    // Determine which AI model to use
    let useModel = 'standard'; // Default: GPT-4o-mini

    if (aiModel === 'smart') {
      // User explicitly wants Smart AI (Claude)
      if (smartRemaining <= 0) {
        return res.status(403).json({
          error: 'No Smart AI responses remaining',
          smartRemaining: 0,
          standardRemaining,
          suggestion: standardRemaining > 0 ? 'Switch to Standard AI' : 'Upgrade your plan',
        });
      }
      useModel = 'smart';
    } else if (aiModel === 'auto') {
      // Auto: Smart if available, otherwise Standard
      useModel = smartRemaining > 0 ? 'smart' : 'standard';

      if (useModel === 'standard' && standardRemaining <= 0) {
        return res.status(403).json({
          error: 'No responses remaining',
          smartRemaining: 0,
          standardRemaining: 0,
          upgrade: !isTeamMember,
          message: isTeamMember
            ? 'Your team has reached the monthly response limit. Contact your team owner.'
            : 'You have reached your monthly response limit. Please upgrade your plan to continue.',
        });
      }
    } else {
      // Standard explicitly chosen
      if (standardRemaining <= 0) {
        return res.status(403).json({
          error: 'No Standard responses remaining',
          smartRemaining,
          standardRemaining: 0,
          suggestion: smartRemaining > 0 ? 'Switch to Smart AI' : 'Upgrade your plan',
        });
      }
    }

    // ========== OPTIMIZED PROMPT SYSTEM ==========

    // Rating-specific strategies for better responses
    const ratingStrategies = {
      5: {
        goal: 'Reinforce positive feelings, encourage return visit',
        approach:
          'Express genuine gratitude, mention something specific from their review, invite them back',
        length: '2-3 sentences',
        avoid: 'Being too generic or effusive',
      },
      4: {
        goal: 'Thank them while subtly showing you care about perfection',
        approach:
          'Appreciate their feedback, acknowledge room for improvement without being defensive',
        length: '2-3 sentences',
        avoid: 'Ignoring their slight criticism',
      },
      3: {
        goal: 'Show you take feedback seriously',
        approach:
          'Acknowledge their mixed experience, express desire to do better, invite them to give you another chance',
        length: '3-4 sentences',
        avoid: 'Being dismissive or overly apologetic',
      },
      2: {
        goal: 'Recover the relationship',
        approach:
          'Sincerely acknowledge disappointment, take responsibility, offer concrete resolution',
        length: '3-4 sentences',
        avoid: 'Making excuses or being defensive',
      },
      1: {
        goal: 'Damage control, show professionalism to future readers',
        approach:
          'Acknowledge frustration, take ownership, apologize specifically, offer direct contact to resolve',
        length: '4-5 sentences',
        avoid: 'Arguing, making excuses, passive-aggressive tone',
      },
    };

    // Enhanced tone definitions with examples
    const toneDefinitions = {
      professional: {
        description: 'Professional and courteous - polished but warm',
        goodExample: 'We really appreciate you sharing this. Our team takes great pride in...',
        avoidExample: 'Thank you for your feedback. We value your input.',
      },
      friendly: {
        description: 'Warm and personable - like a friend who runs a great business',
        goodExample: 'You just made our day! We loved having you...',
        avoidExample: 'Dear valued customer, we appreciate your kind words.',
      },
      formal: {
        description: 'Formal and business-appropriate - for upscale brands',
        goodExample: 'We are honored by your gracious review. Our commitment to excellence...',
        avoidExample: 'Hey thanks for the review!',
      },
      apologetic: {
        description: 'Empathetic and solution-focused - takes ownership',
        goodExample: 'We completely understand your frustration, and we take this seriously...',
        avoidExample: 'We apologize for any inconvenience this may have caused.',
      },
    };

    // ========== PERFECTED PROMPT - CLAUDE STYLE ==========

    // Response length mapping
    const lengthInstructions = {
      short: '1-2 sentences. Be concise.',
      medium: '2-3 sentences. Balanced length.',
      detailed: '4-5 sentences. More thorough.',
    };
    const lengthInstruction = lengthInstructions[responseLength] || lengthInstructions.medium;

    // Emoji instruction
    const emojiInstruction = includeEmojis
      ? 'You MAY include 1-2 relevant emojis if appropriate.'
      : 'Do NOT use any emojis.';

    const writingStyleInstructions = `
OUTPUT FORMAT:
Write the response directly. No quotes around it. No "Response:" prefix. Just the text.

VOICE:
You are the business owner. Not customer service. The actual owner who built this place.
Write like you talk. Warm but not gushing. Confident but not arrogant.

BANNED (instant AI detection):
Words: thrilled, delighted, excited, absolutely, incredibly, amazing, wonderful, commendable
Corporate: embark, delve, foster, leverage, journey, beacon, tapestry, vital, crucial
Phrases: "Thank you for your feedback" | "We appreciate you taking the time" | "means the world"
         "Your satisfaction is our priority" | "Sorry for any inconvenience" | "Please don't hesitate"

STYLE RULES:
- Contractions always (we're, you'll, it's, that's, don't)
- Short sentences. Some fragments. Vary rhythm.
- Zero or one exclamation mark total
- Reference specific details they mentioned
- No em-dashes. Use periods or commas instead.

LENGTH: ${lengthInstruction}
EMOJIS: ${emojiInstruction}`;

    // Few-shot examples matching our demo style exactly
    const fewShotExamples = {
      positive: {
        review:
          'Amazing pizza! The crust was perfectly crispy and the toppings were fresh. Service was quick and friendly.',
        goodResponse:
          'Really happy the crust worked for you. We let our dough rest 48 hours, and it makes all the difference. See you next time.',
      },
      negative: {
        review:
          'Waited 45 minutes for our food. When it finally arrived, it was cold. Very disappointed.',
        goodResponse:
          "45 minutes and cold food. That's on us, and we're sorry. Not the experience we want anyone to have. Reach out to us directly and we'll make it right.",
      },
    };

    // Get rating strategy
    const getRatingStrategy = rating => {
      if (!rating) return null;
      return ratingStrategies[rating] || ratingStrategies[3];
    };

    // Build the optimized prompt
    const ratingStrategy = getRatingStrategy(reviewRating);
    const toneConfig = toneDefinitions[tone] || toneDefinitions.professional;
    const isNegative = reviewRating && reviewRating <= 2;
    const exampleToUse = isNegative ? fewShotExamples.negative : fewShotExamples.positive;

    // Language mapping for output language selection
    const languageNames = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      pl: 'Polish',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      tr: 'Turkish',
      sv: 'Swedish',
      da: 'Danish',
      no: 'Norwegian',
      fi: 'Finnish',
    };

    // Build language instruction
    const languageInstruction =
      !outputLanguage || outputLanguage === 'auto'
        ? 'You MUST respond in the EXACT SAME language as the review. If the review is in English, respond in English. If German, respond in German. Match the review language exactly.'
        : `You MUST write the response in ${languageNames[outputLanguage] || 'English'}.`;

    // Build business context section (use team owner's context if team member)
    const contextUser = isTeamMember ? usageOwner : user;

    // ========== OPTIMIZED SYSTEM + USER MESSAGE STRUCTURE ==========

    const systemMessage = `You own ${businessName || contextUser.business_name || 'a business'}${contextUser.business_type ? ` (${contextUser.business_type})` : ''}. You're responding to a review on ${platform || 'Google'}.
${contextUser.business_context ? `\nAbout your business: ${contextUser.business_context}` : ''}
${contextUser.response_style ? `\nIMPORTANT - Follow these custom instructions: ${contextUser.response_style}` : ''}
${templateContent ? `\nTEMPLATE STYLE GUIDE: Use this template as a style reference. Match its tone, structure, and approach, but adapt the content to address the specific review:\n"${templateContent}"` : ''}

${writingStyleInstructions}

EXAMPLE:
Customer: "${exampleToUse.review}"
You: ${exampleToUse.goodResponse}

LANGUAGE: ${languageInstruction}`;

    const userMessage = `${reviewRating ? `[${reviewRating} stars] ` : ''}${reviewText}${ratingStrategy ? `\n\n(${ratingStrategy.length})` : ''}${customInstructions ? `\n\nIMPORTANT - Follow these instructions: ${customInstructions}` : ''}`;

    // Generate response using selected AI model
    let generatedResponse;

    if (useModel === 'smart' && anthropic) {
      // Use Claude for Smart AI
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 350,
        system: systemMessage,
        messages: [{ role: 'user', content: userMessage }],
      });
      generatedResponse = response.content[0].text.trim();
    } else {
      // Use GPT-4o-mini for Standard AI (or fallback if no Anthropic key)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 350,
        temperature: 0.6,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      generatedResponse = completion.choices[0].message.content.trim();
      // If we intended smart but fell back, mark as standard
      if (useModel === 'smart' && !anthropic) {
        useModel = 'standard';
      }
    }

    // Check if this is an onboarding demo request (don't count usage or save to history)
    const isOnboardingDemo = req.body.isOnboarding === true && user.onboarding_completed === false;

    // Usage owner for tracking
    const usageOwnerId = isTeamMember ? usageOwner.id : req.user.id;

    let updatedOwner;
    let updatedPlanLimits;
    let totalUsed;
    let totalLimit;

    if (!isOnboardingDemo) {
      // Save response with AI model info
      await dbQuery(
        `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone, ai_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.id,
          reviewText,
          reviewRating || null,
          platform || 'google',
          generatedResponse,
          tone || 'professional',
          useModel,
        ]
      );

      // Update the correct usage counter
      if (useModel === 'smart') {
        await dbQuery(
          'UPDATE users SET smart_responses_used = smart_responses_used + 1, responses_used = responses_used + 1 WHERE id = $1',
          [usageOwnerId]
        );
      } else {
        await dbQuery(
          'UPDATE users SET standard_responses_used = standard_responses_used + 1, responses_used = responses_used + 1 WHERE id = $1',
          [usageOwnerId]
        );
      }

      updatedOwner = await dbGet('SELECT * FROM users WHERE id = $1', [usageOwnerId]);
      updatedPlanLimits = PLAN_LIMITS[updatedOwner.subscription_plan || 'free'] || PLAN_LIMITS.free;
      totalUsed =
        (updatedOwner.smart_responses_used || 0) + (updatedOwner.standard_responses_used || 0);
      totalLimit = updatedPlanLimits.responses;

      const usagePercent = Math.round((totalUsed / totalLimit) * 100);
      const previousTotal = totalUsed - 1;
      const previousPercent = Math.round((previousTotal / totalLimit) * 100);

      // Send alert if just crossed 80% threshold (send to owner)
      if (
        usagePercent >= 80 &&
        previousPercent < 80 &&
        updatedOwner.subscription_plan !== 'unlimited'
      ) {
        const canSendAlert =
          !updatedOwner.last_usage_alert_sent ||
          new Date(updatedOwner.last_usage_alert_sent) < new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (canSendAlert && process.env.NODE_ENV === 'production') {
          sendUsageAlertEmail(updatedOwner).then(sent => {
            if (sent) {
              dbQuery('UPDATE users SET last_usage_alert_sent = NOW() WHERE id = $1', [
                usageOwnerId,
              ]);
            }
          });
        }
      }
    } else {
      // Onboarding demo: return current usage without incrementing
      updatedOwner = usageOwner;
      updatedPlanLimits = planLimits;
      totalUsed =
        (usageOwner.smart_responses_used || 0) + (usageOwner.standard_responses_used || 0);
      totalLimit = planLimits.responses;
    }

    // Evaluate response quality
    const quality = evaluateResponseQuality(generatedResponse, reviewText, tone, reviewRating);

    res.json({
      response: generatedResponse,
      aiModel: useModel,
      quality, // NEW: Quality score object
      usage: {
        smart: {
          used: updatedOwner.smart_responses_used || 0,
          limit: updatedPlanLimits.smartResponses,
        },
        standard: {
          used: updatedOwner.standard_responses_used || 0,
          limit: updatedPlanLimits.standardResponses,
        },
        total: {
          used: totalUsed,
          limit: totalLimit,
        },
      },
      // Backward compatibility
      responsesUsed: totalUsed,
      responsesLimit: totalLimit,
      isTeamUsage: isTeamMember,
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}

// ========== RESPONSE VARIATIONS (3 Options) ==========
app.post('/api/generate-variations', authenticateToken, async (req, res) => {
  try {
    const {
      reviewText,
      reviewRating,
      platform,
      tone,
      outputLanguage,
      businessName,
      responseLength,
      includeEmojis,
      templateContent,
    } = req.body;

    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    // Check usage limits (requires 3 responses)
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const planLimits = PLAN_LIMITS[user.subscription_plan || 'free'] || PLAN_LIMITS.free;
    const totalUsed = (user.smart_responses_used || 0) + (user.standard_responses_used || 0);
    const remaining = planLimits.responses - totalUsed;

    // Need at least 3 credits for variations
    if (remaining < 3) {
      return res.status(403).json({
        error: 'Not enough responses remaining',
        message: `Variations requires 3 response credits. You have ${remaining} remaining.`,
        upgrade: true,
      });
    }

    // Variation styles - each creates a slightly different response
    const variationStyles = [
      {
        name: 'concise',
        instruction: 'Keep the response brief and to the point (2-3 sentences max).',
        temp: 0.5,
      },
      {
        name: 'detailed',
        instruction: 'Include specific details and a personal touch. Be warm and conversational.',
        temp: 0.7,
      },
      {
        name: 'actionable',
        instruction: 'Focus on solutions and next steps. Include a clear call to action.',
        temp: 0.6,
      },
    ];

    // Language map
    const languageNames = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      pl: 'Polish',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
    };

    const languageInstruction =
      !outputLanguage || outputLanguage === 'auto'
        ? 'Respond in the EXACT SAME language as the review.'
        : `Respond in ${languageNames[outputLanguage] || 'English'}.`;

    // Tone map
    const toneStyles = {
      professional: 'Professional and courteous',
      friendly: 'Warm and friendly',
      formal: 'Formal and polished',
      apologetic: 'Empathetic and apologetic',
    };
    const toneStyle = toneStyles[tone] || toneStyles.professional;

    // Template style guide if provided
    const templateGuide = templateContent
      ? `\nTEMPLATE STYLE GUIDE: Use this template as a style reference. Match its tone, structure, and approach, but adapt the content to the specific review:\n"${templateContent}"`
      : '';

    // Generate all 3 variations in parallel
    const variationPromises = variationStyles.map(async (style, index) => {
      const systemMessage = `You are responding to a customer review for ${businessName || 'our business'}. Tone: ${toneStyle}. ${style.instruction} ${languageInstruction}${templateGuide}`;

      const userMessage = `${reviewRating ? `[${reviewRating} star review] ` : ''}${reviewText}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 350,
        temperature: style.temp,
      });

      const generatedResponse = completion.choices[0].message.content.trim();
      const quality = evaluateResponseQuality(generatedResponse, reviewText, tone, reviewRating);

      return {
        id: index + 1,
        style: style.name,
        response: generatedResponse,
        quality,
      };
    });

    const variations = await Promise.all(variationPromises);

    // Save only the first variation to history (user can save others manually)
    await dbQuery(
      `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone, ai_model)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        reviewText,
        reviewRating || null,
        platform || 'google',
        variations[0].response,
        tone || 'professional',
        'standard',
      ]
    );

    // Update usage (count as 3 responses)
    await dbQuery(
      'UPDATE users SET standard_responses_used = standard_responses_used + 3, responses_used = responses_used + 3 WHERE id = $1',
      [req.user.id]
    );

    const updatedUser = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const updatedTotalUsed =
      (updatedUser.smart_responses_used || 0) + (updatedUser.standard_responses_used || 0);

    res.json({
      variations,
      usage: {
        used: updatedTotalUsed,
        limit: planLimits.responses,
        creditsUsed: 3,
      },
    });
  } catch (error) {
    console.error('Variations generation error:', error);
    res.status(500).json({ error: 'Failed to generate variations' });
  }
});

// Bulk Response Generation (Paid plans only: Starter/Pro/Unlimited)
app.post('/api/generate-bulk', authenticateToken, async (req, res) => {
  try {
    const { reviews, tone, platform, outputLanguage, aiModel = 'auto' } = req.body;

    // Validate input
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'Reviews array is required' });
    }

    if (reviews.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 reviews per batch' });
    }

    // Check user plan (Paid plans only: Starter/Pro/Unlimited) with team support
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check if user is a team member
    const teamMembership = await dbGet(
      `SELECT tm.*, u.id as owner_id, u.subscription_plan as owner_plan, u.smart_responses_used as owner_smart_used, u.standard_responses_used as owner_standard_used, u.business_name as owner_business, u.business_type as owner_business_type, u.business_context as owner_context
       FROM team_members tm
       JOIN users u ON tm.team_owner_id = u.id
       WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [req.user.id]
    );

    let usageOwner = user;
    let isTeamMember = false;
    let effectivePlan = user.subscription_plan;

    if (teamMembership) {
      isTeamMember = true;
      // All team members can generate (simplified role system)
      usageOwner = {
        id: teamMembership.owner_id,
        smart_responses_used: teamMembership.owner_smart_used || 0,
        standard_responses_used: teamMembership.owner_standard_used || 0,
        business_name: teamMembership.owner_business,
        business_type: teamMembership.owner_business_type,
        business_context: teamMembership.owner_context,
      };
      effectivePlan = teamMembership.owner_plan;
    }

    if (!['starter', 'professional', 'unlimited'].includes(effectivePlan)) {
      return res.status(403).json({
        error: 'Bulk generation is only available for paid plans (Starter, Pro, Unlimited)',
        upgrade: !isTeamMember,
        requiredPlan: 'starter',
      });
    }

    // Get plan limits and check usage
    const planLimits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;
    const smartUsed = usageOwner.smart_responses_used || 0;
    const standardUsed = usageOwner.standard_responses_used || 0;
    const smartRemaining = planLimits.smartResponses - smartUsed;
    const standardRemaining = planLimits.standardResponses - standardUsed;
    const reviewCount = reviews.filter(r => r.trim()).length;

    // Determine which AI model to use for bulk
    let useModel = 'standard'; // Default for bulk: Standard (faster, cheaper)

    if (aiModel === 'smart') {
      if (smartRemaining < reviewCount) {
        return res.status(403).json({
          error: `Not enough Smart AI responses. You need ${reviewCount} but only have ${smartRemaining} left.`,
          suggestion:
            standardRemaining >= reviewCount ? 'Switch to Standard AI' : 'Upgrade your plan',
        });
      }
      useModel = 'smart';
    } else if (aiModel === 'auto') {
      // For bulk, prefer standard to save smart responses for single generations
      useModel =
        standardRemaining >= reviewCount
          ? 'standard'
          : smartRemaining >= reviewCount
            ? 'smart'
            : 'standard';

      if (standardRemaining < reviewCount && smartRemaining < reviewCount) {
        return res.status(403).json({
          error: `Not enough responses remaining. You need ${reviewCount} but only have ${Math.max(smartRemaining, standardRemaining)} left.`,
          upgrade: !isTeamMember,
        });
      }
    } else {
      if (standardRemaining < reviewCount) {
        return res.status(403).json({
          error: `Not enough Standard responses. You need ${reviewCount} but only have ${standardRemaining} left.`,
          suggestion: smartRemaining >= reviewCount ? 'Switch to Smart AI' : 'Upgrade your plan',
        });
      }
    }

    // ========== OPTIMIZED BULK PROMPT SYSTEM ==========

    // Reuse optimized prompt components
    const bulkRatingStrategies = {
      5: {
        goal: 'Reinforce positive feelings',
        approach: 'Express genuine gratitude, mention specifics',
        length: '2-3 sentences',
      },
      4: {
        goal: 'Thank while showing you care',
        approach: 'Appreciate feedback, acknowledge room for improvement',
        length: '2-3 sentences',
      },
      3: {
        goal: 'Show you take feedback seriously',
        approach: 'Acknowledge mixed experience, invite them back',
        length: '3-4 sentences',
      },
      2: {
        goal: 'Recover the relationship',
        approach: 'Take responsibility, offer resolution',
        length: '3-4 sentences',
      },
      1: {
        goal: 'Damage control',
        approach: 'Acknowledge frustration, offer direct contact',
        length: '4-5 sentences',
      },
    };

    const bulkToneDefinitions = {
      professional: {
        description: 'Professional and courteous - polished but warm',
        avoid: 'Thank you for your feedback',
      },
      friendly: {
        description: 'Warm and personable - like a friend',
        avoid: 'Dear valued customer',
      },
      formal: { description: 'Formal and business-appropriate', avoid: 'Hey thanks!' },
      apologetic: {
        description: 'Empathetic and solution-focused',
        avoid: 'We apologize for any inconvenience',
      },
    };

    // Claude-style instructions for bulk (compact version)
    const bulkWritingStyle = `OUTPUT: Write response directly. No quotes around it. No "Response:" prefix.
STYLE: Write like the actual business owner. Warm but understated, direct, not gushing.
BANNED: thrilled, delighted, excited, absolutely, incredibly, amazing, embark, delve, foster, leverage
NO PHRASES: "Thank you for your feedback", "We appreciate you taking the time", "Sorry for any inconvenience"
RULES: Use contractions. Short sentences. Max 1 exclamation mark. No em-dashes. Be specific about what they mentioned.`;

    const bulkLanguageNames = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      pl: 'Polish',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      tr: 'Turkish',
      sv: 'Swedish',
      da: 'Danish',
      no: 'Norwegian',
      fi: 'Finnish',
    };

    const bulkLanguageInstruction =
      !outputLanguage || outputLanguage === 'auto'
        ? 'Respond in the SAME language as the review.'
        : `Respond in ${bulkLanguageNames[outputLanguage] || 'English'}.`;

    const contextUser = isTeamMember ? usageOwner : user;

    // Process all reviews in parallel
    const generateSingleResponse = async (reviewText, index) => {
      if (!reviewText.trim()) {
        return { index, success: false, error: 'Empty review' };
      }

      try {
        const bulkSystemMessage = `You're a small business owner responding to reviews. Not a customer service rep - the owner.

BUSINESS: ${contextUser.business_name || 'Our business'}${contextUser.business_type ? ` (${contextUser.business_type})` : ''}
${contextUser.business_context ? `About: ${contextUser.business_context}` : ''}
${contextUser.response_style ? `IMPORTANT - Follow these custom instructions: ${contextUser.response_style}` : ''}

${bulkWritingStyle}

LANGUAGE: ${bulkLanguageInstruction}`;

        const bulkUserMessage = `[Review] ${reviewText}`;

        let generatedResponse;

        if (useModel === 'smart' && anthropic) {
          // Use Claude for Smart AI
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 350,
            system: bulkSystemMessage,
            messages: [{ role: 'user', content: bulkUserMessage }],
          });
          generatedResponse = response.content[0].text.trim();
        } else {
          // Use GPT-4o-mini for Standard AI
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: bulkSystemMessage },
              { role: 'user', content: bulkUserMessage },
            ],
            max_tokens: 350,
            temperature: 0.6,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
          });
          generatedResponse = completion.choices[0].message.content.trim();
        }

        // Save to database with AI model
        await dbQuery(
          `INSERT INTO responses (user_id, review_text, review_platform, generated_response, tone, ai_model)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user.id,
            reviewText,
            platform || 'google',
            generatedResponse,
            tone || 'professional',
            useModel,
          ]
        );

        return {
          index,
          success: true,
          review: reviewText,
          response: generatedResponse,
          aiModel: useModel,
        };
      } catch (error) {
        console.error(`Error generating response for review ${index}:`, error);
        return {
          index,
          success: false,
          review: reviewText,
          error: 'Failed to generate response',
        };
      }
    };

    // Process all reviews in parallel
    const results = await Promise.all(
      reviews.map((review, index) => generateSingleResponse(review, index))
    );

    // Count successful generations
    const successCount = results.filter(r => r.success).length;

    // Update usage count for the account owner (team owner if team member)
    const usageOwnerId = isTeamMember ? usageOwner.id : req.user.id;

    // Update correct usage counter based on model used
    if (useModel === 'smart') {
      await dbQuery(
        'UPDATE users SET smart_responses_used = smart_responses_used + $1, responses_used = responses_used + $1 WHERE id = $2',
        [successCount, usageOwnerId]
      );
    } else {
      await dbQuery(
        'UPDATE users SET standard_responses_used = standard_responses_used + $1, responses_used = responses_used + $1 WHERE id = $2',
        [successCount, usageOwnerId]
      );
    }

    const updatedOwner = await dbGet('SELECT * FROM users WHERE id = $1', [usageOwnerId]);
    const updatedPlanLimits =
      PLAN_LIMITS[updatedOwner.subscription_plan || 'free'] || PLAN_LIMITS.free;

    res.json({
      isTeamUsage: isTeamMember,
      aiModel: useModel,
      results: results.sort((a, b) => a.index - b.index),
      summary: {
        total: reviews.length,
        successful: successCount,
        failed: reviews.length - successCount,
      },
      usage: {
        smart: {
          used: updatedOwner.smart_responses_used || 0,
          limit: updatedPlanLimits.smartResponses,
        },
        standard: {
          used: updatedOwner.standard_responses_used || 0,
          limit: updatedPlanLimits.standardResponses,
        },
      },
      responsesUsed:
        (updatedOwner.smart_responses_used || 0) + (updatedOwner.standard_responses_used || 0),
      responsesLimit: updatedPlanLimits.responses,
    });
  } catch (error) {
    console.error('Bulk generation error:', error);
    res.status(500).json({ error: 'Failed to generate bulk responses' });
  }
});

app.get('/api/responses/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const responses = await dbAll(
      `SELECT * FROM responses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const total = await dbGet('SELECT COUNT(*) as count FROM responses WHERE user_id = $1', [
      req.user.id,
    ]);

    res.json({
      responses,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit),
      },
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ============ STRIPE BILLING ============

app.post('/api/billing/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { plan, billing = 'monthly', discountCode } = req.body;

    if (!PLAN_LIMITS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PLAN_LIMITS[plan];
    const isYearly = billing === 'yearly';
    const priceId = isYearly ? planConfig.yearlyPriceId : planConfig.priceId;

    if (!priceId) {
      return res.status(400).json({ error: `${billing} billing not available for this plan` });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check for discount code
    let discounts = [];
    const upperDiscountCode = discountCode ? discountCode.toUpperCase() : '';

    if (upperDiscountCode === 'EARLY50') {
      // Create a 50% off coupon for early adopters
      try {
        const coupon = await stripe.coupons.create({
          percent_off: 50,
          duration: 'forever',
          id: `EARLY50_${Date.now()}_${user.id}`,
          metadata: {
            campaign: 'early_adopter',
            user_id: user.id.toString(),
          },
        });
        discounts = [
          {
            coupon: coupon.id,
          },
        ];
      } catch (err) {
        console.log('Coupon creation error:', err);
        // Continue without discount if coupon fails
      }
    } else if (upperDiscountCode === 'HUNTLAUNCH') {
      // Product Hunt Launch - 60% off for first 24 hours
      try {
        const coupon = await stripe.coupons.create({
          percent_off: 60,
          duration: 'once', // Only first payment
          id: `HUNTLAUNCH_${Date.now()}_${user.id}`,
          redeem_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Valid for 24 hours
          metadata: {
            campaign: 'product_hunt_launch',
            user_id: user.id.toString(),
          },
        });
        discounts = [
          {
            coupon: coupon.id,
          },
        ];
      } catch (err) {
        console.log('HUNTLAUNCH coupon creation error:', err);
        // Continue without discount if coupon fails
      }
    }

    const sessionConfig = {
      customer: user.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        plan,
        billing,
      },
    };

    // Add discounts if available
    if (discounts.length > 0) {
      sessionConfig.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/billing/portal', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);

    // Check if user has no Stripe customer (admin-upgraded)
    if (!user.stripe_customer_id) {
      return res.status(400).json({
        error: 'No Stripe subscription',
        noStripeCustomer: true,
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Self-service plan change for testing (bypasses Stripe)
// WARNING: This allows plan changes without payment - use only for testing!
app.post('/api/admin/self-set-plan', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'professional', 'unlimited'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Update plan (same logic as admin/set-plan)
    const limits = PLAN_LIMITS[plan];
    await pool.query(
      `
      UPDATE users SET
        subscription_plan = $1,
        subscription_status = $2,
        responses_limit = $3,
        responses_used = 0,
        smart_responses_used = 0,
        standard_responses_used = 0
      WHERE id = $4
    `,
      [plan, plan === 'free' ? 'inactive' : 'active', limits.responses, req.user.id]
    );

    console.log(`Self-service plan change: User ${req.user.id} changed to ${plan}`);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Self-set-plan error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

// Stripe webhook handler
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;

        await dbQuery(
          `UPDATE users SET subscription_status = 'active', subscription_plan = $1, responses_limit = $2, responses_used = 0 WHERE id = $3`,
          [plan, PLAN_LIMITS[plan].responses, userId]
        );

        // Process referral reward if user was referred
        const paidUser = await dbGet('SELECT referred_by FROM users WHERE id = $1', [userId]);
        if (paidUser && paidUser.referred_by) {
          const referral = await dbGet(
            'SELECT * FROM referrals WHERE referrer_id = $1 AND referred_user_id = $2 AND reward_given = FALSE',
            [paidUser.referred_by, userId]
          );

          if (referral) {
            await dbQuery(
              `UPDATE referrals SET status = 'converted', converted_at = NOW(), reward_given = TRUE WHERE id = $1`,
              [referral.id]
            );
            await dbQuery(
              `UPDATE users SET referral_credits = referral_credits + 1 WHERE id = $1`,
              [paidUser.referred_by]
            );
            console.log(
              `🎉 Referral reward! User ${paidUser.referred_by} earned 1 credit for referring user ${userId}`
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await dbGet('SELECT id FROM users WHERE stripe_customer_id = $1', [
          subscription.customer,
        ]);

        if (user) {
          const status = subscription.status === 'active' ? 'active' : 'inactive';
          await dbQuery(
            `UPDATE users SET subscription_status = $1, current_period_start = $2, current_period_end = $3 WHERE id = $4`,
            [
              status,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000),
              user.id,
            ]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await dbGet('SELECT id FROM users WHERE stripe_customer_id = $1', [
          subscription.customer,
        ]);

        if (user) {
          await dbQuery(
            `UPDATE users SET subscription_status = 'inactive', subscription_plan = 'free', responses_limit = $1 WHERE id = $2`,
            [PLAN_LIMITS.free.responses, user.id]
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const user = await dbGet('SELECT * FROM users WHERE stripe_customer_id = $1', [
          invoice.customer,
        ]);

        if (user && user.subscription_plan !== 'free') {
          await dbQuery('UPDATE users SET responses_used = 0 WHERE id = $1', [user.id]);

          // Send plan renewal email
          if (process.env.NODE_ENV === 'production') {
            sendPlanRenewalEmail(user);
          }
          console.log(`📧 Plan renewed for user ${user.id} (${user.subscription_plan})`);

          // Process affiliate commission (20% recurring)
          if (user.affiliate_id) {
            const affiliate = await dbGet(
              'SELECT * FROM affiliates WHERE id = $1 AND status = $2',
              [user.affiliate_id, 'approved']
            );

            if (affiliate) {
              const amountPaid = (invoice.amount_paid || 0) / 100; // Convert from cents to dollars
              const commissionRate = parseFloat(affiliate.commission_rate) || 20;
              const commissionAmount = amountPaid * (commissionRate / 100);

              if (commissionAmount > 0) {
                // Create affiliate conversion record
                await dbQuery(
                  `INSERT INTO affiliate_conversions (affiliate_id, referred_user_id, subscription_plan, amount_paid, commission_amount, commission_rate, stripe_invoice_id, status)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')`,
                  [
                    affiliate.id,
                    user.id,
                    user.subscription_plan,
                    amountPaid,
                    commissionAmount,
                    commissionRate,
                    invoice.id,
                  ]
                );

                // Update affiliate totals
                await dbQuery(
                  `UPDATE affiliates SET total_earned = total_earned + $1, pending_balance = pending_balance + $1 WHERE id = $2`,
                  [commissionAmount, affiliate.id]
                );

                console.log(
                  `💰 Affiliate commission: $${commissionAmount.toFixed(2)} for affiliate ${affiliate.affiliate_code} (User ${user.id} paid $${amountPaid.toFixed(2)})`
                );
              }
            }
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}

// ============ SUPPORT ============

app.post('/api/support/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    await dbQuery(
      `INSERT INTO support_requests (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
      [name, email, subject, message]
    );

    console.log(`📬 New support request from ${email}: ${subject}`);

    // Email-Benachrichtigung an Admin
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          replyTo: email, // Antwort geht direkt an den User
          to: 'berend.jakob.mainz@gmail.com',
          subject: `[Support] ${subject}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Neue Support-Anfrage</h2>
              <p><strong>Von:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Betreff:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
              <p><strong>Nachricht:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
              <p style="color: #6B7280; font-size: 14px;">
                Antworte direkt auf diese Email - sie geht an ${email}
              </p>
            </div>
          `,
        });
        console.log(`📧 Support notification sent to admin for: ${email}`);
      } catch (emailError) {
        console.error('Failed to send support notification:', emailError);
      }
    }

    res.json({ success: true, message: 'Message received. We will respond within 24 hours.' });
  } catch (error) {
    console.error('Support error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ USAGE STATS ============

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check if user is a team member (usage comes from team owner)
    let usageOwner = user;
    let isTeamMember = false;
    const teamMembership = await dbGet(
      `SELECT tm.*, u.id as owner_id, u.subscription_plan as owner_plan, u.subscription_status as owner_status,
              u.smart_responses_used as owner_smart_used, u.standard_responses_used as owner_standard_used,
              u.responses_used as owner_responses_used, u.responses_limit as owner_responses_limit
       FROM team_members tm
       JOIN users u ON tm.team_owner_id = u.id
       WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [req.user.id]
    );
    if (teamMembership) {
      isTeamMember = true;
      usageOwner = {
        id: teamMembership.owner_id,
        subscription_plan: teamMembership.owner_plan,
        subscription_status: teamMembership.owner_status,
        smart_responses_used: teamMembership.owner_smart_used || 0,
        standard_responses_used: teamMembership.owner_standard_used || 0,
        responses_used: teamMembership.owner_responses_used || 0,
        responses_limit: teamMembership.owner_responses_limit || 0,
      };
    }

    // Determine effective plan
    const effectivePlan = isTeamMember ? usageOwner.subscription_plan : user.subscription_plan;
    const planLimits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;

    // Get smart/standard usage
    const smartUsed = usageOwner.smart_responses_used || 0;
    const standardUsed = usageOwner.standard_responses_used || 0;
    const totalUsed = smartUsed + standardUsed;
    const totalLimit = planLimits.responses;

    const totalResponses = await dbGet(
      'SELECT COUNT(*) as count FROM responses WHERE user_id = $1',
      [req.user.id]
    );

    const thisMonth = await dbGet(
      `SELECT COUNT(*) as count FROM responses WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [req.user.id]
    );

    const byPlatform = await dbAll(
      `SELECT review_platform, COUNT(*) as count FROM responses WHERE user_id = $1 GROUP BY review_platform`,
      [req.user.id]
    );

    const byRating = await dbAll(
      `SELECT review_rating, COUNT(*) as count FROM responses WHERE user_id = $1 AND review_rating IS NOT NULL GROUP BY review_rating`,
      [req.user.id]
    );

    // Count responses by AI model this month
    const byAiModel = await dbAll(
      `SELECT COALESCE(ai_model, 'standard') as ai_model, COUNT(*) as count
       FROM responses WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)
       GROUP BY COALESCE(ai_model, 'standard')`,
      [req.user.id]
    );

    res.json({
      usage: {
        smart: {
          used: smartUsed,
          limit: planLimits.smartResponses,
          remaining: Math.max(0, planLimits.smartResponses - smartUsed),
        },
        standard: {
          used: standardUsed,
          limit: planLimits.standardResponses,
          remaining: Math.max(0, planLimits.standardResponses - standardUsed),
        },
        total: {
          used: totalUsed,
          limit: totalLimit,
          remaining: Math.max(0, totalLimit - totalUsed),
        },
        // Backward compatibility
        used: totalUsed,
        limit: totalLimit,
        remaining: Math.max(0, totalLimit - totalUsed),
      },
      stats: {
        totalResponses: parseInt(totalResponses.count),
        thisMonth: parseInt(thisMonth.count),
        byPlatform,
        byRating,
        byAiModel,
      },
      subscription: {
        plan: effectivePlan,
        status: isTeamMember ? usageOwner.subscription_status : user.subscription_status,
      },
      isTeamMember,
      hasSmartAI: !!anthropic,
      // For password management (OAuth users may not have password)
      hasPassword: !!user.password,
      oauthProvider: user.oauth_provider || null,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============ RESPONSE TEMPLATES ============

// Get all templates for user
app.get('/api/templates', authenticateToken, async (req, res) => {
  try {
    const templates = await dbAll(
      'SELECT * FROM response_templates WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Create new template
app.post('/api/templates', authenticateToken, async (req, res) => {
  try {
    const { name, content, tone, platform, category } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Template name must be 100 characters or less' });
    }

    // Check template limit (max 20 per user)
    const count = await dbGet(
      'SELECT COUNT(*) as count FROM response_templates WHERE user_id = $1',
      [req.user.id]
    );

    if (parseInt(count.count) >= 20) {
      return res
        .status(400)
        .json({ error: 'Maximum of 20 templates allowed. Delete some templates to add new ones.' });
    }

    const result = await dbQuery(
      `INSERT INTO response_templates (user_id, name, content, tone, platform, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.id,
        name.trim(),
        content,
        tone || 'professional',
        platform || 'google',
        category || null,
      ]
    );

    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
app.put('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, tone, platform, category } = req.body;

    // Verify ownership
    const existing = await dbGet(
      'SELECT * FROM response_templates WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const result = await dbQuery(
      `UPDATE response_templates SET name = $1, content = $2, tone = $3, platform = $4, category = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [
        name.trim(),
        content,
        tone || 'professional',
        platform || 'google',
        category || null,
        id,
        req.user.id,
      ]
    );

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
app.delete('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await dbGet(
      'SELECT * FROM response_templates WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await dbQuery('DELETE FROM response_templates WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============ TEAM MANAGEMENT (Professional & Unlimited Plans) ============

// Helper: Check if plan has team access (Pro: 3 members, Unlimited: 10 members)
function hasTeamAccess(plan) {
  return ['professional', 'unlimited'].includes(plan);
}

function getMaxTeamMembers(plan) {
  return PLAN_LIMITS[plan]?.teamMembers || 0;
}

// GET /api/team - Get all team members
app.get('/api/team', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!hasTeamAccess(user.subscription_plan)) {
      return res
        .status(403)
        .json({
          error: 'Team features are available for Professional and Unlimited plans',
          upgrade: true,
          requiredPlan: 'professional',
        });
    }
    const members = await dbAll(
      `SELECT tm.*, u.email as user_email, u.business_name FROM team_members tm LEFT JOIN users u ON tm.member_user_id = u.id WHERE tm.team_owner_id = $1 ORDER BY tm.invited_at DESC`,
      [req.user.id]
    );
    const maxMembers = getMaxTeamMembers(user.subscription_plan);
    res.json({
      isTeamOwner: true,
      members: members.map(m => ({
        id: m.id,
        email: m.member_email,
        role: m.role,
        status: m.accepted_at ? 'active' : 'pending',
        invitedAt: m.invited_at,
        acceptedAt: m.accepted_at,
        businessName: m.business_name,
      })),
      maxMembers,
      plan: user.subscription_plan,
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// POST /api/team/invite - Invite a new team member
app.post('/api/team/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!hasTeamAccess(user.subscription_plan)) {
      return res
        .status(403)
        .json({
          error: 'Team features are available for Professional and Unlimited plans',
          upgrade: true,
        });
    }
    if (!email || !validator.isEmail(email))
      return res.status(400).json({ error: 'Valid email is required' });
    if (email.toLowerCase() === user.email.toLowerCase())
      return res.status(400).json({ error: 'You cannot invite yourself' });
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role))
      return res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer' });
    const memberCount = await dbGet(
      'SELECT COUNT(*) as count FROM team_members WHERE team_owner_id = $1',
      [req.user.id]
    );
    const maxMembers = getMaxTeamMembers(user.subscription_plan);
    if (parseInt(memberCount.count) >= maxMembers) {
      return res
        .status(400)
        .json({
          error: `Maximum ${maxMembers} team members allowed on your plan`,
          upgrade: user.subscription_plan === 'professional',
        });
    }
    const existing = await dbGet(
      'SELECT * FROM team_members WHERE team_owner_id = $1 AND LOWER(member_email) = LOWER($2)',
      [req.user.id, email]
    );
    if (existing) return res.status(400).json({ error: 'This email has already been invited' });
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const existingUser = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [
      email,
    ]);
    await dbQuery(
      `INSERT INTO team_members (team_owner_id, member_email, member_user_id, role, invite_token) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, email.toLowerCase(), existingUser?.id || null, role, inviteToken]
    );
    if (resend) {
      try {
        const inviteHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:30px;text-align:center;"><h1 style="color:white;margin:0;">You're Invited!</h1></div><div style="padding:30px;background:#f9fafb;"><p style="font-size:16px;color:#374151;"><strong>${user.business_name || user.email}</strong> has invited you to join their ReviewResponder team as a <strong>${role}</strong>.</p><p style="font-size:14px;color:#6b7280;">As a team member, you'll be able to generate AI-powered review responses using their subscription.</p><div style="text-align:center;margin:30px 0;"><a href="${process.env.FRONTEND_URL}/join-team?token=${inviteToken}" style="background:#4F46E5;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Accept Invitation</a></div></div></div>`;
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `${user.business_name || user.email} invited you to their team`,
          html: inviteHtml,
        });
      } catch (e) {
        console.error('Failed to send team invite email:', e);
      }
    }
    // Always return token so frontend can show invite link (useful if email fails)
    res
      .status(201)
      .json({
        success: true,
        message: `Invitation sent to ${email}`,
        inviteToken,
        inviteUrl: `${process.env.FRONTEND_URL}/join-team?token=${inviteToken}`,
      });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// GET /api/team/invite/:token - Validate invite token (public endpoint)
app.get('/api/team/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await dbGet(
      `SELECT tm.*, u.email as owner_email, u.business_name as owner_business FROM team_members tm JOIN users u ON tm.team_owner_id = u.id WHERE tm.invite_token = $1 AND tm.accepted_at IS NULL`,
      [token]
    );
    if (!invitation) return res.status(404).json({ error: 'Invalid or expired invitation' });
    res.json({
      valid: true,
      invitedEmail: invitation.member_email,
      invitedBy: invitation.owner_business || invitation.owner_email,
      role: invitation.role,
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

// POST /api/team/accept - Accept team invitation
app.post('/api/team/accept', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Invite token is required' });
    const invitation = await dbGet(
      `SELECT tm.*, u.email as owner_email, u.business_name as owner_business FROM team_members tm JOIN users u ON tm.team_owner_id = u.id WHERE tm.invite_token = $1 AND tm.accepted_at IS NULL`,
      [token]
    );
    if (!invitation) return res.status(404).json({ error: 'Invalid or expired invitation' });
    const currentUser = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (currentUser.email.toLowerCase() !== invitation.member_email.toLowerCase())
      return res
        .status(403)
        .json({ error: 'This invitation was sent to a different email address' });
    await dbQuery(
      `UPDATE team_members SET accepted_at = CURRENT_TIMESTAMP, member_user_id = $1, invite_token = NULL WHERE id = $2`,
      [req.user.id, invitation.id]
    );
    res.json({
      success: true,
      message: `You've joined ${invitation.owner_business || invitation.owner_email}'s team!`,
      teamOwner: { email: invitation.owner_email, businessName: invitation.owner_business },
      role: invitation.role,
    });
  } catch (error) {
    console.error('Accept error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// PUT /api/team/:memberId/role - Update team member role
app.put('/api/team/:memberId/role', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!hasTeamAccess(user.subscription_plan))
      return res
        .status(403)
        .json({ error: 'Team features are available for Professional and Unlimited plans' });
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role))
      return res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer' });
    const member = await dbGet('SELECT * FROM team_members WHERE id = $1 AND team_owner_id = $2', [
      memberId,
      req.user.id,
    ]);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    await dbQuery('UPDATE team_members SET role = $1 WHERE id = $2', [role, memberId]);
    res.json({ success: true, message: 'Role updated', newRole: role });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/team/:memberId - Remove team member
app.delete('/api/team/:memberId', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.params;
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!hasTeamAccess(user.subscription_plan))
      return res
        .status(403)
        .json({ error: 'Team features are available for Professional and Unlimited plans' });
    const member = await dbGet('SELECT * FROM team_members WHERE id = $1 AND team_owner_id = $2', [
      memberId,
      req.user.id,
    ]);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    await dbQuery('DELETE FROM team_members WHERE id = $1', [memberId]);
    res.json({ success: true, message: 'Team member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// GET /api/team/my-team - Get team info for current user (as member or owner)
app.get('/api/team/my-team', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    // Check if user is a team member (belongs to someone else's team)
    const tm = await dbGet(
      `SELECT tm.*, u.email as owner_email, u.business_name as owner_business, u.responses_used, u.responses_limit, u.subscription_plan as owner_plan FROM team_members tm JOIN users u ON tm.team_owner_id = u.id WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`,
      [req.user.id]
    );
    if (tm) {
      return res.json({
        isTeamMember: true,
        teamOwner: { email: tm.owner_email, businessName: tm.owner_business },
        role: tm.role,
        teamUsage: { used: tm.responses_used, limit: tm.responses_limit },
      });
    }
    const c = await dbGet('SELECT COUNT(*) as count FROM team_members WHERE team_owner_id = $1', [
      req.user.id,
    ]);
    res.json({
      isTeamMember: false,
      isTeamOwner: hasTeamAccess(user.subscription_plan),
      canHaveTeam: hasTeamAccess(user.subscription_plan),
      teamMemberCount: parseInt(c.count),
      maxTeamMembers: getMaxTeamMembers(user.subscription_plan),
      plan: user.subscription_plan,
    });
  } catch (error) {
    console.error('Get my-team error:', error);
    res.status(500).json({ error: 'Failed to get team info' });
  }
});

// POST /api/team/leave - Leave a team (for team members)
app.post('/api/team/leave', authenticateToken, async (req, res) => {
  try {
    const membership = await dbGet(
      'SELECT * FROM team_members WHERE member_user_id = $1 AND accepted_at IS NOT NULL',
      [req.user.id]
    );
    if (!membership) return res.status(404).json({ error: 'You are not a member of any team' });
    await dbQuery('DELETE FROM team_members WHERE id = $1', [membership.id]);
    res.json({ success: true, message: 'You have left the team' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

// ============ EMAIL CAPTURE ============

// Capture email from exit-intent popup
app.post('/api/capture-email', async (req, res) => {
  try {
    const { email, discountCode = 'EARLY50', source = 'exit_intent' } = req.body;

    // Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if email already exists
    const existing = await dbGet('SELECT * FROM email_captures WHERE LOWER(email) = LOWER($1)', [
      email,
    ]);

    if (existing) {
      console.log(`📧 Email already captured: ${email}`);
      return res.json({
        success: true,
        message: 'Thanks! Check your email for the discount code.',
        discountCode: existing.discount_code,
      });
    }

    // Insert new email
    await dbQuery(
      `INSERT INTO email_captures (email, discount_code, source) 
       VALUES ($1, $2, $3)`,
      [email.toLowerCase(), discountCode, source]
    );

    console.log(`✅ Email captured: ${email} (source: ${source})`);

    // Send welcome email if Resend is configured
    if (resend && process.env.NODE_ENV === 'production') {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          replyTo: 'hello@tryreviewresponder.com',
          to: email,
          subject: 'Your 50% discount code inside',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; margin: 0; padding: 0; background-color: #f9fafb;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">50% Off - Launch Special</h1>
                </div>
                <div style="background: white; padding: 40px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
                  <p style="margin-top: 0;">Hi there,</p>

                  <p>Thanks for checking out ReviewResponder! As an early supporter, you get access to our launch discount:</p>

                  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your exclusive discount</p>
                    <div style="font-size: 32px; font-weight: bold; color: white;">50% OFF</div>
                    <p style="margin: 8px 0 0 0; font-weight: 600; color: rgba(255,255,255,0.95);">Forever, not just the first month!</p>
                  </div>

                  <p>ReviewResponder helps businesses respond to customer reviews in seconds using AI. No more staring at a blank screen wondering what to write.</p>

                  <p>This discount won't last forever - it's only for our first 50 customers.</p>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.FRONTEND_URL}/pricing?discount=${discountCode}" style="display: inline-block; background: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">Claim 50% Discount</a>
                  </div>

                  <p style="color: #6B7280; font-size: 14px;">Questions? Just reply to this email.</p>

                  <p style="margin-bottom: 0;">Cheers,<br>Berend from ReviewResponder</p>
                </div>
                <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
                  <p style="margin: 0;">You're receiving this because you signed up at tryreviewresponder.com</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log(`📨 Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Thanks! Check your email for the discount code.',
      discountCode,
    });
  } catch (error) {
    console.error('Email capture error:', error);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

// ============ ANALYTICS (Pro/Unlimited Only) ============

app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check if user has Pro or Unlimited plan
    if (!['professional', 'unlimited'].includes(user.subscription_plan)) {
      return res.status(403).json({
        error: 'Analytics is only available for Professional and Unlimited plans',
        upgrade: true,
        requiredPlan: 'professional',
      });
    }

    // Total responses
    const totalResponses = await dbGet(
      'SELECT COUNT(*) as count FROM responses WHERE user_id = $1',
      [req.user.id]
    );

    // Responses by tone (for pie chart)
    const byTone = await dbAll(
      `SELECT tone, COUNT(*) as count FROM responses WHERE user_id = $1 GROUP BY tone ORDER BY count DESC`,
      [req.user.id]
    );

    // Responses by platform
    const byPlatform = await dbAll(
      `SELECT review_platform as platform, COUNT(*) as count FROM responses WHERE user_id = $1 GROUP BY review_platform ORDER BY count DESC`,
      [req.user.id]
    );

    // Responses over time (last 30 days, grouped by day)
    const overTime = await dbAll(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as count
       FROM responses
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    // Responses by rating
    const byRating = await dbAll(
      `SELECT review_rating as rating, COUNT(*) as count FROM responses WHERE user_id = $1 AND review_rating IS NOT NULL GROUP BY review_rating ORDER BY rating DESC`,
      [req.user.id]
    );

    // Average responses per day (last 30 days)
    const avgPerDay = await dbGet(
      `SELECT COALESCE(AVG(daily_count), 0) as avg FROM (
        SELECT DATE(created_at) as day, COUNT(*) as daily_count
        FROM responses
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
      ) daily_counts`,
      [req.user.id]
    );

    // This week vs last week
    const thisWeek = await dbGet(
      `SELECT COUNT(*) as count FROM responses WHERE user_id = $1 AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`,
      [req.user.id]
    );
    const lastWeek = await dbGet(
      `SELECT COUNT(*) as count FROM responses WHERE user_id = $1 AND created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days' AND created_at < DATE_TRUNC('week', CURRENT_DATE)`,
      [req.user.id]
    );

    // Most used tone
    const mostUsedTone = byTone.length > 0 ? byTone[0].tone : 'professional';

    res.json({
      totalResponses: parseInt(totalResponses.count),
      byTone: byTone.map(t => ({ name: t.tone, value: parseInt(t.count) })),
      byPlatform: byPlatform.map(p => ({
        name: p.platform || 'unknown',
        value: parseInt(p.count),
      })),
      overTime: overTime.map(d => ({ date: d.date, responses: parseInt(d.count) })),
      byRating: byRating.map(r => ({ rating: r.rating, count: parseInt(r.count) })),
      insights: {
        avgPerDay: parseFloat(avgPerDay.avg || 0).toFixed(1),
        thisWeek: parseInt(thisWeek.count),
        lastWeek: parseInt(lastWeek.count),
        weeklyChange: parseInt(thisWeek.count) - parseInt(lastWeek.count),
        mostUsedTone,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============== SEO BLOG ARTICLE GENERATOR (Pro/Unlimited Only) ==============

// Pre-defined SEO topics for review management
const BLOG_TOPICS = [
  {
    id: 'respond-negative',
    title: 'How to Respond to Negative Reviews',
    keywords: ['negative reviews', 'customer complaints', 'reputation management'],
  },
  {
    id: 'review-management-basics',
    title: 'Review Management Best Practices for Small Businesses',
    keywords: ['review management', 'small business', 'online reputation'],
  },
  {
    id: 'increase-reviews',
    title: 'How to Get More Customer Reviews',
    keywords: ['get more reviews', 'customer feedback', 'review generation'],
  },
  {
    id: 'respond-positive',
    title: 'Why Responding to Positive Reviews Matters',
    keywords: ['positive reviews', 'customer appreciation', 'brand loyalty'],
  },
  {
    id: 'google-reviews',
    title: 'The Complete Guide to Google Reviews',
    keywords: ['Google reviews', 'Google My Business', 'local SEO'],
  },
  {
    id: 'yelp-reviews',
    title: 'Mastering Yelp Reviews for Your Business',
    keywords: ['Yelp reviews', 'Yelp business', 'restaurant reviews'],
  },
  {
    id: 'fake-reviews',
    title: 'How to Handle Fake or Unfair Reviews',
    keywords: ['fake reviews', 'review removal', 'unfair reviews'],
  },
  {
    id: 'review-response-templates',
    title: 'Review Response Templates That Actually Work',
    keywords: ['review templates', 'response examples', 'copy paste reviews'],
  },
  {
    id: 'review-seo',
    title: 'How Reviews Impact Your Local SEO Rankings',
    keywords: ['reviews SEO', 'local search', 'Google ranking'],
  },
  {
    id: 'ai-review-responses',
    title: 'Using AI to Write Professional Review Responses',
    keywords: ['AI reviews', 'automated responses', 'review automation'],
  },
  {
    id: 'crisis-management',
    title: 'Review Crisis Management: What to Do When Things Go Wrong',
    keywords: ['crisis management', 'bad reviews', 'reputation repair'],
  },
  {
    id: 'review-monitoring',
    title: 'How to Monitor Your Online Reviews Effectively',
    keywords: ['review monitoring', 'reputation tracking', 'alerts'],
  },
];

// GET /api/blog/topics - Get available topic suggestions
app.get('/api/blog/topics', authenticateToken, async (req, res) => {
  try {
    res.json({ topics: BLOG_TOPICS });
  } catch (error) {
    console.error('Get blog topics error:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

// POST /api/blog/generate - Generate SEO blog article
app.post('/api/blog/generate', authenticateToken, async (req, res) => {
  try {
    const { topic, customTopic, keywords, length, tone } = req.body;

    // Check if user has Pro or Unlimited plan
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (!['professional', 'unlimited'].includes(user.subscription_plan)) {
      return res.status(403).json({
        error: 'Blog Generator is only available for Professional and Unlimited plans',
        upgrade: true,
        requiredPlan: 'professional',
      });
    }

    // Validate input
    const articleTopic = customTopic?.trim() || BLOG_TOPICS.find(t => t.id === topic)?.title;
    if (!articleTopic) {
      return res.status(400).json({ error: 'Please select or enter a topic' });
    }

    const articleKeywords =
      keywords?.trim() || BLOG_TOPICS.find(t => t.id === topic)?.keywords?.join(', ') || '';
    const wordCount = Math.min(Math.max(parseInt(length) || 800, 500), 2000);

    const toneInstructions = {
      informative:
        'Write in an informative, educational tone. Be helpful and provide actionable advice.',
      persuasive:
        'Write in a persuasive tone. Convince the reader of the value and benefits of proper review management.',
      casual:
        'Write in a casual, friendly tone. Be conversational and approachable while still being professional.',
    };

    const prompt = `You are an expert SEO content writer specializing in business reputation management and customer review strategies.

Write a comprehensive, SEO-optimized blog article about: "${articleTopic}"

Requirements:
- Length: Approximately ${wordCount} words
- Tone: ${toneInstructions[tone] || toneInstructions.informative}
- Include relevant keywords naturally: ${articleKeywords || 'review management, customer feedback, online reputation'}
- Structure the article with:
  - An engaging introduction with a hook
  - Clear headings (use ## for main sections, ### for subsections)
  - Bullet points or numbered lists where appropriate
  - Practical, actionable tips
  - A conclusion with a call-to-action
- Make it valuable for small business owners
- Include statistics or data points where relevant (you can use general industry knowledge)
- Avoid fluff and filler content

Output Format:
First line: The article title (without any prefix like "Title:")
Second line: A compelling meta description (150-160 characters) for SEO
Third line: Empty
Then: The full article content in Markdown format

Generate the article:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const fullResponse = completion.choices[0].message.content.trim();

    // Parse the response
    const lines = fullResponse.split('\n');
    const title = lines[0].replace(/^#\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    const metaDescription = lines[1].replace(/^Meta Description:\s*/i, '').trim();
    const content = lines.slice(3).join('\n').trim();

    // Count words in content
    const actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // Save to database
    const result = await dbQuery(
      `INSERT INTO blog_articles (user_id, title, content, meta_description, keywords, topic, tone, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        title,
        content,
        metaDescription,
        articleKeywords,
        articleTopic,
        tone || 'informative',
        actualWordCount,
      ]
    );

    const article = result.rows[0];

    res.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        metaDescription: article.meta_description,
        keywords: article.keywords,
        topic: article.topic,
        tone: article.tone,
        wordCount: article.word_count,
        createdAt: article.created_at,
      },
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({ error: 'Failed to generate blog article' });
  }
});

// GET /api/blog/history - Get user's blog articles
app.get('/api/blog/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const user = await dbGet('SELECT subscription_plan FROM users WHERE id = $1', [req.user.id]);

    if (!['professional', 'unlimited'].includes(user.subscription_plan)) {
      return res.status(403).json({
        error: 'Blog history is only available for Professional and Unlimited plans',
        upgrade: true,
        requiredPlan: 'professional',
      });
    }

    const articles = await dbAll(
      `SELECT id, title, meta_description, keywords, topic, tone, word_count, created_at
       FROM blog_articles WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const total = await dbGet('SELECT COUNT(*) as count FROM blog_articles WHERE user_id = $1', [
      req.user.id,
    ]);

    res.json({
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        metaDescription: a.meta_description,
        keywords: a.keywords,
        topic: a.topic,
        tone: a.tone,
        wordCount: a.word_count,
        createdAt: a.created_at,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit),
      },
    });
  } catch (error) {
    console.error('Get blog history error:', error);
    res.status(500).json({ error: 'Failed to get blog history' });
  }
});

// GET /api/blog/:id - Get single article
app.get('/api/blog/:id', authenticateToken, async (req, res) => {
  try {
    const article = await dbGet(`SELECT * FROM blog_articles WHERE id = $1 AND user_id = $2`, [
      req.params.id,
      req.user.id,
    ]);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        metaDescription: article.meta_description,
        keywords: article.keywords,
        topic: article.topic,
        tone: article.tone,
        wordCount: article.word_count,
        createdAt: article.created_at,
      },
    });
  } catch (error) {
    console.error('Get blog article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
});

// DELETE /api/blog/:id - Delete article
app.delete('/api/blog/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbQuery(
      'DELETE FROM blog_articles WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('Delete blog article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// ============== REFERRAL SYSTEM ==============

// Helper function to generate unique referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'REF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get user's referral stats and code
app.get('/api/referrals', authenticateToken, async (req, res) => {
  try {
    let user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Generate referral code if user doesn't have one
    if (!user.referral_code) {
      let code;
      let attempts = 0;
      do {
        code = generateReferralCode();
        const existing = await dbGet('SELECT id FROM users WHERE referral_code = $1', [code]);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      await dbQuery('UPDATE users SET referral_code = $1 WHERE id = $2', [code, req.user.id]);
      user.referral_code = code;
    }

    // Get referral stats
    const referrals = await dbAll(
      `SELECT r.*, u.email as referred_email, u.subscription_plan
       FROM referrals r
       LEFT JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const stats = {
      totalInvited: referrals.length,
      converted: referrals.filter(r => r.status === 'converted').length,
      pending: referrals.filter(r => r.status === 'pending').length,
      creditsEarned: user.referral_credits || 0,
    };

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.json({
      referralCode: user.referral_code,
      referralLink: `${frontendUrl}?ref=${user.referral_code}`,
      stats,
      referrals: referrals.map(r => ({
        id: r.id,
        email: r.referred_email ? r.referred_email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'Pending',
        status: r.status,
        plan: r.subscription_plan || 'free',
        createdAt: r.created_at,
        convertedAt: r.converted_at,
      })),
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referral data' });
  }
});

// Validate referral code (public endpoint)
app.get('/api/referrals/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 4) {
      return res.status(400).json({ valid: false, error: 'Invalid code format' });
    }

    const referrer = await dbGet(
      'SELECT id, business_name, email FROM users WHERE referral_code = $1',
      [code.toUpperCase()]
    );

    if (!referrer) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      referrerName: referrer.business_name || referrer.email.split('@')[0],
      bonus: '1 month free after first paid subscription',
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

// ============== AFFILIATE/PARTNER PROGRAM ==============

// Helper function to generate unique affiliate code
function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AFF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Apply to become an affiliate
app.post('/api/affiliate/apply', authenticateToken, async (req, res) => {
  try {
    const { website, marketingChannels, audienceSize, payoutMethod, payoutEmail } = req.body;

    // Check if user already applied
    const existingAffiliate = await dbGet('SELECT * FROM affiliates WHERE user_id = $1', [
      req.user.id,
    ]);

    if (existingAffiliate) {
      return res.status(400).json({
        error: 'You already have an affiliate application',
        status: existingAffiliate.status,
      });
    }

    // Generate unique affiliate code
    let affiliateCode;
    let attempts = 0;
    do {
      affiliateCode = generateAffiliateCode();
      const existing = await dbGet('SELECT id FROM affiliates WHERE affiliate_code = $1', [
        affiliateCode,
      ]);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Create affiliate application
    const result = await dbQuery(
      `INSERT INTO affiliates (user_id, affiliate_code, website, marketing_channels, audience_size, payout_method, payout_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        req.user.id,
        affiliateCode,
        website || null,
        marketingChannels || null,
        audienceSize || null,
        payoutMethod || 'paypal',
        payoutEmail || null,
      ]
    );

    // Auto-approve for now (can add manual review later)
    await dbQuery(`UPDATE affiliates SET status = 'approved', approved_at = NOW() WHERE id = $1`, [
      result.rows[0].id,
    ]);

    console.log(
      `🤝 New affiliate application approved: User ${req.user.id}, Code: ${affiliateCode}`
    );

    res.json({
      success: true,
      message: 'Congratulations! You are now an affiliate partner.',
      affiliateCode,
      commissionRate: 20,
    });
  } catch (error) {
    console.error('Affiliate apply error:', error);
    res.status(500).json({ error: 'Failed to process affiliate application' });
  }
});

// Get affiliate status and stats
app.get('/api/affiliate/stats', authenticateToken, async (req, res) => {
  try {
    const affiliate = await dbGet('SELECT * FROM affiliates WHERE user_id = $1', [req.user.id]);

    if (!affiliate) {
      return res.json({ isAffiliate: false });
    }

    // Get click stats
    const clickStats = await dbGet(
      `SELECT COUNT(*) as total_clicks,
              COUNT(DISTINCT DATE(clicked_at)) as days_with_clicks
       FROM affiliate_clicks WHERE affiliate_id = $1`,
      [affiliate.id]
    );

    // Get clicks last 30 days
    const clicksLast30Days = await dbAll(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM affiliate_clicks
       WHERE affiliate_id = $1 AND clicked_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [affiliate.id]
    );

    // Get conversion stats
    const conversionStats = await dbGet(
      `SELECT COUNT(*) as total_conversions,
              COALESCE(SUM(commission_amount), 0) as total_commission,
              COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending_commission,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid_commission
       FROM affiliate_conversions WHERE affiliate_id = $1`,
      [affiliate.id]
    );

    // Get recent conversions
    const recentConversions = await dbAll(
      `SELECT ac.*, u.email as referred_email
       FROM affiliate_conversions ac
       LEFT JOIN users u ON ac.referred_user_id = u.id
       WHERE ac.affiliate_id = $1
       ORDER BY ac.created_at DESC
       LIMIT 10`,
      [affiliate.id]
    );

    // Get conversion rate
    const totalClicks = parseInt(clickStats?.total_clicks || 0);
    const totalConversions = parseInt(conversionStats?.total_conversions || 0);
    const conversionRate =
      totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.json({
      isAffiliate: true,
      affiliate: {
        code: affiliate.affiliate_code,
        status: affiliate.status,
        commissionRate: parseFloat(affiliate.commission_rate),
        payoutMethod: affiliate.payout_method,
        payoutEmail: affiliate.payout_email,
        appliedAt: affiliate.applied_at,
        approvedAt: affiliate.approved_at,
      },
      links: {
        affiliateLink: `${frontendUrl}?aff=${affiliate.affiliate_code}`,
        dashboardLink: `${frontendUrl}/affiliate`,
      },
      stats: {
        totalClicks: totalClicks,
        totalConversions: totalConversions,
        conversionRate: parseFloat(conversionRate),
        totalEarned: parseFloat(conversionStats?.total_commission || 0),
        pendingBalance: parseFloat(conversionStats?.pending_commission || 0),
        paidOut: parseFloat(conversionStats?.paid_commission || 0),
      },
      clicksChart: clicksLast30Days,
      recentConversions: recentConversions.map(c => ({
        id: c.id,
        email: c.referred_email ? c.referred_email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'Unknown',
        plan: c.subscription_plan,
        amount: parseFloat(c.amount_paid),
        commission: parseFloat(c.commission_amount),
        status: c.status,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Get affiliate stats error:', error);
    res.status(500).json({ error: 'Failed to get affiliate stats' });
  }
});

// Get payout history
app.get('/api/affiliate/payouts', authenticateToken, async (req, res) => {
  try {
    const affiliate = await dbGet('SELECT id FROM affiliates WHERE user_id = $1', [req.user.id]);

    if (!affiliate) {
      return res.status(403).json({ error: 'You are not an affiliate' });
    }

    const payouts = await dbAll(
      `SELECT * FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY requested_at DESC`,
      [affiliate.id]
    );

    // Calculate totals
    const totalPaid = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingPayouts = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({
      payouts: payouts.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        method: p.payout_method,
        email: p.payout_email,
        status: p.status,
        transactionId: p.transaction_id,
        requestedAt: p.requested_at,
        processedAt: p.processed_at,
      })),
      totalPaid,
      pendingPayouts,
    });
  } catch (error) {
    console.error('Get affiliate payouts error:', error);
    res.status(500).json({ error: 'Failed to get payout history' });
  }
});

// Request a payout
app.post('/api/affiliate/payout', authenticateToken, async (req, res) => {
  try {
    const affiliate = await dbGet('SELECT * FROM affiliates WHERE user_id = $1 AND status = $2', [
      req.user.id,
      'approved',
    ]);

    if (!affiliate) {
      return res.status(403).json({ error: 'You are not an approved affiliate' });
    }

    // Calculate available balance
    const balanceResult = await dbGet(
      `SELECT COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END), 0) as available
       FROM affiliate_conversions WHERE affiliate_id = $1`,
      [affiliate.id]
    );

    const availableBalance = parseFloat(balanceResult?.available || 0);
    const minimumPayout = 50; // Minimum $50 for payout

    if (availableBalance < minimumPayout) {
      return res.status(400).json({
        error: `Minimum payout is $${minimumPayout}. Your available balance is $${availableBalance.toFixed(2)}`,
      });
    }

    if (!affiliate.payout_email) {
      return res.status(400).json({ error: 'Please set your payout email in affiliate settings' });
    }

    // Create payout request
    await dbQuery(
      `INSERT INTO affiliate_payouts (affiliate_id, amount, payout_method, payout_email)
       VALUES ($1, $2, $3, $4)`,
      [affiliate.id, availableBalance, affiliate.payout_method, affiliate.payout_email]
    );

    // Mark conversions as paid
    await dbQuery(
      `UPDATE affiliate_conversions SET status = 'paid', paid_at = NOW()
       WHERE affiliate_id = $1 AND status = 'approved'`,
      [affiliate.id]
    );

    console.log(
      `💰 Affiliate payout requested: User ${req.user.id}, Amount: $${availableBalance.toFixed(2)}`
    );

    res.json({
      success: true,
      message: `Payout request of $${availableBalance.toFixed(2)} submitted. We will process it within 5 business days.`,
      amount: availableBalance,
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// Update affiliate settings (payout method, email)
app.put('/api/affiliate/settings', authenticateToken, async (req, res) => {
  try {
    const { payoutMethod, payoutEmail } = req.body;

    const affiliate = await dbGet('SELECT id FROM affiliates WHERE user_id = $1', [req.user.id]);

    if (!affiliate) {
      return res.status(403).json({ error: 'You are not an affiliate' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (payoutMethod) {
      updates.push(`payout_method = $${paramIndex++}`);
      values.push(payoutMethod);
    }

    if (payoutEmail) {
      if (!validator.isEmail(payoutEmail)) {
        return res.status(400).json({ error: 'Invalid payout email' });
      }
      updates.push(`payout_email = $${paramIndex++}`);
      values.push(payoutEmail.toLowerCase());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(affiliate.id);
    await dbQuery(`UPDATE affiliates SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    res.json({ success: true, message: 'Affiliate settings updated' });
  } catch (error) {
    console.error('Update affiliate settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Track affiliate click (public endpoint)
app.get('/api/affiliate/track/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const affiliate = await dbGet(
      'SELECT id FROM affiliates WHERE affiliate_code = $1 AND status = $2',
      [code.toUpperCase(), 'approved']
    );

    if (!affiliate) {
      // Redirect to homepage without tracking if invalid code
      return res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }

    // Track the click
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    await dbQuery(
      `INSERT INTO affiliate_clicks (affiliate_id, ip_address, user_agent, referrer)
       VALUES ($1, $2, $3, $4)`,
      [affiliate.id, ip.split(',')[0], userAgent, referrer]
    );

    // Redirect to homepage with affiliate code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?aff=${code}`);
  } catch (error) {
    console.error('Track affiliate click error:', error);
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }
});

// Validate affiliate code (public endpoint)
app.get('/api/affiliate/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const affiliate = await dbGet(
      `SELECT a.*, u.business_name, u.email
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       WHERE a.affiliate_code = $1 AND a.status = $2`,
      [code.toUpperCase(), 'approved']
    );

    if (!affiliate) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      affiliateName: affiliate.business_name || affiliate.email.split('@')[0],
      commissionRate: parseFloat(affiliate.commission_rate),
    });
  } catch (error) {
    console.error('Validate affiliate error:', error);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

// ============== API Key Management Endpoints ==============

// Get user's API keys
app.get('/api/keys', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT subscription_plan, subscription_status FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.subscription_plan !== 'unlimited' || user.subscription_status !== 'active') {
      return res
        .status(403)
        .json({ error: 'API keys are only available for Unlimited plan subscribers' });
    }

    const keys = await dbAll(
      `SELECT id, key_prefix, name, requests_today, requests_total, last_request_at, is_active, created_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ keys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Generate new API key
app.post('/api/keys', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT subscription_plan, subscription_status FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.subscription_plan !== 'unlimited' || user.subscription_status !== 'active') {
      return res
        .status(403)
        .json({ error: 'API keys are only available for Unlimited plan subscribers' });
    }

    // Check if user already has 5 keys
    const keyCount = await dbGet('SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1', [
      req.user.id,
    ]);
    if (parseInt(keyCount.count) >= 5) {
      return res
        .status(400)
        .json({ error: 'Maximum 5 API keys allowed. Please delete an existing key first.' });
    }

    const { name } = req.body;
    const keyName = name || 'API Key';

    // Generate a secure API key
    const rawKey = 'rr_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    await dbQuery(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)`,
      [req.user.id, keyHash, keyPrefix, keyName]
    );

    // Return the full key only once - it won't be retrievable later
    res.json({
      key: rawKey,
      prefix: keyPrefix,
      name: keyName,
      message: 'Save this API key - it will not be shown again!',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Update API key (rename or toggle active status)
app.put('/api/keys/:id', authenticateToken, async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const keyId = req.params.id;

    // Check if key exists and belongs to user
    const existingKey = await dbGet('SELECT id FROM api_keys WHERE id = $1 AND user_id = $2', [
      keyId,
      req.user.id,
    ]);

    if (!existingKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(keyId, req.user.id);
    const result = await dbQuery(
      `UPDATE api_keys SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING id, name, is_active`,
      values
    );

    res.json({
      success: true,
      key: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        isActive: result.rows[0].is_active,
      },
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
app.delete('/api/keys/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbQuery(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ success: true, message: 'API key deleted' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// ============== Public API Endpoint ==============

// POST /api/v1/generate - Public API for generating responses
app.post('/api/v1/generate', authenticateApiKey, async (req, res) => {
  try {
    const { review_text, review_rating, tone, language, platform, ai_model = 'auto' } = req.body;

    if (!review_text) {
      return res.status(400).json({ error: 'review_text is required' });
    }

    const user = req.apiKeyUser;
    const selectedTone = tone || 'professional';
    const selectedLanguage = language || 'en';
    const selectedPlatform = platform || 'google';

    // Get plan limits and check usage
    const planLimits = PLAN_LIMITS[user.subscription_plan || 'unlimited'] || PLAN_LIMITS.unlimited;
    const smartUsed = user.smart_responses_used || 0;
    const standardUsed = user.standard_responses_used || 0;
    const smartRemaining = planLimits.smartResponses - smartUsed;
    const standardRemaining = planLimits.standardResponses - standardUsed;

    // Determine which AI model to use
    let useModel = 'standard';

    if (ai_model === 'smart') {
      if (smartRemaining <= 0) {
        return res.status(403).json({
          error: 'No Smart AI responses remaining',
          smartRemaining: 0,
          standardRemaining,
        });
      }
      useModel = 'smart';
    } else if (ai_model === 'auto') {
      useModel = smartRemaining > 0 ? 'smart' : 'standard';
      if (useModel === 'standard' && standardRemaining <= 0) {
        return res.status(403).json({ error: 'No responses remaining' });
      }
    } else {
      if (standardRemaining <= 0) {
        return res.status(403).json({ error: 'No Standard responses remaining' });
      }
    }

    // ========== OPTIMIZED PUBLIC API PROMPT ==========
    const apiLanguageNames = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      ja: 'Japanese',
      zh: 'Chinese',
      ko: 'Korean',
      ar: 'Arabic',
      ru: 'Russian',
    };

    const systemPrompt = `You're a small business owner responding to reviews. Not a customer service rep - the actual owner.

BUSINESS: ${user.business_name || 'Our business'}${user.business_type ? ` (${user.business_type})` : ''}
${user.business_context ? `About: ${user.business_context}` : ''}
${user.response_style ? `IMPORTANT - Follow these custom instructions: ${user.response_style}` : ''}

OUTPUT FORMAT:
Write the response directly. No quotes around it. No "Response:" prefix. Just the text.

WRITING STYLE:
Be warm but understated. Direct, not flowery. Confident, not gushing.

BANNED WORDS: thrilled, delighted, excited, absolutely, incredibly, amazing, embark, delve, foster, leverage
NO PHRASES: "Thank you for your feedback", "We appreciate you taking the time", "Sorry for any inconvenience"

RULES:
- Use contractions naturally (we're, you'll, it's)
- Keep sentences short. Vary length.
- Max ONE exclamation mark per response
- No em-dashes. Use periods or commas instead.
- Reference specific details from their review
- Sound like a real person, not a script

${review_rating ? `[${review_rating}-star review] ${review_rating <= 2 ? 'Take ownership, offer to make it right.' : 'Show genuine appreciation.'}` : ''}
LANGUAGE: ${apiLanguageNames[selectedLanguage] || selectedLanguage}`;

    let generatedResponse;

    if (useModel === 'smart' && anthropic) {
      // Use Claude for Smart AI
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: `[Review] ${review_text}` }],
      });
      generatedResponse = response.content[0].text.trim();
    } else {
      // Use GPT-4o-mini for Standard AI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `[Review] ${review_text}` },
        ],
        max_tokens: 300,
        temperature: 0.6,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      generatedResponse = completion.choices[0].message.content.trim();
      if (useModel === 'smart' && !anthropic) useModel = 'standard';
    }

    // Save to responses table with AI model
    await dbQuery(
      `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone, ai_model) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        review_text,
        review_rating || null,
        selectedPlatform,
        generatedResponse,
        selectedTone,
        useModel,
      ]
    );

    // Update correct usage counter
    if (useModel === 'smart') {
      await dbQuery(
        'UPDATE users SET smart_responses_used = smart_responses_used + 1, responses_used = responses_used + 1 WHERE id = $1',
        [user.id]
      );
    } else {
      await dbQuery(
        'UPDATE users SET standard_responses_used = standard_responses_used + 1, responses_used = responses_used + 1 WHERE id = $1',
        [user.id]
      );
    }

    const updatedUser = await dbGet(
      'SELECT smart_responses_used, standard_responses_used FROM users WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      response: generatedResponse,
      ai_model: useModel,
      tone: selectedTone,
      language: selectedLanguage,
      platform: selectedPlatform,
      usage: {
        smart: { used: updatedUser.smart_responses_used || 0, limit: planLimits.smartResponses },
        standard: {
          used: updatedUser.standard_responses_used || 0,
          limit: planLimits.standardResponses,
        },
      },
    });
  } catch (error) {
    console.error('API generate error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ============ USER FEEDBACK / TESTIMONIALS ============

// Submit feedback (after 10 responses)
app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, displayName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already submitted feedback
    const existing = await dbGet('SELECT id FROM user_feedback WHERE user_id = $1', [req.user.id]);

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted feedback' });
    }

    // Get user info for display name
    const user = await dbGet('SELECT email, business_name FROM users WHERE id = $1', [req.user.id]);
    const userName = displayName || user.business_name || user.email.split('@')[0];

    // Insert feedback - auto-approved for transparency
    const insertResult = await dbQuery(
      `INSERT INTO user_feedback (user_id, rating, comment, user_name, approved)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
      [req.user.id, rating, comment || null, userName]
    );

    // Mark user as having submitted feedback
    await dbQuery('UPDATE users SET feedback_submitted = TRUE WHERE id = $1', [req.user.id]);

    // Auto-generate AI response for dogfooding section (non-blocking)
    if (comment && insertResult.rows && insertResult.rows[0]) {
      const testimonialId = insertResult.rows[0].id;
      generateAIResponseForTestimonial(testimonialId, rating, comment, userName)
        .then(() => console.log(`🤖 Auto-generated AI response for testimonial ${testimonialId}`))
        .catch(err => console.error(`Failed to auto-generate AI response:`, err.message));
    }

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Check if user should see feedback popup
app.get('/api/feedback/status', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT responses_used, feedback_submitted FROM users WHERE id = $1', [
      req.user.id,
    ]);

    // Show popup after 3 responses, if not already submitted (farm testimonials early!)
    const shouldShowPopup = user.responses_used >= 3 && !user.feedback_submitted;

    res.json({
      shouldShowPopup,
      responsesUsed: user.responses_used,
      feedbackSubmitted: user.feedback_submitted,
    });
  } catch (error) {
    console.error('Feedback status error:', error);
    res.status(500).json({ error: 'Failed to get feedback status' });
  }
});

// Get approved testimonials (public - no auth required)
app.get('/api/testimonials', async (req, res) => {
  try {
    const testimonials = await dbAll(
      `SELECT rating, comment, user_name, created_at, ai_response
       FROM user_feedback
       WHERE approved = TRUE AND comment IS NOT NULL AND comment != ''
       ORDER BY featured DESC, rating DESC, created_at DESC
       LIMIT 10`
    );

    res.json({ testimonials });
  } catch (error) {
    console.error('Testimonials fetch error:', error);
    res.status(500).json({ error: 'Failed to get testimonials' });
  }
});

// Admin: Delete testimonial
app.delete('/api/admin/testimonials/:id', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbQuery('DELETE FROM user_feedback WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Admin: Update testimonial (name, comment, approved)
app.put('/api/admin/testimonials/:id', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user_name, comment, approved } = req.body;

  try {
    await dbQuery(
      'UPDATE user_feedback SET user_name = COALESCE($1, user_name), comment = COALESCE($2, comment), approved = COALESCE($3, approved) WHERE id = $4',
      [user_name, comment, approved, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Admin: List all testimonials (including non-approved)
app.get('/api/admin/testimonials', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const testimonials = await dbAll(
      `SELECT id, rating, comment, user_name, approved, created_at, ai_response FROM user_feedback ORDER BY created_at DESC`
    );
    res.json({ testimonials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Helper: Generate AI response for a testimonial (used by both auto and admin)
async function generateAIResponseForTestimonial(testimonialId, rating, comment, userName) {
  // ReviewResponder's own business context (open source)
  const REVIEWRESPONDER_CONTEXT = {
    businessName: 'ReviewResponder',
    businessType: 'SaaS / AI Software Tool',
    businessContext: `ReviewResponder helps small business owners respond to customer reviews quickly and professionally.

WHO WE ARE:
- Created by Berend in Germany, 2026
- I built this because I watched restaurant owners spend hours every week writing review responses - time they could spend on their actual business

HOW IT WORKS - OUR CHROME EXTENSION:
The ReviewResponder Chrome Extension is the main product. You install it in your browser, and it works directly on review platforms:
- Google Maps, Yelp, TripAdvisor, Trustpilot, Booking.com
- Click "Generate Response" next to any review
- AI creates a personalized response in seconds
- One click to copy or paste directly
- No switching between tabs or copy-pasting

FEATURES:
- Automatic language detection - responds in the reviewer's language (50+ supported)
- 4 tone options: Professional, Friendly, Apologetic, Enthusiastic
- Business context - AI knows your specific business details
- Template library with industry-specific starting points
- Bulk generation for catching up on multiple reviews
- Response history to track what you've responded to

WHY I BUILT THIS:
Small business owners shouldn't have to choose between ignoring reviews and spending hours writing responses. Every review deserves a thoughtful reply - but it shouldn't take 10 minutes to write one.

PRICING (honest and simple):
- Free: 20 responses/month - enough to try it properly
- Starter $29/mo: 300 responses
- Pro $49/mo: 800 responses + team access for 3 people
- Unlimited $99/mo: No limits + API for developers
- 20% off yearly billing on all plans

HOW WE HANDLE YOUR DATA:
- Reviews are processed and immediately discarded
- We don't store or train on your customer data
- GDPR compliant (required as a German company)
- No hidden fees, cancel anytime

CONTACT:
- support@tryreviewresponder.com
- I (Berend) personally read and respond to support emails
- Usually within 24 hours, often faster`,
    responseStyle: `HOW TO RESPOND (our internal guidelines):

BE AUTHENTIC:
- Sound like a real person, not a corporate entity
- It's okay to say "I" (as Berend) or "we" (as the team)
- Be genuinely grateful, not performatively grateful
- Never be defensive about criticism

WHEN SOMEONE IS HAPPY:
- Thank them sincerely (one sentence is enough)
- If they mention a specific feature they love, acknowledge it
- If they mention time saved, that means a lot to us - say so
- Keep it short - a genuine 2-sentence response beats a long fake one

WHEN SOMEONE HAS FEEDBACK OR CONCERNS:
- Take it seriously - they're helping us improve
- Be honest about what we can and can't do
- Offer to help: support@tryreviewresponder.com
- Don't make promises we can't keep

NEVER DO:
- Over-the-top enthusiasm ("WOW! AMAZING! THANK YOU SO MUCH!!!")
- Corporate-speak ("We value your feedback...")
- Begging for more reviews
- Being defensive or dismissive
- Making excuses
- Pretending to be human - be honest that this is an AI-generated response

SIGN OFF:
- "Thanks, Berend" or "- The ReviewResponder Team"
- Keep it natural and direct`,
  };

  // Generate AI response using Claude (Smart AI)
  const systemMessage = `You are responding to a customer review for ${REVIEWRESPONDER_CONTEXT.businessName} (${REVIEWRESPONDER_CONTEXT.businessType}).

${REVIEWRESPONDER_CONTEXT.businessContext}

${REVIEWRESPONDER_CONTEXT.responseStyle}`;

  const userMessage = `[${rating} star review from ${userName || 'a customer'}]

"${comment}"

Generate a response following the guidelines above. Keep it concise (2-4 sentences).`;

  // Use Claude (Anthropic) for this special response
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: systemMessage + '\n\n' + userMessage }],
  });

  const aiResponse = completion.content[0].text.trim();

  // Save the response to the database
  await dbQuery('UPDATE user_feedback SET ai_response = $1 WHERE id = $2', [
    aiResponse,
    testimonialId,
  ]);

  return aiResponse;
}

// Admin: Generate AI response for a testimonial (dogfooding section)
app.post('/api/admin/testimonials/:id/generate-response', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get the testimonial
    const testimonial = await dbGet('SELECT * FROM user_feedback WHERE id = $1', [req.params.id]);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    // Use the helper function
    const aiResponse = await generateAIResponseForTestimonial(
      testimonial.id,
      testimonial.rating,
      testimonial.comment,
      testimonial.user_name
    );

    res.json({
      success: true,
      ai_response: aiResponse,
      testimonial_id: req.params.id,
    });
  } catch (error) {
    console.error('Generate testimonial response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Drip Email Campaign - Send scheduled emails based on user signup date
// Call this endpoint via cron job (e.g., daily at 9am)
app.post('/api/cron/send-drip-emails', async (req, res) => {
  // Accept both header and query parameter for secret (like daily-outreach)
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (
    !safeCompare(cronSecret, process.env.CRON_SECRET) &&
    !safeCompare(cronSecret, process.env.ADMIN_SECRET)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const DRIP_SCHEDULE = [0, 2, 5, 10, 20]; // Days after signup
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';

  // Email templates for each day
  const getDripEmail = (day, user) => {
    const templates = {
      0: {
        subject: "Welcome to ReviewResponder! Let's get started",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .step { display: flex; gap: 12px; margin: 16px 0; }
              .step-num { background: #4F46E5; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ReviewResponder!</h1>
                <p>You're about to save hours on review management</p>
              </div>
              <div class="content">
                <p>Hi${user.business_name ? ' ' + user.business_name : ''}!</p>

                <p>Thanks for signing up! You've made a great choice. Here's how to get started in 3 simple steps:</p>

                <div class="step">
                  <div class="step-num">1</div>
                  <div><strong>Copy a customer review</strong> from Google, Yelp, or any platform</div>
                </div>

                <div class="step">
                  <div class="step-num">2</div>
                  <div><strong>Paste it into ReviewResponder</strong> and select your preferred tone</div>
                </div>

                <div class="step">
                  <div class="step-num">3</div>
                  <div><strong>Click Generate</strong> and get a professional response in seconds!</div>
                </div>

                <p style="margin-top: 30px;">You have <strong>20 free responses</strong> to try it out. No credit card required.</p>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/dashboard" class="cta-button">Generate Your First Response →</a>
                </center>

                <p>Questions? Just reply to this email!</p>

                <p>Best,<br>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      2: {
        subject: 'Quick tip: Get better responses with business context',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .tip-box { background: #F0FDF4; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .cta-button { display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pro Tip: Personalize Your Responses</h1>
              </div>
              <div class="content">
                <p>Hi${user.business_name ? ' ' + user.business_name : ''}!</p>

                <p>Here's a quick tip to get even better AI responses:</p>

                <div class="tip-box">
                  <h3 style="margin-top: 0;">Add Your Business Context</h3>
                  <p>Go to <strong>Settings</strong> and add details about your business. The AI will use this to create more personalized, relevant responses!</p>
                  <p style="margin-bottom: 0;"><em>Example: "Family-owned Italian restaurant since 1985, known for homemade pasta"</em></p>
                </div>

                <p>This helps the AI understand your brand voice and mention specific things that make your business special.</p>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/settings" class="cta-button">Add Business Context →</a>
                </center>

                <p>Happy responding!</p>
                <p>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      5: {
        subject: "How's it going? Here's 50% off to upgrade",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .discount-box { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .discount-code { font-size: 28px; font-weight: bold; color: #D97706; font-family: monospace; }
              .cta-button { display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Exclusive Offer Just For You!</h1>
              </div>
              <div class="content">
                <p>Hi${user.business_name ? ' ' + user.business_name : ''}!</p>

                <p>It's been 5 days since you joined ReviewResponder. How are you liking it so far?</p>

                <p>We're still in our early launch phase, and as a thank you for being an early adopter, here's an exclusive discount:</p>

                <div class="discount-box">
                  <p style="margin: 0 0 8px 0;">Use code</p>
                  <div class="discount-code">EARLY50</div>
                  <p style="margin: 8px 0 0 0;"><strong>50% OFF</strong> any paid plan - forever!</p>
                </div>

                <p>This means you can get:</p>
                <ul>
                  <li><strong>Starter Plan:</strong> $14.50/mo instead of $29/mo (300 responses)</li>
                  <li><strong>Pro Plan:</strong> $24.50/mo instead of $49/mo (800 responses + analytics)</li>
                  <li><strong>Unlimited:</strong> $49.50/mo instead of $99/mo (unlimited everything!)</li>
                </ul>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/pricing" class="cta-button">Claim 50% Off →</a>
                </center>

                <p style="font-size: 14px; color: #6B7280;">This offer won't last forever - lock in this price while you can!</p>

                <p>Cheers,<br>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      10: {
        subject: 'Did you know? You can respond in 50+ languages',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .feature-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px 20px; margin: 16px 0; }
              .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Feature Spotlight: Multi-Language Support</h1>
              </div>
              <div class="content">
                <p>Hi${user.business_name ? ' ' + user.business_name : ''}!</p>

                <p>Did you know ReviewResponder can handle reviews in <strong>50+ languages</strong>?</p>

                <div class="feature-box">
                  <strong>Auto-Detection:</strong> Paste a review in German, French, Spanish, Chinese - any language! The AI automatically detects it and responds in the same language.
                </div>

                <div class="feature-box">
                  <strong>Language Override:</strong> Want to respond in a specific language? Use the Language Selector dropdown to choose your preferred response language.
                </div>

                <p>This is perfect for:</p>
                <ul>
                  <li>🏨 Hotels with international guests</li>
                  <li>🍽️ Restaurants in tourist areas</li>
                  <li>🏪 Online businesses with global customers</li>
                </ul>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/dashboard" class="cta-button">Try Multi-Language Responses →</a>
                </center>

                <p>Best,<br>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      20: {
        subject: "We'd love your feedback! (Quick 30-second survey)",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .cta-button { display: inline-block; background: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .question-box { background: #F5F3FF; border: 1px solid #8B5CF6; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>How Are We Doing?</h1>
                <p>Your feedback helps us improve!</p>
              </div>
              <div class="content">
                <p>Hi${user.business_name ? ' ' + user.business_name : ''}!</p>

                <p>You've been using ReviewResponder for about 3 weeks now, and we'd love to hear from you!</p>

                <div class="question-box">
                  <p style="margin: 0;"><strong>Quick question:</strong> How likely are you to recommend ReviewResponder to a fellow business owner?</p>
                </div>

                <p>Your honest feedback helps us:</p>
                <ul>
                  <li>Build features you actually need</li>
                  <li>Fix any pain points</li>
                  <li>Make ReviewResponder even better</li>
                </ul>

                <p>Just reply to this email with your thoughts - it takes less than 30 seconds!</p>

                <p>Or if you're loving it, we'd be thrilled if you could leave a rating in the app. Happy customers make our day! 🌟</p>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/dashboard" class="cta-button">Leave Feedback in App →</a>
                </center>

                <p>Thanks for being part of our journey!</p>
                <p>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    };
    return templates[day] || null;
  };

  try {
    let sentCount = 0;
    let errorCount = 0;

    // Get all users who signed up and haven't received all drip emails
    for (const day of DRIP_SCHEDULE) {
      // Find users who:
      // 1. Signed up exactly 'day' days ago (or more, for catch-up)
      // 2. Haven't received this drip email yet
      // 3. Have a valid email
      const eligibleUsers = await dbQuery(
        `
        SELECT u.id, u.email, u.business_name, u.created_at
        FROM users u
        WHERE u.created_at <= NOW() - (INTERVAL '1 day' * $1)
          AND u.email IS NOT NULL
          AND u.email != ''
          AND NOT EXISTS (
            SELECT 1 FROM drip_emails d
            WHERE d.user_id = u.id AND d.email_day = $1
          )
        ORDER BY u.created_at DESC
        LIMIT 100
      `,
        [day]
      );

      for (const user of eligibleUsers.rows) {
        const emailContent = getDripEmail(day, user);
        if (!emailContent) continue;

        try {
          if (process.env.NODE_ENV === 'production') {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }

          // Record that we sent this email
          await dbQuery(
            'INSERT INTO drip_emails (user_id, email_day) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user.id, day]
          );

          sentCount++;
          console.log(`📧 Drip email day ${day} sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send drip email to ${user.email}:`, emailError.message);
          errorCount++;
        }
      }
    }

    // Return minimal response for cron-job.org (has size limit)
    res.json({ ok: true, sent: sentCount, err: errorCount });
  } catch (error) {
    console.error('Drip email error:', error);
    res.status(500).json({
      error: 'Failed to process drip emails',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Weekly Summary Email Campaign - Send weekly stats to users who opted in
// Call this endpoint via cron job (e.g., every Monday at 9am)
app.post('/api/cron/send-weekly-summary', async (req, res) => {
  // Accept both header and query parameter for secret
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (
    !safeCompare(cronSecret, process.env.CRON_SECRET) &&
    !safeCompare(cronSecret, process.env.ADMIN_SECRET)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';

  try {
    // Get all users who have weekly summary enabled and have used the service
    const users = await dbQuery(`
      SELECT u.*,
        (SELECT COUNT(*) FROM responses r WHERE r.user_id = u.id AND r.created_at > NOW() - INTERVAL '7 days') as responses_this_week,
        (SELECT COUNT(*) FROM responses r WHERE r.user_id = u.id AND r.created_at > NOW() - INTERVAL '14 days' AND r.created_at <= NOW() - INTERVAL '7 days') as responses_last_week
      FROM users u
      WHERE u.email_weekly_summary = true
        AND u.email_verified = true
        AND (SELECT COUNT(*) FROM responses r WHERE r.user_id = u.id) > 0
    `);

    let sentCount = 0;
    let errorCount = 0;

    for (const user of users.rows) {
      const weeklyResponses = parseInt(user.responses_this_week) || 0;
      const lastWeekResponses = parseInt(user.responses_last_week) || 0;
      const change = weeklyResponses - lastWeekResponses;
      const changeText = change > 0 ? `+${change}` : change.toString();
      const changeColor = change >= 0 ? '#10B981' : '#EF4444';

      // Skip if no activity this week and last week
      if (weeklyResponses === 0 && lastWeekResponses === 0) continue;

      try {
        if (process.env.NODE_ENV === 'production') {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Your weekly review response summary`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
                  .stat-box { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
                  .stat-number { font-size: 36px; font-weight: bold; color: #4F46E5; }
                  .stat-label { color: #6B7280; font-size: 14px; }
                  .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
                  .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
                  .tip-box { background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Weekly Summary</h1>
                    <p>Your ReviewResponder stats for this week</p>
                  </div>
                  <div class="content">
                    <p>Hi${user.business_name ? ' ' + user.business_name : ''},</p>

                    <p>Here's how you did this week:</p>

                    <div class="stat-box">
                      <div class="stat-number">${weeklyResponses}</div>
                      <div class="stat-label">Responses Generated This Week</div>
                      <div style="color: ${changeColor}; font-weight: 600; margin-top: 5px;">${changeText} vs last week</div>
                    </div>

                    <div class="tip-box">
                      <strong>Pro Tip:</strong> ${
                        weeklyResponses > 0
                          ? 'Great job staying on top of your reviews! Consistent responses help build customer trust and improve your online reputation.'
                          : "Don't let reviews pile up! Responding quickly shows customers you care about their feedback."
                      }
                    </div>

                    <p style="text-align: center; margin: 30px 0;">
                      <a href="${FRONTEND_URL}/dashboard" class="cta-button">View Full Analytics</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>ReviewResponder - AI-Powered Review Responses</p>
                    <p><a href="${FRONTEND_URL}/profile" style="color: #6B7280;">Unsubscribe from weekly summary</a></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        }

        sentCount++;
        console.log(`Weekly summary sent to ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send weekly summary to ${user.email}:`, emailError.message);
        errorCount++;
      }
    }

    // Return minimal response for cron-job.org (has size limit)
    res.json({ ok: true, sent: sentCount, err: errorCount });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ error: 'Failed to process weekly summary emails' });
  }
});

// ============ ADMIN ENDPOINTS ============

// Rate limiter for admin endpoints (50 attempts per 15 minutes per IP)
const adminRateLimiter = new Map();
const ADMIN_RATE_LIMIT = 50;
const ADMIN_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

const checkAdminRateLimit = ip => {
  const now = Date.now();
  const record = adminRateLimiter.get(ip);

  if (!record || now - record.windowStart > ADMIN_RATE_WINDOW) {
    adminRateLimiter.set(ip, { windowStart: now, attempts: 1 });
    return true;
  }

  if (record.attempts >= ADMIN_RATE_LIMIT) {
    return false;
  }

  record.attempts++;
  return true;
};

// Timing-safe key comparison
const safeCompare = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do comparison to prevent timing attacks on length
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

// GET /api/admin/set-plan - Set user plan (for testing via browser)
app.get('/api/admin/set-plan', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkAdminRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const { email, plan, key } = req.query;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return res.status(500).json({ error: 'Admin endpoint not configured' });
  }

  if (!safeCompare(key, adminSecret)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Use PLAN_LIMITS for consistency
  const targetPlan = plan || 'unlimited';
  if (!PLAN_LIMITS[targetPlan]) {
    return res
      .status(400)
      .json({ error: 'Invalid plan. Use: free, starter, professional, unlimited' });
  }

  const planConfig = {
    status: targetPlan === 'free' ? 'inactive' : 'active',
    limit: PLAN_LIMITS[targetPlan].responses,
  };

  try {
    const user = await dbGet(
      'SELECT id, email, subscription_plan FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: `User not found: ${email}` });
    }

    const updateResult = await dbQuery(
      `UPDATE users SET
        subscription_plan = $1,
        subscription_status = $2,
        responses_limit = $3,
        responses_used = 0,
        smart_responses_used = 0,
        standard_responses_used = 0
       WHERE id = $4`,
      [targetPlan, planConfig.status, planConfig.limit, user.id]
    );

    console.log(
      `✅ Admin set ${email} to ${targetPlan} plan (was: ${user.subscription_plan}), rows affected: ${updateResult.rowCount}`
    );

    // Verify the update worked
    const verifyUser = await dbGet(
      'SELECT subscription_plan, responses_limit FROM users WHERE id = $1',
      [user.id]
    );
    console.log(
      `✅ Verified: plan=${verifyUser?.subscription_plan}, limit=${verifyUser?.responses_limit}`
    );

    // If redirect=1, send HTML page that forces a full page reload
    if (req.query.redirect === '1') {
      const frontendUrl = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';
      const redirectUrl = `${frontendUrl}/dashboard?plan=${targetPlan}&_t=${Date.now()}`;
      // Send HTML that forces a hard refresh to ensure React remounts
      // Using both meta refresh AND JavaScript for maximum compatibility
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Plan Updated</title>
          <meta http-equiv="refresh" content="1;url=${redirectUrl}">
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f3f4f6; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #10b981; margin-bottom: 10px; }
            p { color: #6b7280; }
            a { color: #3b82f6; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✓ Plan Updated!</h1>
            <p>Switching to ${targetPlan.toUpperCase()} plan...</p>
            <p style="margin-top: 20px; font-size: 14px;">
              <a href="${redirectUrl}">Click here if not redirected automatically</a>
            </p>
          </div>
          <script>
            // Force a complete page reload to ensure fresh data
            window.location.replace('${redirectUrl}');
          </script>
        </body>
        </html>
      `);
    }

    res.json({
      success: true,
      message: `User ${email} set to ${targetPlan} plan`,
      previous_plan: user.subscription_plan,
      new_plan: targetPlan,
      responses_limit: planConfig.limit,
      rows_affected: updateResult.rowCount,
      verified_plan: verifyUser?.subscription_plan,
      verified_limit: verifyUser?.responses_limit,
    });
  } catch (error) {
    console.error('Admin set-plan error:', error);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
});

// GET /api/admin/delete-user - Delete user completely (for testing)
app.get('/api/admin/delete-user', async (req, res) => {
  const { email, key } = req.query;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !safeCompare(key, adminSecret)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const user = await dbGet(
      'SELECT id, email, oauth_provider FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related data first (foreign key constraints)
    await dbQuery('DELETE FROM responses WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM response_templates WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM team_members WHERE team_owner_id = $1 OR member_user_id = $1', [
      user.id,
    ]);
    await dbQuery('DELETE FROM api_keys WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM blog_articles WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM referrals WHERE referrer_id = $1 OR referred_user_id = $1', [
      user.id,
    ]);
    await dbQuery('DELETE FROM user_feedback WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM drip_emails WHERE user_id = $1', [user.id]);
    await dbQuery('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    // Only delete from tables that exist - skip notification_preferences if not created yet
    try {
      await dbQuery('DELETE FROM notification_preferences WHERE user_id = $1', [user.id]);
    } catch (e) {}
    try {
      await dbQuery('DELETE FROM affiliate_clicks WHERE user_id = $1', [user.id]);
    } catch (e) {}
    // Update referrals that reference this user
    await dbQuery('UPDATE referrals SET referred_user_id = NULL WHERE referred_user_id = $1', [
      user.id,
    ]);

    // Delete user
    await dbQuery('DELETE FROM users WHERE id = $1', [user.id]);

    console.log(`✅ Admin deleted user: ${email} (OAuth: ${user.oauth_provider || 'none'})`);
    res.json({
      success: true,
      message: `User ${email} deleted`,
      oauth_provider: user.oauth_provider,
    });
  } catch (error) {
    console.error('Admin delete-user error:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// GET /api/admin/delete-email-capture - Delete email from email_captures (for testing exit-intent)
app.get('/api/admin/delete-email-capture', async (req, res) => {
  const { email, key } = req.query;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !safeCompare(key, adminSecret)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const result = await dbQuery('DELETE FROM email_captures WHERE LOWER(email) = LOWER($1)', [
      email,
    ]);
    res.json({
      success: true,
      message: `Deleted ${result.rowCount} email capture(s) for ${email}`,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Delete email capture error:', error);
    res.status(500).json({ error: 'Failed to delete email capture' });
  }
});

// GET /api/admin/verify-email - Manually verify a user's email
app.get('/api/admin/verify-email', async (req, res) => {
  const { email, key } = req.query;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !safeCompare(key, adminSecret)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const result = await dbQuery(
      'UPDATE users SET email_verified = TRUE WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: `Email ${email} verified` });
  } catch (error) {
    console.error('Admin verify-email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/admin/upgrade-user - Upgrade a user to Unlimited plan (legacy)
app.post('/api/admin/upgrade-user', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Rate limiting
  if (!checkAdminRateLimit(ip)) {
    console.log(`⚠️ Admin rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const { email, key } = req.query;
  const adminSecret = process.env.ADMIN_SECRET;

  // Check if ADMIN_SECRET is configured
  if (!adminSecret) {
    console.error('❌ ADMIN_SECRET environment variable not configured');
    return res.status(500).json({ error: 'Admin endpoint not configured' });
  }

  // Validate key with timing-safe comparison
  if (!safeCompare(key, adminSecret)) {
    console.log(`⚠️ Invalid admin key attempt for email: ${email} from IP: ${ip}`);
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  // Validate email
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // Find user
    const user = await dbGet(
      'SELECT id, email, subscription_plan FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: `User not found: ${email}` });
    }

    // Upgrade user
    await dbQuery(
      `UPDATE users SET
        subscription_plan = 'unlimited',
        subscription_status = 'active',
        responses_limit = 999999
       WHERE id = $1`,
      [user.id]
    );

    console.log(`✅ Admin upgraded user ${email} to Unlimited (was: ${user.subscription_plan})`);

    res.json({
      success: true,
      message: `User ${email} upgraded to Unlimited plan`,
      previous_plan: user.subscription_plan,
      new_plan: 'unlimited',
    });
  } catch (error) {
    console.error('Admin upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

// ==========================================
// ADMIN - AFFILIATE MANAGEMENT
// ==========================================

// Middleware for admin authentication
const authenticateAdmin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkAdminRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const adminKey = req.headers['x-admin-key'];
  const adminSecret = process.env.ADMIN_SECRET;

  console.log(
    `🔐 Admin auth attempt - Key provided: ${adminKey ? 'yes (' + adminKey.substring(0, 4) + '...)' : 'no'}, Secret configured: ${adminSecret ? 'yes' : 'no'}`
  );

  if (!adminSecret) {
    console.log('❌ ADMIN_SECRET not configured in environment');
    return res
      .status(500)
      .json({ error: 'ADMIN_SECRET not configured. Add it to Render environment variables.' });
  }

  if (!adminKey) {
    return res.status(401).json({ error: 'No admin key provided' });
  }

  if (!safeCompare(adminKey, adminSecret)) {
    console.log(`⚠️ Invalid admin key attempt from IP: ${ip}`);
    return res.status(401).json({ error: 'Invalid admin key' });
  }

  console.log(`✅ Admin authenticated from IP: ${ip}`);
  next();
};

// GET /api/admin/affiliates - List all affiliate applications
app.get('/api/admin/affiliates', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT a.*, u.email, u.business_name
      FROM affiliates a
      JOIN users u ON a.user_id = u.id
    `;
    const params = [];

    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      query += ' WHERE a.status = $1';
      params.push(status);
    }

    query += ' ORDER BY a.applied_at DESC';

    const affiliates = await dbAll(query, params);

    // Get summary counts
    const counts = await dbGet(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) as total
      FROM affiliates
    `);

    res.json({
      affiliates,
      counts: {
        pending: parseInt(counts.pending) || 0,
        approved: parseInt(counts.approved) || 0,
        rejected: parseInt(counts.rejected) || 0,
        suspended: parseInt(counts.suspended) || 0,
        total: parseInt(counts.total) || 0,
      },
    });
  } catch (error) {
    console.error('Admin get affiliates error:', error);
    res.status(500).json({ error: 'Failed to get affiliates' });
  }
});

// GET /api/admin/affiliates/:id - Get single affiliate with details
app.get('/api/admin/affiliates/:id', authenticateAdmin, async (req, res) => {
  try {
    const affiliate = await dbGet(
      `
      SELECT a.*, u.email, u.business_name, u.created_at as user_created_at
      FROM affiliates a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `,
      [req.params.id]
    );

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    // Get conversions
    const conversions = await dbAll(
      `
      SELECT ac.*, u.email as converted_email
      FROM affiliate_conversions ac
      LEFT JOIN users u ON ac.referred_user_id = u.id
      WHERE ac.affiliate_id = $1
      ORDER BY ac.created_at DESC
      LIMIT 50
    `,
      [req.params.id]
    );

    // Get payouts
    const payouts = await dbAll(
      `
      SELECT * FROM affiliate_payouts
      WHERE affiliate_id = $1
      ORDER BY created_at DESC
    `,
      [req.params.id]
    );

    res.json({ affiliate, conversions, payouts });
  } catch (error) {
    console.error('Admin get affiliate error:', error);
    res.status(500).json({ error: 'Failed to get affiliate details' });
  }
});

// PUT /api/admin/affiliates/:id/status - Approve/reject/suspend an affiliate
app.put('/api/admin/affiliates/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const affiliate = await dbGet('SELECT * FROM affiliates WHERE id = $1', [id]);
    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const updates = ['status = $1'];
    const params = [status];
    let paramIndex = 2;

    if (status === 'approved' && affiliate.status !== 'approved') {
      updates.push(`approved_at = NOW()`);
    }

    params.push(id);

    await dbQuery(`UPDATE affiliates SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);

    // Get user email for notification
    const user = await dbGet('SELECT email, business_name FROM users WHERE id = $1', [
      affiliate.user_id,
    ]);

    // Send email notification if Resend is configured
    if (resend && user) {
      try {
        let subject, html;

        if (status === 'approved') {
          subject = 'Your Affiliate Application is Approved!';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10B981;">Congratulations! You're Now a ReviewResponder Affiliate</h1>
              <p>Hi${user.business_name ? ' ' + user.business_name : ''},</p>
              <p>Great news! Your affiliate application has been approved.</p>
              <p><strong>Your Affiliate Code:</strong> ${affiliate.affiliate_code}</p>
              <p><strong>Commission Rate:</strong> ${affiliate.commission_rate}% recurring</p>
              <p>You can now start earning by sharing your unique affiliate link:</p>
              <p style="background: #F3F4F6; padding: 15px; border-radius: 8px; font-family: monospace;">
                https://tryreviewresponder.com/?aff=${affiliate.affiliate_code}
              </p>
              <p>Visit your <a href="https://tryreviewresponder.com/affiliate/dashboard">Affiliate Dashboard</a> to track your earnings and get marketing materials.</p>
              <p>Best,<br>The ReviewResponder Team</p>
            </div>
          `;
        } else if (status === 'rejected') {
          subject = 'Update on Your Affiliate Application';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6B7280;">Affiliate Application Update</h1>
              <p>Hi${user.business_name ? ' ' + user.business_name : ''},</p>
              <p>Thank you for your interest in the ReviewResponder affiliate program.</p>
              <p>After reviewing your application, we've decided not to move forward at this time.</p>
              ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
              <p>You're welcome to reapply in the future if your circumstances change.</p>
              <p>Best,<br>The ReviewResponder Team</p>
            </div>
          `;
        }

        if (subject && html) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject,
            html,
          });
        }
      } catch (emailError) {
        console.error('Failed to send affiliate status email:', emailError);
      }
    }

    console.log(`✅ Admin updated affiliate ${id} status to ${status}`);

    res.json({
      success: true,
      message: `Affiliate ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}`,
      affiliate_code: affiliate.affiliate_code,
    });
  } catch (error) {
    console.error('Admin update affiliate status error:', error);
    res.status(500).json({ error: 'Failed to update affiliate status' });
  }
});

// PUT /api/admin/affiliates/:id/commission - Update commission rate
app.put('/api/admin/affiliates/:id/commission', authenticateAdmin, async (req, res) => {
  try {
    const { commissionRate } = req.body;
    const { id } = req.params;

    if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 50) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 50%' });
    }

    await dbQuery('UPDATE affiliates SET commission_rate = $1 WHERE id = $2', [commissionRate, id]);

    console.log(`✅ Admin updated affiliate ${id} commission to ${commissionRate}%`);

    res.json({ success: true, message: `Commission rate updated to ${commissionRate}%` });
  } catch (error) {
    console.error('Admin update commission error:', error);
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

// POST /api/admin/affiliates/:id/payout - Mark a payout as processed
app.post('/api/admin/affiliates/:id/payout', authenticateAdmin, async (req, res) => {
  try {
    const { amount, method, transactionId, note } = req.body;
    const { id } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payout amount required' });
    }

    const affiliate = await dbGet('SELECT * FROM affiliates WHERE id = $1', [id]);
    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    // Create payout record
    await dbQuery(
      `
      INSERT INTO affiliate_payouts (affiliate_id, amount, method, transaction_id, status, note, processed_at)
      VALUES ($1, $2, $3, $4, 'completed', $5, NOW())
    `,
      [id, amount, method || affiliate.payout_method, transactionId, note]
    );

    // Update affiliate totals
    await dbQuery(
      `
      UPDATE affiliates
      SET total_paid = total_paid + $1, pending_balance = pending_balance - $1
      WHERE id = $2
    `,
      [amount, id]
    );

    console.log(`✅ Admin processed payout of $${amount} for affiliate ${id}`);

    res.json({ success: true, message: `Payout of $${amount} processed` });
  } catch (error) {
    console.error('Admin process payout error:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// GET /api/admin/stats - Get overall admin stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    // User stats - this should always work
    let userStats = { total_users: 0, paying_users: 0, new_users_week: 0, new_users_month: 0 };
    try {
      userStats =
        (await dbGet(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE subscription_plan != 'free') as paying_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
        FROM users
      `)) || userStats;
    } catch (e) {
      console.error('User stats query error:', e.message);
    }

    // Revenue stats - might fail if table doesn't exist
    let revenueStats = { total_commissions: 0, total_conversions: 0 };
    try {
      revenueStats =
        (await dbGet(`
        SELECT
          COALESCE(SUM(commission_amount), 0) as total_commissions,
          COUNT(DISTINCT referred_user_id) as total_conversions
        FROM affiliate_conversions
      `)) || revenueStats;
    } catch (e) {
      console.error('Revenue stats query error:', e.message);
    }

    // Affiliate stats - might fail if table doesn't exist
    let affiliateStats = {
      pending_affiliates: 0,
      active_affiliates: 0,
      total_affiliate_earnings: 0,
      total_pending_payouts: 0,
    };
    try {
      affiliateStats =
        (await dbGet(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_affiliates,
          COUNT(*) FILTER (WHERE status = 'approved') as active_affiliates,
          COALESCE(SUM(total_earned), 0) as total_affiliate_earnings,
          COALESCE(SUM(pending_balance), 0) as total_pending_payouts
        FROM affiliates
      `)) || affiliateStats;
    } catch (e) {
      console.error('Affiliate stats query error:', e.message);
    }

    res.json({
      users: {
        total: parseInt(userStats.total_users) || 0,
        paying: parseInt(userStats.paying_users) || 0,
        newThisWeek: parseInt(userStats.new_users_week) || 0,
        newThisMonth: parseInt(userStats.new_users_month) || 0,
      },
      affiliates: {
        pending: parseInt(affiliateStats.pending_affiliates) || 0,
        active: parseInt(affiliateStats.active_affiliates) || 0,
        totalEarnings: parseFloat(affiliateStats.total_affiliate_earnings) || 0,
        pendingPayouts: parseFloat(affiliateStats.total_pending_payouts) || 0,
      },
      conversions: {
        total: parseInt(revenueStats.total_conversions) || 0,
        totalCommissions: parseFloat(revenueStats.total_commissions) || 0,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// ==========================================
// OUTREACH EMAIL TRACKING
// ==========================================

// Track email opens via invisible pixel
// GET because it's loaded as an image src
app.get('/api/outreach/track-open', async (req, res) => {
  try {
    const { email, campaign } = req.query;

    if (email && campaign) {
      // Get IP and user agent for analytics
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      // Store the open event
      await dbQuery(
        `INSERT INTO outreach_tracking (email, campaign, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [email, campaign, ip.split(',')[0], userAgent]
      );

      console.log(`📧 Email opened: ${email} (campaign: ${campaign})`);
    }
  } catch (error) {
    // Silent fail - don't break email viewing
    console.error('Tracking error:', error.message);
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  res.send(pixel);
});

// Get outreach stats (admin only - use with secret)
app.get('/api/outreach/stats', async (req, res) => {
  try {
    const { secret } = req.query;

    // Simple secret check for admin access
    if (!process.env.ADMIN_SECRET || !safeCompare(secret, process.env.ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get overall stats
    const totalOpens = await dbGet(`SELECT COUNT(*) as count FROM outreach_tracking`);

    // Get unique opens (by email)
    const uniqueOpens = await dbGet(`SELECT COUNT(DISTINCT email) as count FROM outreach_tracking`);

    // Get opens by campaign
    const byCampaign = await dbAll(
      `SELECT campaign,
              COUNT(*) as total_opens,
              COUNT(DISTINCT email) as unique_opens
       FROM outreach_tracking
       GROUP BY campaign
       ORDER BY total_opens DESC`
    );

    // Get recent opens
    const recentOpens = await dbAll(
      `SELECT email, campaign, opened_at
       FROM outreach_tracking
       ORDER BY opened_at DESC
       LIMIT 20`
    );

    // Get opens by day (last 14 days)
    const byDay = await dbAll(
      `SELECT DATE(opened_at) as date, COUNT(*) as opens
       FROM outreach_tracking
       WHERE opened_at > NOW() - INTERVAL '14 days'
       GROUP BY DATE(opened_at)
       ORDER BY date DESC`
    );

    res.json({
      total_opens: parseInt(totalOpens?.count || 0),
      unique_opens: parseInt(uniqueOpens?.count || 0),
      by_campaign: byCampaign,
      recent_opens: recentOpens,
      by_day: byDay,
    });
  } catch (error) {
    console.error('Outreach stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==========================================
// AUTOMATED OUTREACH SYSTEM
// Fully automated lead generation & cold email
// ==========================================

// Initialize outreach tables
async function initOutreachTables() {
  try {
    // Leads table - stores scraped business contacts
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS outreach_leads (
        id SERIAL PRIMARY KEY,
        business_name TEXT NOT NULL,
        business_type TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT DEFAULT 'US',
        phone TEXT,
        website TEXT,
        google_rating DECIMAL(2,1),
        google_reviews_count INTEGER,
        email TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        email_source TEXT,
        contact_name TEXT,
        status TEXT DEFAULT 'new',
        source TEXT DEFAULT 'google_places',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(business_name, city)
      )
    `);

    // Email sequences table - tracks sent emails
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS outreach_emails (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES outreach_leads(id),
        email TEXT NOT NULL,
        sequence_number INTEGER DEFAULT 1,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        replied_at TIMESTAMP,
        bounced BOOLEAN DEFAULT FALSE,
        campaign TEXT DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Outreach campaigns config
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS outreach_campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        daily_limit INTEGER DEFAULT 50,
        sent_today INTEGER DEFAULT 0,
        last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        target_industries TEXT[],
        target_cities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default campaign if not exists
    await dbQuery(`
      INSERT INTO outreach_campaigns (name, target_industries, target_cities)
      VALUES ('main', ARRAY['restaurant', 'hotel', 'dental', 'medical', 'legal', 'automotive'],
              ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'Austin', 'Denver'])
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Outreach tables initialized');
  } catch (error) {
    console.error('Error initializing outreach tables:', error);
  }
}

// Call this after main initDatabase
initOutreachTables();

// German-speaking cities for language detection
const GERMAN_CITIES = [
  'Berlin',
  'München',
  'Munich',
  'Hamburg',
  'Frankfurt',
  'Köln',
  'Cologne',
  'Stuttgart',
  'Düsseldorf',
  'Wien',
  'Vienna',
  'Zürich',
  'Zurich',
  'Salzburg',
  'Graz',
  'Innsbruck',
  'Bern',
  'Basel',
];

// Helper: Detect language based on city
function detectLanguage(city) {
  if (!city) return 'en';
  return GERMAN_CITIES.some(gc => city.toLowerCase().includes(gc.toLowerCase())) ? 'de' : 'en';
}

// Email templates for cold outreach - ENGLISH
const EMAIL_TEMPLATES_EN = {
  sequence1: {
    subject: '{business_name} - quick question',
    body: `Hi,

I noticed {business_name} has {review_count}+ Google reviews - impressive!

Quick question: How much time does your team spend responding to customer reviews each week?

I built a tool that helps with exactly this - 3 seconds per response instead of 5 minutes.

If you're interested: https://tryreviewresponder.com

Cheers,
Berend

P.S. I'm the founder, feel free to reply if you have any questions.`,
  },
  sequence2: {
    subject: 'Re: {business_name}',
    body: `Hey,

just wanted to check if you saw my last email.

Businesses that respond to reviews get higher ratings and up to 9% more revenue (Harvard study) - but I get that time is tight.

If you have 2 minutes: https://tryreviewresponder.com

Cheers,
Berend`,
  },
  sequence3: {
    subject: '{business_name}',
    body: `Hi,

last email from me - promise!

If review management isn't a priority right now, no worries.

But if you ever find reviews piling up: https://tryreviewresponder.com is there.

Wishing you continued success!

Berend`,
  },
};

// Email templates for cold outreach - GERMAN
const EMAIL_TEMPLATES_DE = {
  sequence1: {
    subject: '{business_name} - kurze Frage',
    body: `Hi,

ich hab gesehen dass {business_name} über {review_count} Google Reviews hat - Respekt!

Kurze Frage: Wie viel Zeit verbringt ihr pro Woche damit, auf Kundenrezensionen zu antworten?

Ich hab ein Tool gebaut das genau dabei hilft - 3 Sekunden pro Antwort statt 5 Minuten.

Falls interessant: https://tryreviewresponder.com

Grüße,
Berend

P.S. Bin der Gründer, bei Fragen einfach antworten.`,
  },
  sequence2: {
    subject: 'Re: {business_name}',
    body: `Hey nochmal,

wollte nur kurz nachfragen ob du meine letzte Mail gesehen hast.

Wer auf Reviews antwortet bekommt bessere Bewertungen und bis zu 9% mehr Umsatz (Harvard Studie) - aber ich versteh dass Zeit knapp ist.

Falls du mal 2 Minuten hast: https://tryreviewresponder.com

Grüße,
Berend`,
  },
  sequence3: {
    subject: '{business_name}',
    body: `Hi,

letzte Mail von mir - versprochen!

Falls Review-Management gerade keine Priorität ist, kein Problem.

Aber falls Reviews mal liegen bleiben: https://tryreviewresponder.com ist da.

Viel Erfolg weiterhin!

Berend`,
  },
};

// Combined templates with language selection
const EMAIL_TEMPLATES = {
  sequence1: EMAIL_TEMPLATES_EN.sequence1,
  sequence2: EMAIL_TEMPLATES_EN.sequence2,
  sequence3: EMAIL_TEMPLATES_EN.sequence3,
  sequence1_de: EMAIL_TEMPLATES_DE.sequence1,
  sequence2_de: EMAIL_TEMPLATES_DE.sequence2,
  sequence3_de: EMAIL_TEMPLATES_DE.sequence3,
};

// Helper: Get template based on language
function getTemplateForLead(sequenceNum, lead) {
  const lang = detectLanguage(lead.city);
  const key = lang === 'de' ? `sequence${sequenceNum}_de` : `sequence${sequenceNum}`;
  return EMAIL_TEMPLATES[key];
}

// Helper: Fill email template with lead data
function fillEmailTemplate(template, lead) {
  let subject = template.subject;
  let body = template.body;

  const replacements = {
    '{business_name}': lead.business_name || 'your business',
    '{business_type}': lead.business_type || 'business',
    '{review_count}': lead.google_reviews_count || '50',
    '{email}': encodeURIComponent(lead.email || ''),
    '{city}': lead.city || '',
    '{contact_name}': lead.contact_name || 'there',
  };

  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key, 'g'), value);
    body = body.replace(new RegExp(key, 'g'), value);
  }

  return { subject, body };
}

// ==========================================
// LEAD SCRAPING (Google Places API)
// ==========================================

// Scrape leads from Google Places API
app.post('/api/outreach/scrape-leads', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { query = 'restaurant', city = 'New York', limit = 20 } = req.body;

  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({
      error: 'GOOGLE_PLACES_API_KEY not configured',
      setup: 'Add GOOGLE_PLACES_API_KEY to Render environment variables',
    });
  }

  try {
    const searchQuery = `${query} in ${city}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ error: 'Google Places API error', details: data.status });
    }

    const leads = [];

    for (const place of data.results.slice(0, limit)) {
      // Get detailed info for each place
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types&key=${GOOGLE_API_KEY}`;

      const detailsResponse = await fetch(detailsUrl);
      const details = await detailsResponse.json();

      if (details.status === 'OK') {
        const result = details.result;

        // Parse address
        const addressParts = (result.formatted_address || '').split(',');
        const cityState = addressParts[1]?.trim() || city;

        const lead = {
          business_name: result.name,
          business_type: query,
          address: result.formatted_address,
          city: city,
          phone: result.formatted_phone_number,
          website: result.website,
          google_rating: result.rating,
          google_reviews_count: result.user_ratings_total,
          source: 'google_places',
        };

        // Insert lead (ignore duplicates)
        try {
          await dbQuery(
            `
            INSERT INTO outreach_leads
            (business_name, business_type, address, city, phone, website, google_rating, google_reviews_count, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (business_name, city) DO UPDATE SET
              google_rating = EXCLUDED.google_rating,
              google_reviews_count = EXCLUDED.google_reviews_count,
              website = COALESCE(EXCLUDED.website, outreach_leads.website)
          `,
            [
              lead.business_name,
              lead.business_type,
              lead.address,
              lead.city,
              lead.phone,
              lead.website,
              lead.google_rating,
              lead.google_reviews_count,
              lead.source,
            ]
          );

          leads.push(lead);
        } catch (dbError) {
          console.error('Lead insert error:', dbError.message);
        }
      }

      // Rate limiting - don't hammer Google API
      await new Promise(r => setTimeout(r, 200));
    }

    res.json({
      success: true,
      leads_found: leads.length,
      query: searchQuery,
      leads: leads,
    });
  } catch (error) {
    console.error('Lead scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape leads' });
  }
});

// ==========================================
// EMAIL FINDER (Hunter.io Integration)
// ==========================================

// Find emails for leads using Hunter.io
app.post('/api/outreach/find-emails', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

  if (!HUNTER_API_KEY) {
    return res.status(500).json({
      error: 'HUNTER_API_KEY not configured',
      setup: 'Get free API key from hunter.io and add to Render',
    });
  }

  try {
    // Get leads without emails that have websites
    const leads = await dbAll(`
      SELECT id, business_name, website
      FROM outreach_leads
      WHERE email IS NULL
        AND website IS NOT NULL
        AND website != ''
      LIMIT 25
    `);

    if (leads.length === 0) {
      return res.json({ success: true, message: 'No leads need email lookup', found: 0 });
    }

    let found = 0;

    for (const lead of leads) {
      try {
        // Extract domain from website
        let domain = lead.website;
        domain = domain
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];

        // Use Hunter.io Domain Search
        const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
        const response = await fetch(hunterUrl);
        const data = await response.json();

        if (data.data?.emails?.length > 0) {
          // Get the most relevant email (usually first one with highest confidence)
          const bestEmail = data.data.emails.sort(
            (a, b) => (b.confidence || 0) - (a.confidence || 0)
          )[0];

          await dbQuery(
            `
            UPDATE outreach_leads
            SET email = $1,
                email_verified = $2,
                email_source = 'hunter.io',
                contact_name = $3
            WHERE id = $4
          `,
            [
              bestEmail.value,
              bestEmail.verification?.status === 'valid',
              `${bestEmail.first_name || ''} ${bestEmail.last_name || ''}`.trim(),
              lead.id,
            ]
          );

          found++;
          console.log(`📧 Found email for ${lead.business_name}: ${bestEmail.value}`);
        }

        // Rate limiting for Hunter API
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Email lookup failed for ${lead.business_name}:`, err.message);
      }
    }

    res.json({
      success: true,
      leads_checked: leads.length,
      emails_found: found,
    });
  } catch (error) {
    console.error('Email finder error:', error);
    res.status(500).json({ error: 'Failed to find emails' });
  }
});

// ==========================================
// AUTOMATED EMAIL SENDING
// ==========================================

// Test email endpoint - sends a single test email
app.post('/api/outreach/test-email', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SECRET || !safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Resend not configured' });
  }

  const { email, business_name, city } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const testLead = {
      business_name: business_name || 'Test Business',
      business_type: 'restaurant',
      city: city || 'New York', // Default to English, use 'Berlin' for German
      email: email,
      google_reviews_count: 100,
    };

    const template = fillEmailTemplate(getTemplateForLead(1, testLead), testLead);
    const language = detectLanguage(testLead.city);

    const result = await resend.emails.send({
      from: OUTREACH_FROM_EMAIL,
      to: email,
      subject: `[TEST] ${template.subject}`,
      html: template.body.replace(/\n/g, '<br>'),
    });

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
      from: OUTREACH_FROM_EMAIL,
      language: language,
      city: testLead.city,
      resend_id: result.id,
    });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test Usage Alert Email
app.post('/api/admin/test-usage-alert', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SECRET || !safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Resend not configured' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const testUser = {
      email: email,
      business_name: 'Test Business',
      subscription_plan: 'starter',
      email_usage_alerts: true,
    };

    const sent = await sendUsageAlertEmail(testUser);
    if (sent) {
      res.json({ success: true, message: `Usage alert test email sent to ${email}` });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (err) {
    console.error('Test usage alert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test Plan Renewal Email
app.post('/api/admin/test-plan-renewal', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SECRET || !safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Resend not configured' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const testUser = {
      email: email,
      business_name: 'Test Business',
      subscription_plan: 'professional',
      email_billing_updates: true,
    };

    const sent = await sendPlanRenewalEmail(testUser);
    if (sent) {
      res.json({ success: true, message: `Plan renewal test email sent to ${email}` });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (err) {
    console.error('Test plan renewal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test Affiliate Status Email (Approved/Rejected)
app.post('/api/admin/test-affiliate-email', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_SECRET || !safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Resend not configured' });
  }

  const { email, status = 'approved', note } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  try {
    const testUser = {
      email: email,
      business_name: 'Test Affiliate',
    };
    const testAffiliate = {
      affiliate_code: 'TEST123',
      commission_rate: 20,
    };

    let subject, html;

    if (status === 'approved') {
      subject = '[TEST] Your Affiliate Application is Approved!';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">Congratulations! You're Now a ReviewResponder Affiliate</h1>
          <p>Hi ${testUser.business_name},</p>
          <p>Great news! Your affiliate application has been approved.</p>
          <p><strong>Your Affiliate Code:</strong> ${testAffiliate.affiliate_code}</p>
          <p><strong>Commission Rate:</strong> ${testAffiliate.commission_rate}% recurring</p>
          <p>You can now start earning by sharing your unique affiliate link:</p>
          <p style="background: #F3F4F6; padding: 15px; border-radius: 8px; font-family: monospace;">
            https://tryreviewresponder.com/?aff=${testAffiliate.affiliate_code}
          </p>
          <p>Visit your <a href="https://tryreviewresponder.com/affiliate/dashboard">Affiliate Dashboard</a> to track your earnings and get marketing materials.</p>
          <p>Best,<br>The ReviewResponder Team</p>
        </div>
      `;
    } else {
      subject = '[TEST] Update on Your Affiliate Application';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6B7280;">Affiliate Application Update</h1>
          <p>Hi ${testUser.business_name},</p>
          <p>Thank you for your interest in the ReviewResponder affiliate program.</p>
          <p>After reviewing your application, we've decided not to move forward at this time.</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
          <p>You're welcome to reapply in the future if your circumstances change.</p>
          <p>Best,<br>The ReviewResponder Team</p>
        </div>
      `;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    res.json({ success: true, message: `Affiliate ${status} test email sent to ${email}` });
  } catch (err) {
    console.error('Test affiliate email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send cold emails to leads
app.post('/api/outreach/send-emails', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({
      error: 'RESEND_API_KEY not configured',
      setup: 'Add RESEND_API_KEY to Render environment variables',
    });
  }

  const { limit = 20, campaign = 'main' } = req.body;

  try {
    // Check daily limit
    const campaignConfig = await dbGet('SELECT * FROM outreach_campaigns WHERE name = $1', [
      campaign,
    ]);

    if (!campaignConfig) {
      return res.status(400).json({ error: 'Campaign not found' });
    }

    // Reset daily counter if new day
    const lastReset = new Date(campaignConfig.last_reset);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
      await dbQuery(
        'UPDATE outreach_campaigns SET sent_today = 0, last_reset = NOW() WHERE name = $1',
        [campaign]
      );
      campaignConfig.sent_today = 0;
    }

    const remainingToday = campaignConfig.daily_limit - campaignConfig.sent_today;
    const toSend = Math.min(limit, remainingToday);

    if (toSend <= 0) {
      return res.json({
        success: true,
        message: 'Daily limit reached',
        sent: 0,
        daily_limit: campaignConfig.daily_limit,
      });
    }

    // Get leads ready for first email (have email, no emails sent yet)
    const newLeads = await dbAll(
      `
      SELECT l.* FROM outreach_leads l
      LEFT JOIN outreach_emails e ON l.id = e.lead_id
      WHERE l.email IS NOT NULL
        AND l.status = 'new'
        AND e.id IS NULL
      ORDER BY l.google_reviews_count DESC NULLS LAST
      LIMIT $1
    `,
      [toSend]
    );

    let sent = 0;

    for (const lead of newLeads) {
      try {
        const template = fillEmailTemplate(getTemplateForLead(1, lead), lead);

        // Send email via Resend
        const result = await resend.emails.send({
          from: OUTREACH_FROM_EMAIL,
          to: lead.email,
          subject: template.subject,
          html: template.body.replace(/\n/g, '<br>'),
          tags: [
            { name: 'campaign', value: campaign },
            { name: 'sequence', value: '1' },
          ],
        });

        // Log the email
        await dbQuery(
          `
          INSERT INTO outreach_emails
          (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
          VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), $5)
        `,
          [lead.id, lead.email, template.subject, template.body, campaign]
        );

        // Update lead status
        await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', [
          'contacted',
          lead.id,
        ]);

        sent++;
        console.log(`✉️ Sent to ${lead.email} (${lead.business_name})`);

        // Small delay between sends
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Failed to send to ${lead.email}:`, err.message);

        // Mark as bounced if email error
        if (err.message?.includes('bounce') || err.message?.includes('invalid')) {
          await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', [
            'bounced',
            lead.id,
          ]);
        }
      }
    }

    // Update daily counter
    await dbQuery('UPDATE outreach_campaigns SET sent_today = sent_today + $1 WHERE name = $2', [
      sent,
      campaign,
    ]);

    res.json({
      success: true,
      sent: sent,
      remaining_today: remainingToday - sent,
      daily_limit: campaignConfig.daily_limit,
    });
  } catch (error) {
    console.error('Send emails error:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// ==========================================
// ADD LEADS FROM TRIPADVISOR (Claude in Chrome)
// ==========================================
app.post('/api/outreach/add-tripadvisor-leads', async (req, res) => {
  // Auth via header or query param (for Claude in Chrome)
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { leads, send_emails = false, campaign = 'tripadvisor' } = req.body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads array is required' });
  }

  try {
    const results = {
      added: 0,
      skipped: 0,
      emails_sent: 0,
      errors: []
    };

    for (const lead of leads) {
      try {
        // Skip if no email
        if (!lead.email) {
          results.skipped++;
          continue;
        }

        // Insert or update lead
        await dbQuery(`
          INSERT INTO outreach_leads
            (business_name, business_type, address, city, country, phone, website,
             google_rating, google_reviews_count, email, source, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (business_name, city)
          DO UPDATE SET
            email = COALESCE(EXCLUDED.email, outreach_leads.email),
            phone = COALESCE(EXCLUDED.phone, outreach_leads.phone),
            website = COALESCE(EXCLUDED.website, outreach_leads.website),
            google_rating = COALESCE(EXCLUDED.google_rating, outreach_leads.google_rating),
            google_reviews_count = COALESCE(EXCLUDED.google_reviews_count, outreach_leads.google_reviews_count)
        `, [
          lead.name || lead.business_name,
          lead.type || lead.business_type || 'restaurant',
          lead.address,
          lead.city,
          lead.country || 'US',
          lead.phone,
          lead.website || lead.tripadvisor_url,
          lead.rating || lead.google_rating,
          lead.reviews || lead.google_reviews_count,
          lead.email,
          'tripadvisor',
          'new'
        ]);

        results.added++;

        // Send email immediately if requested
        if (send_emails && resend && lead.email) {
          const template = fillEmailTemplate(getTemplateForLead(1, {
            ...lead,
            business_name: lead.name || lead.business_name,
            google_reviews_count: lead.reviews || lead.google_reviews_count
          }), lead);

          try {
            await resend.emails.send({
              from: OUTREACH_FROM_EMAIL,
              to: lead.email,
              subject: template.subject,
              html: template.body.replace(/\n/g, '<br>'),
              tags: [
                { name: 'campaign', value: campaign },
                { name: 'source', value: 'tripadvisor' },
                { name: 'sequence', value: '1' }
              ]
            });
            results.emails_sent++;

            // Log the sent email
            const insertedLead = await dbGet(
              'SELECT id FROM outreach_leads WHERE business_name = $1 AND city = $2',
              [lead.name || lead.business_name, lead.city]
            );
            if (insertedLead) {
              await dbQuery(`
                INSERT INTO outreach_emails
                  (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
                VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), $5)
              `, [insertedLead.id, lead.email, template.subject, template.body, campaign]);

              await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', ['contacted', insertedLead.id]);
            }
          } catch (emailError) {
            results.errors.push(`Email failed for ${lead.name}: ${emailError.message}`);
          }
        }
      } catch (leadError) {
        results.errors.push(`Failed to add ${lead.name}: ${leadError.message}`);
      }
    }

    console.log(`TripAdvisor leads processed: ${results.added} added, ${results.skipped} skipped, ${results.emails_sent} emails sent`);

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Add TripAdvisor leads error:', error);
    res.status(500).json({ error: 'Failed to add leads' });
  }
});

// ==========================================
// CRON: Send emails to new TripAdvisor leads
// Called daily by cron-job.org to send cold emails
// ==========================================
app.get('/api/cron/send-tripadvisor-emails', async (req, res) => {
  const cronSecret = req.query.secret || req.query.key;
  if (!safeCompare(cronSecret, process.env.CRON_SECRET) && !safeCompare(cronSecret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    // Get all new leads from TripAdvisor that haven't been contacted
    const newLeads = await dbAll(`
      SELECT * FROM outreach_leads
      WHERE source = 'tripadvisor'
      AND status = 'new'
      AND email IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 50
    `);

    if (newLeads.length === 0) {
      return res.json({ success: true, message: 'No new leads to contact', emails_sent: 0 });
    }

    const results = {
      total: newLeads.length,
      emails_sent: 0,
      errors: []
    };

    for (const lead of newLeads) {
      try {
        // Get template for first email
        const template = fillEmailTemplate(getTemplateForLead(1, {
          business_name: lead.business_name,
          google_rating: lead.google_rating,
          google_reviews_count: lead.google_reviews_count
        }), lead);

        // Send email via Resend
        await resend.emails.send({
          from: OUTREACH_FROM_EMAIL,
          to: lead.email,
          subject: template.subject,
          html: template.body.replace(/\n/g, '<br>'),
          tags: [
            { name: 'campaign', value: 'tripadvisor-auto' },
            { name: 'source', value: 'tripadvisor' },
            { name: 'sequence', value: '1' }
          ]
        });

        // Update lead status
        await dbQuery(`
          UPDATE outreach_leads
          SET status = 'contacted'
          WHERE id = $1
        `, [lead.id]);

        // Log the email
        await dbQuery(`
          INSERT INTO outreach_emails (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
          VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), 'tripadvisor-auto')
        `, [lead.id, lead.email, template.subject, template.body]);

        results.emails_sent++;
        console.log(`📧 TripAdvisor email sent to: ${lead.email} (${lead.business_name})`);

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (emailError) {
        results.errors.push(`Failed to email ${lead.business_name}: ${emailError.message}`);
        console.error(`Email error for ${lead.email}:`, emailError.message);
      }
    }

    console.log(`✅ TripAdvisor cron complete: ${results.emails_sent}/${results.total} emails sent`);

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('TripAdvisor cron error:', error);
    res.status(500).json({ error: 'Cron job failed', message: error.message });
  }
});

// Send follow-up emails (sequence 2 and 3)
app.post('/api/outreach/send-followups', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    // Find leads needing follow-up 2 (3 days after sequence 1, no open)
    const needsFollowup2 = await dbAll(`
      SELECT l.*, e.sent_at as last_email_sent
      FROM outreach_leads l
      JOIN outreach_emails e ON l.id = e.lead_id
      WHERE e.sequence_number = 1
        AND e.sent_at < NOW() - INTERVAL '3 days'
        AND e.opened_at IS NULL
        AND l.status = 'contacted'
        AND NOT EXISTS (
          SELECT 1 FROM outreach_emails e2
          WHERE e2.lead_id = l.id AND e2.sequence_number = 2
        )
      LIMIT 20
    `);

    // Find leads needing follow-up 3 (7 days after sequence 2, no reply)
    const needsFollowup3 = await dbAll(`
      SELECT l.*, e.sent_at as last_email_sent
      FROM outreach_leads l
      JOIN outreach_emails e ON l.id = e.lead_id
      WHERE e.sequence_number = 2
        AND e.sent_at < NOW() - INTERVAL '4 days'
        AND e.replied_at IS NULL
        AND l.status = 'contacted'
        AND NOT EXISTS (
          SELECT 1 FROM outreach_emails e2
          WHERE e2.lead_id = l.id AND e2.sequence_number = 3
        )
      LIMIT 20
    `);

    let sent2 = 0,
      sent3 = 0;

    // Send sequence 2
    for (const lead of needsFollowup2) {
      try {
        const template = fillEmailTemplate(getTemplateForLead(2, lead), lead);

        await resend.emails.send({
          from: OUTREACH_FROM_EMAIL,
          to: lead.email,
          subject: template.subject,
          html: template.body.replace(/\n/g, '<br>'),
        });

        await dbQuery(
          `
          INSERT INTO outreach_emails
          (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
          VALUES ($1, $2, 2, $3, $4, 'sent', NOW(), 'main')
        `,
          [lead.id, lead.email, template.subject, template.body]
        );

        sent2++;
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Follow-up 2 failed for ${lead.email}:`, err.message);
      }
    }

    // Send sequence 3
    for (const lead of needsFollowup3) {
      try {
        const template = fillEmailTemplate(getTemplateForLead(3, lead), lead);

        await resend.emails.send({
          from: OUTREACH_FROM_EMAIL,
          to: lead.email,
          subject: template.subject,
          html: template.body.replace(/\n/g, '<br>'),
        });

        await dbQuery(
          `
          INSERT INTO outreach_emails
          (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
          VALUES ($1, $2, 3, $3, $4, 'sent', NOW(), 'main')
        `,
          [lead.id, lead.email, template.subject, template.body]
        );

        // Mark as completed sequence
        await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', [
          'sequence_completed',
          lead.id,
        ]);

        sent3++;
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Follow-up 3 failed for ${lead.email}:`, err.message);
      }
    }

    res.json({
      success: true,
      followup2_sent: sent2,
      followup3_sent: sent3,
      total_sent: sent2 + sent3,
    });
  } catch (error) {
    console.error('Follow-up error:', error);
    res.status(500).json({ error: 'Failed to send follow-ups' });
  }
});

// ==========================================
// CRON ENDPOINTS (For Render Scheduled Jobs)
// ==========================================

// Daily automation: scrape + find emails + send
// Set up as Render Cron Job: 0 9 * * * (9 AM UTC daily)
app.post('/api/cron/daily-outreach', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (
    !safeCompare(cronSecret, process.env.CRON_SECRET) &&
    !safeCompare(cronSecret, process.env.ADMIN_SECRET)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🚀 Starting daily outreach automation...');

  const results = {
    scraping: null,
    email_finding: null,
    sending: null,
    followups: null,
  };

  try {
    // Step 1: Scrape new leads from multiple cities/industries
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];
    const industries = ['restaurant', 'hotel', 'dental office', 'law firm'];

    let totalScraped = 0;

    // Pick random city and industry for today
    const todayCity = cities[new Date().getDay() % cities.length];
    const todayIndustry = industries[new Date().getDay() % industries.length];

    if (process.env.GOOGLE_PLACES_API_KEY) {
      const scrapeUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(todayIndustry + ' in ' + todayCity)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      try {
        const response = await fetch(scrapeUrl);
        const data = await response.json();

        if (data.results) {
          for (const place of data.results.slice(0, 10)) {
            try {
              await dbQuery(
                `
                INSERT INTO outreach_leads (business_name, business_type, city, source)
                VALUES ($1, $2, $3, 'google_places')
                ON CONFLICT (business_name, city) DO NOTHING
              `,
                [place.name, todayIndustry, todayCity]
              );
              totalScraped++;
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Scrape error:', e.message);
      }
    }

    results.scraping = { leads_added: totalScraped, city: todayCity, industry: todayIndustry };

    // Step 2: Find emails for leads without them
    if (process.env.HUNTER_API_KEY) {
      const leadsNeedingEmail = await dbAll(`
        SELECT id, business_name, website FROM outreach_leads
        WHERE email IS NULL AND website IS NOT NULL
        LIMIT 10
      `);

      let emailsFound = 0;

      for (const lead of leadsNeedingEmail) {
        try {
          const domain = lead.website
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0];
          const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
          const response = await fetch(hunterUrl);
          const data = await response.json();

          if (data.data?.emails?.[0]) {
            await dbQuery('UPDATE outreach_leads SET email = $1, email_source = $2 WHERE id = $3', [
              data.data.emails[0].value,
              'hunter.io',
              lead.id,
            ]);
            emailsFound++;
          }
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {}
      }

      results.email_finding = { checked: leadsNeedingEmail.length, found: emailsFound };
    }

    // Step 3: Send new cold emails
    if (resend) {
      const newLeads = await dbAll(`
        SELECT l.* FROM outreach_leads l
        LEFT JOIN outreach_emails e ON l.id = e.lead_id
        WHERE l.email IS NOT NULL AND l.status = 'new' AND e.id IS NULL
        LIMIT 30
      `);

      let sent = 0;

      for (const lead of newLeads) {
        try {
          const template = fillEmailTemplate(getTemplateForLead(1, lead), lead);

          await resend.emails.send({
            from: OUTREACH_FROM_EMAIL,
            to: lead.email,
            subject: template.subject,
            html: template.body.replace(/\n/g, '<br>'),
          });

          await dbQuery(
            `
            INSERT INTO outreach_emails (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
            VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), 'main')
          `,
            [lead.id, lead.email, template.subject, template.body]
          );

          await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', [
            'contacted',
            lead.id,
          ]);
          sent++;

          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error('Send error:', e.message);
        }
      }

      results.sending = { sent: sent };

      // Step 4: Send follow-ups
      const needsFollowup = await dbAll(`
        SELECT l.*, MAX(e.sequence_number) as last_sequence
        FROM outreach_leads l
        JOIN outreach_emails e ON l.id = e.lead_id
        WHERE l.status = 'contacted'
          AND e.sent_at < NOW() - INTERVAL '3 days'
          AND e.replied_at IS NULL
        GROUP BY l.id
        HAVING MAX(e.sequence_number) < 3
        LIMIT 20
      `);

      let followupsSent = 0;

      for (const lead of needsFollowup) {
        const nextSequence = (lead.last_sequence || 1) + 1;

        if (nextSequence <= 3) {
          try {
            const template = fillEmailTemplate(getTemplateForLead(nextSequence, lead), lead);

            await resend.emails.send({
              from: OUTREACH_FROM_EMAIL,
              to: lead.email,
              subject: template.subject,
              html: template.body.replace(/\n/g, '<br>'),
            });

            await dbQuery(
              `
              INSERT INTO outreach_emails (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
              VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), 'main')
            `,
              [lead.id, lead.email, nextSequence, template.subject, template.body]
            );

            if (nextSequence === 3) {
              await dbQuery('UPDATE outreach_leads SET status = $1 WHERE id = $2', [
                'sequence_completed',
                lead.id,
              ]);
            }

            followupsSent++;
            await new Promise(r => setTimeout(r, 500));
          } catch (e) {}
        }
      }

      results.followups = { sent: followupsSent };
    }

    console.log('✅ Daily outreach completed:', results);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results,
    });
  } catch (error) {
    console.error('Daily outreach error:', error);
    res.status(500).json({ error: 'Automation failed', details: error.message });
  }
});

// Get outreach dashboard stats
app.get('/api/outreach/dashboard', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const totalLeads = await dbGet('SELECT COUNT(*) as count FROM outreach_leads');
    const leadsWithEmail = await dbGet(
      'SELECT COUNT(*) as count FROM outreach_leads WHERE email IS NOT NULL'
    );
    const emailsSent = await dbGet(
      'SELECT COUNT(*) as count FROM outreach_emails WHERE status = $1',
      ['sent']
    );
    const emailsOpened = await dbGet(
      'SELECT COUNT(*) as count FROM outreach_emails WHERE opened_at IS NOT NULL'
    );

    const byStatus = await dbAll(`
      SELECT status, COUNT(*) as count
      FROM outreach_leads
      GROUP BY status
    `);

    const recentLeads = await dbAll(`
      SELECT business_name, business_type, city, email, status, google_reviews_count
      FROM outreach_leads
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const recentEmails = await dbAll(`
      SELECT e.email, e.sequence_number, e.sent_at, e.opened_at, l.business_name
      FROM outreach_emails e
      JOIN outreach_leads l ON e.lead_id = l.id
      ORDER BY e.sent_at DESC
      LIMIT 10
    `);

    const campaign = await dbGet('SELECT * FROM outreach_campaigns WHERE name = $1', ['main']);

    res.json({
      stats: {
        total_leads: parseInt(totalLeads?.count || 0),
        leads_with_email: parseInt(leadsWithEmail?.count || 0),
        emails_sent: parseInt(emailsSent?.count || 0),
        emails_opened: parseInt(emailsOpened?.count || 0),
        open_rate:
          emailsSent?.count > 0
            ? ((emailsOpened?.count / emailsSent?.count) * 100).toFixed(1) + '%'
            : '0%',
      },
      by_status: byStatus,
      recent_leads: recentLeads,
      recent_emails: recentEmails,
      campaign: campaign,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// Health check with database status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
    dbConnected = true;
  } catch (error) {
    console.error('Health check DB error:', error.message);
    dbStatus = 'disconnected';
    dbConnected = false;
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    database: dbStatus,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'MISSING',
    timestamp: new Date().toISOString(),
  });
});

// Start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
