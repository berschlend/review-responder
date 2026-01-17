# Agent Wrap-Up - Session ordentlich beenden

> Fuer Night-Burst Agents und Priority-Mode Agents.
> KEIN Git, KEIN CLAUDE.md - nur Learnings + Status + Summary.

---

## 🛑 SESSION-ENDE CHECKLIST (PFLICHT!)

Du beendest jetzt diese Session. Fuehre diese 3 Schritte aus:

### 1. ✅ Learnings speichern

```bash
# Speichere deine wichtigsten Learnings (1-3 Stueck):
powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [DEINE_NUMMER] -Data "[Learning 1 - SPEZIFISCH mit Zahlen]"
powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [DEINE_NUMMER] -Data "[Learning 2 - wenn vorhanden]"
```

**Learnings-Regeln:**
- SPEZIFISCH: "Subject 'Your 3.5★ review' hatte 8% CTR" ✅
- NICHT: "Email war gut" ❌
- MIT ZAHLEN: Immer Daten/Metriken
- AUCH FAILURES: Die sind oft wertvoller!

### 2. ✅ Status finalisieren

```bash
# Setze deinen Status auf "completed":
powershell -File scripts/agent-helpers.ps1 -Action status-update -Agent [DEINE_NUMMER] -Data '{"status":"completed","session_stats":{"actions_taken":[N],"successes":[X],"failures":[Y]}}'
```

### 3. ✅ SESSION-ZUSAMMENFASSUNG ausgeben

Gib diese Zusammenfassung aus (Copy-Paste und ausfuellen):

```markdown
## 📊 SESSION-ZUSAMMENFASSUNG [Burst-X]

### ⏱️ Session-Info
- **Agent:** Burst-[X] - [Name]
- **Laufzeit:** [Start] - [Ende]
- **Loops durchgefuehrt:** [N]

### 📈 Metriken
| Metrik | Ziel | Erreicht | Status |
|--------|------|----------|--------|
| [Hauptmetrik 1] | [X] | [Y] | ✅/⚠️/❌ |
| [Hauptmetrik 2] | [X] | [Y] | ✅/⚠️/❌ |

### 🎯 Aktionen durchgefuehrt
1. [Aktion 1 mit Ergebnis]
2. [Aktion 2 mit Ergebnis]
3. ...

### 💡 LEARNINGS

**Was hat funktioniert:**
- [Learning 1 mit Daten/Zahlen]

**Was hat NICHT funktioniert:**
- [Anti-Pattern 1 + warum]

**Neue Erkenntnisse:**
- [Insight 1]

### 🔄 Fuer naechste Session
- [ ] [Todo 1]
- [ ] [Todo 2]

### 🚨 Offene Issues fuer Berend
- [ ] [Issue wenn vorhanden, sonst "Keine"]
```

---

## ⚡ QUICK VERSION (wenn eilig)

Mindestens das hier machen:

```bash
# 1. Ein Learning speichern
powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [X] -Data "[Wichtigstes Learning]"

# 2. Status auf completed
powershell -File scripts/agent-helpers.ps1 -Action status-update -Agent [X] -Data '{"status":"completed"}'
```

Dann kurze Summary:
```
Session beendet. [N] Aktionen, [X] erfolgreich. Learning: [Wichtigstes].
```

---

## ❌ Was dieser Command NICHT macht

- Git commit/push (Agents aendern keinen Code)
- CLAUDE.md updaten (nur bei Code-Sessions)
- TODO.md pflegen (Agents haben Status-Files)

Fuer manuelle Code-Sessions nutze stattdessen: `/wrap-up`

---

*Fuer: Night-Burst Agents, Priority-Mode Agents*
