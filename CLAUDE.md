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

## BORIS CHERNY WORKFLOW (Creator of Claude Code)

### Custom Slash Commands
Nutze diese Commands für maximale Effizienz:
- `/test-and-push` - Tests → Manual Check → Git Push (mit Retry)
- `/feature` - Research → Plan → Code → Test → PR (Boris Method)
- `/bug-fix` - Reproduce → Diagnose → Plan → Fix → Verify → Push
- `/update-claude-md` - CLAUDE.md nach Session updaten

### Die 8 Schritte (Boris Style):
1. **CLAUDE.md nutzen** - Zentrale Wahrheit, Team fügt Learnings hinzu
2. **Plan Mode ZUERST** (Shift+Tab 2x) - Erst planen, dann coden!
3. **Slash Commands** - Für jeden "inner loop" Workflow
4. **Research → Plan → Code → Test → PR** - Nie direkt coden
5. **Parallel arbeiten** - 5+ Claude instances (Tabs/Windows)
   - User arbeitet mit mehreren Claude Tabs parallel
   - System Notifications bei Input needed
   - Jeder Tab für eigenen Workflow
6. **Opus 4.5 für alles** - Beste Qualität > Geschwindigkeit
7. **Testing VOR Push** - Chrome Extension testen, iterieren
8. **Auto-Accept nach Plan** - Plan perfektionieren, dann One-Shot

### Wichtig:
- Research OHNE Code first
- Plan reviewen & verfeinern
- Dann Auto-Accept Mode
- Claude "one-shots" die Umsetzung

---

## RALPH LOOP (Autonome Overnight Development)

**Was:** Claude Code Plugin für iterative, selbstverbessernde Entwicklungs-Loops.
**Installiert:** 11.01.2026

### Wie es funktioniert
```
User: /ralph-loop "Task" --max-iterations 30 --completion-promise "DONE"
     ↓
Claude arbeitet → Will beenden → Stop Hook blockiert
     ↓
Claude sieht eigene Änderungen (Files + Git) → Verbessert iterativ
     ↓
Wiederholt bis <promise>DONE</promise> oder max-iterations erreicht
```

### Commands
- `/ralph-loop "<prompt>" --max-iterations N --completion-promise "TEXT"` - Loop starten
- `/cancel-ralph` - Loop abbrechen

### Beispiele für ReviewResponder

**Feature Development (overnight):**
```bash
/ralph-loop "Implement sentiment analysis:
- POST /api/analyze-sentiment endpoint
- Returns positive/negative/neutral score
- Tests with >80% coverage
Output <promise>DONE</promise> when complete" --max-iterations 30 --completion-promise "DONE"
```

**Test Coverage erhöhen:**
```bash
/ralph-loop "Write tests for all backend endpoints:
- Cover edge cases
- Target: 80% coverage
Output <promise>TESTS DONE</promise>" --max-iterations 40 --completion-promise "TESTS DONE"
```

### Best Practices
1. **Immer `--max-iterations` setzen** (10-50 je nach Komplexität)
2. **Klare Completion Criteria** mit `<promise>TEXT</promise>`
3. **Git Branch vor Start** für einfaches Rollback
4. **TDD Approach:** Tests first → Implement → Iterate

### Kosten-Erwartung
- Einfache Features: ~$5-20
- Komplexe Features: ~$50-100
- Große Projekte: ~$200-300

---

## LIVE URLS

| Service | URL |
|---------|-----|
| **Frontend** | https://tryreviewresponder.com |
| **Backend API** | https://review-responder.onrender.com |
| **GitHub** | https://github.com/berschlend/review-responder |
| **Outreach Dashboard** | Siehe `.claude/secrets.local` |

### Admin URLs & Secrets
**WICHTIG:** Admin-URLs mit Secrets sind in `.claude/secrets.local` gespeichert (lokal, nicht auf GitHub).
Claude kann diese Datei lesen wenn Admin-Zugriff benötigt wird.

### Service Dashboards

