# Night Mode - Alle Agents starten (V4.4)

Starte Night-Burst Agents (Default: alle 15).

**Argument:** $ARGUMENTS

---

## AUTOMATISCHE AUSFÜHRUNG

Parse `$ARGUMENTS` wie folgt:

### Bekannte Presets (erstes Wort checken):
- `priority` → Agents 2,4,5
- `monitoring` → Agents 9,11,14
- `outreach` → Agents 1,2,4,5,14
- `full` → Alle 15 Agents

### Logik:

1. **Erstes Wort ist ein Preset?**
   - JA → Nutze dieses Preset, Rest ist der Prompt
   - NEIN → Default `full`, gesamter Text ist der Prompt

2. **Beispiele:**
   ```
   ""                          → Preset: full, Prompt: (keiner)
   "priority"                  → Preset: priority, Prompt: (keiner)
   "NUR Demo-Emails"           → Preset: full, Prompt: "NUR Demo-Emails"
   "priority Erster Sale!"     → Preset: priority, Prompt: "Erster Sale!"
   "monitoring Bugs finden"    → Preset: monitoring, Prompt: "Bugs finden"
   ```

3. **Führe aus:**
   ```bash
   powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1" -Preset [PRESET] -NoSafetyCheck -Prompt "[PROMPT]"
   ```
   (Wenn Prompt leer, `-Prompt` weglassen)

4. **Melde Ergebnis:**
   - Mit Prompt: "✅ [PRESET] Agents gestartet mit Fokus: [PROMPT]"
   - Ohne Prompt: "✅ [PRESET] Agents gestartet"

---

## Presets

| Preset | Agents | Use Case |
|--------|--------|----------|
| `full` | 1-15 | Full Night Mode (DEFAULT) |
| `priority` | 2,4,5 | Outreach Focus |
| `monitoring` | 9,11,14 | Health Check |
| `outreach` | 1,2,4,5,14 | Lead to Conversion |

---

## Beispiele

```
/night-mode                                 → full (alle 15), kein Fokus
/night-mode priority                        → priority (2,4,5), kein Fokus
/night-mode NUR Demo-Emails                 → full (alle 15), Fokus: "NUR Demo-Emails"
/night-mode Erster Sale heute!              → full (alle 15), Fokus: "Erster Sale heute!"
/night-mode priority Hot Leads chasen       → priority (2,4,5), Fokus: "Hot Leads chasen"
/night-mode monitoring Funnel debuggen      → monitoring (9,11,14), Fokus: "Funnel debuggen"
```

---

## Agent Overview

| # | Agent | Priority | Dev-Skills |
|---|-------|----------|------------|
| 1 | Lead Finder | P2 | - |
| 2 | Cold Emailer | **P1** | - |
| 3 | Social DM | P3 | - |
| 4 | Demo Generator | **P1** | - |
| 5 | Hot Lead Chaser | **P1** | - |
| 6 | User Activator | P3 | - |
| 7 | Payment Converter | P3 | - |
| 8 | Upgrader | P3 | - |
| 9 | Doctor | P2 | `/test-and-fix`, `/review-changes` |
| 10 | Morning Briefer | P3 | - |
| 11 | Bottleneck Analyzer | P2 | `/review-changes` |
| 12 | Creative Strategist | P3 | `/simplify-code` |
| 13 | Churn Prevention | P2 | - |
| 14 | Lead Scorer | P2 | - |
| 15 | Approval Gate | **P1** | - |

---

## Features
- ✅ Bypass Permissions (--dangerously-skip-permissions)
- ✅ Chrome MCP ON by default
- ✅ Dev-Skills verfügbar
- ✅ Flexible Preset + Prompt Kombination

---

## 🎯 Prompt-Keywords

| Keyword | Bedeutung |
|---------|-----------|
| `NUR X` | Andere Tasks ignorieren |
| `KEIN Y` | Y komplett überspringen |
| `FOKUS auf Z` | Z hat Priorität |
| `ALLE Agents` | Globale Anweisung |

---

## Stoppen

- **Ein Agent:** Terminal Window schließen
- **Alle Agents:** Alle Terminals schließen
- **Tab Cleanup:** `powershell chrome-tab-manager.ps1 -Action cleanup`
