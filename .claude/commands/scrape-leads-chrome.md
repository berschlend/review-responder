# /scrape-leads-chrome - Intelligent Lead Scraper

> **Zweck:** Findet hochwertige Leads via Chrome MCP + Opus 4.5 Evaluation
> **Chrome MCP:** JA - Playwright MCP (Accessibility Tree)
> **Spawnt von:** Burst-1, /priority-mode, oder manuell

---

## WARUM CHROME MCP STATT API?

| Problem mit API-Scraping | Chrome MCP Loesung |
|--------------------------|-------------------|
| 40% falsche Business-Typen | Opus evaluiert jeden einzeln |
| Generic Emails (info@) | Website Deep-Dive fuer Personal Email |
| Ketten-Restaurants inkludiert | Chain Detection Patterns |
| 50% Email-Extraktion Fehler | Multi-Page Email Search |
| $0.02-0.05 pro Lead | **$0 - Kostenlos** |

---

## QUICK START

```bash
# Einfacher Aufruf:
/scrape-leads-chrome munich restaurants 10

# Vollstaendige Syntax:
/scrape-leads-chrome [city] [business_type] [limit]

# Standard-Werte:
# city: munich
# business_type: restaurants
# limit: 10
```

---

## PARAMETER

| Parameter | Werte | Default |
|-----------|-------|---------|
| city | munich, berlin, vienna, dusseldorf, zurich, salzburg, cologne, hamburg, frankfurt | munich |
| business_type | restaurants, hotels, dental, medical, real_estate, home_services, pet_services | restaurants |
| limit | 1-50 | 10 |

---

## DIE 4 STAGES

```
STAGE 1: Google Maps List Scraping
    |
    v
STAGE 2: Business Qualification (Opus 4.5)
    |
    v
STAGE 3: Website Deep-Dive for Personal Email
    |
    v
STAGE 4: Score & Import
```

---

## STAGE 1: GOOGLE MAPS LIST SCRAPING

### 1.1 Browser oeffnen & navigieren

```javascript
// Playwright MCP nutzen (besser als Chrome MCP fuer Scraping)
mcp__playwright__browser_navigate({
  url: `https://www.google.com/maps/search/${BUSINESS_TYPE}+in+${CITY}`
})
```

### 1.2 Warten bis Ergebnisse laden (Smart Wait!)

```javascript
// NICHT: wait(5) - das ist langsam!
// SONDERN: Auf Element warten
mcp__playwright__browser_wait_for({
  text: "results"
})

// Oder Snapshot pruefen
mcp__playwright__browser_snapshot()
```

### 1.3 Liste extrahieren (Accessibility Tree)

```javascript
mcp__playwright__browser_snapshot()
// Gibt: ref_1: "Restaurant Name", ref_2: "4.5 stars, 1,234 reviews", etc.
```

### 1.4 Quick Filter (VOR Detail-Scraping)

| Kriterium | Action |
|-----------|--------|
| < 500 Reviews | SKIP (zu klein) |
| > 4.8 Rating | SKIP (keine negativen Reviews) |
| Falsche Kategorie | SKIP |
| "Chain" im Namen | SKIP |

---

## STAGE 2: OPUS 4.5 QUALIFICATION

### Fuer jeden Business evaluiert Opus:

```javascript
// Pseudo-Code fuer Opus-Evaluation
const evaluation = {
  business_name: "Restaurant XYZ",
  google_data: {
    rating: 4.2,
    reviews: 1847,
    category: "Italian Restaurant"
  },
  checks: {
    // Chain Detection
    chain_patterns: checkChainPatterns(name),
    franchise_keywords: searchForFranchiseKeywords(description),
    location_count: estimateLocationCount(searchResults),

    // Business Type Validation
    category_match: validateCategory(category, target_type),
    menu_keywords: checkMenuForType(menu_text),

    // Pain Level Estimation
    unreplied_negatives: countUnrepliedNegatives(reviews),
    recent_negative_trend: analyzeRecentTrend(reviews),

    // Website Present?
    has_website: !!website_url
  },
  decision: "KEEP" // oder "SKIP"
}
```

### Chain Detection Patterns

**Automatisch SKIP wenn:**
- Name enthaelt: McDonald's, Starbucks, Subway, KFC, Pizza Hut, etc.
- Email-Pattern: `H####@accor.com`, `@ihg.com`, `@marriott.com`
- Beschreibung: "Part of [Brand] Hotels", "Franchise", "Location #"
- Google zeigt: "50+ locations" oder "Chain restaurant"

