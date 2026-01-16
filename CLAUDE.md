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

### 1b. Proaktives Admin Panel Update (AUTONOM!)
Claude updated das Admin Panel **automatisch** wenn:
- [ ] **Neues Feature** - Jede neue Funktionalität bekommt Admin-Sichtbarkeit
- [ ] **Wichtige Metriken** - Zahlen die Claude oder Berend sehen sollten
- [ ] **Debug-Info** - Status von Prozessen, Errors, Logs
- [ ] **Neue Datenquellen** - Wenn neue Daten verfügbar sind (Leads, Conversions, etc.)

**Beispiele wann updaten:**
- Neuer Cron Job → Admin Card mit Status/Last Run
- Neue Email-Kampagne → Stats (sent, opened, clicked)
- Neuer Scraper → Lead-Counts, Erfolgsrate
- Bug gefunden → Error-Log im Admin sichtbar
- A/B Test → Beide Varianten + Ergebnisse

**Regel:** Wenn Claude denkt "das wäre nützlich im Admin zu sehen" → MACHEN!

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

## NIGHT-BURST V3.5 (REBOOTED 17.01.2026)

> **ZIEL:** 15 autonome Claude Agents die jede Nacht arbeiten.
> **REBOOT:** Prioritäten umgekehrt! Activation war FALSCH, Outreach ist das echte Problem.

### Quick Start
```powershell
.\scripts\start-night.ps1  # Interactive Menu
```

### Die 15 Agents (Nach Reboot!)

| # | Agent | Priority | Mission |
|---|-------|----------|---------|
| 1 | Lead Finder | 2 | Email Enrichment |
| **2** | **Cold Emailer** | **1** | **Cold Outreach senden** |
| 3 | Social DM | 3 | PAUSED |
| **4** | **Demo Generator** | **1** | **Demo-Emails fixen!** |
| **5** | **Hot Lead Chaser** | **1** | **67 Clicker follow-up** |
| 6 | User Activator | 3 | PAUSED - erst bei echten Usern |
| 7 | Payment Converter | 3 | PAUSED - erst bei aktiven Usern |
| 8 | Upgrader | 3 | PAUSED |
| 9 | Doctor | 2 | Monitoring 1x/Tag |
| 10 | Morning Briefer | 3 | Morning only |
| 11 | Bottleneck Analyzer | 2 | Analysis 1x/Tag |
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

**Stand: 17.01.2026**

### Chrome Web Store
**Status:** Überprüfung läuft (eingereicht 13.01)
- Extension v1.6.1
- Test Account: reviewer@tryreviewresponder.com

### Metriken (17.01 01:15 UTC)
- **2,498 Leads**
- **1,496 Emails** gesendet
- **67 Clicks** (4.5% CTR)
- **42 Users** (0 paying)
- **0 Conversions** ← Hauptfokus!
- **Burst-6 aktiviert** - 17 Activation Emails gesendet

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
- `amazon_seller_leads` (NEW):
  - `status`: 'new' | 'contacted' | 'clicked' | 'converted' | 'unsubscribed'
  - `demo_token`: Für Click-Tracking (Format: `amz_[timestamp]_[random]`)
  - Indexes: `idx_amazon_seller_status`, `idx_amazon_seller_email`

### API Limits + Caching
- **SerpAPI:** ÜBER LIMIT - Cache nutzen!
- **Fallback Order:** Cache → Outscraper → SerpAPI → Google Places → Expired Cache

### Email Deliverability
- "Hey" statt "Hallo" → Primary Inbox
- Keine Emojis, keine Marketing-Floskeln
- HTML Emails mit CTA-Button > Plain Text mit nackter URL
- FRONTEND_URL MUSS Fallback haben: `process.env.FRONTEND_URL || 'https://tryreviewresponder.com'`

### Discount Code Validation (16.01)
**Problem:** CLICKER30 wurde in 9 Emails erwähnt aber NIE im Stripe-Handler implementiert.
**Lesson:** Vor neuem Discount-Code IMMER prüfen:
1. Ist der Code in `validDiscountCodes` Handler? (create-checkout-session)
2. Wird ein Stripe Coupon erstellt?
3. Steht der Code in `discountInfo` Lookup?
**Fix:** CLICKER30 → DEMO30 ersetzt (DEMO30 war bereits implementiert).

### AI Response Qualität
**Blacklisted:** "Thank you for your feedback", "We appreciate...", "thrilled", "delighted"
**Gut:** Kurz, spezifisch, Reviewer beim Namen nennen.

