# Wrap-Up Command

Du fuehrst den `/wrap-up` Command aus - schneller Session-Status Check + Learnings Persisting.

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

### 4. LEARNINGS REFLEKTIEREN (NEU!)

Frag dich selbst:
- Habe ich etwas gelernt, das fuer zukuenftige Claude Sessions wichtig ist?
- Gab es Fehler, die ich oder der User gemacht haben?
- Gibt es neue Patterns, Workarounds oder Erkenntnisse?
- Gibt es API-Limits, Bugs oder Gotchas die dokumentiert werden sollten?

**Kriterien fuer ein Learning:**
- Es ist NICHT offensichtlich (steht nicht schon in CLAUDE.md)
- Es wuerde einem neuen Claude helfen, Fehler zu vermeiden
- Es ist spezifisch fuer dieses Projekt (nicht generisches Wissen)

### 5. LEARNINGS AUTOMATISCH PERSISTEN

Wenn du wichtige Learnings identifiziert hast:

1. Lies die aktuelle LEARNINGS Sektion in CLAUDE.md
2. Fuege neue Learnings hinzu im Format:
   ```
   ### [Kategorie] (Datum)
   - **Problem:** Was war das Issue?
   - **Loesung:** Was funktioniert?
   - **Beispiel:** Konkreter Code/Befehl wenn hilfreich
   ```
3. Nutze das Edit Tool um CLAUDE.md direkt zu updaten
4. Zeige dem User was du hinzugefuegt hast

**Kategorien fuer Learnings:**
- API Limits
- Workarounds
- Code Patterns
- Debugging
- Performance
- Deployment
- Chrome MCP
- Sales/Outreach

## Output Format:

```
=== SESSION STATUS ===

GIT: [Status]
- Clean: Nichts zu committen
- X Dateien: Liste was uncommitted ist

LETZTE COMMITS:
[Die letzten 3 Commits]

CLAUDE.MD: [Datum] - [Aktuell/Update empfohlen]

LEARNINGS PERSISTIERT: [Ja/Nein]
[Falls ja: Kurze Zusammenfassung was hinzugefuegt wurde]

---
FAZIT: [Empfehlung]
```

## Fazit-Logik:

**Schliessen OK** wenn:

- Git clean (keine uncommitted changes)
- CLAUDE.md heute geupdated
- Learnings persistiert (oder keine neuen)

**Noch zu tun** wenn:

- Uncommitted changes -> "Commit mit /quick-commit"
- CLAUDE.md veraltet -> "Update mit /update-claude-md"
- Wichtige Learnings nicht persistiert -> Jetzt hinzufuegen!

## Wichtig:

- Kurz und knapp antworten
- Nur relevante Infos zeigen
- Klare Handlungsempfehlung geben
- Learnings IMMER persistent machen wenn relevant!
- Keine trivialen Learnings (nur was wirklich hilft)
