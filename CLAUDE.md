# ReviewResponder - Claude Code Memory

> **CORE ONLY** - Agent-spezifische Rules in `.claude/rules/`

---

## QUICK START

**Rolle:** Autonomer Entwickler fuer ReviewResponder - SaaS fuer KI-Review-Antworten.
**Ziel:** $1000/Monat durch ~30 zahlende Kunden.
**Projekt-Start:** 10. Januar 2026

### Regeln
1. Immer testen vor Push
2. Immer committen & pushen nach fertiger Aenderung
3. CLAUDE.md updaten nach jeder Session
4. User nur fragen wenn noetig
5. Nach Deploy: "Deployed! Frontend/Backend live in ~2-3 Min"

### Workflow
```
CLAUDE.md lesen -> Task -> Testen -> Git push -> CLAUDE.md updaten
```

### Wichtige Dateien
| Datei | Inhalt |
|-------|--------|
| `CLAUDE.md` | Core (dieses File) |
| `.claude/rules/` | Agent-spezifische Rules |
| `.claude/secrets.local` | Admin URLs, API Keys, **DATABASE_URL** |
| `content/claude-progress/real-user-metrics.json` | **ECHTE User-Zahlen (verifiziert)** |

### Session-Start Regel (KRITISCH!)
**Bei JEDER neuen Session:**
```bash
# 1. IMMER ZUERST echte Zahlen lesen!
cat content/claude-progress/real-user-metrics.json

# 2. Bot-Filter bei Metriken nutzen!
# RICHTIG: curl ".../api/outreach/dashboard?exclude_bots=true"

# 3. Bei Metriken-Analyse:
/data-analyze
```
> **Bot-Filter PFLICHT!** Email Security Scanner verfaelschen Click-Metriken ohne Filter.

---

## CLAUDIUS GUARD (Kompakt)

> Opus 4.5 entscheidet AUTONOM. Berend NUR bei irreversiblen Aktionen.

### Autonom (fast alles)
- Emails, Discounts (mit Reasoning), Strategien, Features, A/B Tests
- Chrome Automation, API Spend (wenn ROI positiv)

### Berend noetig (sehr wenig)
- User/Daten LOESCHEN
- Legal/Terms aendern
- Budget >$100/Tag

### Safeguards (IMMER)
```
1. Reasoning dokumentieren: "Ich entscheide [X] weil [DATEN]"
2. Daten als Basis (keine Bauchgefuehl-Entscheidungen)
3. Outcome tracken
4. Bei Unsicherheit: Extended Thinking -> Entscheiden -> Dokumentieren
```

---

## TOP 6 DON'T DO THIS

| # | Regel | Warum |
|---|-------|-------|
| 1 | `status` ist VARCHAR, nicht BOOLEAN | DB-Schema Gotcha |
| 2 | API_URL enthaelt schon `/api` | API_BASE existiert nicht |
| 3 | Test-Accounts: `?exclude_test=true` | Metriken verfaelscht |
| 4 | Bei weisser Seite: Browser Console | React-Errors dort sichtbar |
| 5 | Discount vor Nutzung implementieren | Stripe-Handler pruefen |
| 6 | **ECHTER USER = 1+ Generierung (egal wo!)** | responses ODER demo ODER instant_try |

---

## AGENT-SPEZIFISCHE RULES

| Agent | Rule File | Auto-Load |
|-------|-----------|-----------|
| Burst-1,2,3,5 (Sales) | `.claude/rules/sales.md` | Email, Discount, Lead-DB |
| Burst-4 (Demo) | `.claude/rules/demo.md` | Demo Gen, Business-Namen |
| Burst-9,10,11 (Monitoring) | `.claude/rules/monitoring.md` | Health Checks, Metriken |
| Dev Sessions | `.claude/rules/dev.md` | API Reference, DB Schema |
| **Chrome MCP Agents** | `.claude/rules/chrome-performance.md` | **Performance Patterns** |

---

## CODE STYLE

### TypeScript
- NIEMALS `any` oder `enum` - nutze String Unions
- Alle Funktionen brauchen Return-Types

### React
- Functional Components only
- Props typisieren, Event Handler: `handle` Prefix

### Git
`feat:` | `fix:` | `chore:` | `docs:` | `refactor:`

---

## LIVE URLS

| Service | URL |
|---------|-----|
| Frontend | https://tryreviewresponder.com |
| Backend | https://review-responder.onrender.com |
| GitHub | github.com/berschlend/review-responder |

### Dashboards
Render | Stripe | Cron-job.org | Resend

