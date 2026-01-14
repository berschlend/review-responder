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

### 1.4 Pipeline Health (KRITISCH!)
```bash
# Umfassender Pipeline Check - Leads, Demos, Emails, Funnel
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/pipeline-health?key=ADMIN_KEY"
```

**Dieser Endpoint liefert:**
- **Leads:** Total, mit Email, in Queue, contacted, needs Demo
- **Demos:** Total, heute erstellt, letzte Demo wann?
- **Emails:** Heute gesendet, Drip heute, Follow-ups heute
- **Funnel:** Conversion Rates (Lead→Email→Click→Signup→Paid)
- **Health Status:** overall, leadQueue, demoGeneration, emailDelivery

**Schwellwerte (automatisch berechnet):**
| Check | OK | WARNING | CRITICAL |
|-------|-----|---------|----------|
| Lead Queue | >100 | 20-100 | <20 |
| Leads mit Email | >100 | 50-100 | <50 |
| Letzte Demo | <24h | 24-48h | >48h |
| Letzte Email | <24h | 24-48h | >48h |

**Beispiel Response:**
```json
{
  "leads": { "total": 528, "withEmail": 326, "inQueue": 42, "queueStatus": "warning" },
  "demos": { "total": 200, "today": 5, "lastCreatedHoursAgo": 8, "status": "ok" },
  "emails": { "today": 35, "dripToday": 12, "status": "ok" },
  "funnel": { "clickRate": 3, "signupRate": 0, "paidRate": 0 },
  "health": { "overall": "warning" }
}
```

### 1.5 AI/Product Health (KRITISCH!)
```bash
# AI Response Generator Check - Funktioniert das Kernprodukt?
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/ai-health?key=ADMIN_KEY"
```

**Dieser Endpoint liefert:**
- **Generations:** Heute, diese Woche, letzte Generation wann?
- **Errors:** Fehlerrate der AI-Calls
- **Latency:** Durchschnittliche Antwortzeit
- **Health Status:** genStatus, errorStatus, overallHealth

**Schwellwerte:**
| Check | OK | WARNING | CRITICAL |
|-------|-----|---------|----------|
| Generationen/Tag | >10 | 1-10 | 0 |
| Letzte Generation | <24h | 24-48h | >48h |
| Error Rate | <5% | 5-20% | >20% |

**WICHTIG:** Wenn AI nicht funktioniert, ist das Produkt tot!

### 1.6 Payment Health
```bash
# Stripe & Checkout Check - Können User bezahlen?
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/payment-health?key=ADMIN_KEY"
```

**Dieser Endpoint liefert:**
- **Stripe Config:** Sind alle Keys konfiguriert?
- **Subscriptions:** Verteilung nach Plan (Free, Starter, Pro, Unlimited)
- **Payment Events:** Letzte erfolgreiche Zahlung wann?
- **Health Status:** stripeConfigured, paymentStatus

**Schwellwerte:**
| Check | OK | WARNING | CRITICAL |
|-------|-----|---------|----------|
| Stripe Config | Vollstaendig | - | Fehlt |
| Letzte Zahlung | <7 Tage | 7-30 Tage | >30 Tage |

### 1.7 User Activity Health
```bash
# User Engagement Check - Nutzen User das Produkt?
curl -s --max-time 10 "https://review-responder.onrender.com/api/admin/user-activity?key=ADMIN_KEY"
```

**Dieser Endpoint liefert:**
- **DAU/WAU/MAU:** Daily/Weekly/Monthly Active Users
- **Responses:** Heute, diese Woche generiert
- **Limit Hits:** User die ans Limit stossen (Upgrade-Potenzial!)
- **Retention:** 7-Tage, 30-Tage Retention Rate
- **Health Status:** dauStatus, responsesStatus

**Schwellwerte:**
| Check | OK | WARNING | CRITICAL |
|-------|-----|---------|----------|
| DAU | >5 | 1-5 | 0 |
| Responses/Tag | >20 | 5-20 | <5 |
| Users at Limit | >0 | - | - (gut wenn >0!) |

**INSIGHT:** Users at Limit = Upgrade-Potenzial! Kontaktieren!

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

## PHASE 3.5: AUTOMATION VS MANUAL CHECK (KRITISCH!)

**Der wichtigste Check:** Was laeuft WIRKLICH automatisch vs. was muss Berend machen?

### Vollautomatische Systeme (Cron Jobs)
Diese laufen OHNE Berend - aber pruefe ob sie HEUTE wirklich was gemacht haben:

| System | Cron | Check | Problem wenn... |
|--------|------|-------|-----------------|
| Daily Outreach | 09:00 | `emails.today > 0` | 0 nach 10:00 UND Queue nicht leer |
| Demo Generation | 08:00 | `demos.today > 0` | 0 nach 09:00 UND Leads ohne Demo |
| Drip Emails | 10:00 | `emails.dripToday > 0` | 0 nach 11:00 UND User in Drip |
| Keep-Alive | */15 | Backend erreichbar | Health Endpoint failed |
| Blog Generation | Mo/Mi/Fr 06:00 | Neuer Post? | Kein Post diese Woche |

