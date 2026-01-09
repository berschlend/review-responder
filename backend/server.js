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

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Track database connection status
let dbConnected = false;

pool.on('error', (err) => {
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

// Middleware
app.use(helmet());

// CORS configuration - allow frontend and Chrome extension
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://www.google.com',
  'https://google.com',
  'https://maps.google.com',
  'https://business.google.com',
  'chrome-extension://*'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Chrome extensions, mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or is a chrome extension
    if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Also allow the frontend URL variations
    if (origin.includes('review-responder')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
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
        responses_limit INTEGER DEFAULT 5,
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
      await dbQuery(`UPDATE api_keys SET requests_today = 0, last_reset_date = $1 WHERE id = $2`, [today, keyRecord.id]);
      requestsToday = 0;
    }

    if (requestsToday >= 100) {
      return res.status(429).json({ error: 'Rate limit exceeded. Maximum 100 requests per day.', reset_at: 'midnight UTC' });
    }

    await dbQuery(`UPDATE api_keys SET requests_today = requests_today + 1, requests_total = requests_total + 1, last_request_at = NOW() WHERE id = $1`, [keyRecord.id]);

    req.apiKeyUser = {
      id: keyRecord.user_id,
      email: keyRecord.email,
      subscription_plan: keyRecord.subscription_plan,
      business_name: keyRecord.business_name,
      business_type: keyRecord.business_type,
      business_context: keyRecord.business_context,
      response_style: keyRecord.response_style
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Plan limits (monthly and yearly pricing)
const PLAN_LIMITS = {
  free: { responses: 5, price: 0 },
  starter: {
    responses: 100,
    price: 2900,
    yearlyPrice: 27840, // 20% off: $29 * 12 * 0.8 = $278.40
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID
  },
  professional: {
    responses: 300,
    price: 4900,
    yearlyPrice: 47040, // 20% off: $49 * 12 * 0.8 = $470.40
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID
  },
  unlimited: {
    responses: 999999,
    price: 9900,
    yearlyPrice: 95040, // 20% off: $99 * 12 * 0.8 = $950.40
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_UNLIMITED_YEARLY_PRICE_ID
  }
};

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { business_name: businessName || '' }
    });

    const result = await dbQuery(
      `INSERT INTO users (email, password, business_name, stripe_customer_id, responses_limit)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, hashedPassword, businessName || '', customer.id, PLAN_LIMITS.free.responses]
    );

    const userId = result.rows[0].id;
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
        onboardingCompleted: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        plan: user.subscription_plan,
        responsesUsed: user.responses_used,
        responsesLimit: user.responses_limit,
        subscriptionStatus: user.subscription_status,
        onboardingCompleted: user.onboarding_completed
      }
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

    res.json({
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
        subscriptionStatus: user.subscription_status,
        onboardingCompleted: user.onboarding_completed
      }
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
      [businessName || '', businessType || '', businessContext || '', responseStyle || '', req.user.id]
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
        responsesLimit: user.responses_limit
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Password Reset - Request
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = await dbGet('SELECT id, email FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link will be sent.' });
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
          from: 'ReviewResponder <onboarding@resend.dev>',
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
          `
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
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 12);
    await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, resetToken.user_id]);

    // Mark token as used
    await dbQuery('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetToken.id]);

    console.log(`✅ Password reset successful for user ID ${resetToken.user_id}`);

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============ RESPONSE GENERATION ============

// Alias for Chrome extension (shorter path)
app.post('/api/generate', authenticateToken, (req, res) => generateResponseHandler(req, res));

// Main response generation endpoint
app.post('/api/responses/generate', authenticateToken, (req, res) => generateResponseHandler(req, res));

async function generateResponseHandler(req, res) {
  try {
    const { reviewText, reviewRating, platform, tone, outputLanguage, businessName, customInstructions } = req.body;

    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    // Check usage limits
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (user.responses_used >= user.responses_limit) {
      return res.status(403).json({
        error: 'Response limit reached',
        upgrade: true,
        message: 'You have reached your monthly response limit. Please upgrade your plan to continue.'
      });
    }

    const ratingContext = reviewRating
      ? `This is a ${reviewRating}-star review.`
      : '';

    const toneInstructions = {
      professional: 'Use a professional, courteous tone.',
      friendly: 'Use a warm, friendly, and personable tone.',
      formal: 'Use a formal, business-appropriate tone.',
      apologetic: 'Use an apologetic and empathetic tone, focusing on resolution.'
    };

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
      fi: 'Finnish'
    };

    // Build language instruction based on outputLanguage selection
    const languageInstruction = (!outputLanguage || outputLanguage === 'auto')
      ? 'IMPORTANT: Respond in the same language as the review. If the review is in German, respond in German. If in Spanish, respond in Spanish.'
      : `IMPORTANT: You MUST write the response in ${languageNames[outputLanguage] || 'English'}, regardless of what language the review is written in.`;

    // Build business context section
    const businessContextSection = user.business_context ? `
Business Context (use this to personalize your response):
${user.business_context}
` : '';

    const businessTypeSection = user.business_type ? `Business Type: ${user.business_type}` : '';
    const responseStyleSection = user.response_style ? `Preferred Response Style: ${user.response_style}` : '';

    const prompt = `You are a professional customer service expert helping a small business respond to online reviews.

**CRITICAL LANGUAGE RULE**: ${languageInstruction}

Business Name: ${businessName || user.business_name || 'Our business'}
${businessTypeSection}
Platform: ${platform || 'Google Reviews'}
${ratingContext}
${businessContextSection}
${responseStyleSection}

Review to respond to:
"${reviewText}"

Instructions:
- ${toneInstructions[tone] || toneInstructions.professional}
- Keep the response concise (2-4 sentences for positive reviews, 3-5 for negative)
- Thank them for their feedback
- For negative reviews: acknowledge their concerns, apologize if appropriate, offer to make it right
- For positive reviews: express genuine gratitude and invite them back
- Don't be overly formal or use canned phrases
- Make it feel personal and authentic
- If business context is provided, reference specific details about the business (e.g., mention specific menu items, services, team members)
${customInstructions ? `- Additional instructions: ${customInstructions}` : ''}

Remember: Write your response in the SAME LANGUAGE as the review above!

Generate ONLY the response text, nothing else:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const generatedResponse = completion.choices[0].message.content.trim();

    // Save response and update usage
    await dbQuery(
      `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, reviewText, reviewRating || null, platform || 'google', generatedResponse, tone || 'professional']
    );

    await dbQuery('UPDATE users SET responses_used = responses_used + 1 WHERE id = $1', [req.user.id]);

    const updatedUser = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Check if user just crossed 80% usage and send alert email
    const usagePercent = Math.round((updatedUser.responses_used / updatedUser.responses_limit) * 100);
    const previousPercent = Math.round(((updatedUser.responses_used - 1) / updatedUser.responses_limit) * 100);

    // Send alert if just crossed 80% threshold
    if (usagePercent >= 80 && previousPercent < 80 && updatedUser.subscription_plan !== 'unlimited') {
      const canSendAlert = !updatedUser.last_usage_alert_sent ||
        new Date(updatedUser.last_usage_alert_sent) < new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (canSendAlert && process.env.NODE_ENV === 'production') {
        sendUsageAlertEmail(updatedUser).then(sent => {
          if (sent) {
            dbQuery('UPDATE users SET last_usage_alert_sent = NOW() WHERE id = $1', [req.user.id]);
          }
        });
      }
    }

    res.json({
      response: generatedResponse,
      responsesUsed: updatedUser.responses_used,
      responsesLimit: updatedUser.responses_limit
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}

// Bulk Response Generation (Paid plans only: Starter/Pro/Unlimited)
app.post('/api/generate-bulk', authenticateToken, async (req, res) => {
  try {
    const { reviews, tone, platform, outputLanguage } = req.body;

    // Validate input
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'Reviews array is required' });
    }

    if (reviews.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 reviews per batch' });
    }

    // Check user plan (Paid plans only: Starter/Pro/Unlimited)
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (!['starter', 'professional', 'unlimited'].includes(user.subscription_plan)) {
      return res.status(403).json({
        error: 'Bulk generation is only available for paid plans (Starter, Pro, Unlimited)',
        upgrade: true,
        requiredPlan: 'starter'
      });
    }

    // Check usage limits
    const reviewCount = reviews.filter(r => r.trim()).length;
    if (user.responses_used + reviewCount > user.responses_limit) {
      return res.status(403).json({
        error: `Not enough responses remaining. You need ${reviewCount} but only have ${user.responses_limit - user.responses_used} left.`,
        upgrade: true
      });
    }

    const toneInstructions = {
      professional: 'Use a professional, courteous tone.',
      friendly: 'Use a warm, friendly, and personable tone.',
      formal: 'Use a formal, business-appropriate tone.',
      apologetic: 'Use an apologetic and empathetic tone, focusing on resolution.'
    };

    // Language mapping for output language selection
    const languageNames = {
      en: 'English', de: 'German', es: 'Spanish', fr: 'French',
      it: 'Italian', pt: 'Portuguese', nl: 'Dutch', pl: 'Polish',
      ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
      ar: 'Arabic', tr: 'Turkish', sv: 'Swedish', da: 'Danish',
      no: 'Norwegian', fi: 'Finnish'
    };

    // Build language instruction based on outputLanguage selection
    const languageInstruction = (!outputLanguage || outputLanguage === 'auto')
      ? 'IMPORTANT: Respond in the same language as the review.'
      : `IMPORTANT: You MUST write the response in ${languageNames[outputLanguage] || 'English'}, regardless of what language the review is written in.`;

    // Build business context
    const businessContextSection = user.business_context ? `
Business Context (use this to personalize your response):
${user.business_context}
` : '';

    // Process all reviews in parallel
    const generateSingleResponse = async (reviewText, index) => {
      if (!reviewText.trim()) {
        return { index, success: false, error: 'Empty review' };
      }

      try {
        const prompt = `You are a professional customer service expert helping a small business respond to online reviews.

Business Name: ${user.business_name || 'Our business'}
${user.business_type ? `Business Type: ${user.business_type}` : ''}
Platform: ${platform || 'Google Reviews'}
${businessContextSection}

Review to respond to:
"${reviewText}"

Instructions:
- ${toneInstructions[tone] || toneInstructions.professional}
- Keep the response concise (2-4 sentences for positive reviews, 3-5 for negative)
- Thank them for their feedback
- For negative reviews: acknowledge their concerns, apologize if appropriate, offer to make it right
- For positive reviews: express genuine gratitude and invite them back
- Don't be overly formal or use canned phrases
- Make it feel personal and authentic
- If business context is provided, reference specific details about the business
- ${languageInstruction}

Generate ONLY the response text, nothing else:`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        });

        const generatedResponse = completion.choices[0].message.content.trim();

        // Save to database
        await dbQuery(
          `INSERT INTO responses (user_id, review_text, review_platform, generated_response, tone)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.id, reviewText, platform || 'google', generatedResponse, tone || 'professional']
        );

        return {
          index,
          success: true,
          review: reviewText,
          response: generatedResponse
        };
      } catch (error) {
        console.error(`Error generating response for review ${index}:`, error);
        return {
          index,
          success: false,
          review: reviewText,
          error: 'Failed to generate response'
        };
      }
    };

    // Process all reviews in parallel
    const results = await Promise.all(
      reviews.map((review, index) => generateSingleResponse(review, index))
    );

    // Count successful generations
    const successCount = results.filter(r => r.success).length;

    // Update usage count
    await dbQuery(
      'UPDATE users SET responses_used = responses_used + $1 WHERE id = $2',
      [successCount, req.user.id]
    );

    const updatedUser = await dbGet('SELECT responses_used, responses_limit FROM users WHERE id = $1', [req.user.id]);

    res.json({
      results: results.sort((a, b) => a.index - b.index),
      summary: {
        total: reviews.length,
        successful: successCount,
        failed: reviews.length - successCount
      },
      responsesUsed: updatedUser.responses_used,
      responsesLimit: updatedUser.responses_limit
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

    const total = await dbGet('SELECT COUNT(*) as count FROM responses WHERE user_id = $1', [req.user.id]);

    res.json({
      responses,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
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
    if (discountCode && discountCode.toUpperCase() === 'EARLY50') {
      // Create a 50% off coupon for early adopters
      try {
        const coupon = await stripe.coupons.create({
          percent_off: 50,
          duration: 'forever',
          id: `EARLY50_${Date.now()}_${user.id}`,
          metadata: {
            campaign: 'early_adopter',
            user_id: user.id.toString()
          }
        });
        discounts = [{
          coupon: coupon.id
        }];
      } catch (err) {
        console.log('Coupon creation error:', err);
        // Continue without discount if coupon fails
      }
    }

    const sessionConfig = {
      customer: user.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        plan,
        billing
      }
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

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
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
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await dbGet('SELECT id FROM users WHERE stripe_customer_id = $1', [subscription.customer]);

        if (user) {
          const status = subscription.status === 'active' ? 'active' : 'inactive';
          await dbQuery(
            `UPDATE users SET subscription_status = $1, current_period_start = $2, current_period_end = $3 WHERE id = $4`,
            [
              status,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000),
              user.id
            ]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await dbGet('SELECT id FROM users WHERE stripe_customer_id = $1', [subscription.customer]);

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
        const user = await dbGet('SELECT * FROM users WHERE stripe_customer_id = $1', [invoice.customer]);

        if (user && user.subscription_plan !== 'free') {
          await dbQuery('UPDATE users SET responses_used = 0 WHERE id = $1', [user.id]);

          // Send plan renewal email
          if (process.env.NODE_ENV === 'production') {
            sendPlanRenewalEmail(user);
          }
          console.log(`📧 Plan renewed for user ${user.id} (${user.subscription_plan})`);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
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

    const totalResponses = await dbGet('SELECT COUNT(*) as count FROM responses WHERE user_id = $1', [req.user.id]);

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

    res.json({
      usage: {
        used: user.responses_used,
        limit: user.responses_limit,
        remaining: user.responses_limit - user.responses_used
      },
      stats: {
        totalResponses: parseInt(totalResponses.count),
        thisMonth: parseInt(thisMonth.count),
        byPlatform,
        byRating
      },
      subscription: {
        plan: user.subscription_plan,
        status: user.subscription_status
      }
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
      return res.status(400).json({ error: 'Maximum of 20 templates allowed. Delete some templates to add new ones.' });
    }

    const result = await dbQuery(
      `INSERT INTO response_templates (user_id, name, content, tone, platform, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name.trim(), content, tone || 'professional', platform || 'google', category || null]
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
      [name.trim(), content, tone || 'professional', platform || 'google', category || null, id, req.user.id]
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

    await dbQuery('DELETE FROM response_templates WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============ TEAM MANAGEMENT (Unlimited Plan Only) ============

app.get('/api/team', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.subscription_plan !== 'unlimited') return res.status(403).json({ error: 'Team features are only available for Unlimited plan', upgrade: true, requiredPlan: 'unlimited' });
    const members = await dbAll(`SELECT tm.*, u.email as user_email, u.business_name FROM team_members tm LEFT JOIN users u ON tm.member_user_id = u.id WHERE tm.team_owner_id = $1 ORDER BY tm.invited_at DESC`, [req.user.id]);
    res.json({ isTeamOwner: true, members: members.map(m => ({ id: m.id, email: m.member_email, role: m.role, status: m.accepted_at ? 'active' : 'pending', invitedAt: m.invited_at, acceptedAt: m.accepted_at, businessName: m.business_name })), maxMembers: 5 });
  } catch (error) { res.status(500).json({ error: 'Failed to get team members' }); }
});

