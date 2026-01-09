#!/usr/bin/env node

/**
 * ReviewResponder Setup Script
 * This script helps you configure your application with minimal effort.
 * Run: node setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const generateSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           ReviewResponder Setup Wizard                       ║');
  console.log('║   AI-Powered Review Response Generator for Small Businesses  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('This wizard will help you configure your application.\n');
  console.log('You will need:');
  console.log('  1. An OpenAI API key (https://platform.openai.com/api-keys)');
  console.log('  2. A Stripe account (https://stripe.com)');
  console.log('  3. Stripe API keys and product IDs\n');

  const proceed = await question('Ready to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run this script again when ready.');
    rl.close();
    process.exit(0);
  }

  console.log('\n--- OpenAI Configuration ---\n');
  const openaiKey = await question('Enter your OpenAI API key (starts with sk-): ');

  console.log('\n--- Stripe Configuration ---\n');
  console.log('Get these from https://dashboard.stripe.com/apikeys\n');
  const stripeSecretKey = await question('Enter your Stripe Secret Key (starts with sk_): ');

  console.log('\n--- Stripe Product Setup ---\n');
  console.log('You need to create 3 products in Stripe Dashboard:');
  console.log('  1. Starter Plan - $29/month');
  console.log('  2. Professional Plan - $49/month');
  console.log('  3. Unlimited Plan - $99/month\n');
  console.log('After creating each product, copy the Price ID (starts with price_)\n');

  const starterPriceId = await question('Starter Plan Price ID (or press Enter to skip for now): ');
  const proPriceId = await question('Professional Plan Price ID (or press Enter to skip for now): ');
  const unlimitedPriceId = await question('Unlimited Plan Price ID (or press Enter to skip for now): ');

  console.log('\n--- Stripe Webhook ---\n');
  console.log('For production, you need to set up a webhook at:');
  console.log('https://dashboard.stripe.com/webhooks\n');
  console.log('Webhook endpoint: https://your-domain.com/api/webhooks/stripe');
  console.log('Events to select: checkout.session.completed, customer.subscription.updated,');
  console.log('                  customer.subscription.deleted, invoice.paid\n');
  const webhookSecret = await question('Stripe Webhook Secret (starts with whsec_, or press Enter to skip): ');

  console.log('\n--- Deployment Configuration ---\n');
  const frontendUrl = await question('Frontend URL (press Enter for http://localhost:3000): ') || 'http://localhost:3000';

  // Generate JWT secret
  const jwtSecret = generateSecret();

  // Create .env file
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=${frontendUrl}

# Security - Auto-generated, keep this secret!
JWT_SECRET=${jwtSecret}

# OpenAI API
OPENAI_API_KEY=${openaiKey}

# Stripe Configuration
STRIPE_SECRET_KEY=${stripeSecretKey}
STRIPE_WEBHOOK_SECRET=${webhookSecret || 'whsec_placeholder'}
STRIPE_STARTER_PRICE_ID=${starterPriceId || 'price_placeholder'}
STRIPE_PRO_PRICE_ID=${proPriceId || 'price_placeholder'}
STRIPE_UNLIMITED_PRICE_ID=${unlimitedPriceId || 'price_placeholder'}
`;

  const envPath = path.join(__dirname, 'backend', '.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ Configuration saved to ${envPath}`);

  // Create frontend .env
  const frontendEnvContent = `REACT_APP_API_URL=${frontendUrl === 'http://localhost:3000' ? 'http://localhost:5000/api' : frontendUrl + '/api'}
`;
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log(`✅ Frontend configuration saved to ${frontendEnvPath}`);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    Setup Complete!                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('Next steps:\n');
  console.log('  1. Install dependencies:');
  console.log('     npm run install-all\n');
  console.log('  2. Start the application:');
  console.log('     npm start\n');
  console.log('  3. Open http://localhost:3000 in your browser\n');

  if (!starterPriceId || !proPriceId || !unlimitedPriceId) {
    console.log('⚠️  Remember to update Stripe Price IDs in backend/.env');
    console.log('   after creating your products in Stripe Dashboard.\n');
  }

  if (!webhookSecret) {
    console.log('⚠️  Remember to set up Stripe webhook for production.\n');
  }

  console.log('For deployment instructions, see SETUP_GUIDE.md\n');

  rl.close();
}

main().catch(console.error);
