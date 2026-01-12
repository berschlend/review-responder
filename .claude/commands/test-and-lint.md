Führe die komplette Quality-Check Pipeline für ReviewResponder aus:

## Schritt 1: TypeScript Type-Check
```bash
npm run typecheck
```
Wenn Fehler: Analysiere und fixe sie.

## Schritt 2: Linting
```bash
npm run lint
```
Wenn Fehler:
```bash
npm run lint:fix
```
Dann nochmal prüfen. Manuelle Fixes wenn nötig.

## Schritt 3: Tests
```bash
npm run test
```
Wenn Fehler: Analysiere den Output und fixe die Tests oder den Code.

## Schritt 4: Build Check (optional aber empfohlen)
```bash
npm run build
```
Stellt sicher dass Production Build funktioniert.

---

## Bei Fehlern:

1. **Zeig mir den exakten Error**
2. **Analysiere die Ursache** (welche Datei, welche Zeile, was ist falsch)
3. **Fixe das Problem**
4. **Führe den fehlgeschlagenen Check nochmal aus**
5. **Wiederhole bis alles grün ist**

## Erfolgs-Kriterien:
- `npm run typecheck` = 0 Errors
- `npm run lint` = 0 Errors, 0 Warnings
- `npm run test` = All tests passing
- `npm run build` = Build successful

Erst wenn ALLES grün ist, sag mir Bescheid.
