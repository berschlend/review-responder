# ReviewResponder - Claude Code Memory

> **LIES MICH ZUERST!** Zentrales Gedächtnis für alle Claude Sessions.

---

## QUICK START

**Rolle:** Autonomer Entwickler für ReviewResponder - SaaS für KI-Review-Antworten.
**Ziel:** $1000/Monat durch ~30 zahlende Kunden.
**Projekt-Start:** 10. Januar 2026

### Regeln
1. Immer testen vor Push
2. Immer committen & pushen nach fertiger Änderung
3. CLAUDE.md updaten nach jeder Session
4. User nur fragen wenn nötig
5. **Nach Deploy:** "Deployed! Frontend/Backend live in ~2-3 Min"
6. **Sales/Automation Features:** → Siehe SALES AUTOMATION REGELN unten!

### Claude Permissions (Autorisiert vom User)
- **API Keys eintragen:** Claude DARF API Keys in Render Environment Variables eintragen
- **Accounts erstellen:** Claude DARF Outscraper/API Accounts erstellen wenn nötig
- **Secrets.local editieren:** Claude DARF `.claude/secrets.local` mit neuen Keys updaten
- **Render Dashboard:** https://dashboard.render.com/web/srv-d5gh8c6r433s73dm9v6g/env

### Workflow
```
CLAUDE.md lesen → TODO.md checken → Task → Testen → Git push → CLAUDE.md updaten
```

### Wichtige Dateien
- **CLAUDE.md** - Technische Docs, Code Style
- **TODO.md** - Aktuelle Tasks, Prioritäten
- **`.claude/secrets.local`** - Admin URLs, API Keys (lokal)

---

## SALES AUTOMATION REGELN (PFLICHT!)

> **KRITISCH:** Bei JEDEM Sales/Automation Feature diese Checkliste abarbeiten!

### 1. Admin Panel Integration (IMMER!)
Jedes neue Feature braucht:
- [ ] **Admin Endpoint** - `GET /api/admin/[feature-name]` für Status/Stats
- [ ] **Admin Panel Tab/Card** - Visuell im Frontend unter `/admin`
- [ ] **Metriken sichtbar** - Zahlen die User sehen will (sent, clicked, converted, etc.)

### 2. Dokumentation (SOFORT!)
| Was | Wo dokumentieren |
|-----|------------------|
| Neuer Endpoint | API ENDPOINTS Sektion |
| Neuer Cron Job | CRON JOBS Tabelle |
| Neue DB-Tabelle | LEARNINGS mit Schema |
| Neues Feature | COMPLETED FEATURES |

### 3. Verifikation (JEDES MAL!)
- [ ] **Endpoint testen** - `curl` oder Browser-Check
- [ ] **Admin Panel checken** - Stats werden angezeigt?
- [ ] **CLAUDE.md updaten** - Andere Sessions wissen Bescheid

### 4. Parallel-Safe Checklist
- [ ] **Lock-Mechanismus** - `acquireLock()` verwenden
- [ ] **Email-History Check** - `wasEmailRecentlySent()` verwenden
- [ ] **Idempotent** - Doppel-Ausführung schadet nicht

---

## CLAUDIUS GUARD (Anti-Patterns)

> **KRITISCH:** Basierend auf Anthropics Project Vend Failures.

**Vor JEDER Aktion checken:**
- □ Dient das $1000 MRR oder bin ich "nett"?
- □ Habe ich Daten die diese Entscheidung stützen?
- □ Wiederhole ich einen Fehler?
- □ Sollte ich eskalieren?

**NIEMALS:**
- ❌ Discount ohne Business-Logik
- ❌ Gleiche Fehler wiederholen
- ❌ Positive Reports bei schlechten Zahlen
- ❌ **Pricing/Business-Logik ändern ohne User-Approval**

**Goldene Regel:** Bei Pricing, Limits, Tiers → IMMER erst fragen, NIE autonom implementieren!

---

## MCPs & TOOLS

