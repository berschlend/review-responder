# TripAdvisor Lead Scraper

Scrape TripAdvisor for cold email outreach. Supports restaurants AND attractions.

## Usage

```
/scrape-leads [type] [city]
```

**Types:** `restaurants` (default), `attractions`

## Cities

### USA

| Code    | City          | Restaurants                                                                | Attractions                                                                           |
| ------- | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| nyc     | New York City | https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html | https://www.tripadvisor.com/Attractions-g60763-Activities-New_York_City_New_York.html |
| la      | Los Angeles   | https://www.tripadvisor.com/Restaurants-g32655-Los_Angeles_California.html | https://www.tripadvisor.com/Attractions-g32655-Activities-Los_Angeles_California.html |
| chicago | Chicago       | https://www.tripadvisor.com/Restaurants-g35805-Chicago_Illinois.html       | https://www.tripadvisor.com/Attractions-g35805-Activities-Chicago_Illinois.html       |
| houston | Houston       | https://www.tripadvisor.com/Restaurants-g56003-Houston_Texas.html          | https://www.tripadvisor.com/Attractions-g56003-Activities-Houston_Texas.html          |
| phoenix | Phoenix       | https://www.tripadvisor.com/Restaurants-g31310-Phoenix_Arizona.html        | https://www.tripadvisor.com/Attractions-g31310-Activities-Phoenix_Arizona.html        |
| miami   | Miami         | https://www.tripadvisor.com/Restaurants-g34438-Miami_Florida.html          | https://www.tripadvisor.com/Attractions-g34438-Activities-Miami_Florida.html          |
| dallas  | Dallas        | https://www.tripadvisor.com/Restaurants-g55711-Dallas_Texas.html           | https://www.tripadvisor.com/Attractions-g55711-Activities-Dallas_Texas.html           |
| seattle | Seattle       | https://www.tripadvisor.com/Restaurants-g60878-Seattle_Washington.html     | https://www.tripadvisor.com/Attractions-g60878-Activities-Seattle_Washington.html     |
| denver  | Denver        | https://www.tripadvisor.com/Restaurants-g33388-Denver_Colorado.html        | https://www.tripadvisor.com/Attractions-g33388-Activities-Denver_Colorado.html        |
| boston  | Boston        | https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html   | https://www.tripadvisor.com/Attractions-g60745-Activities-Boston_Massachusetts.html   |

### DACH (Germany, Austria, Switzerland)

| Code       | City       | Restaurants                                                                            | Attractions                                                                                       |
| ---------- | ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| berlin     | Berlin     | https://www.tripadvisor.com/Restaurants-g187323-Berlin.html                            | https://www.tripadvisor.com/Attractions-g187323-Activities-Berlin.html                            |
| munich     | Munich     | https://www.tripadvisor.com/Restaurants-g187309-Munich_Upper_Bavaria_Bavaria.html      | https://www.tripadvisor.com/Attractions-g187309-Activities-Munich_Upper_Bavaria_Bavaria.html      |
| hamburg    | Hamburg    | https://www.tripadvisor.com/Restaurants-g187331-Hamburg.html                           | https://www.tripadvisor.com/Attractions-g187331-Activities-Hamburg.html                           |
| frankfurt  | Frankfurt  | https://www.tripadvisor.com/Restaurants-g187337-Frankfurt_Hesse.html                   | https://www.tripadvisor.com/Attractions-g187337-Activities-Frankfurt_Hesse.html                   |
| cologne    | Cologne    | https://www.tripadvisor.com/Restaurants-g187371-Cologne_North_Rhine_Westphalia.html    | https://www.tripadvisor.com/Attractions-g187371-Activities-Cologne_North_Rhine_Westphalia.html    |
| dusseldorf | Dusseldorf | https://www.tripadvisor.com/Restaurants-g187373-Dusseldorf_North_Rhine_Westphalia.html | https://www.tripadvisor.com/Attractions-g187373-Activities-Dusseldorf_North_Rhine_Westphalia.html |
| stuttgart  | Stuttgart  | https://www.tripadvisor.com/Restaurants-g187291-Stuttgart_Baden_Wurttemberg.html       | https://www.tripadvisor.com/Attractions-g187291-Activities-Stuttgart_Baden_Wurttemberg.html       |
| vienna     | Vienna     | https://www.tripadvisor.com/Restaurants-g190454-Vienna.html                            | https://www.tripadvisor.com/Attractions-g190454-Activities-Vienna.html                            |
| zurich     | Zurich     | https://www.tripadvisor.com/Restaurants-g188113-Zurich.html                            | https://www.tripadvisor.com/Attractions-g188113-Activities-Zurich.html                            |
| geneva     | Geneva     | https://www.tripadvisor.com/Restaurants-g188057-Geneva.html                            | https://www.tripadvisor.com/Attractions-g188057-Activities-Geneva.html                            |

### Other

