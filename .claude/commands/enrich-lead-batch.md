# /enrich-lead-batch - Batch Lead Enrichment Orchestrator

> **Zweck:** Orchestriert parallele Email-Finding + Demo-Generation via Subagents
> **Chrome MCP:** JA (spawnt Chrome-Subagents)
> **Typ:** ORCHESTRATOR - spawnt andere Agents

---

## WANN NUTZEN?

- Nacht-Runs für maximale Lead-Enrichment
- Viele Leads brauchen Emails UND Demos
- Du willst parallele Verarbeitung

---

## ARCHITEKTUR

```
┌─────────────────────────────────────────────────────────────┐
│                    /enrich-lead-batch                        │
│                      (Orchestrator)                          │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Subagent 1     │ │  Subagent 2     │ │  Subagent 3     │
│ /find-email-    │ │ /find-email-    │ │ /generate-demo- │
│ chrome          │ │ chrome          │ │ chrome          │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
    Lead Email          Lead Email          Demo Ready
     Found               Found               Created
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Handoff to    │
                    │   Burst-2/4     │
                    └─────────────────┘
```

---

## QUICK START

```bash
# Starte Batch-Enrichment mit 50 Leads
/enrich-lead-batch --limit=50

# Oder nur Email-Finding
/enrich-lead-batch --type=email --limit=20

# Oder nur Demo-Generation
/enrich-lead-batch --type=demo --limit=30
```

---

## DER FLOW

### Step 1: Leads holen die Enrichment brauchen

```bash
LEADS=$(curl -s "https://review-responder.onrender.com/api/admin/leads-needing-enrichment?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U&limit=50")
echo $LEADS | jq '.needs_email | length'
echo $LEADS | jq '.needs_demo | length'
```

**Response-Struktur:**
```json
{
  "needs_email": [
    {"id": 1, "business_name": "...", "website": "..."},
    ...
  ],
  "needs_demo": [
    {"id": 2, "business_name": "...", "email": "..."},
    ...
  ],
  "totals": {
    "needs_email": 150,
    "needs_demo": 200
  }
}
```

---

### Step 2: Leads aufteilen

**Regel:** Max 5 Subagents gleichzeitig (Chrome MCP Limit)

```
Wenn needs_email > needs_demo:
  → 3 Email-Finder + 2 Demo-Generator

Wenn needs_demo > needs_email:
  → 2 Email-Finder + 3 Demo-Generator

Default Split:
  → 3 Email-Finder + 2 Demo-Generator
```

---

### Step 3: Subagents spawnen (Task Tool)

**WICHTIG:** Nutze das Task Tool um Subagents zu spawnen!

```markdown
## Subagent 1: Email-Finding für Lead Batch 1
Task(
  subagent_type="general-purpose",
  prompt="Führe /find-email-chrome aus für diese Leads: [LEAD_IDS_1-10].
         Nutze Chrome MCP um persönliche Emails zu finden.
         Speichere gefundene Emails via POST /api/admin/save-found-email"
)

## Subagent 2: Email-Finding für Lead Batch 2
Task(
  subagent_type="general-purpose",
  prompt="Führe /find-email-chrome aus für diese Leads: [LEAD_IDS_11-20].
         Nutze Chrome MCP um persönliche Emails zu finden."
)

## Subagent 3: Demo-Generation für Lead Batch 1
Task(
  subagent_type="general-purpose",
  prompt="Führe /generate-demo-chrome aus für diese Leads: [LEAD_IDS_1-15].
         Nutze Chrome MCP um Google Maps Reviews zu scrapen.
         Generiere AI Responses und speichere Demos."
)
```

**Parallel Spawning:**
```
Spawne ALLE Tasks in EINEM Tool-Call für echte Parallelität!
```

---

### Step 4: Auf Completion warten

**Option A: run_in_background=false (Default)**
- Warte auf jeden Agent
- Sammle Ergebnisse
- Langsamer aber kontrollierter

**Option B: run_in_background=true**
- Agents laufen parallel
- Checke Status via TaskOutput
- Schneller aber komplexer

```
TaskOutput(task_id="[AGENT_1_ID]", block=true, timeout=300000)
TaskOutput(task_id="[AGENT_2_ID]", block=true, timeout=300000)
...
```

---

### Step 5: Ergebnisse sammeln

