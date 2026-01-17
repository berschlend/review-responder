# Monitoring Rules (Auto-loaded for: Burst-9, 10, 11)

> Health Checks, Metriken, Alerting

---

## REAL USER METRICS (KRITISCH!)

### Persistenz-Datei (Single Source of Truth)
```
content/claude-progress/real-user-metrics.json
```

### Session-Start: IMMER lesen!
```bash
cat content/claude-progress/real-user-metrics.json
```
> DB zeigt 61 User - das ist FALSCH! Echte Zahl steht in der JSON.

### Auto-Update Regel (Burst-10 Morning Briefer)
```
WENN lastUpdated > 24h:
  1. /data-analyze ausfuehren
  2. real-user-metrics.json aktualisieren
  3. In Morning Briefing erwaehnen
```

### Aktuelle Realitaet (Stand 17.01.2026)
| Metrik | DB sagt | **Echt** |
|--------|---------|----------|
| User | 61 | **0 organic** |
| Aktiviert | ? | **0** |
| CTR | 4.4% | **1.4%** |

---

## Health Check Endpoints

### Mit Admin Header!
```bash
curl -s -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  "https://review-responder.onrender.com/api/admin/stats?exclude_test=true"
```

### Key Endpoints
| Endpoint | Was es zeigt |
|----------|--------------|
| `/api/admin/stats` | User Count, Response Count, MRR |
| `/api/admin/parallel-safe-status` | Lock Status, Email Queue |
| `/api/admin/api-costs` | API Spend |
| `/api/outreach/dashboard` | Outreach Metriken |
| `/api/admin/product-quality` | Slop Rate, Quality Score |
| `/api/admin/feedback-summary` | User Feedback, Rating, Pain Points (NEU!) |

---

## Metriken zu ueberwachen

### Taegliche Checks
| Metrik | Target | Warning | Critical |
|--------|--------|---------|----------|
| Response Count | +50/Tag | <20 | <5 |
| Demo Count | +20/Tag | <10 | <3 |
| Emails Sent | +50/Tag | <20 | <5 |
| Bounce Rate | <5% | >10% | >20% |
| API Errors | <1% | >5% | >10% |

### Woechentliche Checks
| Metrik | Target | Warning | Critical |
|--------|--------|---------|----------|
| New Users | +10/Woche | <5 | 0 |
| Conversions | +1/Woche | 0 | - |
| Churn Rate | <10% | >15% | >25% |
| Email CTR | >3% | <2% | <1% |

---

## Agent Health Monitoring (Burst-10)

### Status Files
- `content/claude-progress/burst-X-status.json`
- Check: `last_heartbeat` < 2h ago?
- Check: `status` != "stuck"?

### Stale Agent Detection
```
WENN last_heartbeat > 2 Stunden:
  -> Agent ist STALE
  -> In Morning Briefing erwaehnen
  -> Empfehlung: Neu starten
```

---

## Product Quality (Burst-9)

### Quality Test Endpoint
```bash
GET /api/cron/quality-test?secret=XXX&limit=5&dry_run=true
```

### Metrics
- `slop_rate` - % generische Phrasen in Responses
- `quality_score` - Overall Quality (0-100)
- `test_results[]` - Individual Test Results

### Blacklisted Phrases (Slop)
- "Thank you for your feedback"
- "We appreciate..."
- "thrilled", "delighted"
- "valued customer"

---

## Bottleneck Analysis (Burst-11)

### Current Bottlenecks (17.01)
| Bottleneck | Status | Priority |
|------------|--------|----------|
| Demo Emails | 97% FAIL | P1 - FIX SOFORT |
| Magic Link Activation | 0% | P1 - FIXED |
| Real User Activation | 0% | P1 - Outreach Problem |

### Analysis Pattern
```
1. Hole Metriken (exclude_test=true!)
2. Vergleiche mit Targets
3. Identifiziere groessten Gap
4. Schreibe in bottleneck-report.md
5. Empfehlung fuer Priority-1 Agents
```

---

## Alerting

### Wann Critical Notification senden
```bash
# NUR bei echten Problemen:
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\claude-notify.ps1" \
  -Type critical -Session "BURST[X]" -Message "Problem: [Beschreibung]"
```

### Alert Trigger
| Event | Alert Type |
|-------|------------|
| API Down >5min | critical |
| 0 Emails sent heute | critical |
| Conversion! | sale |
| Budget >95% | critical |

---

## Real User Definition (KRITISCH!)

> **ECHTER USER = Mind. 1 Generierung EGAL WO**
> - `responses` (eingeloggt generiert)
> - `demo_generations` (Demo-Seite mit Email)
> - `public_try_usage` (Instant Try auf Homepage)
> Registration allein zaehlt NICHT!

```
API Response (admin/stats):
realUsers: {
  total: X,        // Echte User (1+ Generierung)
  viaGenerator: Y, // Davon eingeloggt generiert
  viaDemo: Z,      // Nur Demo-Generierung
  viaInstantTry: W, // Via Instant Try Widget
  inactive: A      // Registriert aber 0 Generierungen
}

BEISPIEL:
- 60 registered, 6 real, 54 inactive = Onboarding Problem!
- JEDE Generierung (auch instant try) zaehlt als "aktiv"!
```

### API Check
```bash
# Stats mit Real/Inactive Split:
curl -s -H "x-admin-key: XXX" \
  "https://review-responder.onrender.com/api/admin/stats?exclude_test=true"

# Response enthaelt:
# { realUsers: { total: 6, viaGenerator: 4, viaDemo: 1, viaInstantTry: 1, inactive: 54 }, ... }
```

---

## Test-Account Filter (PFLICHT!)

