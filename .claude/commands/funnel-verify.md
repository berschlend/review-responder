# /funnel-verify - E2E Funnel Test mit Chrome MCP

> **Meta-Skill** der ALLE User-Flows testen kann.
> Nutzt First-Principles bei Failures.
> Findet Bugs bevor sie 100+ Leads betreffen.

---

## QUICK START

```bash
claude --chrome

# Alle kritischen Flows testen
/funnel-verify

# Spezifische Flows
/funnel-verify demo          # Demo-to-User Flow
/funnel-verify activation    # User-to-FirstResponse Flow
/funnel-verify conversion    # Free-to-Paid Flow
/funnel-verify generator     # Core Feature Test
/funnel-verify extension     # Chrome Extension Flow
/funnel-verify alerts        # Review Alerts Flow
/funnel-verify all           # ALLE Flows (dauert laenger)
```

---

## ⚡ PERFORMANCE RULES (KRITISCH FÜR PARALLELE AGENTS!)

> **Mehrere Claudes können gleichzeitig Chrome MCP nutzen - aber NUR mit diesen Rules!**

### DIE 4 KILLER VERMEIDEN

| Killer | Problem | Lösung |
|--------|---------|--------|
| `wait(5)` | Wartet IMMER 5 Sek | Smart Wait mit `find` |
| `screenshot` | 2-5MB pro Bild | `read_page` first |
| Serielle Ops | Tab1, dann Tab2 | Parallel Tool-Calls |
| Tab-Registry | PowerShell nach navigate | Batch/Skip |

### SMART WAIT PATTERN (PFLICHT!)

```javascript
// FALSCH (blockiert Chrome):
navigate({ url, tabId })
computer({ action: "wait", duration: 5, tabId })

// RICHTIG (gibt Chrome frei):
navigate({ url, tabId })
// Sofort prüfen ob bereit:
for (let i = 0; i < 3; i++) {
  const result = find({ query: "expected element", tabId });
  if (result.elements.length > 0) break;
  computer({ action: "wait", duration: 1, tabId });  // MAX 1 Sek!
}
```

### READ_PAGE > SCREENSHOT

```javascript
// FALSCH (2-5MB, blockiert):
computer({ action: "screenshot", tabId })

// RICHTIG (~10KB, schnell):
read_page({ tabId, filter: "interactive" })
```

**Screenshot NUR wenn:**
- Visuelles Debugging nötig
- Evidence für User/Report
- Layout-Check (selten!)

### PARALLELE TOOL-CALLS

```javascript
// FALSCH (seriell, langsam):
navigate({ url: "gmail.com", tabId: 1 })
navigate({ url: "stripe.com", tabId: 2 })

// RICHTIG (parallel, schnell):
// Beide in EINEM Tool-Call Block senden!
```

### PERFORMANCE CHECKLIST (vor jedem Flow!)

- [ ] Nutze ich `find` + retry statt `wait(X)` wo möglich?
- [ ] Nutze ich `read_page` statt `screenshot` wo möglich?
- [ ] Sind unabhängige Operationen parallel?
- [ ] Max Wait pro Aktion: 1-2 Sekunden?

---

## ARCHITEKTUR

```
/funnel-verify (Meta-Skill)
    │
    ├── Sub-Skill: DEMO FLOW
    │   ├── Cold Email Simulation
    │   ├── Demo Page Load
    │   ├── Email Gate
    │   └── Auto-Account Creation
    │
    ├── Sub-Skill: ACTIVATION FLOW
    │   ├── Dashboard Access
    │   ├── Generator Navigation
    │   ├── First Response Generation
    │   └── Response Copy/Save
    │
    ├── Sub-Skill: CONVERSION FLOW
    │   ├── Limit Reached State
    │   ├── Upgrade CTA
    │   ├── Pricing Page
    │   └── Stripe Checkout
    │
    ├── Sub-Skill: GENERATOR FLOW
    │   ├── Single Review Input
    │   ├── AI Response Generation
    │   ├── Tone/Style Options
    │   └── Copy Functionality
    │
    ├── Sub-Skill: EXTENSION FLOW
    │   ├── Extension Load
    │   ├── External Site Detection
    │   ├── Review Extraction
    │   └── Response Injection
    │
    └── Sub-Skill: ALERTS FLOW
        ├── Alert Setup
        ├── Business Search
        ├── Monitor Configuration
        └── Alert Email Test
```

---

