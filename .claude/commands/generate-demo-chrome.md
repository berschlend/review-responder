# /generate-demo-chrome - Chrome MCP Demo Generation

> **Zweck:** Generiert personalisierte Demos durch direktes Google Maps Scraping
> **Chrome MCP:** JA - Umgeht API-Limits komplett
> **Spawnt von:** Burst-4, /enrich-lead-batch, oder manuell

---

## WARUM CHROME MCP?

| API | Limit | Kosten |
|-----|-------|--------|
| Outscraper | 2,500/Monat | ~$0.02/Review |
| SerpAPI | 100/Monat | ~$0.05/Review |
| **Chrome MCP** | **UNLIMITED** | **$0** |

**Chrome MCP = Unbegrenzte Demo-Kapazität**

---

## QUICK START

```bash
# 1. Hole Lead der Demo braucht
curl -s "https://review-responder.onrender.com/api/admin/lead-needs-demo?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

# 2. Chrome MCP - Reviews scrapen (siehe unten)
# 3. AI Responses generieren
# 4. Demo speichern
```

---

## DER FLOW

### Step 1: Lead holen

```bash
LEAD=$(curl -s "https://review-responder.onrender.com/api/admin/lead-needs-demo?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U")
echo $LEAD | jq '.'
```

**Response enthält:**
- `id` - Lead ID
- `business_name`
- `city`
- `email` - Bereits vorhanden (Voraussetzung)
- `google_place_id` - Falls bekannt

---

### Step 2: Chrome MCP - Google Maps öffnen

**2.1 Tab Context holen:**
```
mcp__claude-in-chrome__tabs_context_mcp
→ createIfEmpty: true
```

**2.2 Neuen Tab erstellen:**
```
mcp__claude-in-chrome__tabs_create_mcp
```

**2.3 Zu Google Maps navigieren:**
```
mcp__claude-in-chrome__navigate
→ url: "https://www.google.com/maps/search/[BUSINESS_NAME]+[CITY]"
→ tabId: [TAB_ID]
```

**2.4 Auf Business klicken:**
```
mcp__claude-in-chrome__find
→ query: "[BUSINESS_NAME]"
→ tabId: [TAB_ID]

mcp__claude-in-chrome__computer
→ action: "left_click"
→ ref: [FOUND_REF]
→ tabId: [TAB_ID]
```

**2.5 Warten bis Panel lädt:**
```
mcp__claude-in-chrome__computer
→ action: "wait"
→ duration: 2
→ tabId: [TAB_ID]
```

---

### Step 3: Reviews Section öffnen

**3.1 Reviews Tab finden:**
```
mcp__claude-in-chrome__find
→ query: "reviews"
→ tabId: [TAB_ID]
```

**3.2 Auf Reviews klicken:**
```
mcp__claude-in-chrome__computer
→ action: "left_click"
→ ref: [REVIEWS_REF]
→ tabId: [TAB_ID]
```

**3.3 Warten:**
```
mcp__claude-in-chrome__computer
→ action: "wait"
→ duration: 2
→ tabId: [TAB_ID]
```

---

### Step 4: Reviews scrapen

**4.1 Reviews DOM lesen:**
```
mcp__claude-in-chrome__read_page
→ tabId: [TAB_ID]
→ depth: 10
```

**4.2 Reviews extrahieren via JavaScript:**
```javascript
// mcp__claude-in-chrome__javascript_tool
const reviews = [];
const reviewElements = document.querySelectorAll('[data-review-id], .jftiEf');

reviewElements.forEach((el, i) => {
  if (i >= 10) return; // Max 10 Reviews

  const textEl = el.querySelector('.wiI7pd, .MyEned');
  const ratingEl = el.querySelector('.kvMYJc, [aria-label*="star"]');
  const authorEl = el.querySelector('.d4r55, .WNxzHc');
  const dateEl = el.querySelector('.rsqaWe, .xRkPPb');

  if (textEl) {
    reviews.push({
      text: textEl.innerText.slice(0, 500),
      rating: ratingEl ? parseInt(ratingEl.getAttribute('aria-label')) || 5 : 5,
      author: authorEl ? authorEl.innerText : 'Anonymous',
      date: dateEl ? dateEl.innerText : 'Recent'
    });
  }
});

JSON.stringify(reviews);
```

