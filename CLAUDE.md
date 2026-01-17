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
| `.claude/secrets.local` | Admin URLs, API Keys |

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
| 6 | **ECHTER USER = 1+ Generierung (egal wo!)** | responses ODER demo_generations |

---

## AGENT-SPEZIFISCHE RULES

| Agent | Rule File | Auto-Load |
|-------|-----------|-----------|
| Burst-1,2,3,5 (Sales) | `.claude/rules/sales.md` | Email, Discount, Lead-DB |
| Burst-4 (Demo) | `.claude/rules/demo.md` | Demo Gen, Business-Namen |
| Burst-9,10,11 (Monitoring) | `.claude/rules/monitoring.md` | Health Checks, Metriken |
| Dev Sessions | `.claude/rules/dev.md` | API Reference, DB Schema |

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
- Status: Ueberprufung laeuft (eingereicht 13.01)
- Extension v1.6.1

### REAL Metriken (17.01 - VERIFIZIERT!)
| Metrik | Reported | Real | Status |
|--------|----------|------|--------|
| Registrierte User | 61 | **6** | 55 Test-Accounts |
| Aktivierte User | ? | **0** | 0% Activation! |
| Paying | 0 | **0** | Hauptfokus |
| CTR | 4.42% | **1.42%** | 67% Bot-Clicks |

### Diagnose
**CRITICAL: 0% Activation Rate**
- 6 echte User registriert, 0 haben jemals generiert
- Problem ist ONBOARDING, nicht Acquisition
- Persistenz: `content/claude-progress/real-user-metrics.json`

### Neue Features (18.01)
- react-select Searchable Dropdown fuer Business Types
- 3 neue Industry Examples (Real Estate, Home Services, Pet Services)

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

| MCP | Status |
|-----|--------|
| Memory MCP | ACTIVE |
| Sequential Thinking | ACTIVE |
| Gemini Design | ACTIVE |
| Chrome MCP (`claude --chrome`) | ACTIVE |

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

### Hook Silent Failures Fix (18.01.2026)
**Problem:** CLIs brechen ab ohne Output - User sieht nichts.
**Root Cause:** Aggressive Error-Suppression: `catch {}; exit 0` und `2>$null`
**Loesung:** Fehler ZEIGEN aber nicht BLOCKIEREN:
- `catch { Write-Host '[Hook Error]' $_ -ForegroundColor Red }; exit 0`
- Single quotes fuer Prefix (kein JSON-Escaping-Chaos)
- `exit 0` bleibt (Claude erwartet das)
**Lesson:** Fail Loud, Not Silent. Fehler sichtbar machen ohne Hook zu blockieren.

### Smart Task Switching V4.0 (18.01.2026)
**Problem:** Agents warten idle auf API Response/Lock/Rate Limit - verschwendete Zeit.
**Loesung:** Pre-Check Pattern - Agent checkt VOR blockierender Aktion ob Resource verfuegbar:
- `check-blocked` Action in agent-helpers.ps1 (email_lock, resend, openai, serpapi, etc.)
- `task-switch` Action wechselt zwischen Main und Backup Tasks
- `agent-task-queue.json` definiert Backup-Tasks pro Agent
**Lesson:** Kein Hook noetig! Agent entscheidet selbst. Pre-Check > Wait-and-Retry.

### Work-While-Waiting V4.1 (18.01.2026)
**Problem:** Agents warteten bis zu 4h auf Approval = verschwendete Zeit!
**Loesung:** Night-Burst V4.1 mit Work-While-Waiting Pattern:
- Approval Request → Queue → SOFORT andere Tasks machen
- Alle 15-30min: `approval-check` Helper pruefen ob approved
- Max Age (30min/2h) statt Wartezeit - dann Auto-REJECT
- `approval-check` + `approval-expire` in agent-helpers.ps1
**Lesson:** Max Age ≠ Wartezeit! Agent arbeitet weiter, checkt spaeter.

### Safety-First Deploy V3.9 (18.01.2026)
**Problem:** 2x Timeout-Defaults wurden ohne Berendes Review ausgefuehrt (16.01)
**Root Cause:** FAIL-DEFAULT statt FAIL-SAFE Architektur
**Loesung:** Night-Burst V3.9 mit:
- `scripts/pre-deploy-safety.ps1` - 6 Checks vor JEDEM Night-Run
- Timeout-Default: **REJECT** statt PROCEED
- Budget Hard Limits mit `budget-check`/`budget-use` Helpers
- start-agents.ps1 blockiert bei Safety-Failures
**Lesson:** System muss OHNE Berend sicher sein (er schlaeft nachts)

### Real User Definition (17.01.2026, updated 18.01)
**Problem:** 56 "User" in DB aber 0 zahlende Kunden. Inflated Metrics.
**Loesung:** Echter User = Mind. 1 Generierung EGAL WO:
- `responses` (eingeloggt generiert)
- `demo_generations` (Demo-Seite mit Email via outreach_leads JOIN)
**API:** `/api/admin/stats` hat jetzt `realUsers.total`, `realUsers.viaGenerator`, `realUsers.viaDemo`, `realUsers.inactive`
**Dashboard:** Zeigt Real Users / Inactive / Paying nebeneinander
**Lesson:** Registration != Activation. Demo-Generierung zaehlt auch als "aktiv"!

### react-select fuer Searchable Dropdowns (18.01.2026)
**Problem:** Native `<select>` mit 20+ Business Types ist unuebersichtlich.
**Loesung:** `react-select` mit gruppierten Optionen + Custom Styling fuer Dark Mode.
**Details:**
- `businessTypeOptions` Array mit `{ label: 'Group', options: [...] }` Struktur
- Custom `styles` Prop fuer Light/Dark Mode Kompatibilitaet
- `isClearable` + `isSearchable` fuer bessere UX
**Lesson:** react-select ist Drop-in Replacement, aber Styling braucht CSS Variables.

### CLAUDE.md Segmentierung (18.01.2026)
**Problem:** 724 Zeilen CLAUDE.md fuer ALLE Agents - 70% irrelevant pro Session.
**Loesung:** Core (~200 Zeilen) + `.claude/rules/` fuer agent-spezifische Rules.
**Lesson:** Segmentierung > Kuerzung. Jeder Agent bekommt nur was er braucht.

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
