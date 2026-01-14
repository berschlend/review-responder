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

### Outreach Metriken (14.01)
- **523 Leads**, **476 Emails**
- **24.4% Open Rate**, **3.8% Click Rate**

---

## LEARNINGS

### Email Deliverability
- "Hey" statt "Hallo" → Primary Inbox
- Keine Emojis, keine Marketing-Floskeln

### AI Response Qualität
1. Reviewer BY NAME ansprechen
2. SPEZIFISCHE Details aus Review
3. VOLLER Business Name am Ende
4. AI-Slop vermeiden

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
