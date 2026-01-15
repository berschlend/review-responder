# Chrome Session Init

Du startest eine neue Chrome-Automation Session. Führe folgende Schritte aus:

## 1. Session registrieren

```powershell
$env:CLAUDE_SESSION  # Zeigt aktuelle Session
```

## 2. Existierende Tabs checken

Rufe `tabs_context_mcp` auf um zu sehen welche Tabs bereits offen sind.

## 3. Neue Tab-Gruppe erstellen

- Erstelle einen NEUEN Tab mit `tabs_create_mcp`
- Dieser Tab wird der "Haupt-Tab" für diese Session
- Registriere den Tab:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action register -TabId "[TAB_ID]" -TabUrl "[URL]"
```

## 4. Tab-Tracking aktivieren

**WICHTIG:** Nach JEDEM `navigate` oder `tabs_create_mcp` Call, registriere den Tab:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action register -TabId "[TAB_ID]" -TabUrl "[URL]"
```

## 5. Protected Tabs

Diese Tabs werden NIEMALS geschlossen:
- LinkedIn (*.linkedin.com*)
- Gmail (*.gmail.com*, *mail.google.com*)
- Stripe (*.stripe.com*)
- Render (*.render.com*)
- GitHub (*.github.com*)
- Cron-job.org (*.cron-job.org*)

## 6. Status checken

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

---

**Nach Init:** Sage dem User welche Session aktiv ist und wie viele Tabs registriert sind.
