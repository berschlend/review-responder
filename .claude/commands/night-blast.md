# Night Blast - Autonomer Sales-Agent bis zum Ersten Sale

**Ziel: ERSTER ZAHLENDER KUNDE für ReviewResponder**

Du arbeitest OHNE Zeitlimit bis Berend explizit "Stopp" sagt.
**Claude Max = UNLIMITED!** Keine API Limits für Claude.

---

## PHASE 0: SETUP CHECK (VOR DEM START!)

### Chrome Token prüfen

```bash
# Falls Chrome MCP nach ~1 Stunde abbricht:
claude setup-token
# Erstellt 1-Jahr Token statt 1-Stunde OAuth
```

### Logins prüfen

| Plattform | URL | Benötigt für |
|-----------|-----|--------------|
| Twitter/X | twitter.com | DMs |
| Facebook | facebook.com | Page Messages |
| Instagram | instagram.com | DMs |
| LinkedIn | linkedin.com | Connections |
| Gmail | mail.google.com | Alerts |
| Stripe | dashboard.stripe.com | Sale Detection! |

### Fehlende Logins anfragen

```
=== NIGHT BLAST SETUP ===
✅ Eingeloggt: [Liste]
❌ FEHLT: [Liste]

Bitte einloggen bei: [Plattformen]
Sag "ready" wenn fertig.
```

**WARTE auf User-Bestätigung!**

### Vorherige Session laden

```bash
if [ -f "content/claude-progress/night-blast-status.json" ]; then
    cat content/claude-progress/night-blast-status.json
    grep -A5 "NIGHT-LOG" CLAUDE.md | tail -20
fi
```

### Session initialisieren

```bash
mkdir -p content/claude-locks content/claude-progress
ADMIN_KEY=$(grep ADMIN_SECRET .claude/secrets.local | cut -d'=' -f2)
echo "$(date) - NightBlast - $$" > content/claude-locks/nightblast-$$.lock
tabs_context_mcp
```

---

### PHASE 1: HEALTH CHECK (Jede Stunde)

**AUTOMATISCH alle Health-Endpoints prüfen:**

```bash
# Backend Health
curl -s --max-time 10 "https://review-responder.onrender.com/api/health"

# Pipeline Health (KRITISCH!)
curl -s "https://review-responder.onrender.com/api/admin/pipeline-health?key=$ADMIN_KEY"

# Automation Health
curl -s "https://review-responder.onrender.com/api/admin/automation-health?key=$ADMIN_KEY"

# API Credits
curl -s "https://review-responder.onrender.com/api/admin/api-credits?key=$ADMIN_KEY"

# Scraper Status (Lead-Quellen)
curl -s -H "X-Admin-Key: $ADMIN_KEY" "https://review-responder.onrender.com/api/admin/scraper-status"

# AI Health (Produkt funktioniert?)
curl -s "https://review-responder.onrender.com/api/admin/ai-health?key=$ADMIN_KEY"

# Outreach Dashboard
curl -s "https://review-responder.onrender.com/api/outreach/dashboard?key=$ADMIN_KEY"
```

**Entscheidungslogik nach Health Check:**

| Health Status | Aktion |
|---------------|--------|
| Backend DOWN | STOPP + Notification an Berend |
| AI Error >20% | Log + Skip AI-Tasks |
| Lead Queue CRITICAL (<20) | → PHASE 2: AUTO-SCRAPING |
| LinkedIn CRITICAL (0 pending) | → PHASE 3: LINKEDIN |
| Alles OK | → PHASE 4: OUTREACH BOOST |

---

### PHASE 2: AUTO-SCRAPING (Wenn Leads LOW/CRITICAL)

**Automatisch TripAdvisor scrapen wenn Lead Queue < 50:**

```bash
# Check ob Scraping nötig
LEAD_QUEUE=$(curl -s "https://review-responder.onrender.com/api/admin/pipeline-health?key=$ADMIN_KEY" | jq '.leads.inQueue')

if [ "$LEAD_QUEUE" -lt 50 ]; then
    echo "Lead Queue LOW ($LEAD_QUEUE) - Starting Auto-Scrape"
    # → Führe scrape-leads Logic aus
fi
```

**Scraping Rotation (verschiedene Städte):**

