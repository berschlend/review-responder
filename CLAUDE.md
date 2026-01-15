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
6. **Sales/Automation Features:** → Siehe SALES AUTOMATION REGELN unten!

### Claude Permissions (Autorisiert vom User)
- **API Keys eintragen:** Claude DARF API Keys in Render Environment Variables eintragen
- **Accounts erstellen:** Claude DARF Outscraper/API Accounts erstellen wenn nötig
- **Secrets.local editieren:** Claude DARF `.claude/secrets.local` mit neuen Keys updaten
- **Render Dashboard:** URL: https://dashboard.render.com/web/srv-d5gh8c6r433s73dm9v6g/env

### Workflow
```
CLAUDE.md lesen → TODO.md checken → Task → Testen → Git push → CLAUDE.md updaten
```

---

## SALES AUTOMATION REGELN (PFLICHT!)

> **KRITISCH:** Bei JEDEM Sales/Automation Feature diese Checkliste abarbeiten!

### 1. Admin Panel Integration (IMMER!)
Jedes neue Feature braucht:
- [ ] **Admin Endpoint** - `GET /api/admin/[feature-name]` für Status/Stats
- [ ] **Admin Panel Tab/Card** - Visuell im Frontend unter `/admin`
- [ ] **Metriken sichtbar** - Zahlen die User sehen will (sent, clicked, converted, etc.)

**Beispiel-Pattern:**
```javascript
// Backend: GET /api/admin/magic-link-stats
app.get('/api/admin/magic-link-stats', adminAuth, async (req, res) => {
  const stats = await pool.query('SELECT COUNT(*) ...');
  res.json({ sent: x, clicked: y, converted: z });
});
```

### 2. Dokumentation (SOFORT!)
Bei parallelen Claude Sessions MUSS jeder wissen was läuft:

| Was | Wo dokumentieren |
|-----|------------------|
| Neuer Endpoint | API ENDPOINTS Sektion |
| Neuer Cron Job | CRON JOBS Tabelle |
| Neue DB-Tabelle | KÜRZLICH ERLEDIGT mit Schema |
| Neues Feature | COMPLETED FEATURES |
| Session-Aktionen | NACHT-LOG mit Datum/Zeit |

### 3. Verifikation (JEDES MAL!)
Nach Implementation:
- [ ] **Endpoint testen** - `curl` oder Browser-Check
- [ ] **Admin Panel checken** - Stats werden angezeigt?
- [ ] **Einen Durchlauf triggern** - Funktioniert der Flow?
- [ ] **CLAUDE.md updaten** - Andere Sessions wissen Bescheid

### 4. Parallel-Safe Checklist
Bei Endpoints die mehrere Sessions triggern könnten:
- [ ] **Lock-Mechanismus** - `acquireLock()` verwenden
- [ ] **Email-History Check** - `wasEmailRecentlySent()` verwenden
- [ ] **Idempotent** - Doppel-Ausführung schadet nicht

### 5. Quick Reference: Was gehört wohin?

| Feature-Typ | Admin Panel | Endpoint | Cron |
|-------------|-------------|----------|------|
| Email Campaign | Stats Card | `/api/admin/[name]-stats` | Ja |
| Lead Scraping | Count + Last Run | `/api/admin/scraper-status` | Optional |
| A/B Test | Results Tab | `/api/admin/ab-tests` | Evaluation |
| Re-Engagement | Conversion Stats | `/api/cron/[name]` | Ja |
| New Automation | Dashboard Card | Status Endpoint | Meist Ja |

### 6. Template für neue Automation

```markdown
## [Feature Name] - [Datum]

**Was:** [1 Satz Beschreibung]
**Endpoint:** `GET/POST /api/...`
**Admin:** Stats unter /admin sichtbar? ✅/❌
**Cron:** [Schedule wenn applicable]
**Verifiziert:** [Wie getestet]

**Metriken:**
- sent: X
- clicked: Y
- converted: Z
```

---

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

## MCPs & TOOLS (Updated 15.01.2026)

| MCP | Beschreibung | Status |
|-----|--------------|--------|
| Memory MCP | Persistentes Gedächtnis | ✅ ACTIVE |
| Sequential Thinking MCP | Komplexe Problemlösung | ✅ ACTIVE |
| Gemini Design MCP | Frontend outsourcen | ✅ ACTIVE |
| Chrome MCP | Browser Automation (`claude --chrome`) | ✅ ACTIVE |

### Official Plugins (NEU!)

| Plugin | Beschreibung | Wie nutzen |
|--------|--------------|------------|
| `code-simplifier` | Offizieller Code Cleanup (Anthropic) | "Nutze code-simplifier agent" |
| `ralph-loop` | Autonomer Dev Loop | `/ralph-loop` |

### Background Tasks (NEU!)

Für lange Tasks nutze `run_in_background: true`:
```javascript
Bash({ command: "curl ...", run_in_background: true })
```

Oder neuen Command: `/background curl ...`

Status checken: `/tasks`

### Chrome MCP Regel
> Im Plan Mode **IMMER** markieren: **🌐 CHROME MCP: JA/NEIN**

### Chrome Tab Management (NEU 15.01.2026)

**Problem:** Parallele Claude Sessions teilen dieselbe Tab-Gruppe = Chaos.

**Lösung:** Session-basiertes Tab Tracking mit Auto-Cleanup.

#### Bei Session-Start (`claude --chrome`):
```powershell
# 1. Session setzen (BEVOR claude startet!)
$env:CLAUDE_SESSION = "1"  # oder "2", "RR", etc.
claude --chrome

# 2. In Claude: /chrome-init ausführen
```

#### Während der Session:
```powershell
# Nach JEDEM neuen Tab oder Navigate:
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action register -TabId "[ID]" -TabUrl "[URL]"
```

#### Bei Session-Ende:
- Stop-Hook ruft automatisch Tab-Cleanup auf
- Oder manuell: `/chrome-cleanup`

#### Protected Tabs (werden NIE geschlossen):
- `*linkedin.com*` - Login-Sessions
- `*gmail.com*`, `*mail.google.com*` - Email
- `*stripe.com*` - Payments
- `*render.com*` - Deployment
- `*github.com*` - Code
- `*cron-job.org*` - Cron Jobs

#### Tab Status checken:
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

#### Stale Sessions (>30 min inaktiv):
- Werden beim Status-Check angezeigt
- Können manuell bereinigt werden

---

## NIGHT-BURST V3.1 - PRODUCTION SYSTEM (Updated 16.01.2026)

