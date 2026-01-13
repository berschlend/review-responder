# TripAdvisor Lead Scraper

Scrape TripAdvisor restaurants for cold email outreach.

## Usage
```
/scrape-leads [city]
```
If no city specified, automatically selects city with fewest leads.

## Cities
- `nyc` - New York City
- `la` - Los Angeles
- `chicago` - Chicago
- `london` - London
- `toronto` - Toronto
- `houston` - Houston
- `phoenix` - Phoenix
- `miami` - Miami
- `sf` - San Francisco
- `boston` - Boston
- `denver` - Denver
- `seattle` - Seattle

## Automatic Mode (Default)

When no city is specified:

1. **Fetch outreach dashboard:**
   ```bash
   curl -s "https://review-responder.onrender.com/api/outreach/dashboard?key=ADMIN_KEY"
   ```

2. **Count leads per city** from `recent_leads` array

3. **Select city with fewest leads** from the list above

4. **Proceed with scraping** for that city

## Instructions

1. **Get browser context:**
   ```
   Use mcp__claude-in-chrome__tabs_context_mcp to get available tabs
   Create new tab if needed with tabs_create_mcp
   ```

2. **Navigate to TripAdvisor:**
   | City | URL |
   |------|-----|
   | nyc | https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html |
   | la | https://www.tripadvisor.com/Restaurants-g32655-Los_Angeles_California.html |
   | chicago | https://www.tripadvisor.com/Restaurants-g35805-Chicago_Illinois.html |
   | london | https://www.tripadvisor.com/Restaurants-g186338-London_England.html |
   | toronto | https://www.tripadvisor.com/Restaurants-g155019-Toronto_Ontario.html |
   | houston | https://www.tripadvisor.com/Restaurants-g56003-Houston_Texas.html |
   | phoenix | https://www.tripadvisor.com/Restaurants-g31310-Phoenix_Arizona.html |
   | miami | https://www.tripadvisor.com/Restaurants-g34438-Miami_Florida.html |
   | sf | https://www.tripadvisor.com/Restaurants-g60713-San_Francisco_California.html |
   | boston | https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html |
   | denver | https://www.tripadvisor.com/Restaurants-g33388-Denver_Colorado.html |
   | seattle | https://www.tripadvisor.com/Restaurants-g60878-Seattle_Washington.html |

3. **Extract restaurant links:**
   ```javascript
   const links = [...new Set(
     Array.from(document.querySelectorAll('a[href*="Restaurant_Review"]'))
       .map(a => a.href.split('?')[0])
       .filter(href => href.includes('Reviews-') && !href.includes('#'))
   )].slice(0, 20);
   JSON.stringify(links);
   ```

4. **For each restaurant, check for email:**
   ```javascript
   const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
   const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
   const addressEl = document.querySelector('a[href*="maps"]');
   const websiteEl = document.querySelector('a[data-tab="website"]') || document.querySelector('a[href*="Restaurant_Review"][data-encoded-url]');

   JSON.stringify({
     has_email: emailLinks.length > 0,
     email: emailLinks.length > 0 ? emailLinks[0].href.replace('mailto:', '').split('?')[0] : null,
     name: document.querySelector('h1')?.textContent?.trim() || '',
     phone: phoneLinks.length > 0 ? phoneLinks[0].href.replace('tel:', '') : null,
     address: addressEl?.textContent?.trim() || null,
     website: websiteEl?.href || null
   });
   ```

5. **If no email on TripAdvisor, try website:**
   - Visit restaurant website if available
   - Look for mailto: links or contact forms
   - Common patterns: info@, contact@, reservations@

6. **Save leads with email to database:**
   ```bash
   curl -s -X POST "https://review-responder.onrender.com/api/outreach/add-tripadvisor-leads?key=ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{"leads": [{"name": "...", "email": "...", "phone": "...", "address": "...", "city": "...", "tripadvisor_url": "..."}], "send_emails": false, "campaign": "tripadvisor-CITY"}'
   ```

   **Note:** Read ADMIN_KEY from `.claude/secrets.local`

7. **Target:** 5-10 leads with email per city (~40% success rate)

8. **Report results:**
   - City scraped (and why selected if auto-mode)
   - Restaurants checked
   - Leads with email found
   - Leads saved to DB

## Multiple Cities Mode

To maximize leads, run multiple cities in sequence:
1. Start with lowest-lead cities
2. Move to next city after 5-10 leads found
3. Continue until target met or all cities done

## Cron Job (Automatic)
Emails are sent automatically daily at 09:00 Berlin time via cron-job.org.
No manual email sending needed.

## Admin Key
Read from `.claude/secrets.local` (ADMIN_SECRET)
