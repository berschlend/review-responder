# Sales Doctor - Automatische Diagnose, Fixes & Tests

**Du bist der Sales System Doctor.** Deine Aufgabe: Das gesamte Automation-System diagnostizieren, Probleme fixen, und Berend sagen was er manuell machen muss.

**WICHTIG:** Dieser Command nutzt Chrome MCP wenn verfuegbar (`claude --chrome`). Falls nicht, mache CLI-only Checks.

---

## PHASE 1: SYSTEM HEALTH CHECK (AUTOMATISCH)

### 1.1 Secrets & Config laden
```bash
# Admin Keys holen (NICHT ausgeben, nur nutzen)
cat .claude/secrets.local 2>/dev/null || echo "WARNUNG: secrets.local nicht gefunden"
```

### 1.2 Backend Health Check
```bash
# Health Endpoint (Keep-Alive)
curl -s --max-time 10 "https://review-responder.onrender.com/api/health"

# Automation Health
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/automation-health?key=ADMIN_KEY"

# Scraper Status (Lead-Quellen)
curl -s --max-time 10 -H "X-Admin-Key: ADMIN_KEY" "https://review-responder.onrender.com/api/admin/scraper-status"

# API Credits Status
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/api-credits?key=ADMIN_KEY"
```

### 1.3 Outreach Metriken
```bash
# Outreach Dashboard
curl -s --max-time 10 "https://review-responder.onrender.com/api/outreach/dashboard?key=ADMIN_KEY"

# Admin Stats
curl -s --max-time 10 -H "X-Admin-Key: ADMIN_KEY" "https://review-responder.onrender.com/api/admin/stats"
```

---

## PHASE 2: CRON JOBS CHECK (CHROME MCP)

**Falls Chrome MCP verfuegbar (`claude --chrome`):**

1. Oeffne `https://console.cron-job.org/jobs`
2. Screenshot machen
3. Pruefe JEDEN Job auf:
   - **Gruenes Icon** = OK
   - **Oranges/Rotes Icon** = PROBLEM → Details anzeigen
4. Liste alle fehlgeschlagenen Jobs mit Fehlergrund

**Bekannte Probleme und Fixes:**
| Fehler | Ursache | Fix |
|--------|---------|-----|
| 404 Not Found | POST statt GET | Endpoint auf GET aendern |
| Timeout | Endpoint zu langsam | Timeout erhoehen oder Code optimieren |
| 401 Unauthorized | Secret fehlt/falsch | Secret in URL pruefen |
| 500 Error | Backend Bug | Logs checken, Code fixen |

---

## PHASE 3: CODE HEALTH CHECK

### 3.1 Cron Endpoints pruefen
```bash
# Alle Cron Endpoints im Code finden
grep -n "app\.\(get\|post\).*\/api\/cron" backend/server.js
```

**Regel:** ALLE Cron Endpoints muessen GET sein (cron-job.org macht GET)!

Falls POST Endpoints gefunden:
1. Automatisch auf GET aendern
2. Kommentar hinzufuegen: `// Changed from POST to GET for cron-job.org compatibility`
3. Git commit + push

### 3.2 Fehlende Cron Jobs identifizieren
Vergleiche:
- Endpoints im Code (`/api/cron/*`)
- Jobs in cron-job.org

Fehlende Jobs → Dem User mitteilen zum Eintragen

---

## PHASE 4: DIAGNOSE REPORT

Erstelle einen kompakten Report:

```
=== SALES DOCTOR REPORT ===

BACKEND STATUS:
[ ] Health Endpoint: OK/FEHLER
[ ] Database: OK/FEHLER
[ ] API Credits: OK/WARNING/CRITICAL

CRON JOBS:
[ ] X von Y Jobs OK
[ ] Fehlgeschlagene: [Liste]

OUTREACH METRIKEN:
- Leads: XXX (davon XX mit Email)
- Emails gesendet: XXX
- Click Rate: X.X%
- Conversions: X

LEAD-QUELLEN STATUS:
- Daily Outreach: OK/LOW/CRITICAL
- LinkedIn: OK/LOW/CRITICAL (Anzahl pending)
- TripAdvisor: OK/LOW/CRITICAL
- G2: OK/LOW/CRITICAL
- Yelp: OK/LOW/CRITICAL
```

---

## PHASE 5: AUTOMATISCHE FIXES

Fuer jedes gefundene Problem:

1. **Kann automatisch gefixt werden?**
   - POST→GET Endpoints: JA → Automatisch aendern
   - Fehlende Cron Jobs: NEIN → User informieren
   - API Limit erreicht: NEIN → User informieren
   - Code Bugs: EVTL → Analysieren und vorschlagen

2. **Fix durchfuehren** (wenn automatisch moeglich)
3. **Git commit + push** nach allen Fixes
4. **Testen** ob Fix funktioniert

---