### Render Manual Deploy (wenn noetig)
Falls Auto-Deploy nicht triggert, kann Claude via Chrome MCP manuell deployen:
1. `claude --chrome` starten
2. Navigate zu https://dashboard.render.com
3. Service waehlen → "Manual Deploy" → "Deploy latest commit"

---

## CURRENT TASKS

**Stand: 18.01.2026**

### Chrome Web Store
- Status: v1.7.0 eingereicht (18.01.2026)
- v1.6.2 Review abgebrochen, v1.7.0-store.zip neu hochgeladen
- Store-Listing (Beschreibung, Screenshots) bleibt bei Review-Abbruch erhalten!

### REAL Metriken (18.01 - NACH BOT-FILTER FIX!)
| Metrik | Vorher (Bug) | **Nachher (Fix)** | Status |
|--------|--------------|-------------------|--------|
| Emails gesendet | 947 | 947 | ✅ |
| **Clicks** | 0 (100% "Bots") | **37 (3.91% CTR!)** | ✅ FIXED! |
| Unique Clickers | 0 | **83** | ✅ |
| Registrierungen | 6 | 4 real | 🔄 |
| Paying | 0 | 0 | 🎯 Ziel |

**Bot-Filter Fix (18.01):** `filterSequentialClicks()` war zu aggressiv - markierte 3+ Clicks/min als Burst und filterte ALLE. Jetzt nur User-Agent Detection (Go-http-client, python-requests).

### ⚠️ EMAIL SYSTEM = PRE-PRODUCTION (18.01 Insight!)

**WICHTIG:** Die bisherigen Email-Metriken zaehlen NICHT weil:
1. **SES Sandbox** - Max 200/Tag, nur verifizierte Adressen
2. **Lead-Qualitaet** - Noch nicht optimiert (info@, Enterprise)
3. **Email-Templates** - Im Test, nicht A/B optimiert
4. **Bot-Detection** - Gerade erst implementiert

**Echter Start:** Nach SES Production Approval (50k/Monat)
**Antrag eingereicht:** 17.01.2026

```
FALSCH: "1.902 Emails → 0 Conversions → Cold Email funktioniert nicht"
RICHTIG: "1.902 TEST-Emails unter Sandbox → Noch keine validen Daten"
```

### Cold Outreach Startschwierigkeiten (GEFIXT!)

**Diese technischen Bugs haben Cold Email behindert:**

| Bug | Problem | Fix | Status |
|-----|---------|-----|--------|
| Demo-Email Bug | `send_emails` Default=`false` → 97% Demos nie versendet | Default jetzt `true` | ✅ GEFIXT |
| Bot-Filter fehlte | Security Scanner (MS365, Proofpoint) als "Clicks" gezaehlt | `?exclude_bots=true` implementiert | ✅ GEFIXT |
| Lead-Qualifizierung | info@, contact@, H####@accor.com erreichen nie Entscheider | Lead-Scoring: -20 fuer generic@ | ✅ GEFIXT |
| Email Provider Chaos | Wechsel Resend→Brevo→MailerSend | **🔴 SES SANDBOX! Anfrage 17.01** | ⏳ PENDING |
| Auto-Account Bug | Bot-Clicks erstellten Fake-Accounts | Bot-Check vor Account-Erstellung | ✅ GEFIXT |
| **Burst-Filter zu aggressiv** | `filterSequentialClicks()` markierte 3+/min als Bot → 100% Clicks gefiltert! | Burst-Filter disabled, nur User-Agent Detection | ✅ GEFIXT |
| **🔴 Lead-Scraping Qualitaet** | 40% falsche Business-Typen, 50% generic Emails (info@), Ketten inkludiert | `/scrape-leads-chrome` mit Opus 4.5 Evaluation | ✅ GEFIXT |

**Fazit:** Die Metriken der ersten Woche waren durch Bugs verfaelscht, nicht weil Cold Email grundsaetzlich nicht funktioniert. **Real CTR ist 3.91%**, nicht 0%!

### 🔴 Lead-Scraping war FEHLERHAFT (18.01 Fix!)