**Entscheidungslogik:**
```
Cron "aktiv" ABER Output = 0?
├─ Queue/Input leer? → OK, nichts zu tun
└─ Queue/Input voll? → CRON KAPUTT! Fixen!
```

### Semi-Manuelle Systeme (Chrome MCP erforderlich!)
Diese laufen NIE automatisch - Berend muss `claude --chrome` starten:

| System | Command | Trigger |
|--------|---------|---------|
| LinkedIn Connect | `/linkedin-connect` | linkedIn.pending < 20 |
| TripAdvisor Scrape | `/scrape-leads` | tripadvisor.leads < 30 |
| G2 Mining | `/g2-miner` | g2.leads < 20 |
| Yelp Audit | `/yelp-audit` | yelp.leads < 20 |
| Agency Recruiter | `/agency-recruiter` | agency.leads < 20 |

**WICHTIG:** Pruefe `/api/admin/scraper-status` fuer jeden Source!
- Status `critical` → SOFORT in BEREND TODO
- Status `low` → Heute noch in BEREND TODO
- Status `healthy` → OK, kein Handlungsbedarf

### Report-Sektion: AUTOMATION STATUS
```
=== AUTOMATION STATUS ===

VOLLAUTOMATISCH (laufen ohne Berend):
[✓/✗] Daily Outreach: X Emails heute (Cron 09:00)
[✓/✗] Demo Generation: X Demos heute (Cron 08:00)
[✓/✗] Drip Emails: X Drips heute (Cron 10:00)
[✓/✗] Keep-Alive: Backend erreichbar (Cron */15)

SEMI-MANUELL (brauchen `claude --chrome`):
[OK/LOW/CRITICAL] LinkedIn: X pending → /linkedin-connect
[OK/LOW/CRITICAL] TripAdvisor: X Leads → /scrape-leads
[OK/LOW/CRITICAL] G2: X Leads → /g2-miner
[OK/LOW/CRITICAL] Yelp: X Leads → /yelp-audit
```

---

## PHASE 4: DIAGNOSE REPORT

Erstelle einen kompakten Report basierend auf allen Health-Endpoints:

