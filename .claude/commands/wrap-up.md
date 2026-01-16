---
description: Session wrap-up - Git, CLAUDE.md, Learnings, Handoff fuer parallele Claudes
allowed-tools: Bash(git:*), Read, Edit, Write
---

# Wrap-Up Command

Session: $CLAUDE_SESSION

## Auto-Checks (werden automatisch ausgefuehrt):

**Git Status:**
!`git status --short`

**Letzte 5 Commits:**
!`git log --oneline -5`

**TODO.md offene Tasks (AKTUELL IN ARBEIT):**
!`grep -A 50 "AKTUELL IN ARBEIT" TODO.md 2>/dev/null | grep -c "\- \[ \]" || echo "0"`

**CLAUDE.MD Stand-Datum:**
!`grep "Stand:" CLAUDE.md | head -1`

---

## KRITISCH: AUTO-CONTINUE LOGIK

> **Du FIXST alles selbst! Nur wenn WIRKLICH alles done → "Session safe to close"**

### Entscheidungsbaum:

```
1. Uncommitted changes?
   → JA: Sofort committen & pushen. Dann weiter mit Check 2.

2. TODO.md offene Tasks in "AKTUELL IN ARBEIT"?
   → JA: Entweder abhaken [x] ODER in BLOCKED verschieben. Dann weiter.

3. CLAUDE.md Datum veraltet?
   → JA: Datum updaten. Dann weiter.

4. Wichtige Learnings nicht persistiert?
   → JA: Jetzt in CLAUDE.md schreiben. Dann weiter.

5. Blocked Items nicht dokumentiert?
   → JA: In TODO.md BLOCKED Section eintragen. Dann weiter.

ALLE CHECKS BESTANDEN?
   → Dann und NUR dann: "✅ SESSION SAFE TO CLOSE"
```

### Was du AUTONOM machst (ohne zu fragen):

| Problem | Aktion |
|---------|--------|
| Uncommitted changes | `git add -A && git commit -m "chore: wrap-up session" && git push` |
| CLAUDE.md Datum alt | Datum auf heute setzen |
| Learnings ausstehend | In CLAUDE.md LEARNINGS Section einfuegen |
| Blocked Items | In TODO.md `## ⏳ BLOCKED / WAITING` Tabelle eintragen |
| Offene Tasks | Entweder [x] abhaken ODER nach BLOCKED verschieben |

### Was du NICHT autonom machst:

- Keine Code-Aenderungen mehr (nur Docs/Config)
- Keine neuen Features starten
- Keine Tests ausfuehren

---

## TODO.md Pflege (KRITISCH!)

**IMMER diese 3 Dinge pruefen/updaten:**

1. **BLOCKED Section** - Neue blocked Items hinzufuegen:
   ```markdown
   | Was | Wartet auf | Seit | Naechste Aktion |
   |-----|------------|------|-----------------|
   | [Neuer Task] | [Worauf] | [Heute] | [Was dann] |
   ```

2. **"AKTUELL IN ARBEIT" Section** - Offene Tasks aufraumen:
   - Fertig? → `[x]` setzen
   - Blocked? → Nach BLOCKED verschieben
   - Veraltet? → Loeschen

3. **Datum updaten** - `> Letzte Aktualisierung: [HEUTE]`

---

## Learnings reflektieren

Frag dich:
- Was habe ich gelernt das nicht schon in CLAUDE.md steht?
- Gab es API Limits, Bugs, Workarounds?
- Wuerde das einem neuen Claude helfen?

**Kategorien:** API Limits | Workarounds | Code Patterns | Chrome MCP | Sales/Outreach | Debugging

Format fuer neue Learnings:
```
### [Titel] (Datum)
**Problem:** Was war das Issue?
**Loesung/Fix:** Was funktioniert?
**Lesson:** Was sollte man sich merken?
```

---

## Handoff in TODO.md

Wenn etwas BLOCKED/WAITING ist, trage es in die Tabelle ein:

```markdown
| Was | Wartet auf | Seit | Naechste Aktion |
|-----|------------|------|-----------------|
| [Task] | [Worauf] | [Datum] | [Was dann] |
```

---

## Output Format:

### Waehrend Auto-Fix:
```
🔧 FIXING: [Was gefunden wurde]
   → [Was du machst]
```

### Nach allen Fixes:
```
=== SESSION WRAP-UP [$CLAUDE_SESSION] ===

GIT: ✅ Clean (pushed)
CLAUDE.MD: ✅ Updated (heute)
TODO.MD: ✅ Updated (BLOCKED + offene Tasks gepflegt)
LEARNINGS: ✅ [X neue / Keine]

✅ SESSION SAFE TO CLOSE
   Alles persistiert. Du kannst dieses Terminal schliessen.
===
```

### Wenn noch was fehlt (sollte nicht passieren):
```
=== SESSION WRAP-UP [$CLAUDE_SESSION] ===

⚠️ NOCH OFFEN:
- [Was noch fehlt]

Ich fixe das jetzt...
```

---

## Wichtig:

- **AUTO-FIX FIRST:** Nicht fragen, machen!
- **NUR "safe to close" wenn ALLES done**
- Handoff ist KRITISCH bei parallelen Claudes
- Keine trivialen Learnings (nur echte Erkenntnisse)
