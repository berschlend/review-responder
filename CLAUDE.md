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

## TOP 5 DON'T DO THIS

| # | Regel | Warum |
|---|-------|-------|
| 1 | `status` ist VARCHAR, nicht BOOLEAN | DB-Schema Gotcha |
| 2 | API_URL enthaelt schon `/api` | API_BASE existiert nicht |
| 3 | Test-Accounts: `?exclude_test=true` | Metriken verfaelscht |
| 4 | Bei weisser Seite: Browser Console | React-Errors dort sichtbar |
| 5 | Discount vor Nutzung implementieren | Stripe-Handler pruefen |

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

---

## CURRENT TASKS

**Stand: 18.01.2026**

### Chrome Web Store
- Status: Ueberprufung laeuft (eingereicht 13.01)
- Extension v1.6.1

### Metriken (17.01)
- 3,657+ Responses, 1,064+ Demos
- 54 Users (0 paying) <- Hauptfokus!

### USER TODO
- [ ] Demo-Videos aufnehmen
- [ ] Google Indexierung fortsetzen

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

### Marketing Skill
`/marketing [status|chase|outreach|demo|analyze|linkedin]`

---

## NIGHT-BURST

### Quick Start
```powershell
.\scripts\start-night.ps1
```

### Priority-1 Agents
- Burst-2: Cold Emailer
- Burst-4: Demo Generator
- Burst-5: Hot Lead Chaser

### Key Files
- `content/claude-progress/agent-memory.json`
- `content/claude-progress/learnings.md`
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

## REFERENCES

| Was | Wo |
|-----|-----|
| Historische Learnings | `content/claude-progress/archive/` |
| Agent Learnings | `content/claude-progress/learnings.md` |
| API Reference | `.claude/rules/dev.md` |
| Sales Rules | `.claude/rules/sales.md` |
| Demo Rules | `.claude/rules/demo.md` |
| Monitoring | `.claude/rules/monitoring.md` |

---

> **Nach jeder Session:** CURRENT_TASKS updaten!