| Code      | City      | Restaurants                                                                           | Attractions                                                                                      |
| --------- | --------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| london    | London    | https://www.tripadvisor.com/Restaurants-g186338-London_England.html                   | https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html                   |
| toronto   | Toronto   | https://www.tripadvisor.com/Restaurants-g155019-Toronto_Ontario.html                  | https://www.tripadvisor.com/Attractions-g155019-Activities-Toronto_Ontario.html                  |
| paris     | Paris     | https://www.tripadvisor.com/Restaurants-g187147-Paris_Ile_de_France.html              | https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html              |
| amsterdam | Amsterdam | https://www.tripadvisor.com/Restaurants-g188590-Amsterdam_North_Holland_Province.html | https://www.tripadvisor.com/Attractions-g188590-Activities-Amsterdam_North_Holland_Province.html |
| brussels  | Brussels  | https://www.tripadvisor.com/Restaurants-g188644-Brussels.html                         | https://www.tripadvisor.com/Attractions-g188644-Activities-Brussels.html                         |

## Scraping Instructions

### 1. Setup

- Read ADMIN_KEY from `.claude/secrets.local`
- Get browser tab with `tabs_context_mcp`
- Create new tab if needed

### 2. Navigate to TripAdvisor

Use URL from table above based on type and city.

### 3. Extract links

**For Restaurants:**

```javascript
const links = [
  ...new Set(
    Array.from(document.querySelectorAll('a[href*="Restaurant_Review"]'))
      .map(a => a.href.split('?')[0])
      .filter(href => href.includes('Reviews-') && !href.includes('#'))
  ),
].slice(0, 15);
JSON.stringify(links);
```

**For Attractions:**

```javascript
const links = [
  ...new Set(
    Array.from(document.querySelectorAll('a[href*="Attraction_Review"]'))
      .map(a => a.href.split('?')[0])
      .filter(href => href.includes('Reviews-') && !href.includes('#'))
  ),
].slice(0, 15);
JSON.stringify(links);
```

### 4. For each listing, check for email

```javascript
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
const addressEl = document.querySelector('a[href*="maps"]');

JSON.stringify({
  has_email: emailLinks.length > 0,
  email: emailLinks.length > 0 ? emailLinks[0].href.replace('mailto:', '').split('?')[0] : null,
  name: document.querySelector('h1')?.textContent?.trim().split('Someone')[0] || '',
  phone: phoneLinks.length > 0 ? phoneLinks[0].href.replace('tel:', '') : null,
  address: addressEl?.textContent?.trim() || null,
});
```

### 5. Save leads with email to database

```bash
curl -s -X POST "https://review-responder.onrender.com/api/outreach/add-tripadvisor-leads?key=ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leads": [{"name": "...", "email": "...", "phone": "...", "address": "...", "city": "...", "tripadvisor_url": "..."}], "send_emails": false, "campaign": "tripadvisor-TYPE-CITY"}'
```

### 6. Target

- 5-10 leads with email per city
- Restaurants: ~40% email rate
- Attractions: ~30% email rate (commercial venues)

### 7. Report results

- Listings checked
- Leads with email found
- Leads saved to DB

## Email Rates by Type

| Type        | Email Rate | Best For                        |
| ----------- | ---------- | ------------------------------- |
| Restaurants | ~40%       | Local businesses, events        |
| Attractions | ~30%       | Tour operators, venues, museums |
| Hotels      | ~0%        | NOT SUPPORTED (no emails)       |

## Cron Job (Automatic)

Emails are sent automatically daily at 09:00 Berlin time via cron-job.org.
No manual email sending needed.

---

## Platform Comparison (Tested 13.01.2026)

| Platform                    | Status        | Email Rate | Notes                                                   |
| --------------------------- | ------------- | ---------- | ------------------------------------------------------- |
| **TripAdvisor Restaurants** | **WORKS**     | ~40%       | mailto: links on business pages                         |
| **TripAdvisor Attractions** | **WORKS**     | ~30%       | Commercial venues, museums, tours                       |
| TripAdvisor Hotels          | NOT SUPPORTED | 0%         | Only phone numbers                                      |
| OpenTable                   | PARTIAL       | ~50%       | Email in text, not as mailto: (more complex extraction) |
| Yellow Pages                | NOT USEFUL    | 0%         | Only phone numbers                                      |
| BBB                         | NOT USEFUL    | 0%         | Contact form only, no direct email                      |
| Yelp                        | BLOCKED       | -          | Anti-bot protection                                     |
| Google Maps                 | BLOCKED       | -          | Anti-bot protection                                     |
| Booking.com                 | NOT USEFUL    | 0%         | No email addresses shown                                |
| Trustpilot                  | BLOCKED       | -          | Anti-bot protection                                     |
| Zomato                      | NOT AVAILABLE | -          | Left USA market                                         |
| Foursquare                  | NOT USEFUL    | -          | Login required                                          |
| golocal.de                  | NOT USEFUL    | -          | Site errors                                             |

### Why TripAdvisor Works Best

1. **Direct mailto: links** - Easy to extract programmatically
2. **No anti-bot protection** - Pages load without blocking
3. **Good email rate** - ~40% of restaurants have public email
4. **Global coverage** - Works in USA, DACH, and other regions
5. **Multiple categories** - Restaurants AND Attractions supported