## PHASE 6: MANUELLE AKTIONEN FUER BEREND

**IMMER am Ende ausgeben - was Berend JETZT machen muss:**

```
=== BEREND TODO ===

DRINGEND (heute):
[ ] [Aktion 1 mit konkretem Command/Link]
[ ] [Aktion 2]

BALD (diese Woche):
[ ] [Aktion 3]

OPTIONAL:
[ ] [Nice-to-have]
```

### Typische manuelle Aktionen:

**Lead Scraping (wenn Quellen LOW/CRITICAL):**
- `/scrape-leads` - TripAdvisor Leads scrapen
- `/g2-miner` - G2 Competitor Leads scrapen
- `/yelp-audit` - Yelp Leads scrapen
- `/linkedin-connect` - LinkedIn Connection Requests senden

**Cron Jobs eintragen (wenn fehlend):**
- Link: https://console.cron-job.org/jobs/create
- URL Format: `https://review-responder.onrender.com/api/cron/ENDPOINT?secret=CRON_SECRET`

**API Keys erneuern (wenn Limits erreicht):**
- SerpAPI: https://serpapi.com/dashboard
- Hunter.io: https://hunter.io/api-keys
- Snov.io: https://app.snov.io/integration

---

## PHASE 7: LIVE TESTS (CHROME MCP)

**Falls Chrome MCP verfuegbar:**

1. **Demo Page Test**
   - Oeffne eine zufaellige Demo-Seite aus DB
   - Pruefe: Laedt? CTA sichtbar? "Reply on Google" funktioniert?

2. **Admin Panel Test**
   - Oeffne https://tryreviewresponder.com/admin
   - Pruefe: Alle Tabs laden? Daten aktuell?

3. **Frontend Test**
   - Oeffne https://tryreviewresponder.com
   - Pruefe: Response Generator funktioniert?

---

## ENTSCHEIDUNGSBAUM

```
START
  │
  ├─ Backend Health OK?
  │   ├─ NEIN → KRITISCH: Backend down, Render Dashboard checken
  │   └─ JA → Weiter
  │
  ├─ Cron Jobs alle gruen?
  │   ├─ NEIN → Fehler analysieren, automatisch fixen wenn moeglich
  │   └─ JA → Weiter
  │
  ├─ Lead-Quellen gesund?
  │   ├─ CRITICAL → Berend: SOFORT scrapen
  │   ├─ LOW → Berend: Heute noch scrapen
  │   └─ OK → Weiter
  │
  ├─ API Credits OK?
  │   ├─ EXHAUSTED → Berend: Keys erneuern
  │   ├─ CRITICAL → Berend: Bald erneuern
  │   └─ OK → Weiter
  │
  └─ Alles OK → "System healthy!"
```

---

## NACH JEDEM RUN

1. **CLAUDE.md updaten** mit:
   - Gefundene Probleme
   - Durchgefuehrte Fixes
   - Offene TODOs fuer Berend

2. **Report ausgeben** (kompakt, scannable)

---

## BEISPIEL OUTPUT

```
=== SALES DOCTOR REPORT (14.01.2026) ===

SYSTEM STATUS: WARNING

PROBLEME GEFUNDEN:
1. Blog Auto-Generation Cron Job: 404 Error
   → FIX: Endpoint von POST auf GET geaendert ✓

2. Keep-Alive Job fehlte
   → FIX: Job in cron-job.org erstellt ✓

3. LinkedIn Leads: CRITICAL (0 pending)
   → BEREND: /linkedin-connect ausfuehren

4. SerpAPI Credits: 87/100 (WARNING)
   → OK fuer jetzt, bald Key 4 hinzufuegen

OUTREACH STATUS:
- 528 Leads, 499 Emails, 3.4% Click Rate
- 0 Conversions (Hauptproblem!)

=== BEREND TODO ===

DRINGEND:
[ ] `claude --chrome` starten und `/linkedin-connect` ausfuehren
[ ] 5+ LinkedIn Leads fuer DACH Region connecten

BALD:
[ ] Demo-Videos aufnehmen (Main 60s, Extension 30s)
[ ] Google Indexierung fortsetzen (5-10 URLs/Tag)
```

---

## ERWEITERBARKEIT

Wenn neue Features zum automate-sales System hinzukommen:

1. **Neuer Cron Job?** → Zu Phase 2 hinzufuegen
2. **Neue Lead-Quelle?** → Zu scraper-status Check hinzufuegen
3. **Neue API?** → Zu api-credits Check hinzufuegen
4. **Neuer manueller Prozess?** → Zu "Manuelle Aktionen" hinzufuegen

Der Doctor passt sich automatisch an weil er:
- Endpoints dynamisch aus dem Code liest
- Scraper-Status API nutzt (aktualisiert sich automatisch)
- API-Credits API nutzt (aktualisiert sich automatisch)
