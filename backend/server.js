require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const Stripe = require('stripe');
const OpenAI = require('openai');
const validator = require('validator');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Database file path
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Global database instance
let db;

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

// Helper functions for sql.js
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function dbInsert(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  saveDatabase();
  return { lastInsertRowid: lastId };
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add columns if they don't exist (for existing databases)
  try {
    db.run(`ALTER TABLE users ADD COLUMN business_type TEXT`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE users ADD COLUMN business_context TEXT`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE users ADD COLUMN response_style TEXT`);
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      review_rating INTEGER,
      review_platform TEXT,
      generated_response TEXT NOT NULL,
      tone TEXT DEFAULT 'professional',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  saveDatabase();
  console.log('📊 Database initialized');
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

// Plan limits
const PLAN_LIMITS = {
  free: { responses: 5, price: 0 },
  starter: { responses: 100, price: 2900, priceId: process.env.STRIPE_STARTER_PRICE_ID },
  professional: { responses: 300, price: 4900, priceId: process.env.STRIPE_PRO_PRICE_ID },
  unlimited: { responses: 999999, price: 9900, priceId: process.env.STRIPE_UNLIMITED_PRICE_ID }
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

    const existingUser = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { business_name: businessName || '' }
    });

    const result = dbInsert(
      `INSERT INTO users (email, password, business_name, stripe_customer_id, responses_limit)
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, businessName || '', customer.id, PLAN_LIMITS.free.responses]
    );

    const token = jwt.sign({ id: result.lastInsertRowid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
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

    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
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

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
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
});

// Update business profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { businessName, businessType, businessContext, responseStyle } = req.body;

    dbRun(
      `UPDATE users SET business_name = ?, business_type = ?, business_context = ?, response_style = ? WHERE id = ?`,
      [businessName || '', businessType || '', businessContext || '', responseStyle || '', req.user.id]
    );

    const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

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

// ============ RESPONSE GENERATION ============

app.post('/api/responses/generate', authenticateToken, async (req, res) => {
  try {
    const { reviewText, reviewRating, platform, tone, businessName, customInstructions } = req.body;

    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    // Check usage limits
    const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

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
    dbInsert(
      `INSERT INTO responses (user_id, review_text, review_rating, review_platform, generated_response, tone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, reviewText, reviewRating || null, platform || 'google', generatedResponse, tone || 'professional']
    );

    dbRun('UPDATE users SET responses_used = responses_used + 1 WHERE id = ?', [req.user.id]);

    const updatedUser = dbGet('SELECT responses_used, responses_limit FROM users WHERE id = ?', [req.user.id]);

    res.json({
      response: generatedResponse,
      responsesUsed: updatedUser.responses_used,
      responsesLimit: updatedUser.responses_limit
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get('/api/responses/history', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const responses = dbAll(
    `SELECT * FROM responses WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );

  const total = dbGet('SELECT COUNT(*) as count FROM responses WHERE user_id = ?', [req.user.id]);

  res.json({
    responses,
    pagination: {
      page,
      limit,
      total: total.count,
      pages: Math.ceil(total.count / limit)
    }
  });
});

// ============ STRIPE BILLING ============

app.post('/api/billing/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLAN_LIMITS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

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
    const user = dbGet('SELECT stripe_customer_id FROM users WHERE id = ?', [req.user.id]);

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      dbRun(
        `UPDATE users SET subscription_status = 'active', subscription_plan = ?, responses_limit = ?, responses_used = 0 WHERE id = ?`,
        [plan, PLAN_LIMITS[plan].responses, userId]
      );
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const user = dbGet('SELECT id FROM users WHERE stripe_customer_id = ?', [subscription.customer]);

      if (user) {
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        dbRun(
          `UPDATE users SET subscription_status = ?, current_period_start = ?, current_period_end = ? WHERE id = ?`,
          [
            status,
            new Date(subscription.current_period_start * 1000).toISOString(),
            new Date(subscription.current_period_end * 1000).toISOString(),
            user.id
          ]
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = dbGet('SELECT id FROM users WHERE stripe_customer_id = ?', [subscription.customer]);

      if (user) {
        dbRun(
          `UPDATE users SET subscription_status = 'inactive', subscription_plan = 'free', responses_limit = ? WHERE id = ?`,
          [PLAN_LIMITS.free.responses, user.id]
        );
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const user = dbGet('SELECT id, subscription_plan FROM users WHERE stripe_customer_id = ?', [invoice.customer]);

      if (user && user.subscription_plan !== 'free') {
        dbRun('UPDATE users SET responses_used = 0 WHERE id = ?', [user.id]);
      }
      break;
    }
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

    // Store support request in database
    db.run(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    saveDatabase();

    dbInsert(
      `INSERT INTO support_requests (name, email, subject, message) VALUES (?, ?, ?, ?)`,
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

app.get('/api/stats', authenticateToken, (req, res) => {
  const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

  const totalResponses = dbGet('SELECT COUNT(*) as count FROM responses WHERE user_id = ?', [req.user.id]);

  const thisMonth = dbGet(
    `SELECT COUNT(*) as count FROM responses WHERE user_id = ? AND created_at >= date('now', 'start of month')`,
    [req.user.id]
  );

  const byPlatform = dbAll(
    `SELECT review_platform, COUNT(*) as count FROM responses WHERE user_id = ? GROUP BY review_platform`,
    [req.user.id]
  );

  const byRating = dbAll(
    `SELECT review_rating, COUNT(*) as count FROM responses WHERE user_id = ? AND review_rating IS NOT NULL GROUP BY review_rating`,
    [req.user.id]
  );

  res.json({
    usage: {
      used: user.responses_used,
      limit: user.responses_limit,
      remaining: user.responses_limit - user.responses_used
    },
    stats: {
      totalResponses: totalResponses.count,
      thisMonth: thisMonth.count,
      byPlatform,
      byRating
    },
    subscription: {
      plan: user.subscription_plan,
      status: user.subscription_status
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
