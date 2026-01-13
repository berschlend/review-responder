$GIT_STATUS=$(git status --short)
$GIT_DIFF=$(git diff --stat HEAD~1 2>/dev/null || git diff --stat)
$BRANCH=$(git branch --show-current)
$TIMESTAMP=$(date +%m%d-%H%M)

Basierend auf diesen Aenderungen erstelle einen Commit und PR:

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

1. **Analysiere die Aenderungen** und verstehe was gemacht wurde

2. **Erstelle eine Commit Message** im Conventional Commits Format:
   - `feat:` fuer neue Features
   - `fix:` fuer Bugfixes
   - `chore:` fuer Maintenance
   - `docs:` fuer Dokumentation
   - `refactor:` fuer Refactoring
   - `test:` fuer Tests
   - `style:` fuer Formatting

3. **Committe alle Aenderungen:**
   ```bash
   git add -A
   git commit -m "deine message

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **Pushe zum Remote:**
   ```bash
   git push -u origin $BRANCH
   ```

5. **Auto-PR + Merge (NUR wenn Branch != main):**
   Falls `$BRANCH` NICHT "main" ist:
   ```bash
   # PR erstellen
   gh pr create --fill --base main

   # Auto-Merge aktivieren
   gh pr merge --squash --auto || gh pr merge --squash

   # Zurueck zu main und pull
   git checkout main
   git pull origin main

   # NEUEN Branch erstellen fuer naechsten Task
   # Extrahiere Prefix (rr1, rr2, etc.) aus altem Branch
   ```

   Erstelle neuen Branch mit gleichem Prefix:
   - Alter Branch: `rr1/0112-1734` → Neuer Branch: `rr1/$TIMESTAMP`
   - Alter Branch: `rr2/0112-1734` → Neuer Branch: `rr2/$TIMESTAMP`

   ```bash
   git checkout -b [prefix]/$TIMESTAMP
   ```

   Falls `$BRANCH` gleich "main" ist:
   - Kein PR noetig, direkt deployed
   - Kein neuer Branch noetig

6. **Bestaetigung an User:**
   - Was committed wurde
   - PR URL (falls erstellt)
   - "Merged to main - Render redeployed automatisch"
   - "Neuer Branch: [name] - bereit fuer naechsten Task"
