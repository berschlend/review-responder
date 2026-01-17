# Priority Mode - Flexible Agent Auswahl (V4.4)

Starte Night-Burst Agents mit flexibler Auswahl.

**Features:**
- ✅ Bypass Permissions (--dangerously-skip-permissions)
- ✅ Chrome MCP ON by default
- ✅ Dev-Skills verfügbar (test-and-fix, simplify-code, review-changes)

---

## QUICK START (Direkt loslegen!)

```bash
# Priority Agents (2,4,5) - SOFORT starten
.\scripts\start-agents.ps1 -Preset priority -NoSafetyCheck

# Monitoring (9,11,14) - SOFORT starten
.\scripts\start-agents.ps1 -Preset monitoring -NoSafetyCheck

# Custom Agents - SOFORT starten
.\scripts\start-agents.ps1 -Agents 2,4,5,9 -NoSafetyCheck
```

---

## Presets

| Preset | Agents | Use Case |
|--------|--------|----------|
| `priority` | 2,4,5 | Outreach Focus |
| `monitoring` | 9,11,14 | Health Check |
| `outreach` | 1,2,4,5,14 | Lead to Conversion |
| `full` | 1-15 | Full Night Mode |

---

## CLI Parameter

```bash
# Standard (Chrome ON, Safety Checks ON)
.\scripts\start-agents.ps1 -Preset priority

# QUICK MODE - Skip Safety Checks
.\scripts\start-agents.ps1 -Preset priority -NoSafetyCheck

# Ohne Chrome MCP
.\scripts\start-agents.ps1 -Preset priority -NoChrome

# Quick Safety (nur kritische Checks)
.\scripts\start-agents.ps1 -Preset priority -QuickSafety

# Custom Agents
.\scripts\start-agents.ps1 -Agents 2,4,5,9

# Alle Kombinationen möglich
.\scripts\start-agents.ps1 -Agents 2,4,5 -NoSafetyCheck -NoChrome
```

---

## Features (V4.4)

### Bypass Permissions ✅
Alle Agents laufen mit `--dangerously-skip-permissions`:
- Keine Bestätigungsdialoge
- Volle Autonomie
- Keine Interrupts

### Dev-Skills ✅
Bestimmte Agents haben Dev-Skills:
| Agent | Skills |
|-------|--------|
| Burst-9 | `/test-and-fix`, `/review-changes` |
| Burst-11 | `/review-changes` |
| Burst-12 | `/simplify-code` |

### Chrome MCP ✅
- ON by default
- Jeder Agent eigene Tab-Gruppe
- Protected URLs bleiben offen

---

## Tab Status checken

```bash
powershell -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

---

## 🎯 Tonight's Prompt (V4.4)

Gib allen Agents einen spezifischen Fokus für die Nacht:

```bash
# Fokus auf Demo-Emails
.\scripts\start-agents.ps1 -Preset priority -Prompt "NUR Demo-Emails senden, KEIN Lead-Scraping"

# Fokus auf Hot Leads
.\scripts\start-agents.ps1 -Preset priority -Prompt "Fokus auf die 67 Clicker - aggressive Follow-ups"

# Bug-Fix Nacht
.\scripts\start-agents.ps1 -Preset monitoring -Prompt "Funnel-Health checken und Bugs finden"

# Conversion Push
.\scripts\start-agents.ps1 -Preset outreach -Prompt "Heute Nacht wollen wir den ersten Sale! DEMO20 Discount erlaubt."
```

**Prompt-Regeln:**
- `NUR X` → Andere Tasks ignorieren
- `KEIN Y` → Y komplett überspringen
- Prompt wird in `tonight-prompt.md` gespeichert
- Alle Agents lesen den Prompt bei Session-Start

---

## Optional: First Principles Check

Wenn du gründlich sein willst (nicht Pflicht):

```bash
# Erst analysieren
/first-principles

# Dann starten
.\scripts\start-agents.ps1 -Preset priority
```
