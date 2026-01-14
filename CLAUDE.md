# ReviewResponder - Claude Code Memory

> **LIES MICH ZUERST!** Zentrales Gedächtnis für alle Claude Sessions.

---

## QUICK START

**Rolle:** Autonomer Entwickler für ReviewResponder - SaaS für KI-Review-Antworten.
**Ziel:** $1000/Monat durch ~30 zahlende Kunden.

### Regeln
1. Immer testen vor Push
2. Immer committen & pushen nach fertiger Änderung
3. CLAUDE.md updaten nach jeder Session
4. User nur fragen wenn nötig
5. **Nach Deploy:** "Deployed! Frontend/Backend live in ~2-3 Min"

### Workflow
```
CLAUDE.md lesen → TODO.md checken → Task → Testen → Git push → CLAUDE.md updaten
```

### Wichtige Dateien
- **CLAUDE.md** - Technische Docs, Code Style
- **TODO.md** - Aktuelle Tasks, Prioritäten
- **`.claude/secrets.local`** - Admin URLs, API Keys (lokal)

---

## PROJECT TIMELINE

> **Projekt-Start:** 10. Januar 2026 (~5 Tage alt)
> **Aktuelle Phase:** Launch & First Customers

### Meilensteine

| Datum | Meilenstein | Status |
|-------|-------------|--------|
| 10.01.2026 | Projekt gestartet | ✅ |
| 13.01.2026 | Chrome Extension eingereicht | ✅ |
| 14.01.2026 | Conversion System 2.0 live | ✅ |
| TBD | Erster zahlender Kunde | ⏳ |
| TBD | $100 MRR erreicht | ⏳ |
| TBD | $1000 MRR Ziel | ⏳ |
| TBD | Chrome Extension approved | ⏳ |

### Projekt-Alter berechnen
- **Tag 1:** 10.01.2026
- **Heute:** Dynamisch (Claude checkt aktuelles Datum)
- **Formel:** Heute - 10.01.2026 = Projekt-Alter in Tagen

---

## MCPs & TOOLS

| MCP | Beschreibung |
|-----|--------------|
| Memory MCP | Persistentes Gedächtnis |
| Gemini Design MCP | Frontend outsourcen |
| Chrome MCP | Browser Automation (`claude --chrome`) |

### Chrome MCP Regel
> Im Plan Mode **IMMER** markieren: **🌐 CHROME MCP: JA/NEIN**

---

## CODE STYLE

### TypeScript
- NIEMALS `any` oder `enum` - nutze String Unions
- Alle Funktionen brauchen Return-Types

### React
- Functional Components only
- Props typisieren, Hooks für State
- Event Handler: `handle` Prefix

### Naming
- Components: PascalCase
- Hooks: `use` Prefix
- Constants: SCREAMING_SNAKE_CASE

### Git Commits
`feat:` | `fix:` | `chore:` | `docs:` | `refactor:`

---

## LIVE URLS

| Service | URL |
|---------|-----|
| Frontend | https://tryreviewresponder.com |
| Backend | https://review-responder.onrender.com |
| GitHub | https://github.com/berschlend/review-responder |

### Service Dashboards
- **Render:** dashboard.render.com
- **Stripe:** dashboard.stripe.com
- **Cron-job.org:** console.cron-job.org
- **Resend:** resend.com/emails

---

## CRON JOBS (cron-job.org)

| Job | Schedule |
|-----|----------|
| Keep-Alive | */15 * * * * |
| Blog Generation | 06:00 Mo/Mi/Fr |
| Scraper Alerts | 08:00 täglich |
| Demo Generation | 08:00 täglich |
| Twitter Auto-Post | 09:00 täglich |
| Daily Outreach | 09:00 täglich |
| Weekly Summary | 09:00 Montags |
| Drip Emails | 10:00 täglich |
| Pre-Reg Drip | 11:00 täglich |
| Demo Follow-Up | 12:00 täglich |
| **Night Loop** | **22:00-06:00 stündlich** |

### Night Automation (NEU 14.01.2026)
Läuft autonom ohne User-Input:
- **22:00** - Hot Lead Follow-Ups (Demos für Klicker)
- **23:00** - Second Follow-Up ("1 Monat gratis")
- **00:00** - Stats Collection
- **01:00** - Dead Lead Revival ("Problem solved?")
- **02:00** - A/B Test Evaluation
- **03:00-06:00** - Idle

