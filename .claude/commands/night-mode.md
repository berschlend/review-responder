# Night Mode - Intelligente Agent Auswahl (V4.4)

Starte Night-Burst Agents mit intelligenter Auswahl.

**Argument:** $ARGUMENTS

---

## AUTOMATISCHE AUSFÜHRUNG

### Schritt 1: Agent-Auswahl (AI-basiert)

**Option A: Explizites Preset/Nummern (erstes Wort)**
- `priority` → Agents 2,4,5
- `monitoring` → Agents 9,11,14
- `outreach` → Agents 1,2,4,5,14
- `full` → Alle 15 Agents
- `2,4,9` → Custom: genau diese Agents

**Option B: AI-Analyse (freier Prompt)**

Analysiere den Prompt und entscheide SELBST welche Agents am besten passen.

**Agent-Übersicht für deine Entscheidung:**
| # | Agent | Aufgabe |
|---|-------|---------|
| 1 | Lead Finder | Neue Leads scrapen |
| 2 | Cold Emailer | Erste Kontakt-Emails |
| 3 | Social DM | LinkedIn/Social Outreach |
| 4 | Demo Generator | Personalisierte Demos erstellen |
| 5 | Hot Lead Chaser | Warme Leads nachfassen |
| 6 | User Activator | Registrierte User aktivieren |
| 7 | Payment Converter | Free→Paid Conversion |
| 8 | Upgrader | Upsells an zahlende Kunden |
| 9 | Doctor | System Health & Bugs |
| 10 | Morning Briefer | Täglicher Report |
| 11 | Bottleneck Analyzer | Engpässe finden |
| 12 | Creative Strategist | Neue Ideen & A/B Tests |
| 13 | Churn Prevention | Abwanderung verhindern |
| 14 | Lead Scorer | Lead-Qualität bewerten |
| 15 | Approval Gate | Human-in-the-Loop |

**Deine Entscheidung:**
1. Lies den Prompt
2. Überlege: Was will der User erreichen?
3. Welche Agents helfen dabei am besten?
4. Wähle Preset ODER Custom-Nummern

### Schritt 2: Beispiele (AI-Reasoning)

```
"Ich will heute Nacht einen zahlenden Kunden"
→ Ziel: Conversion. Braucht: Demos (4), Follow-ups (5), evtl. Cold (2)
→ Entscheidung: priority (2,4,5) oder custom 2,4,5,7

"Checke ob alles läuft und fix Bugs"
→ Ziel: Health Check. Braucht: Doctor (9), Bottleneck (11)
→ Entscheidung: monitoring (9,11,14)

"Finde neue Restaurants in München"
→ Ziel: Lead Gen. Braucht: Lead Finder (1), Lead Scorer (14)
→ Entscheidung: custom 1,14

"Volle Power, alles was geht"
→ Ziel: Maximum. Braucht: Alle
→ Entscheidung: full

"Aktiviere die User die sich registriert haben"
→ Ziel: Activation. Braucht: User Activator (6), evtl. Demo (4)
→ Entscheidung: custom 4,6

""  (leer)
→ Kein spezifisches Ziel
→ Entscheidung: full (Default für night-mode)
```

### Schritt 3: Ausführen

**Bei Preset:**
```bash
powershell -ExecutionPolicy Bypass -Command "& '.\scripts\start-agents.ps1' -Preset [PRESET] -NoSafetyCheck -Prompt '[PROMPT]'"
```

**Bei Custom Agent-Nummern:**
```bash
powershell -ExecutionPolicy Bypass -Command "& '.\scripts\start-agents.ps1' -Agents @([NUMMERN]) -NoSafetyCheck -Prompt '[PROMPT]'"
```
(Wenn Prompt leer, `-Prompt '[PROMPT]'` weglassen)

### Schritt 4: Melden

"✅ [PRESET] Agents ([AGENT-NUMMERN]) gestartet mit Fokus: [PROMPT]"

---

## Presets (Shortcuts)

| Preset | Agents | Typischer Use Case |
|--------|--------|-------------------|
| `full` | 1-15 | Alles, Nacht-Run, Maximum |
| `priority` | 2,4,5 | Sales, Conversions, Revenue |
| `monitoring` | 9,11,14 | Health Checks, Bugs, Analyse |
| `outreach` | 1,2,4,5,14 | Lead Gen, Emails, Demos |

---

## Beispiele

```
/night-mode                                 → full (alle 15)
/night-mode priority                        → priority (2,4,5) - explizit
/night-mode 2,4,9                           → Custom: nur Agents 2,4,9

# AI-basierte Auswahl (frei formuliert):
/night-mode Ich will einen zahlenden Kunden → AI wählt: 2,4,5,7
/night-mode Finde Zahnarztpraxen in Berlin  → AI wählt: 1,14
/night-mode Läuft alles? Check mal          → AI wählt: 9,11
/night-mode Aktiviere registrierte User     → AI wählt: 4,6
/night-mode Vollgas heute Nacht             → AI wählt: full
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
- ✅ **AI-basierte Agent-Auswahl** (frei formulieren!)
- ✅ Explizite Presets als Shortcuts
- ✅ Custom Agent-Nummern (z.B. `2,4,9`)

---

## Stoppen

- **Ein Agent:** Terminal Window schließen
- **Alle Agents:** Alle Terminals schließen