| MCP | Beschreibung | Status |
|-----|--------------|--------|
| Memory MCP | Persistentes Gedächtnis | ✅ ACTIVE |
| Sequential Thinking MCP | Komplexe Problemlösung | ✅ ACTIVE |
| Gemini Design MCP | Frontend outsourcen | ✅ ACTIVE |
| Chrome MCP | Browser Automation (`claude --chrome`) | ✅ ACTIVE |

### Plugins
| Plugin | Wie nutzen |
|--------|------------|
| `code-simplifier` | "Nutze code-simplifier agent" |
| `ralph-loop` | `/ralph-loop` |

### Chrome MCP
> Im Plan Mode **IMMER** markieren: **🌐 CHROME MCP: JA/NEIN**

**Tab-Management:** Bei `claude --chrome` erst `$env:CLAUDE_SESSION = "1"` setzen, dann `/chrome-init` ausführen.

---

## NIGHT-BURST V3.1

> **ZIEL:** 15 autonome Claude Agents die jede Nacht arbeiten.

### Quick Start
```powershell
.\scripts\start-night.ps1  # Interactive Menu
```

### Die 15 Agents

| # | Agent | Priority | Mission |
|---|-------|----------|---------|
| 1 | Lead Finder | 1 | Neue Leads scrapen |
| 2 | Cold Emailer | 1 | Cold Outreach senden |
| 3 | Social DM | 3 | LinkedIn/Twitter DMs |
| 4 | Demo Generator | 2 | Personalisierte Demos |
| 5 | Hot Lead Chaser | 1 | Hot Leads follow-up |
| 6 | User Activator | 2 | Onboarding aktivieren |
| 7 | Payment Converter | 1 | Free→Paid konvertieren |
| 8 | Upgrader | 3 | Upsell Starter→Pro |
| 9 | Doctor | 2 | Metriken tracken |
| 10 | Morning Briefer | 3 | Daily Report |
| 11 | Bottleneck Analyzer | 3 | Funnel-Engpass finden |
| 12 | Creative Strategist | 3 | Neue Strategien |
| 13 | Churn Prevention | 2 | User reaktivieren |
| 14 | Lead Scorer | 2 | Leads priorisieren |
| 15 | Approval Gate | 1 | Human-in-the-Loop |

Priority 1 = Critical, 2 = Important, 3 = Nice-to-have

### Key Files
- `content/claude-progress/agent-memory.json` - Persistent memory
- `content/claude-progress/learnings.md` - What works/fails
- `content/claude-progress/for-berend.md` - Morning report

---

## CODE STYLE

### TypeScript
- NIEMALS `any` oder `enum` - nutze String Unions
- Alle Funktionen brauchen Return-Types

### React
- Functional Components only
- Props typisieren, Hooks für State
- Event Handler: `handle` Prefix

### Git Commits
`feat:` | `fix:` | `chore:` | `docs:` | `refactor:`

---

## LIVE URLS

| Service | URL |
|---------|-----|
| Frontend | https://tryreviewresponder.com |
| Backend | https://review-responder.onrender.com |
| GitHub | https://github.com/berschlend/review-responder |

### Dashboards
- **Render:** dashboard.render.com
- **Stripe:** dashboard.stripe.com
- **Cron-job.org:** console.cron-job.org
- **Resend:** resend.com/emails

---

## CRON JOBS (cron-job.org)

| Job | Schedule |
|-----|----------|
| Keep-Alive | */15 * * * * |
| Daily Outreach | 09:00 täglich |
| Demo Follow-Up | 12:00 täglich |
| **Night Loop** | **22:00-06:00 stündlich** |

### Night Blast
```bash
curl "https://review-responder.onrender.com/api/cron/night-blast?secret=ADMIN_SECRET"
```

---

## CURRENT TASKS

**Stand: 16.01.2026**

### Chrome Web Store
**Status:** Überprüfung läuft (eingereicht 13.01)
- Extension v1.6.1
- Test Account: reviewer@tryreviewresponder.com

### Metriken
- **~2000 Leads**
- **~650 Emails** gesendet
- **~25 Clicks** (4% CTR)
- **0 Conversions** ← Hauptfokus!