### Output pro Business:

```json
{
  "qualification_decision": "KEEP",
  "chain_likelihood": 0.1,
  "business_type_confidence": 0.95,
  "estimated_pain_level": "HIGH",
  "unreplied_negatives": 12,
  "proceed_to_stage3": true
}
```

---

## STAGE 3: WEBSITE DEEP-DIVE FOR PERSONAL EMAIL

### 3.1 Page Priority (in dieser Reihenfolge!)

| Seite | URL Pattern | Erfolgsrate |
|-------|-------------|-------------|
| Team | /team, /about-us, /our-team, /unser-team | 80% |
| Impressum | /impressum, /imprint, /legal | 70% (DACH) |
| About | /about, /ueber-uns | 50% |
| Contact | /contact, /kontakt | 30% (meist generic) |

### 3.2 Workflow pro Page

```javascript
// 1. Zur Seite navigieren
mcp__playwright__browser_navigate({ url: `${website}/team` })

// 2. Snapshot statt Screenshot (viel schneller!)
mcp__playwright__browser_snapshot()

// 3. Nach Emails suchen via JavaScript
mcp__playwright__browser_evaluate({
  function: `(() => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
    const text = document.body.innerText;
    const emails = text.match(emailRegex) || [];

    // Nach Owner/Manager Namen suchen
    const ownerPatterns = [
      /(?:owner|inhaber|geschaeftsfuehrer|founder|gruender)\\s*[:.]?\\s*([A-Za-z]+\\s+[A-Za-z]+)/gi,
      /([A-Za-z]+\\s+[A-Za-z]+)\\s*[-–]\\s*(?:owner|inhaber|geschaeftsfuehrer)/gi
    ];

    let owners = [];
    ownerPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        owners.push(match[1]);
      }
    });

    return JSON.stringify({ emails, owners });
  })()`
})
```

### 3.3 Email Classification

| Typ | Pattern | Score-Impact |
|-----|---------|--------------|
| personal_firstname | max@domain.com | +20 |
| personal_fullname | max.mueller@domain.com | +20 |
| creative_personal | prost@, chef@, der@ | +15 |
| generic | info@, contact@, office@ | -20 |
| corporate | H0796@accor.com | -30 |

### 3.4 LinkedIn Fallback (wenn keine Email auf Website)

```javascript
// LinkedIn Search nach Owner
mcp__playwright__browser_navigate({
  url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(BUSINESS_NAME + ' ' + CITY + ' owner')}`
})

// Nach Titeln suchen
// KEEP: Owner, Founder, CEO, Inhaber, Geschaeftsfuehrer
// SKIP: Marketing, Sales, Intern, Assistant
```

---

## STAGE 4: SCORE & IMPORT

### Score Calculation (aus sales.md)

```javascript
function calculateLeadScore(lead) {
  let score = 0;

  // Review Pain Score
  if (lead.reviews >= 2000 && lead.reviews < 5000) score += 50;
  else if (lead.reviews >= 500 && lead.reviews < 2000) score += 40;
  else if (lead.reviews >= 5000 && !lead.isChain) score += 30;
  else if (lead.reviews >= 50 && lead.reviews < 500) score += 10;

  // Email Quality Score
  if (isPersonalEmail(lead.email)) score += 20;
  if (isCreativeEmail(lead.email)) score += 15;
  if (isGmail(lead.email)) score += 10;
  if (isGenericEmail(lead.email)) score -= 20;
  if (isCorporateEmail(lead.email)) score -= 30;

  // Bonus
  if (lead.owner_identified) score += 10;
  if (lead.unreplied_negatives > 5) score += 5;

  // Penalty
  if (lead.chain_likelihood > 0.3) score -= 50;

  return score;
}
```

### Import API Call

```bash
curl -X POST "https://review-responder.onrender.com/api/admin/import-chrome-scraped-leads" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -d '{
    "leads": [
      {
        "business_name": "Trattoria Milano",
        "city": "Munich",
        "address": "Leopoldstr. 123",
        "website": "https://trattoria-milano.de",
        "email": "marco@trattoria-milano.de",
        "email_type": "personal_firstname",
        "owner_name": "Marco Rossi",
        "phone": "+49 89 123456",
        "google_rating": 4.2,
        "google_reviews_count": 1847,
        "unreplied_negatives": 12,
        "chain_likelihood": 0.05,
        "business_type": "restaurant",
        "source": "chrome_maps_scrape",
        "lead_score": 85
      }
    ]
  }'