**Endpoints:**
- `/api/cron/night-loop` - Master Endpoint (orchestriert alles)
- `/api/cron/revive-dead-leads` - Reaktiviert 7+ Tage alte Leads
- `/api/cron/ab-test-evaluate` - Bewertet A/B Tests automatisch

---

## CURRENT TASKS

**Stand: 14.01.2026**

### Chrome Web Store
**Status:** Überprüfung läuft (eingereicht 13.01)
- Extension v1.6.1
- Test Account: reviewer@tryreviewresponder.com

### USER TODO:
- [ ] Demo-Videos aufnehmen (Main 60s, Extension 30s, Bulk 30s)
- [ ] Reddit API Keys holen
- [ ] Google Indexierung für 36 URLs (5-10/Tag)
- [ ] Snov.io API Keys in Render

### SEO Landing Pages
- **46+ live** (Plattformen + Branchen)
- Email-Capture → 4-Email Drip über 14 Tage

### Outreach Metriken (14.01 - BEREINIGT)
- **528 Leads**, **499 Emails**
- **~0% echte Opens** (26% sind Bot-Scans, ~3 Sek nach Versand)
- **3.4% Click Rate** (17 echte Klicks)
- **0 Conversions** ← HAUPTPROBLEM

**Erkenntnis:** Open-Rate ist unzuverlässig (Email-Server scannen Pixel).
Click-Rate ist die echte Metrik. 17 Leute haben geklickt → Demo Attack!

---

## LEARNINGS

### Email Deliverability
- "Hey" statt "Hallo" → Primary Inbox
- Keine Emojis, keine Marketing-Floskeln

### AI Response Qualität (Anti-Slop System)

**Datei:** `backend/server.js` → `generateDemoResponse()`
**Blacklist:** `backend/promptExamples.js` → `AI_SLOP_PHRASES`, `AI_SLOP_WORDS`

**Core Principles:**
1. Reviewer BY NAME ansprechen (firstName extrahieren)
2. EINE spezifische Sache aus Review referenzieren
3. VOLLER Business Name am Ende (" - Business Name")
4. Kurz: 1-2 Sätze (positiv), 2-3 Sätze (negativ)
5. Keine Exclamation Marks, immer Contractions

**Blacklisted Phrases (instant rejection):**
- Gratitude Slop: "Thank you for your feedback", "We appreciate..."
- Corporate Speak: "We strive to...", "Your satisfaction is our priority"
- Emotional: "thrilled", "delighted", "amazing", "wonderful"
- Claude-spezifisch: "hit the spot", "glad it worked out", "good to hear", "swing by"

**Mental Model im Prompt:**
> "Imagine: You just read this review on your phone while waiting for coffee.
> You have 20 seconds to tap out a quick response. What would you actually type?"

**Before/After Examples:**
- "Thank you for your feedback" → [delete - just respond]
- "We're thrilled" → "Nice" oder "Glad"
- "We sincerely apologize" → "That's on us"
- "looking forward to seeing you" → "See you next time"

**Gute Response-Patterns:**
- "The mushroom risotto is our chef's favorite too."
- "45 minutes is way too long. That's on us."
- "Fair point about the noise. We're looking at that."

### API Limits
- Google Places: nur 5 Reviews → SerpAPI nutzen
- Hunter.io: 25/Monat → Website Scraper als Primary
- Outscraper: 500/Monat (Primary für Reviews)

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render) |
| Backend | Node.js/Express (Render) |
| DB | PostgreSQL (Render) |
| Payments | Stripe |
| AI | GPT-4o-mini + Claude Sonnet + Gemini 2.5 |
| Email | Resend + Brevo |

---

## PLAN LIMITS

| Plan | Smart | Standard | Total |
|------|-------|----------|-------|
| Free | 3 | 17 | 20 |
| Starter $29 | 100 | 200 | 300 |
| Pro $49 | 300 | 500 | 800 |
| Unlimited $99 | ∞ | ∞ | ∞ |

