/**
 * ReviewResponder Demo Video Recorder
 *
 * Records demo videos for:
 * 1. Extension Demo (Google Maps)
 * 2. Dashboard Demo (Generate Response)
 *
 * Usage: node scripts/record-demo-videos.js
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Config
const EXTENSION_PATH = path.join(__dirname, '..', 'chrome-extension');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'video-recordings');
const DASHBOARD_URL = 'https://tryreviewresponder.com/dashboard';
const GOOGLE_MAPS_SEARCH = 'https://www.google.com/maps/search/restaurants+with+reviews';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Helper: Wait for specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Record Extension Demo Video
 * Shows: Google Maps -> Find Review -> Click Respond -> Extension Panel -> Generate
 */
async function recordExtensionDemo(context) {
  console.log('\n📹 Recording Extension Demo...');

  const page = await context.newPage();

  // Start video recording
  await page.video().path(); // Ensure video is being recorded

  try {
    // Navigate to Google Maps
    console.log('  → Navigating to Google Maps...');
    await page.goto(GOOGLE_MAPS_SEARCH, { waitUntil: 'networkidle', timeout: 30000 });
    await wait(3000);

    // Click on first restaurant
    console.log('  → Clicking on restaurant...');
    const restaurantCard = await page.locator('[role="article"]').first();
    if (await restaurantCard.isVisible()) {
      await restaurantCard.click();
      await wait(2000);
    }

    // Click on Reviews tab
    console.log('  → Opening reviews...');
    const reviewsTab = await page.locator('button:has-text("Rezensionen"), button:has-text("Reviews")').first();
    if (await reviewsTab.isVisible()) {
      await reviewsTab.click();
      await wait(2000);
    }

    // Scroll to find reviews
    await page.mouse.wheel(0, 300);
    await wait(1000);

    // Look for Respond button from extension
    console.log('  → Looking for Respond button...');
    const respondButton = await page.locator('button:has-text("Respond")').first();
    if (await respondButton.isVisible({ timeout: 5000 })) {
      await respondButton.click();
      console.log('  → Clicked Respond button!');
      await wait(3000);

      // Look for Generate button in extension panel
      const generateButton = await page.locator('button:has-text("Generate")').first();
      if (await generateButton.isVisible({ timeout: 5000 })) {
        await generateButton.click();
        console.log('  → Clicked Generate!');
        await wait(5000); // Wait for AI response
      }
    } else {
      console.log('  ⚠️ Respond button not found - extension may not be loaded');
    }

    // Final pause for video
    await wait(2000);

  } catch (error) {
    console.log('  ⚠️ Extension demo error:', error.message);
  }

  await page.close();
  console.log('  ✅ Extension demo recorded');
}

/**
 * Record Dashboard Demo Video
 * Shows: Login -> Paste Review -> Select Tone -> Generate -> Show Response
 */
async function recordDashboardDemo(context) {
  console.log('\n📹 Recording Dashboard Demo...');

  const page = await context.newPage();

  try {
    // Navigate to Dashboard
    console.log('  → Navigating to Dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await wait(2000);

    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Login"), a:has-text("Login")').first();
    if (await loginButton.isVisible({ timeout: 2000 })) {
      console.log('  ⚠️ Not logged in - dashboard demo requires authentication');
      console.log('  → Please login manually first, then re-run the script');
      await page.close();
      return;
    }

    // Scroll down to see Single Response form
    console.log('  → Scrolling to form...');
    await page.mouse.wheel(0, 300);
    await wait(1000);

    // Find and click on review textarea
    console.log('  → Finding review input...');
    const reviewInput = await page.locator('textarea[placeholder*="customer review"], textarea[placeholder*="Paste"]').first();
    if (await reviewInput.isVisible()) {
      await reviewInput.click();
      await wait(500);

      // Type sample review
      console.log('  → Typing sample review...');
      await reviewInput.fill('The food was amazing and the service was excellent! Our waiter Carlos was very attentive and made great recommendations. Highly recommend!');
      await wait(1000);
    }

    // Scroll to see Generate button
    await page.mouse.wheel(0, 200);
    await wait(500);

    // Click Generate Response
    console.log('  → Clicking Generate...');
    const generateButton = await page.locator('button:has-text("Generate Response")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      console.log('  → Waiting for AI response...');
      await wait(6000); // Wait for AI response
    }

    // Scroll to see full response
    await page.mouse.wheel(0, -100);
    await wait(2000);

    // Show tone switching
    console.log('  → Showing tone options...');
    const friendlyButton = await page.locator('button:has-text("Friendly")').first();
    if (await friendlyButton.isVisible()) {
      await friendlyButton.click();
      await wait(3000);
    }

    // Final pause
    await wait(2000);

  } catch (error) {
    console.log('  ⚠️ Dashboard demo error:', error.message);
  }

  await page.close();
  console.log('  ✅ Dashboard demo recorded');
}

/**
 * Main function
 */
async function main() {
  console.log('🎬 ReviewResponder Demo Video Recorder');
  console.log('=====================================\n');

  // Launch browser with extension
  console.log('🚀 Launching Chrome with extension...');
  console.log(`   Extension path: ${EXTENSION_PATH}`);

  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--start-maximized',
    ],
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  console.log('✅ Browser launched with extension\n');

  try {
    // Record Extension Demo
    await recordExtensionDemo(browser);

    // Record Dashboard Demo
    await recordDashboardDemo(browser);

  } catch (error) {
    console.error('❌ Error during recording:', error);
  }

  // Close browser
  await browser.close();

  console.log('\n=====================================');
  console.log('🎉 Recording complete!');
  console.log(`📁 Videos saved to: ${OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('  1. Check the WebM files in the output folder');
  console.log('  2. Convert to MP4 if needed: ffmpeg -i input.webm output.mp4');
  console.log('  3. Add voiceover and music in CapCut/DaVinci');
}

// Run
main().catch(console.error);
