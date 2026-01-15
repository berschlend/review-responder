# /find-email-chrome - Chrome MCP Email Finding

> **Zweck:** Findet hochwertige persönliche Emails via Browser-Automation
> **Chrome MCP:** JA - Hauptmethode
> **Spawnt von:** Burst-1, /enrich-lead-batch, oder manuell

---

## WANN NUTZEN?

- Lead hat nur `info@` oder `contact@` Email
- Lead hat gar keine Email aber eine Website
- Du brauchst Decision-Maker Emails (nicht generische)

---

## QUICK START

```bash
# 1. Hole Lead der Email braucht
curl -s "https://review-responder.onrender.com/api/admin/lead-needs-email?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

# 2. Chrome MCP starten (siehe unten)
# 3. Email speichern (siehe unten)
```

---

## DER FLOW

### Step 1: Lead holen

```bash
LEAD=$(curl -s "https://review-responder.onrender.com/api/admin/lead-needs-email?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U")
echo $LEAD | jq '.'
```

**Response enthält:**
- `id` - Lead ID
- `business_name`
- `website` - Zu scrapende Website
- `city`
- `email` - Aktuelle Email (info@, contact@, oder null)

---

### Step 2: Chrome MCP - Website scrapen

**2.1 Tab Context holen:**
```
mcp__claude-in-chrome__tabs_context_mcp
→ createIfEmpty: true
```

**2.2 Neuen Tab erstellen:**
```
mcp__claude-in-chrome__tabs_create_mcp
```

**2.3 Zur Website navigieren:**
```
mcp__claude-in-chrome__navigate
→ url: [WEBSITE]
→ tabId: [TAB_ID]
```

**2.4 Relevante Seiten checken:**

| Seite | URL Pattern | Wahrscheinlichkeit |
|-------|-------------|-------------------|
| Team | /team, /about-us, /our-team | 80% |
| Impressum | /impressum, /imprint, /legal | 70% (DE) |
| Kontakt | /contact, /kontakt | 50% |
| About | /about, /uber-uns | 40% |

**2.5 Email-Pattern suchen:**
```
mcp__claude-in-chrome__find
→ query: "email address"
→ tabId: [TAB_ID]

mcp__claude-in-chrome__read_page
→ tabId: [TAB_ID]
→ filter: "all"
```

**2.6 Regex für Email:**
```javascript
// Im javascript_tool ausführen
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const pageText = document.body.innerText;
const emails = pageText.match(emailRegex);
emails;
```

---

### Step 3: Email-Qualität bewerten

**Priorität (hoch → niedrig):**

| Typ | Pattern | Score |
|-----|---------|-------|
| Owner/Founder | vorname@domain | 0.95 |
| Manager | vorname.nachname@domain | 0.90 |
| Department | marketing@, sales@ | 0.70 |
| Generic | info@, contact@, hello@ | 0.40 |

**Name-Pattern extrahieren:**
- "Max Mustermann - Owner" → max@domain, max.mustermann@domain
- Umlaute konvertieren: ä→ae, ö→oe, ü→ue, ß→ss

---

### Step 4: LinkedIn Fallback (wenn Website keine Email hat)

**4.1 LinkedIn-Suche:**
```
mcp__claude-in-chrome__navigate
→ url: "https://www.linkedin.com/search/results/people/?keywords=[BUSINESS_NAME]%20[CITY]"
→ tabId: [TAB_ID]
```

**4.2 Decision Maker finden:**
- Titel: Owner, Founder, CEO, General Manager, Inhaber, Geschäftsführer
- Nicht: Marketing, Sales, Intern, Assistant

**4.3 Name → Email Pattern:**
```
FirstName LastName @ [company-domain].com
→ firstname@, firstname.lastname@, f.lastname@
```

---

### Step 5: Email speichern

```bash
curl -X POST "https://review-responder.onrender.com/api/admin/save-found-email" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -d '{
    "lead_id": [LEAD_ID],
    "email": "[FOUND_EMAIL]",
    "source": "website_team_page",
    "confidence": 0.95,
    "owner_name": "[NAME_IF_FOUND]"
  }'
```

**Source-Werte:**
- `website_team_page` - Von /team Seite
- `website_impressum` - Von Impressum
- `website_contact` - Von Kontaktseite
- `linkedin_profile` - Von LinkedIn
- `pattern_guess` - Generiert aus Name

---

### Step 6: Handoff erstellen (für Burst-4)

```bash
# Handoff an Demo Generator
powershell -File scripts/agent-helpers.ps1 -Action handoff-create -Agent 1 -Data '{
  "from": "find-email-chrome",
  "to": "burst-4",
  "type": "email_found",
  "data": {
    "lead_id": [LEAD_ID],
    "email": "[EMAIL]",
    "source": "[SOURCE]",
    "confidence": [CONFIDENCE]
  },
  "priority": 2
}'
```

---

## PARALLEL-NUTZUNG

Dieser Command kann von mehreren Agents parallel genutzt werden.
Jeder Agent sollte eigene Tabs verwenden.

**Tab Naming Convention:**
- `email-finder-[AGENT_ID]-[LEAD_ID]`

---

## ERFOLGSKRITERIEN

| Metrik | Ziel |
|--------|------|
| Persönliche Email gefunden | >60% |
| Confidence Score | >0.80 |
| Zeit pro Lead | <5 Min |
| LinkedIn Fallback nötig | <30% |

---

## FEHLERBEHEBUNG

| Problem | Lösung |
|---------|--------|
| Website nicht erreichbar | Skip, nächster Lead |
| Keine Email auf Website | LinkedIn Fallback |
| LinkedIn blockiert | Warte 5 Min, dann weiter |
| Captcha | Skip Lead, Berend informieren |

---

## INTEGRATION

**Wird aufgerufen von:**
- Burst-1 (lead-finder) bei neuen Leads
- `/enrich-lead-batch` als Batch-Job
- Manuell für einzelne Leads

**Übergibt an:**
- Burst-4 (demo-generator) via Handoff
- Burst-2 (cold-emailer) wenn Demo schon existiert