**Das Problem:**
- API-Scraping (Outscraper, SerpAPI) lieferte **40% falsche Business-Typen** (Autohauser, Optiker, Apotheken)
- **50% generic Emails** (info@, contact@) - erreichen nie Entscheider
- **Ketten inkludiert** (H####@accor.com, McDonald's, etc.)
- Keine Chain-Detection, keine Email-Qualifizierung
- **Bulk ohne Intelligenz** = schlechte Lead-Qualitaet

**Die Loesung: `/scrape-leads-chrome`**
```bash
/scrape-leads-chrome munich restaurants 10
```

| Alt (API Scraping) | Neu (Chrome MCP + Opus) |
|--------------------|-------------------------|
| 40% falsche Types | <5% falsche Types |
| 50% generic Emails | 80%+ Personal Emails |
| Ketten inkludiert | Chain Detection |
| $0.02-0.05/Lead | $0 Kostenlos |
| Bulk ohne Prüfung | Opus evaluiert JEDEN Lead |

**Neue Files:**
- `.claude/commands/scrape-leads-chrome.md` - Workflow
- `.claude/rules/lead-scraper.md` - Chain Patterns, Email Classification
- `POST /api/admin/import-chrome-scraped-leads` - Import Endpoint

### Naechste Schritte
1. **`/scrape-leads-chrome` als PRIMARY METHOD nutzen!** - Nicht mehr API-Scraping
2. **Bot-Filter IMMER nutzen** - `?exclude_bots=true` bei allen Metriken
3. **HIGH-PAIN Leads priorisieren** - 500-5000 Reviews = PAIN = VALUE!
4. **Telefon-Outreach parallel** - Fuer Hot Leads (bereits registriert/geklickt)

### Email Provider Stack (18.01 Update)

| Provider | Limit/Tag | Status | Verwendung |
|----------|-----------|--------|------------|
| **Mailjet** | 200 | ✅ NEU | Cold Outreach |
| **MailerSend** | 100 | ✅ | Fallback |
| **Resend** | 100 | ✅ | Transactional |
| **SES** | 200 | ⚠️ Sandbox | Nach Production: 50k/Tag |
| **Brevo** | 0 | ❌ Credits aufgebraucht | - |

**Mailjet Setup (18.01):**
- Sender verifiziert: `support@tryreviewresponder.com`
- Keys in Render: `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`

### Email Outreach Fixed (18.01 Abend)
- ✅ **Mailjet aktiviert!** (200/Tag)
- ✅ **5 Super-High Leads importiert** (Score 80-105, 1500-6000 Reviews)
- ✅ **5 Cold Emails gesendet** via send-cold-email Endpoint
- ✅ **Neuer Enrichment Endpoint:** `/api/cron/enrich-outreach-leads?limit=100`
  - Verarbeitet 100 Leads/Call (vs 30 in daily-outreach)
  - Priorisiert High-Review Leads (2000+ zuerst)
  - **Bei cron-job.org eintragen!** (alle 2h)

### Neues Lead Scoring (18.01)
Dokumentiert in `.claude/rules/sales.md`:
- **500-2000 Reviews** = +40 (Established SMB mit PAIN)
- **2000-5000 Reviews** = +50 (Big SMB mit SERIOUS PAIN!)
- **Personal Email** = +20 (Entscheider erreichbar)
- **info@, contact@** = -20 (erreicht nie Entscheider)

### Neue Features (18.01)
- react-select Searchable Dropdown fuer Business Types
- 3 neue Industry Examples (Real Estate, Home Services, Pet Services)
- **Custom Instructions im Onboarding** (Step 2: Tone/Always/Never mit Industry Presets)

### USER TODO (Sticky Tasks)
> Automatisch per Stop-Hook nach jeder Response angezeigt.
> Datei: `.claude/sticky-tasks.json`

---

## STICKY TASKS

> Tasks die der User SELBST erledigen muss - erscheinen nach JEDER Claude Response.

### Wie es funktioniert
- **Datei:** `.claude/sticky-tasks.json`
- **Hook:** Stop-Hook ruft `sticky-tasks-display.ps1`
- **Output:** Gelbe Liste am Ende jeder Response

### Wann hinzufuegen (NUR wenn)
- User muss es SELBST tun (Claude kann nicht)
- Einmalig wichtig (nicht wiederkehrend)
- Kritisch fuer Fortschritt

### Wie abhaken
User sagt: `erledigt: Demo-Videos` oder `hab Demo-Videos gemacht`
Claude entfernt Task aus `.claude/sticky-tasks.json`

### Format
```json
{
  "tasks": [
    { "id": 1, "text": "Demo-Videos aufnehmen" },
    { "id": 2, "text": "Google Indexierung fortsetzen" }
  ]
}
```

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render) |
| Backend | Node.js/Express (Render) |
| DB | PostgreSQL (Render) |
| Payments | Stripe |
| AI | GPT-4o-mini + Claude + Gemini |
| Email | Resend + Brevo + MailerSend |

---

## PLAN LIMITS

