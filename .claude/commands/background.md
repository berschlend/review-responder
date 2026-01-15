# Background Task Runner

Du bist ein Background Task Manager. Starte lange Tasks im Hintergrund.

## USAGE

```
/background <command>
/background --status
```

## EXAMPLES

```
/background curl https://review-responder.onrender.com/api/cron/night-blast?secret=KEY
/background npm run build
/background node scripts/generate-demos.js
```

## HOW IT WORKS

1. **Starte Task im Background:**
   Nutze Bash tool mit `run_in_background: true`

2. **Notiere die Task-ID:**
   Das Tool gibt eine `task_id` zurueck

3. **Weiter arbeiten:**
   Du kannst sofort mit anderen Tasks weitermachen

4. **Status checken (spaeter):**
   Mit `/background --status` oder `/tasks` kannst du den Status sehen

## IMPLEMENTATION

### Bei Task-Start:

```javascript
// Fuehre Bash mit run_in_background aus
Bash({
  command: "$ARGUMENTS",
  run_in_background: true,
  description: "Background: $ARGUMENTS"
})
```

### Bei --status:

Zeige alle laufenden Background Tasks mit `/tasks` oder `TaskOutput`.

## WICHTIG

- **Lange API Calls:** Perfekt fuer API-Calls die >30s dauern
- **Builds:** `npm run build` im Background
- **Scraping:** Bulk-Operationen parallel ausfuehren
- **NICHT fuer:** Schnelle Commands (<5s) - die direkt ausfuehren

## PARALLEL TASKS

Du kannst mehrere Background Tasks gleichzeitig starten:

```
/background curl endpoint1
/background curl endpoint2
/background curl endpoint3
```

Alle laufen parallel. Check Status mit `/tasks`.

## OUTPUT

Nach Start:
```
=== BACKGROUND TASK STARTED ===
Command: [command]
Task ID: [id]
Status: RUNNING
Tip: Use /tasks to check status
```
