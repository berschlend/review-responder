$RECENT_FILES=$(git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || echo "Keine kürzlichen Änderungen")

Analysiere und vereinfache den Code in den kürzlich geänderten Dateien.

**Geänderte Dateien:**

```
$RECENT_FILES
```

## Deine Aufgaben:

### 1. Code Analyse

Für jede Datei prüfe:

- Gibt es wiederholten Code der extrahiert werden kann?
- Sind Funktionen zu lang (>30 Zeilen)?
- Sind Variablen-Namen unklar?
- Gibt es verschachtelte Conditionals die vereinfacht werden können?
- Gibt es unused Imports oder Variablen?

### 2. Refactoring (NUR wenn sinnvoll)

**Erlaubte Änderungen:**

- Wiederholten Code in Funktionen/Hooks extrahieren
- Variablen umbenennen für Klarheit
- Lange Funktionen aufteilen
- Unused Code entfernen
- Nested Ternaries in if/else umwandeln
- Early Returns einführen
- Magic Numbers in Constants umwandeln

**Verbotene Änderungen:**

- Funktionale Änderungen (das Verhalten muss gleich bleiben!)
- API Änderungen (keine Signatur-Änderungen an exportierten Funktionen)
- Dependency Updates
- Config-Änderungen

### 3. Verification

Nach jedem Refactoring:

```bash
npm run typecheck && npm run lint && npm run test
```

Wenn Tests failen → Änderung rückgängig machen.

### 4. Beispiel-Transformationen

**Vorher:**

```typescript
function processReview(review) {
  if (review) {
    if (review.rating >= 4) {
      return 'positive';
    } else if (review.rating >= 3) {
      return 'neutral';
    } else {
      return 'negative';
    }
  }
  return null;
}
```

**Nachher:**

```typescript
function getReviewSentiment(review: Review | null): Sentiment | null {
  if (!review) return null;
  if (review.rating >= 4) return 'positive';
  if (review.rating >= 3) return 'neutral';
  return 'negative';
}
```

## Output

Zeig mir für jede Änderung:

1. Was wurde geändert
2. Warum (welches Problem wurde gelöst)
3. Vorher/Nachher Code-Snippet

Am Ende: Bestätige dass alle Tests grün sind.