> **ZIEL:** 15 autonome Claude Agents die jede Nacht arbeiten.
> **Basierend auf:** Anthropic's "Building Effective Agents" + "Effective Context Engineering"

### Quick Start (JEDEN ABEND)

```powershell
# Option 1: Interactive Menu
.\scripts\start-night.ps1

# Option 2: Direct Start (all 15 agents)
.\scripts\night-burst-orchestrator.ps1

# Option 3: Light Mode (5 priority agents)
.\scripts\night-burst-orchestrator.ps1 -MaxAgents 5
```

### Scripts Overview

| Script | Purpose |
|--------|---------|
| `start-night.ps1` | **THE ONE COMMAND** - Interactive menu |
| `night-burst-orchestrator.ps1` | Starts/stops all agents |
| `night-burst-session-manager.ps1` | Handles context limits |
| `night-burst-health-check.ps1` | Monitors agent health |
| `night-burst-recovery.ps1` | Recovers crashed agents |
| `night-burst-launcher.ps1` | For Task Scheduler |
| `night-burst-morning-report.ps1` | Generates morning report |

### Auto-Start (Task Scheduler)

```
1. Win+R → taskschd.msc
2. Create Basic Task: "Night-Burst"
3. Trigger: Daily 22:00
4. Action: powershell.exe -File "...\scripts\night-burst-launcher.ps1"
5. Conditions: Uncheck "AC power only"
```

### Morning Routine

```powershell
# Generate morning report
.\scripts\night-burst-morning-report.ps1 -Open

# Check status
.\scripts\night-burst-orchestrator.ps1 -Status

# Stop if still running
.\scripts\night-burst-orchestrator.ps1 -Stop
```

### The 15 Agents

| # | Agent | Priority | Chrome? | Loop |
|---|-------|----------|---------|------|
| 1 | Lead Finder | 1 | Yes | 4h |
| 2 | Cold Emailer | 1 | No | 6h |
| 3 | Social DM | 3 | Yes | 8h |
| 4 | Demo Generator | 2 | No | 4h |
| 5 | Hot Lead Chaser | 1 | No | 2h |
| 6 | User Activator | 2 | No | 4h |
| 7 | Payment Converter | 1 | No | 3h |
| 8 | Upgrader | 3 | No | 6h |
| 9 | Doctor | 2 | No | 1h |
| 10 | Morning Briefer | 3 | No | 24h |
| 11 | Bottleneck Analyzer | 3 | No | 2h |
| 12 | Creative Strategist | 3 | No | 4h |
| 13 | Churn Prevention | 2 | No | 6h |
| 14 | Lead Scorer | 2 | No | 30m |
| 15 | Approval Gate | 1 | No | 5m |

Priority 1 = Critical (always run), 2 = Important, 3 = Nice-to-have

### Key Files

| File | Purpose |
|------|---------|
| `content/claude-progress/agent-memory.json` | Persistent memory |
| `content/claude-progress/verification-log.json` | Action verification |
| `content/claude-progress/learnings.md` | What works/fails |
| `content/claude-progress/for-berend.md` | Morning report |
| `content/claude-progress/agent-registry.json` | Running agents |
| `content/claude-progress/resource-budget.json` | API limits |

### Troubleshooting

**Agents not starting?**
```powershell
# Check Claude CLI
claude --version

# Check logs
Get-Content logs\night-burst-*.log -Tail 50
```

**Context limit errors?**
- Session Manager auto-restarts agents every 90 min
- Or use: `.\night-burst-session-manager.ps1 -AgentNum 2`

**PC going to sleep?**
- Set Power Plan: Settings → System → Power → Never sleep
- Or: Launcher script temporarily sets High Performance mode

---

## LEGACY: AnyDesk Remote Access

> Alternative wenn Task Scheduler nicht klappt

### AnyDesk Setup
- PC ID: `1298710422`
- Handy: AnyDesk App installieren

### WSL + tmux (detached sessions)
```bash
wsl
tmux new -s night
cd /mnt/c/Users/"Berend Mainz"/Documents/Start-up/reviewresponder-3
.\scripts\start-night.ps1
# Ctrl+B, D to detach
```

### tmux Shortcuts:
| Aktion | Shortcut |
|--------|----------|
| Detach (Session läuft weiter) | `Ctrl+B`, dann `D` |
| Session Liste | `tmux ls` |
| Session killen | `tmux kill-session -t night` |
| Scroll im Output | `Ctrl+B`, dann `[`, dann Pfeiltasten |

### Warum AnyDesk statt VS Code Tunnel?
- ❌ VS Code Tunnel: Token läuft nach 24h ab
- ❌ VS Code Tunnel: WSL verliert Netzwerk nach Sleep
- ✅ AnyDesk: Funktioniert immer, kein Token-Expiry

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

### Night Blast - VOR DEM SCHLAFEN LAUFEN LASSEN! (15.01.2026)

**Der eine Befehl für die Nacht:**
```bash
curl "https://review-responder.onrender.com/api/cron/night-blast?secret=ADMIN_SECRET"
```

**Was läuft automatisch (9 Phasen):**
| Phase | Was passiert |
|-------|-------------|
| 1 | Multi-City Scraping (5 Städte, 100 Leads) |
| 2 | Email Finding für neue Leads |
| 3 | Demo Generation (personalisierte Demos) |
| 4 | Hot Lead Follow-Ups (Magic Links für Klicker) |
| 5 | Second Follow-Ups ("1 Monat gratis") |
| 6 | Demo Follow-Ups (wer Demo angeschaut hat) |
| 7 | G2 Enrichment (Domains + Emails) |
| 8 | Source-specific Emails (TripAdvisor, Yelp, G2, Agency) |
| 9 | **NEU: Social Link Scraping** (Twitter, FB, Instagram, LinkedIn) |

**Output zeigt:**
- `leads_scraped`, `emails_found`, `demos_generated`
- `social_links_found`, `social_twitter/facebook/instagram/linkedin`
- Duration in Sekunden

**Endpoints:**
- `/api/cron/night-blast` - MASTER Endpoint (startet alles)

---

## CURRENT TASKS

**Stand: 16.01.2026**

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
- **49 live** (Plattformen + Branchen)
- **InstantDemoWidget** in Hero Section → Try AI → Email Gate → Signup
- 4-Email Drip über 14 Tage nach Signup

