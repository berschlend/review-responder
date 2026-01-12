$GIT_STATUS=$(git status --short)
$GIT_DIFF=$(git diff --stat HEAD~1 2>/dev/null || git diff --stat)
$BRANCH=$(git branch --show-current)

Basierend auf diesen Änderungen erstelle einen Commit und PR:

**Branch:** $BRANCH

**Status:**
```
$GIT_STATUS
```

**Diff Stats:**
```
$GIT_DIFF
```

## Deine Aufgaben:

1. **Analysiere die Änderungen** und verstehe was gemacht wurde

2. **Erstelle eine Commit Message** im Conventional Commits Format:
   - `feat:` für neue Features
   - `fix:` für Bugfixes
   - `chore:` für Maintenance
   - `docs:` für Dokumentation
   - `refactor:` für Refactoring
   - `test:` für Tests
   - `style:` für Formatting

3. **Committe alle Änderungen:**
   ```bash
   git add -A
   git commit -m "deine message"
   ```

4. **Pushe zum Remote:**
   ```bash
   git push origin $BRANCH
   ```

5. **Erstelle einen Pull Request** (wenn möglich via gh CLI):
   ```bash
   gh pr create --title "Commit Message" --body "Beschreibung"
   ```

Falls `gh` nicht verfügbar ist, zeig mir den PR-Link den ich manuell öffnen soll.
