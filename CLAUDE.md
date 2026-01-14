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
- Daily Outreach + Drip Emails
- Demo Generation + Follow-Up
- Twitter Auto-Post
- LinkedIn Outreach
- Click/Open Tracking

---

## KÜRZLICH ERLEDIGT (14.01)

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