### Outreach Metriken (14.01 Nacht 22:30 UTC)
- **1,988 Leads** (+1,460 heute!)
- **572 Emails** gesendet
- **23 Clicks** (4.0% CTR) - +6 heute
- **22 Hot Leads** - aktiv engagiert
- **0 Conversions** ← Conversion Fixes deployed!

**Session-Ergebnis:**
- Exit Intent Popup mit 30% Discount
- Email Subjects mit Star-Rating (A/B Winner: 100%)
- Response Gate: nur 1 Response sichtbar
- Auto-Redirect nach Email-Capture

---

## LINKEDIN OUTREACH STATUS (15.01.2026)

> **WICHTIG für neue Claude Sessions:** Diese Daten VOR LinkedIn-Aktionen checken!

### Pending Connections (DB: `linkedin_leads`)

**Restaurant Owners (14.01):**
| Name | Company | Demo URL | Connection Sent |
|------|---------|----------|-----------------|
| Max T. | Nachtcafé Dortmund | rr-demo-6f4a2d | **JA (14.01)** |
| Bjoern F. | Augustiner Klosterwirt | rr-demo-7b3e8c | **JA (14.01)** |
| Issa | Oceans Kassel | rr-demo-8a2f5d | **JA (14.01)** |
| Katharina P. | Augustiner am Platzl | rr-demo-9c1d4e | **JA (14.01)** |
| Lena F. | Luisenbad | rr-demo-3e7b2a | **JA (14.01)** |

**Hotel Managers (15.01) - Neu in DB:**
| Name | Company | Location | Status |
|------|---------|----------|--------|
| Wolfgang Groos | Soaltee Westend Premier Hotel | Frankfurt | Gespeichert |
| Marcel Heinemann | Premier Inn Deutschland | Leipzig | Gespeichert |
| Zarifa Huseynova | Odyssey Hotel Group / Marriott | Frankfurt | Gespeichert |
| Sabrina Weigelt | Kempinski Hotel Berchtesgaden | Bayern | Gespeichert |

**Restaurant Owners vom früheren Session (15.01) - In DB:**
| Name | Company | Location |
|------|---------|----------|
| Rudy Pellino | Restaurant Owner | Munich |
| Renate Broekhuis | Restaurant Owner | Hamburg |
| Daniel Baer | Restaurant Owner | Stuttgart |
| Maria Petzold | Restaurant Owner | Dresden |
| Daniela Heykes-Stromann | Restaurant Owner | NRW |

**ACHTUNG:** DB-Feld `connection_sent` ist NICHT zuverlässig!
→ IMMER LinkedIn direkt checken unter: linkedin.com/mynetwork/invitation-manager/sent/

### Follow-Up Workflow
1. **Gesendete Invitations checken** → linkedin.com/mynetwork/invitation-manager/sent/
2. **Accepted?** → Wenn ja: Follow-Up Message mit Demo-URL senden
3. **DB updaten:** `PUT /api/outreach/linkedin-demo/[ID]/accepted`

### LinkedIn API Limits (KRITISCH!)
- MAX 20-25 Connection Requests/Tag
- MAX 100 Connection Requests/Woche
- MAX 50-100 Messages/Tag
- Bei Warnung: SOFORT STOPPEN!

---

## LEARNINGS

### Rate-Limit Bypass Fix (16.01.2026)

**Problem:** Eingeloggte Free User konnten auf Landing Pages (`/birdeye`, etc.) unbegrenzt Responses via InstantDemoWidget generieren.
**Ursache:** `/api/public/try` war nur IP-basiert (3/Tag), prüfte nicht ob User eingeloggt war.
**Fix:**
- Backend: JWT Token optional prüfen, User-Plan-Limit enforced (`server.js:7477-7815`)
- Frontend: Authorization Header mitsenden wenn Token vorhanden (`App.js:656-693`)
- response_count wird jetzt inkrementiert für eingeloggte User

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

### API Limits + Caching (15.01.2026 - MIT CACHING!)
- **SerpAPI: 1380% ÜBER LIMIT** (100/mo, braucht mehr Keys)
- **Outscraper: 500/Monat** (Primary für Reviews)
- **Google Places: FALLBACK** (5 Reviews/Place, ~$150/mo Cost)
- Hunter.io: 25/Monat → Website Scraper als Primary

**NEUES CACHING-SYSTEM (15.01 implementiert):**
1. **Review Cache:** 189+ Einträge mit 1296+ Reviews gecached
2. **Demo Reuse:** Existierende Demos werden für gleichen Business wiederverwendet
3. **Fallback Order:** Cache → Outscraper → SerpAPI → Google Places → Expired Cache

**Cache Endpoints:**
- `GET /api/admin/review-cache?key=...` - Cache Stats anzeigen
- `GET /api/admin/populate-cache?key=...` - Cache von existierenden Demos befüllen

**WORKAROUND für NEUE Businesses:**
1. Cache hilft nur bei bereits gescrapten Businesses
2. Für neue: TripAdvisor Scraping (`/scrape-leads`)
3. Oder warten bis API-Reset (monatlich)

### Admin Endpoint DB-Schema Gotchas (15.01.2026)

**Problem:** Neue Admin-Endpoints mit falschen DB-Spalten-Annahmen.

**Konkrete Fehler (gefixt):**
- `outreach_leads` hat `status` VARCHAR ('new', 'contacted'), NICHT `contacted` BOOLEAN
- `api_call_logs` hat `error_message`, NICHT `error`
- `users` hat KEIN `last_login` - nutze `responses` Tabelle für Activity

**Regel für neue Endpoints:**
1. IMMER erst Schema checken: `grep -n "CREATE TABLE" backend/server.js | grep tabelle`
2. Oder live Query im Dashboard testen bevor Endpoint deployed wird

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
- `GET /api/admin/parallel-safe-status` - Thread-Safety Status (Locks, Email History)

### Outreach
- `GET /api/cron/daily-outreach|demo-followup|scraper-alerts`

### Omnichannel (NEU 15.01)
- `GET /api/admin/leads-for-omnichannel` - Leads mit Demo für Multi-Channel
- `PUT /api/admin/lead-social-links` - Social Links updaten
- `PUT /api/admin/mark-channel-contacted` - Kanal als kontaktiert markieren
- `GET /api/admin/omnichannel-stats` - Multi-Channel Stats

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

