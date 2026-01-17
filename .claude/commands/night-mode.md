# Night Mode - Intelligente Agent Auswahl (V4.4)

Starte Night-Burst Agents mit intelligenter Auswahl.

**Argument:** $ARGUMENTS

---

## AUTOMATISCHE AUSFÜHRUNG

### Schritt 1: Preset bestimmen

**Option A: Explizites Preset (erstes Wort)**
- `priority` → Agents 2,4,5
- `monitoring` → Agents 9,11,14
- `outreach` → Agents 1,2,4,5,14
- `full` → Alle 15 Agents

**Option B: Intelligentes Matching (wenn kein explizites Preset)**

Scanne den Prompt nach Keywords:

| Keywords im Prompt | → Preset |
|-------------------|----------|
| `bug`, `debug`, `fehler`, `error`, `fix`, `health`, `test`, `funnel` | `monitoring` |
| `demo`, `email`, `outreach`, `lead`, `cold`, `follow`, `scrape` | `outreach` |
| `sale`, `conversion`, `revenue`, `zahlen`, `paying`, `kunde` | `priority` |
| `alle`, `full`, `komplett`, `gesamt`, `nacht`, `night` | `full` |
| (keine Keywords) | `full` (Default für night-mode) |

### Schritt 2: Beispiele

```
""                              → full, kein Fokus
"priority"                      → priority, kein Fokus
"Bugs im Funnel finden"         → monitoring (wegen "Bugs", "Funnel")
"Demo-Emails an alle Leads"     → outreach (wegen "Demo", "Leads")
"Erster Sale heute Nacht!"      → priority (wegen "Sale")
"Alle Agents Vollgas"           → full (wegen "Alle")
"Health Check machen"           → monitoring (wegen "Health")
"Cold Outreach starten"         → outreach (wegen "Cold", "Outreach")
```

### Schritt 3: Ausführen

```bash
powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1" -Preset [PRESET] -NoSafetyCheck -Prompt "[PROMPT]"
```
(Wenn Prompt leer, `-Prompt` weglassen)

### Schritt 4: Melden

"✅ [PRESET] Agents ([AGENT-NUMMERN]) gestartet mit Fokus: [PROMPT]"

---

## Presets

| Preset | Agents | Trigger-Keywords |
|--------|--------|------------------|
| `full` | 1-15 | alle, full, komplett, gesamt, nacht, night |
| `priority` | 2,4,5 | sale, conversion, revenue, paying, kunde |
| `monitoring` | 9,11,14 | bug, debug, fehler, error, fix, health, test, funnel |
| `outreach` | 1,2,4,5,14 | demo, email, outreach, lead, cold, follow, scrape |

---

## Beispiele

```
/night-mode                                 → full (alle 15)
/night-mode priority                        → priority (2,4,5)
/night-mode Bugs finden                     → monitoring (9,11,14) ← AUTO!
/night-mode Demo-Emails senden              → outreach (1,2,4,5,14) ← AUTO!
/night-mode Erster Sale heute!              → priority (2,4,5) ← AUTO!
/night-mode Funnel Health Check             → monitoring (9,11,14) ← AUTO!
/night-mode Lead Scraping starten           → outreach (1,2,4,5,14) ← AUTO!
/night-mode full nur Miami Leads            → full (15), explizit
```

---

## Agent Overview

| # | Agent | Priority | In Preset |
|---|-------|----------|-----------|
| 1 | Lead Finder | P2 | outreach, full |
| 2 | Cold Emailer | **P1** | priority, outreach, full |
| 3 | Social DM | P3 | full |
| 4 | Demo Generator | **P1** | priority, outreach, full |
| 5 | Hot Lead Chaser | **P1** | priority, outreach, full |
| 6 | User Activator | P3 | full |
| 7 | Payment Converter | P3 | full |
| 8 | Upgrader | P3 | full |
| 9 | Doctor | P2 | monitoring, full |
| 10 | Morning Briefer | P3 | full |
| 11 | Bottleneck Analyzer | P2 | monitoring, full |
| 12 | Creative Strategist | P3 | full |
| 13 | Churn Prevention | P2 | full |
| 14 | Lead Scorer | P2 | monitoring, outreach, full |
| 15 | Approval Gate | **P1** | full |

---

## Features
- ✅ Bypass Permissions
- ✅ Chrome MCP ON
- ✅ Dev-Skills verfügbar
- ✅ Intelligentes Preset-Matching
- ✅ Explizites Preset überschreibt Auto-Match

---

## Stoppen

- **Ein Agent:** Terminal Window schließen
- **Alle Agents:** Alle Terminals schließen
