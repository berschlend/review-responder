# Priority Mode - Flexible Agent Auswahl (V4.4)

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
| `bug`, `debug`, `fehler`, `error`, `fix`, `health`, `test` | `monitoring` |
| `demo`, `email`, `outreach`, `lead`, `cold`, `follow` | `outreach` |
| `sale`, `conversion`, `revenue`, `zahlen`, `paying` | `priority` |
| `alle`, `full`, `komplett`, `gesamt` | `full` |
| (keine Keywords) | `priority` (Default) |

### Schritt 2: Beispiele

```
""                              → priority, kein Fokus
"monitoring"                    → monitoring, kein Fokus
"full NUR Demo-Emails"          → full, Fokus: "NUR Demo-Emails"
"NUR Demo-Emails"               → outreach (wegen "Demo"), Fokus: "NUR Demo-Emails"
"Bugs finden und fixen"         → monitoring (wegen "Bugs"), Fokus: "Bugs finden und fixen"
"Erster Sale heute!"            → priority (wegen "Sale"), Fokus: "Erster Sale heute!"
"Alle Agents debuggen"          → full (wegen "Alle"), Fokus: "Alle Agents debuggen"
"Hot Leads chasen"              → outreach (wegen "Leads"), Fokus: "Hot Leads chasen"
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
| `priority` | 2,4,5 | sale, conversion, revenue, paying |
| `monitoring` | 9,11,14 | bug, debug, fehler, error, fix, health, test |
| `outreach` | 1,2,4,5,14 | demo, email, outreach, lead, cold, follow |
| `full` | 1-15 | alle, full, komplett, gesamt |

---

## Beispiele

```
/priority-mode                              → priority (2,4,5)
/priority-mode monitoring                   → monitoring (9,11,14)
/priority-mode Bugs finden                  → monitoring (9,11,14) ← AUTO!
/priority-mode Demo-Emails senden           → outreach (1,2,4,5,14) ← AUTO!
/priority-mode Erster Sale!                 → priority (2,4,5) ← AUTO!
/priority-mode Alle Agents Vollgas          → full (15) ← AUTO!
/priority-mode full nur Agent 2 und 4       → full (15), explizit
```

---

## Features
- ✅ Bypass Permissions
- ✅ Chrome MCP ON
- ✅ Dev-Skills verfügbar
- ✅ Intelligentes Preset-Matching
- ✅ Explizites Preset überschreibt Auto-Match
