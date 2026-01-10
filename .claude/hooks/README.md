# Claude Code Hooks für ReviewResponder

Diese Hooks automatisieren wichtige Entwicklungs-Workflows und verhindern häufige Fehler.

## Installierte Hooks

### 1. `check-branch.sh` (PreToolUse - Bash)
**Zweck:** Verhindert versehentliche Pushes auf main/master Branch

**Triggert bei:**
- `git push origin main/master` → BLOCKED ❌
- `git commit` auf main/master Branch → WARNING ⚠️

**Warum wichtig:** Alle Entwicklung soll auf Feature Branch `claude/learn-claude-code-eKiGe` passieren.

---

### 2. `log-commands.sh` (PostToolUse - Bash)
**Zweck:** Loggt alle wichtigen Bash Commands für Debugging

**Loggt:**
- Git Commands (commit, push, pull, etc.)
- NPM Commands (install, start, build)
- Node Commands (server starts)
- Database Commands (psql)

**Log Location:** `.claude/command-history.log`

**Nutzen:** Nachvollziehbarkeit was in der Session gemacht wurde.

---

### 3. `remind-test.sh` (PostToolUse - Edit/Write)
**Zweck:** Erinnert automatisch daran Tests zu laufen nach Code-Änderungen

**Erinnert bei:**
- Backend JS Files → "cd backend && node server.js"
- Frontend JS/JSX/CSS Files → "cd frontend && npm start"

**Warum wichtig:** "Immer testen vor Push" ist Regel #1 im CLAUDE.md!

---

## Hook Configuration

Alle Hooks sind in `.claude/settings.json` konfiguriert:

```json
{
  "hooks": {
    "PreToolUse": [...],   // Laufen VOR Tool-Execution
    "PostToolUse": [...]   // Laufen NACH Tool-Execution
  }
}
```

## Hooks Deaktivieren

Wenn du einen Hook temporär deaktivieren willst:
1. Öffne `.claude/settings.json`
2. Kommentiere den Hook-Eintrag aus (oder lösche ihn)
3. Speichern

## Neue Hooks Hinzufügen

1. Script erstellen in `.claude/hooks/dein-hook.sh`
2. Executable machen: `chmod +x .claude/hooks/dein-hook.sh`
3. In `.claude/settings.json` registrieren unter `PreToolUse` oder `PostToolUse`

## Verfügbare Hook-Typen

- **PreToolUse**: Läuft bevor ein Tool ausgeführt wird (kann blocken!)
- **PostToolUse**: Läuft nachdem ein Tool ausgeführt wurde
- **Notification**: Läuft wenn Claude eine Notification sendet
- **Stop**: Läuft wenn Claude mit Antworten fertig ist

## Environment Variables in Hooks

Hooks haben Zugriff auf:
- `$TOOL_INPUT` - Input für das Tool (z.B. Bash Command, File Path)
- `$TOOL_NAME` - Name des Tools (Bash, Edit, Write, etc.)
- `$TOOL_OUTPUT` - Output des Tools (nur bei PostToolUse)

## Best Practices

1. **Exit Codes**: `exit 0` = success, `exit 1` = block (nur PreToolUse)
2. **Performance**: Hooks sollten schnell sein (<100ms)
3. **Debugging**: Nutze `echo` für Messages an Claude
4. **Error Handling**: Immer proper exit codes nutzen

---

**Mehr Infos:** https://code.claude.com/docs/en/hooks-guide
