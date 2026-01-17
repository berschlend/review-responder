# Priority Mode - Flexible Agent Auswahl

Starte Night-Burst Agents mit flexibler Auswahl. **Chrome MCP ist ON by default!**

---

## SCHRITT 1: First Principles (PFLICHT!)

**BEVOR du Agents auswaehlst, fuehre `/first-principles` aus!**

Analysiere:
1. **Was ist das ECHTE Problem gerade?** (Nicht was die Agents denken)
2. **Welche Agents adressieren dieses Problem?** (Gezielt statt breit)
3. **Brauchen wir ueberhaupt Agents?** (Manchmal ist ein direkter Fix schneller)

```
=== FIRST PRINCIPLES CHECK ===

SYMPTOM: [Was sieht aus wie das Problem]
ECHTES PROBLEM: [Root Cause]

RELEVANTE AGENTS: [Welche helfen wirklich?]
ALTERNATIVE OHNE AGENTS: [Schnellerer Weg?]

ENTSCHEIDUNG: [ ] Agents 2,4,5  [ ] Agents 9,11  [ ] Kein Agent - direkter Fix
```

**Ohne diese Analyse werden KEINE Agents gestartet!**

---

## SCHRITT 2: Presets (nach Analyse)

- **Priority** (2,4,5) - Outreach Focus
- **Monitoring** (9,11,14) - Health Check
- **Full Outreach** (1,2,4,5,14) - Lead to Conversion
- **All 15** - Full Night Mode
- **Custom** - Selbst auswaehlen

---

## SCHRITT 3: Ausfuehren

```bash
powershell -ExecutionPolicy Bypass -File ".\scripts\start-agents.ps1"
```

---

## CLI Parameter

```bash
# Standard (Chrome ON)
.\scripts\start-agents.ps1 -Preset priority

# Ohne Chrome MCP
.\scripts\start-agents.ps1 -Preset priority -NoChrome

# Custom Agents
.\scripts\start-agents.ps1 -Agents 2,4,5,9
```

---

## Chrome MCP Features

- **ON by default** - Alle Agents haben Browser-Zugriff
- Jeder Agent bekommt eigene Tab-Gruppe (BURST1, BURST2, etc.)
- Protected URLs bleiben offen (LinkedIn, Gmail, Stripe, etc.)
- Stale Sessions (>30min inaktiv) werden markiert

---

## Tab Status checken

```bash
powershell -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

---

## Warum First Principles zuerst?

- **17.01.2026 Learning:** Test-Account Metriken verfaelschten Agent-Entscheidungen
- **Focus statt Spray:** 3 richtige Agents > 15 falsche
- **Zeit sparen:** Direkter Hotfix oft schneller als Agent-Orchestrierung