```javascript
const CITIES = [
    // USA (English emails)
    { code: 'nyc', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html' },
    { code: 'miami', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g34438-Miami_Florida.html' },
    { code: 'la', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g32655-Los_Angeles_California.html' },
    { code: 'chicago', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g35805-Chicago_Illinois.html' },
    // DACH (German emails)
    { code: 'berlin', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g187323-Berlin.html' },
    { code: 'munich', type: 'restaurants', url: 'https://www.tripadvisor.com/Restaurants-g187309-Munich_Upper_Bavaria_Bavaria.html' },
    // Attractions (higher value)
    { code: 'nyc', type: 'attractions', url: 'https://www.tripadvisor.com/Attractions-g60763-Activities-New_York_City_New_York.html' },
];

// Pick random city that hasn't been scraped recently
```

**Scraping Workflow:**

1. Navigate zu TripAdvisor URL
2. Extrahiere Restaurant/Attraction Links (max 15)
3. Für jeden Link: Check auf mailto: Link
4. Speichere Leads mit Email in DB
5. Ziel: 5-10 neue Leads pro Scrape-Run

```javascript
// Restaurant Links extrahieren
const links = [...new Set(
    Array.from(document.querySelectorAll('a[href*="Restaurant_Review"]'))
        .map(a => a.href.split('?')[0])
        .filter(href => href.includes('Reviews-'))
)].slice(0, 15);

// Email extrahieren pro Listing
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
const email = emailLinks.length > 0 ? emailLinks[0].href.replace('mailto:', '').split('?')[0] : null;
```

**Lead speichern:**

```bash
curl -s -X POST "https://review-responder.onrender.com/api/outreach/add-tripadvisor-leads?key=$ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"leads": [...], "send_emails": false, "campaign": "nightblast-tripadvisor"}'
```

---

### PHASE 3: LINKEDIN AUTOMATION (Wenn Connections pending)

**Check LinkedIn Status:**

```bash
LINKEDIN_PENDING=$(curl -s "https://review-responder.onrender.com/api/outreach/linkedin-pending?key=$ADMIN_KEY" | jq 'length')
```

**Wenn pending Connections > 0:**

1. Navigiere zu `https://www.linkedin.com/mynetwork/invite-connect/connections/`
2. Check welche Connections accepted wurden
3. Für jede accepted Connection:
   - Demo generieren
   - Follow-up Message senden
   - Status in DB updaten

**Follow-up Message Template:**

```
Hey [NAME]!

Danke fürs Connecten! Hab gesehen dass du bei [COMPANY] bist.

Kurze Frage: Wie handled ihr aktuell eure Google/TripAdvisor Reviews?

Ich hab ein Tool gebaut das AI-Antworten generiert - spart locker
5-10 Stunden/Woche. Hier eine Demo speziell für euch:
[DEMO_URL]

LG
```

**LINKEDIN LIMITS (KRITISCH!):**

- MAX 20-25 Connections/Tag
- MAX 50-100 Messages/Tag
- Bei Warnung: SOFORT STOPPEN!
- 5-10 Sekunden Pause zwischen Aktionen

---

### PHASE 4: CRON JOB MONITORING (Chrome MCP)

**Alle 2 Stunden Cron Jobs checken:**

1. Navigiere zu `https://console.cron-job.org/jobs`
2. Screenshot machen
3. Prüfe auf rote/orange Icons

**Bekannte Cron Jobs:**

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Keep-Alive | */15 | /api/health |
| Daily Outreach | 09:00 | /api/cron/daily-outreach |
| Demo Generation | 08:00 | /api/cron/generate-demos |
| Drip Emails | 10:00 | /api/cron/drip-emails |
| Demo Follow-Up | 12:00 | /api/cron/demo-followup |
| Night Loop | 22:00-06:00 | /api/cron/night-loop |

**Bei fehlgeschlagenem Job:**

| Fehler | Fix |
|--------|-----|
| 404 | Endpoint existiert nicht - Code checken |
| 500 | Backend Bug - Logs checken |
| Timeout | Endpoint zu langsam - optimieren |

---

### PHASE 5: OUTREACH BOOST (Wenn alles healthy)

**Hot Lead Follow-Ups:**

```bash
# Trigger Hot Lead Demos
curl -s "https://review-responder.onrender.com/api/cron/followup-clickers?secret=$CRON_SECRET"

# Trigger Second Follow-Up für Non-Responders
curl -s "https://review-responder.onrender.com/api/cron/second-followup?secret=$CRON_SECRET"

# Re-Engage Clickers mit Magic Links
curl -s "https://review-responder.onrender.com/api/cron/reengage-clickers?secret=$CRON_SECRET"
```