### Feature Gating
- **Free:** Chrome Extension only
- **Starter+:** History, Export
- **Pro+:** Bulk, Analytics, Teams
- **Unlimited:** API Access

---

## API ENDPOINTS

### Core
- `POST /api/generate` - Single
- `POST /api/generate-bulk` - Bulk (Pro+)
- `GET /api/stats` | `GET /api/responses/history`

### Auth
- `POST /api/auth/register|login|google`
- `POST /api/auth/forgot-password|reset-password`

### Billing
- `POST /api/billing/create-checkout|portal`

### Admin
- `GET /api/admin/stats|set-plan|api-costs|scraper-status`

### Outreach
- `GET /api/cron/daily-outreach|demo-followup|scraper-alerts`

---

## COMPLETED FEATURES

### Core
- Auth (Email + Google OAuth)
- AI Generation (4 Tones, 50+ Languages)
- Hybrid AI, Templates, Bulk

### Premium
- Analytics, Teams, API Keys
- SEO Blog Generator

### Chrome Extension v1.6.1
- Google Maps, Yelp, TripAdvisor, Booking, Facebook, Trustpilot
- One-Click Response, Business Context

### Marketing Automation
- Daily Outreach + Drip Emails (VOLLAUTOMATISCH)
- Demo Generation + Follow-Up (VOLLAUTOMATISCH)
- Twitter Auto-Post (VOLLAUTOMATISCH)
- LinkedIn Outreach (SEMI-MANUELL - siehe unten)
- Click/Open Tracking (VOLLAUTOMATISCH)

### Automation Status (14.01.2026)
**VOLLAUTOMATISCH (läuft 24/7):**
- Daily Outreach, Drip Emails, Demo Follow-Up, Twitter, Blog Generation
- **NEU: Night Loop** - Autonome Nacht-Sales-Automation (22:00-06:00)

**SEMI-MANUELL (erfordert `claude --chrome`):**
- `/linkedin-connect` - Demos werden auto-generiert, Connection Requests manuell
- `/scrape-leads` - TripAdvisor Scraping
- `/g2-miner` - G2 Competitor Mining
- `/yelp-audit` - Yelp Lead Auditing

---

## KÜRZLICH ERLEDIGT (14.01 Nacht - Spät)

- **Demo Page Conversion Gates v2** - Verbesserte Conversion nach First-Principles Analyse
  - **Problem:** 17 Hot Leads klickten, 0 Conversions - Email-Gate wurde ignoriert
  - **Fix 1: Auto-Redirect zu Signup** - Nach Email-Eingabe → 2s delay → Redirect zu /register?email=...
  - **Fix 2: Nur 1 Response sichtbar** - Statt 2 jetzt nur 1, Rest hinter "Unlock with Email"
  - **Fix 3: Email Pre-Fill** - RegisterPage akzeptiert jetzt `?email=` Parameter
  - **Root Cause:** User bekamen vollen Wert (3 Responses sichtbar) ohne zu konvertieren
  - **Neue Commits:** 24fa5a8f, ddde24f5 - Live & getestet

- **Demo Page Conversion Gates v1** - Initial Implementation
  - **Fix 1: Email-Gate für Copy** - Modal erscheint bei Klick auf "Copy"
  - **Fix 2: 24h Countdown Timer** - "30% OFF expires in HH:MM:SS"
  - Neuer Endpoint: `POST /api/public/demo-email-capture`
  - Captured Emails werden als `warm_lead` in outreach_leads gespeichert

---

## KÜRZLICH ERLEDIGT (14.01 Nacht)

- **Night Automation System** - Läuft autonom die ganze Nacht ohne Chrome/Input
  - `/api/cron/night-loop` - Master Endpoint orchestriert alle Nacht-Aktionen
  - `/api/cron/revive-dead-leads` - Reaktiviert 7+ Tage alte Leads
  - `/api/cron/ab-test-evaluate` - Automatische A/B Test Auswertung
  - A/B Testing Tabelle + Admin Endpoints
  - Erster A/B Test erstellt: "Subject Line - Personal vs Business"
  - **USER TODO:** Night Loop Cron bei cron-job.org einrichten (22:00-06:00 UTC)

---

## KÜRZLICH ERLEDIGT (14.01 Abend)

