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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // Send email if Resend is configured
    if (resend && process.env.NODE_ENV === 'production') {
      try {
        await resend.emails.send({
          from: 'ReviewResponder <noreply@reviewresponder.app>',
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

// Bulk Response Generation (Paid plans only: Starter/Pro/Unlimited)
app.post('/api/generate-bulk', authenticateToken, async (req, res) => {
  try {
    const { reviews, tone, platform } = req.body;

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
- IMPORTANT: Respond in the same language as the review.

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
          from: 'ReviewResponder <hello@reviewresponder.app>',
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