## ALLE MÖGLICHEN USER FLOWS

### Flow-Katalog (Priorisiert)

| Priority | Flow | Was wird getestet | Business Impact |
|----------|------|-------------------|-----------------|
| **P1** | Demo → User | Demo-Email Empfaenger wird User | Direkte Conversion |
| **P1** | User → First Response | Neuer User generiert erste Response | Activation |
| **P1** | Free → Paid | User upgraded nach Limit | Revenue |
| **P2** | Landing → Register | Direktbesucher registriert sich | Organic Growth |
| **P2** | Generator Core | Hauptfeature funktioniert | Core Value |
| **P3** | Extension | Chrome Extension Flow | Power Users |
| **P3** | Review Alerts | Alert Setup & Delivery | Retention |
| **P3** | Magic Link | Passwordless Login | UX |
| **P3** | Bulk Generator | Multiple Reviews | Pro Feature |

---

## SUB-SKILL: DEMO FLOW

> **Testet:** Email-Empfaenger → Demo-Page → Auto-Account → Logged-in User

### Setup
```bash
# 1. Test-Email generieren (unique!)
TEST_EMAIL="funnel-test-$(date +%s)@test.local"

# 2. Bestehende Demo holen (NICHT neu generieren!)
curl -s "https://review-responder.onrender.com/api/admin/demos?limit=1" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
# → Nimm demo_token aus Response

# 3. Chrome Tab oeffnen
tabs_context_mcp(createIfEmpty: true)
tabs_create_mcp()
```

### Steps

```
DEMO FLOW CHECKLIST:

[ ] STEP 1: Demo-Page Navigation
    - navigate(demo_url, tabId)
    - find("response" OR "review", tabId)  # Smart Wait!
    - read_page({ tabId, filter: "interactive" })  # Statt screenshot!
    - VERIFY: Page loads ohne Error

[ ] STEP 2: Responses Visible
    - read_page(tabId)
    - VERIFY: Mind. 2 Response-Cards sichtbar
    - VERIFY: Business Name korrekt angezeigt

[ ] STEP 3: Email Gate Active
    - find("email input", tabId)
    - VERIFY: Email-Feld vorhanden
    - VERIFY: Responses geblurred ODER limited

[ ] STEP 4: Email Submit
    - form_input(email_ref, test_email, tabId)
    - find("unlock" OR "continue", tabId)
    - click(submit_ref, tabId)
    - find("copy" OR "dashboard" OR "generating", tabId)  # Smart Wait!

[ ] STEP 5: Auto-Account Verification
    - javascript("localStorage.getItem('token')", tabId)
    - VERIFY: JWT Token vorhanden
    - javascript("localStorage.getItem('user')", tabId)
    - VERIFY: User-Objekt mit email

[ ] STEP 6: Content Unlocked
    - read_page(tabId)
    - VERIFY: Blur entfernt
    - VERIFY: Copy-Button aktiv
    - VERIFY: CTA zu Generator sichtbar
```

### First-Principles bei Failure

```
WENN DEMO FLOW FAILED:

SYMPTOM: [Was genau fehlschlaegt]
ECHTES PROBLEM: Analysiere:
  - Ist es Frontend (React)?
  - Ist es Backend (API)?
  - Ist es DB (Demo nicht gespeichert)?

CHECK ORDER:
1. curl /api/demo/[token] → Response?
2. Browser Console → JS Errors?
3. Network Tab → API Calls?
4. DB → Demo existiert?

NICHT: "Nochmal versuchen"
SONDERN: Root Cause finden
```

---

## SUB-SKILL: ACTIVATION FLOW

> **Testet:** Neuer User → Dashboard → Generator → First Response

### Prerequisites
- User muss eingeloggt sein (JWT in localStorage)
- Kann nach Demo Flow oder separatem Login

### Steps