**4.3 Mehr Reviews laden (optional):**
```
mcp__claude-in-chrome__computer
→ action: "scroll"
→ scroll_direction: "down"
→ scroll_amount: 5
→ tabId: [TAB_ID]
```

---

### Step 5: AI Responses generieren

**5.1 Reviews an Backend senden:**
```bash
RESPONSES=$(curl -X POST "https://review-responder.onrender.com/api/admin/generate-demo-responses" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -d '{
    "reviews": [SCRAPED_REVIEWS],
    "business_name": "[BUSINESS_NAME]"
  }')
echo $RESPONSES
```

---

### Step 6: Demo speichern

```bash
curl -X POST "https://review-responder.onrender.com/api/admin/save-demo-from-chrome" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -d '{
    "lead_id": [LEAD_ID],
    "reviews": [SCRAPED_REVIEWS],
    "responses": [AI_RESPONSES],
    "source": "chrome_maps_scrape"
  }'
```

**Response enthält:**
- `success: true`
- `demo_url` - Die generierte Demo-URL
- `demo_token` - Token für direkten Zugriff

---

### Step 7: Handoff erstellen (für Burst-2)

```bash
powershell -File scripts/agent-helpers.ps1 -Action handoff-create -Agent 4 -Data '{
  "from": "generate-demo-chrome",
  "to": "burst-2",
  "type": "demo_ready",
  "data": {
    "lead_id": [LEAD_ID],
    "demo_url": "[DEMO_URL]",
    "reviews_count": [COUNT]
  },
  "priority": 2
}'
```

---

## REVIEW QUALITÄTS-FILTER

**Gute Reviews für Demos:**
- Mindestens 50 Zeichen Text
- Rating 1-4 (für negative Response Demo)
- Rating 5 mit spezifischem Lob (für positive)

**Reviews skippen:**
- Nur Sterne, kein Text
- Spam/Bot-Reviews ("Great place!!!")
- Nicht-englische Reviews (außer DE)

---

## PARALLEL-NUTZUNG

**Pro Agent eigener Tab:**
- Tab Naming: `demo-gen-[AGENT_ID]-[LEAD_ID]`
- Max 3 Tabs gleichzeitig pro Chrome Session

**Rate Limiting:**
- Min 3 Sekunden zwischen Page Loads
- Max 20 Businesses pro Stunde (Google TOS)

---

## ERFOLGSKRITERIEN

| Metrik | Ziel |
|--------|------|
| Reviews gefunden | >80% der Businesses |
| Reviews pro Business | 5-10 |
| AI Response Qualität | Keine Slop-Phrases |
| Zeit pro Demo | <3 Min |

---

## FEHLERBEHEBUNG

| Problem | Lösung |
|---------|--------|
| Business nicht gefunden | Alternative Suche: nur Name |
| Keine Reviews angezeigt | Scroll down, warte länger |
| Google Captcha | Pause 10 Min, neuer Tab |
| Reviews auf anderem Tab | Direkt-URL mit place_id |
| JavaScript Error | read_page als Fallback |

---

## GOOGLE MAPS DIRECT URL

Wenn place_id bekannt:
```
https://www.google.com/maps/place/?q=place_id:[PLACE_ID]
```

Direkter Reviews Tab:
```
https://www.google.com/maps/place/[BUSINESS]/reviews
```

---

## INTEGRATION

**Wird aufgerufen von:**
- Burst-4 (demo-generator) bei API-Limit
- `/enrich-lead-batch` als Batch-Job
- Manuell für einzelne Leads

**Übergibt an:**
- Burst-2 (cold-emailer) via Handoff
- Burst-5 (hot-lead-chaser) für Follow-Ups

---

## WICHTIG: API BUDGET SCHONEN

**Chrome MCP ist der PRIMARY PATH für Demos!**

```
Priority Order:
1. Chrome MCP (dieser Command) - KOSTENLOS
2. Review Cache - Wenn vorhanden
3. Outscraper API - Wenn Cache miss
4. SerpAPI - Letzter Ausweg
```

**Burst-4 sollte IMMER zuerst /generate-demo-chrome spawnen!**