### Automation Status (15.01.2026)
**VOLLAUTOMATISCH (läuft 24/7):**
- Daily Outreach, Drip Emails, Demo Follow-Up, Twitter, Blog Generation
- **Night-Blast** - Lead Scraping + Email Finding + Outreach (21:00, 01:00, 05:00 UTC)
- **Night-Loop** - Hourly Tasks via node-cron:
  - Hour 0 (23:00 UTC): Demo Expiration Emails (Day 3, Day 5)
  - Hour 2 (01:05 UTC): Magic Link Re-Engagement für Hot Leads

**SEMI-MANUELL (erfordert `claude --chrome`):**
- `/linkedin-connect` - Demos werden auto-generiert, Connection Requests manuell
- `/omnichannel-blast` - **NEU!** Multi-Channel Outreach (Twitter, FB, Instagram, LinkedIn)
- `/scrape-leads` - TripAdvisor Scraping
- `/g2-miner` - G2 Competitor Mining
- `/yelp-audit` - Yelp Lead Auditing

### Omnichannel Parallel Setup (3 Claude Sessions)
```powershell
# Terminal 1: Twitter
$env:CLAUDE_SESSION = "Twitter"
claude --chrome
# /omnichannel-blast --channel=twitter

# Terminal 2: Facebook
$env:CLAUDE_SESSION = "Facebook"
claude --chrome
# /omnichannel-blast --channel=facebook

# Terminal 3: Instagram
$env:CLAUDE_SESSION = "Instagram"
claude --chrome
# /omnichannel-blast --channel=instagram
```
Oder: `.claude\omnichannel-parallel.ps1` ausführen

---

## NIGHT-BURST V2 AGENTS (15.01.2026)

> **Autonomes Marketing-Genie basierend auf Anthropics Project Vend Learnings.**
> Alle Agents laufen in Endlos-Loop bis Berend "Stopp" sagt.

### Agent-Übersicht (15 Total)

**EXECUTION LAYER (1-8):**
| Agent | Name | Mission | Loop |
|-------|------|---------|------|
| Burst-1 | Lead Finder | Neue Leads scrapen | 4h |
| Burst-2 | Cold Emailer | Cold Outreach senden | 6h |
| Burst-3 | Social DM | LinkedIn/Twitter DMs | 8h |
| Burst-4 | Demo Generator | Personalisierte Demos | 4h |
| Burst-5 | Hot Lead Chaser | Hot Leads follow-up | 2h |
| Burst-6 | User Activator | Onboarding aktivieren | 4h |
| Burst-7 | Payment Converter | Free→Paid konvertieren | 3h |
| Burst-8 | Upgrader | Upsell Starter→Pro | 6h |

**INTELLIGENCE LAYER (9-14):**
| Agent | Name | Mission | Loop |
|-------|------|---------|------|
| Burst-9 | Doctor | Metriken tracken | 1h |
| Burst-10 | Morning Briefer | Daily Report | 24h |
| Burst-11 | **Bottleneck Analyzer** | Funnel-Engpass finden | 2h |
| Burst-12 | **Creative Strategist** | Neue Strategien vorschlagen | 4h |
| Burst-13 | **Churn Prevention** | User reaktivieren | 6h |
| Burst-14 | **Lead Scorer** | Leads priorisieren | 30min |

**CONTROL LAYER (15):**
| Agent | Name | Mission | Loop |
|-------|------|---------|------|
| Burst-15 | **Approval Gate** | Human-in-the-Loop | 5min |

### Neue Agent-Files
```
.claude/commands/
├── night-burst-11.md  # Bottleneck Analyzer
├── night-burst-12.md  # Creative Strategist
├── night-burst-13.md  # Churn Prevention
├── night-burst-14.md  # Lead Scorer
└── night-burst-15.md  # Approval Gate (KRITISCH!)
```

### Neue Support-Files
```
content/claude-progress/
├── approval-queue.md      # Pending Decisions
├── bottleneck-report.md   # Funnel Analysis
├── churn-alerts.md        # At-Risk Users
├── lead-scores.json       # Lead Prioritization
├── strategy-proposals.md  # A/B Test Ideas
└── taste-examples.md      # Brand Voice Control
```

### Human-in-the-Loop (Burst-15)

**Approval Required für:**
- Discount >30%
- First Conversion ever
- Neue Strategie (Burst-12)
- API Spend >$20/day
- Any "unsure" Flag

**Workflow:**
1. Agent schreibt in `approval-queue.md`
2. Burst-15 monitort alle 5min
3. Berend antwortet in `berend-feedback.md`
4. Bei Timeout → Default Action (REJECT für Critical)

**Approval Levels:**
| Level | Timeout | Default |
|-------|---------|---------|
| 🔴 Critical | 30min | REJECT |
| 🟡 Important | 2h | PROCEED |
| 🟢 Informational | None | N/A |

### Lead Scoring (Burst-14)

**Scoring Model (0-100):**
```
ENGAGEMENT (0-40):
├── Email opened: +5
├── Email clicked: +15
├── Demo viewed: +10
└── Demo >3min: +10

FIT (0-30):
├── Reviews 5-50: +10
├── Reviews 50-200: +15
├── Rating 3.0-3.5: +15
└── Rating 3.5-4.0: +10

BEHAVIOR (0-30):
├── Response <1h: +10
├── Multiple sessions: +10
└── Pricing visited: +10
```

**Segments:**
| Score | Segment | Treatment |
|-------|---------|-----------|
| 80-100 | 🔥 Hot | Immediate follow-up |
| 60-79 | 🟡 Warm | Aggressive sequence |
| 40-59 | 🟢 Cool | Standard drip |
| 0-39 | ⚪ Cold | Nurture only |

### Claudius Guard (Anti-Patterns)

> Basierend auf Anthropics Project Vend Failures.

**Vor JEDER Aktion checken:**
```
□ Dient das $1000 MRR oder bin ich "nett"?
□ Habe ich Daten die diese Entscheidung stützen?
□ Was ist der ROI? (Nicht: was will der Lead?)
□ Wiederhole ich einen Fehler?
□ Sollte ich eskalieren?
```

**NIEMALS wie Claudius:**
- ❌ Discount ohne Business-Logik
- ❌ Von "netten Anfragen" überzeugen lassen
- ❌ Gleiche Fehler wiederholen
- ❌ Positive Reports bei schlechten Zahlen
- ❌ Eskalation vergessen
- ❌ **Pricing/Business-Logik ändern ohne User-Approval** (15.01 Incident: Free 20→5, neuer $9 Tier = REVERT!)

**Goldene Regel:** Bei Pricing, Limits, Tiers → IMMER erst fragen, NIE autonom implementieren!

