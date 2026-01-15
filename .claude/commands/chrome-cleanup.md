# Chrome Session Cleanup

Du beendest eine Chrome-Automation Session. Führe folgende Schritte aus:

## 1. Cleanup Script ausführen

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action cleanup
```

Das Script gibt eine Liste von Tabs aus die geschlossen werden sollen.

## 2. Tabs schließen

Für jeden Tab in der `CLOSE_TABS_JSON` Ausgabe:

**NICHT schließen wenn:**
- Tab URL enthält: linkedin, gmail, stripe, render, github, cron-job
- Tab ist "protected" markiert

**Schließen via JavaScript:**
```javascript
// In Chrome MCP: javascript_tool
window.close()
```

Oder navigiere zu `chrome://newtab/` und dann schließe den Tab.

## 3. Stale Sessions bereinigen

Wenn `STALE_SESSIONS_JSON` ausgegeben wird (Sessions > 30 min inaktiv):
- Frage den User ob diese bereinigt werden sollen
- Wenn ja, führe cleanup für jede stale session aus

## 4. Final Status

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

---

**Nach Cleanup:** Bestätige wie viele Tabs geschlossen wurden und welche (protected) offen blieben.
