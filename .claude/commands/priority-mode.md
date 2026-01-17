# Priority Mode - Flexible Agent Auswahl (V4.4)

Starte Night-Burst Agents mit flexibler Auswahl.

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
   - NEIN → Default `priority`, gesamter Text ist der Prompt

2. **Beispiele:**
   ```
   ""                          → Preset: priority, Prompt: (keiner)
   "monitoring"                → Preset: monitoring, Prompt: (keiner)
   "full NUR Demo-Emails"      → Preset: full, Prompt: "NUR Demo-Emails"
   "NUR Demo-Emails"           → Preset: priority, Prompt: "NUR Demo-Emails"
   "outreach Erster Sale!"     → Preset: outreach, Prompt: "Erster Sale!"
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
| `priority` | 2,4,5 | Outreach Focus (DEFAULT) |
| `monitoring` | 9,11,14 | Health Check |
| `outreach` | 1,2,4,5,14 | Lead to Conversion |
| `full` | 1-15 | Full Night Mode |

---

## Beispiele

```
/priority-mode                              → priority (2,4,5), kein Fokus
/priority-mode monitoring                   → monitoring (9,11,14), kein Fokus
/priority-mode full                         → full (alle 15), kein Fokus
/priority-mode NUR Demo-Emails              → priority (2,4,5), Fokus: "NUR Demo-Emails"
/priority-mode full Erster Sale!            → full (alle 15), Fokus: "Erster Sale!"
/priority-mode monitoring Bugs finden       → monitoring (9,11,14), Fokus: "Bugs finden"
/priority-mode outreach Miami und NYC only  → outreach (1,2,4,5,14), Fokus: "Miami und NYC only"
```

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