```bash
# IMMER bei User-Metriken:
?exclude_test=true

# Ohne Filter:
# - 42 "Users" (FAKE)
# - 29% "Activation" (FAKE)

# Mit Filter:
# - ~20 echte Users
# - 0% echte Activation
```

---

## User Feedback Monitoring (NEU V3.7!)

### Endpoint
```bash
curl -s -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  "https://review-responder.onrender.com/api/admin/feedback-summary?exclude_test=true"
```

### Helper Command
```bash
powershell -File scripts/agent-helpers.ps1 -Action feedback-read
powershell -File scripts/agent-helpers.ps1 -Action feedback-alert
```

### Metriken
| Metrik | Gut | Warning | Critical |
|--------|-----|---------|----------|
| Avg Rating | >4.0 | 3.5-4.0 | <3.5 |
| Rating Trend | stable/up | - | declining |
| Pain Points | 0 | 1-2 | 3+ |

### Alert Trigger
| Event | Alert Type |
|-------|------------|
| Rating Drop >0.5 | warning |
| Avg Rating <3.5 | critical |
| 3+ Pain Points | warning |

### Integration
- **Burst-9:** Inkludiere in conversion-report.md
- **Burst-11:** Korreliere mit Bottleneck-Analyse
- **Cron:** `/api/cron/process-feedback` alle 6h

---

## 🌐 CHROME MCP MONITORING (NEU V4.3!)

> **Monitoring Agents können Gmail + Admin Dashboard via Chrome MCP checken.**
> Ergänzt die API-basierten Health Checks mit visuellen Checks.

### Wann Chrome MCP nutzen?

| Check | API | Chrome MCP | Empfehlung |
|-------|-----|------------|------------|
| User Count | ✅ `/admin/stats` | ✅ Dashboard | API (schneller) |
| Email Bounces | ❌ | ✅ Gmail | **Chrome MCP** |
| Replies | ❌ | ✅ Gmail | **Chrome MCP** |
| Visual Health | ❌ | ✅ Screenshot | **Chrome MCP** |
| Login Flow | ❌ | ✅ Test Login | **Chrome MCP** |

### Gmail Monitoring Workflow

```bash
# 1. Tab Context holen
mcp__claude-in-chrome__tabs_context_mcp({ createIfEmpty: true })

# 2. Gmail öffnen
mcp__claude-in-chrome__navigate({ url: "https://mail.google.com", tabId: [ID] })

# 3. Warten (Gmail lädt langsam)
mcp__claude-in-chrome__computer({ action: "wait", duration: 5, tabId: [ID] })

# 4. Nach Bounces suchen
mcp__claude-in-chrome__find({ query: "search box", tabId: [ID] })
# → Klicken und eingeben: "from:mailer-daemon newer_than:1d"

# 5. Screenshot für Report
mcp__claude-in-chrome__computer({ action: "screenshot", tabId: [ID] })
```

### Was in Gmail checken?

| Check | Suchfilter | Aktion bei Fund |
|-------|------------|-----------------|
| Bounces | `from:mailer-daemon newer_than:1d` | Lead als `bounced` markieren |
| Replies | `subject:re: "review" is:unread` | An Burst-5 handoff |
| Resend Errors | `from:resend.com "failed"` | In Health Log |
| Spam Reports | `from:postmaster "spam"` | ALERT! Outreach stoppen |

### Dashboard Visual Checks

```bash
# Login und Dashboard öffnen
mcp__claude-in-chrome__navigate({ url: "https://tryreviewresponder.com/login", tabId: [ID] })

# Mit Test Account einloggen
# → find "email input", form_input mit funnel-test-unlimited@test.local
# → find "password input", form_input mit ad131653129e8362dac3396bf1f0cc51
# → find "login button", click

# Screenshot der Metriken
mcp__claude-in-chrome__computer({ action: "screenshot", tabId: [ID] })
```

### Monitoring Schedule

| Agent | Gmail Check | Dashboard Check | Frequenz |
|-------|-------------|-----------------|----------|
| Burst-9 | ❌ | ✅ | Jeder Loop |
| Burst-10 | ✅ | ✅ | 1x/Tag (Morning) |
| Burst-11 | ❌ | ✅ | Jeder Loop |

### Alert Trigger (Gmail-basiert)

| Fund in Gmail | Alert Level | Aktion |
|---------------|-------------|--------|
| 5+ Bounces/Tag | warning | Lead-Qualität prüfen |
| Spam Complaint | **critical** | Outreach STOPPEN |
| Angry Reply | warning | An Burst-5 für Response |
| Positive Reply | **sale** | Hot Lead! |

### Gmail Reply Workflow (NEU!)

> **Agents können jetzt auch via Gmail antworten!**
> Besser als API für persönliche 1:1 Kommunikation.

```bash
# Bei interessierter Reply:
1. Email öffnen in Gmail
2. Reply-Button klicken
3. Persönliche Antwort schreiben
4. Senden

# Wann Gmail Reply nutzen?
- Kunde hat Frage gestellt
- Hot Lead will mehr Info
- Support-Anfrage
- Persönliche Follow-ups
```

| Situation | Gmail Reply | API |
|-----------|-------------|-----|
| Kunde fragt "Wie funktioniert X?" | ✅ Gmail | ❌ |
| Hot Lead: "Interessiert, mehr Info?" | ✅ Gmail | ❌ |
| Bulk Follow-up an 50 Leads | ❌ | ✅ API |
| Demo-Email senden | ❌ | ✅ API |

---

*Loaded by: Burst-9 (Doctor), Burst-10 (Morning Briefer), Burst-11 (Bottleneck Analyzer)*
