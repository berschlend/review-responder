# ReviewResponder - Claude Code Memory

> **LIES MICH ZUERST!** Zentrales Gedächtnis für alle Claude Sessions.

---

## QUICK START

**Rolle:** Autonomer Entwickler für ReviewResponder - SaaS für KI-Review-Antworten.
**Ziel:** $1000/Monat durch ~30 zahlende Kunden.

### Regeln
1. Immer testen vor Push
2. Immer committen & pushen nach fertiger Änderung
3. CLAUDE.md updaten nach jeder Session
4. User nur fragen wenn nötig

### Workflow
```
1. CLAUDE.md lesen → 2. Task wählen → 3. Erledigen → 4. Testen → 5. Git push → 6. CLAUDE.md updaten
```

---

## LIVE URLS

| Service | URL |
|---------|-----|
| **Frontend** | https://tryreviewresponder.com |
| **Backend API** | https://review-responder.onrender.com |
| **GitHub** | https://github.com/berschlend/review-responder |
| **Outreach Dashboard** | https://review-responder.onrender.com/api/outreach/dashboard?key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U |

### Admin Plan-Wechsel (berend.mainz@web.de)
```
FREE:   /api/admin/set-plan?email=berend.mainz@web.de&plan=free&key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U
STARTER/PROFESSIONAL/UNLIMITED: ...&plan=starter/professional/unlimited&key=...
```

---

## CURRENT TASKS

**Stand: 10.01.2026**

### USER MUSS MACHEN:
- [ ] Demo-Video aufnehmen (2 Min Walkthrough)

### NÄCHSTE CLAUDE TASKS:

| Task | Schwierigkeit | Dateien |
|------|---------------|---------|
| Chrome Web Store Einreichung | Leicht | ZIP fertig |
| Tone Preview (Beispiel-Snippets) | Leicht | `chrome-extension/content.js` |


### HEUTE ERLEDIGT (10.01.2026):
- [x] **Response History für Free freigeschaltet** - History Tab jetzt für alle User sichtbar
- [x] **CSV/PDF Export für Starter+ freigeschaltet** - War nur Pro+, jetzt auch Starter
  - Free-User sehen Upgrade-Prompt beim Export-Versuch
  - Feature Table auf Pricing Page aktualisiert
- [x] **Konsistenz-Check Frontend** - 6x "5 free responses" zu "20 free responses" korrigiert
- [x] **CLAUDE.md Cleanup** - Nicht-implementierte Features entfernt (Achievements/Streaks, Multi-Account UI)
- [x] **Email Case-Insensitive Fix** - 7 Stellen gefixt wo Email-Vergleiche case-sensitive waren
  - Jetzt: `test@email.com` = `TEST@EMAIL.COM` bei Login, Register, Google OAuth, Team Invite, etc.
- [x] **Email-Verifizierung mit Banner (Optional)** - Non-blocking Email-Verification
  - Bei Registration wird Verification-Email gesendet
  - Gelber Banner im Dashboard wenn nicht verifiziert
  - Resend-Button sendet neue Verification-Email
  - `/verify-email?token=xxx` Route für Verification-Links
  - User kann App trotzdem sofort nutzen (kein Blocker!)
  - Endpoints: `GET /api/auth/verify-email`, `POST /api/auth/resend-verification`
- [x] **Big Tony Security Audit + Fixes (Security Rating: B+ → A-)**
  - Big Tony Agent erstellt und in CLAUDE.md dokumentiert
  - Comprehensive Security Audit durchgeführt (6382 Zeilen Code analysiert)
  - **Critical Fixed:** JWT_SECRET validation bei startup hinzugefügt
  - **High Priority Fixed (6 Issues):**
    - Input length validation: reviewText max 5000 chars (DoS Prevention)
    - Input length validation: customInstructions max 1000 chars
    - Individual review length validation in bulk endpoint
    - Rate limiting von 500 auf 100 per 15 min reduziert
    - Auth endpoints: Separate rate limiting (10 per 15 min) gegen Brute Force
    - Password reset throttling: 1 request per 5 Minuten per User
  - **14 Good Security Practices** identifiziert (SQL Injection Prevention, bcrypt, etc.)
  - Alle Fixes committed & deployed
- [x] **DECISION MAKING Section** in CLAUDE.md hinzugefügt
  - AskUserQuestionTool Guidelines dokumentiert
  - Berend's Preferences für Auth, Payments, UI, Code Quality
  - Beispiele für gute vs. schlechte Fragen
- [x] **DEVELOPER_GUIDE.md erstellt** - Anti-Vibe-Coder Handbuch
  - .env, npm, package.json, git workflows erklärt
  - Security Checklist & Troubleshooting
  - Project Structure & Common Commands