### AnyDesk Remote Access (16.01)
**Problem:** Laptop zugeklappt → AnyDesk zeigt "Waiting for image" → kein Bild.
**Ursache:** Windows deaktiviert Display bei Zuklappen, auch wenn Standby aus ist.
**Lösung:** HDMI Dummy Plug (~5€) simuliert Monitor → Bild bleibt aktiv.
**PowerShell für Zuklappen:** `powercfg -setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0; powercfg -setactive SCHEME_CURRENT`

### Ralph-Loop Hook-Loop Bug (16.01)
**Problem:** Stop-Hook feuert endlos mit Syntax Error (Windows VC_redist Logs statt JSON als Input).
**Ursache:** Alte `.claude/ralph-loop.local.md` State-Datei existierte, Plugin war disabled aber Hook feuerte trotzdem.
**Fix (3 Schritte):**
1. `rm .claude/ralph-loop.local.md` - State-Datei löschen
2. Hook-Ordner umbenennen: `mv ~/.claude/plugins/cache/claude-plugins-official/ralph-loop/*/hooks ~/.claude/plugins/cache/claude-plugins-official/ralph-loop/*/hooks.disabled`
3. **Neues Terminal öffnen** - Session hat Hook gecached!
**Lesson:** Bei Plugin-Problemen IMMER neues Terminal nach Fixes.

### Demo Generation API (16.01)
**Problem:** `/api/demo/generate` gibt "Could not find business" oder 0 responses.
**Ursachen:**
1. Google Places API findet Business nicht → **Exakter Name + City** nötig
2. Business hat nur 5-Sterne Reviews → keine negativen zum Antworten
**Lösungen:**
- `focus: "mixed"` Parameter nutzen bei nur positiven Reviews
- Business-Namen genau wie auf Google Maps schreiben
- City ohne Länderkürzel (z.B. "Munich" nicht "Munich, Germany")

### Burst-15 Approval Gate Pattern (16.01)
**Problem:** Continuous 5-min Loop Monitoring bei leerer Queue verschwendet Ressourcen.
**Beobachtung:** 2 kritische Approvals ohne Berend-Response → Timeouts angewendet.
**Learning:** approval-queue.md/berend-feedback.md wird nicht aktiv gelesen.
**Empfehlung:**
- Approval Gate nur bei neuen Approvals starten (event-based)
- Oder: längere Intervalle (30min) wenn Queue leer
- Alternative: direkter Chat/Email für kritische Approvals

### Night-Burst-10 Morning Briefer Pattern (17.01)
**Problem:** Continuous 30-min Loop Monitoring verschwendet Ressourcen wenn System offline.
**Beobachtung:** 6 von 9 Agents waren STALE (>24h), Burst-6 nie gestartet.
**Learning:** Morning Briefer braucht kein dauerhaftes Monitoring.
**Empfehlung:**
- Briefer einmal morgens starten (nicht als Loop)
- Oder: Event-based triggern wenn Agents wieder laufen
- Erst Agents neustarten, dann Monitoring sinnvoll

### Magic Link Activation FIX (17.01)
**Problem:** 0% Activation für Magic Link Users (vs 31.6% normal signup).
**Ursache:** Magic Link redirected zu `/dashboard` statt `/generator`.
**Fix:** `navigate('/generator')` in MagicLoginPage (App.js:4441)
**Lesson:** Erste User-Erfahrung nach Login entscheidend für Activation.

### Demo Email Bug FIX (17.01)
**Problem:** 97% der generierten Demos wurden nie per Email verschickt.
**Ursache:** `/api/cron/generate-demos` hatte `send_emails` Default auf `false`.
**Fix (2 Teile):**
1. Default auf `true` geändert: `send_emails !== 'false'` (statt `=== 'true'`)
2. Neuer Endpoint: `GET /api/cron/send-pending-demo-emails?secret=XXX`
   - Findet alle Demos ohne `email_sent_at`
   - Sendet Demo-Emails an zugehörige Leads
   - Parallel-safe mit `wasEmailRecentlySent()`
**Lesson:** Bei Cron-Parameter-Defaults immer überlegen was "vergessen" bedeutet.

### Night-Burst-2 API Endpoints (17.01)
**Problem:** Dokumentierte Endpoints existierten nicht.
**Was NICHT existiert:**
- `/api/admin/daily-email-count`
- `/api/admin/next-uncontacted-lead`
- `/api/cron/send-single-outreach`

