# ReviewResponder Setup Guide

## Complete Step-by-Step Guide (No Coding Required!)

This guide will walk you through setting up your ReviewResponder SaaS business from scratch. Follow each step carefully.

---

## Prerequisites

Before starting, you need to install:

### 1. Node.js (Required)
1. Go to https://nodejs.org/
2. Download the **LTS version** (the button on the left)
3. Run the installer and click "Next" through all steps
4. Restart your computer after installation

### 2. Verify Installation
Open Command Prompt (Windows) or Terminal (Mac) and type:
```
node --version
```
You should see a version number like `v20.x.x`

---

## Step 1: Get Your API Keys

### OpenAI API Key (For AI Responses)
1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Go to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`) and save it somewhere safe
6. Add credit to your account at https://platform.openai.com/account/billing
   - $10-20 is plenty to start (each response costs ~$0.001)

### Stripe Account (For Payments)
1. Go to https://stripe.com and create an account
2. Complete the account verification (required to accept payments)
3. Go to https://dashboard.stripe.com/apikeys
4. Copy your **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)

---

## Step 2: Create Stripe Products

In your Stripe Dashboard:

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"

### Create 3 Products:

**Product 1: Starter Plan**
- Name: `Starter Plan`
- Description: `100 AI review responses per month`
- Price: `$29.00` / `month` (recurring)
- Click "Save product"
- **Copy the Price ID** (click on the price, it starts with `price_`)

**Product 2: Professional Plan**
- Name: `Professional Plan`
- Description: `300 AI review responses per month`
- Price: `$49.00` / `month` (recurring)
- Click "Save product"
- **Copy the Price ID**

**Product 3: Unlimited Plan**
- Name: `Unlimited Plan`
- Description: `Unlimited AI review responses`
- Price: `$99.00` / `month` (recurring)
- Click "Save product"
- **Copy the Price ID**

---

## Step 3: Run the Setup Wizard

1. Open Command Prompt (Windows) or Terminal (Mac)

2. Navigate to the ReviewResponder folder:
   ```
   cd "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
   ```

3. Run the setup wizard:
   ```
   node setup.js
   ```

4. Enter the information when prompted:
   - Your OpenAI API key
   - Your Stripe Secret key
   - The 3 Price IDs you created

---

## Step 4: Install Dependencies & Start

After running the setup wizard:

1. Install all dependencies:
   ```
   npm run install-all
   ```
   (This takes 2-3 minutes)

2. Start the application:
   ```
   npm start
   ```

3. Open your browser and go to: http://localhost:3000

**Congratulations! Your app is running!**

---

## Step 5: Deploy to Production (Make it Live)

To accept real payments and have customers use your app, you need to deploy it online.

### Option A: Deploy to Railway (Recommended - Easiest)

Railway is the simplest option for beginners:

1. Go to https://railway.app and sign up with GitHub
2. Create a new GitHub account if you don't have one: https://github.com
3. Upload your code to GitHub:
   - Create a new repository at https://github.com/new
   - Name it `review-responder`
   - Follow the instructions to upload your code

4. In Railway:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect it's a Node.js app

5. Add Environment Variables in Railway:
   - Go to your project settings
   - Add each variable from your `backend/.env` file
   - Set `FRONTEND_URL` to your Railway URL

6. Your app will be live at: `https://your-app.railway.app`

### Option B: Deploy to Render (Free Tier Available)

1. Go to https://render.com and create an account
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm run start:backend`
5. Add environment variables from your `.env` file
6. Deploy!

### Option C: Deploy to DigitalOcean App Platform

1. Go to https://www.digitalocean.com/products/app-platform
2. Create an account and add payment method
3. Create new app from GitHub
4. Set environment variables
5. Deploy

---

## Step 6: Set Up Stripe Webhooks (Important for Production!)

Webhooks let Stripe notify your app when payments happen:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Get Customers!

### Marketing Strategies That Work:

**1. Direct Outreach (Fastest Results)**
- Search Google Maps for local businesses
- Look for ones with reviews but no responses
- Send them a personalized email offering a free trial

**Email Template:**
```
Subject: Noticed you're not responding to your Google reviews

Hi [Business Name],

I noticed your business has some reviews on Google that haven't been
responded to. Responding to reviews can increase customer trust and
improve your search ranking.

I built a tool that generates professional responses in seconds using AI.
Would you like to try it free for a week?

Best,
[Your Name]
```

**2. Facebook Groups**
- Join local business owner groups
- Small business groups
- Restaurant owner groups
- Share helpful tips, then mention your tool

**3. Reddit**
- r/smallbusiness
- r/Entrepreneur
- r/restaurantowners
- Provide value first, then soft-pitch

**4. Content Marketing**
- Write blog posts about "How to respond to negative reviews"
- Create YouTube tutorials
- Post on LinkedIn about review management

**5. Local Networking**
- Chamber of Commerce events
- BNI groups
- Local business meetups

---

## Pricing Strategy

Your pricing is already set up:
- **Free**: 20 responses/month (lead generation)
- **Starter ($29/mo)**: 300 responses (small businesses)
- **Professional ($49/mo)**: 800 responses (busy businesses)
- **Unlimited ($99/mo)**: Unlimited (agencies, franchises)

### Revenue Math:
- 10 Starter customers = $290/month
- 15 Professional customers = $735/month
- 5 Unlimited customers = $495/month
- **Total: $1,520/month**

You only need ~25-35 customers to hit $1,000/month!

---

## Troubleshooting

### "npm is not recognized"
- Make sure you installed Node.js and restarted your computer

### "Cannot connect to database"
- The SQLite database creates automatically, no action needed

### "Stripe checkout not working"
- Make sure your Price IDs are correct in the `.env` file
- Check that your Stripe account is fully verified

### "OpenAI API error"
- Verify your API key is correct
- Make sure you have credit in your OpenAI account

### "Port already in use"
- Another app is using port 5000 or 3000
- Close other applications or change the PORT in `.env`

---

## Support & Updates

If you need help:
1. Check the troubleshooting section above
2. Review your `.env` file settings
3. Make sure all API keys are correct

---

## Cost Breakdown

**Monthly Costs:**
- OpenAI API: ~$1-5 (depends on usage, very cheap)
- Hosting: $0-10 (Railway/Render free tiers available)
- Stripe: 2.9% + $0.30 per transaction (only when you make money)
- Domain (optional): ~$12/year

**Total startup cost: $0-20/month**
**Potential revenue: $1,000+/month**

---

## Quick Start Commands Reference

```bash
# Navigate to project
cd "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"

# Run setup wizard
node setup.js

# Install dependencies
npm run install-all

# Start application
npm start

# Build for production
npm run build
```

---

Good luck with your SaaS business! 🚀
