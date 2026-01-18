# /broadcast - Sende Nachricht an alle anderen Claudes

Sendet eine Nachricht an alle anderen aktiven Claude Sessions.
Die empfangenden Claudes sehen die Nachricht bei ihrer nächsten Session-Start.

## Usage

Der Benutzer sagt: `/broadcast [nachricht]`

## Ausführen

```bash
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\parallel-session-manager.ps1" -Action broadcast -Message "[NACHRICHT]"
```

Ersetze `[NACHRICHT]` mit der tatsächlichen Nachricht des Benutzers.

## Beispiele

### Warnung vor File-Änderungen
```
/broadcast Ich ändere gleich das DB Schema - nicht an migrations arbeiten!
```

### Task Handoff
```
/broadcast BURST-5: Hot Lead bei lead_id=123 - bitte Follow-up!
```

### Status Update
```
/broadcast Cold Email Batch fertig - 50 Emails versendet
```

## Wann nutzen

- Vor größeren Änderungen an gemeinsam genutzten Files
- Bei Task Handoffs zwischen Agents
- Bei wichtigen Status Updates
- Bei Konflikten oder Problemen

## Hinweise

- Messages werden nur an ANDERE Sessions gesendet (nicht an sich selbst)
- Messages werden bei Session-Start der empfangenden Session angezeigt
- Nur die letzten 20 Messages werden gespeichert