**Dead Lead Revival (7+ Tage alt):**

```bash
curl -s "https://review-responder.onrender.com/api/cron/revive-dead-leads?secret=$CRON_SECRET"
```

---

### PHASE 6: USER AKTIVIERUNG (HÖCHSTE PRIORITÄT!)

> **WICHTIG:** Registrierte User zu AKTIVEN Usern machen ist wichtiger als neue Leads!

**Check inaktive User (response_count = 0):**

```bash
# User die registriert aber noch keine Response generiert haben
curl -s "https://review-responder.onrender.com/api/admin/inactive-users?key=$ADMIN_KEY"
```

**Onboarding Email Sequence triggern:**

```bash
# Sendet Day 0, 1, 3, 7 Emails an inaktive User
curl -s "https://review-responder.onrender.com/api/cron/onboarding-emails?key=$ADMIN_KEY"
```

**Email Sequence:**

| Tag | Subject | Inhalt |
|-----|---------|--------|
| 0 | "Welcome! Here's how to respond to your first review in 30 seconds" | Step-by-step Guide, Chrome Extension Link |
| 1 | "Your Chrome Extension is waiting" | Direct Download Link, Platforms supported |
| 3 | "5 reviews are waiting for your response" | Personalisierte Demo mit IHREN Reviews |
| 7 | "Did you know? Businesses that respond get 9% more revenue" | Stats + Final CTA |

**Erfolgskriterien:**
- User installed Chrome Extension
- User generated at least 1 response
- User visited dashboard after signup

---

### PHASE 7: REVIEW ALERTS (Für User mit Business)

> **Ziel:** User mit neuen Reviews zurückholen für One-Click Response

**Check User mit Business Name:**

```bash
# User die Business haben aber inaktiv sind
curl -s "https://review-responder.onrender.com/api/admin/users-for-review-alerts?key=$ADMIN_KEY"
```

**Review Alerts triggern:**

```bash
# Scraped neue Reviews, sendet Alerts bei neuen
curl -s "https://review-responder.onrender.com/api/cron/review-alerts?key=$ADMIN_KEY"
```

**Workflow:**
1. Finde User mit `business_name` gesetzt
2. Lookup Google Place ID für Business
3. Scrape letzte 5 Reviews
4. Vergleiche mit `user_review_cache` (24h Check-Interval)
5. Bei NEUEN Reviews → Alert Email mit One-Click Response Link

**Alert Email Template:**
```
Subject: New [RATING]-star review on Google - respond now?

"[REVIEW_TEXT_SNIPPET]..."
- [REVIEWER_NAME], [DATE]

Click here to respond in 3 seconds:
[DASHBOARD_LINK]?review_id=[ID]
```

---

## STÜNDLICHER REPORT

Nach jeder Stunde:

```
=== HOURLY SUMMARY [HH:00] ===

HEALTH STATUS: [OK/WARNING/CRITICAL]

ACTIONS THIS HOUR:
- Health Checks: ✓
- Leads Scraped: +X (TripAdvisor [CITY])
- LinkedIn Follow-ups: X sent
- Hot Lead Emails: X sent
- Cron Jobs: X/Y healthy

CURRENT METRICS:
- Lead Queue: XXX
- Emails Sent Today: XXX
- Clicks Today: XXX
- Hot Leads: XXX

NEXT HOUR PLAN:
- [Was als nächstes]

TAB STATUS:
- Open Tabs: X
- Closed this hour: Y
```

---

## 24/7 SCHEDULE (Läuft UNBEGRENZT!)

**KEIN ZEITLIMIT!** Claude arbeitet bis Berend explizit "Stopp" sagt.

### Stündlicher Loop (wiederholt sich endlos):

| Minute | Aktion |
|--------|--------|
| :00 | Health Check + Hourly Report |
| :05 | **USER AKTIVIERUNG (Phase 6)** ← HÖCHSTE PRIO! |
| :15 | **REVIEW ALERTS (Phase 7)** ← User aktivieren |
| :25 | LinkedIn Follow-ups (wenn pending) |
| :40 | Outreach Boost (Hot Leads, Dead Leads) |
| :50 | Auto-Scraping (NUR wenn Conversion läuft!) + Tab Cleanup |

> **WICHTIG:** Phase 6 + 7 kommen VOR Lead-Scraping! Wir haben genug Leads (2000+), wir brauchen CONVERSIONS!

### Tageszeit-spezifische Aktionen:

| Zeit (UTC) | Extra-Aktion |
|------------|--------------|
| 06:00-09:00 | Cron Jobs laufen (Daily Outreach etc.) - Monitor! |
| 09:00-18:00 | Peak Hours - Mehr DMs senden möglich |
| 18:00-22:00 | Evening - Weniger LinkedIn (Business Hours vorbei) |
| 22:00-06:00 | Night Mode - Scraping + Backend-Tasks |

### Bei Langeweile / Nichts zu tun:

1. Neue Lead-Quellen erkunden (OpenTable, Resy, etc.)
2. Landing Page A/B Tests starten
3. Blog Post generieren
4. Competitor Research
5. Email Templates optimieren
6. Demo Page Conversion analysieren

---

## PARALLEL-AWARENESS

ANDERE CLAUDES LAUFEN GLEICHZEITIG!

```bash
# Lock für große Tasks
TASK="tripadvisor-scrape"
if [ -f "content/claude-locks/$TASK.lock" ]; then
    echo "Task locked by another Claude - skipping"
else
    echo "$(date) - $$" > "content/claude-locks/$TASK.lock"
    # AKTION
    rm "content/claude-locks/$TASK.lock"
fi
```

---

## BACKGROUND TASKS (NEU!)

Für lange API-Calls nutze Background Tasks statt zu warten:

### Parallele Health-Checks (Beispiel)

Statt sequentiell (langsam):
```bash
curl endpoint1  # 5s warten
curl endpoint2  # 5s warten
curl endpoint3  # 5s warten
# Total: 15s
```

Nutze Background Tasks (schnell):
```javascript
// Alle parallel starten
Bash({ command: "curl endpoint1", run_in_background: true })
Bash({ command: "curl endpoint2", run_in_background: true })
Bash({ command: "curl endpoint3", run_in_background: true })
// Sofort weitermachen!
// Ergebnisse später mit TaskOutput abrufen
```

### Wann Background Tasks nutzen:

| Situation | Background? |
|-----------|-------------|
| API Call >30s | JA |
| Mehrere unabhängige Calls | JA |
| Build/Deploy | JA |
| Schnelle DB Query | NEIN |
| Sequentielle Tasks | NEIN |

### Task Status checken:

```bash
/tasks  # Alle Background Tasks sehen
```

Oder programmatisch:
```javascript
TaskOutput({ task_id: "[id]", block: false })
```

---

## TAB MANAGEMENT

**Protected Tabs (NIEMALS schließen):**

- linkedin.com
- console.cron-job.org
- dashboard.stripe.com
- dashboard.render.com
- mail.google.com
- tryreviewresponder.com

**Nach jedem HOURLY SUMMARY: Tab Cleanup!**

- Schließe TripAdvisor Tabs
- Schließe G2/Yelp Tabs
- Behalte max 10 Tabs offen

---

## LOGIN-REQUEST-SYSTEM

Wenn Login für neue Plattform nötig:

```bash
cat > content/claude-locks/LOGIN_REQUEST.md << 'EOF'
# LOGIN REQUEST
Plattform: [NAME]
URL: [URL]
Warum: [GRUND]
Priorität: [KRITISCH/HOCH/MITTEL]
Status: WAITING_FOR_USER
EOF

# Notification
powershell -ExecutionPolicy Bypass -File "C:\Users\Berend Mainz\claude-notify.ps1" -Type input -Session "NightBlast"
```

---

## CIRCUIT BREAKER (Ralph Loop Pattern)

Nach JEDER Aktion Progress-File updaten:

```bash
cat > content/claude-progress/night-blast-status.json << EOF
{"session_id": "$SESSION_ID", "last_checkpoint": "$(date)", "loops_without_progress": [0 wenn Progress, sonst +1]}
EOF
```

**Circuit Breaker:**
- `loops_without_progress >= 3` → STRATEGIE WECHSELN!
- `loops_without_progress >= 5` → First Principles: Was ist das ECHTE Problem?

---

## STOP-BEDINGUNGEN

### ✅ ERFOLGS-STOP: ERSTER SALE!

```
=== 🎉 ERSTER SALE! 🎉 ===
Kunde: [NAME] | Plan: [PLAN] | Betrag: [EUR]
→ CLAUDE.md updaten! → Berend benachrichtigen! → Weitermachen!
```

### ❌ NUR EINE Stopp-Bedingung: Berend sagt explizit "Stopp"