---

## SESSION-LOG 15.01.2026 ~14:00-15:30 UTC

**Session:** First Principles User Activation
**Fokus:** 0 zahlende Kunden trotz 32 registrierten Usern

**First Principles Analyse:**
```
SYMPTOM: 0 zahlende Kunden
ECHTES PROBLEM: 68% der User haben das Produkt NIE benutzt (0 responses)
BISHERIGER ANSATZ: Mehr Leads generieren (2000+)
WARUM ES NICHT FUNKTIONIERT: User registrieren → aber nutzen nicht → treffen nie Paywall
NEUER ANSATZ: Existierende 32 User aktivieren
```

**Aktionen:**
1. **Widget Analytics gefixt** - `public_try_usage` Tabelle erstellt
2. **User-List Endpoint** - `GET /api/admin/user-list` für Activation Targeting
3. **Dormant User Activation Cron** - `GET /api/cron/activate-dormant-users`
   - Sendet Activation Emails an User mit 0 responses
   - German/English Detection
   - 12h Delay nach Signup
   - Max 10/run um Spam zu vermeiden
4. **24 Activation Emails gesendet** an echte Businesses:
   - The Dolder Grand (Zürich)
   - Augustiner Klosterwirt (München)
   - Komodo Miami
   - The Smith (New York)
   - 25hours Hotel Zürich
   - etc.
5. **Night Loop Integration** - Läuft automatisch um 03:00 UTC

**User Distribution entdeckt:**
- 38 total users
- 26 (68%) never_used (0 responses)
- 7 low_usage (1-4 responses)
- 5 medium_usage (5-14 responses)
- 0 high_usage (15+) → NIEMAND trifft das Limit!

**Neue Endpoints:**
- `GET /api/admin/widget-analytics` - Widget Performance
- `GET /api/admin/user-list` - User Activity Distribution
- `GET /api/cron/activate-dormant-users` - Dormant User Activation

**Commits:** `2b042e2c`, `f815d8ba`, `e64c0118`, `afeecf5e`, `af46d7cd`

---

## SESSION-LOG 15.01.2026 ~15:00 UTC

**Session:** PR-Team Messaging Update
**Aktionen:**
1. **First Principles Analyse:** "Besser als du selbst" Messaging → zu aggressiv
2. **Messaging Update deployed:**
   - Hero: "Sound like you hired a PR team"
   - InstantDemoWidget: "Get PR-Quality Responses"
   - Footer: Updated value prop
3. **Commit:** `85ff0b5e`

**Erkenntnis:** Messaging-Änderungen sind nice-to-have, User Activation bleibt der echte Bottleneck (10 registrierte User, 0 aktive Nutzung).

---

## SESSION-LOG 15.01.2026 ~09:00 UTC

**Session:** LinkedIn Outreach - Hotel Managers Germany
**Aktionen:**
1. **Bottleneck-Analyse durchgeführt** - 5 Haupt-Bottlenecks identifiziert
   - Demo Page Conversion = 0% (größtes Problem)
   - Email Finding Rate = 36%
   - LinkedIn Limit erreicht
   - Free→Paid = 0%
   - Lead Volume OK
2. **Conversion Fixes implementiert:**
   - Social Proof auf Demo Page
   - Upgrade Modal bei Response 15 (statt 20)
   - Apollo.io API Integration für Email Finding
3. **LinkedIn Hotel Manager Outreach:**
   - Suche: "Hotel Manager Germany"
   - 4 neue Leads in DB gespeichert:
     - Wolfgang Groos (Soaltee Westend Premier)
     - Marcel Heinemann (Premier Inn)
     - Zarifa Huseynova (Marriott)
     - Sabrina Weigelt (Kempinski)
   - 5 weitere Restaurant Owners aus vorheriger Session
4. **Git Commits:** Social Proof + Apollo API + Upgrade Modal

**Nächste Schritte (für zukünftige Sessions):**
- LinkedIn: `/linkedin-connect followup` für Accepted Connections
- Demo Page: A/B Test für Headline starten
- Email Finding: Pattern-Guessing für DE-Namen verbessern

---

## NACHT-LOG 15.01.2026 23:10 UTC

**Session:** Night Blast (Second Wave)
**Aktionen:**
1. **Magic Link Re-Engagement** - 11 neue Emails an Hot Leads
   - `/api/cron/reengage-clickers` getriggert
   - Alle unregistrierten Clicker bekamen Magic Links
2. **🎉 10 NEUE USER-REGISTRIERUNGEN via Magic Links!**
   - The Smith (New York), Sphere Tim Raue (Berlin)
   - Komodo Miami, Augustiner Klosterwirt (München)
   - Madame Brasserie (Paris), Zurich Marriott
   - Romano Law (New York), AWAY SPA (Edinburgh)
   - 25hours Hotel (Zürich), Bullring (Birmingham)
3. **Outreach Blast** - 50 Emails gesendet (Daily Limit erreicht)
   - 648 Total Emails gesendet (Session Start: 572)
   - 376 Leads kontaktiert (Session Start: 301)
4. **TripAdvisor Lead Import** - House of Food Porn (Miami)
5. **LinkedIn Check** - 1 pending (Bjoern Hiller, Block House)

**Metriken (23:10 UTC):**
- 1992 Leads (+4)
- 495 Leads mit Email (+31)
- 648 Emails gesendet (+76)
- 23 Clicks (stabil)
- 10 neue Registrierungen (via Magic Links!)
- 0 Zahlende Kunden (noch nicht)

**Erkenntnisse:**
- Magic Links funktionieren - Users werden auto-registriert
- ABER: Keiner hat das Produkt noch aktiv genutzt (response_count: 0)
- Nächster Schritt: Warten auf User-Aktivität oder Onboarding-Nudge implementieren

---

## NACHT-LOG 15.01.2026 ~22:30

**Session:** Sales Automation Setup + Chrome MCP Debugging

**Aktionen:**
1. **Night Loop Cron verifiziert** - Läuft bereits stündlich (`0 * * * *`)
   - Alle 8 Stunden-Jobs bereits konfiguriert bei cron-job.org
   - Hot Lead Follow-Ups, Dead Lead Revival, A/B Tests laufen autonom
2. **Chrome MCP Tab-Chaos diagnostiziert**
   - Problem: Alle Claude Sessions teilen dieselbe Tab-Gruppe
   - Lösung dokumentiert in globaler CLAUDE.md:
     - Option 1: Nur EINE Session nutzt Chrome MCP
     - Option 2: Separate Chrome Profile pro Session
