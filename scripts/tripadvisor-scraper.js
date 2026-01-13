/**
 * TripAdvisor Lead Scraper for ReviewResponder
 *
 * Runs automatically via Windows Task Scheduler
 * Scrapes restaurants with email from TripAdvisor and sends to API
 *
 * Usage: node tripadvisor-scraper.js [city]
 * Cities: nyc, la, chicago, london, toronto, houston, phoenix
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Configuration
const ADMIN_KEY = 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U';
const API_URL = 'https://review-responder.onrender.com/api/outreach/add-tripadvisor-leads';

const CITIES = {
  nyc: {
    name: 'New York',
    url: 'https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html'
  },
  la: {
    name: 'Los Angeles',
    url: 'https://www.tripadvisor.com/Restaurants-g32655-Los_Angeles_California.html'
  },
  chicago: {
    name: 'Chicago',
    url: 'https://www.tripadvisor.com/Restaurants-g35805-Chicago_Illinois.html'
  },
  london: {
    name: 'London',
    url: 'https://www.tripadvisor.com/Restaurants-g186338-London_England.html'
  },
  toronto: {
    name: 'Toronto',
    url: 'https://www.tripadvisor.com/Restaurants-g155019-Toronto_Ontario.html'
  },
  houston: {
    name: 'Houston',
    url: 'https://www.tripadvisor.com/Restaurants-g56003-Houston_Texas.html'
  },
  phoenix: {
    name: 'Phoenix',
    url: 'https://www.tripadvisor.com/Restaurants-g31310-Phoenix_Arizona.html'
  }
};

// Get city from command line or use day of week
function getCityForToday() {
  const arg = process.argv[2];
  if (arg && CITIES[arg]) {
    return { key: arg, ...CITIES[arg] };
  }

  // Auto-select based on day of week
  const dayMap = ['phoenix', 'nyc', 'la', 'chicago', 'london', 'toronto', 'houston'];
  const today = new Date().getDay();
  const cityKey = dayMap[today];
  return { key: cityKey, ...CITIES[cityKey] };
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main scraper
async function scrapeTripAdvisor() {
  const city = getCityForToday();
  console.log(`\n🍽️  TripAdvisor Scraper - ${city.name}`);
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log('━'.repeat(50));

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const leads = [];
  let restaurantsChecked = 0;
  const TARGET_LEADS = 20;
  const MAX_RESTAURANTS = 100;

  try {
    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`\n🌐 Navigating to TripAdvisor ${city.name}...`);
    await page.goto(city.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);

    // Close any popups
    try {
      await page.keyboard.press('Escape');
      await sleep(1000);
      // Try clicking close button if exists
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await sleep(1000);
    } catch (e) {}

    // Scroll to load content
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(2000);

    // DEBUG: Save screenshot and HTML
    await page.screenshot({ path: 'scripts/debug-screenshot.png', fullPage: true });
    const html = await page.content();
    require('fs').writeFileSync('scripts/debug-page.html', html);
    console.log('   DEBUG: Saved screenshot and HTML');

    // Count all links on page
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('Restaurant'));
    });
    console.log(`   DEBUG: Found ${allLinks.length} restaurant-related links`);
    if (allLinks.length > 0) {
      console.log('   First 3 links:', allLinks.slice(0, 3));
    }

    // Get restaurant links from the list page
    let pageNum = 1;

    while (leads.length < TARGET_LEADS && restaurantsChecked < MAX_RESTAURANTS) {
      console.log(`\n📄 Page ${pageNum} - Found ${leads.length} leads so far...`);

      // Get all restaurant links on current page - multiple selectors
      const restaurantLinks = await page.evaluate(() => {
        const links = new Set();

        // Try different selectors
        const selectors = [
          'a[href*="/Restaurant_Review-"]',
          '[data-test*="restaurant"] a',
          '.listing a[href*="Restaurant"]',
          'div[data-test-attribute="list-item"] a'
        ];

        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(item => {
            const href = item.href;
            if (href && href.includes('Restaurant_Review') && href.includes('Reviews-')) {
              links.add(href);
            }
          });
        });

        return [...links].slice(0, 30);
      });

      console.log(`   Found ${restaurantLinks.length} restaurants on this page`);

      // Visit each restaurant
      for (const link of restaurantLinks) {
        if (leads.length >= TARGET_LEADS) break;

        restaurantsChecked++;

        try {
          await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(2000);

          // Close popups
          try {
            await page.keyboard.press('Escape');
            await sleep(500);
          } catch (e) {}

          // Extract data
          const data = await page.evaluate(() => {
            const result = { has_email: false };

            // Get name
            const h1 = document.querySelector('h1');
            if (h1) result.name = h1.textContent.trim();

            // Look for email
            const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
            if (emailLinks.length > 0) {
              result.email = emailLinks[0].href.replace('mailto:', '').split('?')[0];
              result.has_email = true;
            }

            // Get rating
            const ratingEl = document.querySelector('[data-test-target="restaurant-detail-info"] svg title');
            if (ratingEl) {
              const match = ratingEl.textContent.match(/(\d+\.?\d*)/);
              if (match) result.rating = parseFloat(match[1]);
            }

            // Get review count
            const reviewEl = document.querySelector('a[href="#REVIEWS"]');
            if (reviewEl) {
              const match = reviewEl.textContent.match(/(\d[\d,]*)/);
              if (match) result.reviews = parseInt(match[1].replace(',', ''));
            }

            // Get address
            const addressEl = document.querySelector('[data-test-target="restaurant-detail-info"] a[href*="maps"]');
            if (addressEl) result.address = addressEl.textContent.trim();

            // Get phone
            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            if (phoneLinks.length > 0) {
              result.phone = phoneLinks[0].href.replace('tel:', '');
            }

            return result;
          });

          if (data.has_email && data.email) {
            leads.push({
              name: data.name,
              email: data.email,
              rating: data.rating,
              reviews: data.reviews,
              address: data.address,
              phone: data.phone,
              city: city.name,
              tripadvisor_url: link
            });
            console.log(`   ✅ ${restaurantsChecked}. ${data.name} - ${data.email}`);
          } else {
            console.log(`   ⏭️  ${restaurantsChecked}. ${data.name || 'Unknown'} - no email`);
          }

        } catch (err) {
          console.log(`   ❌ Error on restaurant ${restaurantsChecked}: ${err.message}`);
        }

        // Small delay between restaurants
        await sleep(1500);
      }

      // Go to next page if needed
      if (leads.length < TARGET_LEADS && restaurantsChecked < MAX_RESTAURANTS) {
        try {
          await page.goto(city.url, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(2000);

          // Click next page
          const nextButton = await page.$('a[data-smoke-attr="pagination-next-arrow"]');
          if (nextButton) {
            await nextButton.click();
            await sleep(3000);
            pageNum++;
          } else {
            console.log('   No more pages');
            break;
          }
        } catch (e) {
          console.log('   Could not navigate to next page');
          break;
        }
      }
    }

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log(`📊 RESULTS:`);
  console.log(`   Restaurants checked: ${restaurantsChecked}`);
  console.log(`   Leads with email: ${leads.length}`);
  console.log(`   Success rate: ${((leads.length / restaurantsChecked) * 100).toFixed(1)}%`);

  // Send to API
  if (leads.length > 0) {
    console.log(`\n📤 Sending ${leads.length} leads to API...`);

    try {
      const response = await fetch(`${API_URL}?key=${ADMIN_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leads,
          send_emails: false,
          campaign: `tripadvisor-${city.key}`
        })
      });

      const result = await response.json();
      console.log(`   ✅ API Response:`, result);
    } catch (err) {
      console.error(`   ❌ API Error:`, err.message);
    }
  }

  console.log('\n✨ Done!\n');
  return leads;
}

// Run
scrapeTripAdvisor().catch(console.error);
