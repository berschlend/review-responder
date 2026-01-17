# /funnel-verify - E2E Funnel Test mit Chrome MCP

> Automatischer Test des kompletten Sales-Funnels.
> Findet Bugs bevor sie 100+ Leads betreffen.
> **97% Demo-Email Bug waere damit in <24h gefunden worden!**

---

## QUICK START

```bash
# Voraussetzung: claude --chrome
/funnel-verify              # Alle Phasen
/funnel-verify demo         # Nur Demo-Phase
/funnel-verify activation   # Nur Activation-Phase
/funnel-verify limit        # Nur Limit-Test
```

---

## REQUIREMENTS

- **Chrome MCP aktiv:** `claude --chrome`
- **Backend online:** Render wach
- **Admin Header:** Fuer Test-Cleanup

---

## PHASE 0: SETUP

```
SETUP TASKS:

1. [ ] Chrome MCP Session initialisieren
   - tabs_context_mcp(createIfEmpty: true)
   - tabs_create_mcp()
   - Merke tabId fuer alle folgenden Schritte

2. [ ] Test-Email generieren (unique!)
   - Format: funnel-test-[TIMESTAMP]@test.local
   - Beispiel: funnel-test-1737162000@test.local

3. [ ] Test-Demo via API erstellen
   POST /api/demo/generate
   {
     "businessName": "Test Restaurant Berlin",
     "city": "Berlin",
     "focus": "mixed"
   }
   -> Merke demo_token

4. [ ] Test-Daten dokumentieren:
   {
     "test_email": "[EMAIL]",
     "demo_token": "[TOKEN]",
     "tab_id": [TAB_ID],
     "start_time": "[ISO]"
   }
```

---

## PHASE 1: DEMO PAGE TEST

> Testet ob Demo-Page korrekt funktioniert

```
DEMO PAGE TESTS:

1. [ ] Navigiere zu Demo-URL
   navigate(`https://tryreviewresponder.com/demo/${testToken}`, tabId)
   computer(action: "wait", duration: 3, tabId)

2. [ ] Screenshot fuer Dokumentation
   computer(action: "screenshot", tabId)

3. [ ] Responses werden angezeigt (mind. 3)
   read_page(tabId, depth: 10)
   -> Erwarte: ResponseCard Elements sichtbar
   -> FAIL wenn: "No responses" oder <3 Cards

4. [ ] Email-Gate blockiert volle Ansicht
   find("unlock" OR "enter email", tabId)
   -> Erwarte: Email-Input-Feld sichtbar
   -> Erwarte: Responses geblurred oder limited

5. [ ] Copy-Button vor Email-Eingabe
   find("copy", tabId)
   -> Erwarte: Button disabled ODER
   -> Erwarte: Triggert Email-Gate
```

**SUCCESS CRITERIA:**
- [ ] Page laedt ohne Fehler
- [ ] 3+ Responses sichtbar (ggf. geblurred)
- [ ] Email-Gate funktioniert
- [ ] Keine Console Errors

---

## PHASE 2: EMAIL CAPTURE TEST

> Testet Auto-Account Creation und Login

```
EMAIL CAPTURE TESTS:

1. [ ] Email-Input finden
   find("email input", tabId)
   -> ref_id merken

2. [ ] Test-Email eingeben
   form_input(ref, testEmail, tabId)

3. [ ] Submit Button klicken
   find("unlock" OR "get access" OR "continue", tabId)
   computer(action: "left_click", ref, tabId)
   computer(action: "wait", duration: 3, tabId)

4. [ ] Auto-Account Check
   javascript_tool("localStorage.getItem('token')", tabId)
   -> Erwarte: JWT Token vorhanden
   -> FAIL wenn: null oder undefined

5. [ ] User ist eingeloggt
   javascript_tool("localStorage.getItem('user')", tabId)
   -> Erwarte: User-Objekt mit email

6. [ ] Alle Responses jetzt sichtbar
   read_page(tabId)
   -> Erwarte: Blur entfernt
   -> Erwarte: Copy-Button aktiv

7. [ ] Copy-Button funktioniert
   find("copy", tabId)
   computer(action: "left_click", ref, tabId)
   -> Erwarte: Copied! Feedback oder Clipboard filled
```

**SUCCESS CRITERIA:**
- [ ] Email-Eingabe funktioniert
- [ ] Auto-Account wird erstellt
- [ ] JWT Token im LocalStorage
- [ ] Responses werden freigeschaltet
- [ ] Copy-Button funktioniert

---

## PHASE 3: ACTIVATION TEST

> Testet ob User zur Response-Generierung kommt

```
ACTIVATION TESTS:

1. [ ] CTA Button finden
   find("Start generating" OR "try it" OR "get started", tabId)
   computer(action: "left_click", ref, tabId)
   computer(action: "wait", duration: 3, tabId)

2. [ ] URL Check - KRITISCH!
   javascript_tool("window.location.pathname", tabId)
   -> Erwarte: "/generator" (NICHT "/dashboard"!)
   -> FAIL wenn: "/dashboard" oder "/register"

3. [ ] Generator Page laedt
   read_page(tabId)
   -> Erwarte: Business Name Input
   -> Erwarte: Generate Button

4. [ ] Business-Info eingeben
   find("business name" OR "restaurant name", tabId)
   form_input(ref, "Test Restaurant Berlin", tabId)

   find("review" OR "paste review", tabId)
   form_input(ref, "The food was okay but service was slow.", tabId)

5. [ ] Response generieren
   find("generate", tabId)
   computer(action: "left_click", ref, tabId)
   computer(action: "wait", duration: 8, tabId)

6. [ ] Response angezeigt
   read_page(tabId)
   -> Erwarte: AI Response Text sichtbar
   -> Erwarte: Copy Button
   -> FAIL wenn: Error Message oder Loading stuck

7. [ ] Console Check
   read_console_messages(tabId, onlyErrors: true)
   -> Erwarte: Keine Errors
```

**SUCCESS CRITERIA:**
- [ ] CTA fuehrt zu /generator (NICHT /dashboard!)
- [ ] Generator Page funktioniert
- [ ] Response wird generiert
- [ ] Response ist kopierfaehig
- [ ] Keine Console Errors

---

## PHASE 4: LIMIT TEST

> Testet Upgrade-Flow bei Limit-Erreichen

```
LIMIT TESTS:

1. [ ] User-Limits via API pruefen
   curl -s "https://review-responder.onrender.com/api/stats" \
     -H "Authorization: Bearer [TEST_USER_TOKEN]"
   -> Check: responses_used, limit

2. [ ] Limits via API simulieren (Admin)
   # Setze User auf 19/20 Responses
   curl -X POST "https://review-responder.onrender.com/api/admin/set-user-responses" \
     -H "x-admin-key: [ADMIN_KEY]" \
     -d '{"email":"[TEST_EMAIL]","responses_used":19}'

3. [ ] Noch eine Response generieren
   -> Jetzt bei 20/20

4. [ ] Limit-Warning Check
   read_page(tabId)
   -> Erwarte: "Limit reached" oder "Upgrade" Message
   -> Erwarte: Upgrade Button sichtbar

5. [ ] Upgrade-Button klicken
   find("upgrade" OR "get more", tabId)
   computer(action: "left_click", ref, tabId)
   computer(action: "wait", duration: 3, tabId)

6. [ ] Stripe Checkout Check
   javascript_tool("window.location.href", tabId)
   -> Erwarte: checkout.stripe.com ODER
   -> Erwarte: /pricing Page
```

**SUCCESS CRITERIA:**
- [ ] Limit-Warning erscheint bei 20/20
- [ ] Upgrade-Button sichtbar
- [ ] Stripe Checkout laedt

---

## PHASE 5: CLEANUP & REPORT

```
CLEANUP:

1. [ ] Test-User archivieren (nicht loeschen!)
   # Markiere als Test-Account
   curl -X POST "https://review-responder.onrender.com/api/admin/mark-test-user" \
     -H "x-admin-key: [ADMIN_KEY]" \
     -d '{"email":"[TEST_EMAIL]"}'

2. [ ] Tab schliessen
   # Optional - Chrome cleanup

3. [ ] JSON Report generieren
```

---

## JSON REPORT FORMAT

```json
{
  "timestamp": "[ISO]",
  "overall_status": "PASS" | "FAIL" | "PARTIAL",
  "duration_total_ms": [N],
  "phases": {
    "setup": {
      "status": "PASS",
      "duration_ms": 1200,
      "details": {
        "demo_token": "[TOKEN]",
        "test_email": "[EMAIL]"
      }
    },
    "demo_page": {
      "status": "PASS",
      "duration_ms": 3500,
      "checks": {
        "page_loads": true,
        "responses_visible": true,
        "email_gate_works": true,
        "console_clean": true
      }
    },
    "email_capture": {
      "status": "FAIL",
      "duration_ms": 2100,
      "error": "Auto-account not created - no JWT in localStorage",
      "checks": {
        "email_input_works": true,
        "auto_account_created": false,
        "jwt_present": false,
        "responses_unlocked": false
      }
    },
    "activation": {
      "status": "SKIPPED",
      "reason": "Previous phase failed"
    },
    "limit_test": {
      "status": "SKIPPED",
      "reason": "Previous phase failed"
    },
    "cleanup": {
      "status": "PASS"
    }
  },
  "broken_phases": ["email_capture"],
  "console_errors": [],
  "test_data": {
    "test_email": "funnel-test-1737162000@test.local",
    "demo_token": "demo_test_abc123",
    "user_id": null,
    "responses_generated": 0
  },
  "recommendations": [
    "Fix auto-account creation endpoint",
    "Check /api/auth/auto-create-demo-user logs"
  ]
}
```

---

## NIGHT-AGENT INTEGRATION

### Automatischer Check (alle 6h)

Night-Agents (besonders Burst-2, 4, 5) sollen VOR Marketing-Aktionen pruefen:

```bash
# In Night-Burst Session:
# 1. Letzte Funnel-Verify Ergebnis checken
powershell -File scripts/agent-helpers.ps1 -Action funnel-status