app.post('/api/team/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.subscription_plan !== 'unlimited') return res.status(403).json({ error: 'Team features are only available for Unlimited plan', upgrade: true });
    if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Valid email is required' });
    if (email.toLowerCase() === user.email.toLowerCase()) return res.status(400).json({ error: 'You cannot invite yourself' });
    const memberCount = await dbGet('SELECT COUNT(*) as count FROM team_members WHERE team_owner_id = $1', [req.user.id]);
    if (parseInt(memberCount.count) >= 5) return res.status(400).json({ error: 'Maximum 5 team members allowed' });
    const existing = await dbGet('SELECT * FROM team_members WHERE team_owner_id = $1 AND member_email = $2', [req.user.id, email.toLowerCase()]);
    if (existing) return res.status(400).json({ error: 'This email has already been invited' });
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const existingUser = await dbGet('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    await dbQuery(`INSERT INTO team_members (team_owner_id, member_email, member_user_id, role, invite_token) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, email.toLowerCase(), existingUser?.id || null, role, inviteToken]);
    if (resend) { try { await resend.emails.send({ from: 'ReviewResponder <noreply@reviewresponder.app>', to: email, subject: `${user.business_name || user.email} invited you to their team`, html: `<h2>You've been invited!</h2><p>${user.business_name || user.email} invited you to their ReviewResponder team.</p><p><a href="${process.env.FRONTEND_URL}/join-team?token=${inviteToken}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Accept</a></p>` }); } catch (e) {} }
    res.status(201).json({ success: true, message: `Invitation sent to ${email}`, inviteToken: resend ? null : inviteToken });
  } catch (error) { res.status(500).json({ error: 'Failed to invite team member' }); }
});

