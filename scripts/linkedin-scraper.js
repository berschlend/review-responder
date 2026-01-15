/**
 * LinkedIn Profile Research Helper
 *
 * IMPORTANT DISCLAIMER:
 * ---------------------
 * This tool is intended for PERSONAL RESEARCH ONLY.
 * LinkedIn's Terms of Service prohibit automated scraping.
 *
 * USE RESPONSIBLY:
 * - Use only for manual research assistance
 * - Respect rate limits and add delays
 * - Do not use for spam or mass automation
 * - Consider using LinkedIn Sales Navigator for compliant prospecting
 *
 * The author is not responsible for any misuse of this tool.
 * Use at your own risk and in compliance with all applicable laws.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Delays to simulate human behavior (in milliseconds)
  minDelay: 2000,
  maxDelay: 5000,
  scrollDelay: 1000,

  // Rate limiting
  maxProfilesPerSession: 25, // LinkedIn may flag accounts scraping too much

  // Output
  outputDir: './output',

  // Browser settings
  headless: false, // Set to true for background mode
};

/**
 * Random delay to simulate human behavior
 */
function randomDelay(min = CONFIG.minDelay, max = CONFIG.maxDelay) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Parse LinkedIn search results page
 */
async function parseSearchResults(page) {
  const profiles = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('.reusable-search__result-container');

    cards.forEach(card => {
      try {
        const nameEl = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
        const titleEl = card.querySelector('.entity-result__primary-subtitle');
        const locationEl = card.querySelector('.entity-result__secondary-subtitle');
        const linkEl = card.querySelector('.entity-result__title-text a');

        if (nameEl && linkEl) {
          results.push({
            name: nameEl.innerText.trim(),
            title: titleEl ? titleEl.innerText.trim() : '',
            location: locationEl ? locationEl.innerText.trim() : '',
            profileUrl: linkEl.href.split('?')[0], // Remove query params
            company: '', // Will be extracted from title
          });
        }
      } catch (e) {
        // Skip malformed cards
      }
    });

    return results;
  });

  // Extract company from title (e.g., "Marketing Manager at Company")
  return profiles.map(p => {
    const atMatch = p.title.match(/(?:at|@)\s+(.+?)(?:\s*\||$)/i);
    if (atMatch) {
      p.company = atMatch[1].trim();
    }
    return p;
  });
}

/**
 * Convert profiles to CSV format
 */
function toCSV(profiles) {
  const header = 'Name,Title,Company,Location,Profile URL,Status,Notes\n';
  const rows = profiles
    .map(p => {
      const escape = str => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escape(p.name),
        escape(p.title),
        escape(p.company),
        escape(p.location),
        escape(p.profileUrl),
        '"pending"',
        '""',
      ].join(',');
    })
    .join('\n');

  return header + rows;
}

/**
 * Save results to file
 */
function saveResults(profiles, filename) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const csvPath = path.join(CONFIG.outputDir, `${filename}.csv`);
  const jsonPath = path.join(CONFIG.outputDir, `${filename}.json`);

  fs.writeFileSync(csvPath, toCSV(profiles));
  fs.writeFileSync(jsonPath, JSON.stringify(profiles, null, 2));

  console.log(`\nSaved ${profiles.length} profiles to:`);
  console.log(`  CSV:  ${csvPath}`);
  console.log(`  JSON: ${jsonPath}`);
}

/**
 * Main scraper function
 */