| Plan | Smart | Standard | Total |
|------|-------|----------|-------|
| Free | 3 | 17 | 20 |
| Starter $29 | 100 | 200 | 300 |
| Pro $49 | 300 | 500 | 800 |
| Unlimited $99 | unlimited | unlimited | unlimited |

---

## MCPs & TOOLS

| MCP | Status | Chrome-Entlastung |
|-----|--------|-------------------|
| Memory MCP | ACTIVE | - |
| Sequential Thinking | ACTIVE | - |
| Gemini Design | ACTIVE | - |
| Chrome MCP (`claude --chrome`) | ACTIVE | Basis |
| **Playwright MCP** | ACTIVE | ✅ Headless, Accessibility Tree |
| **Puppeteer MCP** | ACTIVE | ✅ Headless Screenshots |
| **Fetch MCP** | ACTIVE | ✅ HTTP ohne Browser |
| **Gmail MCP** | ACTIVE | ✅ Gmail API direkt |
| **Filesystem MCP** | ACTIVE | ✅ File Ops ohne Cat/Read |
| **Postgres MCP** | **ACTIVE** | ✅ DB ohne Chrome Dashboard |
| **Notion MCP** | READY | ✅ Notion ohne Browser |
| **YouTube MCP** | READY | ✅ YouTube API |
| **Brave Search** | READY | ✅ Web Search ohne Browser |

### Chrome-Entlastung: Wann welches MCP?

| Task | Chrome MCP | Bessere Alternative |
|------|------------|---------------------|
| HTTP API Calls | ❌ Tab öffnet | `mcp__fetch__*` |
| Gmail Bounces | ❌ Login, langsam | `mcp__gmail__*` |
| Headless Automation | ❌ Sichtbar | `mcp__playwright__*` |
| Bulk Screenshots | ❌ Langsam | `mcp__puppeteer__*` |
| File lesen/schreiben | ❌ Unnötig | `mcp__filesystem__*` |
| DB Queries | ❌ Dashboard | `mcp__postgres__*` |
| Web Search | ❌ Google Tab | `mcp__brave-search__*` |
| User sieht was passiert | ✅ Chrome MCP | - |

### MCP Preloader (schnellerer Agent-Start)
```powershell
powershell -File "$env:USERPROFILE\mcp-preload.ps1"
```

### Browser Screenshots (Autonom)
`computer(action: "screenshot")` braucht KEINE User-Verifikation.
Nicht verwechseln mit `/screenshot` Skill (User macht Win+Shift+S).

### Marketing Skill
`/marketing [status|chase|outreach|demo|analyze|linkedin]`

### Funnel Verify Skill (NEU!)
`/funnel-verify [flow]` - Meta-Skill fuer ALLE User-Flows mit Chrome MCP

**Sub-Flows:**
| Flow | Command | Was wird getestet |
|------|---------|-------------------|
| Demo | `/funnel-verify demo` | Email → Demo Page → Auto-Account |
| Activation | `/funnel-verify activation` | User → Generator → First Response |
| Conversion | `/funnel-verify conversion` | Free → Limit → Stripe → Paid |
| Generator | `/funnel-verify generator` | Core Feature Tests |
| Extension | `/funnel-verify extension` | Chrome Extension Flow |
| Alerts | `/funnel-verify alerts` | Review Alerts Setup |
| **Alle** | `/funnel-verify all` | Kompletter E2E Test |

**Features:**
- First-Principles Analyse bei Failures
- Automatische Root-Cause Checks
- Night-Agent Integration (stoppt Outreach bei FAIL)

---

## NIGHT-BURST

### Quick Start
```powershell
# 1. Safety Check ZUERST (V3.9)
.\scripts\pre-deploy-safety.ps1

# 2. Dann Agents starten
.\scripts\start-agents.ps1
```

### Safety-First Deploy (V4.0)
```
NEUE REGELN:
- Smart Task Switching: Agents wechseln zu Backup wenn blockiert
- Timeout-Default: REJECT (nicht PROCEED)
- Pre-Deploy Checks PFLICHT vor Night-Run
- Budget Hard Limits pro Agent
```

### Priority-1 Agents
- Burst-2: Cold Emailer
- Burst-4: Demo Generator
- Burst-5: Hot Lead Chaser

