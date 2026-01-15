# Night-Burst Verification Checklist

> **VOR dem Start aller Night-Burst Agents ausführen!**

---

## ✅ PRE-FLIGHT CHECK

### 1. System Status
```bash
# Backend Health
curl -s "https://review-responder.onrender.com/health" | jq '.status'

# DB Connection
curl -s "https://review-responder.onrender.com/api/admin/stats?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" | jq '.total_leads'
```

**Expected:**
- Health: "ok"
- DB: Returns number

---

### 2. API Budgets
```bash
curl -s "https://review-responder.onrender.com/api/admin/api-costs?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
```

| API | Limit | Current | Status |
|-----|-------|---------|--------|
| Resend | 100/day | ? | 🟢/🔴 |
| SerpAPI | 100/mo | ? | 🟢/🔴 |
| Outscraper | 500/mo | ? | 🟢/🔴 |
| OpenAI | $10/day | ? | 🟢/🔴 |

**If any 🔴:** Escalate to Berend before starting!

---

### 3. Current Metrics (Baseline)
```bash
curl -s "https://review-responder.onrender.com/api/admin/stats?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
```

Record these BEFORE starting:

| Metric | Value | Timestamp |
|--------|-------|-----------|
| Total Leads | ? | ? |
| Leads with Email | ? | ? |
| Emails Sent | ? | ? |
| Total Clicks | ? | ? |
| Registrations | ? | ? |
| Paying Customers | ? | ? |
| MRR | $? | ? |

---

### 4. Check Progress Files
```
□ content/claude-progress/learnings.md exists
□ content/claude-progress/for-berend.md exists
□ content/claude-progress/conversion-report.md exists
□ content/claude-progress/berend-feedback.md exists
```

---

### 5. Chrome MCP (If needed for Burst-1, Burst-3)

```bash
# Check Chrome Extension is running
# MCP should respond to tabs_context_mcp
```

---

## 🚀 START SEQUENCE

### Recommended Order:

1. **Burst-9 (Doctor)** - First, to establish baseline
2. **Burst-10 (Briefer)** - Second, to start monitoring
3. **Burst-1 (Lead Finder)** - Start filling funnel
4. **Burst-2 (Cold Emailer)** - Start outreach
5. **Burst-4 (Demo Gen)** - Ready for hot leads
6. **Burst-5 (Hot Lead Chaser)** - Follow up on clicks
7. **Burst-6 (User Activator)** - Activate registrations
8. **Burst-7 (Payment Converter)** - Convert active users
9. **Burst-8 (Upgrader)** - Upgrade paying customers
10. **Burst-3 (Social DM)** - Optional, Chrome required

### Start Commands:

```powershell
# Terminal 1
$env:CLAUDE_SESSION = "BURST1"
claude
# Run: /night-burst-1

# Terminal 2
$env:CLAUDE_SESSION = "BURST2"
claude
# Run: /night-burst-2

# ... etc
```

---

## 📊 DURING OPERATION

### Health Check (Every 2 Hours)
```bash
curl -s "https://review-responder.onrender.com/api/admin/stats?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
```

### Check Agent Status Files
```
content/claude-progress/burst-1-status.json
content/claude-progress/burst-2-status.json
...
content/claude-progress/burst-10-status.json
```

### Red Flags:
- `"stuck": true` → Agent needs help
- `"needs_berend": [...]` → Items requiring human decision
- `last_run` > 2 hours ago → Agent may have stopped

---

## 🛑 EMERGENCY STOP

If something goes wrong:

1. Say "Stopp" to all agents
2. Check for-berend.md for issues
3. Check learnings.md for what happened
4. Fix the issue
5. Restart from verification

---

## 📋 POST-NIGHT CHECKLIST

After agents run overnight:

```
□ Check for-berend.md for summary
□ Check for any 🔴 alerts
□ Check MRR change
□ Check new registrations
□ Check learnings.md for new patterns
□ Respond to any needs_berend items
□ Save metrics snapshot for comparison
```

---

*Run this before every Night-Burst session!*
