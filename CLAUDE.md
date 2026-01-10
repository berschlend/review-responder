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

### Claude Code Setup
📂 **Erweiterte Dokumentation:** `.claude/README.md`
- **Hooks:** `.claude/hooks/README.md` (Auto-Branch-Protection, Test-Reminders, Command-Logging)
- **GitHub Workflow:** `.claude/github-workflow.md` (PR/Issue Management, Git Best Practices)
- **MCP Servers:** `.claude/mcp-servers.md` (Optional für externe Tools)

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
├── .claude/           # Claude Code Config (hooks, settings)
├── CLAUDE.md          # Projekt-Gedächtnis
└── Todo.md            # Task Tracking
```

---

## DEVELOPMENT GUIDELINES

### Code Style
- **JavaScript/React**: ES6+ syntax, destructuring, arrow functions
- **Async**: Prefer async/await over promises chains
- **Error Handling**: Try-catch blocks for async operations, proper HTTP status codes
- **Naming**: camelCase für Variablen/Funktionen, PascalCase für React Components
- **Comments**: Nur wenn Logic nicht selbsterklärend ist
- **Security**: NIEMALS Secrets committen, immer Input validieren (SQL Injection, XSS Prevention)

### Testing Requirements
- **Backend**: Teste alle neuen API Endpoints vor Push
  ```bash
  # Local Backend testen:
  cd backend && node server.js
  # Test mit curl oder Postman
  ```
- **Frontend**: Check Console Errors, teste User Flow manuell
  ```bash
  # Local Frontend testen:
  cd frontend && npm start
  ```
- **Chrome Extension**: Teste in chrome://extensions nach jeder Änderung

### Git Conventions
- **Commit Messages**: Beschreibend, prägnant (z.B. "Fix email case-sensitivity in login")
- **Commit Häufigkeit**: Nach jedem completed Feature/Fix
- **Branch**: Arbeite auf `claude/learn-claude-code-eKiGe` Branch
- **Push**: Immer nach erfolgreichem Test mit `git push -u origin claude/learn-claude-code-eKiGe`
- **NIEMALS**: Force push auf main/master

### Development Commands
```bash
# Backend lokal starten (Port 5000)
cd backend && node server.js

# Frontend lokal starten (Port 3000)
cd frontend && npm start

# Chrome Extension reload
# chrome://extensions → Developer Mode → Reload

# Git Status checken
git status

# Schnelles Commit & Push
git add -A && git commit -m "Beschreibung" && git push -u origin claude/learn-claude-code-eKiGe
```

### Preferred Patterns
- **Small Diffs**: Lieber mehrere kleine Commits als ein riesiger
- **Read before Edit**: IMMER Datei lesen vor Änderungen
- **No Over-Engineering**: Nur ändern was nötig ist, keine "improvements" ohne Request
- **No Premature Abstraction**: Kein Helper-Code für einmalige Operations
- **Backwards Compatibility**: Keine unnötigen Renames/Re-exports, einfach löschen wenn unused

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

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten, Datum ändern!
