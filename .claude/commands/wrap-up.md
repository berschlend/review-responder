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

### 4. Handoff generieren
Was muss der naechste Claude wissen?

## Output Format:

```
=== SESSION WRAP-UP [$CLAUDE_SESSION] ===

GIT: [Clean/X uncommitted]
COMMITS: [Relevante heute]
TODO: [X Tasks in_progress]
CLAUDE.MD: [Datum] - [Aktuell/Veraltet]
LEARNINGS: [Persistiert/Keine neuen]

HANDOFF:
- Aktiv: [Was laeuft noch / muss fortgesetzt werden]
- Blocked: [Worauf wird gewartet]
- API: [Limit-Status wenn relevant]
- Naechste Schritte: [Konkrete Tasks fuer naechste Session]

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