Nach Subagent Completion:

```bash
# Check wie viele Emails gefunden wurden
curl -s "https://review-responder.onrender.com/api/admin/stats?key=..." | jq '.leads_with_email'

# Check wie viele Demos generiert wurden
curl -s "https://review-responder.onrender.com/api/admin/stats?key=..." | jq '.leads_with_demo'

# Premium-Ready Count (Email + Demo)
curl -s "https://review-responder.onrender.com/api/admin/premium-ready-count?key=..."
```

---

### Step 6: Metrics updaten

```bash
# Update Orchestrator Status
powershell -File scripts/agent-helpers.ps1 -Action status-update -Agent "enrich-batch" -Data '{
  "metrics": {
    "batch_started": "[TIMESTAMP]",
    "batch_completed": "[TIMESTAMP]",
    "subagents_spawned": 5,
    "emails_found": [COUNT],
    "demos_generated": [COUNT],
    "premium_ready_new": [COUNT]
  }
}'
```

---

## SUBAGENT PROMPTS

### Email-Finder Subagent:
```
Du bist ein Email-Finding Subagent.

Deine Aufgabe:
1. Für jeden Lead in dieser Liste: [LEAD_IDS]
2. Öffne die Website via Chrome MCP
3. Finde persönliche Emails (nicht info@, contact@)
4. Speichere via POST /api/admin/save-found-email

Nutze /find-email-chrome als Referenz.

Wenn fertig, gib eine Summary:
- Leads processed: X
- Emails found: Y
- Failed: Z
```

### Demo-Generator Subagent:
```
Du bist ein Demo-Generator Subagent.

Deine Aufgabe:
1. Für jeden Lead in dieser Liste: [LEAD_IDS]
2. Öffne Google Maps via Chrome MCP
3. Scrape 5-10 Reviews
4. Generiere AI Responses
5. Speichere Demo via POST /api/admin/save-demo-from-chrome

Nutze /generate-demo-chrome als Referenz.

Wenn fertig, gib eine Summary:
- Leads processed: X
- Demos generated: Y
- Failed: Z
```

---

## NACHT-RUN SCHEDULE

**Empfohlener Schedule für 8h Nacht:**

| Zeit | Aktion |
|------|--------|
| 22:00 | Batch 1: 50 Leads (30 Email, 20 Demo) |
| 23:00 | Batch 2: 50 Leads |
| 00:00 | Batch 3: 50 Leads |
| 01:00 | Pause - Metrics Check |
| 02:00 | Batch 4: 50 Leads |
| 03:00 | Batch 5: 50 Leads |
| 04:00 | Batch 6: 50 Leads |
| 05:00 | Final Metrics + Report |

**Pro Nacht:** 300 Leads enriched = **300 Premium-Ready für Outreach!**

---

## ERFOLGSKRITERIEN

| Metrik | Ziel pro Nacht |
|--------|----------------|
| Leads processed | 200-300 |
| Emails found | 150-200 (60-70%) |
| Demos generated | 150-200 (60-70%) |
| Premium-Ready (beide) | 100-150 |
| Subagent Failures | <5% |

---

## FEHLERBEHEBUNG

| Problem | Lösung |
|---------|--------|
| Subagent hängt | TaskOutput mit timeout, dann skip |
| Chrome MCP überlastet | Reduce parallel Agents (3 statt 5) |
| API Errors | Retry mit Backoff |
| Zu wenige Leads | Trigger Burst-1 für mehr Scraping |

---

## INTEGRATION

**Aufgerufen von:**
- Nacht-Orchestrator
- Manuell vor Daily-Outreach
- Burst-1 nach großem Scraping-Run

**Handoffs erstellt für:**
- Burst-2 (cold-emailer) - Demo-Ready Leads
- Burst-4 (demo-generator) - Email-Found Leads
- Burst-5 (hot-lead-chaser) - High-Priority Leads

---

## IMPORTANT: TASK TOOL USAGE

```
# RICHTIG: Alle Tasks in EINEM Call
Task(subagent_type="general-purpose", prompt="Agent 1...")
Task(subagent_type="general-purpose", prompt="Agent 2...")
Task(subagent_type="general-purpose", prompt="Agent 3...")

# FALSCH: Sequentielle Calls
Task(...) → Warten → Task(...) → Warten
```

**Parallelität = Performance!**
