# Wrap-Up Command

Du fuehrst den `/wrap-up` Command aus - schneller Session-Status Check.

## Ausfuehren:

### 1. Git Status checken

```bash
git status --short
```

### 2. Letzte 3 Commits zeigen

```bash
git log --oneline -3
```

### 3. CLAUDE.md Datum pruefen

- Lies die "Stand:" Zeile in CURRENT TASKS
- Vergleiche mit heute

## Output Format:

```
=== SESSION STATUS ===

GIT: [Status]
- Clean: Nichts zu committen
- X Dateien: Liste was uncommitted ist

LETZTE COMMITS:
[Die letzten 3 Commits]

CLAUDE.MD: [Datum] - [Aktuell/Update empfohlen]

---
FAZIT: [Empfehlung]
```

## Fazit-Logik:

**Schliessen OK** wenn:

- Git clean (keine uncommitted changes)
- CLAUDE.md heute geupdated

**Noch zu tun** wenn:

- Uncommitted changes -> "Commit mit /quick-commit"
- CLAUDE.md veraltet -> "Update mit /update-claude-md"

## Wichtig:

- Kurz und knapp antworten
- Nur relevante Infos zeigen
- Klare Handlungsempfehlung geben