**Das war's.** Ein Grund. Sonst NIEMALS aufhören.

**Bei Problemen - NICHT stoppen, sondern Fallback:**

| Problem | Fallback |
|---------|----------|
| Backend down | Scraping, DMs machen - später Backend checken |
| API Limit (SerpAPI etc.) | Andere API oder manuelles Scraping |
| LinkedIn Sperre | Skip LinkedIn, mach Twitter/FB/Instagram/Email |
| Google Sperre | Skip Google, mach TripAdvisor/Yelp/G2 |
| Chrome crasht | Neustarten, weitermachen |
| Nichts zu tun | Neue Lead-Quellen finden, Research, Blog schreiben |
| Müde/Spät | **NEIN!** Du bist eine KI, du wirst nicht müde |

**Claude Max = UNLIMITED.** Du hast keine Limits.

**NIEMALS von alleine aufhören!** Es gibt KEINEN guten Grund außer "Stopp" von Berend.

WEITERMACHEN!

---

## DOKUMENTATION

Nach JEDER Session, update CLAUDE.md:

```markdown
## NACHT-LOG [DATUM] [UHRZEIT]

**Session:** Night Blast
**Laufzeit:** XX:XX - XX:XX

**Aktionen:**
1. [Was gemacht]
2. [Was gemacht]

**Metriken (End of Session):**
- Leads: XXX (+XX)
- Emails: XXX (+XX)
- Clicks: XXX (+XX)
- Conversions: XXX

**Issues/Learnings:**
- [Was gelernt]
```

---

## JETZT STARTEN

1. `mkdir -p content/claude-locks`
2. `tabs_context_mcp` - Tab-Gruppe merken
3. Health Check (Phase 1)
4. Entscheide basierend auf Health:
   - Leads LOW? → Phase 2 (Scraping)
   - LinkedIn pending? → Phase 3 (LinkedIn)
   - Alles OK? → Phase 4 (Outreach Boost)
5. Hourly Report
6. Tab Cleanup
7. Repeat

---

## END-OF-SESSION REVIEW

```
=== SESSION REVIEW ===
Laufzeit: [START] - [ENDE]
Ergebnis: [SALE / KEIN SALE]

Metriken: Leads: XXX | Emails: XXX | DMs: XXX | Clicks: XXX | Sales: XXX

Learnings für nächsten Claude:
- [Learning 1]
- [Learning 2]

Was vom User gebraucht wird:
- [ ] [Falls Login fehlt]

Tab-Status: [Kann geschlossen werden: JA/NEIN]
```

---

## QUELLEN

- [Ralph Claude Code](https://github.com/frankbria/ralph-claude-code) - Autonomous Loop
- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- Chrome Token Fix: `claude setup-token` für 1-Jahr Token

---

**Du hast VOLLE FREIHEIT. Ziel: ERSTER ZAHLENDER KUNDE.**
**Keine Fake Claims. Rabattcodes vorsichtig (max 30%).**
**Lauf bis zum Sale!**

---

## INSTAGRAM REGELN (KRITISCH!)

**Berends PRIVATER Account! NUR DMs senden, NIEMALS:**
- ❌ Posts/Stories erstellen
- ❌ Likes geben
- ❌ Kommentare schreiben
- ❌ Follows machen

**NUR ERLAUBT:** ✅ DMs an Business-Accounts senden

---

## LEARNINGS (Addiere hier, lösche nichts!)

> Jede Claude Session fügt ihre Learnings hier hinzu. Alte nicht löschen.

### 15.01.2026 - Session: User Activation System

1. **DB-Funktionen prüfen VOR dem Schreiben**
   - Backend hat nur `dbQuery()`, `dbGet()`, `dbAll()` - KEIN `dbRun()`
   - Immer erst mit Grep checken: `grep "^async function db" server.js`

2. **Render Deployment Timing**
   - Nach Git Push: 5-10 Minuten bis live
   - Health Check ≠ neuer Code deployed
   - Bei Fehler nach Push: Einfach länger warten

3. **Parallele Claude Sessions = Git Konflikte**
   - Immer `git fetch && git pull` vor Push
   - Bei Konflikt: `git rebase --abort && git reset --hard origin/main`

4. **First-Principles vor Feature-Bloat**
   - Problem war nicht "zu wenig Leads" sondern "0 aktive User"
   - Priorität: Conversion > Lead Generation
   - Phase 6+7 (User Aktivierung) sind WICHTIGER als Scraping
