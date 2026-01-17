# Night-Burst Core V4.6 - KOMPAKT

> **Ziel:** $1000 MRR | **Stand:** 0 zahlende Kunden
> **WICHTIG:** Diese Datei ist absichtlich kurz gehalten um Memory-Probleme zu vermeiden!

---

## SESSION-START (PFLICHT!)

```bash
# 1. Backend wecken (Render schläft)
powershell -File scripts/agent-helpers.ps1 -Action wake-backend

# 2. Heartbeat senden
powershell -File scripts/agent-helpers.ps1 -Action heartbeat -Agent [X]

# 3. Goal checken
powershell -File scripts/agent-helpers.ps1 -Action goal-check

# 4. Tonight's Prompt lesen (falls gesetzt)
cat content/claude-progress/tonight-prompt.md 2>$null
```

---

## QUICK REFERENCE

### Admin API
```bash
curl -s -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  "https://review-responder.onrender.com/api/admin/stats?exclude_test=true"
```

### Test Accounts (Dashboard Login)
| Tier | Email | PW |
|------|-------|----|
| Unlimited | `funnel-test-unlimited@test.local` | `ad131653129e8362dac3396bf1f0cc51` |

### Helper Commands
```bash
# Status
powershell -File scripts/agent-helpers.ps1 -Action status-read -Agent [X]
powershell -File scripts/agent-helpers.ps1 -Action status-update -Agent [X] -Data '{"key":"value"}'

# Memory & Learnings
powershell -File scripts/agent-helpers.ps1 -Action memory-read -Agent [X]
powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [X] -Data "Learning hier"

# Handoffs
powershell -File scripts/agent-helpers.ps1 -Action handoff-create -Agent [X] -Data '{"to":"burst-Y","data":{}}'
powershell -File scripts/agent-helpers.ps1 -Action handoff-check -Agent [X]

# Budget
powershell -File scripts/agent-helpers.ps1 -Action budget-check -Agent [X] -Key resend
powershell -File scripts/agent-helpers.ps1 -Action budget-use -Key resend -Amount 1

# Task Switching (wenn blockiert)
powershell -File scripts/agent-helpers.ps1 -Action check-blocked -Agent [X] -Resource email_lock
powershell -File scripts/agent-helpers.ps1 -Action task-switch -Agent [X] -Data '{"to":"backup"}'
```

---

## CORE RULES

### 1. Maximum Autonomy (Opus 4.5)
- **AUTONOM:** Emails, Discounts (mit Reasoning), Strategien, API Spend
- **BEREND NÖTIG:** User löschen, Legal ändern, Budget >$100/Tag
- **IMMER:** Reasoning dokumentieren, Daten als Basis, Outcomes tracken

### 2. Never Wait
- Wenn blockiert → Backup Task machen
- Wenn 30min ohne Progress → Alternative suchen
- NIEMALS idle warten

### 3. Test-Account Filter PFLICHT
```bash
# IMMER bei Metriken:
?exclude_test=true
?exclude_bots=true
```

### 4. Real User Definition
> **ECHTER USER = 1+ Generierung** (egal ob Generator, Demo, oder Instant Try)
> Registration allein zählt NICHT!

---

## NOTIFICATION (Anti-Spam!)

```bash
# NUR bei echten Problemen (done/input werden unterdrückt für BURST*):
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\claude-notify.ps1" -Type critical -Session "BURST[X]" -Message "Problem"
```

---

## FILES REFERENCE

| Was | Wo |
|-----|-----|
| Agent Memory | `content/claude-progress/agent-memory.json` |
| Agent Status | `content/claude-progress/burst-X-status.json` |
| Learnings | `content/claude-progress/learnings.md` |
| Handoffs | `content/claude-progress/handoff-queue.json` |
| Focus | `content/claude-progress/current-focus.json` |
| Budget | `content/claude-progress/resource-budget.json` |
| Task Queue | `content/claude-progress/agent-task-queue.json` |
| Funnel Health | `content/claude-progress/funnel-health-log.json` |

---

## RULES AUTO-LOAD

Weitere Details in `.claude/rules/`:
- `sales.md` - Burst-1,2,3,5 (Email, Discount, Leads)
- `demo.md` - Burst-4 (Demo Generation)
- `monitoring.md` - Burst-9,10,11 (Health, Metriken)
- `dev.md` - API Reference, DB Schema
- `chrome-performance.md` - Chrome MCP Performance

---

## SESSION-ENDE (PFLICHT!)

```bash
# Learnings speichern
powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [X] -Data "[Wichtigstes Learning]"

# Status updaten
powershell -File scripts/agent-helpers.ps1 -Action status-update -Agent [X] -Data '{"status":"completed"}'
```

### Zusammenfassung Template
```
## SESSION [Burst-X] - [Datum]
- Loops: [N]
- Aktionen: [Was gemacht]
- Learning: [Was gelernt]
- Nächste Session: [Was noch zu tun]
```

---

## PRIORITY MAP

| Agent | Priority | Status |
|-------|----------|--------|
| Burst-2 (Cold Email) | 1 | ACTIVE |
| Burst-4 (Demo Gen) | 1 | ACTIVE |
| Burst-5 (Hot Lead) | 1 | ACTIVE |
| Burst-9 (Doctor) | 2 | ACTIVE |
| Burst-11 (Bottleneck) | 2 | ACTIVE |
| Burst-14 (Lead Score) | 2 | ACTIVE |
| Andere | 3 | PAUSED |

---

## CHROME MCP (wenn --chrome)

```bash
# Tab Context holen
mcp__claude-in-chrome__tabs_context_mcp({ createIfEmpty: true })

# Performance: find() statt wait(), read_page() statt screenshot()
# Details: .claude/rules/chrome-performance.md
```

---

*V4.6 - Kompakt für Memory-Effizienz. Ausführliche Docs in `.claude/rules/`*
