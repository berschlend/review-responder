/**
 * ReviewResponder Demo Video Recorder (Landing Page Version)
 *
 * Records video of landing page features - no login required!
 * Duration: ~45 seconds (slightly longer for speed adjustment)
 *
 * Scenes:
 * - 0-5s: Hero section with main value prop
 * - 5-15s: Scroll to feature showcase
 * - 15-25s: Show before/after examples
 * - 25-35s: Scroll to pricing/features
 * - 35-45s: CTA section
 *
 * Usage: node scripts/record-synced-video.js
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Config
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'video-recordings');
const LANDING_URL = 'https://tryreviewresponder.com';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Wait for specified time
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Smooth scroll
async function smoothScroll(page, amount, duration = 1000) {
  const steps = 20;
  const stepAmount = amount / steps;
  const stepDuration = duration / steps;

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepAmount);
    await wait(stepDuration);
  }
}

/**
 * Main recording function
 */
async function recordSyncedVideo() {
  console.log('🎬 ReviewResponder Landing Page Video Recorder');
  console.log('================================================\n');
  console.log('⏱️  Target duration: ~45 seconds\n');
  console.log('📝 This records the LANDING PAGE (no login needed)');
  console.log('   You can sync this with your audio in CapCut/DaVinci\n');

  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Track start time
  const startTime = Date.now();
  const elapsed = () => ((Date.now() - startTime) / 1000).toFixed(1);

  try {
    // ========================================
    // SCENE 1: Hero (0-5 seconds)
    // ========================================
    console.log(`\n[${elapsed()}s] 📍 SCENE 1: Hero Section`);
    await page.goto(LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await wait(5000); // Show hero for 5 seconds

    // ========================================
    // SCENE 2: Feature Showcase (5-15 seconds)
    // ========================================
    console.log(`\n[${elapsed()}s] 📍 SCENE 2: Feature Showcase`);

    // Smooth scroll to features
    await smoothScroll(page, 600, 2000);
    await wait(3000);

    // Scroll a bit more to show more features
    await smoothScroll(page, 400, 1500);
    await wait(4000);

    // ========================================
    // SCENE 3: Before/After Examples (15-25 seconds)
    // ========================================
    console.log(`\n[${elapsed()}s] 📍 SCENE 3: Before/After Examples`);

    // Scroll to examples section
    await smoothScroll(page, 500, 2000);
    await wait(4000);

    // Hover over examples if interactive
    await smoothScroll(page, 300, 1500);
    await wait(3000);

    // ========================================
    // SCENE 4: Pricing/Features (25-35 seconds)
    // ========================================
    console.log(`\n[${elapsed()}s] 📍 SCENE 4: Pricing & Features`);

    // Scroll to pricing
    await smoothScroll(page, 600, 2000);
    await wait(4000);

    // Show pricing cards
    await smoothScroll(page, 300, 1500);
    await wait(3000);

    // ========================================
    // SCENE 5: CTA (35-45 seconds)
    // ========================================
    console.log(`\n[${elapsed()}s] 📍 SCENE 5: CTA Section`);

    // Scroll to footer/CTA
    await smoothScroll(page, 400, 1500);
    await wait(3000);

    // Scroll back to top for final shot
    console.log(`[${elapsed()}s] → Scrolling back to top...`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(4000);

    console.log(`\n[${elapsed()}s] ✅ Recording complete!`);
  } catch (error) {
    console.error('❌ Error during recording:', error.message);
  }

  // Close page and browser
  await page.close();
  await context.close();
  await browser.close();

  // Find the recorded video file
  const videoFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  const latestVideo = videoFiles.sort().pop();

  if (latestVideo) {
    const videoPath = path.join(OUTPUT_DIR, latestVideo);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const newPath = path.join(OUTPUT_DIR, `landing-page-demo-${timestamp}.webm`);
    fs.renameSync(videoPath, newPath);

    console.log('\n================================================');
    console.log('🎉 Video recorded successfully!');
    console.log(`📁 Video saved to: ${newPath}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Import video into CapCut/DaVinci');
    console.log('   2. Import your audio (37 seconds)');
    console.log('   3. Adjust video speed to match audio');
    console.log('   4. Export final video');
  }
}

// Run
recordSyncedVideo().catch(console.error);
