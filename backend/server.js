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

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

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
        responsesLimit: PLAN_LIMITS.free.responses
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
        subscriptionStatus: user.subscription_status
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
        subscriptionStatus: user.subscription_status
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
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

    // TODO: Send email via Resend/SendGrid in production
    // For now, log the URL (remove in production!)
    console.log(`📧 Password reset requested for ${email}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);

    // In production, you would send an email here:
    // await sendPasswordResetEmail(user.email, resetUrl);

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
    const { reviewText, reviewRating, platform, tone, businessName, customInstructions } = req.body;

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

    // Build business context section
    const businessContextSection = user.business_context ? `
Business Context (use this to personalize your response):
${user.business_context}
` : '';

    const businessTypeSection = user.business_type ? `Business Type: ${user.business_type}` : '';
    const responseStyleSection = user.response_style ? `Preferred Response Style: ${user.response_style}` : '';

    const prompt = `You are a professional customer service expert helping a small business respond to online reviews.

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
- IMPORTANT: Respond in the same language as the review. If the review is in German, respond in German. If in Spanish, respond in Spanish.
${customInstructions ? `- Additional instructions: ${customInstructions}` : ''}

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

    const updatedUser = await dbGet('SELECT responses_used, responses_limit FROM users WHERE id = $1', [req.user.id]);

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
    const { plan } = req.body;

    if (!PLAN_LIMITS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.user.id]);

    const session = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price: PLAN_LIMITS[plan].priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        plan
      }
    });

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
        const user = await dbGet('SELECT id, subscription_plan FROM users WHERE stripe_customer_id = $1', [invoice.customer]);

        if (user && user.subscription_plan !== 'free') {
          await dbQuery('UPDATE users SET responses_used = 0 WHERE id = $1', [user.id]);
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