```
ACTIVATION FLOW CHECKLIST:

[ ] STEP 1: CTA Click (von Demo Page)
    - find("Start generating" OR "try it", tabId)
    - click(cta_ref, tabId)
    - find("business" OR "review" OR "generator", tabId)  # Smart Wait!

[ ] STEP 2: Correct Redirect
    - javascript("window.location.pathname", tabId)
    - VERIFY: "/generator" (NICHT "/dashboard"!)
    - KRITISCH: Dashboard-Redirect = Activation Killer

[ ] STEP 3: Generator Page Load
    - read_page(tabId)
    - VERIFY: Business Name Input sichtbar
    - VERIFY: Review Input sichtbar
    - VERIFY: Generate Button sichtbar

[ ] STEP 4: Input Test Data
    - find("business name", tabId)
    - form_input(ref, "Test Restaurant Berlin", tabId)
    - find("review", tabId)
    - form_input(ref, "Food was cold and service slow.", tabId)

[ ] STEP 5: Generate Response
    - find("generate", tabId)
    - click(ref, tabId)
    - # Smart Wait: AI Gen kann 3-15s dauern, aber nicht blockieren!
    - for (let i = 0; i < 15; i++) {
        const result = find({ query: "copy OR response-text OR generated", tabId });
        if (result.length > 0) break;
        wait({ duration: 1, tabId });  # 1s Intervall, max 15 retries
      }

[ ] STEP 6: Response Verification
    - read_page(tabId)
    - VERIFY: AI Response Text sichtbar
    - VERIFY: Kein "Error" Message
    - VERIFY: Copy Button vorhanden

[ ] STEP 7: Copy Test
    - find("copy", tabId)
    - click(ref, tabId)
    - VERIFY: "Copied!" Feedback ODER Clipboard filled

[ ] STEP 8: Stats Check (API)
    - curl /api/stats mit User Token
    - VERIFY: responses_used incremented
```

### First-Principles bei Failure

```
WENN ACTIVATION FAILED:

HAEUFIGSTE FAILURES:

1. Redirect zu /dashboard statt /generator
   → CTA Link falsch
   → Fix: Demo Page CTA href

2. Generator Error
   → API Key Problem
   → Fix: Check OPENAI_API_KEY oder ANTHROPIC_API_KEY

3. Response nicht gespeichert
   → DB Write Error
   → Fix: Check responses Table + User ID

4. Copy nicht funktioniert
   → Clipboard API blocked
   → Fix: HTTPS erforderlich
```

---

## SUB-SKILL: CONVERSION FLOW

> **Testet:** Free User → Limit → Upgrade → Stripe → Paid

### Prerequisites
- User mit 19/20 Responses (kurz vor Limit)
- Oder: API call um Limit zu simulieren

### Steps

```
CONVERSION FLOW CHECKLIST:

[ ] STEP 1: Simulate Near-Limit
    - API: Set user responses to 19/20
    curl -X POST "https://review-responder.onrender.com/api/admin/set-user-responses" \
      -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
      -H "Content-Type: application/json" \
      -d '{"email":"[TEST_EMAIL]", "responses_used": 19}'

[ ] STEP 2: Generate Final Free Response
    - Generator Page oeffnen
    - Response generieren
    - VERIFY: Response #20 funktioniert

[ ] STEP 3: Limit Reached State
    - Versuche Response #21
    - read_page(tabId)
    - VERIFY: Limit Warning erscheint
    - VERIFY: Upgrade CTA sichtbar

[ ] STEP 4: Upgrade Button Click
    - find("upgrade" OR "get more", tabId)
    - click(ref, tabId)
    - find("pricing" OR "stripe" OR "checkout", tabId)  # Smart Wait!

[ ] STEP 5: Pricing Page OR Stripe Direct
    - javascript("window.location.href", tabId)
    - VERIFY: /pricing ODER checkout.stripe.com

[ ] STEP 6: Stripe Checkout (Optional - nicht submitten!)
    - VERIFY: Stripe Page laedt
    - VERIFY: Korrekte Plan Details
    - VERIFY: Price korrekt ($29/$49/$99)
    - NICHT: Tatsaechlich bezahlen!
```

### First-Principles bei Failure

```
WENN CONVERSION FAILED:

1. Limit Warning erscheint nicht
   → Frontend Limit Check kaputt
   → Check: /api/stats Response + Frontend Logic

2. Upgrade Button fehlt
   → CTA nicht gerendert
   → Check: Pricing Component

3. Stripe laedt nicht
   → STRIPE_PUBLIC_KEY Problem
   → Check: Env Variable + Stripe Dashboard
```

---

## SUB-SKILL: GENERATOR FLOW

> **Testet:** Core Feature - Review Input → AI Response

### Steps