### BEKANNTE BUGS:
Keine offenen Bugs.

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render Static Site) |
| Backend | Node.js/Express (Render) |
| Datenbank | PostgreSQL (Render) |
| Payments | Stripe (Live) |
| AI | OpenAI GPT-4o-mini + Claude Sonnet (Hybrid) |
| Email | Resend.com |
url namecheap
email weiterleiten imporvmx
cold mails cronjob

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App (src/App.js, src/App.css)
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing (outreach/, product-hunt/, social/)
├── scripts/           # Automation Scripts
└── CLAUDE.md
Todo.md
```

---

## API ENDPOINTS (Wichtigste)

### Auth
- `POST /api/auth/register|login|forgot-password|reset-password|google`
- `PUT /api/auth/change-password` | `POST /api/auth/change-email-request|confirm-email-change`
- `DELETE /api/auth/delete-account`

### Core
- `POST /api/generate` - Single Response
- `POST /api/generate-bulk` - Bis zu 20 Reviews
- `POST /api/generate-variations` - 3 Varianten
- `GET /api/stats` | `GET /api/responses/history`

### Templates & Analytics
- `GET|POST|PUT|DELETE /api/templates/:id`
- `GET /api/analytics` (Pro/Unlimited)

### Teams (Pro/Unlimited)
- `GET|POST /api/team` | `POST /api/team/invite|accept`
- `PUT /api/team/:memberId/role` | `DELETE /api/team/:memberId`

### API Keys (Unlimited)
- `GET|POST|PUT|DELETE /api/keys/:id`
- `POST /api/v1/generate` (Public API mit X-API-Key)

### Affiliate
- `POST /api/affiliate/apply` | `GET /api/affiliate/stats|payouts`
- `GET /api/affiliate/track/:code` (Click tracking)

### Admin
- `GET /api/admin/stats|affiliates` | `PUT /api/admin/affiliates/:id/status`
- `GET /api/admin/set-plan?email=X&plan=X&key=X`

### Billing
- `POST /api/billing/create-checkout|portal`
- `POST /api/webhooks/stripe`

---

## PLAN LIMITS (Hybrid AI)

| Plan | Smart (Claude) | Standard (GPT-4o) | Total | Team |
|------|----------------|-------------------|-------|------|
| Free | 3 | 17 | 20 | - |
| Starter ($29) | 100 | 200 | 300 | - |
| Pro ($49) | 300 | 500 | 800 | 3 |
| Unlimited ($99) | ∞ | ∞ | ∞ | 10 |

---

## STRIPE CONFIG (Live)

### Monthly
- Starter: `price_1Sni0hQfYocZQHxZ7oxDbiVo`
- Pro: `price_1Sni18QfYocZQHxZuboFA6Wc`
- Unlimited: `price_1Sni1NQfYocZQHxZTq8KNLv8`

### Yearly (20% off)
- Starter: `price_1SnkL2QfYocZQHxZPvaX6mru`
- Pro: `prod_TlEUSJsa7ULdZj`
- Unlimited: `price_1SnkObQfYocZQHxZ5zNYTN3f`

---

## ENV VARIABLES (Render Backend)

```
DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID, STRIPE_UNLIMITED_PRICE_ID
RESEND_API_KEY, GOOGLE_CLIENT_ID
FRONTEND_URL=https://review-responder-frontend.onrender.com
NODE_ENV=production
```

---

## GIT WORKFLOW

```bash
git add -A && git commit -m "Beschreibung" && git push
# Render deployed automatisch!
```

---

## COMPLETED FEATURES

### Core
- User Auth (Email/Password + Google OAuth)
- AI Response Generation (4 Tones, 50+ Sprachen)
- Hybrid AI (Smart=Claude, Standard=GPT-4o)
- Response History, Templates, Bulk Generation

### Premium Features
- Analytics Dashboard (Pro/Unlimited)
- Team/Multi-User Accounts (Pro: 3, Unlimited: 10)
- API Key System (Unlimited only)
- SEO Blog Generator (Pro/Unlimited)

### Monetization
- Stripe Payments (Monthly + Yearly 20% off)
- Referral System (1 Month Free)
- Affiliate Program (20% recurring)
- Discount Codes: EARLY50 (50%), SAVE20 (20%), HUNTLAUNCH (60%)

### Chrome Extension v1.4.1
- Google Maps Integration
- Templates & Drafts (Auto-Save)
- AI Tone Recommendation
- Quality Score & Variations
- 50+ Industry Templates

### Marketing Systems
- Automated Outreach (Google Places → Hunter.io → Cold Emails)
- LinkedIn Outreach Templates
- Cold Email Sequences (Restaurant/Hotel/Local)
- Product Hunt Launch Ready
- Google Ads Landing Pages (5 Seiten)
- Exit-Intent Popup

### Admin
- Admin Panel (/admin)
- Profile Page (/profile)
- Mobile Responsive Design

---

## MARKETING AUTOMATION BACKLOG

| System | Beschreibung | Priority |
|--------|--------------|----------|
| Reddit/Quora Auto-Responder | Keywords monitoren, hilfreiche Antworten | High |
| Twitter/X Engagement | Tweet-Search, Auto-Replies | High |
| SEO Auto-Pilot | 5 Artikel/Woche auto-generieren | High |
| Competitor Scraper | Unzufriedene Birdeye/Podium Kunden | Medium |

---

## PRODUCT HUNT LAUNCH

Am Launch-Tag in `frontend/src/App.js`:
```javascript
const PRODUCT_HUNT_CONFIG = {
  isLaunched: true,
  launchEndTime: new Date('2025-XX-XXTXX:XX:XX-08:00'),
  productHuntUrl: 'https://www.producthunt.com/posts/reviewresponder',
};
```

---

## SCREENSHOT TOOL

1. `Win + Shift + S` → Screenshot machen
2. User sagt "hab" oder "screenshot"
3. Claude: `powershell -ExecutionPolicy Bypass -File "C:\Users\Berend Mainz\clipboard-screenshot.ps1"`
4. Read tool für Bild

---

## BIG TONY (Code Review & Security Agent)

**Nickname:** "Big Tony"
**Spezialisierung:** Code Reviews, Security Audits, Vulnerability Detection

### Wann Big Tony rufen?
- Code Review vor wichtigen Commits
- Security Audit (SQL Injection, XSS, Command Injection, OWASP Top 10)
- Dependency/Package Vulnerability Checks
- Authentication/Authorization Logic prüfen
- API Endpoint Security
- Input Validation & Sanitization

### Wie aufrufen?
Einfach sagen: **"Big Tony"** oder **"Code Review"** oder **"Security Check"**

→ Claude startet automatisch einen spezialisierten Agent mit Fokus auf:
- Security Best Practices
- Code Quality & Patterns
- Performance Issues
- Error Handling
- Input Validation
- Authentication Flows

### Beispiel-Trigger:
```
"Big Tony, check backend/server.js für Security Issues"
"Big Tony, review die neue Auth-Logik"
"Security Check für /api/generate endpoint"
```

---

## DECISION MAKING (AskUserQuestionTool)

**Prinzip:** Bei Unsicherheit IMMER fragen statt raten!

### Wann fragen?

✅ **IMMER fragen bei:**
- Feature hat 2+ valide Implementierungen
- Security vs. UX Trade-offs
- Business Logic unklar (Pricing, Limits, Workflows)
- Unklare User Expectations
- Breaking Changes oder API-Änderungen

❌ **NICHT fragen bei:**
- Offensichtlichen Bugs (einfach fixen)
- Code Style / Formatting
- Standard Best Practices (z.B. Input Validation)
- Klare Anforderungen aus CLAUDE.md

### Berend's Preferences

**Auth & Security:**
- Lieber non-blocking (Banner statt Blocker)
- Paranoid bei Input Validation (immer validieren)
- Rate Limiting: Ja, aber user-friendly Error Messages

**Payments:**
- Stripe only (keine PayPal/Crypto)
- Monthly + Yearly Billing (20% Yearly Discount)
- Upgrades: Sofort aktiv, Downgrades: Ende Billing Period

**UI/UX:**
- Mobile-first Design
- Minimal, clean Interface
- Dark Mode Support
- Loading States & Error Messages klar kommunizieren

**Errors & Logging:**
- User: Friendly Messages (deutsch für DE users)
- Logs: Detailliert, JSON Format
- Keine Secrets in Logs

**Code Quality:**
- Pragmatisch > Perfekt
- Lieber shipped als over-engineered
- Tests für kritische Flows (Auth, Payments)

### Beispiele

**❌ SCHLECHT (Raten):**
```
"Ich baue jetzt Email-Verification als Login-Blocker"
→ User wollte vielleicht optional Banner!
```

**✅ GUT (Fragen):**
```
"Email-Verification:
  A) Blocking (User muss verifizieren vor Login)
  B) Optional (Banner im Dashboard, non-blocking)
  C) Gar nicht
→ User wählt B → Perfekte Implementation
```

**❌ SCHLECHT (Raten):**
```
"Ich setze Rate Limit auf 100 requests/hour"
→ User wollte vielleicht pro Tag oder Monat!
```

**✅ GUT (Fragen):**
```
"Rate Limiting für /api/generate:
  - Pro User (800/month): Daily limit oder Monthly only?
  - Response bei Limit: 429 Error oder Upgrade Prompt?
→ User gibt klare Antwort → Exakte Implementation
```

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten, Datum ändern!