```
=== SALES DOCTOR REPORT ===

SYSTEM HEALTH: [OK/WARNING/CRITICAL]

BACKEND:
[OK/X] Health Endpoint
[OK/X] Database Connection
[OK/X] API Credits

PRODUCT HEALTH (KRITISCH!):
[OK/WARNING/CRITICAL] AI Generator: XX Responses heute, Letzte vor X Stunden
[OK/WARNING/CRITICAL] Error Rate: X% (OK <5%, WARNING 5-20%, CRITICAL >20%)
[OK/WARNING/CRITICAL] Stripe: Konfiguriert? Letzte Zahlung vor X Tagen?

USER ACTIVITY:
[OK/WARNING/CRITICAL] DAU: X aktive User heute (>5=OK, 1-5=WARNING, 0=CRITICAL)
[OK/WARNING/CRITICAL] Responses/Tag: XX (>20=OK, 5-20=WARNING, <5=CRITICAL)
[INFO] Users at Limit: X ← UPGRADE-POTENZIAL!

PIPELINE HEALTH:
[OK/WARNING/CRITICAL] Lead Queue: XX Leads warten (>100=OK, 20-100=WARNING, <20=CRITICAL)
[OK/WARNING/CRITICAL] Demo Generation: Letzte Demo vor X Stunden
[OK/WARNING/CRITICAL] Email Delivery: Letzte Email vor X Stunden
[OK/WARNING/CRITICAL] Lead Sources: XX mit Email (>100=OK)

CRON JOBS:
[OK/X] X von Y Jobs erfolgreich
Fehlgeschlagen: [Liste mit Fehlergrund]

CONVERSION FUNNEL:
Leads Total    → XXX
With Email     → XXX (XX% Email-Find-Rate)
Contacted      → XXX (XX% Contact-Rate)
Clicks         → XXX (XX% Click-Rate)
Signups        → XXX (XX% Signup-Rate)
Paid           → XXX (XX% Paid-Rate) ← HAUPTMETRIK!

LEAD-QUELLEN:
- Daily Outreach: OK/LOW/CRITICAL (Google Places)
- LinkedIn: OK/LOW/CRITICAL (X pending Demos)
- TripAdvisor: OK/LOW/CRITICAL
- G2: OK/LOW/CRITICAL
- Yelp: OK/LOW/CRITICAL

=== AUTOMATION STATUS ===

VOLLAUTOMATISCH (laufen ohne Berend):
[✓/✗] Daily Outreach: X Emails heute (09:00 Cron)
[✓/✗] Demo Generation: X Demos heute (08:00 Cron)
[✓/✗] Drip Emails: X Drips heute (10:00 Cron)
[✓/✗] Keep-Alive: Backend up (*/15 Cron)

SEMI-MANUELL (brauchen `claude --chrome`):
[OK/LOW/CRITICAL] LinkedIn → /linkedin-connect
[OK/LOW/CRITICAL] TripAdvisor → /scrape-leads
[OK/LOW/CRITICAL] G2 → /g2-miner
[OK/LOW/CRITICAL] Yelp → /yelp-audit
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
  ├─ Backend Health OK? (via /api/health)
  │   ├─ NEIN → KRITISCH: Backend down, Render Dashboard checken
  │   └─ JA → Weiter
  │
  ├─ AI/Product Health OK? (via /api/admin/ai-health) ← KRITISCH!
  │   │
  │   ├─ Error Rate >20%? → KRITISCH: AI kaputt! Logs checken, API Keys pruefen
  │   ├─ Keine Generationen seit 48h? → WARNING: Keine User? Oder Bug?
  │   └─ OK → Weiter
  │
  ├─ Payment Health OK? (via /api/admin/payment-health)
  │   │
  │   ├─ Stripe nicht konfiguriert? → KRITISCH: User koennen nicht bezahlen!
  │   ├─ Keine Zahlung seit 30 Tagen? → INFO: Noch keine Conversions
  │   └─ OK → Weiter
  │
  ├─ User Activity OK? (via /api/admin/user-activity)
  │   │
  │   ├─ DAU = 0? → KRITISCH: Keine aktiven User! Traffic-Problem?
  │   ├─ Users at Limit > 0? → AKTION: Diese User kontaktieren fuer Upgrade!
  │   └─ OK → Weiter
  │
  ├─ Pipeline Health abrufen (via /api/admin/pipeline-health)
  │   │
  │   ├─ Lead Queue Status?
  │   │   ├─ CRITICAL (<20) → Berend: SOFORT neue Leads scrapen!
  │   │   ├─ WARNING (20-100) → Berend: Heute noch scrapen
  │   │   └─ OK (>100) → Weiter
  │   │
  │   ├─ Demo Generation Status?
  │   │   ├─ CRITICAL (>48h) → Pruefe /api/cron/generate-demos, Cron Job aktiv?
  │   │   ├─ WARNING (24-48h) → Beobachten
  │   │   └─ OK (<24h) → Weiter
  │   │
  │   ├─ Email Delivery Status?
  │   │   ├─ CRITICAL (>48h) → Pruefe Daily Outreach, Brevo/Resend Credits
  │   │   ├─ WARNING (24-48h) → Beobachten
  │   │   └─ OK (<24h) → Weiter
  │   │
  │   └─ Conversion Funnel?
  │       ├─ 0% Paid Rate → HAUPTPROBLEM: Analysiere warum keine Conversions
  │       ├─ 0% Signup Rate → Problem: Clicks fuehren nicht zu Signups
  │       ├─ <1% Click Rate → Problem: Emails werden nicht geklickt
  │       └─ OK → Weiter
  │
  ├─ Cron Jobs alle gruen? (via Chrome MCP)
  │   ├─ NEIN → Fehler analysieren, automatisch fixen wenn moeglich
  │   └─ JA → Weiter
  │
  ├─ API Credits OK? (via /api/admin/api-credits)
  │   ├─ EXHAUSTED → Berend: Keys erneuern
  │   ├─ CRITICAL (>90%) → Berend: Bald erneuern
  │   └─ OK → Weiter
  │
  └─ Alles OK → "System healthy! Conversion ist das Hauptproblem."
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

PRODUCT HEALTH:
[OK] AI Generator: 45 Responses heute, Letzte vor 2 Stunden
[OK] Error Rate: 2% (unter 5% Schwelle)
[OK] Stripe: Konfiguriert, keine Zahlungen (noch keine Conversions)

USER ACTIVITY:
[WARNING] DAU: 3 aktive User (unter 5 Schwelle)
[OK] Responses/Tag: 45
[INFO] Users at Limit: 2 ← UPGRADE-POTENZIAL!

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

=== AUTOMATION STATUS ===

VOLLAUTOMATISCH:
[✓] Daily Outreach: 35 Emails heute (09:00 Cron)
[✓] Demo Generation: 5 Demos heute (08:00 Cron)
[✓] Drip Emails: 12 Drips heute (10:00 Cron)
[✓] Keep-Alive: Backend up (*/15 Cron)

SEMI-MANUELL (brauchen `claude --chrome`):
[CRITICAL] LinkedIn: 0 pending → /linkedin-connect JETZT!
[OK] TripAdvisor: 45 Leads
[LOW] G2: 18 Leads → /g2-miner bald
[OK] Yelp: 32 Leads

=== BEREND TODO ===

JETZT (`claude --chrome` starten):
[ ] /linkedin-connect → 5+ Connections senden
[ ] /g2-miner → 30 neue Leads scrapen

HEUTE:
[ ] 2 User am Limit kontaktieren (Upgrade-Gespraech!)

DIESE WOCHE:
[ ] Demo-Videos aufnehmen (Main 60s, Extension 30s)
[ ] Google Indexierung (5-10 URLs/Tag)
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
