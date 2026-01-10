# GitHub Workflow mit Claude Code

Optimierte Workflows für ReviewResponder Development mit Claude Code.

## Branch Strategy

### Development Branch
**Primary:** `claude/learn-claude-code-eKiGe`
- Alle Features/Fixes entwickeln hier
- Automatisches Render Deployment bei Push
- Branch wird von Hooks überwacht (check-branch.sh)

### Main Branch
**Protected:** Nur für Production Releases
- Keine direkten Commits (Hook verhindert das)
- Nur Merges von stabilen Feature Branches

---

## Claude Code Git Commands

### Standard Workflow
```bash
# 1. Feature entwickeln auf Feature Branch
git status

# 2. Änderungen staged
git add -A

# 3. Commit mit beschreibender Message
git commit -m "Add tone preview feature to chrome extension"

# 4. Push zu Remote (mit -u für tracking)
git push -u origin claude/learn-claude-code-eKiGe
```

### Quick Commit & Push (nach erfolgreichem Test!)
```bash
git add -A && git commit -m "Fix email verification banner styling" && git push -u origin claude/learn-claude-code-eKiGe
```

### Branch wechseln (falls nötig)
```bash
# Check aktuelle Branches
git branch -a

# Wechsel zu anderem Branch
git checkout <branch-name>

# Neuen Branch erstellen
git checkout -b claude/new-feature-xyz
```

---

## Pull Request Workflow

### 1. Feature fertig entwickelt
```bash
# Sicherstellen alles committed & gepusht
git status
git push -u origin claude/learn-claude-code-eKiGe
```

### 2. PR erstellen via GitHub CLI
```bash
gh pr create --title "Add tone preview feature" --body "
## Summary
- Added tone preview with example snippets
- Updated content.js with preview modal
- Tested in Chrome Extension

## Test Plan
- [x] Extension lädt ohne Errors
- [x] Preview Button erscheint
- [x] Snippets werden korrekt angezeigt
"
```

### 3. PR Review via Claude Code
```bash
# PR Details checken
gh pr view <PR-number>

# PR Diff anzeigen
gh pr diff <PR-number>

# PR Comments lesen
gh pr view <PR-number> --comments
```

---

## Issue Management

### Issues via GitHub CLI erstellen
```bash
# Neuen Bug Report
gh issue create --title "Email verification banner not dismissing" --body "
**Bug:** Banner bleibt visible nach Email Verification

**Steps to Reproduce:**
1. Register neuen Account
2. Verify Email via Link
3. Zurück zu Dashboard

**Expected:** Banner verschwindet
**Actual:** Banner bleibt

**File:** frontend/src/App.js:450
"

# Feature Request
gh issue create --title "Add export to Excel" --label "enhancement"
```

### Issues zu Tasks konvertieren
```bash
# Issue Details holen
gh issue view <issue-number>

# Als Task in TodoWrite hinzufügen (via Claude)
# Claude kann automatisch Issues parsen und in Todos umwandeln
```

---

## GitHub Actions (Optional)

### Aktuell: Keine CI/CD Pipeline
**Warum nicht?**
- Render deployed automatisch bei Git Push
- Keine Tests im Projekt (nur manuelle Tests)
- Kleines Team (nur du + Claude)

### Mögliche Actions für später

**1. Auto-Label PRs**
```yaml
# .github/workflows/auto-label.yml
name: Auto Label PRs
on: pull_request

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
```

**2. Stale Issue Cleanup**
```yaml
# .github/workflows/stale.yml
name: Close Stale Issues
on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v8
        with:
          days-before-stale: 30
          days-before-close: 7
```

**3. PR Size Checker**
```yaml
# .github/workflows/pr-size.yml
name: PR Size Check
on: pull_request

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR Size
        run: |
          if [ $(git diff --stat | wc -l) -gt 500 ]; then
            echo "::warning::PR too large! Consider splitting."
          fi
```

---

## Claude Code Shortcuts

### /commit Command (via Skill wenn verfügbar)
```bash
# Schnelles Commit mit Smart Message Generation
/commit

# Claude analysiert Änderungen und erstellt sinnvolle Commit Message
```

### /review-pr Command (Custom Skill möglich)
```bash
# PR Review von Claude
/review-pr <PR-number>

# Claude checkt:
# - Code Style Issues
# - Potentielle Bugs
# - Security Vulnerabilities
# - Test Coverage
```

---

## Git Hooks (lokal, nicht Claude Hooks!)

### Pre-commit Hook (optional)
```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for console.log in production code
if git diff --cached | grep -E "console\.(log|warn|error)"; then
  echo "⚠️  Warning: console.log detected!"
  echo "Remove before committing or use --no-verify"
  exit 1
fi

# Check for secrets
if git diff --cached | grep -iE "(api_key|password|secret).*="; then
  echo "❌ BLOCKED: Potential secret detected!"
  exit 1
fi
```

---

## Best Practices

### Commit Messages
✅ **Good:**
- "Fix email case-sensitivity in login endpoint"
- "Add tone preview modal to extension"
- "Update pricing table with new features"

❌ **Bad:**
- "fix bug"
- "updates"
- "wip"

### PR Descriptions
**Template:**
```markdown
## Summary
[Was wurde geändert?]

## Why
[Warum war diese Änderung nötig?]

## Test Plan
- [ ] Backend Tests
- [ ] Frontend Tests
- [ ] Extension Tests
- [ ] Manual Testing

## Screenshots
[Bei UI Changes]
```

### Branch Naming
✅ **Good:**
- `claude/add-tone-preview`
- `claude/fix-email-verification`
- `claude/update-pricing-table`

❌ **Bad:**
- `test`
- `my-branch`
- `fix`

---

## Automation Potenzial

### Was Claude Code automatisieren kann:

1. **PR Reviews:** Claude analysiert Code Changes
2. **Issue Triage:** Claude labelt Issues automatisch
3. **Release Notes:** Claude generiert aus Commits
4. **Code Refactoring:** Claude schlägt Improvements vor
5. **Documentation:** Claude updated Docs automatisch

### Aktuell verfügbar:
- Branch Protection (via check-branch.sh Hook)
- Command Logging (via log-commands.sh Hook)
- Test Reminders (via remind-test.sh Hook)

---

## Troubleshooting

### "Permission denied" bei Git Push
```bash
# Check SSH Key
ssh -T git@github.com

# Falls HTTPS: Switch to SSH
git remote set-url origin git@github.com:berschlend/review-responder.git
```

### "Branch diverged" Error
```bash
# Pull latest changes
git pull origin claude/learn-claude-code-eKiGe --rebase

# Force Push (nur wenn sicher!)
git push -u origin claude/learn-claude-code-eKiGe --force
```

### Merge Conflicts
```bash
# Check conflicts
git status

# Resolve in Editor, dann:
git add <resolved-files>
git commit -m "Resolve merge conflicts"
git push
```

---

**Mehr Infos:**
- GitHub CLI: https://cli.github.com/
- Claude Code + GitHub: https://code.claude.com/docs/en/common-workflows