```
GENERATOR FLOW CHECKLIST:

[ ] STEP 1: Direct Generator Access
    - navigate("/generator", tabId)
    - VERIFY: Auth Check (redirect wenn nicht logged in?)

[ ] STEP 2: Verschiedene Input Types
    TEST A: Negative Review (deutsch)
    - Input: "Das Essen war kalt, Service langsam"
    - VERIFY: Response ist professionell + empathisch

    TEST B: Positive Review (englisch)
    - Input: "Great food, amazing service!"
    - VERIFY: Response ist dankbar + engaging

    TEST C: Mixed Review
    - Input: "Food was good but too expensive"
    - VERIFY: Response addressiert beide Punkte

[ ] STEP 3: Tone Options
    - Test: Professional Tone
    - Test: Friendly Tone
    - Test: Formal Tone
    - VERIFY: Responses unterscheiden sich

[ ] STEP 4: Platform Detection (wenn vorhanden)
    - Test: Google Review Format
    - Test: Yelp Review Format
    - VERIFY: Platform-spezifische Anpassungen

[ ] STEP 5: Response Quality Check
    - VERIFY: Keine "Slop" Phrases ("Thank you for your feedback")
    - VERIFY: Personalisiert (erwaehnt Business Name)
    - VERIFY: Addressiert Feedback spezifisch
```

---

## SUB-SKILL: EXTENSION FLOW

> **Testet:** Chrome Extension auf externen Review-Seiten

### Prerequisites
- Chrome Extension installiert
- Test-Account eingeloggt in Extension

### Steps

```
EXTENSION FLOW CHECKLIST:

[ ] STEP 1: Extension Load
    - Oeffne Extension Popup
    - VERIFY: Login Status korrekt
    - VERIFY: UI laedt ohne Fehler

[ ] STEP 2: Navigate to Review Site
    - navigate("google.com/maps", tabId)
    - Suche Test-Business
    - VERIFY: Reviews sichtbar

[ ] STEP 3: Extension Detection
    - Extension sollte Reviews erkennen
    - VERIFY: "Generate Response" Button erscheint

[ ] STEP 4: Generate via Extension
    - Click Extension Button
    - VERIFY: Response wird generiert
    - VERIFY: Response ist kontextbezogen

[ ] STEP 5: Inject Response (wenn Feature existiert)
    - Copy/Paste oder Direct Inject
    - VERIFY: Response im Reply-Feld
```

---

## SUB-SKILL: ALERTS FLOW

> **Testet:** Review Alert Setup und Delivery

### Steps

```
ALERTS FLOW CHECKLIST:

[ ] STEP 1: Alerts Setup Page
    - navigate("/dashboard/alerts", tabId)
    - VERIFY: Setup UI sichtbar

[ ] STEP 2: Business Search
    - Suche nach Test-Business
    - VERIFY: Google Places Autocomplete funktioniert
    - VERIFY: Business Details werden geladen

[ ] STEP 3: Configure Alert
    - Waehle Frequenz (daily/weekly)
    - VERIFY: Settings gespeichert

[ ] STEP 4: Test Alert (API)
    - curl /api/cron/review-alerts?test=true
    - VERIFY: Alert Email wird gesendet
    - VERIFY: Email Inhalt korrekt
```

---

## META-SKILL ORCHESTRATION

### Wenn `/funnel-verify` ohne Parameter:

```
DEFAULT EXECUTION ORDER (P1 Flows):

1. Backend Wake-Up Check
   curl --retry 3 /api/admin/stats

2. Demo Flow Test
   → Bei Failure: STOP + First-Principles

3. Activation Flow Test
   → Bei Failure: STOP + First-Principles

4. Conversion Flow Test (ohne echte Zahlung)
   → Bei Failure: Log + Continue

5. Generator Flow Test
   → Bei Failure: CRITICAL (Core Feature!)

6. Report Generation
```

### Wenn `/funnel-verify all`:

```
COMPLETE EXECUTION (Alle Flows):

P1 Flows (MUSS funktionieren):
1. Demo Flow
2. Activation Flow
3. Conversion Flow
4. Generator Flow

P2 Flows (SOLLTE funktionieren):
5. Landing → Register Flow
6. Magic Link Flow

P3 Flows (NICE TO HAVE):
7. Extension Flow
8. Alerts Flow
9. Bulk Generator Flow
```

---

## FIRST-PRINCIPLES INTEGRATION

### Bei JEDEM Failure:

