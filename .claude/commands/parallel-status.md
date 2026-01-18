# /parallel-status - Zeige alle aktiven Claude Sessions

Zeigt was andere parallel laufende Claudes gerade machen.

## Ausführen

```bash
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\parallel-session-manager.ps1" -Action status
```

## Output enthält

- Alle aktiven Sessions mit Namen
- Was jeder Claude gerade macht (Activity)
- Aktueller Task jedes Claudes
- Letzte Heartbeat Zeit
- File Locks (wer arbeitet an welcher Datei)

## Beispiel Output

```
═══════════════════════════════════════════════════
       ACTIVE CLAUDE SESSIONS
═══════════════════════════════════════════════════

  [BURST-2]
    Activity: Editing: server.js
    Task: Cold Email Outreach
    Last heartbeat: 15s ago

  [BURST-4] (YOU)
    Activity: Session started
    Task: Demo Generation
    Last heartbeat: 2s ago

  [DEV]
    Activity: Running command
    Task: Bug fixing
    Last heartbeat: 45s ago

  ACTIVE LOCKS:
    backend/server.js -> BURST-2
═══════════════════════════════════════════════════
```

## Hinweise

- Sessions werden nach 2 Minuten ohne Heartbeat als "stale" entfernt
- File Locks werden nach 5 Minuten automatisch freigegeben
- Jeder Claude sieht seine eigene Session mit "(YOU)" markiert
