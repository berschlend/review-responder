#!/usr/bin/env node

/**
 * ReviewResponder Demo Video Generator
 *
 * Automated demo video creation for Chrome Extension
 * Uses Playwright for browser automation + video recording
 * Combines with audio using FFmpeg
 *
 * Usage:
 *   node index.js --audio path/to/audio.mp3 --output path/to/output.mp4
 *   node index.js --dry-run  # Test without audio
 */

const { chromium } = require('playwright');
const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const S = require('./selectors');
const { getActionsWithTimestamps, DEMO_ACTIONS } = require('./actions');

// Configuration
const CONFIG = {
  extensionPath: path.resolve(__dirname, '../../chrome-extension'),
  defaultDuration: 120, // 2 minutes default
  viewport: { width: 1920, height: 1080 },
  testRestaurantUrl:
    'https://www.google.com/maps/place/Selvático+Sushi+%26+Grill/@52.5086614,13.3289321,17z',
  loginUrl: 'https://tryreviewresponder.com/login',
  // Test account credentials (use env vars in production)
  testEmail: process.env.RR_TEST_EMAIL || 'test@example.com',
  testPassword: process.env.RR_TEST_PASSWORD || 'testpassword',
  // FFmpeg paths (winget installation)
  ffmpegPath: path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe'
  ),
  ffprobePath: path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffprobe.exe'
  ),
};

// Parse command line arguments
program
  .option('-a, --audio <path>', 'Path to audio file (.mp3 or .m4a)')
  .option('-o, --output <path>', 'Output video path', './demo-video.mp4')
  .option('--dry-run', 'Test run without audio merging')
  .option('--duration <seconds>', 'Video duration in seconds', '120')
  .option('--no-login', 'Skip login step (if already logged in)')
  .option('--url <url>', 'Custom restaurant URL to use')
  .parse();

const options = program.opts();

/**
 * Get audio duration using FFprobe
 */
function getAudioDuration(audioPath) {
  try {
    const output = execSync(
      `"${CONFIG.ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(output.trim());
  } catch (error) {
    console.error('Error getting audio duration. Is FFmpeg installed?');
    console.error('Install with: winget install ffmpeg');
    console.error('FFprobe path:', CONFIG.ffprobePath);
    process.exit(1);
  }
}

/**
 * Combine video and audio using FFmpeg
 */
function combineVideoAudio(videoPath, audioPath, outputPath) {
  console.log('\n📼 Combining video and audio...');

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(CONFIG.ffmpegPath, [
      '-y', // Overwrite output
      '-i',
      videoPath, // Video input
      '-i',
      audioPath, // Audio input
      '-c:v',
      'libx264', // Re-encode video to H.264
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac', // Encode audio as AAC
      '-shortest', // Match shortest stream
      outputPath,
    ]);

    ffmpeg.stdout.on('data', data => console.log(data.toString()));
    ffmpeg.stderr.on('data', data => console.log(data.toString()));

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

/**
 * Show click indicator on page
 */
async function showClickIndicator(page, x, y) {
  await page.evaluate(
    ({ x, y }) => {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
      position: fixed;
      left: ${x - 20}px;
      top: ${y - 20}px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #ff4444;
      background: rgba(255, 68, 68, 0.2);
      z-index: 999999;
      pointer-events: none;
      animation: rrClickPulse 0.5s ease-out forwards;
    `;

      // Add animation keyframes if not exists
      if (!document.querySelector('#rr-click-animation')) {
        const style = document.createElement('style');
        style.id = 'rr-click-animation';
        style.textContent = `
        @keyframes rrClickPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `;
        document.head.appendChild(style);
      }

      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 500);
    },
    { x, y }
  );
}

/**
 * Highlight element with border
 */
