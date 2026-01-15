---
description: Session wrap-up - Git, CLAUDE.md, Learnings, Handoff fuer parallele Claudes
allowed-tools: Bash(git:*), Read, Edit
---

# Wrap-Up Command

Session: $CLAUDE_SESSION

## Auto-Checks (werden automatisch ausgefuehrt):

**Git Status:**
!`git status --short`

**Letzte 5 Commits:**
!`git log --oneline -5`

**TODO.md in_progress Tasks:**
!`grep -c "in_progress" TODO.md 2>/dev/null || echo "0"`

**CLAUDE.md Stand-Datum:**
!`grep "Stand:" CLAUDE.md | head -1`

## Deine Aufgaben:

### 1. CLAUDE.md Datum pruefen
- Vergleiche "Stand:" mit heute
- Wenn veraltet: Datum updaten

### 2. Learnings reflektieren
Frag dich:
- Was habe ich gelernt das nicht schon in CLAUDE.md steht?
- Gab es API Limits, Bugs, Workarounds?
- Wuerde das einem neuen Claude helfen?

**Kategorien:** API Limits | Workarounds | Code Patterns | Chrome MCP | Sales/Outreach | Debugging

### 3. Learnings persistieren (wenn relevant)
Nutze Edit Tool um neue Learnings in CLAUDE.md einzufuegen:
```
### [Kategorie] (Datum)
- **Problem:** Was war das Issue?
- **Loesung:** Was funktioniert?
```

### 4. Handoff in TODO.md persistieren
Wenn etwas BLOCKED/WAITING ist:

1. Oeffne TODO.md
2. Finde die Tabelle unter `## ⏳ BLOCKED / WAITING`
3. Fuege neue Zeile hinzu oder update existierende:

```markdown
| Was | Wartet auf | Seit | Naechste Aktion |
|-----|------------|------|-----------------|
| [Feature/Task] | [Worauf gewartet wird] | [Datum] | [Was dann passieren soll] |
```

**Beispiele:**
- `Chrome Extension v1.6.2 | Chrome Review | 15.01 | Bei Approval → Google Ads`
- `LinkedIn Outreach | Connection Accepts | 14.01 | Follow-up Messages senden`
- `API Integration | API Key von User | 15.01 | Integration fertigstellen`

**Aufräumen:** Entferne Einträge die >7 Tage alt und erledigt sind.

## Output Format:

```
=== SESSION WRAP-UP [$CLAUDE_SESSION] ===

GIT: [Clean/X uncommitted]
COMMITS: [Relevante heute]
TODO: [X Tasks in_progress]
CLAUDE.MD: [Datum] - [Aktuell/Veraltet]
LEARNINGS: [Persistiert/Keine neuen]

HANDOFF (in TODO.md BLOCKED Section):
- [X neue Eintraege / Keine neuen]
- Blocked: [Kurze Zusammenfassung was wartet]

FAZIT: [Empfehlung]
===
```

## Entscheidungslogik:

**Session OK** wenn:
- Git clean (keine uncommitted changes)
- TODO.md keine in_progress Tasks
- CLAUDE.md heute geupdated
- Learnings persistiert (oder keine relevanten)

**Noch zu tun** wenn:
- Uncommitted changes -> `/commit-push-pr`
- TODO Tasks offen -> Abschliessen oder als pending dokumentieren
- CLAUDE.md veraltet -> Datum + NACHT-LOG updaten
- Wichtige Learnings -> Jetzt in CLAUDE.md schreiben

## Wichtig:

- Kurz und knapp antworten
- Handoff ist KRITISCH bei 10+ parallelen Claudes
- Keine trivialen Learnings (nur echte Erkenntnisse)
- IMMER konkrete naechste Schritte nennen