| Service | URL | Zweck |
|---------|-----|-------|
| **Namecheap DNS** | https://ap.www.namecheap.com/Domains/DomainControlPanel/tryreviewresponder.com/advancedns | DNS Records verwalten |
| **Render Backend** | https://dashboard.render.com/web/srv-d5gh8c6r433s73dm9v6g/events | Logs, Events, Deploys |
| **ImprovMX** | https://app.improvmx.com/domains/tryreviewresponder.com/aliases | Email-Forwarding |
| **Resend** | https://resend.com/emails | Email-Logs, Bounces |
| **Stripe** | https://dashboard.stripe.com | Payments, Subscriptions |
| **Stripe Payment Methods** | https://dashboard.stripe.com/settings/payment_methods | PayPal, Apple Pay, etc. |
| **Cron-job.org** | https://console.cron-job.org/dashboard | Scheduled Jobs (Outreach) |
| **Google Search Console** | https://search.google.com/search-console?resource_id=https://tryreviewresponder.com/ | SEO, Indexierung |
| **Gmail** | https://mail.google.com/mail/u/0/#inbox | Support-Anfragen |

---

## CURRENT TASKS

**Stand: 10.01.2026**

### USER MUSS MACHEN:
- [ ] Demo-Video aufnehmen (2 Min Walkthrough)
- [x] **PayPal aktivieren**: Stripe Dashboard ✅
- [x] **Apple Pay aktivieren**: Stripe Dashboard ✅
- [x] **Google Pay aktivieren**: Stripe Dashboard ✅
- [x] **Link (Stripe Wallet) aktivieren**: Stripe Dashboard ✅
- [ ] **SEPA-Lastschrift aktivieren**: Stripe Dashboard → Braucht ID-Verifizierung mit Lichtbildausweis

### NÄCHSTE CLAUDE TASKS:

| Task | Schwierigkeit | Dateien |
|------|---------------|---------|
| Chrome Web Store Einreichung | Leicht | ZIP fertig |
| Tone Preview (Beispiel-Snippets) | Leicht | `chrome-extension/content.js` |


### HEUTE ERLEDIGT (10.01.2026):
- [x] **Weitere Zahlungsmethoden aktiviert** - PayPal, SEPA-Lastschrift, Link (Stripe Wallet), Apple Pay/Google Pay
  - Backend: `payment_method_types` erweitert in `/api/billing/create-checkout`
  - `.well-known` Ordner für Apple Pay Verifizierung vorbereitet
  - User muss PayPal + Apple Pay Domain manuell im Stripe Dashboard aktivieren
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
| Domain | Namecheap |
| Email-Forwarding | ImprovMX |

---

## GEMINI DESIGN MCP

**Was:** Paralleler Design-Agent der mit Gemini AI das Frontend verbessert während Claude an der Logik arbeitet.
**URL:** https://gemini-design-mcp.com

### Installation
```bash
claude mcp add gemini-design-mcp --env API_KEY=YOUR_GEMINI_API_KEY -- npx -y gemini-design-mcp@latest
```

**API Key:** https://aistudio.google.com/apikey

### Die 4 Tools

| Tool | Use Case | Beispiel |
|------|----------|----------|
| **create_frontend** | Komplette responsive Views generieren | "Create a modern pricing page with 3 tiers" |
| **modify_frontend** | Chirurgische Edits an Components | "Adjust padding, change button colors, fix mobile layout" |
| **snippet_frontend** | Standalone UI Components | "Create a modal for email verification" |
| **Context Isolation** | Backend Logic bleibt geschützt | Arbeitet nur an Frontend-Dateien |

### Wann benutzen?

**Automatisch bei Frontend-Tasks:**
- Dashboard Redesign
- Landing Page Optimierung
- Component Styling
- Mobile Responsiveness
- Neue UI Features

**Workflow:**
1. Claude analysiert Business Logic
2. Gemini MCP übernimmt Frontend Design
3. Beide arbeiten parallel in einer Session
4. Kein Context-Switching nötig

### Pricing
- **Free:** 20K tokens/month
- **Pro:** $19/month, 1M tokens
- **Enterprise:** $79/month, 6M tokens

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App (src/App.js, src/App.css)
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing (outreach/, product-hunt/, social/)
├── scripts/           # Automation Scripts
├── .claude/
│   ├── commands/      # Custom Slash Commands
│   └── TESTING.md     # Testing Workflow Checklist
├── CLAUDE.md
└── Todo.md
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

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten, Datum ändern!