3. **Lead-Scraping abgebrochen** (Chrome MCP instabil)
   - LinkedIn, TripAdvisor, G2 Tasks verschoben auf stabile Session

**Metriken (Status Check ~21:17):**
- 644 Leads total
- 391 mit Email
- 499 Emails gesendet
- 18 Clicks (3.6% Click Rate)
- 17 Hot Leads (haben geklickt!)
- 0 Conversions

**Erkenntnis:** Chrome MCP braucht Session-Isolation für Boris Flow.
**TODO:** Parallele Chrome Sessions mit separaten Profilen testen.

---

## NACHT-LOG 15.01.2026 01:45

**Session:** Night Blast (Continued)
**Aktionen:**
1. **Re-Engagement Blast** - 29 Magic Link Emails an Hot Leads gesendet
   - `/api/cron/reengage-clickers` 3x getriggert
   - Alle 23 Clickers + neue bekommen Magic Login Links
2. **V2 Conversion Gates Validiert** - Alles funktioniert:
   - Nur 1 Response sichtbar (Rest hinter Email-Gate)
   - Copy-Button triggert Email-Modal
   - Auto-Redirect zu /register nach Email-Eingabe
   - Email wird pre-filled, Discount wird angezeigt
3. **TripAdvisor Scraping** - 14 neue Leads mit Email:
   - Miami (6): Barsecco, Mayami Wynwood, Café La Trova, Marabu, ADRIFT Mare, House of Food Porn
   - Amsterdam (4): Arles, Restaurant Red, The Pantry, Midtown Grill
   - Denver (4): Buckhorn Exchange, Anise Vietnamese, Marco's Coal-Fired, Izakaya Den
4. **LinkedIn Check** - 1 ausstehende Einladung (Bjoern Hiller, Block House)

**Metriken (01:45 UTC):**
- 19 User (11 neu via Magic Links)
- 7 Aktiviert (36.8% Activation Rate)
- 448 Total Responses
- 0 Zahlende Kunden

**Erkenntnis:** Magic Link Users registrieren sich aber nutzen Produkt nicht aktiv.
**DONE:** Onboarding-Nudge Email implementiert! (siehe unten)

---

## KÜRZLICH ERLEDIGT (15.01 Nachmittag - InstantDemoWidget Phase 2+3)

- **Phase 2: Kontextuelle AI + UI**
  - Backend: 16 businessType + 13 platform Kontexte für bessere Responses
  - Frontend: Auto-Detection aus URL-Pfad (useMemo)
  - Kontextuelle Headlines ("See How Your Restaurant Would Respond")
  - Kontextuelle Placeholders (realistische Beispiel-Reviews)
  - "Optimized for [X] Reviews" Badge

- **Phase 3: Attribution + Analytics (First Principles: "Can't measure = Can't optimize")**
  - `email_captures` Tabelle erweitert: `landing_page`, `platform`, `business_type`
  - Neuer Admin Tab "Widget Analytics" mit:
    - Summary: Attempts | Captures | Capture Rate
    - Breakdown: By Platform, By Business Type, By Landing Page
    - Last 7 Days Trend
  - Mobile UX: Skip-Button, 2x2 Grid Tone-Buttons, Full-width Generate

- **Commits:** `de0598e5`, `f912703d`, `12f9c63c`

---

## KÜRZLICH ERLEDIGT (15.01 Mittag - InstantDemoWidget auf allen Landing Pages)

- **First Principles Fix:** Demo Page Conversion = 0% weil SEO Traffic keinen Wert sah
- **Neue Komponente: `InstantDemoWidget`** (frontend/src/App.js)
  - User können Review eingeben und sofort AI Response sehen
  - Tone Selector (4 Optionen)
  - **Email Gate:** Copy Button zeigt Modal → Email erfassen
  - Nach Email: Auto-Redirect zu `/register?email=...`
  - Rate Limit: 3 pro IP pro Tag (Backend `/api/public/try`)
- **Integration:**
  - ✅ LandingPage Hero Section (ersetzt inline Code)
  - ✅ Alle 49 SEO Landing Pages (ersetzt `LandingEmailCapture`)
- **Conversion Flow:**
  ```
  VORHER: Landing → Email Capture → Signup → Bounce (kein Wert)
  JETZT: Landing → Instant Demo → WOW! → Email Gate → Signup
  ```
- **Commit:** `467c4079` - "feat: add InstantDemoWidget to all landing pages"

---

## KÜRZLICH ERLEDIGT (15.01 Morgen - Bottleneck-Analyse & Conversion Fixes)

- **Bottleneck-Analyse durchgeführt:**
  - 🔴 **Bottleneck 1:** Demo View → Conversion = 0% (60 Views, 0 Signups)
  - 🔴 **Bottleneck 2:** Email Finding Rate = 36% (64% können nicht kontaktiert werden)
  - 🟡 **Bottleneck 3:** LinkedIn Limit erreicht (2/Monat personalisierte Invites)
  - 🟡 **Bottleneck 4:** Registered → Paying = 0% (31 User, 0 zahlend)
  - 🟢 **Bottleneck 5:** Lead Volume OK (2117 Leads, +123 heute)

- **Conversion Fixes implementiert:**
  - ✅ **Social Proof auf Demo Page** - Ehrliche Stats: "300+ responses generated", "50+ languages", "6 platforms"
  - ✅ **Upgrade Modal früher** - Zeigt jetzt bei Response 15 statt 20 (5 remaining)
  - ✅ **Bessere Toast Urgency** - 🚨 Icon bei <= 2 remaining

- **Apollo.io API Integration:**
  - ✅ `findEmailWithApollo()` Helper-Funktion hinzugefügt
  - ✅ In Email-Fallback-Kette eingefügt (zwischen Snov.io und Hunter.io)
  - ✅ 95 free credits/month, findet Decision Makers nach Titel
  - ✅ Automation-Health Endpoint zeigt Apollo Status

- **Email Finding Fallback-Kette (aktualisiert):**
  1. Team Page Scraping → Personal Emails (FREE)
  2. Enhanced Email Finder (Website/Impressum) (FREE)
  3. Pattern Guesser mit MX Verification (FREE)
  4. Snov.io (50/mo)
  5. **Apollo.io (95/mo)** ← NEU
  6. Hunter.io (25/wk)

---

## KÜRZLICH ERLEDIGT (15.01 Nacht - Sales Automation Phase 3)

