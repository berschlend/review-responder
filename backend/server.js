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
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TwitterApi } = require('twitter-api-v2');

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
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Twitter/X API Client (OAuth 1.0a for posting)
const twitterClient = process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN
  ? new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    })
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

    // Pre-registration drip email tracking
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS pre_registration_drips (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        email_day INTEGER NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, email_day)
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

    // Add public blog columns to blog_articles table
    try {
      await dbQuery(`ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`);
      await dbQuery(
        `ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`
      );
      await dbQuery(`ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`);
      await dbQuery(`ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS category TEXT`);
      await dbQuery(
        `ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER`
      );
      await dbQuery(
        `ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`
      );
      await dbQuery(
        `ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE`
      );
      await dbQuery(
        `ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'ReviewResponder Team'`
      );
      // Index for fast public blog queries
      await dbQuery(
        `CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_articles(is_published, published_at DESC)`
      );
    } catch (error) {
      // Columns might already exist
    }

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

    // Outreach click tracking table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS outreach_clicks (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        campaign TEXT NOT NULL,
        clicked_url TEXT,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT
      )
    `);

    // Add indexes for click tracking
    try {
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_outreach_clicks_email ON outreach_clicks(email)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_outreach_clicks_campaign ON outreach_clicks(campaign)`);
    } catch (error) {
      // Index might already exist
    }

    // Demo generations table for personalized outreach demos
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS demo_generations (
        id SERIAL PRIMARY KEY,
        business_name TEXT NOT NULL,
        google_place_id TEXT,
        google_maps_url TEXT,
        city TEXT,
        google_rating DECIMAL(2,1),
        total_reviews INTEGER,
        scraped_reviews JSONB,
        demo_token TEXT UNIQUE NOT NULL,
        generated_responses JSONB,
        lead_id INTEGER REFERENCES outreach_leads(id),
        email_sent_at TIMESTAMP,
        email_opened_at TIMESTAMP,
        demo_page_viewed_at TIMESTAMP,
        converted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index for fast demo lookups
    try {
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_demo_token ON demo_generations(demo_token)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_demo_lead ON demo_generations(lead_id)`);
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

    // === SALES AUTOMATION TABLES ===

    // Yelp Review Audit Leads
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS yelp_leads (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        yelp_url TEXT,
        city VARCHAR(100),
        category VARCHAR(100),
        total_reviews INTEGER DEFAULT 0,
        owner_responses INTEGER DEFAULT 0,
        response_rate DECIMAL(5,2) DEFAULT 0,
        website VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        email_source VARCHAR(50),
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        email_opened BOOLEAN DEFAULT FALSE,
        replied BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Competitor Leads (G2 negative reviews)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS competitor_leads (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        reviewer_name VARCHAR(255),
        reviewer_title VARCHAR(255),
        competitor VARCHAR(100) NOT NULL,
        star_rating INTEGER,
        review_title TEXT,
        complaint_summary TEXT,
        review_date DATE,
        g2_url TEXT,
        website VARCHAR(255),
        email VARCHAR(255),
        email_source VARCHAR(50),
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        email_opened BOOLEAN DEFAULT FALSE,
        replied BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LinkedIn Outreach Tracking
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS linkedin_outreach (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        company VARCHAR(255),
        location VARCHAR(255),
        linkedin_url TEXT NOT NULL,
        connection_sent BOOLEAN DEFAULT FALSE,
        connection_sent_at TIMESTAMP,
        connection_accepted BOOLEAN DEFAULT FALSE,
        connection_accepted_at TIMESTAMP,
        message_sent BOOLEAN DEFAULT FALSE,
        message_sent_at TIMESTAMP,
        followup_sent BOOLEAN DEFAULT FALSE,
        followup_sent_at TIMESTAMP,
        replied BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agency Partnership Leads (Clutch.co)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS agency_leads (
        id SERIAL PRIMARY KEY,
        agency_name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        clutch_url TEXT,
        clutch_rating DECIMAL(3,2),
        num_reviews INTEGER,
        services TEXT,
        location VARCHAR(255),
        min_project_size VARCHAR(50),
        hourly_rate VARCHAR(50),
        employees VARCHAR(50),
        contact_name VARCHAR(255),
        email VARCHAR(255),
        email_source VARCHAR(50),
        email_sequence INTEGER DEFAULT 0,
        last_email_sent TIMESTAMP,
        email_opened BOOLEAN DEFAULT FALSE,
        replied BOOLEAN DEFAULT FALSE,
        interested BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for sales automation tables
    try {
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_yelp_leads_city ON yelp_leads(city)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_yelp_leads_email_sent ON yelp_leads(email_sent)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_competitor_leads_competitor ON competitor_leads(competitor)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_linkedin_outreach_sent ON linkedin_outreach(connection_sent)`);
      await dbQuery(`CREATE INDEX IF NOT EXISTS idx_agency_leads_sequence ON agency_leads(email_sequence)`);
    } catch (error) {
      // Indexes might already exist
    }

    // Add demo columns to linkedin_outreach for LinkedIn Demo Outreach feature
    try {
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS demo_token TEXT`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS demo_url TEXT`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS connection_note TEXT`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS business_name TEXT`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS google_place_id TEXT`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1)`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS demo_viewed_at TIMESTAMP`);
      await dbQuery(`ALTER TABLE linkedin_outreach ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP`);
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
      // Let Stripe automatically show all payment methods enabled in Dashboard
      // (Card, PayPal, SEPA, Link, Apple Pay, Google Pay)
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

// ============== PUBLIC BLOG ENDPOINTS (No Auth) ==============

// Helper function to generate URL-friendly slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[match] || match)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// GET /api/public/blog - List published articles with pagination
app.get('/api/public/blog', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let whereClause = 'WHERE is_published = TRUE';
    const params = [];

    if (category) {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    const articles = await dbAll(
      `SELECT slug, title, meta_description, category, author_name,
              read_time_minutes, published_at, view_count
       FROM blog_articles
       ${whereClause}
       ORDER BY published_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const totalResult = await dbGet(
      `SELECT COUNT(*) as count FROM blog_articles ${whereClause}`,
      params
    );

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total: parseInt(totalResult.count),
        totalPages: Math.ceil(totalResult.count / limit),
      },
    });
  } catch (error) {
    console.error('Public blog list error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/public/blog/categories - Get all categories with counts
app.get('/api/public/blog/categories', async (req, res) => {
  try {
    const categories = await dbAll(
      `SELECT category, COUNT(*) as count
       FROM blog_articles
       WHERE is_published = TRUE AND category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC`
    );
    res.json({ categories });
  } catch (error) {
    console.error('Blog categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/public/blog/:slug - Get single article by slug
app.get('/api/public/blog/:slug', async (req, res) => {
  try {
    const article = await dbGet(
      `SELECT id, slug, title, content, meta_description, keywords, category,
              author_name, read_time_minutes, published_at, view_count
       FROM blog_articles
       WHERE slug = $1 AND is_published = TRUE`,
      [req.params.slug]
    );

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count (fire and forget)
    dbQuery('UPDATE blog_articles SET view_count = view_count + 1 WHERE id = $1', [
      article.id,
    ]).catch((err) => console.error('View count update error:', err));

    // Get related articles (same category, excluding current)
    const related = await dbAll(
      `SELECT slug, title, meta_description, read_time_minutes, published_at
       FROM blog_articles
       WHERE is_published = TRUE AND id != $1 AND category = $2
       ORDER BY published_at DESC LIMIT 3`,
      [article.id, article.category]
    );

    res.json({ article, related });
  } catch (error) {
    console.error('Public blog article error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// ============== DEMO GENERATOR SYSTEM ==============
// Personalized demos for cold outreach: scrape reviews, generate AI responses

// Helper: Scrape Google reviews via SerpAPI
async function scrapeGoogleReviews(placeId, limit = 10) {
  if (!process.env.SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY not configured');
  }

  const url = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${placeId}&hl=en&api_key=${process.env.SERPAPI_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  return (
    data.reviews?.slice(0, limit).map((r) => ({
      text: r.snippet || r.text || '',
      rating: r.rating || 0,
      author: r.user?.name || 'Anonymous',
      date: r.date || '',
      source: 'google',
    })) || []
  );
}

// Helper: Lookup Google Place ID from business name + city
async function lookupPlaceId(businessName, city) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured');
  }

  const query = encodeURIComponent(`${businessName} ${city}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.candidates?.length) {
    throw new Error(`Place not found: ${businessName} in ${city}`);
  }

  const place = data.candidates[0];
  return {
    placeId: place.place_id,
    name: place.name,
    rating: place.rating,
    totalReviews: place.user_ratings_total,
  };
}

// Helper: Extract place_id from Google Maps URL
function extractPlaceIdFromUrl(url) {
  // Format: https://www.google.com/maps/place/.../@...!1s[PLACE_ID]...
  // or: https://maps.google.com/?cid=...
  const placeIdMatch = url.match(/!1s(ChI[^!]+)/);
  if (placeIdMatch) return placeIdMatch[1];

  // Try data=!4m... format
  const dataMatch = url.match(/place_id[=:]([^&\s]+)/i);
  if (dataMatch) return dataMatch[1];

  return null;
}

// Helper: Generate AI response for a review (for demo purposes)
async function generateDemoResponse(review, businessName) {
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const systemMessage = `You are the owner of "${businessName}". Generate a professional response to this customer review.

RULES:
- Write directly as the owner (first person)
- Be genuine and human, not corporate
- Keep it 2-3 sentences max
- If negative: acknowledge, take responsibility, offer to make it right
- If positive: thank them specifically, mention what made it special
- NO: "Thank you for your feedback" | "We value your input" | "Sorry for any inconvenience"
- NO emojis unless they used them first
- End with your name or just a warm sign-off`;

  const userMessage = `[${review.rating} stars from ${review.author}]
"${review.text}"

Write a response:`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemMessage,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].text.trim();
}

// Helper: Generate demo token
function generateDemoToken() {
  return crypto.randomBytes(16).toString('hex');
}

// POST /api/demo/generate - Generate a personalized demo for a business
app.post('/api/demo/generate', async (req, res) => {
  // Admin auth check
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey || '', process.env.ADMIN_SECRET || '')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { google_maps_url, business_name, city, review_count = 3, focus = 'negative', send_email = false, email } = req.body;

    // Resolve place_id
    let placeId = null;
    let resolvedName = business_name;
    let googleRating = null;
    let totalReviews = null;

    if (google_maps_url) {
      placeId = extractPlaceIdFromUrl(google_maps_url);
      if (!placeId && business_name && city) {
        // URL didn't contain place_id, try lookup
        const placeInfo = await lookupPlaceId(business_name, city);
        placeId = placeInfo.placeId;
        resolvedName = placeInfo.name;
        googleRating = placeInfo.rating;
        totalReviews = placeInfo.totalReviews;
      }
    } else if (business_name && city) {
      const placeInfo = await lookupPlaceId(business_name, city);
      placeId = placeInfo.placeId;
      resolvedName = placeInfo.name;
      googleRating = placeInfo.rating;
      totalReviews = placeInfo.totalReviews;
    }

    if (!placeId) {
      return res.status(400).json({
        error: 'Could not find business. Provide google_maps_url or business_name + city',
      });
    }

    // Scrape reviews
    const allReviews = await scrapeGoogleReviews(placeId, 20);

    if (allReviews.length === 0) {
      return res.status(404).json({ error: 'No reviews found for this business' });
    }

    // Filter reviews based on focus
    let targetReviews = allReviews;
    if (focus === 'negative') {
      targetReviews = allReviews
        .filter((r) => r.rating <= 3)
        .sort((a, b) => a.rating - b.rating)
        .slice(0, review_count);

      // If not enough negative reviews, add some mixed
      if (targetReviews.length < review_count) {
        const remaining = allReviews
          .filter((r) => r.rating === 4)
          .slice(0, review_count - targetReviews.length);
        targetReviews = [...targetReviews, ...remaining];
      }
    } else if (focus === 'mixed') {
      // Mix of ratings
      const negative = allReviews.filter((r) => r.rating <= 2).slice(0, 1);
      const neutral = allReviews.filter((r) => r.rating === 3).slice(0, 1);
      const positive = allReviews.filter((r) => r.rating >= 4).slice(0, 1);
      targetReviews = [...negative, ...neutral, ...positive].slice(0, review_count);
    } else {
      targetReviews = allReviews.slice(0, review_count);
    }

    // Generate AI responses for each review
    const demos = [];
    for (const review of targetReviews) {
      const aiResponse = await generateDemoResponse(review, resolvedName);
      demos.push({
        review: {
          text: review.text,
          rating: review.rating,
          author: review.author,
          date: review.date,
        },
        ai_response: aiResponse,
      });
    }

    // Generate unique token
    const demoToken = generateDemoToken();

    // Save to database
    await dbQuery(
      `INSERT INTO demo_generations
       (business_name, google_place_id, google_maps_url, city, google_rating, total_reviews, scraped_reviews, demo_token, generated_responses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        resolvedName,
        placeId,
        google_maps_url || null,
        city || null,
        googleRating,
        totalReviews,
        JSON.stringify(allReviews),
        demoToken,
        JSON.stringify(demos),
      ]
    );

    // Optionally send email
    let emailSent = false;
    if (send_email && email) {
      try {
        await sendDemoEmail(email, resolvedName, demos, demoToken, totalReviews);
        await dbQuery('UPDATE demo_generations SET email_sent_at = NOW() WHERE demo_token = $1', [demoToken]);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send demo email:', emailError);
      }
    }

    res.json({
      success: true,
      demo_token: demoToken,
      demo_url: `https://tryreviewresponder.com/demo/${demoToken}`,
      business: {
        name: resolvedName,
        rating: googleRating,
        total_reviews: totalReviews,
      },
      reviews_processed: demos.length,
      generated_responses: demos,
      email_sent: emailSent,
    });
  } catch (error) {
    console.error('Demo generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/public/demo/:token - Public demo page data
app.get('/api/public/demo/:token', async (req, res) => {
  try {
    const demo = await dbGet('SELECT * FROM demo_generations WHERE demo_token = $1', [req.params.token]);

    if (!demo) {
      return res.status(404).json({ error: 'Demo not found' });
    }

    // Track page view (only first view)
    if (!demo.demo_page_viewed_at) {
      await dbQuery('UPDATE demo_generations SET demo_page_viewed_at = NOW() WHERE id = $1', [demo.id]);
    }

    res.json({
      business_name: demo.business_name,
      city: demo.city,
      google_rating: parseFloat(demo.google_rating) || null,
      total_reviews: demo.total_reviews,
      demos: demo.generated_responses,
      cta_url: `https://tryreviewresponder.com/register?ref=demo_${demo.demo_token}`,
    });
  } catch (error) {
    console.error('Public demo error:', error);
    res.status(500).json({ error: 'Failed to load demo' });
  }
});

// POST /api/public/demo/:token/convert - Track conversion (called when user signs up)
app.post('/api/public/demo/:token/convert', async (req, res) => {
  try {
    await dbQuery(
      'UPDATE demo_generations SET converted_at = NOW() WHERE demo_token = $1 AND converted_at IS NULL',
      [req.params.token]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// Helper: Send demo email
async function sendDemoEmail(toEmail, businessName, demos, demoToken, totalReviews) {
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // Build demo content for email
  let demoContent = '';
  demos.forEach((demo, i) => {
    const stars = '★'.repeat(demo.review.rating) + '☆'.repeat(5 - demo.review.rating);
    demoContent += `
-------------------------------------------
[${stars} from ${demo.review.author}]
"${demo.review.text.slice(0, 200)}${demo.review.text.length > 200 ? '...' : ''}"

YOUR AI RESPONSE:
"${demo.ai_response}"
-------------------------------------------
`;
  });

  const subject = `${businessName} - saw your reviews, made you something`;
  const body = `Hi,

I saw you have ${totalReviews || 'many'}+ Google reviews - nice work!

I noticed a few that might benefit from a response, so I put together some AI-generated suggestions:

${demoContent}

These took me 10 seconds each to generate. If you want to try it yourself:
https://tryreviewresponder.com/demo/${demoToken}

Cheers,
Berend
Founder, ReviewResponder

P.S. Just reply if you have any questions - I read every email.

---
Unsubscribe: https://tryreviewresponder.com/unsubscribe?email=${encodeURIComponent(toEmail)}`;

  await resend.emails.send({
    from: 'Berend from ReviewResponder <hello@tryreviewresponder.com>',
    to: toEmail,
    subject: subject,
    text: body,
  });
}

// POST /api/cron/generate-demos - Batch generate demos for leads
app.post('/api/cron/generate-demos', async (req, res) => {
  const cronSecret = req.query.secret || req.headers['x-cron-secret'];
  if (!safeCompare(cronSecret || '', process.env.CRON_SECRET || '')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const sendEmails = req.query.send_emails === 'true';

    // Find leads with email but no demo yet
    const leads = await dbAll(
      `SELECT ol.* FROM outreach_leads ol
       LEFT JOIN demo_generations dg ON ol.id = dg.lead_id
       WHERE ol.email IS NOT NULL
       AND ol.email != ''
       AND dg.id IS NULL
       AND ol.google_reviews_count >= 20
       ORDER BY ol.google_reviews_count DESC
       LIMIT $1`,
      [limit]
    );

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      demos: [],
    };

    for (const lead of leads) {
      results.processed++;
      try {
        // Generate demo
        const placeInfo = await lookupPlaceId(lead.business_name, lead.city);
        const allReviews = await scrapeGoogleReviews(placeInfo.placeId, 20);

        // Get worst reviews
        const targetReviews = allReviews
          .filter((r) => r.rating <= 3)
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 3);

        if (targetReviews.length === 0) {
          console.log(`No negative reviews for ${lead.business_name}, skipping`);
          continue;
        }

        // Generate AI responses
        const demos = [];
        for (const review of targetReviews) {
          const aiResponse = await generateDemoResponse(review, lead.business_name);
          demos.push({
            review: { text: review.text, rating: review.rating, author: review.author, date: review.date },
            ai_response: aiResponse,
          });
        }

        const demoToken = generateDemoToken();

        // Save demo
        await dbQuery(
          `INSERT INTO demo_generations
           (business_name, google_place_id, city, google_rating, total_reviews, scraped_reviews, demo_token, generated_responses, lead_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            lead.business_name,
            placeInfo.placeId,
            lead.city,
            placeInfo.rating,
            placeInfo.totalReviews,
            JSON.stringify(allReviews),
            demoToken,
            JSON.stringify(demos),
            lead.id,
          ]
        );

        // Send email if requested
        if (sendEmails && lead.email) {
          try {
            await sendDemoEmail(lead.email, lead.business_name, demos, demoToken, placeInfo.totalReviews);
            await dbQuery('UPDATE demo_generations SET email_sent_at = NOW() WHERE demo_token = $1', [demoToken]);
          } catch (emailError) {
            console.error(`Email failed for ${lead.email}:`, emailError.message);
          }
        }

        results.success++;
        results.demos.push({
          business: lead.business_name,
          demo_url: `https://tryreviewresponder.com/demo/${demoToken}`,
          reviews_count: demos.length,
        });

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (error) {
        results.failed++;
        console.error(`Demo generation failed for ${lead.business_name}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.success} demos from ${results.processed} leads`,
      ...results,
    });
  } catch (error) {
    console.error('Batch demo generation error:', error);
    res.status(500).json({ error: error.message.slice(0, 100) });
  }
});

// GET /api/admin/demos - List all generated demos
app.get('/api/admin/demos', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey || '', process.env.ADMIN_SECRET || '')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const demos = await dbAll(
      `SELECT id, business_name, city, google_rating, total_reviews, demo_token,
              email_sent_at, demo_page_viewed_at, converted_at, created_at,
              (SELECT COUNT(*) FROM jsonb_array_elements(generated_responses)) as response_count
       FROM demo_generations
       ORDER BY created_at DESC
       LIMIT 100`
    );

    const stats = await dbGet(
      `SELECT
         COUNT(*) as total,
         COUNT(email_sent_at) as emails_sent,
         COUNT(demo_page_viewed_at) as pages_viewed,
         COUNT(converted_at) as conversions
       FROM demo_generations`
    );

    res.json({ demos, stats });
  } catch (error) {
    console.error('Admin demos error:', error);
    res.status(500).json({ error: 'Failed to fetch demos' });
  }
});

// GET /sitemap-blog.xml - Dynamic sitemap for blog articles
app.get('/sitemap-blog.xml', async (req, res) => {
  try {
    const articles = await dbAll(
      `SELECT slug, published_at
       FROM blog_articles
       WHERE is_published = TRUE
       ORDER BY published_at DESC`
    );

    const baseUrl = 'https://tryreviewresponder.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Main blog page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/blog</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // Individual articles
    for (const article of articles) {
      const lastmod = article.published_at;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/blog/${article.slug}</loc>\n`;
      if (lastmod) {
        xml += `    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Blog sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ============== ADMIN BLOG MANAGEMENT ==============

// GET /api/admin/blog - List all articles (published and unpublished)
app.get('/api/admin/blog', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key || '', process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const articles = await dbAll(
      `SELECT id, slug, title, meta_description, category, is_published,
              published_at, created_at, is_auto_generated, view_count, word_count
       FROM blog_articles
       ORDER BY created_at DESC`
    );
    res.json({ articles });
  } catch (error) {
    console.error('Admin blog list error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// PUT /api/admin/blog/:id/publish - Publish/unpublish article
app.put('/api/admin/blog/:id/publish', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key || '', process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { is_published, category, author_name } = req.body;
  const { id } = req.params;

  try {
    // Get article to generate slug if needed
    const article = await dbGet('SELECT title, slug, content FROM blog_articles WHERE id = $1', [
      id,
    ]);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const slug = article.slug || generateSlug(article.title);
    const published_at = is_published ? new Date() : null;

    // Calculate read time (avg 200 words per minute)
    const wordCount = article.content.split(/\s+/).length;
    const read_time_minutes = Math.ceil(wordCount / 200);

    await dbQuery(
      `UPDATE blog_articles
       SET is_published = $1, published_at = COALESCE(published_at, $2),
           slug = $3, category = COALESCE($4, category),
           author_name = COALESCE($5, author_name), read_time_minutes = $6
       WHERE id = $7`,
      [is_published, published_at, slug, category, author_name, read_time_minutes, id]
    );

    res.json({ success: true, slug });
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// PUT /api/admin/blog/:id - Edit article content
app.put('/api/admin/blog/:id', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key || '', process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, content, meta_description, keywords, category } = req.body;
  const { id } = req.params;

  try {
    const newSlug = title ? generateSlug(title) : null;

    await dbQuery(
      `UPDATE blog_articles
       SET title = COALESCE($1, title), content = COALESCE($2, content),
           meta_description = COALESCE($3, meta_description),
           keywords = COALESCE($4, keywords), category = COALESCE($5, category),
           slug = COALESCE($6, slug)
       WHERE id = $7`,
      [title, content, meta_description, keywords, category, newSlug, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Edit article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// DELETE /api/admin/blog/:id - Delete article (admin)
app.delete('/api/admin/blog/:id', async (req, res) => {
  const { key } = req.query;
  if (!process.env.ADMIN_SECRET || !safeCompare(key || '', process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbQuery('DELETE FROM blog_articles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
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
    // Minimal response for cron-job.org (has strict size limit)
    res.status(500).json({ ok: false, error: error.message?.slice(0, 100) });
  }
});

// Pre-Registration Drip Email Campaign - Nurture captured emails who haven't registered
// Call this endpoint via cron job (e.g., daily at 10am)
app.post('/api/cron/send-pre-registration-drips', async (req, res) => {
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

  const DRIP_SCHEDULE = [1, 3, 7, 14]; // Days after email capture
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';

  // Email templates for pre-registration nurturing
  const getPreRegistrationEmail = (day, email, discountCode) => {
    const templates = {
      1: {
        subject: 'Your 50% discount expires soon',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .discount-box { background: #FEF3C7; border: 2px dashed #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .discount-code { font-size: 28px; font-weight: bold; color: #D97706; letter-spacing: 2px; }
              .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Don't Miss Your 50% Discount!</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>

                <p>You showed interest in ReviewResponder yesterday. Just a quick reminder that your exclusive discount code is waiting:</p>

                <div class="discount-box">
                  <p style="margin: 0 0 10px 0; color: #92400E;">Your Exclusive Code:</p>
                  <div class="discount-code">${discountCode}</div>
                  <p style="margin: 10px 0 0 0; color: #92400E; font-size: 14px;">50% off your first month</p>
                </div>

                <p>With ReviewResponder, you can:</p>
                <ul>
                  <li>Respond to reviews in seconds, not minutes</li>
                  <li>Sound professional without the effort</li>
                  <li>Boost your local SEO with consistent engagement</li>
                </ul>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/register" class="cta-button">Claim Your 50% Discount</a>
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
      3: {
        subject: 'Why ignoring reviews costs you customers',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .stat-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 16px 0; }
              .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>The Hidden Cost of Unanswered Reviews</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>

                <p>Did you know that ignoring reviews could be silently hurting your business?</p>

                <div class="stat-box">
                  <strong>53% of customers</strong> expect businesses to respond to negative reviews within a week. Only 37% of reviews ever get a response.
                </div>

                <div class="stat-box">
                  <strong>Businesses that respond</strong> to reviews see 12% higher revenue growth than those that don't.
                </div>

                <div class="stat-box">
                  <strong>89% of consumers</strong> read business responses to reviews before making a purchase decision.
                </div>

                <p>The problem? Responding to reviews takes time. Crafting the perfect response to a negative review can take 15-20 minutes.</p>

                <p><strong>ReviewResponder solves this.</strong> Get professional, personalized responses in seconds - not minutes.</p>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/register" class="cta-button">Try 20 Free Responses</a>
                </center>

                <p>Your discount code <strong>${discountCode}</strong> is still valid!</p>

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
      7: {
        subject: 'How Mario saved 5 hours/week on reviews',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .testimonial { background: #F0FDF4; border: 1px solid #10B981; padding: 24px; border-radius: 8px; margin: 20px 0; font-style: italic; }
              .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Real Results from Real Businesses</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>

                <p>Meet Mario, owner of a busy Italian restaurant in Munich with 200+ Google reviews.</p>

                <div class="testimonial">
                  "I used to spend Sunday evenings responding to the week's reviews. Now I do it in 10 minutes during my morning coffee. ReviewResponder doesn't just save time - it helped me sound more professional too. My responses went from 'Thanks!' to actually addressing what customers said."
                  <p style="margin: 16px 0 0 0; font-style: normal;"><strong>- Mario T., Restaurant Owner</strong></p>
                </div>

                <p><strong>Mario's results after 3 months:</strong></p>
                <ul>
                  <li>5+ hours saved per week</li>
                  <li>100% response rate (up from 30%)</li>
                  <li>4.2 to 4.6 star rating improvement</li>
                </ul>

                <p>You could see similar results. And with your discount code <strong>${discountCode}</strong>, you can start for just $14.50/month.</p>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/register" class="cta-button">Start Your Free Trial</a>
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
      14: {
        subject: 'Last chance: Your exclusive offer expires tomorrow',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .urgency-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .cta-button { display: inline-block; background: #7C3AED; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Final Reminder</h1>
                <p>Your 50% discount expires tomorrow</p>
              </div>
              <div class="content">
                <p>Hi there!</p>

                <p>This is my last email about this - I promise!</p>

                <p>Two weeks ago, you showed interest in ReviewResponder. Since then, your competitors have probably responded to dozens of reviews while building their reputation.</p>

                <div class="urgency-box">
                  <p style="margin: 0; font-size: 18px;"><strong>Your code ${discountCode} expires tomorrow.</strong></p>
                  <p style="margin: 8px 0 0 0; color: #92400E;">After that, you'll pay full price.</p>
                </div>

                <p><strong>Quick recap of what you get:</strong></p>
                <ul>
                  <li>20 free responses to try (no credit card)</li>
                  <li>AI-powered professional responses in seconds</li>
                  <li>Works with Google, Yelp, TripAdvisor & more</li>
                  <li>Chrome extension for one-click responses</li>
                </ul>

                <center style="margin: 30px 0;">
                  <a href="${FRONTEND_URL}/register" class="cta-button">Use Your 50% Discount Now</a>
                </center>

                <p>If you have any questions, just reply to this email. I read every response.</p>

                <p>Best,<br>The ReviewResponder Team</p>
              </div>
              <div class="footer">
                <p>ReviewResponder - AI-Powered Review Responses</p>
                <p style="font-size: 12px; color: #9CA3AF;">This is the last email in this series. You won't receive more promotional emails from us.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    };
    return templates[day];
  };

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Process each drip day
    for (const day of DRIP_SCHEDULE) {
      // Get captured emails that:
      // 1. Were captured X days ago (based on drip schedule)
      // 2. Haven't received this drip email yet
      // 3. Haven't converted (registered)
      const eligibleEmails = await dbAll(`
        SELECT ec.* FROM email_captures ec
        WHERE ec.converted = FALSE
          AND DATE(ec.created_at) = DATE(NOW() - INTERVAL '${day} days')
          AND NOT EXISTS (
            SELECT 1 FROM pre_registration_drips prd
            WHERE LOWER(prd.email) = LOWER(ec.email)
            AND prd.email_day = $1
          )
      `, [day]);

      for (const capture of eligibleEmails) {
        // Check if user has registered (email exists in users table)
        const existingUser = await dbGet(
          'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
          [capture.email]
        );

        if (existingUser) {
          // User registered! Mark as converted and skip
          await dbQuery(
            'UPDATE email_captures SET converted = TRUE WHERE id = $1',
            [capture.id]
          );
          skippedCount++;
          console.log(`⏭️ Pre-reg drip skipped (user registered): ${capture.email}`);
          continue;
        }

        const emailContent = getPreRegistrationEmail(day, capture.email, capture.discount_code);
        if (!emailContent) continue;

        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            replyTo: 'hello@tryreviewresponder.com',
            to: capture.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });

          // Track that we sent this email
          await dbQuery(
            'INSERT INTO pre_registration_drips (email, email_day) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [capture.email.toLowerCase(), day]
          );

          sentCount++;
          console.log(`📧 Pre-reg drip day ${day} sent to ${capture.email}`);
        } catch (emailError) {
          console.error(`Failed to send pre-reg drip to ${capture.email}:`, emailError.message);
          errorCount++;
        }
      }
    }

    res.json({ ok: true, sent: sentCount, skipped: skippedCount, err: errorCount });
  } catch (error) {
    console.error('Pre-registration drip error:', error);
    res.status(500).json({ ok: false, error: error.message?.slice(0, 100) });
  }
});

// Test endpoint: Send a specific pre-registration drip email
// GET /api/admin/test-pre-reg-drip?email=test@example.com&day=1&key=ADMIN_SECRET
app.get('/api/admin/test-pre-reg-drip', async (req, res) => {
  const { email, day, key } = req.query;

  if (!safeCompare(key, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!email || !day) {
    return res.status(400).json({ error: 'email and day parameters required' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tryreviewresponder.com';
  const discountCode = 'EARLY50';
  const dayNum = parseInt(day);

  const templates = {
    1: {
      subject: 'Your 50% discount expires soon',
      html: `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:white;padding:40px;text-align:center;border-radius:8px 8px 0 0}.content{background:white;padding:40px;border:1px solid #E5E7EB;border-radius:0 0 8px 8px}.discount-box{background:#FEF3C7;border:2px dashed #F59E0B;padding:20px;border-radius:8px;margin:20px 0;text-align:center}.discount-code{font-size:28px;font-weight:bold;color:#D97706;letter-spacing:2px}.cta-button{display:inline-block;background:#4F46E5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600}.footer{text-align:center;padding:20px;color:#6B7280;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>Don't Miss Your 50% Discount!</h1></div><div class="content"><p>Hi there!</p><p>You showed interest in ReviewResponder yesterday. Just a quick reminder that your exclusive discount code is waiting:</p><div class="discount-box"><p style="margin:0 0 10px 0;color:#92400E">Your Exclusive Code:</p><div class="discount-code">${discountCode}</div><p style="margin:10px 0 0 0;color:#92400E;font-size:14px">50% off your first month</p></div><p>With ReviewResponder, you can:</p><ul><li>Respond to reviews in seconds, not minutes</li><li>Sound professional without the effort</li><li>Boost your local SEO with consistent engagement</li></ul><center style="margin:30px 0"><a href="${FRONTEND_URL}/register" class="cta-button">Claim Your 50% Discount</a></center><p>Questions? Just reply to this email!</p><p>Best,<br>The ReviewResponder Team</p></div><div class="footer"><p>ReviewResponder - AI-Powered Review Responses</p></div></div></body></html>`,
    },
    3: {
      subject: 'Why ignoring reviews costs you customers',
      html: `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#DC2626 0%,#B91C1C 100%);color:white;padding:40px;text-align:center;border-radius:8px 8px 0 0}.content{background:white;padding:40px;border:1px solid #E5E7EB;border-radius:0 0 8px 8px}.stat-box{background:#FEF2F2;border-left:4px solid #DC2626;padding:16px;margin:16px 0}.cta-button{display:inline-block;background:#4F46E5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600}.footer{text-align:center;padding:20px;color:#6B7280;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>The Hidden Cost of Unanswered Reviews</h1></div><div class="content"><p>Hi there!</p><p>Did you know that ignoring reviews could be silently hurting your business?</p><div class="stat-box"><strong>53% of customers</strong> expect businesses to respond to negative reviews within a week.</div><div class="stat-box"><strong>Businesses that respond</strong> to reviews see 12% higher revenue growth.</div><div class="stat-box"><strong>89% of consumers</strong> read business responses before making a purchase decision.</div><p>The problem? Responding to reviews takes time. Crafting the perfect response can take 15-20 minutes.</p><p><strong>ReviewResponder solves this.</strong> Get professional responses in seconds.</p><center style="margin:30px 0"><a href="${FRONTEND_URL}/register" class="cta-button">Try 20 Free Responses</a></center><p>Your discount code <strong>${discountCode}</strong> is still valid!</p><p>Best,<br>The ReviewResponder Team</p></div><div class="footer"><p>ReviewResponder - AI-Powered Review Responses</p></div></div></body></html>`,
    },
    7: {
      subject: 'How Mario saved 5 hours/week on reviews',
      html: `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#10B981 0%,#059669 100%);color:white;padding:40px;text-align:center;border-radius:8px 8px 0 0}.content{background:white;padding:40px;border:1px solid #E5E7EB;border-radius:0 0 8px 8px}.testimonial{background:#F0FDF4;border:1px solid #10B981;padding:24px;border-radius:8px;margin:20px 0;font-style:italic}.cta-button{display:inline-block;background:#4F46E5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600}.footer{text-align:center;padding:20px;color:#6B7280;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>Real Results from Real Businesses</h1></div><div class="content"><p>Hi there!</p><p>Meet Mario, owner of a busy Italian restaurant in Munich with 200+ Google reviews.</p><div class="testimonial">"I used to spend Sunday evenings responding to the week's reviews. Now I do it in 10 minutes during my morning coffee. ReviewResponder doesn't just save time - it helped me sound more professional too."<p style="margin:16px 0 0 0;font-style:normal"><strong>- Mario T., Restaurant Owner</strong></p></div><p><strong>Mario's results after 3 months:</strong></p><ul><li>5+ hours saved per week</li><li>100% response rate (up from 30%)</li><li>4.2 to 4.6 star rating improvement</li></ul><p>With your discount code <strong>${discountCode}</strong>, you can start for just $14.50/month.</p><center style="margin:30px 0"><a href="${FRONTEND_URL}/register" class="cta-button">Start Your Free Trial</a></center><p>Best,<br>The ReviewResponder Team</p></div><div class="footer"><p>ReviewResponder - AI-Powered Review Responses</p></div></div></body></html>`,
    },
    14: {
      subject: 'Last chance: Your exclusive offer expires tomorrow',
      html: `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);color:white;padding:40px;text-align:center;border-radius:8px 8px 0 0}.content{background:white;padding:40px;border:1px solid #E5E7EB;border-radius:0 0 8px 8px}.urgency-box{background:#FEF3C7;border:2px solid #F59E0B;padding:20px;border-radius:8px;margin:20px 0;text-align:center}.cta-button{display:inline-block;background:#7C3AED;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600}.footer{text-align:center;padding:20px;color:#6B7280;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>Final Reminder</h1><p>Your 50% discount expires tomorrow</p></div><div class="content"><p>Hi there!</p><p>This is my last email about this - I promise!</p><p>Two weeks ago, you showed interest in ReviewResponder. Since then, your competitors have probably responded to dozens of reviews.</p><div class="urgency-box"><p style="margin:0;font-size:18px"><strong>Your code ${discountCode} expires tomorrow.</strong></p><p style="margin:8px 0 0 0;color:#92400E">After that, you'll pay full price.</p></div><p><strong>Quick recap:</strong></p><ul><li>20 free responses to try (no credit card)</li><li>AI-powered professional responses in seconds</li><li>Works with Google, Yelp, TripAdvisor & more</li><li>Chrome extension for one-click responses</li></ul><center style="margin:30px 0"><a href="${FRONTEND_URL}/register" class="cta-button">Use Your 50% Discount Now</a></center><p>Best,<br>The ReviewResponder Team</p></div><div class="footer"><p>ReviewResponder - AI-Powered Review Responses</p><p style="font-size:12px;color:#9CA3AF">This is the last email in this series.</p></div></div></body></html>`,
    },
  };

  const template = templates[dayNum];
  if (!template) {
    return res.status(400).json({ error: 'Invalid day. Use 1, 3, 7, or 14' });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: 'hello@tryreviewresponder.com',
      to: email,
      subject: `[TEST] ${template.subject}`,
      html: template.html,
    });

    console.log(`🧪 Test pre-reg drip day ${dayNum} sent to ${email}`);
    res.json({ success: true, message: `Test email day ${dayNum} sent to ${email}` });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
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
    // Exclude test/fake emails from stats (admin's own accounts + obvious fakes)
    const excludeEmailsClause = `
      AND email NOT LIKE '%@web.de'
      AND email NOT LIKE 'test%'
      AND email NOT LIKE '%test@%'
      AND email NOT LIKE 'asdf%'
      AND email NOT LIKE 'qwer%'
      AND email NOT LIKE 'asd@%'
      AND email NOT LIKE '%@test.%'
      AND email NOT LIKE '%@example.%'
      AND email NOT LIKE 'admin@%'
      AND email NOT LIKE '%fake%'
      AND email NOT LIKE 'a@%'
      AND email NOT LIKE 'aa@%'
      AND email NOT LIKE 'aaa@%'
    `;

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
        WHERE 1=1 ${excludeEmailsClause}
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

// GET /api/admin/sales-dashboard - Comprehensive sales dashboard data
app.get('/api/admin/sales-dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Exclude test emails pattern
    const excludeEmailsClause = `
      AND email NOT LIKE '%@web.de'
      AND email NOT LIKE 'test%'
      AND email NOT LIKE '%test@%'
      AND email NOT LIKE 'asdf%'
      AND email NOT LIKE 'qwer%'
      AND email NOT LIKE 'asd@%'
      AND email NOT LIKE '%@test.%'
      AND email NOT LIKE '%@example.%'
      AND email NOT LIKE 'admin@%'
      AND email NOT LIKE '%fake%'
      AND email NOT LIKE 'a@%'
      AND email NOT LIKE 'aa@%'
      AND email NOT LIKE 'aaa@%'
    `;

    // ========== REVENUE METRICS ==========
    // MRR calculation: Starter $29, Pro $49, Unlimited $99
    const planPrices = { starter: 29, pro: 49, unlimited: 99 };
    const planCounts = await dbAll(`
      SELECT subscription_plan, COUNT(*) as count
      FROM users
      WHERE 1=1 ${excludeEmailsClause}
      GROUP BY subscription_plan
    `);

    let mrr = 0;
    const planBreakdown = {};
    for (const p of planCounts) {
      planBreakdown[p.subscription_plan] = parseInt(p.count);
      if (planPrices[p.subscription_plan]) {
        mrr += planPrices[p.subscription_plan] * parseInt(p.count);
      }
    }

    // ========== USER METRICS ==========
    const userMetrics = await dbGet(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE subscription_plan != 'free') as paying_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
      WHERE 1=1 ${excludeEmailsClause}
    `);

    // ========== ACTIVITY METRICS ==========
    // Active users (generated response in last 7 days)
    let activityMetrics = { active_7d: 0, active_30d: 0, total_responses: 0, responses_today: 0, responses_week: 0 };
    try {
      activityMetrics = await dbGet(`
        SELECT
          COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as active_7d,
          COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as active_30d,
          COUNT(*) as total_responses,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as responses_today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as responses_week
        FROM responses
      `) || activityMetrics;
    } catch (e) {
      console.error('Activity query error:', e.message);
    }

    // ========== FUNNEL METRICS ==========
    // Users who have generated at least 1 response (activated)
    let activatedCount = 0;
    try {
      const activated = await dbGet(`
        SELECT COUNT(DISTINCT r.user_id) as count
        FROM responses r
        JOIN users u ON r.user_id = u.id
        WHERE 1=1 ${excludeEmailsClause.replace(/email/g, 'u.email')}
      `);
      activatedCount = parseInt(activated?.count || 0);
    } catch (e) {
      console.error('Activated query error:', e.message);
    }

    // ========== RECENT SIGNUPS ==========
    const recentSignups = await dbAll(`
      SELECT id, email, subscription_plan, created_at, email_verified, stripe_customer_id
      FROM users
      WHERE 1=1 ${excludeEmailsClause}
      ORDER BY created_at DESC
      LIMIT 15
    `);

    // ========== USER ACTIVITY DETAILS ==========
    // Power users (most responses)
    let powerUsers = [];
    try {
      powerUsers = await dbAll(`
        SELECT u.email, u.subscription_plan, COUNT(r.id) as response_count, MAX(r.created_at) as last_activity
        FROM users u
        LEFT JOIN responses r ON u.id = r.user_id
        WHERE 1=1 ${excludeEmailsClause.replace(/email/g, 'u.email')}
        GROUP BY u.id, u.email, u.subscription_plan
        HAVING COUNT(r.id) > 0
        ORDER BY response_count DESC
        LIMIT 10
      `);
    } catch (e) {
      console.error('Power users query error:', e.message);
    }

    // Users near their plan limit (upgrade candidates)
    let upgradeOpportunities = [];
    try {
      const limits = { free: 20, starter: 300, pro: 800 };
      upgradeOpportunities = await dbAll(`
        SELECT u.email, u.subscription_plan, u.monthly_response_count, u.smart_response_count
        FROM users u
        WHERE u.subscription_plan IN ('free', 'starter', 'pro')
        AND u.monthly_response_count >= 15
        ${excludeEmailsClause.replace(/email/g, 'u.email')}
        ORDER BY u.monthly_response_count DESC
        LIMIT 10
      `);
      // Add percentage to limit
      upgradeOpportunities = upgradeOpportunities.map(u => ({
        ...u,
        limit: limits[u.subscription_plan] || 20,
        usage_percent: Math.round((u.monthly_response_count / (limits[u.subscription_plan] || 20)) * 100)
      }));
    } catch (e) {
      console.error('Upgrade opportunities query error:', e.message);
    }

    // Inactive paying users (churn risk) - paid but no activity in 14+ days
    let churnRisk = [];
    try {
      churnRisk = await dbAll(`
        SELECT u.email, u.subscription_plan, u.created_at,
               MAX(r.created_at) as last_activity
        FROM users u
        LEFT JOIN responses r ON u.id = r.user_id
        WHERE u.subscription_plan != 'free'
        ${excludeEmailsClause.replace(/email/g, 'u.email')}
        GROUP BY u.id, u.email, u.subscription_plan, u.created_at
        HAVING MAX(r.created_at) IS NULL OR MAX(r.created_at) < NOW() - INTERVAL '14 days'
        ORDER BY MAX(r.created_at) DESC NULLS LAST
        LIMIT 10
      `);
    } catch (e) {
      console.error('Churn risk query error:', e.message);
    }

    // High-activity free users (upgrade candidates)
    let freeUpgradeCandidates = [];
    try {
      freeUpgradeCandidates = await dbAll(`
        SELECT u.email, u.monthly_response_count, MAX(r.created_at) as last_activity
        FROM users u
        LEFT JOIN responses r ON u.id = r.user_id
        WHERE u.subscription_plan = 'free'
        AND u.monthly_response_count >= 10
        ${excludeEmailsClause.replace(/email/g, 'u.email')}
        GROUP BY u.id, u.email, u.monthly_response_count
        ORDER BY u.monthly_response_count DESC
        LIMIT 10
      `);
    } catch (e) {
      console.error('Free upgrade candidates query error:', e.message);
    }

    // ========== BLOG STATS ==========
    let blogStats = { total_articles: 0, published: 0 };
    try {
      blogStats = await dbGet(`
        SELECT COUNT(*) as total_articles,
               COUNT(*) FILTER (WHERE published = true) as published
        FROM blog_articles
      `) || blogStats;
    } catch (e) {
      console.error('Blog stats query error:', e.message);
    }

    // ========== EMAIL VERIFICATION STATS ==========
    let emailStats = { total_tokens: 0, verified: 0 };
    try {
      emailStats = await dbGet(`
        SELECT
          (SELECT COUNT(*) FROM email_verification_tokens) as total_tokens,
          (SELECT COUNT(*) FROM users WHERE email_verified = true ${excludeEmailsClause}) as verified
      `) || emailStats;
    } catch (e) {
      console.error('Email stats query error:', e.message);
    }

    // ========== DAILY REGISTRATIONS (last 14 days) ==========
    let dailySignups = [];
    try {
      dailySignups = await dbAll(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at > NOW() - INTERVAL '14 days'
        ${excludeEmailsClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
    } catch (e) {
      console.error('Daily signups query error:', e.message);
    }

    // ========== RESPONSE TREND (last 14 days) ==========
    let dailyResponses = [];
    try {
      dailyResponses = await dbAll(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM responses
        WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
    } catch (e) {
      console.error('Daily responses query error:', e.message);
    }

    res.json({
      revenue: {
        mrr,
        arr: mrr * 12,
        planBreakdown,
        avgRevenuePerUser: userMetrics.paying_users > 0 ? (mrr / parseInt(userMetrics.paying_users)).toFixed(2) : 0
      },
      users: {
        total: parseInt(userMetrics.total_users) || 0,
        paying: parseInt(userMetrics.paying_users) || 0,
        free: (parseInt(userMetrics.total_users) || 0) - (parseInt(userMetrics.paying_users) || 0),
        newToday: parseInt(userMetrics.new_today) || 0,
        newThisWeek: parseInt(userMetrics.new_this_week) || 0,
        newThisMonth: parseInt(userMetrics.new_this_month) || 0,
        verified: parseInt(userMetrics.verified_users) || 0,
        verificationRate: userMetrics.total_users > 0
          ? ((parseInt(userMetrics.verified_users) / parseInt(userMetrics.total_users)) * 100).toFixed(1)
          : 0
      },
      activity: {
        activeUsers7d: parseInt(activityMetrics.active_7d) || 0,
        activeUsers30d: parseInt(activityMetrics.active_30d) || 0,
        totalResponses: parseInt(activityMetrics.total_responses) || 0,
        responsesToday: parseInt(activityMetrics.responses_today) || 0,
        responsesThisWeek: parseInt(activityMetrics.responses_week) || 0
      },
      funnel: {
        registered: parseInt(userMetrics.total_users) || 0,
        activated: activatedCount,
        activationRate: userMetrics.total_users > 0
          ? ((activatedCount / parseInt(userMetrics.total_users)) * 100).toFixed(1)
          : 0,
        paying: parseInt(userMetrics.paying_users) || 0,
        conversionRate: userMetrics.total_users > 0
          ? ((parseInt(userMetrics.paying_users) / parseInt(userMetrics.total_users)) * 100).toFixed(1)
          : 0
      },
      insights: {
        powerUsers,
        upgradeOpportunities,
        churnRisk,
        freeUpgradeCandidates
      },
      recentSignups,
      trends: {
        dailySignups,
        dailyResponses
      },
      blog: {
        totalArticles: parseInt(blogStats.total_articles) || 0,
        published: parseInt(blogStats.published) || 0
      }
    });
  } catch (error) {
    console.error('Sales dashboard error:', error);
    res.status(500).json({ error: 'Failed to get sales dashboard', details: error.message });
  }
});

// Admin: List all users (with fake detection)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT id, email, subscription_plan, created_at, stripe_customer_id
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `);

    // Detect test accounts in JS (more reliable than SQL CASE)
    const testPatterns = [
      /@web\.de$/i,
      /^test/i,
      /test@/i,
      /^asdf/i,
      /^qwer/i,
      /^asd@/i,
      /@test\./i,
      /@example\./i,
      /^admin@/i,
      /fake/i,
      /^a@/i,
      /^aa@/i,
      /^aaa@/i,
    ];

    const usersWithFlag = users.map(u => ({
      ...u,
      is_test_account: testPatterns.some(p => p.test(u.email))
    }));

    const realUsers = usersWithFlag.filter(u => !u.is_test_account);
    const testUsers = usersWithFlag.filter(u => u.is_test_account);

    res.json({
      users: usersWithFlag,
      summary: {
        total: usersWithFlag.length,
        real: realUsers.length,
        test: testUsers.length,
        realPaying: realUsers.filter(u => u.subscription_plan !== 'free').length
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to get users', details: error.message });
  }
});

// Admin: Delete obvious fake/test accounts (keyboard spam emails)
app.delete('/api/admin/cleanup-test-accounts', authenticateAdmin, async (req, res) => {
  try {
    // Only delete accounts that match VERY obvious fake patterns
    // Be conservative - only keyboard spam and obvious test emails
    const fakePatterns = [
      "email LIKE 'asdf%'",
      "email LIKE 'qwer%'",
      "email LIKE 'asd@%'",
      "email LIKE 'qwe@%'",
      "email LIKE 'zxc@%'",
      "email LIKE 'fgh@%'",
      "email LIKE 'jkl@%'",
      "email LIKE 'a@a.%'",
      "email LIKE 'aa@aa.%'",
      "email LIKE 'aaa@%'",
      "email LIKE 'aaaa@%'",
      "email LIKE 'test@test.%'",
      "email LIKE '%@example.com'",
      "email LIKE '%@example.org'",
      "email LIKE 'sdfg%'",
      "email LIKE 'dfgh%'",
      "email LIKE 'xcvb%'",
      "email LIKE '123@%'",
      "email LIKE '1234@%'",
    ];

    // First, get the accounts that would be deleted (for logging)
    const toDelete = await dbAll(`
      SELECT id, email, subscription_plan, created_at
      FROM users
      WHERE (${fakePatterns.join(' OR ')})
      AND stripe_customer_id IS NULL
    `);

    if (toDelete.length === 0) {
      return res.json({ message: 'No obvious fake accounts found', deleted: [] });
    }

    // Delete them (only if they don't have active Stripe subscription)
    const result = await dbQuery(`
      DELETE FROM users
      WHERE (${fakePatterns.join(' OR ')})
      AND stripe_customer_id IS NULL
      RETURNING id, email
    `);

    res.json({
      message: `Deleted ${result.rows?.length || 0} fake accounts`,
      deleted: result.rows || toDelete
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup accounts' });
  }
});

// Admin: Delete all test accounts except specified real users
app.delete('/api/admin/cleanup-all-tests', authenticateAdmin, async (req, res) => {
  try {
    // These are the ONLY real users to keep
    const realEmails = [
      'berend.mainz@gmail.com',
      'berend.mainz@web.de',
      'tiniwi09@gmail.com',
      'rolicupo.twitch@gmail.com',
      'andrehoellering1732004@gmail.com',
      'rolicupo.games@gmail.com',
      'matiasaseff@hotmail.com',
      'clvalentini24@gmail.com',
      'penelopefier@gmail.com',
      'breihosen@gmail.com',
    ];

    const emailList = realEmails.map(e => `'${e.toLowerCase()}'`).join(', ');

    // Get accounts that will be deleted
    const toDelete = await dbAll(`
      SELECT id, email, subscription_plan, created_at
      FROM users
      WHERE LOWER(email) NOT IN (${emailList})
    `);

    if (toDelete.length === 0) {
      return res.json({ message: 'No test accounts to delete', deleted: [], kept: realEmails.length });
    }

    const userIds = toDelete.map(u => u.id);

    // Delete related data first (foreign key constraints) - ignore if table doesn't exist
    const tablesToClean = [
      { table: 'drip_emails', condition: 'user_id = ANY($1)' },
      { table: 'responses', condition: 'user_id = ANY($1)' },
      { table: 'templates', condition: 'user_id = ANY($1)' },
      { table: 'response_templates', condition: 'user_id = ANY($1)' },
      { table: 'team_members', condition: 'team_owner_id = ANY($1) OR member_user_id = ANY($1)' },
      { table: 'api_keys', condition: 'user_id = ANY($1)' },
      { table: 'referrals', condition: 'referrer_id = ANY($1) OR referred_id = ANY($1)' },
      { table: 'password_reset_tokens', condition: 'user_id = ANY($1)' },
      { table: 'email_verification_tokens', condition: 'user_id = ANY($1)' },
      { table: 'affiliate_conversions', condition: 'referred_user_id = ANY($1)' },
      { table: 'affiliates', condition: 'user_id = ANY($1)' },
      { table: 'user_feedback', condition: 'user_id = ANY($1)' },
      { table: 'support_requests', condition: 'user_id = ANY($1)' },
    ];

    for (const { table, condition } of tablesToClean) {
      try {
        await dbQuery(`DELETE FROM ${table} WHERE ${condition}`, [userIds]);
      } catch (e) {
        // Table might not exist, skip
      }
    }

    // Now delete users
    const result = await dbQuery(`
      DELETE FROM users
      WHERE LOWER(email) NOT IN (${emailList})
      RETURNING id, email
    `);

    res.json({
      message: `Deleted ${result.rows?.length || toDelete.length} test accounts`,
      deleted: result.rows || toDelete,
      kept: realEmails.length
    });
  } catch (error) {
    console.error('Cleanup all tests error:', error);
    res.status(500).json({ error: 'Failed to cleanup', details: error.message });
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

// Track email link clicks via redirect
app.get('/api/outreach/track-click', async (req, res) => {
  try {
    const { url, email, campaign } = req.query;

    if (!url) {
      return res.redirect('https://tryreviewresponder.com');
    }

    // Decode the URL
    const targetUrl = decodeURIComponent(url);

    if (email && campaign) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      // Store the click event
      await dbQuery(
        `INSERT INTO outreach_clicks (email, campaign, clicked_url, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [email, campaign, targetUrl, ip.split(',')[0], userAgent]
      );

      console.log(`🖱️ Link clicked: ${email} → ${targetUrl} (campaign: ${campaign})`);
    }

    // Redirect to the actual URL
    res.redirect(targetUrl);
  } catch (error) {
    console.error('Click tracking error:', error.message);
    // Fallback redirect on error
    res.redirect(req.query.url ? decodeURIComponent(req.query.url) : 'https://tryreviewresponder.com');
  }
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

    // Click tracking stats
    let totalClicks = { count: 0 };
    let uniqueClicks = { count: 0 };
    let recentClicks = [];
    let clicksByUrl = [];

    try {
      totalClicks = await dbGet(`SELECT COUNT(*) as count FROM outreach_clicks`) || { count: 0 };
      uniqueClicks = await dbGet(`SELECT COUNT(DISTINCT email) as count FROM outreach_clicks`) || { count: 0 };

      recentClicks = await dbAll(
        `SELECT email, campaign, clicked_url, clicked_at
         FROM outreach_clicks
         ORDER BY clicked_at DESC
         LIMIT 20`
      ) || [];

      clicksByUrl = await dbAll(
        `SELECT clicked_url, COUNT(*) as clicks
         FROM outreach_clicks
         GROUP BY clicked_url
         ORDER BY clicks DESC
         LIMIT 10`
      ) || [];
    } catch (e) {
      // Table might not exist yet
      console.log('Click tracking tables not ready:', e.message);
    }

    res.json({
      total_opens: parseInt(totalOpens?.count || 0),
      unique_opens: parseInt(uniqueOpens?.count || 0),
      total_clicks: parseInt(totalClicks?.count || 0),
      unique_clicks: parseInt(uniqueClicks?.count || 0),
      by_campaign: byCampaign,
      recent_opens: recentOpens,
      recent_clicks: recentClicks,
      clicks_by_url: clicksByUrl,
      by_day: byDay,
    });
  } catch (error) {
    console.error('Outreach stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// POST /api/admin/import-leads - Import scraped leads (G2, Yelp, TripAdvisor)
app.post('/api/admin/import-leads', async (req, res) => {
  try {
    const authKey = req.headers['x-admin-key'] || req.query.key;
    if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { leads } = req.body;
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'leads array required' });
    }

    const imported = [];
    const skipped = [];

    for (const lead of leads) {
      try {
        // Determine lead type based on source
        let leadType = 'restaurant';
        if (lead.source?.toLowerCase().includes('g2')) {
          leadType = 'g2_competitor';
        } else if (lead.source?.toLowerCase().includes('tripadvisor')) {
          leadType = 'tripadvisor';
        } else if (lead.source?.toLowerCase().includes('yelp')) {
          leadType = 'yelp';
        }

        // Extract competitor platform from source (e.g., "G2.com Birdeye Reviews" -> "birdeye")
        let competitorPlatform = null;
        if (leadType === 'g2_competitor') {
          const match = lead.source?.match(/g2.*?(birdeye|podium|yext|reputation)/i);
          if (match) {
            competitorPlatform = match[1].toLowerCase();
          }
        }

        // Insert lead
        const result = await dbQuery(
          `INSERT INTO outreach_leads (
            business_name, business_type, address, city, country,
            phone, website, email, contact_name, source,
            lead_type, competitor_platform, pain_points, platform_url,
            job_title, company_size, review_quote, outreach_angle,
            google_rating, google_reviews_count, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'new')
          ON CONFLICT (business_name, city) DO UPDATE SET
            phone = COALESCE(EXCLUDED.phone, outreach_leads.phone),
            website = COALESCE(EXCLUDED.website, outreach_leads.website),
            email = COALESCE(EXCLUDED.email, outreach_leads.email),
            contact_name = COALESCE(EXCLUDED.contact_name, outreach_leads.contact_name),
            lead_type = EXCLUDED.lead_type,
            competitor_platform = EXCLUDED.competitor_platform,
            pain_points = EXCLUDED.pain_points,
            platform_url = EXCLUDED.platform_url,
            job_title = EXCLUDED.job_title,
            company_size = EXCLUDED.company_size,
            review_quote = EXCLUDED.review_quote,
            outreach_angle = EXCLUDED.outreach_angle
          RETURNING id, business_name`,
          [
            lead.name || lead.business_name,
            lead.type || lead.business_type || 'unknown',
            lead.address || null,
            lead.city || 'Unknown',
            lead.country || 'DE',
            lead.phone || null,
            lead.website || null,
            lead.email || null,
            lead.contact_name || lead.title || null,
            lead.source || 'manual_import',
            leadType,
            competitorPlatform,
            lead.pain_points ? `{${lead.pain_points.map(p => `"${p.replace(/"/g, '\\"')}"`).join(',')}}` : null,
            lead.platform_url || lead.yelp_url || lead.tripadvisor_url || null,
            lead.title || lead.job_title || null,
            lead.company_size || null,
            lead.quote || lead.review_quote || null,
            lead.outreach_angle || null,
            lead.rating ? parseFloat(lead.rating) : null,
            lead.reviews ? parseInt(lead.reviews) : null,
          ]
        );
        imported.push({ id: result.id, name: result.business_name });
      } catch (err) {
        console.error('Import lead error:', err.message);
        skipped.push({ name: lead.name || lead.business_name, error: err.message });
      }
    }

    res.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      imported_leads: imported,
      skipped_leads: skipped,
    });
  } catch (error) {
    console.error('Import leads error:', error);
    res.status(500).json({ error: 'Failed to import leads' });
  }
});

// GET /api/admin/scraped-leads - Get all scraped leads
app.get('/api/admin/scraped-leads', async (req, res) => {
  try {
    const authKey = req.headers['x-admin-key'] || req.query.key;
    if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lead_type, status, limit = 50 } = req.query;

    let query = `SELECT * FROM outreach_leads WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (lead_type) {
      query += ` AND lead_type = $${paramIndex++}`;
      params.push(lead_type);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const leads = await dbAll(query, params);

    res.json({
      total: leads.length,
      leads: leads,
    });
  } catch (error) {
    console.error('Get scraped leads error:', error);
    res.status(500).json({ error: 'Failed to get leads' });
  }
});

// POST /api/cron/enrich-g2-leads - Find domain and email for G2 competitor leads
app.post('/api/cron/enrich-g2-leads', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (!safeCompare(cronSecret, process.env.CRON_SECRET) && !safeCompare(cronSecret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { domains_found: 0, emails_found: 0, leads_processed: 0 };

  try {
    // Step 1: Find domains for G2 leads without website (Clearbit Autocomplete - FREE)
    const leadsNeedingDomain = await dbAll(`
      SELECT id, business_name FROM outreach_leads
      WHERE website IS NULL AND lead_type = 'g2_competitor' AND status = 'new'
      LIMIT 10
    `);

    for (const lead of leadsNeedingDomain) {
      try {
        const clearbitUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(lead.business_name)}`;
        const response = await fetch(clearbitUrl);
        const companies = await response.json();

        if (companies && companies.length > 0 && companies[0].domain) {
          // Strict similarity check to avoid false positives
          const searchName = lead.business_name.toLowerCase().trim();
          const foundName = companies[0].name.toLowerCase().trim();
          const foundFirstWord = foundName.split(' ')[0];

          // Skip if search name is too short (< 5 chars) - too generic
          if (searchName.length < 5) {
            console.log(`⚠️ Skipping ${lead.business_name}: name too short for reliable matching`);
            continue;
          }

          // Check similarity: found name should START with search name, or search name should be the first word
          const isGoodMatch = foundName.startsWith(searchName) ||
                            foundFirstWord === searchName ||
                            searchName.startsWith(foundFirstWord);

          if (isGoodMatch) {
            const website = `https://${companies[0].domain}`;
            await dbQuery('UPDATE outreach_leads SET website = $1 WHERE id = $2', [website, lead.id]);
            console.log(`✅ Found domain for ${lead.business_name}: ${companies[0].domain}`);
            results.domains_found++;
          } else {
            console.log(`⚠️ Skipping ${lead.business_name}: best match "${companies[0].name}" doesn't match well enough`);
          }
        }
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {}
    }

    // Step 2: Find emails for G2 leads with website
    const leadsNeedingEmail = await dbAll(`
      SELECT id, business_name, website, contact_name, job_title FROM outreach_leads
      WHERE email IS NULL AND website IS NOT NULL AND lead_type = 'g2_competitor' AND status = 'new'
      LIMIT 10
    `);

    for (const lead of leadsNeedingEmail) {
      let emailFound = null;
      results.leads_processed++;

      // Try website scraper first
      try {
        const scrapedEmail = await scrapeEmailFromWebsite(lead.website);
        if (scrapedEmail) {
          emailFound = scrapedEmail;
          await dbQuery('UPDATE outreach_leads SET email = $1, email_source = $2 WHERE id = $3', [
            emailFound, 'website_scraper', lead.id
          ]);
          results.emails_found++;
          continue;
        }
      } catch (e) {}

      // Fallback to Hunter.io
      if (!emailFound && process.env.HUNTER_API_KEY) {
        try {
          const domain = lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
          const response = await fetch(hunterUrl);
          const data = await response.json();

          if (data.data?.emails && data.data.emails.length > 0) {
            let bestEmail = data.data.emails[0];

            // Try to match job title
            if (lead.job_title || lead.contact_name) {
              const titleKeywords = (lead.job_title || lead.contact_name).toLowerCase().split(/\s+/);
              const matchingEmail = data.data.emails.find(e => {
                const position = (e.position || '').toLowerCase();
                return titleKeywords.some(kw => position.includes(kw));
              });
              if (matchingEmail) bestEmail = matchingEmail;
            }

            await dbQuery('UPDATE outreach_leads SET email = $1, email_source = $2 WHERE id = $3', [
              bestEmail.value, 'hunter.io', lead.id
            ]);

            if (bestEmail.first_name && bestEmail.last_name) {
              await dbQuery('UPDATE outreach_leads SET contact_name = $1 WHERE id = $2', [
                `${bestEmail.first_name} ${bestEmail.last_name}`, lead.id
              ]);
            }
            results.emails_found++;
          }
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {}
      }
    }

    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Enrich G2 leads error:', error);
    res.status(500).json({ error: 'Failed to enrich leads', details: error.message?.substring(0, 100) });
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

    // Add review alert columns (for personalized outreach with AI-generated response drafts)
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS worst_review_text TEXT`);
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS worst_review_rating INTEGER`);
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS worst_review_author TEXT`);
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS ai_response_draft TEXT`);
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS has_bad_review BOOLEAN DEFAULT FALSE`);

    // Add columns for scraped leads (G2, Yelp, TripAdvisor)
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'restaurant'`); // 'restaurant', 'g2_competitor', 'tripadvisor'
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS competitor_platform TEXT`); // 'birdeye', 'podium', etc.
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS pain_points TEXT[]`); // Array of pain points
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS platform_url TEXT`); // Original Yelp/G2/TripAdvisor URL
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS job_title TEXT`); // For G2 leads
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS company_size TEXT`); // For G2 leads
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS review_quote TEXT`); // Quote from their negative review
    await dbQuery(`ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS outreach_angle TEXT`); // Personalized angle for outreach

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

// Email templates for REVIEW ALERT outreach - ENGLISH
// These are sent when we find a business with a bad review
const REVIEW_ALERT_TEMPLATES_EN = {
  sequence1: {
    subject: '{business_name} - response to your Google review',
    body: `Hi,

I noticed {business_name} has a {review_rating}-star review on Google:

"{review_text_truncated}"
- {review_author}

Here's a professional response you could use:

---
{ai_response_draft}
---

This response is free - feel free to use it directly.

If you'd like AI-generated responses for all your reviews, try ReviewResponder:
https://tryreviewresponder.com?ref=alert

Best,
Berend

P.S. I'm the founder. Reply if you have questions.`,
  },
};

// Email templates for REVIEW ALERT outreach - GERMAN
const REVIEW_ALERT_TEMPLATES_DE = {
  sequence1: {
    subject: '{business_name} - Antwort auf Ihre Google-Bewertung',
    body: `Hi,

ich habe gesehen dass {business_name} eine {review_rating}-Sterne Bewertung auf Google hat:

"{review_text_truncated}"
- {review_author}

Hier ist ein professioneller Antwortvorschlag:

---
{ai_response_draft}
---

Diese Antwort ist kostenlos - nutzen Sie sie gerne direkt.

Falls Sie professionelle Antworten auf alle Reviews möchten, probieren Sie ReviewResponder:
https://tryreviewresponder.com?ref=alert

Grüße,
Berend

P.S. Bin der Gründer, bei Fragen einfach antworten.`,
  },
};

// Email templates for G2 COMPETITOR outreach - targeting unhappy Birdeye/Podium users
const G2_COMPETITOR_TEMPLATES_EN = {
  sequence1: {
    subject: 'Saw your {competitor_platform} review - found something simpler',
    body: `Hi{contact_name_greeting},

I saw your G2 review about {competitor_platform} - sounds like a frustrating experience.

"{review_quote}"

I hear this feedback a lot. That's why I built ReviewResponder - no complex platform, no daily bugs.

Just AI that writes professional review responses in 3 seconds.

Try 20 free responses: https://tryreviewresponder.com?ref=g2

Best,
Berend

P.S. I'm the founder. If you have questions, just reply.`,
  },
  sequence2: {
    subject: 'Re: {competitor_platform} alternative',
    body: `Hey{contact_name_greeting},

Quick follow-up on my last email.

I know switching tools is a hassle. But if you're still dealing with:
- Bugs every day
- Slow support
- Features that don't work

Maybe worth a quick look: https://tryreviewresponder.com?ref=g2

Cheers,
Berend`,
  },
};

// Email templates for G2 COMPETITOR outreach - GERMAN
const G2_COMPETITOR_TEMPLATES_DE = {
  sequence1: {
    subject: 'Ihre {competitor_platform} Bewertung - einfachere Alternative gefunden',
    body: `Hi{contact_name_greeting},

ich habe Ihre G2 Bewertung zu {competitor_platform} gesehen - klingt nach einer frustrierenden Erfahrung.

"{review_quote}"

Dieses Feedback höre ich oft. Deshalb habe ich ReviewResponder gebaut - keine komplexe Plattform, keine täglichen Bugs.

Einfach KI die professionelle Review-Antworten in 3 Sekunden schreibt.

20 kostenlose Antworten testen: https://tryreviewresponder.com?ref=g2

Grüße,
Berend

P.S. Bin der Gründer. Bei Fragen einfach antworten.`,
  },
  sequence2: {
    subject: 'Re: {competitor_platform} Alternative',
    body: `Hey{contact_name_greeting},

kurzes Follow-up zu meiner letzten Mail.

Ich weiß, Tool-Wechsel sind nervig. Aber falls Sie noch kämpfen mit:
- Tägliche Bugs
- Langsamer Support
- Features die nicht funktionieren

Vielleicht einen kurzen Blick wert: https://tryreviewresponder.com?ref=g2

Grüße,
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
  // Review alert templates (only sequence 1 - one-shot value delivery)
  review_alert: REVIEW_ALERT_TEMPLATES_EN.sequence1,
  review_alert_de: REVIEW_ALERT_TEMPLATES_DE.sequence1,
  // G2 competitor templates (for unhappy Birdeye/Podium users)
  g2_competitor_1: G2_COMPETITOR_TEMPLATES_EN.sequence1,
  g2_competitor_2: G2_COMPETITOR_TEMPLATES_EN.sequence2,
  g2_competitor_1_de: G2_COMPETITOR_TEMPLATES_DE.sequence1,
  g2_competitor_2_de: G2_COMPETITOR_TEMPLATES_DE.sequence2,
};

// Helper: Get template based on language, lead type, and review status
function getTemplateForLead(sequenceNum, lead) {
  const lang = detectLanguage(lead.city);

  // G2 competitor leads (unhappy Birdeye/Podium users)
  if (lead.lead_type === 'g2_competitor' && sequenceNum <= 2) {
    return lang === 'de'
      ? EMAIL_TEMPLATES[`g2_competitor_${sequenceNum}_de`]
      : EMAIL_TEMPLATES[`g2_competitor_${sequenceNum}`];
  }

  // For leads with bad reviews, use the review alert template (only for first email)
  if (lead.has_bad_review && lead.ai_response_draft && sequenceNum === 1) {
    return lang === 'de' ? EMAIL_TEMPLATES.review_alert_de : EMAIL_TEMPLATES.review_alert;
  }

  // Default cold email templates
  const key = lang === 'de' ? `sequence${sequenceNum}_de` : `sequence${sequenceNum}`;
  return EMAIL_TEMPLATES[key];
}

// Helper: Generate AI response draft for a bad review (used in outreach emails)
async function generateReviewAlertDraft(businessName, businessType, reviewText, reviewRating, reviewAuthor) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are a professional review response writer helping businesses respond to customer reviews.

Generate a professional, empathetic response to this negative review. The response should:
- Acknowledge the customer's concerns
- Apologize for any inconvenience
- Offer to make things right (without making specific promises)
- Keep a professional but warm tone
- Be 3-5 sentences maximum
- NOT include any greeting or sign-off (those will be added by the business)

Business: ${businessName} (${businessType || 'local business'})`;

    const userPrompt = `Write a response to this ${reviewRating}-star review from ${reviewAuthor || 'a customer'}:

"${reviewText}"`;

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
      ],
    });

    return completion.content[0].text.trim();
  } catch (error) {
    console.error('Failed to generate review alert draft:', error.message);
    return null;
  }
}

// Helper: Scrape email from website (free fallback when Hunter.io fails)
async function scrapeEmailFromWebsite(websiteUrl) {
  try {
    // Normalize URL
    let url = websiteUrl;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Pages to check for contact emails
    const pagesToCheck = [
      url,
      url.replace(/\/$/, '') + '/contact',
      url.replace(/\/$/, '') + '/about',
      url.replace(/\/$/, '') + '/kontakt',
      url.replace(/\/$/, '') + '/impressum',
    ];

    // Email regex pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Blacklist common non-business emails
    const blacklist = ['example.com', 'email.com', 'domain.com', 'yoursite.com', 'website.com', 'sentry.io', 'wixpress.com'];

    for (const pageUrl of pagesToCheck) {
      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 5000,
        });

        if (!response.ok) continue;

        const html = await response.text();
        const emails = html.match(emailRegex) || [];

        // Filter and prioritize emails
        const validEmails = emails
          .map(e => e.toLowerCase())
          .filter(e => !blacklist.some(b => e.includes(b)))
          .filter(e => !e.includes('png') && !e.includes('jpg') && !e.includes('gif')); // Filter image filenames

        // Prioritize contact/info emails
        const priorityPrefixes = ['contact', 'info', 'hello', 'support', 'team', 'sales', 'mail', 'office'];
        const priorityEmail = validEmails.find(e => priorityPrefixes.some(p => e.startsWith(p + '@')));

        if (priorityEmail) return priorityEmail;
        if (validEmails.length > 0) return validEmails[0];

        // Small delay between page requests
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        // Page not found or error, try next
        continue;
      }
    }

    return null;
  } catch (e) {
    console.error('Website scrape error:', e.message);
    return null;
  }
}

// Helper: Wrap URLs with click tracking
function wrapUrlWithTracking(url, email, campaign) {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://review-responder.onrender.com'
    : 'http://localhost:3001';

  // Add UTM parameters to the target URL if it's our domain
  let targetUrl = url;
  if (url.includes('tryreviewresponder.com') && !url.includes('utm_')) {
    const separator = url.includes('?') ? '&' : '?';
    targetUrl = `${url}${separator}utm_source=outreach&utm_medium=email&utm_campaign=${encodeURIComponent(campaign)}`;
  }

  return `${baseUrl}/api/outreach/track-click?url=${encodeURIComponent(targetUrl)}&email=${encodeURIComponent(email)}&campaign=${encodeURIComponent(campaign)}`;
}

// Helper: Replace all URLs in text with tracked versions
function addClickTracking(text, email, campaign) {
  // Match URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;

  return text.replace(urlRegex, (url) => {
    // Don't track our own tracking URLs (avoid double-wrapping)
    if (url.includes('/api/outreach/track-')) {
      return url;
    }
    return wrapUrlWithTracking(url, email, campaign);
  });
}

function fillEmailTemplate(template, lead, campaign = 'main') {
  let subject = template.subject;
  let body = template.body;

  // Truncate review text to ~150 chars for email readability
  const reviewTextTruncated = lead.worst_review_text
    ? (lead.worst_review_text.length > 150
        ? lead.worst_review_text.substring(0, 147) + '...'
        : lead.worst_review_text)
    : '';

  // G2 competitor specific: format competitor platform name
  const competitorPlatformFormatted = lead.competitor_platform
    ? lead.competitor_platform.charAt(0).toUpperCase() + lead.competitor_platform.slice(1)
    : 'your current tool';

  // G2 competitor specific: contact name greeting (with leading space if name exists)
  const contactNameGreeting = lead.contact_name ? ` ${lead.contact_name}` : '';

  // G2 competitor specific: review quote (truncated)
  const reviewQuote = lead.review_quote
    ? (lead.review_quote.length > 120
        ? lead.review_quote.substring(0, 117) + '...'
        : lead.review_quote)
    : '';

  const replacements = {
    '{business_name}': lead.business_name || 'your business',
    '{business_type}': lead.business_type || 'business',
    '{review_count}': lead.google_reviews_count || '50',
    '{email}': encodeURIComponent(lead.email || ''),
    '{city}': lead.city || '',
    '{contact_name}': lead.contact_name || 'there',
    // Review alert specific replacements
    '{review_rating}': lead.worst_review_rating || '',
    '{review_text_truncated}': reviewTextTruncated,
    '{review_author}': lead.worst_review_author || 'a customer',
    '{ai_response_draft}': lead.ai_response_draft || '',
    // G2 competitor specific replacements
    '{competitor_platform}': competitorPlatformFormatted,
    '{contact_name_greeting}': contactNameGreeting,
    '{review_quote}': reviewQuote,
  };

  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key, 'g'), value);
    body = body.replace(new RegExp(key, 'g'), value);
  }

  // Add click tracking to all URLs in body (if we have lead email)
  if (lead.email) {
    body = addClickTracking(body, lead.email, campaign);
  }

  // Add open tracking pixel (invisible 1x1 gif at the end)
  if (lead.email) {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://review-responder.onrender.com'
      : 'http://localhost:3001';
    const trackingPixel = `<img src="${baseUrl}/api/outreach/track-open?email=${encodeURIComponent(lead.email)}&campaign=${encodeURIComponent(campaign)}" width="1" height="1" style="display:none" alt="" />`;
    body = body + '\n\n' + trackingPixel;
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
      // Get detailed info for each place (including reviews for personalized outreach)
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,reviews&key=${GOOGLE_API_KEY}`;

      const detailsResponse = await fetch(detailsUrl);
      const details = await detailsResponse.json();

      if (details.status === 'OK') {
        const result = details.result;

        // Parse address
        const addressParts = (result.formatted_address || '').split(',');
        const cityState = addressParts[1]?.trim() || city;

        // Find worst review (1-2 stars) for personalized outreach
        let worstReview = null;
        if (result.reviews && result.reviews.length > 0) {
          const badReviews = result.reviews.filter(r => r.rating <= 2);
          if (badReviews.length > 0) {
            // Get the one with most text (usually more specific complaint)
            worstReview = badReviews.reduce((worst, current) =>
              (current.text?.length || 0) > (worst.text?.length || 0) ? current : worst
            );
          }
        }

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
          worst_review_text: worstReview?.text || null,
          worst_review_rating: worstReview?.rating || null,
          worst_review_author: worstReview?.author_name || null,
          has_bad_review: worstReview !== null,
        };

        // Insert lead (ignore duplicates)
        try {
          await dbQuery(
            `
            INSERT INTO outreach_leads
            (business_name, business_type, address, city, phone, website, google_rating, google_reviews_count, source, worst_review_text, worst_review_rating, worst_review_author, has_bad_review)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (business_name, city) DO UPDATE SET
              google_rating = EXCLUDED.google_rating,
              google_reviews_count = EXCLUDED.google_reviews_count,
              website = COALESCE(EXCLUDED.website, outreach_leads.website),
              worst_review_text = COALESCE(EXCLUDED.worst_review_text, outreach_leads.worst_review_text),
              worst_review_rating = COALESCE(EXCLUDED.worst_review_rating, outreach_leads.worst_review_rating),
              worst_review_author = COALESCE(EXCLUDED.worst_review_author, outreach_leads.worst_review_author),
              has_bad_review = COALESCE(EXCLUDED.has_bad_review, outreach_leads.has_bad_review)
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
              lead.worst_review_text,
              lead.worst_review_rating,
              lead.worst_review_author,
              lead.has_bad_review,
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

        // Check if lead has a bad review (for Review Alert emails)
        const hasBadReview = lead.worst_review_text && lead.worst_review_rating && lead.worst_review_rating <= 2;

        // Insert or update lead (including review alert fields)
        await dbQuery(`
          INSERT INTO outreach_leads
            (business_name, business_type, address, city, country, phone, website,
             google_rating, google_reviews_count, email, source, status,
             worst_review_text, worst_review_rating, worst_review_author, has_bad_review)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (business_name, city)
          DO UPDATE SET
            email = COALESCE(EXCLUDED.email, outreach_leads.email),
            phone = COALESCE(EXCLUDED.phone, outreach_leads.phone),
            website = COALESCE(EXCLUDED.website, outreach_leads.website),
            google_rating = COALESCE(EXCLUDED.google_rating, outreach_leads.google_rating),
            google_reviews_count = COALESCE(EXCLUDED.google_reviews_count, outreach_leads.google_reviews_count),
            worst_review_text = COALESCE(EXCLUDED.worst_review_text, outreach_leads.worst_review_text),
            worst_review_rating = COALESCE(EXCLUDED.worst_review_rating, outreach_leads.worst_review_rating),
            worst_review_author = COALESCE(EXCLUDED.worst_review_author, outreach_leads.worst_review_author),
            has_bad_review = COALESCE(EXCLUDED.has_bad_review, outreach_leads.has_bad_review)
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
          'new',
          lead.worst_review_text || null,
          lead.worst_review_rating || null,
          lead.worst_review_author || null,
          hasBadReview
        ]);

        results.added++;

        // Send email immediately if requested
        if (send_emails && resend && lead.email) {
          // Generate AI draft for leads with bad reviews
          let aiDraft = lead.ai_response_draft || null;
          if (hasBadReview && lead.worst_review_text && !aiDraft) {
            console.log(`📝 Generating AI draft for TripAdvisor lead: ${lead.name || lead.business_name}...`);
            aiDraft = await generateReviewAlertDraft(
              lead.name || lead.business_name,
              lead.type || lead.business_type || 'restaurant',
              lead.worst_review_text,
              lead.worst_review_rating,
              lead.worst_review_author
            );
          }

          // Prepare lead data with all review alert fields
          const leadData = {
            ...lead,
            business_name: lead.name || lead.business_name,
            business_type: lead.type || lead.business_type || 'restaurant',
            google_reviews_count: lead.reviews || lead.google_reviews_count,
            has_bad_review: hasBadReview,
            worst_review_text: lead.worst_review_text,
            worst_review_rating: lead.worst_review_rating,
            worst_review_author: lead.worst_review_author,
            ai_response_draft: aiDraft
          };

          const template = fillEmailTemplate(getTemplateForLead(1, leadData), leadData);
          const emailCampaign = hasBadReview && aiDraft ? 'tripadvisor-review-alert' : campaign;

          try {
            await resend.emails.send({
              from: OUTREACH_FROM_EMAIL,
              to: lead.email,
              subject: template.subject,
              html: template.body.replace(/\n/g, '<br>'),
              tags: [
                { name: 'campaign', value: emailCampaign },
                { name: 'source', value: 'tripadvisor' },
                { name: 'sequence', value: '1' }
              ]
            });
            results.emails_sent++;

            // Log the sent email and save AI draft
            const insertedLead = await dbGet(
              'SELECT id FROM outreach_leads WHERE business_name = $1 AND city = $2',
              [lead.name || lead.business_name, lead.city]
            );
            if (insertedLead) {
              // Save AI draft if generated
              if (aiDraft) {
                await dbQuery('UPDATE outreach_leads SET ai_response_draft = $1 WHERE id = $2', [aiDraft, insertedLead.id]);
              }

              await dbQuery(`
                INSERT INTO outreach_emails
                  (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
                VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), $5)
              `, [insertedLead.id, lead.email, template.subject, template.body, emailCampaign]);

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
        // Generate AI draft for leads with bad reviews (if not already done)
        if (lead.has_bad_review && lead.worst_review_text && !lead.ai_response_draft) {
          console.log(`📝 Generating AI draft for TripAdvisor lead: ${lead.business_name}...`);
          const aiDraft = await generateReviewAlertDraft(
            lead.business_name,
            lead.business_type,
            lead.worst_review_text,
            lead.worst_review_rating,
            lead.worst_review_author
          );
          if (aiDraft) {
            lead.ai_response_draft = aiDraft;
            await dbQuery('UPDATE outreach_leads SET ai_response_draft = $1 WHERE id = $2', [aiDraft, lead.id]);
          }
        }

        // Get template for first email (uses review alert template if has_bad_review)
        const template = fillEmailTemplate(getTemplateForLead(1, lead), lead);
        const emailCampaign = lead.has_bad_review && lead.ai_response_draft ? 'tripadvisor-review-alert' : 'tripadvisor-auto';

        // Send email via Resend
        await resend.emails.send({
          from: OUTREACH_FROM_EMAIL,
          to: lead.email,
          subject: template.subject,
          html: template.body.replace(/\n/g, '<br>'),
          tags: [
            { name: 'campaign', value: emailCampaign },
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
          VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), $5)
        `, [lead.id, lead.email, template.subject, template.body, emailCampaign]);

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

    // Minimal response for cron-job.org (has size limit)
    res.json({ ok: true, sent: results.emails_sent, err: results.errors.length });
  } catch (error) {
    console.error('TripAdvisor cron error:', error);
    res.status(500).json({ ok: false, err: error.message?.slice(0, 100) });
  }
});

// ==========================================
// IMPORT SCRAPED LEADS (from Memory MCP or manual scraping)
// ==========================================
app.post('/api/outreach/import-scraped-leads', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { leads } = req.body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads array is required' });
  }

  try {
    const results = {
      imported: 0,
      skipped: 0,
      needs_enrichment: 0,
      errors: []
    };

    for (const lead of leads) {
      try {
        // Parse Memory MCP format or direct format
        const businessName = lead.business_name || lead.name ||
          (lead.observations?.find(o => o.startsWith('business_name:'))?.split(': ')[1]);
        const city = lead.city ||
          (lead.observations?.find(o => o.startsWith('city:'))?.split(': ')[1]) || 'Unknown';
        const source = lead.source ||
          (lead.observations?.find(o => o.startsWith('source:'))?.split(': ')[1]) || 'scraped';
        const email = lead.email ||
          (lead.observations?.find(o => o.startsWith('email:'))?.split(': ')[1]);
        const phone = lead.phone ||
          (lead.observations?.find(o => o.startsWith('phone:'))?.split(': ')[1]);
        const address = lead.address ||
          (lead.observations?.find(o => o.startsWith('address:'))?.split(': ')[1]);
        const businessType = lead.business_type ||
          (lead.observations?.find(o => o.startsWith('business_type:'))?.split(': ')[1]) || 'business';
        const rating = lead.rating ||
          parseFloat(lead.observations?.find(o => o.startsWith('rating:'))?.split(': ')[1]) || null;
        const reviewerName = lead.reviewer ||
          (lead.observations?.find(o => o.startsWith('reviewer:'))?.split(': ')[1]);
        const painPoints = lead.pain_points || lead.pain_point ||
          lead.observations?.filter(o => o.startsWith('pain_point'))?.map(o => o.split(': ')[1])?.join('; ');
        const competitor = lead.competitor ||
          (lead.observations?.find(o => o.startsWith('competitor:'))?.split(': ')[1]);

        if (!businessName && !reviewerName) {
          results.skipped++;
          results.errors.push(`Skipped lead: no business_name or reviewer`);
          continue;
        }

        // For G2/competitor leads (reviewer names without business), mark for LinkedIn enrichment
        if (reviewerName && !email && !businessName) {
          await dbQuery(`
            INSERT INTO outreach_leads
              (business_name, contact_name, source, status, business_type, city)
            VALUES ($1, $2, $3, 'needs_enrichment', $4, $5)
            ON CONFLICT (business_name, city) DO NOTHING
          `, [
            `${competitor || 'Unknown'} - ${reviewerName}`,
            reviewerName,
            source,
            `competitor_${competitor || 'unknown'}`,
            city
          ]);
          results.needs_enrichment++;
          continue;
        }

        // Insert or update lead
        await dbQuery(`
          INSERT INTO outreach_leads
            (business_name, business_type, address, city, phone, website,
             google_rating, email, source, status, contact_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (business_name, city)
          DO UPDATE SET
            email = COALESCE(EXCLUDED.email, outreach_leads.email),
            phone = COALESCE(EXCLUDED.phone, outreach_leads.phone),
            contact_name = COALESCE(EXCLUDED.contact_name, outreach_leads.contact_name),
            google_rating = COALESCE(EXCLUDED.google_rating, outreach_leads.google_rating)
        `, [
          businessName || `${competitor} Lead - ${reviewerName}`,
          businessType,
          address,
          city,
          phone,
          lead.website,
          rating,
          email,
          source,
          email ? 'new' : 'needs_enrichment',
          reviewerName
        ]);

        if (email) {
          results.imported++;
        } else {
          results.needs_enrichment++;
        }
      } catch (err) {
        results.errors.push(`Error: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.imported} leads, ${results.needs_enrichment} need LinkedIn enrichment`,
      ...results
    });
  } catch (error) {
    console.error('Import scraped leads error:', error);
    res.status(500).json({ error: 'Import failed', message: error.message });
  }
});

// ==========================================
// LINKEDIN ENRICHMENT - Find contact info for leads
// ==========================================
app.post('/api/outreach/linkedin-enrich', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get leads that need enrichment
    const leadsToEnrich = await dbAll(`
      SELECT id, business_name, contact_name, business_type, city
      FROM outreach_leads
      WHERE status = 'needs_enrichment'
        AND contact_name IS NOT NULL
        AND email IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `);

    if (leadsToEnrich.length === 0) {
      return res.json({
        success: true,
        message: 'No leads need enrichment',
        leads: []
      });
    }

    // Return leads formatted for LinkedIn search
    // Claude with Chrome MCP can use these to search LinkedIn
    const searchQueries = leadsToEnrich.map(lead => ({
      id: lead.id,
      name: lead.contact_name,
      business_type: lead.business_type,
      city: lead.city,
      linkedin_search_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.contact_name)}&origin=GLOBAL_SEARCH_HEADER`
    }));

    res.json({
      success: true,
      message: `${leadsToEnrich.length} leads need LinkedIn enrichment`,
      leads: searchQueries
    });
  } catch (error) {
    console.error('LinkedIn enrich error:', error);
    res.status(500).json({ error: 'Enrichment failed', message: error.message });
  }
});

// Update lead with LinkedIn data
app.post('/api/outreach/linkedin-update', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { lead_id, email, linkedin_url, company, title } = req.body;

  if (!lead_id) {
    return res.status(400).json({ error: 'lead_id is required' });
  }

  try {
    await dbQuery(`
      UPDATE outreach_leads
      SET email = COALESCE($1, email),
          website = COALESCE($2, website),
          business_name = COALESCE($3, business_name),
          status = CASE WHEN $1 IS NOT NULL THEN 'new' ELSE status END
      WHERE id = $4
    `, [email, linkedin_url, company, lead_id]);

    res.json({
      success: true,
      message: email ? 'Lead updated with email - ready for outreach' : 'Lead updated'
    });
  } catch (error) {
    console.error('LinkedIn update error:', error);
    res.status(500).json({ error: 'Update failed', message: error.message });
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

// ============== AUTO BLOG GENERATION WITH GEMINI ==============

// Blog topics organized by category (for SEO Auto-Pilot)
const AUTO_BLOG_TOPICS = [
  {
    category: 'Review Response',
    topics: [
      'How to Respond to a 1-Star Review Without Losing Customers',
      'The Psychology Behind Negative Reviews: What Customers Really Want',
      '7 Response Templates That Turn Angry Reviewers Into Loyal Customers',
      'How Fast Should You Respond to Reviews? The Data Says...',
      'The Art of Apologizing in Business Reviews',
    ],
  },
  {
    category: 'Reputation Management',
    topics: [
      'Building a 5-Star Reputation from Scratch',
      'How Negative Reviews Actually Help Your Business When Handled Right',
      'The Hidden Cost of Ignoring Online Reviews',
      'Local SEO: Why Reviews Are Your Secret Weapon',
      'Managing Reviews Across Multiple Platforms',
    ],
  },
  {
    category: 'Industry Guides',
    topics: [
      'Restaurant Review Management: A Complete Guide',
      'Hotel Review Response Strategies That Work',
      'Retail Store Reviews: Best Practices for 2025',
      'Medical Practice Reviews: HIPAA-Compliant Response Guide',
      'Automotive Dealer Review Management',
    ],
  },
  {
    category: 'AI and Automation',
    topics: [
      'How AI is Transforming Customer Review Management',
      'The Ethics of AI-Generated Review Responses',
      'When to Use AI vs Human Review Responses',
      'Personalizing AI Responses: Best Practices',
      'The Future of Automated Reputation Management',
    ],
  },
  {
    category: 'Customer Psychology',
    topics: [
      'Why Customers Leave Reviews And Why Most Dont',
      'The Emotional Journey of Writing a Negative Review',
      'How to Encourage More Positive Reviews Ethically',
      'Understanding Review Fatigue and How to Combat It',
      'The Role of Social Proof in Modern Business',
    ],
  },
];

// POST /api/cron/generate-blog-article - Auto-generate SEO blog article
// Call via cron-job.org: Mon/Wed/Fri at 6:00 UTC
app.post('/api/cron/generate-blog-article', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (
    !safeCompare(cronSecret, process.env.CRON_SECRET) &&
    !safeCompare(cronSecret, process.env.ADMIN_SECRET)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!gemini) {
    return res.status(500).json({ error: 'Gemini API not configured. Set GEMINI_API_KEY.' });
  }

  console.log('Starting auto blog generation with Gemini 2.5 Pro...');

  try {
    // Get count of auto-generated articles to rotate through topics
    const countResult = await dbGet(
      'SELECT COUNT(*) as count FROM blog_articles WHERE is_auto_generated = TRUE'
    );
    const articleCount = parseInt(countResult.count) || 0;

    // Flatten topics with categories
    const allTopics = AUTO_BLOG_TOPICS.flatMap((cat) =>
      cat.topics.map((t) => ({ topic: t, category: cat.category }))
    );

    // Rotate through topics
    const topicIndex = articleCount % allTopics.length;
    const { topic, category } = allTopics[topicIndex];

    // Check if we already have this exact topic
    const existing = await dbGet('SELECT id FROM blog_articles WHERE title ILIKE $1', [
      `%${topic.substring(0, 30)}%`,
    ]);

    if (existing) {
      console.log(`Topic already exists, skipping: ${topic}`);
      return res.json({
        skipped: true,
        message: 'Topic already exists',
        topic,
      });
    }

    // Generate article using Gemini 3 Pro with Google Search grounding
    const model = gemini.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      tools: [{ googleSearch: {} }],
    });

    const prompt = `You are an expert SEO content writer for ReviewResponder, a SaaS tool that helps businesses respond to customer reviews using AI.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

IMPORTANT: Use Google Search to find current statistics, trends, and data to make the article authoritative and up-to-date.

Requirements:
- Length: Approximately 1200-1500 words
- Tone: Professional yet approachable, helpful and actionable
- Include relevant keywords naturally
- Structure with:
  - An engaging introduction that gets straight to the point
  - Clear headings (use ## for main sections, ### for subsections)
  - Bullet points or numbered lists where appropriate
  - Practical, actionable tips businesses can implement today
  - A conclusion with a call-to-action mentioning ReviewResponder
- Include 1-2 natural mentions of ReviewResponder as a solution (not salesy)
- Include statistics or data points where relevant
- IMPORTANT: For every statistic, link directly to the source using markdown: [Study Name](URL) or "According to [BrightLocal](https://url)..."
- At the end of the article, include a "## Sources" section listing all referenced URLs
- Make it valuable for small to medium business owners

IMPORTANT: Include a subtle CTA like:
- "Tools like ReviewResponder can help automate this process..."
- "With AI-powered solutions like ReviewResponder, responding to reviews takes seconds..."
- "ReviewResponder's Chrome extension makes this even easier by..."

WRITING STYLE - AVOID AI SLOP:
Never use these phrases: "Here's the thing", "The uncomfortable truth is", "It turns out", "Let me be clear", "Full stop", "Period", "Let that sink in", "This matters because", "Make no mistake", "Here's why that matters", "Navigate", "Unpack", "Lean into", "Landscape", "Game-changer", "Double down", "Deep dive", "At its core", "In today's world", "It's worth noting", "Interestingly", "Importantly", "At the end of the day", "In a world where".

Avoid these structures:
- "Not because X. Because Y." binary contrasts
- "[X] isn't the problem. [Y] is." framing
- Opening with "What if [reframe]?"
- Closing paragraphs with punchy one-liners
- Three consecutive sentences of matching length
- Em-dashes before reveals
- Immediate question-answers
- Starting sentences with "Look," or "So,"
- DO NOT start with horizontal rules (*** or ---)

Write directly, trust the reader, avoid explaining obvious things.

Output Format:
Line 1: The article title (without any prefix like "Title:")
Line 2: A compelling meta description (150-160 characters, without prefix)
Line 3: Empty line
Lines 4+: The full article content in Markdown format (start directly with content, no horizontal rules).`;

    const result = await model.generateContent(prompt);
    const fullResponse = result.response.text();

    // Parse the response
    const lines = fullResponse.split('\n');
    const title = lines[0]
      .replace(/^#\s*/, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .replace(/^Title:\s*/i, '')
      .trim();
    const metaDescription = lines[1]
      .replace(/^Meta Description:\s*/i, '')
      .replace(/^Description:\s*/i, '')
      .trim();
    const content = lines.slice(3).join('\n').trim();

    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);
    const slug = generateSlug(title);

    // Add internal linking to related articles (SEO boost)
    let contentWithLinks = content;
    try {
      const relatedArticles = await dbAll(`
        SELECT title, slug FROM blog_articles
        WHERE is_published = TRUE
          AND category = $1
          AND slug IS NOT NULL
        ORDER BY published_at DESC
        LIMIT 3
      `, [category]);

      if (relatedArticles.length > 0) {
        const relatedSection = `\n\n---\n\n## Related Articles\n\n${relatedArticles.map(a =>
          `- [${a.title}](/blog/${a.slug})`
        ).join('\n')}\n`;
        contentWithLinks = content + relatedSection;
      }
    } catch (linkError) {
      console.log('Internal linking skipped:', linkError.message);
    }

    // Save to database (auto-published)
    const insertResult = await dbQuery(
      `INSERT INTO blog_articles
       (user_id, title, content, meta_description, keywords, topic, tone,
        word_count, slug, is_published, published_at, category,
        read_time_minutes, is_auto_generated, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, slug`,
      [
        1, // System user ID
        title,
        contentWithLinks,
        metaDescription,
        topic.toLowerCase().replace(/[^a-z0-9]+/g, ', '),
        topic,
        'informative',
        wordCount,
        slug,
        true, // Auto-publish
        new Date(),
        category,
        readTimeMinutes,
        true,
        'ReviewResponder Team',
      ]
    );

    console.log(`Blog auto-generated: "${title}" (${slug})`);

    // Ping Google to re-crawl sitemap (fire and forget)
    try {
      fetch(
        'https://www.google.com/ping?sitemap=https://tryreviewresponder.com/sitemap-blog.xml'
      ).catch(() => {});
      console.log('Pinged Google about sitemap update');
    } catch (e) {
      // Ignore ping errors
    }

    res.json({
      success: true,
      article: {
        id: insertResult.rows[0].id,
        slug: insertResult.rows[0].slug,
        title,
        category,
        wordCount,
        readTimeMinutes,
      },
    });
  } catch (error) {
    console.error('Auto-generate blog error:', error);
    res.status(500).json({ error: 'Failed to generate article', details: error.message });
  }
});

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

  // Optional query params to override city/industry (for manual triggering)
  const overrideCity = req.query.city;
  const overrideIndustry = req.query.industry;

  const results = {
    scraping: null,
    email_finding: null,
    sending: null,
    followups: null,
  };

  try {
    // Step 1: Scrape new leads from multiple cities/industries
    const cities = [
      // US Cities (20)
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami',
      'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas',
      'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Seattle',
      'Denver', 'Boston', 'Las Vegas', 'Portland', 'Atlanta',
      // UK & Ireland (2)
      'London', 'Dublin',
      // DACH Region (10)
      'Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln',
      'Stuttgart', 'Düsseldorf', 'Wien', 'Zürich', 'Genf',
      // Benelux (2)
      'Amsterdam', 'Brüssel'
    ];
    const industries = [
      'restaurant', 'hotel', 'dental office', 'law firm',
      'auto repair shop', 'hair salon', 'gym', 'real estate agency',
      'medical clinic', 'retail store',
      // New industries
      'spa', 'veterinary clinic', 'physiotherapy', 'accounting firm'
    ];

    let totalScraped = 0;

    // Pick city and industry based on date (better rotation across all cities)
    // Using day of year for city, day of month for industry
    // Can be overridden via query params: ?city=München&industry=restaurant
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const todayCity = overrideCity || cities[dayOfYear % cities.length];
    const todayIndustry = overrideIndustry || industries[new Date().getDate() % industries.length];

    if (process.env.GOOGLE_PLACES_API_KEY) {
      const scrapeUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(todayIndustry + ' in ' + todayCity)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      try {
        const response = await fetch(scrapeUrl);
        const data = await response.json();

        if (data.results) {
          for (const place of data.results.slice(0, 30)) { // Reduced to 30 to save API costs
            try {
              // Fetch Place Details including reviews for personalized outreach
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews&key=${process.env.GOOGLE_PLACES_API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);
              const details = await detailsResponse.json();

              if (details.status === 'OK') {
                const result = details.result;

                // Find worst review (1-2 stars) for personalized outreach
                let worstReview = null;
                if (result.reviews && result.reviews.length > 0) {
                  const badReviews = result.reviews.filter(r => r.rating <= 2);
                  if (badReviews.length > 0) {
                    worstReview = badReviews.reduce((worst, current) =>
                      (current.text?.length || 0) > (worst.text?.length || 0) ? current : worst
                    );
                  }
                }

                await dbQuery(
                  `
                  INSERT INTO outreach_leads (business_name, business_type, city, address, phone, website, google_rating, google_reviews_count, source, worst_review_text, worst_review_rating, worst_review_author, has_bad_review)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'google_places', $9, $10, $11, $12)
                  ON CONFLICT (business_name, city) DO UPDATE SET
                    website = COALESCE(EXCLUDED.website, outreach_leads.website),
                    phone = COALESCE(EXCLUDED.phone, outreach_leads.phone),
                    google_rating = COALESCE(EXCLUDED.google_rating, outreach_leads.google_rating),
                    google_reviews_count = COALESCE(EXCLUDED.google_reviews_count, outreach_leads.google_reviews_count),
                    worst_review_text = COALESCE(EXCLUDED.worst_review_text, outreach_leads.worst_review_text),
                    worst_review_rating = COALESCE(EXCLUDED.worst_review_rating, outreach_leads.worst_review_rating),
                    worst_review_author = COALESCE(EXCLUDED.worst_review_author, outreach_leads.worst_review_author),
                    has_bad_review = COALESCE(EXCLUDED.has_bad_review, outreach_leads.has_bad_review)
                `,
                  [
                    result.name,
                    todayIndustry,
                    todayCity,
                    result.formatted_address || null,
                    result.formatted_phone_number || null,
                    result.website || null,
                    result.rating || null,
                    result.user_ratings_total || null,
                    worstReview?.text || null,
                    worstReview?.rating || null,
                    worstReview?.author_name || null,
                    worstReview !== null,
                  ]
                );
                totalScraped++;
              }

              // Rate limiting
              await new Promise(r => setTimeout(r, 200));
            } catch (e) {
              console.error('Place details error:', e.message);
            }
          }
        }
      } catch (e) {
        console.error('Scrape error:', e.message);
      }
    }

    results.scraping = { leads_added: totalScraped, city: todayCity, industry: todayIndustry };

    // Step 1.5: Find website/domain for G2 leads without website (Clearbit Autocomplete - FREE)
    const leadsNeedingDomain = await dbAll(`
      SELECT id, business_name FROM outreach_leads
      WHERE website IS NULL AND lead_type = 'g2_competitor'
      LIMIT 10
    `);

    let domainsFound = 0;

    for (const lead of leadsNeedingDomain) {
      try {
        // Clearbit Autocomplete API - FREE, no API key needed
        const clearbitUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(lead.business_name)}`;
        const response = await fetch(clearbitUrl);
        const companies = await response.json();

        if (companies && companies.length > 0 && companies[0].domain) {
          const domain = companies[0].domain;
          const website = `https://${domain}`;
          await dbQuery('UPDATE outreach_leads SET website = $1 WHERE id = $2', [website, lead.id]);
          console.log(`🔍 Found domain for ${lead.business_name}: ${domain}`);
          domainsFound++;
        }

        await new Promise(r => setTimeout(r, 300)); // Rate limiting
      } catch (e) {
        console.error(`Domain lookup error for ${lead.business_name}:`, e.message);
      }
    }

    results.domain_finding = { checked: leadsNeedingDomain.length, found: domainsFound };

    // Step 2: Find emails for leads without them (Hunter.io + Website Scraper fallback)
    const leadsNeedingEmail = await dbAll(`
      SELECT id, business_name, website, lead_type, contact_name FROM outreach_leads
      WHERE email IS NULL AND website IS NOT NULL
      LIMIT 25
    `);

    let hunterFound = 0;
    let scraperFound = 0;

    for (const lead of leadsNeedingEmail) {
      let emailFound = null;
      let source = null;

      // Try FREE website scraper first (saves Hunter.io credits)
      if (!emailFound && lead.website) {
        try {
          const scrapedEmail = await scrapeEmailFromWebsite(lead.website);
          if (scrapedEmail) {
            emailFound = scrapedEmail;
            source = 'website_scraper';
            scraperFound++;
          }
        } catch (e) {}
      }

      // Fallback: Hunter.io (only if scraper failed and API key available)
      if (!emailFound && process.env.HUNTER_API_KEY) {
        try {
          const domain = lead.website
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0];
          const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
          const response = await fetch(hunterUrl);
          const data = await response.json();

          if (data.data?.emails && data.data.emails.length > 0) {
            // For G2 leads, try to find email matching job title (e.g., "Head of Digital" → "digital", "marketing")
            let bestEmail = data.data.emails[0];

            if (lead.lead_type === 'g2_competitor' && lead.contact_name) {
              const titleKeywords = lead.contact_name.toLowerCase().split(/\s+/);
              const matchingEmail = data.data.emails.find(e => {
                const position = (e.position || '').toLowerCase();
                const dept = (e.department || '').toLowerCase();
                return titleKeywords.some(kw => position.includes(kw) || dept.includes(kw));
              });
              if (matchingEmail) {
                bestEmail = matchingEmail;
                console.log(`🎯 Found matching email for ${lead.business_name}: ${bestEmail.value} (${bestEmail.position})`);
              }
            }

            emailFound = bestEmail.value;
            source = 'hunter.io';
            hunterFound++;

            // Also save contact name if available from Hunter
            if (bestEmail.first_name && bestEmail.last_name) {
              await dbQuery('UPDATE outreach_leads SET contact_name = $1 WHERE id = $2 AND (contact_name IS NULL OR contact_name = job_title)', [
                `${bestEmail.first_name} ${bestEmail.last_name}`,
                lead.id,
              ]);
            }
          }
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {}
      }

      // Save email if found
      if (emailFound) {
        await dbQuery('UPDATE outreach_leads SET email = $1, email_source = $2 WHERE id = $3', [
          emailFound,
          source,
          lead.id,
        ]);
      }
    }

    results.email_finding = {
      checked: leadsNeedingEmail.length,
      hunter_found: hunterFound,
      scraper_found: scraperFound,
      total_found: hunterFound + scraperFound
    };

    // Step 3: Send new cold emails (with AI-generated drafts for bad reviews)
    if (resend) {
      const newLeads = await dbAll(`
        SELECT l.* FROM outreach_leads l
        LEFT JOIN outreach_emails e ON l.id = e.lead_id
        WHERE l.email IS NOT NULL AND l.status = 'new' AND e.id IS NULL
        LIMIT 100
      `);

      let sent = 0;
      let reviewAlertsSent = 0;

      for (const lead of newLeads) {
        try {
          // For leads with bad reviews, generate AI response draft if not already done
          if (lead.has_bad_review && lead.worst_review_text && !lead.ai_response_draft) {
            console.log(`📝 Generating AI draft for ${lead.business_name}...`);
            const aiDraft = await generateReviewAlertDraft(
              lead.business_name,
              lead.business_type,
              lead.worst_review_text,
              lead.worst_review_rating,
              lead.worst_review_author
            );

            if (aiDraft) {
              lead.ai_response_draft = aiDraft;
              await dbQuery('UPDATE outreach_leads SET ai_response_draft = $1 WHERE id = $2', [
                aiDraft,
                lead.id,
              ]);
            }
          }

          const template = fillEmailTemplate(getTemplateForLead(1, lead), lead);

          await resend.emails.send({
            from: OUTREACH_FROM_EMAIL,
            to: lead.email,
            subject: template.subject,
            html: template.body.replace(/\n/g, '<br>'),
          });

          // Track email campaign type
          let campaign = 'main';
          if (lead.lead_type === 'g2_competitor') {
            campaign = 'g2_competitor';
          } else if (lead.has_bad_review && lead.ai_response_draft) {
            campaign = 'review_alert';
            reviewAlertsSent++;
          }

          await dbQuery(
            `
            INSERT INTO outreach_emails (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
            VALUES ($1, $2, 1, $3, $4, 'sent', NOW(), $5)
          `,
            [lead.id, lead.email, template.subject, template.body, campaign]
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

      results.sending = { sent: sent, review_alerts: reviewAlertsSent };

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
        LIMIT 50
      `);

      let followupsSent = 0;

      for (const lead of needsFollowup) {
        const nextSequence = (lead.last_sequence || 1) + 1;

        // G2 competitor leads only have 2 sequences, others have 3
        const maxSequence = lead.lead_type === 'g2_competitor' ? 2 : 3;

        if (nextSequence <= maxSequence) {
          try {
            const template = fillEmailTemplate(getTemplateForLead(nextSequence, lead), lead);

            // Determine campaign type for follow-up
            const followupCampaign = lead.lead_type === 'g2_competitor' ? 'g2_competitor' : 'main';

            await resend.emails.send({
              from: OUTREACH_FROM_EMAIL,
              to: lead.email,
              subject: template.subject,
              html: template.body.replace(/\n/g, '<br>'),
            });

            await dbQuery(
              `
              INSERT INTO outreach_emails (lead_id, email, sequence_number, subject, body, status, sent_at, campaign)
              VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), $6)
            `,
              [lead.id, lead.email, nextSequence, template.subject, template.body, followupCampaign]
            );

            if (nextSequence === maxSequence) {
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

    // Minimal response for cron-job.org (has size limit)
    res.json({
      ok: true,
      scraped: results.scraping?.leads_added || 0,
      emails: results.email_finding?.total_found || 0,
      sent: results.sending?.sent || 0,
      followups: results.followups?.sent || 0,
    });
  } catch (error) {
    console.error('Daily outreach error:', error);
    // Minimal error response for cron-job.org
    res.status(500).json({ ok: false, err: error.message?.slice(0, 100) });
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

    // Click tracking stats
    let emailsClicked = { count: 0 };
    try {
      emailsClicked = await dbGet('SELECT COUNT(DISTINCT email) as count FROM outreach_clicks') || { count: 0 };
    } catch (e) {
      // Table might not exist yet
    }

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
        emails_clicked: parseInt(emailsClicked?.count || 0),
        open_rate:
          emailsSent?.count > 0
            ? ((emailsOpened?.count / emailsSent?.count) * 100).toFixed(1) + '%'
            : '0%',
        click_rate:
          emailsSent?.count > 0
            ? ((emailsClicked?.count / emailsSent?.count) * 100).toFixed(1) + '%'
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

// ==========================================
// REDDIT AUTO-RESPONDER
// ==========================================

// Reddit API helper function
async function getRedditAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    return null;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ReviewResponder/1.0'
    },
    body: `grant_type=password&username=${username}&password=${password}`
  });

  const data = await response.json();
  return data.access_token;
}

// Search Reddit for relevant posts
async function searchRedditPosts(accessToken, query, subreddit = null) {
  const baseUrl = subreddit
    ? `https://oauth.reddit.com/r/${subreddit}/search`
    : 'https://oauth.reddit.com/search';

  const params = new URLSearchParams({
    q: query,
    sort: 'new',
    t: 'day', // Last 24 hours
    limit: '10',
    type: 'link'
  });

  if (subreddit) {
    params.append('restrict_sr', 'true');
  }

  const response = await fetch(`${baseUrl}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'ReviewResponder/1.0'
    }
  });

  const data = await response.json();
  return data.data?.children?.map(c => c.data) || [];
}

// Generate helpful Reddit comment using AI
async function generateRedditComment(post, topic) {
  const systemPrompt = `You are a helpful small business expert on Reddit. Write a genuinely helpful comment that:
1. Directly addresses the user's question/problem
2. Provides actionable advice based on your expertise
3. Is conversational and friendly (Reddit-style)
4. Naturally mentions ReviewResponder ONLY if relevant to review management
5. Is 100-200 words max
6. Does NOT sound like marketing spam
7. Does NOT use phrases like "I work for" or "Check out our tool"

If the post is not about reviews/reputation, just give helpful advice WITHOUT mentioning ReviewResponder.`;

  const userPrompt = `Reddit post title: "${post.title}"
Post content: "${post.selftext?.substring(0, 500) || '(no content)'}"
Subreddit: r/${post.subreddit}
Topic: ${topic}

Write a helpful, genuine Reddit comment:`;

  try {
    // Use Claude Opus 4.5 for highest quality (important marketing touchpoints)
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      return response.content[0].text;
    }

    // Fallback to OpenAI
    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      return response.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('AI generation error:', error.message);
    return null;
  }
}

// Post comment to Reddit
async function postRedditComment(accessToken, postId, comment) {
  const response = await fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ReviewResponder/1.0'
    },
    body: `thing_id=t3_${postId}&text=${encodeURIComponent(comment)}`
  });

  return response.json();
}

// Reddit monitor cron endpoint
app.get('/api/cron/reddit-monitor', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry_run === 'true';

  // Check Reddit credentials
  if (!process.env.REDDIT_CLIENT_ID) {
    return res.status(500).json({
      error: 'Reddit API not configured',
      setup: 'Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to Render'
    });
  }

  const results = {
    posts_found: 0,
    comments_generated: 0,
    comments_posted: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Initialize Reddit responses table if not exists
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS reddit_responses (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(50) UNIQUE NOT NULL,
        subreddit VARCHAR(100),
        post_title TEXT,
        post_url TEXT,
        our_comment TEXT,
        topic VARCHAR(100),
        posted_at TIMESTAMP DEFAULT NOW(),
        karma INTEGER DEFAULT 0
      )
    `);

    // Check daily limit (max 5 comments per day)
    const todayCount = await dbGet(`
      SELECT COUNT(*) as count FROM reddit_responses
      WHERE posted_at > NOW() - INTERVAL '24 hours'
    `);

    const dailyLimit = 5;
    const remaining = dailyLimit - parseInt(todayCount?.count || 0);

    if (remaining <= 0 && !dryRun) {
      return res.json({
        message: 'Daily limit reached (5 comments/day)',
        results: results
      });
    }

    // Get Reddit access token
    const accessToken = await getRedditAccessToken();
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to authenticate with Reddit' });
    }

    // Subreddits to monitor
    const subreddits = [
      'smallbusiness',
      'Entrepreneur',
      'restaurateur',
      'hoteliers',
      'marketing',
      'AskMarketing',
      'ecommerce',
      'startups'
    ];

    // Keywords to search for
    const keywords = [
      'negative review',
      'bad review response',
      'how to respond review',
      'online reputation',
      'review management',
      'customer review help',
      'yelp review',
      'google review response'
    ];

    const allPosts = [];

    // Search each subreddit with each keyword
    for (const subreddit of subreddits) {
      for (const keyword of keywords) {
        try {
          const posts = await searchRedditPosts(accessToken, keyword, subreddit);
          allPosts.push(...posts.map(p => ({ ...p, searchKeyword: keyword })));
          await new Promise(r => setTimeout(r, 1000)); // Rate limit
        } catch (e) {
          results.errors.push(`Search error: ${subreddit}/${keyword}`);
        }
      }
    }

    // Deduplicate by post ID
    const uniquePosts = [...new Map(allPosts.map(p => [p.id, p])).values()];
    results.posts_found = uniquePosts.length;

    // Filter out posts we've already responded to
    const respondedPosts = await dbAll('SELECT post_id FROM reddit_responses');
    const respondedIds = new Set(respondedPosts.map(r => r.post_id));

    const newPosts = uniquePosts.filter(p =>
      !respondedIds.has(p.id) &&
      p.num_comments < 50 && // Not too popular (our comment won't be seen)
      p.num_comments > 0 && // Has some engagement
      !p.locked &&
      !p.archived
    );

    // Process posts (up to remaining daily limit)
    for (const post of newPosts.slice(0, remaining)) {
      try {
        // Generate helpful comment
        const comment = await generateRedditComment(post, post.searchKeyword);

        if (!comment) {
          results.skipped++;
          continue;
        }

        results.comments_generated++;

        if (dryRun) {
          console.log(`[DRY RUN] Would post to r/${post.subreddit}: "${post.title}"`);
          console.log(`Comment: ${comment.substring(0, 100)}...`);
          continue;
        }

        // Post the comment
        const postResult = await postRedditComment(accessToken, post.id, comment);

        if (postResult.success !== false) {
          // Save to database
          await dbQuery(`
            INSERT INTO reddit_responses (post_id, subreddit, post_title, post_url, our_comment, topic)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (post_id) DO NOTHING
          `, [
            post.id,
            post.subreddit,
            post.title,
            `https://reddit.com${post.permalink}`,
            comment,
            post.searchKeyword
          ]);

          results.comments_posted++;
          console.log(`Posted comment to r/${post.subreddit}: "${post.title}"`);
        }

        // Rate limit between posts
        await new Promise(r => setTimeout(r, 2000));

      } catch (e) {
        results.errors.push(`Post error: ${post.id} - ${e.message}`);
      }
    }

    res.json({
      success: true,
      dry_run: dryRun,
      daily_limit: dailyLimit,
      remaining_today: remaining - results.comments_posted,
      results: results
    });

  } catch (error) {
    console.error('Reddit monitor error:', error);
    res.status(500).json({ error: 'Reddit monitor failed', details: error.message });
  }
});

// Get Reddit response history
app.get('/api/admin/reddit-responses', async (req, res) => {
  const adminKey = req.query.key || req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const responses = await dbAll(`
      SELECT * FROM reddit_responses
      ORDER BY posted_at DESC
      LIMIT 50
    `);

    const stats = await dbGet(`
      SELECT
        COUNT(*) as total_responses,
        COUNT(CASE WHEN posted_at > NOW() - INTERVAL '24 hours' THEN 1 END) as today,
        COUNT(CASE WHEN posted_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week
      FROM reddit_responses
    `);

    res.json({
      stats: stats,
      responses: responses
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Reddit responses' });
  }
});

// ==========================================
// TWITTER/X ENGAGEMENT (Auto-Posting via @ExecPsychology)
// ==========================================

// Search Twitter for relevant tweets using OAuth 1.0a client
async function searchTwitter(query) {
  if (!twitterClient) return [];

  try {
    const result = await twitterClient.v2.search(query, {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'conversation_id'],
      'user.fields': ['username', 'name'],
      'expansions': ['author_id'],
      'max_results': 10
    });

    return result.data?.data || [];
  } catch (error) {
    console.error('[Twitter] Search error:', error.message);
    return [];
  }
}

// Post a reply to a tweet
async function postTwitterReply(tweetId, replyText) {
  if (!twitterClient) {
    return { success: false, error: 'Twitter client not configured' };
  }

  try {
    const result = await twitterClient.v2.reply(replyText, tweetId);
    return {
      success: true,
      tweetId: result.data.id,
      text: result.data.text
    };
  } catch (error) {
    console.error('[Twitter] Reply error:', error.message);
    return { success: false, error: error.message };
  }
}

// Twitter monitor cron endpoint - Auto-posts replies via @ExecPsychology
app.get('/api/cron/twitter-monitor', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry_run === 'true';

  if (!twitterClient) {
    return res.status(500).json({
      error: 'Twitter API not configured',
      setup: 'Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET to Render'
    });
  }

  const results = {
    tweets_found: 0,
    replies_generated: 0,
    replies_posted: 0,
    errors: []
  };

  try {
    // Initialize Twitter responses table with posted status
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS twitter_responses (
        id SERIAL PRIMARY KEY,
        tweet_id VARCHAR(50) UNIQUE NOT NULL,
        tweet_text TEXT,
        tweet_author VARCHAR(100),
        our_reply TEXT,
        our_reply_id VARCHAR(50),
        topic VARCHAR(100),
        posted BOOLEAN DEFAULT FALSE,
        posted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add posted column if not exists (migration for existing tables)
    await dbQuery(`
      ALTER TABLE twitter_responses ADD COLUMN IF NOT EXISTS posted BOOLEAN DEFAULT FALSE
    `).catch(() => {});
    await dbQuery(`
      ALTER TABLE twitter_responses ADD COLUMN IF NOT EXISTS our_reply_id VARCHAR(50)
    `).catch(() => {});

    // Check daily limit (max 10 replies per day to stay safe)
    const todayCount = await dbGet(`
      SELECT COUNT(*) as count FROM twitter_responses
      WHERE posted = TRUE AND posted_at > NOW() - INTERVAL '24 hours'
    `);

    const dailyLimit = 10;
    const remaining = dailyLimit - parseInt(todayCount?.count || 0);

    if (remaining <= 0) {
      return res.json({
        message: 'Daily limit reached (10 auto-replies/day)',
        results: results
      });
    }

    // Keywords to search (English + German)
    const keywords = [
      '"negative review" help -is:retweet',
      '"bad review" business -is:retweet',
      'how to respond review -is:retweet',
      '"online reputation" help -is:retweet',
      '"google review" response -is:retweet',
      '"schlechte Bewertung" -is:retweet',
      '"negative Bewertung" hilfe -is:retweet'
    ];

    const allTweets = [];

    for (const keyword of keywords) {
      try {
        const tweets = await searchTwitter(keyword);
        allTweets.push(...tweets.map(t => ({ ...t, searchKeyword: keyword })));
        // Rate limit: wait 2 seconds between searches
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        results.errors.push(`Search error: ${keyword}`);
      }
    }

    // Deduplicate
    const uniqueTweets = [...new Map(allTweets.map(t => [t.id, t])).values()];
    results.tweets_found = uniqueTweets.length;

    // Filter already responded
    const respondedTweets = await dbAll('SELECT tweet_id FROM twitter_responses');
    const respondedIds = new Set(respondedTweets.map(r => r.tweet_id));

    const newTweets = uniqueTweets.filter(t => !respondedIds.has(t.id));

    // Process tweets and auto-post replies
    for (const tweet of newTweets.slice(0, remaining)) {
      try {
        // Generate helpful reply using Claude Sonnet (cost-effective for volume)
        const systemPrompt = `You are @ExecPsychology, a helpful business psychology expert on Twitter. Write a short, helpful reply (max 250 chars) that:
1. Addresses the user's problem with empathy
2. Offers a quick, actionable tip
3. Is friendly and genuine (NOT salesy)
4. Only mention ReviewResponder if the tweet is specifically about review response tools
5. Use casual Twitter tone with occasional emoji`;

        const reply = anthropic ? await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Tweet: "${tweet.text}"\n\nWrite a helpful reply (max 250 chars):` }]
        }).then(r => r.content[0].text.trim()) : null;

        if (reply && reply.length <= 280) {
          results.replies_generated++;

          if (!dryRun) {
            // Actually post the reply!
            const postResult = await postTwitterReply(tweet.id, reply);

            if (postResult.success) {
              results.replies_posted++;
              console.log(`[Twitter] Posted reply to tweet ${tweet.id}`);

              // Save successful post to DB
              await dbQuery(`
                INSERT INTO twitter_responses (tweet_id, tweet_text, tweet_author, our_reply, our_reply_id, topic, posted)
                VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                ON CONFLICT (tweet_id) DO UPDATE SET posted = TRUE, our_reply_id = $5
              `, [tweet.id, tweet.text, tweet.author_id, reply, postResult.tweetId, tweet.searchKeyword]);

              // Rate limit: wait 30 seconds between posts (stay well under limits)
              await new Promise(r => setTimeout(r, 30000));
            } else {
              results.errors.push(`Post failed for ${tweet.id}: ${postResult.error}`);

              // Save failed attempt for review
              await dbQuery(`
                INSERT INTO twitter_responses (tweet_id, tweet_text, tweet_author, our_reply, topic, posted)
                VALUES ($1, $2, $3, $4, $5, FALSE)
                ON CONFLICT (tweet_id) DO NOTHING
              `, [tweet.id, tweet.text, tweet.author_id, reply, tweet.searchKeyword]);
            }
          } else {
            // Dry run - just log
            console.log(`[Twitter DRY RUN] Would reply to: "${tweet.text.substring(0, 50)}..."`);
            console.log(`Reply: ${reply}`);
          }
        }

      } catch (e) {
        results.errors.push(`Tweet processing error: ${tweet.id} - ${e.message}`);
      }
    }

    res.json({
      success: true,
      dry_run: dryRun,
      message: dryRun
        ? 'Dry run complete - no tweets posted'
        : `Auto-posted ${results.replies_posted} replies via @ExecPsychology`,
      daily_limit: dailyLimit,
      remaining_today: remaining - results.replies_posted,
      results: results
    });

  } catch (error) {
    console.error('Twitter monitor error:', error);
    res.status(500).json({ error: 'Twitter monitor failed', details: error.message });
  }
});

// Get Twitter engagement history
app.get('/api/admin/twitter-opportunities', async (req, res) => {
  const adminKey = req.query.key || req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const responses = await dbAll(`
      SELECT * FROM twitter_responses
      ORDER BY posted_at DESC
      LIMIT 50
    `);

    const posted = responses.filter(r => r.posted);
    const pending = responses.filter(r => !r.posted);

    res.json({
      account: '@ExecPsychology',
      auto_posting: !!twitterClient,
      stats: {
        total: responses.length,
        posted: posted.length,
        pending: pending.length
      },
      posted: posted,
      pending: pending
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Twitter responses' });
  }
});

// ============================================
// TWITTER AUTO-TWEET SCHEDULER (@ExecPsychology)
// ============================================

// Tweet content categories and prompts
const TWEET_CATEGORIES = [
  {
    name: 'business_psychology',
    weight: 30,
    prompt: `Write a short, insightful tweet about business psychology. Topics: customer behavior, decision-making, trust-building, emotional intelligence in business. Be specific and actionable. No hashtags.`
  },
  {
    name: 'review_management',
    weight: 25,
    prompt: `Write a short tweet with a practical tip about responding to customer reviews (positive or negative). Share real insight, not generic advice. No hashtags.`
  },
  {
    name: 'business_tip',
    weight: 20,
    prompt: `Write a short tweet with a counterintuitive or lesser-known business tip. Make it memorable and shareable. No hashtags.`
  },
  {
    name: 'engagement_question',
    weight: 15,
    prompt: `Write a short tweet asking business owners an engaging question about their challenges with customer feedback, reviews, or reputation. Make it conversational. No hashtags.`
  },
  {
    name: 'soft_promo',
    weight: 10,
    prompt: `Write a short tweet mentioning ReviewResponder (AI tool for responding to customer reviews). Be subtle and value-first - lead with the problem it solves, not the product. Include tryreviewresponder.com naturally. No hashtags.`
  }
];

// Select category based on weights
function selectTweetCategory() {
  const totalWeight = TWEET_CATEGORIES.reduce((sum, cat) => sum + cat.weight, 0);
  let random = Math.random() * totalWeight;

  for (const category of TWEET_CATEGORIES) {
    random -= category.weight;
    if (random <= 0) return category;
  }
  return TWEET_CATEGORIES[0];
}

// AI Slop filter - removes typical AI-generated phrases
function cleanAISlop(text) {
  if (!text) return text;

  // Patterns to remove (case-insensitive)
  const slopPatterns = [
    /^(here'?s?|here is) (a |the |my |an )?/i,
    /^(let me |allow me to |i'd like to )/i,
    /^in today'?s? (world|age|era|landscape|market)/i,
    /^(the truth is|truth be told|honestly|to be honest),? /i,
    /^(did you know|fun fact|here'?s? the thing):? /i,
    /^(as (a |an )?(business owner|entrepreneur|leader)),? /i,
    /^(what if i told you|imagine (this|if)):? /i,
    /\b(game[- ]?changer|revolutionary|transform(ative)?|unlock(ing)?|leverage|skyrocket|supercharge)\b/gi,
    /\b(in (this|today's) (fast[- ]?paced|ever[- ]?changing|dynamic))\b/gi,
    /\b(at the end of the day|when all is said and done)\b/gi,
    /\b(it'?s? (important|crucial|essential|vital) to (note|remember|understand))\b/gi,
    /#\w+/g, // Remove any hashtags that slipped through
  ];

  let cleaned = text;
  for (const pattern of slopPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up extra spaces and capitalize first letter
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

// Generate tweet content using Claude
async function generateTweetContent(category) {
  if (!anthropic) return null;

  const systemPrompt = `You are @ExecPsychology on Twitter - a business psychology expert who helps entrepreneurs understand customer behavior and build better businesses.

Your tone is:
- Insightful but accessible (no jargon)
- Confident but not arrogant
- Helpful and genuine
- Occasionally witty

Rules:
- Max 250 characters (leave room for engagement)
- No hashtags (they reduce reach on X)
- No emojis at the start
- One emoji max, only if it adds value
- Write like a human, not a brand
- NEVER start with "Here's", "Let me", "Did you know", "The truth is"
- NEVER use words like: game-changer, revolutionary, transform, unlock, leverage, skyrocket
- Be direct and punchy - get to the point immediately`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: category.prompt }]
    });

    const rawTweet = response.content[0].text.trim();
    const cleanedTweet = cleanAISlop(rawTweet);

    console.log(`[Twitter] Raw: "${rawTweet.substring(0, 50)}..." -> Clean: "${cleanedTweet.substring(0, 50)}..."`);

    return cleanedTweet;
  } catch (error) {
    console.error('[Twitter] Tweet generation error:', error.message);
    return null;
  }
}

// Post a new tweet
async function postTweet(text) {
  if (!twitterClient) {
    return { success: false, error: 'Twitter client not configured' };
  }

  try {
    const result = await twitterClient.v2.tweet(text);
    return {
      success: true,
      tweetId: result.data.id,
      text: result.data.text
    };
  } catch (error) {
    console.error('[Twitter] Post error:', error.message);
    return { success: false, error: error.message };
  }
}

// Auto-Tweet cron endpoint
app.get('/api/cron/twitter-post', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dry_run === 'true';

  if (!twitterClient) {
    return res.status(500).json({
      error: 'Twitter API not configured',
      setup: 'Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET'
    });
  }

  try {
    // Initialize scheduled tweets table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS twitter_scheduled_posts (
        id SERIAL PRIMARY KEY,
        tweet_text TEXT NOT NULL,
        tweet_id VARCHAR(50),
        category VARCHAR(50),
        posted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        posted_at TIMESTAMP
      )
    `);

    // Check daily limit (max 2 tweets per day)
    const todayCount = await dbGet(`
      SELECT COUNT(*) as count FROM twitter_scheduled_posts
      WHERE posted = TRUE AND posted_at > NOW() - INTERVAL '24 hours'
    `);

    const dailyLimit = 2;
    const postedToday = parseInt(todayCount?.count || 0);

    if (postedToday >= dailyLimit) {
      return res.json({
        success: true,
        message: `Daily limit reached (${dailyLimit} tweets/day)`,
        posted_today: postedToday,
        next_slot: 'Tomorrow'
      });
    }

    // Select category and generate tweet
    const category = selectTweetCategory();
    const tweetText = await generateTweetContent(category);

    if (!tweetText) {
      return res.status(500).json({ error: 'Failed to generate tweet content' });
    }

    // Validate length
    if (tweetText.length > 280) {
      return res.status(500).json({
        error: 'Generated tweet too long',
        length: tweetText.length,
        text: tweetText
      });
    }

    const result = {
      category: category.name,
      tweet: tweetText,
      length: tweetText.length,
      posted: false,
      tweet_id: null
    };

    if (!dryRun) {
      // Post the tweet
      const postResult = await postTweet(tweetText);

      if (postResult.success) {
        result.posted = true;
        result.tweet_id = postResult.tweetId;

        // Save to database
        await dbQuery(`
          INSERT INTO twitter_scheduled_posts (tweet_text, tweet_id, category, posted, posted_at)
          VALUES ($1, $2, $3, TRUE, NOW())
        `, [tweetText, postResult.tweetId, category.name]);

        console.log(`[Twitter] Posted tweet: "${tweetText.substring(0, 50)}..."`);
      } else {
        result.error = postResult.error;

        // Save failed attempt
        await dbQuery(`
          INSERT INTO twitter_scheduled_posts (tweet_text, category, posted)
          VALUES ($1, $2, FALSE)
        `, [tweetText, category.name]);
      }
    } else {
      console.log(`[Twitter DRY RUN] Would post: "${tweetText}"`);
    }

    res.json({
      success: true,
      dry_run: dryRun,
      account: '@ExecPsychology',
      daily_limit: dailyLimit,
      posted_today: postedToday + (result.posted ? 1 : 0),
      result: result
    });

  } catch (error) {
    console.error('Twitter post error:', error);
    res.status(500).json({ error: 'Twitter post failed', details: error.message });
  }
});

// Get scheduled tweet history
app.get('/api/admin/twitter-posts', async (req, res) => {
  const adminKey = req.query.key || req.headers['x-admin-key'];
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const posts = await dbAll(`
      SELECT * FROM twitter_scheduled_posts
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Stats by category
    const categoryStats = await dbAll(`
      SELECT category, COUNT(*) as count, SUM(CASE WHEN posted THEN 1 ELSE 0 END) as posted_count
      FROM twitter_scheduled_posts
      GROUP BY category
    `);

    res.json({
      account: '@ExecPsychology',
      auto_posting: !!twitterClient,
      total_posts: posts.length,
      category_stats: categoryStats,
      recent_posts: posts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tweet history' });
  }
});

// ============================================
// SALES AUTOMATION ENDPOINTS
// ============================================

// Email Templates for Sales Automation
const SALES_EMAIL_TEMPLATES = {
  yelp_audit: {
    subject: '{business_name}: {unanswered} unbeantwortete Yelp Reviews kosten Sie Kunden',
    body: `Hallo,

ich habe mir gerade das Yelp-Profil von {business_name} angeschaut und festgestellt:

- {total_reviews} Reviews insgesamt
- Nur {owner_responses} davon beantwortet ({response_rate}%)
- {unanswered} Reviews warten auf eine Antwort

Studien zeigen: Businesses die auf Reviews antworten erhalten 35% mehr Anfragen.

Mit ReviewResponder koennen Sie auf alle {unanswered} Reviews in unter 10 Minuten antworten - mit KI-generierten, professionellen Antworten.

Kostenlos testen: https://tryreviewresponder.com?utm_source=yelp_audit&utm_campaign={city}

Beste Gruesse`
  },
  g2_switcher: {
    subject: 'Frustriert mit {competitor}? Es gibt eine bessere Alternative',
    body: `Hallo {contact_name},

ich habe Ihre Bewertung zu {competitor} auf G2 gelesen - ich verstehe Ihre Frustration.

"{complaint_summary}"

Viele Businesses wechseln zu ReviewResponder weil:
- Keine versteckten Kosten
- KI-generierte Antworten in Sekunden
- 30-Tage Geld-zurueck-Garantie

Wir bieten Ihnen 14 Tage kostenlos zum Testen: https://tryreviewresponder.com?utm_source=g2_switch&utm_campaign={competitor}

Falls Sie Fragen haben, antworten Sie einfach auf diese Email.

Beste Gruesse`
  },
  agency_partnership: {
    subject: 'White-Label Review Management fuer {agency_name} Kunden',
    body: `Hallo {contact_name},

ich habe {agency_name} auf Clutch gefunden und gesehen, dass Sie Local SEO Services anbieten.

Viele Ihrer Kunden brauchen wahrscheinlich auch Review Management - und wir koennen Ihnen helfen, diesen Service anzubieten ohne eigene Entwicklung.

Unser White-Label Angebot:
- 30% Revenue Share auf alle Kundenabos
- Ihr Branding, Ihr Dashboard
- Wir kuemmern uns um die Technik

Interesse an einem kurzen Gespraech?

Beste Gruesse,
ReviewResponder Partner Team

https://tryreviewresponder.com/partners?utm_source=clutch&utm_campaign=agency`
  },
  agency_followup_1: {
    subject: 'Re: White-Label Review Management fuer {agency_name}',
    body: `Hallo {contact_name},

wollte kurz nachfragen ob Sie meine letzte Email gesehen haben.

Falls Review Management nicht auf Ihrer Roadmap ist - kein Problem. Aber falls doch: Wir haben bereits 20+ Agencies als Partner und die Ergebnisse sind beeindruckend.

Ein Partner berichtet: "Wir haben 5 Kunden in den ersten Monat onboarded - $2,450 zusaetzlicher Umsatz pro Monat."

Antworten Sie einfach falls Sie mehr erfahren moechten.

Beste Gruesse`
  }
};

// POST /api/sales/yelp-leads - Submit Yelp leads from scraping
app.post('/api/sales/yelp-leads', async (req, res) => {
  const authKey = req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET) && !safeCompare(authKey, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array required' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
      // Check if already exists
      const existing = await dbGet('SELECT id FROM yelp_leads WHERE yelp_url = $1', [lead.yelp_url]);
      if (existing) {
        skipped++;
        continue;
      }

      await dbQuery(`
        INSERT INTO yelp_leads (business_name, yelp_url, city, category, total_reviews, owner_responses, response_rate, website, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        lead.business_name,
        lead.yelp_url,
        lead.city,
        lead.category,
        lead.total_reviews || 0,
        lead.owner_responses || 0,
        lead.response_rate || 0,
        lead.website,
        lead.phone
      ]);
      inserted++;
    }

    res.json({ success: true, inserted, skipped, total: leads.length });
  } catch (error) {
    console.error('Yelp leads submission error:', error);
    res.status(500).json({ error: 'Failed to submit leads' });
  }
});

// POST /api/sales/competitor-leads - Submit G2 competitor leads
app.post('/api/sales/competitor-leads', async (req, res) => {
  const authKey = req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET) && !safeCompare(authKey, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array required' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
      // Check if already exists (by company + competitor combo)
      const existing = await dbGet(
        'SELECT id FROM competitor_leads WHERE company_name = $1 AND competitor = $2',
        [lead.company_name, lead.competitor]
      );
      if (existing) {
        skipped++;
        continue;
      }

      await dbQuery(`
        INSERT INTO competitor_leads (company_name, reviewer_name, reviewer_title, competitor, star_rating, review_title, complaint_summary, review_date, g2_url, website)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        lead.company_name,
        lead.reviewer_name,
        lead.reviewer_title,
        lead.competitor,
        lead.star_rating,
        lead.review_title,
        lead.complaint_summary,
        lead.review_date,
        lead.g2_url,
        lead.website
      ]);
      inserted++;
    }

    res.json({ success: true, inserted, skipped, total: leads.length });
  } catch (error) {
    console.error('Competitor leads submission error:', error);
    res.status(500).json({ error: 'Failed to submit leads' });
  }
});

// POST /api/sales/linkedin-leads - Submit LinkedIn leads
app.post('/api/sales/linkedin-leads', async (req, res) => {
  const authKey = req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET) && !safeCompare(authKey, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array required' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
      const existing = await dbGet('SELECT id FROM linkedin_outreach WHERE linkedin_url = $1', [lead.linkedin_url]);
      if (existing) {
        skipped++;
        continue;
      }

      await dbQuery(`
        INSERT INTO linkedin_outreach (name, title, company, location, linkedin_url)
        VALUES ($1, $2, $3, $4, $5)
      `, [lead.name, lead.title, lead.company, lead.location, lead.linkedin_url]);
      inserted++;
    }

    res.json({ success: true, inserted, skipped, total: leads.length });
  } catch (error) {
    console.error('LinkedIn leads submission error:', error);
    res.status(500).json({ error: 'Failed to submit leads' });
  }
});

// POST /api/outreach/linkedin-demo - Generate personalized demo for LinkedIn outreach
app.post('/api/outreach/linkedin-demo', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized - Admin key required' });
  }

  try {
    const { linkedin_url, first_name, company, business_name, city } = req.body;

    if (!linkedin_url && !business_name) {
      return res.status(400).json({ error: 'Either linkedin_url or business_name required' });
    }

    // Extract first name from full name if not provided
    const contactFirstName = first_name || (req.body.name ? req.body.name.split(' ')[0] : 'there');
    const contactCompany = company || business_name;

    // Try to find the business on Google Maps
    let placeId = null;
    let googleRating = null;
    let totalReviews = 0;
    let scrapedReviews = [];
    let generatedResponses = [];

    const searchName = business_name || contactCompany;
    const searchCity = city || '';

    if (searchName) {
      try {
        const placeResult = await lookupPlaceId(searchName, searchCity);
        placeId = placeResult.placeId;
        googleRating = placeResult.rating;
        totalReviews = placeResult.totalReviews || 0;
      } catch (err) {
        console.log('Place lookup failed:', err.message);
      }
    }

    // If we found a place, try to get reviews and generate demo
    if (placeId && process.env.SERPAPI_KEY) {
      try {
        // Get place details for rating
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,name&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.result) {
          googleRating = detailsData.result.rating;
          totalReviews = detailsData.result.user_ratings_total || 0;
        }

        // Scrape reviews via SerpAPI
        scrapedReviews = await scrapeGoogleReviews(placeId, 3);

        // Generate AI responses for each review
        for (const review of scrapedReviews) {
          const aiResponse = await generateDemoResponse(review, searchName);
          generatedResponses.push({
            review: review,
            ai_response: aiResponse
          });
        }
      } catch (err) {
        console.log('Review scraping/generation failed:', err.message);
      }
    }

    // Generate demo token
    const demoToken = generateDemoToken();
    const demoUrl = `https://tryreviewresponder.com/demo/${demoToken}`;

    // Generate connection note
    let connectionNote;
    if (scrapedReviews.length > 0 && googleRating) {
      connectionNote = `Hi ${contactFirstName},

Saw ${searchName} has ${googleRating} stars on Google - nice work!

I made you something: ${demoUrl}

(3 AI-generated responses to your toughest reviews)

Cheers,
Berend`;
    } else {
      // Fallback note without demo
      connectionNote = `Hi ${contactFirstName},

Love what you're doing at ${contactCompany}.

Built a tool that writes review responses in 10 seconds.
Would love your feedback: tryreviewresponder.com

Cheers,
Berend`;
    }

    // Save to database (update existing or insert new)
    let linkedinLeadId;
    if (linkedin_url) {
      const existing = await dbGet('SELECT id FROM linkedin_outreach WHERE linkedin_url = $1', [linkedin_url]);
      if (existing) {
        await dbQuery(`
          UPDATE linkedin_outreach
          SET demo_token = $1, demo_url = $2, connection_note = $3,
              business_name = $4, google_place_id = $5, google_rating = $6
          WHERE id = $7
        `, [demoToken, demoUrl, connectionNote, searchName, placeId, googleRating, existing.id]);
        linkedinLeadId = existing.id;
      } else {
        const inserted = await dbGet(`
          INSERT INTO linkedin_outreach (name, company, linkedin_url, demo_token, demo_url, connection_note, business_name, google_place_id, google_rating)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [req.body.name || contactFirstName, contactCompany, linkedin_url, demoToken, demoUrl, connectionNote, searchName, placeId, googleRating]);
        linkedinLeadId = inserted.id;
      }
    }

    // Also store in demo_generations if we have reviews
    if (scrapedReviews.length > 0) {
      await dbQuery(`
        INSERT INTO demo_generations (business_name, google_place_id, google_rating, total_reviews, scraped_reviews, demo_token, generated_responses)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (demo_token) DO UPDATE SET generated_responses = $7
      `, [searchName, placeId, googleRating, totalReviews, JSON.stringify(scrapedReviews), demoToken, JSON.stringify(generatedResponses)]);
    }

    res.json({
      success: true,
      demo_token: demoToken,
      demo_url: demoUrl,
      connection_note: connectionNote,
      linkedin_lead_id: linkedinLeadId,
      has_reviews: scrapedReviews.length > 0,
      reviews_processed: scrapedReviews.length,
      google_rating: googleRating,
      business_name: searchName
    });

  } catch (error) {
    console.error('LinkedIn demo generation error:', error);
    res.status(500).json({ error: 'Failed to generate LinkedIn demo' });
  }
});

// GET /api/outreach/linkedin-demo/:id - Get LinkedIn lead with demo info
app.get('/api/outreach/linkedin-demo/:id', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const lead = await dbGet('SELECT * FROM linkedin_outreach WHERE id = $1', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error('LinkedIn lead fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PUT /api/outreach/linkedin-demo/:id/sent - Mark connection as sent
app.put('/api/outreach/linkedin-demo/:id/sent', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbQuery(`
      UPDATE linkedin_outreach
      SET connection_sent = TRUE, connection_sent_at = NOW()
      WHERE id = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('LinkedIn sent update error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// PUT /api/outreach/linkedin-demo/:id/accepted - Mark connection as accepted
app.put('/api/outreach/linkedin-demo/:id/accepted', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbQuery(`
      UPDATE linkedin_outreach
      SET connection_accepted = TRUE, connection_accepted_at = NOW()
      WHERE id = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('LinkedIn accepted update error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// GET /api/outreach/linkedin-pending - Get LinkedIn leads pending connection
app.get('/api/outreach/linkedin-pending', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const leads = await dbAll(`
      SELECT * FROM linkedin_outreach
      WHERE demo_token IS NOT NULL
        AND connection_sent = FALSE
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    res.json({ leads, count: leads.length });
  } catch (error) {
    console.error('LinkedIn pending fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pending leads' });
  }
});

// POST /api/sales/agency-leads - Submit agency partnership leads
app.post('/api/sales/agency-leads', async (req, res) => {
  const authKey = req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET) && !safeCompare(authKey, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array required' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
      const existing = await dbGet('SELECT id FROM agency_leads WHERE clutch_url = $1', [lead.clutch_url]);
      if (existing) {
        skipped++;
        continue;
      }

      await dbQuery(`
        INSERT INTO agency_leads (agency_name, website, clutch_url, clutch_rating, num_reviews, services, location, min_project_size, hourly_rate, employees)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        lead.agency_name,
        lead.website,
        lead.clutch_url,
        lead.clutch_rating,
        lead.num_reviews,
        lead.services,
        lead.location,
        lead.min_project_size,
        lead.hourly_rate,
        lead.employees
      ]);
      inserted++;
    }

    res.json({ success: true, inserted, skipped, total: leads.length });
  } catch (error) {
    console.error('Agency leads submission error:', error);
    res.status(500).json({ error: 'Failed to submit leads' });
  }
});

// GET /api/sales/dashboard - Sales automation dashboard
app.get('/api/sales/dashboard', async (req, res) => {
  const authKey = req.headers['x-api-key'] || req.query.key;
  if (!safeCompare(authKey, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [yelp, competitor, linkedin, agency] = await Promise.all([
      dbAll('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE email_sent) as emailed, COUNT(*) FILTER (WHERE replied) as replied FROM yelp_leads'),
      dbAll('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE email_sent) as emailed, COUNT(*) FILTER (WHERE replied) as replied FROM competitor_leads'),
      dbAll('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE connection_sent) as sent, COUNT(*) FILTER (WHERE connection_accepted) as accepted, COUNT(*) FILTER (WHERE replied) as replied FROM linkedin_outreach'),
      dbAll('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE email_sequence > 0) as emailed, COUNT(*) FILTER (WHERE replied) as replied, COUNT(*) FILTER (WHERE interested) as interested FROM agency_leads')
    ]);

    res.json({
      yelp_leads: yelp[0],
      competitor_leads: competitor[0],
      linkedin_outreach: linkedin[0],
      agency_leads: agency[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// POST /api/cron/send-yelp-emails - Send emails to Yelp leads
app.post('/api/cron/send-yelp-emails', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (!safeCompare(cronSecret, process.env.CRON_SECRET) && !safeCompare(cronSecret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get leads with email but not yet emailed (max 20 per run)
    const leads = await dbAll(`
      SELECT * FROM yelp_leads
      WHERE email IS NOT NULL AND email_sent = FALSE
      ORDER BY created_at DESC
      LIMIT 20
    `);

    if (leads.length === 0) {
      return res.json({ message: 'No Yelp leads to email', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        const unanswered = lead.total_reviews - lead.owner_responses;
        const subject = SALES_EMAIL_TEMPLATES.yelp_audit.subject
          .replace('{business_name}', lead.business_name)
          .replace('{unanswered}', unanswered);

        const body = SALES_EMAIL_TEMPLATES.yelp_audit.body
          .replace(/{business_name}/g, lead.business_name)
          .replace('{total_reviews}', lead.total_reviews)
          .replace('{owner_responses}', lead.owner_responses)
          .replace('{response_rate}', lead.response_rate)
          .replace(/{unanswered}/g, unanswered)
          .replace('{city}', lead.city || 'general');

        if (resend) {
          await resend.emails.send({
            from: process.env.OUTREACH_FROM_EMAIL || FROM_EMAIL,
            to: lead.email,
            subject: subject,
            text: body,
            tags: [{ name: 'campaign', value: 'yelp-audit' }]
          });

          await dbQuery('UPDATE yelp_leads SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1', [lead.id]);
          sent++;
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${lead.email}:`, emailError.message);
        failed++;
      }
    }

    res.json({ success: true, sent, failed, total: leads.length });
  } catch (error) {
    console.error('Yelp email cron error:', error);
    res.status(500).json({ error: 'Yelp email cron failed' });
  }
});

// POST /api/cron/send-g2-emails - Send emails to G2 competitor leads
app.post('/api/cron/send-g2-emails', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (!safeCompare(cronSecret, process.env.CRON_SECRET) && !safeCompare(cronSecret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const leads = await dbAll(`
      SELECT * FROM competitor_leads
      WHERE email IS NOT NULL AND email_sent = FALSE
      ORDER BY created_at DESC
      LIMIT 15
    `);

    if (leads.length === 0) {
      return res.json({ message: 'No G2 leads to email', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        const contactName = lead.reviewer_name || 'there';
        const subject = SALES_EMAIL_TEMPLATES.g2_switcher.subject
          .replace('{competitor}', lead.competitor);

        const body = SALES_EMAIL_TEMPLATES.g2_switcher.body
          .replace('{contact_name}', contactName)
          .replace(/{competitor}/g, lead.competitor)
          .replace('{complaint_summary}', lead.complaint_summary || 'your concerns with the product');

        if (resend) {
          await resend.emails.send({
            from: process.env.OUTREACH_FROM_EMAIL || FROM_EMAIL,
            to: lead.email,
            subject: subject,
            text: body,
            tags: [{ name: 'campaign', value: 'g2-switcher' }]
          });

          await dbQuery('UPDATE competitor_leads SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1', [lead.id]);
          sent++;
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${lead.email}:`, emailError.message);
        failed++;
      }
    }

    res.json({ success: true, sent, failed, total: leads.length });
  } catch (error) {
    console.error('G2 email cron error:', error);
    res.status(500).json({ error: 'G2 email cron failed' });
  }
});

// POST /api/cron/send-agency-emails - Send partnership emails to agencies
app.post('/api/cron/send-agency-emails', async (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (!safeCompare(cronSecret, process.env.CRON_SECRET) && !safeCompare(cronSecret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get agencies for initial email (sequence 0) or follow-ups
    const newLeads = await dbAll(`
      SELECT * FROM agency_leads
      WHERE email IS NOT NULL AND email_sequence = 0
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get leads for follow-up (sent > 4 days ago, sequence 1)
    const followupLeads = await dbAll(`
      SELECT * FROM agency_leads
      WHERE email IS NOT NULL
        AND email_sequence = 1
        AND last_email_sent < NOW() - INTERVAL '4 days'
        AND replied = FALSE
      LIMIT 10
    `);

    let sent = 0;
    let failed = 0;

    // Send initial emails
    for (const lead of newLeads) {
      try {
        const contactName = lead.contact_name || 'there';
        const subject = SALES_EMAIL_TEMPLATES.agency_partnership.subject
          .replace('{agency_name}', lead.agency_name);

        const body = SALES_EMAIL_TEMPLATES.agency_partnership.body
          .replace(/{agency_name}/g, lead.agency_name)
          .replace('{contact_name}', contactName);

        if (resend) {
          await resend.emails.send({
            from: process.env.OUTREACH_FROM_EMAIL || FROM_EMAIL,
            to: lead.email,
            subject: subject,
            text: body,
            tags: [{ name: 'campaign', value: 'agency-partnership' }]
          });

          await dbQuery('UPDATE agency_leads SET email_sequence = 1, last_email_sent = NOW() WHERE id = $1', [lead.id]);
          sent++;
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${lead.email}:`, emailError.message);
        failed++;
      }
    }

    // Send follow-up emails
    for (const lead of followupLeads) {
      try {
        const contactName = lead.contact_name || 'there';
        const subject = SALES_EMAIL_TEMPLATES.agency_followup_1.subject
          .replace('{agency_name}', lead.agency_name);

        const body = SALES_EMAIL_TEMPLATES.agency_followup_1.body
          .replace(/{agency_name}/g, lead.agency_name)
          .replace('{contact_name}', contactName);

        if (resend) {
          await resend.emails.send({
            from: process.env.OUTREACH_FROM_EMAIL || FROM_EMAIL,
            to: lead.email,
            subject: subject,
            text: body,
            tags: [{ name: 'campaign', value: 'agency-followup' }]
          });

          await dbQuery('UPDATE agency_leads SET email_sequence = 2, last_email_sent = NOW() WHERE id = $1', [lead.id]);
          sent++;
        }
      } catch (emailError) {
        console.error(`Failed to send followup to ${lead.email}:`, emailError.message);
        failed++;
      }
    }

    res.json({ success: true, sent, failed, newLeads: newLeads.length, followups: followupLeads.length });
  } catch (error) {
    console.error('Agency email cron error:', error);
    res.status(500).json({ error: 'Agency email cron failed' });
  }
});

// POST /api/admin/send-cold-email - Send custom cold email to restaurant leads
app.post('/api/admin/send-cold-email', async (req, res) => {
  const { key } = req.query;
  if (key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Resend not configured' });
  }

  const { to, name, reviews, type } = req.body;
  if (!to || !name) {
    return res.status(400).json({ error: 'to and name required' });
  }

  try {
    const subject = `${reviews || 'Ihre'} Bewertungen - Antworten Sie auf alle mit AI?`;
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Guten Tag,</p>

  <p>ich habe gesehen, dass <strong>${name}</strong> ${reviews ? `uber <strong>${reviews} Bewertungen</strong>` : 'viele Bewertungen'} auf TripAdvisor und Yelp hat${reviews ? ' - das ist beeindruckend!' : '.'}</p>

  <p>Aber Hand aufs Herz: Wie viele davon bleiben unbeantwortet?</p>

  <p>Mit <strong>ReviewResponder</strong> konnen Sie:</p>
  <ul>
    <li>AI-generierte, personalisierte Antworten in Sekunden erstellen</li>
    <li>Den richtigen Ton treffen (professionell, freundlich, oder entschuldigend)</li>
    <li>Zeit sparen und trotzdem jeden Gast wertschatzen</li>
  </ul>

  <p><strong>20 kostenlose Antworten pro Monat</strong> - ohne Kreditkarte, ohne Verpflichtung.</p>

  <p>Hier konnen Sie es sofort testen:<br>
  <a href="https://tryreviewresponder.com?utm_source=cold_email&utm_campaign=munich_restaurants&utm_content=${encodeURIComponent(name)}" style="color: #2563eb;">https://tryreviewresponder.com</a></p>

  <p>Falls Sie Fragen haben, antworten Sie einfach auf diese Email.</p>

  <p>Mit freundlichen Grussen,<br>
  Berend Mainz<br>
  <span style="color: #666;">ReviewResponder</span></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #999;">
    Sie erhalten diese Email, weil Ihr Restaurant viele Online-Bewertungen hat.<br>
    <a href="https://tryreviewresponder.com/unsubscribe?email=${encodeURIComponent(to)}" style="color: #999;">Abmelden</a>
  </p>
</body>
</html>
    `;

    const result = await resend.emails.send({
      from: process.env.OUTREACH_FROM_EMAIL || FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
      reply_to: 'berend.jakob.mainz@gmail.com',
      tags: [{ name: 'campaign', value: 'manual-cold-email' }]
    });

    console.log(`Cold email sent to ${name} (${to}):`, result.id);
    res.json({ success: true, id: result.id, to, name });
  } catch (error) {
    console.error('Cold email error:', error);
    res.status(500).json({ error: error.message });
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