async function highlightElement(page, selector, duration = 2000) {
  try {
    await page.evaluate(
      ({ selector, duration }) => {
        const el = document.querySelector(selector);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.style.cssText = `
        position: fixed;
        left: ${rect.left - 5}px;
        top: ${rect.top - 5}px;
        width: ${rect.width + 10}px;
        height: ${rect.height + 10}px;
        border: 3px solid #ff6b35;
        border-radius: 8px;
        background: rgba(255, 107, 53, 0.1);
        z-index: 999998;
        pointer-events: none;
        animation: rrHighlightPulse 1s ease-in-out infinite;
      `;

        if (!document.querySelector('#rr-highlight-animation')) {
          const style = document.createElement('style');
          style.id = 'rr-highlight-animation';
          style.textContent = `
          @keyframes rrHighlightPulse {
            0%, 100% { box-shadow: 0 0 10px rgba(255, 107, 53, 0.5); }
            50% { box-shadow: 0 0 25px rgba(255, 107, 53, 0.8); }
          }
        `;
          document.head.appendChild(style);
        }

        document.body.appendChild(highlight);
        setTimeout(() => highlight.remove(), duration);
      },
      { selector, duration }
    );
  } catch (e) {
    console.log(`  [Highlight] Element not found: ${selector}`);
  }
}

/**
 * Smooth mouse movement with easing
 */
async function smoothMouseMove(page, fromX, fromY, toX, toY, duration = 500) {
  const steps = Math.ceil(duration / 16); // ~60fps
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const x = fromX + (toX - fromX) * eased;
    const y = fromY + (toY - fromY) * eased;
    await page.mouse.move(x, y);
    await page.waitForTimeout(16);
  }
}

/**
 * Click with visual indicator
 */
async function clickWithIndicator(page, selector) {
  try {
    const element = await page.waitForSelector(selector, { timeout: 5000 });
    const box = await element.boundingBox();
    if (!box) return false;

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    // Move mouse smoothly to element
    const currentMouse = { x: 960, y: 540 }; // Start from center
    await smoothMouseMove(page, currentMouse.x, currentMouse.y, x, y, 300);

    // Show click indicator
    await showClickIndicator(page, x, y);

    // Perform click
    await page.click(selector);
    return true;
  } catch (e) {
    console.log(`  [Click] Element not found: ${selector}`);
    return false;
  }
}

/**
 * Execute a single action
 */
async function executeAction(page, action, index, total) {
  const percent = Math.round((index / total) * 100);
  console.log(`  [${percent}%] ${action.description || action.type}`);

  switch (action.type) {
    case 'navigate':
      await page.goto(action.url, { waitUntil: 'networkidle' });
      break;

    case 'wait':
      await page.waitForTimeout(action.duration || 1000);
      break;

    case 'click':
      await clickWithIndicator(page, action.selector);
      break;

    case 'hover':
      try {
        const el = await page.waitForSelector(action.selector, {
          timeout: 3000,
        });
        const box = await el.boundingBox();
        if (box) {
          await smoothMouseMove(page, 960, 540, box.x + box.width / 2, box.y + box.height / 2, 300);
        }
      } catch (e) {}
      break;

    case 'scroll':
      if (action.target === 'reviews') {
        // Scroll to reviews section on Google Maps
        await page.evaluate(() => {
          const reviews = document.querySelector('[aria-label*="review"]');
          if (reviews) reviews.scrollIntoView({ behavior: 'smooth' });
        });
      } else if (action.target) {
        await page.evaluate(selector => {
          const el = document.querySelector(selector);
          if (el) el.scrollBy({ top: 200, behavior: 'smooth' });
        }, action.target);
      }
      break;

    case 'highlight':
      await highlightElement(page, action.selector, action.duration || 2000);
      break;

    case 'close':
      // Try clicking close button or pressing Escape
      try {
        const closeBtn = await page.$(
          `${action.selector} .rr-close-btn, ${action.selector} [aria-label="Close"]`
        );
        if (closeBtn) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        await page.keyboard.press('Escape');
      }
      break;

    case 'type':
      if (action.selector && action.text) {
        await page.fill(action.selector, action.text);
      }
      break;
  }
}

/**
 * Login to ReviewResponder
 */