- **Sales Automation komplett** - 4 Event-Trigger laufen 24/7 ohne Claude:
  - Phase 1: Limit-Hit Flash Offer (50% off, 2h) ✅
  - Phase 2: Checkout Abandonment (20% off, 7 Tage) ✅
  - Phase 3a: Hot Demo Visitors (40% off, 48h) ✅
  - Phase 3b: Exit Survey Follow-Up (5 Templates) ✅
- **Hot Demo Visitors Cron** - `/api/cron/hot-demo-visitors`
  - Trackt `demo_view_count` bei jedem Seitenaufruf
  - Email bei 3+ Views mit HOTLEAD40 Coupon (40% off)
  - Subject: "Still thinking about [Business]?"
  - Safeguard: Max 1 Email pro Demo
- **Exit Survey Follow-Up Cron** - `/api/cron/exit-survey-followup`
  - 5 Email-Templates basierend auf Grund:
    - `too_expensive`: "$5 für 10 Responses" Micro-Pricing Angebot
    - `not_right_time`: Reminder in 2 Wochen/1 Monat/3 Monate
    - `missing_feature`: "Which feature?" Feedback Request
    - `just_testing`: Testimonials + Free Tier Hinweis
    - `other`: Generisches Feedback Request
  - Safeguard: Max 1 Response pro Survey
- **Neue DB-Spalten:**
  - `demo_generations.demo_view_count` (INTEGER)
  - `demo_generations.hot_demo_followup_sent_at` (TIMESTAMP)
  - `exit_surveys.response_sent_at` (TIMESTAMP)
- **Neue Stripe Coupons:** HOTLEAD40 (40% off, 48h expiry)
- **First Principles Ergebnis:** Kein `/sales-monitor` Skill nötig!
  - Chrome MCP nur für LinkedIn (existiert: `/linkedin-connect`)
  - Backend-Automatisierung für alles andere (Crons, Webhooks)

---

## KÜRZLICH ERLEDIGT (15.01 Morgen - Demo Page Conversion Analyse)

- **Demo Page Deep Dive** - Warum 58 Views aber 0 Conversions?
  - **FINDINGS:**
    - ✅ Email Gate funktioniert korrekt für Demos mit 3 Responses
    - ✅ 94% der Demos haben 3 Responses (Gate aktiv)
    - ✅ Email Modal erscheint bei "Unlock with Email"
    - ✅ Auto-Redirect nach Email-Capture implementiert
    - ❌ **BUG FIX:** Countdown Timer UI fehlte komplett! (State existierte, UI nicht)
  - **ROOT CAUSE für 0 Conversions:**
    - Cold Traffic aus Outreach konvertiert langsam (Projekt erst 5 Tage alt)
    - Timer war nicht sichtbar → keine Urgency
    - System braucht Zeit (7-14 Tage für Cold Email Conversions)
  - **FIX:** Countdown Timer UI hinzugefügt (9e3a2266)
    - Orange Badge mit "30% OFF expires in HH:MM:SS"
    - In Hero Section prominent platziert

- **G2 Competitor Mining** - `/g2-miner birdeye` ausgeführt
  - 1 Lead gefunden (ADhesive - Marketing Agency, nicht ideal als Target)
  - G2 negative Reviews sind gute Lead-Quelle für unzufriedene Competitor-Kunden

---

## KÜRZLICH ERLEDIGT (15.01 Nacht - Magic User Nudge)

- **Magic User Activation Nudge** - Separate Onboarding für Magic Link User
  - Neuer Endpoint: `/api/cron/nudge-magic-users`
  - Findet Magic Link User die geklickt aber nie Product genutzt haben
  - Wartet 24h nach Account-Erstellung
  - German/English Detection für lokalisierte Emails
  - In Night Loop integriert (Hour 3 = 03:00 UTC)
  - Parallel-Safe mit Email History Tracking
  - DB-Spalte: `users.magic_nudge_sent`

---

## KÜRZLICH ERLEDIGT (15.01 Nacht - Omnichannel Integration)

- **Omnichannel Stats Tab im Admin Panel** - Multi-Channel Outreach Tracking
  - Leads with Demos count
  - Social Links Found (Twitter, Facebook, Instagram, LinkedIn)
  - Contacted by Channel stats
  - Potential Reach (not yet contacted)
  - Instructions für parallel Claude Sessions

- **Omnichannel Backend Endpoints wiederhergestellt** (waren bei Merge verloren)
  - `GET /api/admin/leads-for-omnichannel` - Leads mit Demos
  - `PUT /api/admin/lead-social-links` - Social Links updaten
  - `PUT /api/admin/mark-channel-contacted` - Channel als kontaktiert markieren
  - `GET /api/admin/omnichannel-stats` - Stats für Admin Panel
  - DB-Spalten: `twitter_handle`, `facebook_page`, `instagram_handle`, `linkedin_company`, `channels_contacted` (JSONB)

- **Automatisches Email-Channel-Tracking** - Emails werden in `channels_contacted` getrackt
  - Funktioniert für Initial Outreach und Follow-Ups
  - Sequence-Nummer wird mitgespeichert

- **Night Blast Phase 9: Social Link Scraping** - Automatisches Website-Scraping
  - Extrahiert: Twitter/X, Facebook, Instagram, LinkedIn
  - Bis zu 50 Leads pro Run
  - Rate-Limited (500ms zwischen Requests)
  - Filtert Share/Intent Links raus (nur echte Profile)

---

## KÜRZLICH ERLEDIGT (15.01 Abend)

- **Parallel-Safe Email System** - Verhindert Doppel-Emails bei parallelen Claude Sessions
  - Neue DB-Tabellen: `processing_locks`, `email_send_history`
  - Helper Functions: `acquireLock()`, `releaseLock()`, `wasEmailRecentlySent()`, `recordEmailSend()`
  - Geschützte Endpoints: `daily-outreach`, `followup-clickers`, `second-followup`, `revive-dead-leads`
  - Admin Status: `GET /api/admin/parallel-safe-status`
  - **Wie es funktioniert:** Lock mit TTL (60s) + Email-History Check (60 Min Fenster)

---

## NACHT-LOG 15.01.2026 23:10 UTC

**Session:** Night Blast (Second Wave)
**Aktionen:**
1. **Magic Link Re-Engagement** - 11 neue Emails an Hot Leads
   - `/api/cron/reengage-clickers` getriggert
   - Alle unregistrierten Clicker bekamen Magic Links