- **Hot Lead Auto-Demo System** - Personalisierte Demos für Clicker
  - `/api/cron/followup-clickers` generiert jetzt automatisch Demos
  - Demo mit echten Reviews + AI Responses direkt in Follow-Up Email
  - Neuer Endpoint `/api/admin/send-hot-lead-demos` für bestehende Hot Leads
  - Fallback Email wenn Demo-Generierung fehlschlägt
- **Second Follow-Up verbessert** - Inkludiert Demo-URL wenn vorhanden
  - "Last chance" Messaging mit 1 Monat Free Offer
  - German/English Detection bleibt erhalten
- **Demo Page Sticky CTA** - Conversion-Optimierung
  - Sticky Bar am unteren Rand für alle Geräte (nicht nur Mobile)
  - 30% OFF Badge prominent sichtbar
  - "Start Free Trial" statt generischem CTA
- **API Limit Problem erkannt** - SerpAPI bei 960% vom Limit
  - Outscraper ist Primary, aber beide APIs scheinen am Limit
  - Neue Demos werden ohne Reviews generiert
  - TODO: Mehr API Keys oder alternative Scraping-Methode

---

## KÜRZLICH ERLEDIGT (14.01 Vormittag)

- **Conversion Funnel für Ersten Sale** - 3 Quick Wins implementiert:
  - Welcome Email mit WELCOME30 (30% off, 7-Tage Urgency)
  - Demo Auto-Discount: ?discount=DEMO30 automatisch in CTA-Links
  - Micro-Pricing Toast bei Response 15-19 ("Get 10 for $5")
  - Neue Stripe Coupons: WELCOME30, DEMO30 (beide 30% off)
- **Smart Email Finding** - Personal Emails statt info@/contact@
  - Team Member Extraktion von /team, /about Seiten
  - `generatePersonalEmails()` - Name→Email Patterns (firstname@, firstname.lastname@)
  - Umlaut-Handling (ä→ae, ö→oe, ü→ue, ß→ss)
  - `isValidPersonName()` mit Blacklist (filtert "and CEO" etc.)
  - Email-Priorisierung: Personal > Generic
  - Bug-Fix: Owner-Patterns nutzen jetzt auch die Name-Validierung
- **Test-Daten Bereinigung** - Admin Endpoints zum Cleanup von Metriken
  - `/api/admin/cleanup-test-data` - Entfernt Test-Accounts, Emails, Clicks
  - `/api/admin/reset-test-opens` - Setzt Test-Opens zurück
  - Erkannt: 26% "Open Rate" sind Bot-Scans (3 Sek nach Versand)
  - Echte Metrik: 3.4% Click Rate (17 echte Klicks)
- **Direct Review Links auf Demo Pages** - Jede Review verlinkt jetzt direkt zur echten Google Review!
  - Outscraper API: `review_link` und `review_id` werden jetzt extrahiert
  - SerpAPI Fallback: `link` wird extrahiert
  - Frontend: "View This Review on Google" statt allgemeiner Link
  - Automatisch für alle zukünftigen Demos (Daily Outreach, LinkedIn, Manual)
- **Loading Animation Fix** - `.animate-spin` CSS Klasse hinzugefügt
- **Rate Limit → CTA Scroll** - Bei "Daily limit reached" scrollt automatisch zur Signup-Section
- **Conversion System 2.0** - Free→Paid Conversion verbessern:
  - Usage Analytics Tab im Admin Panel (Distribution, Stats, Exit Surveys)
  - Upgrade Modal bei 20 Response Limit (statt nur Toast)
  - Exit Survey Tracking (warum User nicht upgraden)
  - Micro-Pricing: $5 für 10 Responses (Stripe: `price_1SpQPRQfYocZQHxZNiEwUKl0`)
- Google Indexierung: 2 URLs beantragt
- 2 Cron Jobs angelegt (Demo Follow-Up, Scraper Alerts)
- Sales Automation Blast (13 Städte, +210 Leads)
- API Costs Dashboard
- Multi-Fallback Email System

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing, Leads
├── .claude/
│   ├── settings.json
│   ├── commands/      # Slash Commands
│   └── secrets.local  # API Keys (lokal)
├── CLAUDE.md
└── TODO.md
```

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten, Datum ändern!