app.post('/api/team/accept', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Invite token is required' });
    const invitation = await dbGet(`SELECT tm.*, u.email as owner_email, u.business_name as owner_business FROM team_members tm JOIN users u ON tm.team_owner_id = u.id WHERE tm.invite_token = $1 AND tm.accepted_at IS NULL`, [token]);
    if (!invitation) return res.status(404).json({ error: 'Invalid or expired invitation' });
    const currentUser = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (currentUser.email.toLowerCase() !== invitation.member_email.toLowerCase()) return res.status(403).json({ error: 'This invitation was sent to a different email address' });
    await dbQuery(`UPDATE team_members SET accepted_at = CURRENT_TIMESTAMP, member_user_id = $1, invite_token = NULL WHERE id = $2`, [req.user.id, invitation.id]);
    res.json({ success: true, message: `You've joined ${invitation.owner_business || invitation.owner_email}'s team!` });
  } catch (error) { res.status(500).json({ error: 'Failed to accept invitation' }); }
});

app.delete('/api/team/:memberId', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.params;
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.subscription_plan !== 'unlimited') return res.status(403).json({ error: 'Team features are only available for Unlimited plan' });
    const member = await dbGet('SELECT * FROM team_members WHERE id = $1 AND team_owner_id = $2', [memberId, req.user.id]);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    await dbQuery('DELETE FROM team_members WHERE id = $1', [memberId]);
    res.json({ success: true, message: 'Team member removed' });
  } catch (error) { res.status(500).json({ error: 'Failed to remove team member' }); }
});