```
=== FIRST PRINCIPLES ANALYSE ===

SYMPTOM: [Was sieht aus wie das Problem]
  z.B. "Demo Page zeigt keine Responses"

ECHTES PROBLEM: [Root Cause Analyse]
  1. API Check: curl /api/demo/[token]
  2. DB Check: Demo existiert?
  3. Frontend Check: Console Errors?
  4. Network Check: API Calls erfolgreich?

BISHERIGER ANSATZ: [Was wurde versucht]
  z.B. "Page neu laden"

WARUM ES NICHT FUNKTIONIERT: [Die falsche Annahme]
  z.B. "Frontend Bug, nicht Backend"

NEUER ANSATZ: [Was stattdessen tun]
  z.B. "Fix React Component rendering"

ERSTE AKTION: [Konkret, jetzt machbar]
  z.B. "Check DemoPage.tsx line 45"
```

### Automatische Root-Cause Checks:

```javascript
// Bei jedem Failure automatisch ausfuehren:

async function rootCauseAnalysis(failure) {
  const checks = [];

  // 1. Backend Health
  checks.push({
    name: "Backend Status",
    cmd: "curl /api/admin/stats",
    expect: "200 OK"
  });

  // 2. Console Errors
  checks.push({
    name: "JS Errors",
    cmd: "read_console_messages(tabId, onlyErrors: true)",
    expect: "[]"
  });

  // 3. Network Failures
  checks.push({
    name: "Failed Requests",
    cmd: "read_network_requests(tabId, status: 'failed')",
    expect: "[]"
  });

  // 4. Auth Status
  checks.push({
    name: "Auth Token",
    cmd: "localStorage.getItem('token')",
    expect: "JWT string"
  });

  return runChecks(checks);
}
```

---

## JSON REPORT FORMAT

```json
{
  "timestamp": "[ISO]",
  "mode": "default" | "all" | "[specific_flow]",
  "overall_status": "PASS" | "FAIL" | "PARTIAL",
  "duration_total_ms": 45000,

  "flows_tested": {
    "demo": {
      "status": "PASS",
      "steps_passed": 6,
      "steps_total": 6,
      "duration_ms": 12000
    },
    "activation": {
      "status": "FAIL",
      "steps_passed": 4,
      "steps_total": 8,
      "failed_at": "STEP 5: Generate Response",
      "error": "API returned 500",
      "first_principles": {
        "symptom": "Generate button returns error",
        "root_cause": "OpenAI API key expired",
        "fix": "Update OPENAI_API_KEY in Render"
      },
      "duration_ms": 8000
    },
    "conversion": {
      "status": "SKIPPED",
      "reason": "Previous critical flow failed"
    }
  },

  "critical_failures": [
    {
      "flow": "activation",
      "step": "Generate Response",
      "impact": "Users cannot generate responses",
      "priority": "P0 - FIX IMMEDIATELY"
    }
  ],

  "recommendations": [
    "1. Check OpenAI API key in Render dashboard",
    "2. Verify API credits available",
    "3. Re-run /funnel-verify activation after fix"
  ],

  "test_data": {
    "test_email": "funnel-test-1737162000@test.local",
    "demo_token": "demo_test_abc123",
    "user_created": true,
    "responses_generated": 0
  }
}
```

---

## NIGHT-AGENT INTEGRATION

### Vor JEDER Marketing-Aktion:

```bash
# Check Funnel Health (schnell, ohne volle Tests)
cat content/claude-progress/funnel-health-log.json

# Wenn last_check > 6h ODER status != PASS:
/funnel-verify

# Wenn FAIL:
# → STOPPE ALLE OUTREACH
# → Erstelle Burst-15 Approval
```

### Auto-Run nach Deploy:

```
DEPLOY HOOK:
1. Backend deployed
2. Wait 60s for spin-up
3. Run /funnel-verify
4. If FAIL → Rollback oder Alert
```

---

## CHROME MCP AUTONOMIE

> **WICHTIG:** Alle Chrome MCP Tools sind AUTONOM - keine User-Verifikation nötig!
> Die settings.json hat `"allow": ["mcp__claude-in-chrome__*"]`

### Screenshots sind autonom!

```javascript
// Screenshot bei jedem Schritt machen (KEIN User-Input nötig!)
await computer({ action: "screenshot", tabId });

// Zoom für kleine UI-Elemente
await computer({ action: "zoom", region: [100, 200, 400, 500], tabId });
```

**NICHT verwechseln:**
- `/screenshot` Skill = User macht Win+Shift+S (Clipboard)
- `computer(action: "screenshot")` = Agent macht selbst (autonom!)

---

