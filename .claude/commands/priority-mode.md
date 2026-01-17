# Priority Mode - Flexible Agent Auswahl (V4.4)

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
"Ich will heute einen zahlenden Kunden"
→ Ziel: Conversion. Braucht: Demos (4), Follow-ups (5), evtl. Cold (2)
→ Entscheidung: priority (2,4,5) oder custom 2,4,5,7

"Checke ob alles läuft"
→ Ziel: Health Check. Braucht: Doctor (9), Bottleneck (11)
→ Entscheidung: monitoring (9,11,14)

"Finde neue Restaurants in München"
→ Ziel: Lead Gen. Braucht: Lead Finder (1), Lead Scorer (14)
→ Entscheidung: custom 1,14

"Aktiviere die User die sich registriert haben"
→ Ziel: Activation. Braucht: User Activator (6), evtl. Demo (4)
→ Entscheidung: custom 4,6

""  (leer)
→ Kein spezifisches Ziel
→ Entscheidung: priority (Default für priority-mode)
```

### Schritt 3: Ausführen

**Bei Preset:**
```bash
powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1" -Preset [PRESET] -NoSafetyCheck -Prompt "[PROMPT]"
```

**Bei Custom Agent-Nummern:**
```bash
powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1" -Agents [NUMMERN] -NoSafetyCheck -Prompt "[PROMPT]"
```
(Wenn Prompt leer, `-Prompt` weglassen)

### Schritt 4: Melden

"✅ [PRESET] Agents ([AGENT-NUMMERN]) gestartet mit Fokus: [PROMPT]"

---

## Presets (Shortcuts)

| Preset | Agents | Typischer Use Case |
|--------|--------|-------------------|
| `priority` | 2,4,5 | Sales, Conversions, Revenue |
| `monitoring` | 9,11,14 | Health Checks, Bugs, Analyse |
| `outreach` | 1,2,4,5,14 | Lead Gen, Emails, Demos |
| `full` | 1-15 | Alles, Maximum |

---

## Beispiele

```
/priority-mode                              → priority (2,4,5)
/priority-mode monitoring                   → monitoring (9,11,14) - explizit
/priority-mode 2,4,9                        → Custom: nur Agents 2,4,9

# AI-basierte Auswahl (frei formuliert):
/priority-mode Ich will einen Sale heute    → AI wählt: 2,4,5,7
/priority-mode Finde Anwälte in Hamburg     → AI wählt: 1,14
/priority-mode Ist das System healthy?      → AI wählt: 9,11
/priority-mode Aktiviere inactive User      → AI wählt: 4,6
```

---

## Features
- ✅ Bypass Permissions
- ✅ Chrome MCP ON
- ✅ Dev-Skills verfügbar
- ✅ **AI-basierte Agent-Auswahl** (frei formulieren!)
- ✅ Explizite Presets als Shortcuts
- ✅ Custom Agent-Nummern (z.B. `2,4,9`)
