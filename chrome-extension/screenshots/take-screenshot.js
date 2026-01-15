const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.dirname(__filename);

  // Screenshot PERFECT-marquee.html
  console.log('Taking marquee screenshot...');
  await page.goto('http://localhost:8765/PERFECT-marquee.html');
  await page.waitForTimeout(1000); // Wait for fonts to load

  // Get the .promo element and screenshot just that
  const marqueeElement = await page.locator('.promo');
  await marqueeElement.screenshot({
    path: path.join(screenshotsDir, 'promo-marquee-1400x560.png')
  });
  console.log('Marquee saved: promo-marquee-1400x560.png');

  // Screenshot NEW-promo-small.html
  console.log('Taking small promo screenshot...');
  await page.goto('http://localhost:8765/NEW-promo-small.html');
  await page.waitForTimeout(1000);

  const smallElement = await page.locator('.promo-small');
  await smallElement.screenshot({
    path: path.join(screenshotsDir, 'promo-small-440x280.png')
  });
  console.log('Small promo saved: promo-small-440x280.png');

  await browser.close();
  console.log('Done!');
}

takeScreenshots().catch(console.error);