2. **🎉 10 NEUE USER-REGISTRIERUNGEN via Magic Links!**
   - The Smith (New York), Sphere Tim Raue (Berlin)
   - Komodo Miami, Augustiner Klosterwirt (München)
   - Madame Brasserie (Paris), Zurich Marriott
   - Romano Law (New York), AWAY SPA (Edinburgh)
   - 25hours Hotel (Zürich), Bullring (Birmingham)
3. **Outreach Blast** - 50 Emails gesendet (Daily Limit erreicht)
   - 648 Total Emails gesendet (Session Start: 572)
   - 376 Leads kontaktiert (Session Start: 301)
4. **TripAdvisor Lead Import** - House of Food Porn (Miami)
5. **LinkedIn Check** - 1 pending (Bjoern Hiller, Block House)

**Metriken (23:10 UTC):**
- 1992 Leads (+4)
- 495 Leads mit Email (+31)
- 648 Emails gesendet (+76)
- 23 Clicks (stabil)
- 10 neue Registrierungen (via Magic Links!)
- 0 Zahlende Kunden (noch nicht)

**Erkenntnisse:**
- Magic Links funktionieren - Users werden auto-registriert
- ABER: Keiner hat das Produkt noch aktiv genutzt (response_count: 0)
- Nächster Schritt: Warten auf User-Aktivität oder Onboarding-Nudge implementieren

---

## NACHT-LOG 15.01.2026 01:45

**Session:** Night Blast (Continued)
**Aktionen:**
1. **Re-Engagement Blast** - 29 Magic Link Emails an Hot Leads gesendet
   - `/api/cron/reengage-clickers` 3x getriggert
   - Alle 23 Clickers + neue bekommen Magic Login Links
2. **V2 Conversion Gates Validiert** - Alles funktioniert:
   - Nur 1 Response sichtbar (Rest hinter Email-Gate)
   - Copy-Button triggert Email-Modal
   - Auto-Redirect zu /register nach Email-Eingabe
   - Email wird pre-filled, Discount wird angezeigt
3. **TripAdvisor Scraping** - 14 neue Leads mit Email:
   - Miami (6): Barsecco, Mayami Wynwood, Café La Trova, Marabu, ADRIFT Mare, House of Food Porn
   - Amsterdam (4): Arles, Restaurant Red, The Pantry, Midtown Grill
   - Denver (4): Buckhorn Exchange, Anise Vietnamese, Marco's Coal-Fired, Izakaya Den
4. **LinkedIn Check** - 1 ausstehende Einladung (Bjoern Hiller, Block House)

**Metriken (01:45 UTC):**
- 19 User (11 neu via Magic Links)
- 7 Aktiviert (36.8% Activation Rate)
- 448 Total Responses
- 0 Zahlende Kunden

**Erkenntnis:** Magic Link Users registrieren sich aber nutzen Produkt nicht aktiv.
**TODO:** Onboarding-Nudge Email implementieren

---

## KÜRZLICH ERLEDIGT (15.01 Nacht)

- **Magic Link Authentication System** - Passwordless Login für Hot Leads
  - `GET /api/auth/magic-login/:token` - Auto-create Account + JWT Login
  - `POST /api/auth/create-magic-link` - Generate 7-day valid token
  - Frontend: `/magic-login` Route mit auto-redirect zu Dashboard
  - Click-Tracking: `reengagement_emails.clicked_at`

- **Re-Engagement Cron** - Automatische Magic Links für unregistrierte Clicker
  - `GET /api/cron/reengage-clickers` - Findet Hot Leads die nicht registriert sind
  - DE/EN Email Detection basierend auf Stadt
  - Läuft automatisch um 01:05 UTC (02:05 Berlin)

- **Demo Expiration System** - Urgency Emails für expirierende Demos
  - `GET /api/cron/demo-expiration-emails`
  - Day 3: "Your demo expires in 4 days"
  - Day 5: "Last chance - demo expires tomorrow"
  - Day 7+: Demo marked as expired, Frontend zeigt "Expired" State
  - Läuft automatisch um 23:00 UTC (00:00 Berlin)

- **Dashboard Stats erweitert** - Magic Link & Demo Expiration Tracking
  - `magic_links`: sent, clicked, converted
  - `demo_expiration`: total, expired, day3_sent, day5_sent

- **Internal Scheduler** - node-cron für komplette Autonomie
  - Night-Loop läuft jetzt ohne externe cron-job.org
  - Alle Tasks vollautomatisch über Nacht

---

## KÜRZLICH ERLEDIGT (15.01 Morgen - First Principles Fix)

- **Review Caching System implementiert** - Reduziert API-Kosten drastisch:
  - Neue `review_cache` Tabelle (48h Validität)
  - 189 Einträge mit 1296 Reviews aus existierenden Demos befüllt
  - Cache-Check vor jedem API-Call
  - Expired Cache als letzter Fallback
- **Demo Reuse Logic** - Existierende Demos werden wiederverwendet:
  - Prüft erst ob Demo für gleichen Business existiert
  - Spart API-Calls und Zeit
- **Google Places als Fallback** - Jetzt 4. Option im Chain:
  - Fallback Order: Cache → Outscraper → SerpAPI → Google Places → Expired Cache
  - Google Places gibt 5 Reviews pro Place (kostenlos mit API Key)
- **Admin Endpoints für Cache:**
  - `/api/admin/review-cache` - Stats anzeigen
  - `/api/admin/populate-cache` - Cache von Demos befüllen

---

## KÜRZLICH ERLEDIGT (15.01 Früh)

- **TripAdvisor Boston Scraping** - 4 neue Leads mit Email:
  - Terramia Ristorante (terramia93@gmail.com)
  - Antico Forno (office@anticofornoboston.com)
  - Carmelinas (info@carmelinasboston.com)
  - Mamma Maria (info@mammamaria.com)
- **LinkedIn Connection Requests gesendet** - 5 deutsche Restaurant-Owner
  - Alle haben personalisierte Demo-URLs bekommen
  - DB-Feld `connection_sent` ist NICHT zuverlässig → LinkedIn direkt checken!
- **CLAUDE.md dokumentiert** - LinkedIn Status + API Limits für zukünftige Sessions
- **API Limit Problem** - SerpAPI bei 960%, alle Hot Lead Demos schlugen fehl
  - 14 Hot Leads konnten keine Demos bekommen (keine Reviews)
  - Workaround: TripAdvisor + manuelles Scraping

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