async function scrapeLinkedIn(searchUrl, options = {}) {
  const { maxPages = 3, outputName = 'linkedin-prospects' } = options;

  console.log('\n========================================');
  console.log('  LinkedIn Profile Research Helper');
  console.log('========================================\n');
  console.log('DISCLAIMER: Use responsibly and in compliance with LinkedIn ToS.');
  console.log('This tool is for personal research assistance only.\n');

  // Validate URL
  if (!searchUrl || !searchUrl.includes('linkedin.com')) {
    console.error('Error: Please provide a valid LinkedIn search URL');
    console.log('\nExample:');
    console.log(
      '  node linkedin-scraper.js "https://www.linkedin.com/search/results/people/?keywords=restaurant%20owner"\n'
    );
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: 100, // Slow down actions
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const allProfiles = [];

  try {
    console.log('1. Opening LinkedIn...');
    console.log('   Please log in if prompted.\n');

    await page.goto('https://www.linkedin.com/login');

    // Wait for user to log in manually
    console.log('   Waiting for login... (you have 60 seconds)');
    try {
      await page.waitForURL('**/feed/**', { timeout: 60000 });
      console.log('   Login successful!\n');
    } catch {
      console.log("   Login timeout. Make sure you're logged in, then continue.\n");
    }

    await randomDelay(2000, 3000);

    console.log('2. Navigating to search results...\n');
    await page.goto(searchUrl);
    await randomDelay();

    // Scrape multiple pages
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`3. Scraping page ${pageNum}/${maxPages}...`);

      // Scroll to load all results
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) {
          window.scrollBy(0, 500);
          await new Promise(r => setTimeout(r, 500));
        }
      });

      await randomDelay(CONFIG.scrollDelay, CONFIG.scrollDelay + 1000);

      const pageProfiles = await parseSearchResults(page);
      console.log(`   Found ${pageProfiles.length} profiles on this page`);
      allProfiles.push(...pageProfiles);

      // Check rate limit
      if (allProfiles.length >= CONFIG.maxProfilesPerSession) {
        console.log(`\n   Rate limit reached (${CONFIG.maxProfilesPerSession} profiles).`);
        console.log('   Consider taking a break before continuing.');
        break;
      }

      // Go to next page if available
      if (pageNum < maxPages) {
        const nextButton = await page.$('button[aria-label="Next"]');
        if (nextButton) {
          await nextButton.click();
          await randomDelay();
        } else {
          console.log('   No more pages available.');
          break;
        }
      }
    }

    // Remove duplicates
    const uniqueProfiles = Array.from(new Map(allProfiles.map(p => [p.profileUrl, p])).values());

    console.log(`\n4. Processing ${uniqueProfiles.length} unique profiles...`);

    // Save results
    saveResults(uniqueProfiles, outputName);

    console.log('\n========================================');
    console.log('  Done! Next Steps:');
    console.log('========================================');
    console.log('1. Review the CSV file');
    console.log('2. Remove irrelevant profiles');
    console.log('3. Research each prospect before reaching out');
    console.log('4. Use personalized messages from linkedin-messages.md');
    console.log('5. Track outreach in the tracking spreadsheet\n');
  } catch (error) {
    console.error('\nError:', error.message);

    // Save what we have
    if (allProfiles.length > 0) {
      console.log('\nSaving partial results...');
      saveResults(allProfiles, outputName + '-partial');
    }
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }

  return allProfiles;
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
LinkedIn Profile Research Helper
=================================

Usage:
  node linkedin-scraper.js <search-url> [options]

Options:
  --pages <n>     Number of pages to scrape (default: 3, max recommended: 5)
  --output <name> Output filename (default: linkedin-prospects)
  --help, -h      Show this help message

Example Search URLs:
  Restaurant owners:
    https://www.linkedin.com/search/results/people/?keywords=restaurant%20owner

  Hotel managers:
    https://www.linkedin.com/search/results/people/?keywords=hotel%20manager

  Marketing agencies:
    https://www.linkedin.com/search/results/people/?keywords=marketing%20agency%20owner

How to Use:
  1. Go to LinkedIn in your browser
  2. Perform your search with desired filters
  3. Copy the URL from your browser
  4. Run this script with that URL
  5. Log in when the browser opens
  6. Let the script collect profiles
  7. Review and clean the CSV output

Output Files:
  ./output/linkedin-prospects.csv  - For spreadsheet import
  ./output/linkedin-prospects.json - For programmatic use

IMPORTANT:
  - This tool requires manual login (no credential storage)
  - Respect LinkedIn's rate limits
  - Use for personal research only
  - Consider LinkedIn Sales Navigator for compliant prospecting
`);
    return;
  }

  const searchUrl = args[0];
  const options = {
    maxPages: 3,
    outputName: 'linkedin-prospects',
  };

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    if (args[i] === '--pages' && args[i + 1]) {
      options.maxPages = Math.min(parseInt(args[i + 1]) || 3, 10);
    }
    if (args[i] === '--output' && args[i + 1]) {
      options.outputName = args[i + 1];
    }
  }

  await scrapeLinkedIn(searchUrl, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeLinkedIn, parseSearchResults, toCSV };