# Output Beispiel:
# {
#   "last_check": "2026-01-18T01:00:00Z",
#   "status": "PASS",
#   "hours_ago": 3
# }

# 2. Wenn >6h alt ODER status != PASS:
#    -> Fuehre /funnel-verify aus
#    -> Bei FAIL: STOPPE alle Outreach!
```

### Bei FAIL - Burst-15 Approval erstellen

```json
{
  "type": "funnel_broken",
  "severity": "critical",
  "broken_phases": ["email_capture"],
  "action_blocked": "All outreach paused until funnel fixed",
  "recommended_fix": "Check /api/auth/auto-create-demo-user",
  "created_by": "funnel-verify"
}
```

---

## FAILURE HANDLING

### Phase Failure -> Skip Dependent Phases

```
IF Phase 1 (Demo Page) FAILS:
  -> Skip Phase 2, 3, 4
  -> Report: "Demo Page broken - funnel unusable"

IF Phase 2 (Email Capture) FAILS:
  -> Skip Phase 3, 4
  -> Report: "Auto-account broken - users can't activate"

IF Phase 3 (Activation) FAILS:
  -> Skip Phase 4
  -> Report: "Generator broken - users can't create responses"
```

### Common Failures & Fixes

| Failure | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Demo Page 404 | Token invalid | Regenerate Demo |
| No JWT after email | Auto-account endpoint broken | Check server.js /auth/auto-create-demo-user |
| Redirect to /dashboard | CTA Link wrong | Fix Demo Page CTA |
| Generator error | API key issue | Check OpenAI/Claude keys |
| Stripe not loading | Stripe key issue | Check STRIPE_PUBLIC_KEY |

---

## MANUAL OVERRIDE

Falls Chrome MCP nicht verfuegbar:

```bash
# API-Only Test (weniger komplett, aber schnell)
/funnel-verify --api-only

# Das testet:
# - Demo Generation API
# - Auto-Account API
# - Response Generation API
# - Stats API

# Das testet NICHT:
# - UI/UX
# - JavaScript Errors
# - Copy-Button
# - Stripe Checkout
```

---

## SCHEDULING

### Empfohlene Frequenz

| Trigger | Frequenz |
|---------|----------|
| Nach Deploy | IMMER |
| Night-Burst Start | 1x pro Nacht |
| Vor grossen Outreach-Kampagnen | 1x |
| Nach Backend-Updates | IMMER |
| Routine | Alle 6 Stunden |

### Cron-Job Setup (Optional)

```
# In cron-job.org:
# URL: https://review-responder.onrender.com/api/cron/funnel-health
# Interval: Every 6 hours
# Response wird in funnel-health-log.json gespeichert
```

---

## QUICK REFERENCE

### Chrome MCP Commands Used

| Tool | Purpose |
|------|---------|
| `tabs_context_mcp` | Session starten |
| `tabs_create_mcp` | Neuen Tab erstellen |
| `navigate` | URL oeffnen |
| `read_page` | DOM lesen |
| `find` | Element suchen |
| `form_input` | Input ausfuellen |
| `computer` | Click, Wait, Screenshot |
| `javascript_tool` | LocalStorage, URL check |
| `read_console_messages` | Error Check |

### Success Rate Tracking

Nach jedem /funnel-verify wird gespeichert:

```json
// content/claude-progress/funnel-health-log.json
{
  "history": [
    {
      "timestamp": "2026-01-18T01:00:00Z",
      "status": "PASS",
      "duration_ms": 45000
    },
    {
      "timestamp": "2026-01-17T19:00:00Z",
      "status": "FAIL",
      "broken_phases": ["email_capture"]
    }
  ],
  "success_rate_7d": 85,
  "last_failure": "2026-01-17T19:00:00Z",
  "mtbf_hours": 12
}
```

---

*Erstellt: 18.01.2026*
*Grund: 97% Demo-Email Bug haette damit verhindert werden koennen*