### USER TODO:
- [ ] Demo-Videos aufnehmen
- [ ] Google Indexierung fortsetzen

---

## LEARNINGS (Wichtige!)

### Frontend Build Crash (16.01)
**Problem:** Weisse Seite, React lädt nicht.
**Fix:** ESLint-Kommentare checken + alle Imports verifizieren.
**Lesson:** Bei "weisse Seite" IMMER Browser Console checken!

### Rate-Limit Bypass (16.01)
**Problem:** Eingeloggte User umgingen Limits auf Landing Pages.
**Fix:** JWT Token in `/api/public/try` optional prüfen, Plan-Limit enforced.

### DB-Schema Gotchas
- `outreach_leads` hat `status` VARCHAR, NICHT `contacted` BOOLEAN
- `users` hat KEIN `last_login` - nutze `responses` Tabelle

### API Limits + Caching
- **SerpAPI:** ÜBER LIMIT - Cache nutzen!
- **Fallback Order:** Cache → Outscraper → SerpAPI → Google Places → Expired Cache

### Email Deliverability
- "Hey" statt "Hallo" → Primary Inbox
- Keine Emojis, keine Marketing-Floskeln

### AI Response Qualität
**Blacklisted:** "Thank you for your feedback", "We appreciate...", "thrilled", "delighted"
**Gut:** Kurz, spezifisch, Reviewer beim Namen nennen.

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render) |
| Backend | Node.js/Express (Render) |
| DB | PostgreSQL (Render) |
| Payments | Stripe |
| AI | GPT-4o-mini + Claude Sonnet + Gemini 2.5 |
| Email | Resend + Brevo + MailerSend |

---

## PLAN LIMITS

| Plan | Smart | Standard | Total |
|------|-------|----------|-------|
| Free | 3 | 17 | 20 |
| Starter $29 | 100 | 200 | 300 |
| Pro $49 | 300 | 500 | 800 |
| Unlimited $99 | ∞ | ∞ | ∞ |

---

## API ENDPOINTS

### Core
- `POST /api/generate` - Single Response
- `POST /api/generate-bulk` - Bulk (Pro+)
- `GET /api/stats` | `GET /api/responses/history`

### Auth
- `POST /api/auth/register|login|google|magic-login`

### Billing
- `POST /api/billing/create-checkout|portal`

### Admin
- `GET /api/admin/stats|set-plan|api-costs|scraper-status|user-list`
- `GET /api/admin/parallel-safe-status`
- `GET /api/admin/account-usage` - Claude CLI Account Limits (% of daily/weekly)
- `POST /api/admin/sync-account-usage` - Sync from `.\scripts\Sync-AccountUsage.ps1`

### Cron
- `GET /api/cron/daily-outreach|demo-followup|night-blast|night-loop`

---

## COMPLETED FEATURES

### Core
- Auth (Email + Google OAuth + Magic Links)
- AI Generation (4 Tones, 50+ Languages)
- Hybrid AI, Templates, Bulk

### Chrome Extension v1.6.1
- Google Maps, Yelp, TripAdvisor, Booking, Facebook, Trustpilot

### Marketing Automation (24/7)
- Daily Outreach + Drip Emails
- Demo Generation + Follow-Up
- Magic Link Re-Engagement
- Night-Blast (9 Phasen)

### Semi-Manual (Chrome MCP)
- `/linkedin-connect` - Connection Requests
- `/scrape-leads` - TripAdvisor Scraping
- `/omnichannel-blast` - Multi-Channel

---

## LINKEDIN

**Limits (KRITISCH!):**
- MAX 20-25 Connection Requests/Tag
- MAX 100/Woche
- Bei Warnung: SOFORT STOPPEN!

**Workflow:**
1. Check: `linkedin.com/mynetwork/invitation-manager/sent/`
2. Accepted? → Follow-Up Message mit Demo-URL
3. DB: `PUT /api/outreach/linkedin-demo/[ID]/accepted`

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing, Leads
├── .claude/commands/  # Slash Commands
├── CLAUDE.md
└── TODO.md
```

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten!