## CHROME MCP HELPER FUNCTIONS

```javascript
// Wiederverwendbare Funktionen fuer alle Sub-Skills

async function verifyElementExists(query, tabId) {
  const result = await find(query, tabId);
  return result && result.length > 0;
}

async function verifyNoConsoleErrors(tabId) {
  const errors = await read_console_messages(tabId, {onlyErrors: true});
  return errors.length === 0;
}

async function verifyJWT(tabId) {
  const token = await javascript_tool("localStorage.getItem('token')", tabId);
  return token && token.startsWith('eyJ');
}

async function verifyURL(expected, tabId) {
  const current = await javascript_tool("window.location.pathname", tabId);
  return current === expected;
}

async function safeClick(query, tabId, expectAfter = null) {
  const ref = await find(query, tabId);
  if (!ref) return false;
  await computer({action: "left_click", ref, tabId});
  // Smart Wait: Wenn expectAfter gegeben, warte darauf
  if (expectAfter) {
    for (let i = 0; i < 3; i++) {
      const result = await find(expectAfter, tabId);
      if (result && result.length > 0) return true;
      await computer({action: "wait", duration: 1, tabId});
    }
  }
  return true;
}

// TAB CLEANUP nach Test-Session
async function cleanupTestTabs(tabIds) {
  // Schließe alle Test-Tabs am Ende
  // NICHT während Tests - blockiert andere Agents!
  console.log(`Cleanup: ${tabIds.length} tabs to close`);
  // MCP Tab-Gruppen werden automatisch isoliert
}
```

---

## SCHEDULING & FREQUENZ

| Trigger | Flows testen | Frequenz |
|---------|--------------|----------|
| Nach Deploy | Alle P1 | Sofort |
| Night-Burst Start | Demo + Activation | 1x/Nacht |
| Vor Outreach-Kampagne | Demo + Activation | Vor Start |
| Routine | Alle P1 | Alle 6h |
| On-Demand | Spezifisch | Bei Verdacht |

---

## MERKSATZ

> **Ein kaputter Funnel mit 1000 Leads = $0 Revenue**
> **Ein funktionierender Funnel mit 10 Leads = Moeglich $290**
>
> IMMER zuerst Funnel verifizieren, DANN Marketing!

---

## NACH JEDEM TEST: Report speichern

**WICHTIG:** Am Ende JEDES /funnel-verify Laufs muss der Report in `funnel-health-log.json` geschrieben werden!

```bash
# PowerShell: funnel-health-log.json updaten
$report = @{
  timestamp = (Get-Date -Format "o")
  status = "PASS"  # oder "FAIL" oder "PARTIAL"
  flows_tested = @("demo", "activation")
  broken_phases = @()  # oder @("activation") bei Failure
  duration_ms = 45000
}

# Zu History hinzufuegen
$logPath = "content/claude-progress/funnel-health-log.json"
$log = Get-Content $logPath | ConvertFrom-Json
$log.history = @($report) + $log.history[0..9]  # Keep last 10
$log.last_check = $report.timestamp
$log.success_rate_7d = ($log.history | Where-Object { $_.status -eq "PASS" }).Count / $log.history.Count * 100
$log | ConvertTo-Json -Depth 10 | Set-Content $logPath
```

**Bei FAILURE zusaetzlich:**
```bash
# Burst-15 Approval erstellen
$approval = @{
  type = "funnel_broken"
  severity = "critical"
  broken_phases = @("[PHASE]")
  created_at = (Get-Date -Format "o")
  created_by = "funnel-verify"
  action_required = "Fix before marketing resumes"
}
# In for-berend.md oder Burst-15 Queue schreiben
```

---

## API ENDPOINTS REFERENCE

| Endpoint | Method | Auth | Zweck |
|----------|--------|------|-------|
| `/api/admin/demos?limit=1` | GET | x-admin-key | Bestehende Demo holen |
| `/api/demo/[token]` | GET | - | Demo Page Daten |
| `/api/admin/set-user-responses` | POST | x-admin-key | Responses-Count setzen |
| `/api/admin/mark-test-user` | POST | x-admin-key | User als Test markieren |
| `/api/stats` | GET | Bearer Token | User Stats pruefen |

**Admin Key:** `rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U`

---

## TEST ACCOUNTS (Pre-Created)

> Dedizierte Test-Accounts für alle Tiers - verfälschen KEINE Metriken!

### Account Übersicht