```

---

## RATE LIMITING & SAFETY

| Regel | Limit | Grund |
|-------|-------|-------|
| Min Zeit zwischen Page Loads | 3 Sekunden | Google TOS |
| Max Businesses pro Stunde | 20 | Anti-Block |
| Max Tabs gleichzeitig | 3 | Performance |
| LinkedIn Searches pro Tag | 20 | Account Safety |

**Bei Captcha/Block:**
1. SOFORT stoppen
2. 10 Minuten warten
3. Neuen Tab oeffnen
4. Mit reduzierter Geschwindigkeit fortfahren

---

## PARALLEL-NUTZUNG

```javascript
// Tab Naming Convention
const tabName = `scraper-${AGENT_ID}-${CITY}-${timestamp}`;

// Jeder Agent eigener Tab
// KEINE Tab-Ueberlappung zwischen Agents
```

---

## ERFOLGSKRITERIEN

| Metrik | Ziel | Warning |
|--------|------|---------|
| Wrong business type | < 5% | > 10% |
| Personal email found | > 80% | < 60% |
| Chain false positives | < 10% | > 15% |
| Score > 60 | > 90% | < 75% |
| Zeit pro Lead | < 3 min | > 5 min |

---

## EXAMPLE SESSION

```bash
# Start:
/scrape-leads-chrome munich restaurants 5

# Output waehrend Scraping:
[1/5] Trattoria Milano - 1,847 reviews - KEEP - marco@trattoria-milano.de (personal) - Score: 85
[2/5] Pizza Hut Munich - 892 reviews - SKIP (chain detected)
[3/5] Pizzeria Bella Italia - 2,103 reviews - KEEP - chef@bellaitalia-muenchen.de (creative) - Score: 78
[4/5] Restaurant Huber - 743 reviews - KEEP - info@restaurant-huber.de (generic) - Score: 45
[5/5] Gasthaus zur Post - 1,567 reviews - KEEP - hans.post@gmail.com (personal gmail) - Score: 72

# Result:
Imported: 4 leads
Skipped: 1 (chain)
Avg Score: 70
Personal Emails: 3/4 (75%)
```

---

## INTEGRATION

**Handoff nach Scrape:**
```bash
# An Burst-4 (Demo Generator)
powershell -File scripts/agent-helpers.ps1 -Action handoff-create -Data '{
  "from": "scrape-leads-chrome",
  "to": "burst-4",
  "type": "leads_ready",
  "data": {
    "count": 4,
    "avg_score": 70,
    "city": "munich"
  }
}'
```

**Wird aufgerufen von:**
- Burst-1 (lead-finder) als Primary Method
- /priority-mode fuer High-Priority Cities
- Manuell fuer spezifische Recherche

**Uebergibt an:**
- Burst-4 (demo-generator) fuer personalisierte Demos
- Burst-2 (cold-emailer) fuer Outreach

---

## FEHLERBEHEBUNG

| Problem | Loesung |
|---------|---------|
| "No results found" | Alternative Suchbegriffe, nur City |
| Google zeigt Captcha | 10 Min Pause, neuer Tab |
| Website nicht erreichbar | Skip, LinkedIn Fallback |
| LinkedIn blockiert Suche | Warte 24h, nur Website nutzen |
| Playwright Connection Error | Chrome neu starten mit Debug Port |
| Score unter 40 | Lead nicht importieren |

---

## WICHTIG: QUALITAET > QUANTITAET

**10 qualifizierte Leads > 100 unqualifizierte Leads**

Chrome MCP ist langsamer als API-Scraping, aber die Lead-Qualitaet ist MASSIV besser:
- Jeder Lead wird von Opus evaluiert
- Chains werden zuverlaessig gefiltert
- Personal Emails werden gefunden
- Score basiert auf echten Daten

**Nutze diesen Command als PRIMARY METHOD fuer Lead-Finding!**