async function login(page) {
  console.log('\n🔐 Logging in to ReviewResponder...');

  await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check if already logged in
  try {
    const dashboardCheck = await page.$('text=Dashboard');
    if (dashboardCheck) {
      console.log('  Already logged in!');
      return true;
    }
  } catch (e) {}

  // Fill login form
  try {
    await page.fill('input[type="email"]', CONFIG.testEmail);
    await page.fill('input[type="password"]', CONFIG.testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  Login successful!');
    return true;
  } catch (e) {
    console.log('  Login failed - continuing anyway');
    return false;
  }
}

/**
 * Main demo recording function
 */
async function recordDemo() {
  console.log('\n🎬 ReviewResponder Demo Video Generator');
  console.log('========================================\n');

  // Determine video duration
  let duration = parseInt(options.duration);
  if (options.audio && !options.dryRun) {
    if (!fs.existsSync(options.audio)) {
      console.error(`Error: Audio file not found: ${options.audio}`);
      process.exit(1);
    }
    duration = getAudioDuration(options.audio);
    console.log(`📢 Audio duration: ${duration.toFixed(1)} seconds`);
  } else {
    console.log(`⏱️ Using default duration: ${duration} seconds`);
  }

  // Get actions with calculated timestamps
  const actions = getActionsWithTimestamps(duration);
  console.log(`📋 ${actions.length} actions to execute\n`);

  // Check extension path
  if (!fs.existsSync(path.join(CONFIG.extensionPath, 'manifest.json'))) {
    console.error(`Error: Extension not found at ${CONFIG.extensionPath}`);
    process.exit(1);
  }

  // Create temp directory for video
  const tempDir = path.resolve(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log('🚀 Launching browser with extension...');

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${CONFIG.extensionPath}`,
      `--load-extension=${CONFIG.extensionPath}`,
      '--start-maximized',
    ],
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: tempDir,
      size: CONFIG.viewport,
    },
  });

  const page = await context.newPage();

  try {
    // Login if needed
    if (options.login !== false) {
      await login(page);
    }

    // Navigate to restaurant page
    const restaurantUrl = options.url || CONFIG.testRestaurantUrl;
    console.log(`\n📍 Navigating to: ${restaurantUrl}`);
    await page.goto(restaurantUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n🎥 Starting demo sequence...');
    const startTime = Date.now();

    // Execute actions based on timestamps
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const targetTime = action.timestamp * 1000; // Convert to ms
      const elapsed = Date.now() - startTime;

      // Wait until the right time
      if (targetTime > elapsed) {
        await page.waitForTimeout(targetTime - elapsed);
      }

      await executeAction(page, action, i, actions.length);
    }

    // Final wait
    const totalElapsed = Date.now() - startTime;
    const remainingTime = duration * 1000 - totalElapsed;
    if (remainingTime > 0) {
      console.log(`\n⏳ Waiting ${(remainingTime / 1000).toFixed(1)}s for video to complete...`);
      await page.waitForTimeout(remainingTime);
    }

    console.log('\n✅ Demo sequence complete!');
  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
  }

  // Close browser and get video
  await context.close();

  // Find the recorded video
  const videoFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    console.error('Error: No video file was recorded');
    process.exit(1);
  }

  const videoPath = path.join(tempDir, videoFiles[videoFiles.length - 1]);
  console.log(`\n📹 Video recorded: ${videoPath}`);

  // Combine with audio if provided
  if (options.audio && !options.dryRun) {
    const outputPath = path.resolve(options.output);
    await combineVideoAudio(videoPath, options.audio, outputPath);
    console.log(`\n🎉 Demo video created: ${outputPath}`);

    // Cleanup temp files
    fs.unlinkSync(videoPath);
    console.log('🧹 Cleaned up temp files');
  } else if (options.dryRun) {
    // Move video to output location
    const outputPath = path.resolve(options.output.replace('.mp4', '.webm'));
    fs.renameSync(videoPath, outputPath);
    console.log(`\n🎉 Dry run complete! Video saved: ${outputPath}`);
  }

  console.log('\n✨ Done!\n');
}

// Run the script
recordDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