| Tier | Email | Plan | Limit | Zweck |
|------|-------|------|-------|-------|
| Free | `funnel-test-free@test.local` | free | 20 | Limit-Tests, Free-Flows |
| Starter | `funnel-test-starter@test.local` | starter | 300 | Feature-Tests |
| Pro | `funnel-test-pro@test.local` | professional | 800 | Bulk-Tests, Pro-Features |
| Unlimited | `funnel-test-unlimited@test.local` | unlimited | 999999 | Full Access Tests |

### Passwords
Siehe `.claude/secrets.local` → `FUNNEL_TEST_*` Variablen

### Setup (einmalig via API)

```bash
# Test-Accounts erstellen (gibt Passwords zurück - EINMALIG!)
curl -X POST "https://review-responder.onrender.com/api/admin/setup-test-accounts" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -H "Content-Type: application/json"

# Response enthält Passwords - SOFORT in secrets.local speichern!
```

### Reset (vor jedem Test-Run)

```bash
# Alle Test-Accounts zurücksetzen (responses_used = 0)
curl -X POST "https://review-responder.onrender.com/api/admin/reset-test-account" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -H "Content-Type: application/json" \
  -d '{"reset_all": true}'

# Einzelnen Account zurücksetzen
curl -X POST "https://review-responder.onrender.com/api/admin/reset-test-account" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" \
  -H "Content-Type: application/json" \
  -d '{"email": "funnel-test-free@test.local"}'
```

---

## TIER-SPECIFIC TEST FLOWS

### Free Tier Tests (funnel-test-free@test.local)

```
FREE TIER CHECKLIST:

[ ] STEP 1: Login als Free User
    - navigate("/login")
    - form_input(email, "funnel-test-free@test.local")
    - form_input(password, "[from secrets.local]")
    - VERIFY: Dashboard zeigt "Free Plan"

[ ] STEP 2: Verify Limit Display
    - read_page(tabId)
    - VERIFY: "X/20 responses" sichtbar
    - VERIFY: Upgrade CTA sichtbar

[ ] STEP 3: Generate Near-Limit (API)
    - Set responses_used = 19 via API
    - Generiere Response #20
    - VERIFY: Response funktioniert

[ ] STEP 4: Limit Reached
    - Versuche Response #21
    - VERIFY: Limit Warning erscheint
    - VERIFY: Upgrade Button funktioniert
    - VERIFY: Stripe Checkout öffnet

[ ] STEP 5: Reset für nächsten Test
    - POST /api/admin/reset-test-account
```

### Starter Tier Tests (funnel-test-starter@test.local)

```
STARTER TIER CHECKLIST:

[ ] STEP 1: Login als Starter User
    - VERIFY: Dashboard zeigt "Starter Plan"
    - VERIFY: 0/300 responses

[ ] STEP 2: Verify Starter Features
    - VERIFY: Tone Options vorhanden
    - VERIFY: History Access vorhanden
    - VERIFY: KEIN Bulk Generator (Pro Feature)

[ ] STEP 3: Generate Response
    - Standard Generation Test
    - VERIFY: Counter incrementiert (1/300)
```

### Pro Tier Tests (funnel-test-pro@test.local)

```
PRO TIER CHECKLIST:

[ ] STEP 1: Login als Pro User
    - VERIFY: Dashboard zeigt "Professional Plan"
    - VERIFY: 0/800 responses

[ ] STEP 2: Verify Pro Features
    - VERIFY: Bulk Generator vorhanden
    - VERIFY: Analytics Dashboard vorhanden
    - VERIFY: Priority Support Badge

[ ] STEP 3: Bulk Generation Test
    - Navigate zu Bulk Generator
    - Input: 3 Reviews
    - VERIFY: Alle 3 Responses generiert
    - VERIFY: Counter zeigt 3/800
```

### Unlimited Tier Tests (funnel-test-unlimited@test.local)

```
UNLIMITED TIER CHECKLIST:

[ ] STEP 1: Login als Unlimited User
    - VERIFY: Dashboard zeigt "Unlimited Plan"
    - VERIFY: KEIN Limit Display

[ ] STEP 2: Verify No Limits
    - Generate 5 Responses schnell hintereinander
    - VERIFY: Keine Limit Warning
    - VERIFY: Kein Upgrade CTA

[ ] STEP 3: All Features
    - VERIFY: Alle Pro Features vorhanden
    - VERIFY: API Access (wenn implementiert)
```