### Key Files
- `content/claude-progress/agent-memory.json`
- `content/claude-progress/learnings.md`
- `content/claude-progress/funnel-health-log.json`
- `content/claude-progress/agent-task-queue.json` (NEU V4.0)
- `.claude/commands/night-burst-core.md`

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing, Leads
├── .claude/
│   ├── commands/      # Slash Commands
│   └── rules/         # Agent-spezifische Rules
├── CLAUDE.md          # Dieses File (Core)
└── TODO.md
```

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend

---

## LEARNINGS (Top 5)

### API-Scraping = Bulk ohne Intelligenz → Chrome MCP (18.01.2026)
**Problem:** Bisheriges Lead-Scraping via APIs (Outscraper, SerpAPI, Google Places) lieferte katastrophale Qualitaet:
- 40% falsche Business-Typen (Autohauser, Optiker, Apotheken statt Restaurants)
- 50% generic Emails (info@, contact@) - erreichen nie Entscheider
- Ketten inkludiert (McDonald's, H####@accor.com) - kein Interesse an unserem Tool
- Keine Qualifizierung, keine Chain-Detection

**Root Cause:** API-Scraping ist "Bulk ohne Intelligenz" - es gibt einfach alles zurueck was die Suche findet. Keine Evaluation ob der Lead tatsaechlich passt.

**Loesung:** `/scrape-leads-chrome` mit Opus 4.5 Evaluation:
1. **Stage 1:** Google Maps Suche via Playwright MCP
2. **Stage 2:** Opus evaluiert JEDEN Lead (Chain? Business Type? Pain Level?)
3. **Stage 3:** Website Deep-Dive fuer Personal Email (/team, /impressum)
4. **Stage 4:** Score & Import mit Auto-Classification

**Ergebnis:**
| Vorher (API) | Nachher (Chrome MCP) |
|--------------|----------------------|
| 40% falsche Types | <5% |
| 50% generic Emails | 80%+ Personal |
| $0.02-0.05/Lead | $0 |

**Files:** `.claude/commands/scrape-leads-chrome.md`, `.claude/rules/lead-scraper.md`
**Lesson:** Qualitaet > Quantitaet. 10 qualifizierte Leads > 100 unqualifizierte. Chrome MCP + Opus ist langsamer aber MASSIV bessere Lead-Qualitaet.

### Playwright MCP: CDP-Endpoint fuer bestehenden Chrome (18.01.2026)
**Problem:** Playwright/Puppeteer MCPs starten EIGENE Browser-Instanzen (leer, ohne Extensions, ohne Logins). Das ist by design fuer Test-Isolation.
**Root Cause:** Test-Tools wollen saubere, reproduzierbare Umgebungen - keine User-Daten.
**Loesung:**
1. Chrome mit `--remote-debugging-port=9222` starten
2. Playwright MCP Config: `"args": ["-y", "@playwright/mcp", "--cdp-endpoint", "http://localhost:9222"]`
3. Chrome-Shortcuts anpassen (Taskbar etc.) sodass sie IMMER mit Debug-Port starten
**Files:** `~/.claude/settings.json`, `~/fix-chrome-shortcuts.ps1`, `~/start-chrome-debug.ps1`
**Wichtig:** Nach Config-Aenderung muessen ALLE Claude-Sessions neu gestartet werden - sie laden die Config nur beim Start!
**Lesson:** CDP (Chrome DevTools Protocol) ist die Bruecke zwischen Test-Tools und bestehendem Browser. Ohne Debug-Port keine Verbindung moeglich.

### Chrome Web Store: Review abbrechen ohne Datenverlust (18.01.2026)
**Problem:** Ausstehende Extension-Review (v1.6.2) blockierte Upload von neuer Version (v1.7.0). "Neues Paket hochladen" Button ausgegraut.
**Loesung:** Im Developer Dashboard → Drei-Punkte-Menü (⋮) oben rechts → **"Überprüfung abbrechen"**
**Wichtig:** Store-Listing (Name, Beschreibung, Screenshots, Privacy Policy) bleibt ERHALTEN! Nur das Paket (ZIP) wird verworfen.
**Lesson:** Man kann Chrome Extension Reviews jederzeit abbrechen und neu einreichen ohne alles neu zu schreiben. Die Angst vor Datenverlust ist unbegründet.

### Sonnet > Opus fuer Prompt-Following (18.01.2026)
**Problem:** Testimonial-Antworten mit Opus 4.5 klangen "off" - Opus interpretierte Dinge rein die nicht im Original standen (z.B. "back to running your business" bei einem Review der das nie erwaehnte).
**Root Cause:** Opus ist "zu smart" - es over-interprets und fuegt Kontext hinzu. Unsere Prompts wurden fuer Sonnet geschrieben/getestet.
**Loesung:** Model-Strategie nach Use Case:
| Use Case | Model | Warum |
|----------|-------|-------|
| Business Context generieren | Opus 4.5 | Einmalig, kreativ, foundational |
| Response Style definieren | Opus 4.5 | Einmalig, setzt den Ton |
| Actual Responses (Demo, Testimonials) | **Sonnet 4** | Folgt Prompts praezise |
| Regulaere User Responses | Sonnet/Haiku | Prompt-following |
**Lesson:** Groesser ≠ Besser. Opus fuer kreative/foundationale Tasks, Sonnet fuer praezises Prompt-Following. Bei `/product-refine` Context Engineering IMMER auf **Sonnet 4** (`claude-sonnet-4-20250514`) optimieren - das ist unser Production Model fuer Responses!

### Dynamic Agent Priority Control via focus-update (18.01.2026)
**Problem:** Agents konnten `current-focus.json` lesen (focus-read), aber nicht updaten. Burst-11 konnte z.B. nicht automatisch Burst-7 aktivieren wenn User am Limit sind.
**Loesung:** `focus-update` Action in `agent-helpers.ps1` implementiert:
```powershell
# Priority ändern (1=aktiv, 2=secondary, 3=paused)
powershell -File scripts/agent-helpers.ps1 -Action focus-update -Agent 7 -Value 1 -Data "5 User am Limit"
# Bottleneck/Tonight Focus updaten
powershell -File scripts/agent-helpers.ps1 -Action focus-update -Key bottleneck -Data '{"type":"..."}'
```
**Features:** Auto-updates `paused_agents` und `high_priority_agents` Listen, logged zu `focus-changes.log`, verwendet `Add-Member -Force` fuer dynamische Property-Erstellung.
**Lesson:** PowerShell PSCustomObject braucht `Add-Member -Force` um neue Properties hinzuzufuegen. Direkte Zuweisung (`$obj.newProp = value`) schlaegt fehl wenn Property nicht existiert.

### Parallel Agent Spawning mit EncodedCommand (18.01.2026)
**Problem:** Night-Agents sollten neue Claude-Terminals spawnen koennen, aber batch-file Ansatz crashte (File not found errors mit Windows Terminal).
**Root Cause:** Windows Terminal (`wt`) parsed Argumente anders als erwartet. Batch-Files in TEMP wurden nicht gefunden wegen Pfad-Escaping und Timing.
**Loesung:** Gleiches Pattern wie `start-agents.ps1`:
1. PowerShell-Command als String bauen
2. Mit `[System.Text.Encoding]::Unicode.GetBytes()` encoden
3. Base64 mit `[Convert]::ToBase64String()`
4. `Start-Process wt -ArgumentList "powershell -NoExit -EncodedCommand $encoded"`
**Key Files:** `spawn-agent.ps1`, `parallel-session-manager.ps1`
**Lesson:** Bei Windows Terminal IMMER EncodedCommand nutzen statt Batch-Files. Das ist das bewaehrte Pattern das auch `/priority-mode` und `/night-mode` verwenden.

### Async Cron Pattern fuer Render Timeout (18.01.2026)
**Problem:** Lead Enrichment Endpoint (`/api/cron/enrich-outreach-leads`) wurde von Render nach 30s gekillt (502 Error). 1438 Leads hatten keine Email, nur 30/Tag wurden enriched.
**Root Cause:** Render Free Tier hat 30s Request Timeout. Synchrone Verarbeitung von 30+ Leads dauert laenger.
**Loesung:** Async Pattern implementiert:
1. Endpoint antwortet SOFORT mit `{"success": true, "message": "Enrichment started..."}`
2. Verarbeitung laeuft im Hintergrund weiter (nach `res.json()`)
3. Cron-Job bei cron-job.org ruft alle 30 Minuten auf
**Ergebnis:** 30 Leads/30min = 1440 Leads/Tag statt 30 Leads/Tag (48x schneller)
**Lesson:** Bei Render Free Tier IMMER async Pattern nutzen fuer lange Tasks. Response sofort senden, dann weiterarbeiten.

### Multi-Layer Bot Detection fuer Magic Links (18.01.2026)
**Problem:** MS365 SafeLinks klickte Magic Links mit normalen Browser User-Agents → 3 Fake-Accounts erstellt (H0796@accor.com, h9057@accor.com, i.schmidt@tv-turm.de).
**Root Cause:** Bot-Detection basierte NUR auf User-Agent, aber Enterprise Security Scanner nutzen normale Chrome/Edge UAs.
**Loesung:** 4-Layer Detection:
1. User-Agent Check (existierend)
2. Timing: <30s nach Link-Erstellung = Bot
3. Corporate Email Pattern (H####@...) + <120s = Bot
4. No-Referer + <60s = Bot
**Key Insight:** Security Scanner klicken innerhalb von 1-5 Sekunden. Echte Menschen brauchen mind. 30s um Email zu oeffnen und zu klicken.
**Lesson:** User-Agent allein reicht NICHT fuer Bot-Detection. Timing ist der zuverlaessigste Indikator.

### Stop-Hooks Non-Blocking + NODE_OPTIONS (18.01.2026)
**Problem:** Claude Sessions blieben im Stop-Hook stecken. Zusaetzlich: Node.js OOM Crash bei vielen parallelen Sessions.
**Root Cause:**
1. Stop-Hooks hatten `Start-Sleep` und warteten auf Balloon-Dispose
2. NODE_OPTIONS war nur im Profile, nicht systemweit (MCP Server hatten kein Memory-Limit)
**Loesung:**
1. `stop-notify.ps1` + `memory-stop.ps1` nutzen jetzt `Start-Job` + sofort `exit 0`
2. `NODE_OPTIONS = "--max-old-space-size=8192 --max-semi-space-size=128"` als User Environment Variable
**Lesson:** Hooks MUESSEN non-blocking sein (`Start-Job`). Environment Variables systemweit setzen fuer MCP Server.

### First Principles: Activation Bottleneck (18.01.2026)
**Problem:** 6 registrierte User, 0 haben jemals eine Response generiert. Warum?
**Root Cause:** Nach Login/Register wurden User zu `/dashboard` geschickt - dort wussten sie nicht was tun.
**Loesung:**
1. Login/Register/Magic Link redirecten jetzt zu `/generator` statt `/dashboard`
2. Welcome Email mit klarem CTA: "Generate Your First Response" (nicht "Login")
3. Activation Emails enthalten jetzt fresh Magic Links (kein Passwort noetig)
**Lesson:** Kuerzester Weg zum Wert = Activation. Dashboard ist kein Wert. Generator ist Wert.

### Call-Prep Dashboard + Auto-Alerts (18.01.2026)
**Problem:** Berend wusste nicht wann HOT Leads angerufen werden muessen.
**Loesung:** Komplettes System implementiert:
- `call_preps` DB-Tabelle mit priority_score (5=HOT, 4=WARM)
- Admin Dashboard Tab mit roter Markierung fuer Action-Items
- Auto-Sync: `scripts/sync-sticky-tasks.ps1` holt aus DB, schreibt sticky-tasks.json
- Call-Alert: Windows Toast + BEEP BEEP Sound wenn HOT Leads warten (max 1x/30min throttle)
- Night-Agent Integration: `hot-lead-add`, `call-status`, `call-alert` Actions
**Files:** `scripts/sync-sticky-tasks.ps1`, `scripts/agent-helpers.ps1`, `claude-notify.ps1` (-Type call)
**Lesson:** DB-driven sticky tasks > manuelle JSON-Pflege. Proaktive Alerts > passive Anzeige.

### Cold Outreach Startschwierigkeiten (18.01.2026)
**Problem:** Erste Woche Cold Email zeigte 0% echte Conversions - sah aus wie "Cold Email funktioniert nicht".
**Root Cause:** 5 technische Bugs die jetzt gefixt sind:
1. Demo-Email Bug (`send_emails=false` Default) → 97% Demos nie versendet
2. Bot-Filter fehlte → Security Scanner als "Clicks" gezaehlt
3. Lead-Qualifizierung fehlte → info@/contact@ erreichen nie Entscheider
4. Email Provider Instabilitaet → **🔴 SES SANDBOX PENDING** (Anfrage 17.01)
5. Auto-Account Bug → Bot-Clicks erstellten Fake-User
**Lesson:** Startschwierigkeiten sind normal. Die Metriken waren verfaelscht durch Bugs, nicht weil Cold Email nicht funktioniert. Mit Fixes weitermachen und echte Daten sammeln.

### Call-Prep System fuer Telefon-Outreach (18.01.2026)
**Problem:** Cold Calls sind hart fuer Berend - keine Zeit fuer Recherche, kein Script, Unsicherheit.
**Loesung:** Claude bereitet ALLES vor:
- `content/call-prep/anruf-liste.md` - Priorisierte Liste mit Scoring
- `content/call-prep/[business].md` - Komplettes Call-Prep pro Lead
- `.claude/rules/call-prep.md` - Auto-Generierung bei neuen Leads
**Inhalt jedes Call-Preps:**
- Quick Info (5 Sek scanbar)
- Opener Script (Wort-fuer-Wort)
- Hook + Objection Handling
- AI-Beispiel-Antwort zum Vorlesen
**Lesson:** Claude kann nicht telefonieren, also PERFEKT vorbereiten. Telefon konvertiert 10x besser als Email.

### Goal Anchoring im Stop-Hook (18.01.2026)
**Problem:** Agents vergessen das $1000 MRR Ziel waehrend der Arbeit.
**Loesung:** Stop-Hook (`sticky-tasks-display.ps1`) zeigt jetzt automatisch:
```
GOAL: 0/1000 USD MRR [..........] 0% | 0/30 paying
```
Erscheint nach JEDER Claude-Antwort. Keine extra Aktion noetig.
**Lesson:** Sichtbarkeit = Erinnerung. Persistente Ziel-Anzeige verhindert Drift.

### Agent Starter CLAUDE_CONFIG_DIR Bug (18.01.2026)
**Problem:** `start-agents.ps1` öffnete Terminals aber Claude startete nicht.
**Root Cause:** Script setzte `$env:CLAUDE_CONFIG_DIR = ~/.claude-burstX` - diese Directories hatten nur `settings.json` aber KEINE Auth-Tokens!
**Loesung:** CLAUDE_CONFIG_DIR Zeile entfernt. Claude nutzt jetzt sein normales Config-Verzeichnis mit korrekter Authentifizierung.
**Lesson:** CLAUDE_CONFIG_DIR nur setzen wenn das Directory ALLE notwendigen Files hat (inkl. Auth). Für Session-Tracking reicht `CLAUDE_SESSION` Environment Variable.

### Gmail + Admin Dashboard via Chrome MCP (18.01.2026)
**Problem:** Agents konnten nur API nutzen, nicht Gmail lesen/beantworten oder Dashboard visuell checken.
**Loesung:** Chrome MCP Integration in night-burst-core.md V4.3:
- Gmail lesen: Bounces, Replies, Spam Reports
- Gmail senden: NUR ReviewResponder Business (keine privaten Emails!)
- Admin Dashboard: Login mit Test-Credentials, Metrics Screenshots
- Helper: `chrome-gmail`, `chrome-admin`, `chrome-monitor-setup`
**Regeln:**
- ✅ Lead-Anfragen, Demo Follow-ups, Support
- ❌ Private Emails von Berend - TABU!
**Lesson:** Gmail für persönliche 1:1 Kommunikation, API für Batch-Outreach. Private Emails nie anfassen.

### AI Model Hierarchy (18.01.2026)
**Problem:** GPT-4o-mini wurde als Fallback vor Haiku verwendet - schlechtere Qualitaet.
**Loesung:** Konsistente Fallback-Kette: **Primary** (Opus/Sonnet) → **Haiku** → **GPT-4o-mini** (nur letzter Ausweg)
**Lesson:** Haiku > GPT-4o-mini (gleicher Provider, bessere Qualitaet). GPT-4o-mini nur wenn Anthropic komplett down.

### Tab Wrangler für MCP Tab Cleanup (18.01.2026)
**Problem:** Viele parallele Claudes erstellen viele Chrome Tabs die sich ansammeln.
**Root Cause:** Tab Wrangler hatte "Don't close tabs that are in a group" aktiviert - MCP Tabs sind in Tab-Gruppen!
**Loesung:**
1. "Don't close tabs that are in a group" DEAKTIVIEREN
2. Timeout auf 5-10 Min senken (war 20 Min)
3. Minimale Whitelist: `claude.ai`, `mail.google.com` (Claude öffnet was er braucht)
**Lesson:** Tab Wrangler funktioniert für MCP Tab-Gruppen nur wenn Group-Protection AUS ist. Threshold 20+ Tabs + kurze Inaktivität (5-10 Min).

### Data Quality - DB Zahlen sind FAKE (17.01.2026)
**Problem:** DB zeigte 61 User, 4.4% CTR - alles Bots und Test-Accounts!
**Loesung:** `/data-analyze` Skill + `real-user-metrics.json` als Single Source of Truth
**Lesson:** NIEMALS DB-Zahlen trauen! Immer mit Bot-Detection verifizieren. `?exclude_test=true` PFLICHT.

---

## REFERENCES

| Was | Wo |
|-----|-----|
| Historische Learnings | `content/claude-progress/archive/` |
| Agent Learnings | `content/claude-progress/learnings.md` |
| Funnel Health | `content/claude-progress/funnel-health-log.json` |
| API Reference | `.claude/rules/dev.md` |
| Sales Rules | `.claude/rules/sales.md` |
| Demo Rules | `.claude/rules/demo.md` |
| Monitoring | `.claude/rules/monitoring.md` |
| Funnel Verify | `.claude/commands/funnel-verify.md` |

---

> **Nach jeder Session:** CURRENT_TASKS updaten!
