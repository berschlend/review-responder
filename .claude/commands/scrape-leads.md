# TripAdvisor Lead Scraper

Scrape TripAdvisor restaurants for cold email outreach.

## Usage
```
/scrape-leads [city|auto]
```
- No argument or `auto`: Scrapes 3 cities with fewest leads automatically
- `[city]`: Scrapes specific city only

## Cities (20 Total)

### North America
| Code | City | URL |
|------|------|-----|
| nyc | New York City | https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html |
| la | Los Angeles | https://www.tripadvisor.com/Restaurants-g32655-Los_Angeles_California.html |
| chicago | Chicago | https://www.tripadvisor.com/Restaurants-g35805-Chicago_Illinois.html |
| houston | Houston | https://www.tripadvisor.com/Restaurants-g56003-Houston_Texas.html |
| phoenix | Phoenix | https://www.tripadvisor.com/Restaurants-g31310-Phoenix_Arizona.html |
| miami | Miami | https://www.tripadvisor.com/Restaurants-g34438-Miami_Florida.html |
| sf | San Francisco | https://www.tripadvisor.com/Restaurants-g60713-San_Francisco_California.html |
| boston | Boston | https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html |
| denver | Denver | https://www.tripadvisor.com/Restaurants-g33388-Denver_Colorado.html |
| seattle | Seattle | https://www.tripadvisor.com/Restaurants-g60878-Seattle_Washington.html |
| toronto | Toronto | https://www.tripadvisor.com/Restaurants-g155019-Toronto_Ontario.html |
| vancouver | Vancouver | https://www.tripadvisor.com/Restaurants-g154943-Vancouver_British_Columbia.html |

### Europe
| Code | City | URL |
|------|------|-----|
| london | London | https://www.tripadvisor.com/Restaurants-g186338-London_England.html |
| paris | Paris | https://www.tripadvisor.com/Restaurants-g187147-Paris_Ile_de_France.html |
| berlin | Berlin | https://www.tripadvisor.com/Restaurants-g187323-Berlin.html |
| amsterdam | Amsterdam | https://www.tripadvisor.com/Restaurants-g188590-Amsterdam_North_Holland_Province.html |
| barcelona | Barcelona | https://www.tripadvisor.com/Restaurants-g187497-Barcelona_Catalonia.html |
| rome | Rome | https://www.tripadvisor.com/Restaurants-g187791-Rome_Lazio.html |

### Asia-Pacific
| Code | City | URL |
|------|------|-----|
| sydney | Sydney | https://www.tripadvisor.com/Restaurants-g255060-Sydney_New_South_Wales.html |
| singapore | Singapore | https://www.tripadvisor.com/Restaurants-g294265-Singapore.html |

## Auto Mode (Default)

When no city is specified, Claude will:

1. **Fetch current lead counts:**
   ```bash
   curl -s "https://review-responder.onrender.com/api/outreach/dashboard?key=ADMIN_KEY"
   ```

2. **Identify 3 cities with fewest leads** from the list above

3. **Scrape each city sequentially** (5-7 leads per city target)

4. **Report total results** at end

## Scraping Instructions

### 1. Setup
- Read ADMIN_KEY from `.claude/secrets.local`
- Get browser tab with `tabs_context_mcp`
- Create new tab if needed

### 2. Navigate & Extract Links
Navigate to city URL, wait 3s, then:
```javascript
const links = [...new Set(
  Array.from(document.querySelectorAll('a[href*="Restaurant_Review"]'))
    .map(a => a.href.split('?')[0])
    .filter(href => href.includes('Reviews-') && !href.includes('#'))
)].slice(0, 15);
JSON.stringify(links);
```

### 3. For Each Restaurant
Navigate to restaurant page, wait 2s, then:
```javascript
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
const addressEl = document.querySelector('a[href*="maps"]');

JSON.stringify({
  has_email: emailLinks.length > 0,
  email: emailLinks.length > 0 ? emailLinks[0].href.replace('mailto:', '').split('?')[0] : null,
  name: document.querySelector('h1')?.textContent?.trim() || '',
  phone: phoneLinks.length > 0 ? phoneLinks[0].href.replace('tel:', '') : null,
  address: addressEl?.textContent?.trim() || null
});
```

### 4. Save Batch to DB
After collecting 5-7 leads with email per city:
```bash
curl -s -X POST "https://review-responder.onrender.com/api/outreach/add-tripadvisor-leads?key=ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leads": [...], "send_emails": false, "campaign": "tripadvisor-CITY"}'
```

### 5. Move to Next City
Repeat steps 2-4 for next city in queue.

## Efficiency Tips

1. **Stop early** if restaurant has no email - move to next immediately
2. **Skip hotel restaurants** (often use generic hotel emails like @ihg.com)
3. **Target 5-7 leads per city** then move on (don't over-scrape one city)
4. **Batch save** leads after each city (not after each restaurant)

## Target Metrics
- 5-7 leads with email per city
- ~50-70% email found rate on TripAdvisor
- 15-21 new leads per `/scrape-leads` run (3 cities x 5-7 leads)

## Cron Job
Emails are sent automatically daily at 09:00 Berlin via cron-job.org.

## Admin Key
Read from `.claude/secrets.local` (ADMIN_SECRET)
