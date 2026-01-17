# Night Mode - Alle 15 Agents starten (V4.4)

Starte alle 15 Night-Burst Agents in separaten Windows.

**Features:**
- ✅ Bypass Permissions (--dangerously-skip-permissions)
- ✅ Chrome MCP ON by default
- ✅ Dev-Skills verfügbar (test-and-fix, simplify-code, review-changes)

---

## QUICK START (Direkt loslegen!)

```bash
# ALLE 15 Agents - SOFORT starten
.\scripts\start-agents.ps1 -Preset full -NoSafetyCheck

# Mit Quick Safety Checks (schneller)
.\scripts\start-agents.ps1 -Preset full -QuickSafety
```

---

## Was passiert?

1. **15 Windows** öffnen sich (Windows Terminal)
2. Jedes Window = 1 Agent mit eigenem Account
3. Alle laufen mit **bypass permissions** (keine Dialoge)
4. Chrome MCP ist **ON by default**
5. Backend wird automatisch geweckt

---

## CLI Parameter

```bash
# Standard (Safety Checks ON)
.\scripts\start-agents.ps1 -Preset full

# QUICK MODE - Skip Safety Checks
.\scripts\start-agents.ps1 -Preset full -NoSafetyCheck

# Quick Safety (nur kritische Checks)
.\scripts\start-agents.ps1 -Preset full -QuickSafety

# Ohne Chrome MCP
.\scripts\start-agents.ps1 -Preset full -NoChrome

# Ohne Backend Wake-up
.\scripts\start-agents.ps1 -Preset full -NoWakeUp
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

## Stoppen

- **Ein Agent:** Terminal Window schließen
- **Alle Agents:** Alle Terminals schließen
- **Tab Cleanup:** `powershell chrome-tab-manager.ps1 -Action cleanup`

---

## Optional: First Principles Check

Wenn du gründlich sein willst (nicht Pflicht):

```bash
# Erst analysieren
/first-principles

# Dann starten
.\scripts\start-agents.ps1 -Preset full
```

---

Alternativ für gezielte Auswahl: `/priority-mode`