---

## ADMIN ACCESS

### Admin Key
```
x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U
```

### Admin Endpoints für Testing

| Endpoint | Method | Zweck |
|----------|--------|-------|
| `/api/admin/setup-test-accounts` | POST | Test-Accounts erstellen |
| `/api/admin/reset-test-account` | POST | Responses zurücksetzen |
| `/api/admin/set-user-responses` | POST | Responses-Count manuell setzen |
| `/api/admin/mark-test-user` | POST | User als Test markieren |
| `/api/admin/stats?exclude_test=true` | GET | Echte Metriken (ohne Test) |

### Admin Stats Check (nach Tests)

```bash
# Verify Test-Accounts werden excluded
curl "https://review-responder.onrender.com/api/admin/stats" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

curl "https://review-responder.onrender.com/api/admin/stats?exclude_test=true" \
  -H "x-admin-key: rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

# Differenz = Anzahl Test-Accounts (sollte 4 sein)
```

---

## DATA SAFETY RULES

### NIEMALS:
- Neue User mit echten Email-Domains erstellen (nur @test.local!)
- Responses generieren die echte Metriken verfälschen
- Demo-Flows mit nicht-@test.local Emails testen
- Test-Accounts ohne `is_test_account=true` nutzen

### IMMER:
- Bestehende funnel-test-* Accounts nutzen (NICHT neue erstellen!)
- Test-Emails MÜSSEN `@test.local` oder `@funnel-test.local` Domain haben
- Nach JEDEM Test-Run: Verify mit `?exclude_test=true`
- Vor Metriken-Report: Test-Accounts excluded prüfen

### Email Domain Pattern

```
✅ SAFE:
- funnel-test-free@test.local
- funnel-test-[timestamp]@test.local
- demo-test-123@funnel-test.local

❌ UNSAFE:
- test@gmail.com
- funnel.test@web.de
- anything@real-domain.com
```

### Automatic Test Detection

Diese Patterns werden automatisch als Test erkannt:
- `%@test.%` (alle @test.* Domains)
- `%@test.local`
- `is_test_account = true` in DB

### Cleanup Protocol (nach Test-Session)

```bash
# 1. Reset alle Test-Accounts
curl -X POST "/api/admin/reset-test-account" \
  -H "x-admin-key: ..." \
  -d '{"reset_all": true}'

# 2. Verify Metriken clean
curl "/api/admin/stats?exclude_test=true" -H "x-admin-key: ..."

# 3. Funnel Health Log updaten
# (automatisch via /funnel-verify Report)
```

---

## 🧹 TAB CLEANUP (PARALLELE AGENTS!)

> **MCP Tab-Gruppen sind isoliert** - jeder Agent hat seine eigenen Tabs.
> Aber: Zu viele offene Tabs belasten Chrome trotzdem!

### Automatisches Cleanup am Session-Ende

```bash
# Stop-Hook ruft automatisch:
powershell -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action cleanup
```

### Manuelles Cleanup während Session

```javascript
// Tabs schließen die nicht mehr gebraucht werden:
// 1. Tab-Context holen
const ctx = await tabs_context_mcp({});

// 2. Nicht-benötigte Tabs identifizieren
// (Tab-IDs merken die während Tests erstellt wurden)

// 3. Am ENDE der Test-Session schließen
// NICHT während Tests - andere Agents könnten die Tabs nutzen!
```

### Best Practice für Parallele Agents

| Phase | Tab-Verhalten |
|-------|---------------|
| **Start** | `tabs_create_mcp()` für neuen Tab |
| **Während Tests** | Tab wiederverwenden, NICHT schließen |
| **Ende** | Via Stop-Hook oder manuell cleanup |

### Chrome-Entlastung: Alternativen nutzen!

Bevor Chrome MCP für alles genutzt wird:

| Task | Chrome MCP | Bessere Alternative |
|------|------------|---------------------|
| API Health Check | ❌ Tab öffnen | ✅ `curl` oder `fetch` MCP |
| DB Check | ❌ Dashboard | ✅ `postgres` MCP |
| Email Check | ❌ Gmail Tab | ✅ `gmail` MCP |

**Nur Chrome MCP wenn:**
- Visuelles Testen (UI Flow)
- Login mit 2FA/Captcha
- User soll was sehen

---

*Version: 3.1 - Mit Performance Rules & Tab Cleanup für parallele Agents*
*Updated: 17.01.2026*