app.get('/api/team/my-team', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const tm = await dbGet(`SELECT tm.*, u.email as owner_email, u.business_name as owner_business, u.responses_used, u.responses_limit FROM team_members tm JOIN users u ON tm.team_owner_id = u.id WHERE tm.member_user_id = $1 AND tm.accepted_at IS NOT NULL`, [req.user.id]);
    if (tm) res.json({ isTeamMember: true, teamOwner: { email: tm.owner_email, businessName: tm.owner_business }, role: tm.role, teamUsage: { used: tm.responses_used, limit: tm.responses_limit } });
    else { const c = await dbGet('SELECT COUNT(*) as count FROM team_members WHERE team_owner_id = $1', [req.user.id]); res.json({ isTeamMember: false, isTeamOwner: user.subscription_plan === 'unlimited' && parseInt(c.count) > 0, teamMemberCount: parseInt(c.count) }); }
  } catch (error) { res.status(500).json({ error: 'Failed to get team info' }); }
});

// ============ EMAIL CAPTURE ============

// Capture email from exit-intent popup
app.post('/api/capture-email', async (req, res) => {
  try {
    const { email, discountCode = 'SAVE20', source = 'exit_intent' } = req.body;

    // Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    // Check if email already exists
    const existing = await dbGet(
      'SELECT * FROM email_captures WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existing) {
      console.log(`📧 Email already captured: ${email}`);
      return res.json({ 
        success: true, 
        message: 'Thanks! Check your email for the discount code.',
        discountCode: existing.discount_code 
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
          from: 'ReviewResponder <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome! Here\'s your 20% discount 🎉',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
                .discount-box { background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .discount-code { font-size: 24px; font-weight: bold; color: #4F46E5; }
                .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to ReviewResponder! 🎉</h1>
                </div>
                <div class="content">
                  <p>Hi there!</p>
                  
                  <p>Thanks for your interest in ReviewResponder! As one of our early supporters, here's your exclusive discount:</p>
                  
                  <div class="discount-box">
                    <p>Use code</p>
                    <div class="discount-code">${discountCode}</div>
                    <p>for <strong>20% OFF</strong> your first month!</p>
                  </div>
                  
                  <h3>Why ReviewResponder?</h3>
                  <ul>
                    <li>🤖 AI-powered responses that sound human</li>
                    <li>🌍 50+ languages supported automatically</li>
                    <li>⚡ Generate responses in seconds, not minutes</li>
                    <li>💰 Save hours every week on review management</li>
                  </ul>
                  
                  <p>Ready to transform how you handle customer reviews?</p>
                  
                  <center>
                    <a href="${process.env.FRONTEND_URL}/pricing" class="cta-button">Claim Your Discount</a>
                  </center>
                  
                  <p style="margin-top: 30px;">Have questions? Just reply to this email - we're here to help!</p>
                  
                  <p>Best regards,<br>The ReviewResponder Team</p>
                </div>
              </div>
            </body>
            </html>
          `
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
      discountCode 
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
        requiredPlan: 'professional'
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
      byPlatform: byPlatform.map(p => ({ name: p.platform || 'unknown', value: parseInt(p.count) })),
      overTime: overTime.map(d => ({ date: d.date, responses: parseInt(d.count) })),
      byRating: byRating.map(r => ({ rating: r.rating, count: parseInt(r.count) })),
      insights: {
        avgPerDay: parseFloat(avgPerDay.avg || 0).toFixed(1),
        thisWeek: parseInt(thisWeek.count),
        lastWeek: parseInt(lastWeek.count),
        weeklyChange: parseInt(thisWeek.count) - parseInt(lastWeek.count),
        mostUsedTone
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============== API Key Management Endpoints ==============

// Get user's API keys
app.get('/api/keys', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT subscription_plan, subscription_status FROM users WHERE id = $1', [req.user.id]);

    if (user.subscription_plan !== 'unlimited' || user.subscription_status !== 'active') {
      return res.status(403).json({ error: 'API keys are only available for Unlimited plan subscribers' });
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
    const user = await dbGet('SELECT subscription_plan, subscription_status FROM users WHERE id = $1', [req.user.id]);

    if (user.subscription_plan !== 'unlimited' || user.subscription_status !== 'active') {
      return res.status(403).json({ error: 'API keys are only available for Unlimited plan subscribers' });
    }

    // Check if user already has 5 keys
    const keyCount = await dbGet('SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1', [req.user.id]);
    if (parseInt(keyCount.count) >= 5) {
      return res.status(400).json({ error: 'Maximum 5 API keys allowed. Please delete an existing key first.' });
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
      message: 'Save this API key - it will not be shown again!'
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
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
    const { review_text, review_rating, tone, language, platform } = req.body;

    if (!review_text) {
      return res.status(400).json({ error: 'review_text is required' });
    }

    const user = req.apiKeyUser;
    const selectedTone = tone || 'professional';
    const selectedLanguage = language || 'en';
    const selectedPlatform = platform || 'google';

    const systemPrompt = `You are an expert at writing professional responses to customer reviews.
Business: ${user.business_name || 'A business'}
Business Type: ${user.business_type || 'General'}
${user.business_context ? `Context: ${user.business_context}` : ''}
${user.response_style ? `Style: ${user.response_style}` : ''}

Write a ${selectedTone} response to the following review.
${review_rating ? `The review has a rating of ${review_rating} out of 5 stars.` : ''}
Language: Write the response in ${selectedLanguage}.
Keep the response concise, professional, and helpful.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: review_text }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const generatedResponse = completion.choices[0].message.content;

    // Save to responses table
    await dbQuery(
      `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone) VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, review_text, review_rating || null, selectedPlatform, generatedResponse, selectedTone]
    );

    // Update user's response count
    await dbQuery('UPDATE users SET responses_used = responses_used + 1 WHERE id = $1', [user.id]);

    res.json({
      success: true,
      response: generatedResponse,
      tone: selectedTone,
      language: selectedLanguage,
      platform: selectedPlatform
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
    const existing = await dbGet(
      'SELECT id FROM user_feedback WHERE user_id = $1',
      [req.user.id]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted feedback' });
    }

    // Get user info for display name
    const user = await dbGet('SELECT email, business_name FROM users WHERE id = $1', [req.user.id]);
    const userName = displayName || user.business_name || user.email.split('@')[0];

    // Insert feedback - auto-approved for transparency
    await dbQuery(
      `INSERT INTO user_feedback (user_id, rating, comment, user_name, approved)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [req.user.id, rating, comment || null, userName]
    );

    // Mark user as having submitted feedback
    await dbQuery(
      'UPDATE users SET feedback_submitted = TRUE WHERE id = $1',
      [req.user.id]
    );

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Check if user should see feedback popup
app.get('/api/feedback/status', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT responses_used, feedback_submitted FROM users WHERE id = $1',
      [req.user.id]
    );

    // Show popup after 10 responses, if not already submitted
    const shouldShowPopup = user.responses_used >= 10 && !user.feedback_submitted;

    res.json({
      shouldShowPopup,
      responsesUsed: user.responses_used,
      feedbackSubmitted: user.feedback_submitted
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
      `SELECT rating, comment, user_name, created_at
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

// Drip Email Campaign - Send scheduled emails based on user signup date
// Call this endpoint via cron job (e.g., daily at 9am)
app.post('/api/cron/send-drip-emails', async (req, res) => {
  // Optional: Add a secret key check for security
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const DRIP_SCHEDULE = [0, 2, 5, 10, 20]; // Days after signup
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://review-responder-frontend.onrender.com';

  // Email templates for each day
  const getDripEmail = (day, user) => {
    const templates = {
      0: {
        subject: 'Welcome to ReviewResponder! Let\'s get started 🚀',
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
                <h1>Welcome to ReviewResponder! 🎉</h1>
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

                <p style="margin-top: 30px;">You have <strong>5 free responses</strong> to try it out. No credit card required.</p>

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
        `
      },
      2: {
        subject: 'Quick tip: Get better responses with business context 💡',
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
                <h1>Pro Tip: Personalize Your Responses 💡</h1>
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
        `
      },
      5: {
        subject: 'How\'s it going? Here\'s 50% off to upgrade 🎁',
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
                <h1>Exclusive Offer Just For You! 🎁</h1>
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
                  <li><strong>Starter Plan:</strong> $14.50/mo instead of $29/mo (100 responses)</li>
                  <li><strong>Pro Plan:</strong> $24.50/mo instead of $49/mo (300 responses + analytics)</li>
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
        `
      },
      10: {
        subject: 'Did you know? You can respond in 50+ languages 🌍',
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
                <h1>Feature Spotlight: Multi-Language Support 🌍</h1>
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
        `
      },
      20: {
        subject: 'We\'d love your feedback! (Quick 30-second survey) 📝',
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
                <h1>How Are We Doing? 📝</h1>
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
        `
      }
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
      const eligibleUsers = await dbQuery(`
        SELECT u.id, u.email, u.business_name, u.created_at
        FROM users u
        WHERE u.created_at <= NOW() - INTERVAL '${day} days'
          AND u.email IS NOT NULL
          AND u.email != ''
          AND NOT EXISTS (
            SELECT 1 FROM drip_emails d
            WHERE d.user_id = u.id AND d.email_day = $1
          )
        ORDER BY u.created_at DESC
        LIMIT 100
      `, [day]);

      for (const user of eligibleUsers) {
        const emailContent = getDripEmail(day, user);
        if (!emailContent) continue;

        try {
          if (process.env.NODE_ENV === 'production') {
            await resend.emails.send({
              from: 'ReviewResponder <onboarding@resend.dev>',
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html
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

    res.json({
      success: true,
      message: `Drip campaign processed`,
      sent: sentCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Drip email error:', error);
    res.status(500).json({ error: 'Failed to process drip emails' });
  }
});

// ============ ADMIN ENDPOINTS ============

// Rate limiter for admin endpoints (5 attempts per 15 minutes per IP)
const adminRateLimiter = new Map();
const ADMIN_RATE_LIMIT = 5;
const ADMIN_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

const checkAdminRateLimit = (ip) => {
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

// POST /api/admin/upgrade-user - Upgrade a user to Unlimited plan
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
    const user = await dbGet('SELECT id, email, subscription_plan FROM users WHERE LOWER(email) = LOWER($1)', [email]);

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
      new_plan: 'unlimited'
    });
  } catch (error) {
    console.error('Admin upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
