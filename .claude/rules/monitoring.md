# Monitoring Rules (Auto-loaded for: Burst-9, 10, 11)

> Health Checks, Metriken, Alerting

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

> **ECHTER USER = Mindestens 1 Response generiert**
> Registration allein zaehlt NICHT!

```
DB-Felder (user-list Endpoint):
- total_registered = Alle mit Account (inkl. 0 Responses)
- total_real = Nur User mit 1+ Response generiert

BEISPIEL:
- 60 registered, 6 real = 54 haben nie das Produkt genutzt!
- Das ist ein ONBOARDING Problem, nicht Traffic Problem
```

### API Check
```bash
# User-Liste mit Real/Registered Split:
curl -s -H "x-admin-key: XXX" \
  "https://review-responder.onrender.com/api/admin/user-list?exclude_test=true"

# Response enthaelt:
# { total_registered: 60, total_real: 6, ... }
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

*Loaded by: Burst-9 (Doctor), Burst-10 (Morning Briefer), Burst-11 (Bottleneck Analyzer)*