**Was FUNKTIONIERT:**
- `GET /api/admin/scraped-leads?status=new&limit=10` - Leads finden
- `POST /api/admin/send-cold-email` - Einzelne Email senden (Body: to, name, reviews, type)
- `GET /api/cron/turbo-email` - Batch senden (kann Timeout haben)

**Lesson:** Bei Agent-Skills immer erst die tatsächlichen API Endpoints testen!

### Burst-12 Creative Strategist Ineffizienz (16.01)
**Problem:** Burst-12 als reiner Monitor ist ineffizient wenn keine A/B Tests laufen.
**Beobachtung:**
- Dauerhaftes Stagnation-Monitoring am Anfang ist Ressourcenverschwendung
- Review Alerts Feature (ROOT CAUSE Fix) per Timeout zur Implementation freigegeben
**Empfehlung:**
- Burst-12 nur bei aktiven A/B Tests oder konkreten Metriken-Regressions starten
- Am Anfang: Lieber anderen Agents helfen (Lead Gen, Email, Demos) statt passiv monitoren
- Erst bei >5 zahlenden Kunden wird A/B Testing relevant

### Burst-11 Bottleneck Analysis (17.01)
**Kritische Erkenntnisse:**
1. **Demo Email System KAPUTT:** 100 Demos generiert, nur 3 Emails gesendet (3%)
   - 97% der generierten Demos werden NICHT an Leads gemailt
   - Vermutlich Cron Job oder Email Service Problem
2. **Magic Link Activation = 0%:** Alle 4 Magic Link Users haben das Produkt NIE genutzt
   - Normal Signup: 31.6% Activation
   - Magic Link: 0% Activation
   - User landen nach Login im Dashboard statt direkt beim Generator
**Empfehlung:**
- SOFORT: `/api/cron/generate-demos` prüfen - sendet der Emails?
- Magic Link Login → Redirect direkt zu `/generator` statt Dashboard
- Monitoring-Agents (Burst-11) am Anfang weniger sinnvoll als Action-Agents

### Night-Burst System Reboot (17.01.2026)
**Problem:** Agents diagnostizierten "User Activation" als Bottleneck, aber:
- Die 29% Activation Rate basierte auf **Test-Accounts und Freunden**
- Von ~20 echten Usern hat **NIEMAND** je das Produkt genutzt
- Das echte Problem war **OUTREACH → FIRST USE**, nicht Activation

**Agent-System Fehler:**
1. **Falsche Daten:** Metriken basierten auf verfälschten Test-Account Zahlen
2. **Passives Warten:** Agents warteten auf Events statt proaktiv zu handeln
3. **Mutual Dependency:** Burst-7 wartete auf Burst-6, Burst-6 wartete auf User...

**Fixes implementiert:**
- `current-focus.json` mit echten Metriken (real_users: 20, real_activation: 0%)
- Neue Prioritäten: Burst-2/4/5 = Priority 1, Burst-6/7 = Priority 3 (PAUSED)
- "Never Wait" Regel in `night-burst-core.md`
- Proaktiver Task-Wechsel erlaubt
- `?exclude_test=true` Filter für alle User-Metriken

**Lesson:** Metriken IMMER validieren. Test-Accounts können Entscheidungen komplett verfälschen.

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

### Amazon Sellers (NEW)
- `GET /api/admin/amazon-dashboard` - Stats & Metriken
- `GET /api/admin/amazon-leads` - Lead Liste mit Pagination (params: status, limit, offset, search)
- `POST /api/admin/amazon-leads` - Manuell Lead hinzufügen
- `POST /api/admin/amazon-leads/bulk` - Bulk Import
- `DELETE /api/admin/amazon-leads/:id` - Lead löschen
- `GET /api/amazon-demo/:token` - Demo Link mit Click-Tracking

### Cron
- `GET /api/cron/daily-outreach|demo-followup|night-blast|night-loop`
- `GET /api/cron/send-amazon-emails?secret=ADMIN_SECRET` - Amazon Seller Emails (params: limit, dry_run)

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
- **Amazon Seller Email System** (NEW 16.01.2026)
  - Dedizierte Tabelle: `amazon_seller_leads`
  - Admin Tab: "Amazon Sellers" mit Metriken & Lead-Verwaltung
  - Cron: `/api/cron/send-amazon-emails`
  - Click-Tracking: `/api/amazon-demo/:token`

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
