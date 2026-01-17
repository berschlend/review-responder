# Dev Rules (Auto-loaded for Development Sessions)

> API Reference, DB Schema, Code Style, Common Gotchas

---

## Code Style

### TypeScript
- NIEMALS `any` oder `enum` - nutze String Unions
- Alle Funktionen brauchen Return-Types
- `type Status = 'new' | 'contacted' | 'clicked'` statt enum

### React
- Functional Components only
- Props typisieren
- Hooks fuer State
- Event Handler: `handle` Prefix (handleClick, handleSubmit)

### Git Commits
- `feat:` - Neues Feature
- `fix:` - Bug Fix
- `chore:` - Maintenance
- `docs:` - Dokumentation
- `refactor:` - Code Restructuring

---

## DB-Schema Gotchas (WICHTIG!)

### outreach_leads
```sql
-- status ist VARCHAR, NICHT BOOLEAN!
status: 'new' | 'contacted' | 'clicked' | 'converted' | 'bounced' | 'unsubscribed'
-- FALSCH: contacted = true
-- RICHTIG: status = 'contacted'
```

### users
```sql
-- KEIN last_login Feld!
-- Nutze responses Tabelle fuer Activity
-- created_via_demo: BOOLEAN DEFAULT FALSE (NEU 17.01)
-- google_place_id: VARCHAR (fuer Review Alerts)
```

### amazon_seller_leads
```sql
status: 'new' | 'contacted' | 'clicked' | 'converted' | 'unsubscribed'
demo_token: VARCHAR -- Format: amz_[timestamp]_[random]
-- Indexes: idx_amazon_seller_status, idx_amazon_seller_email
```

### review_alerts (NEU 17.01)
```sql
user_id, place_id, business_name
last_check, last_alert_sent
new_reviews_count
```

---

## API Endpoints - Full Reference

### Core
- `POST /api/generate` - Single Response
- `POST /api/generate-bulk` - Bulk (Pro+)
- `GET /api/stats` - User Stats
- `GET /api/responses/history` - Response History

### Auth
- `POST /api/auth/register` - Email Registration
- `POST /api/auth/login` - Email Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/magic-login` - Magic Link Login
- `POST /api/auth/auto-create-demo-user` - Auto-Account (NEU)

### Billing
- `POST /api/billing/create-checkout` - Stripe Checkout
- `POST /api/billing/portal` - Billing Portal

### Admin (x-admin-key Header!)
- `GET /api/admin/stats` - General Stats
- `GET /api/admin/stats?exclude_test=true` - Ohne Test-Accounts
- `GET /api/admin/user-list` - User Liste
- `GET /api/admin/set-plan` - Plan aendern
- `GET /api/admin/api-costs` - API Kosten
- `GET /api/admin/scraper-status` - Scraper Status
- `GET /api/admin/parallel-safe-status` - Lock Status
- `GET /api/admin/account-usage` - Claude CLI Limits

### Amazon Sellers
- `GET /api/admin/amazon-dashboard` - Stats
- `GET /api/admin/amazon-leads` - Lead Liste (params: status, limit, offset, search)
- `POST /api/admin/amazon-leads` - Lead hinzufuegen
- `POST /api/admin/amazon-leads/bulk` - Bulk Import
- `DELETE /api/admin/amazon-leads/:id` - Lead loeschen
- `GET /api/amazon-demo/:token` - Demo mit Click-Tracking

### Review Alerts (NEU 17.01)
- `GET /api/cron/review-alerts?secret=XXX` - Weekly Digest
- `POST /api/admin/setup-review-monitoring` - Manual Setup
- `GET /api/admin/review-alerts-stats` - Dashboard Stats

### Product Quality (NEU 17.01)
- `GET /api/admin/product-quality` - Quality Metrics
- `GET /api/cron/quality-test?secret=XXX` - Automated Testing

### Cron Jobs
- `GET /api/cron/daily-outreach` - Daily Emails
- `GET /api/cron/demo-followup` - Demo Follow-ups
- `GET /api/cron/night-blast` - Night Orchestrator
- `GET /api/cron/night-loop` - Continuous Loop
- `GET /api/cron/send-amazon-emails` - Amazon Batch
- `GET /api/cron/review-alerts` - Weekly Alerts
- `GET /api/cron/quality-test` - Quality Checks

---

## Frontend Gotchas

### API_URL vs API_BASE
```javascript
// RICHTIG: API_URL enthaelt schon /api
fetch(`${API_URL}/public/stats`)

// FALSCH: API_BASE existiert nicht!
fetch(`${API_BASE}/api/public/stats`)  // ReferenceError!
```

### White Screen Debug
1. Browser Console oeffnen (F12)
2. ESLint-Kommentare checken
3. Alle Imports verifizieren
4. `npm run build` lokal testen

---

## API Limits + Caching

| API | Status | Fallback |
|-----|--------|----------|
| SerpAPI | UEBER LIMIT | Cache nutzen! |
| Google Places | OK | - |
| Outscraper | OK | - |

### Fallback Order
Cache -> Outscraper -> SerpAPI -> Google Places -> Expired Cache

---

## Environment Variables

### Backend (Render)
```
ADMIN_SECRET - Cron Auth
FRONTEND_URL - https://tryreviewresponder.com (mit Fallback!)
DATABASE_URL - Postgres Connection
RESEND_API_KEY - Email
STRIPE_* - Payments
OPENAI_API_KEY - AI Generation
```

### Frontend
```
REACT_APP_API_URL - Backend URL
REACT_APP_STRIPE_KEY - Stripe Public Key
```

---

## Multi-Table Query Pattern
```javascript
// RICHTIG: Jede Query einzeln wrappen
try {
  const users = await db.query('SELECT * FROM users');
} catch (e) {
  console.error('users query failed:', e);
  users = [];  // Fallback, nicht crashen!
}

try {
  const responses = await db.query('SELECT * FROM responses');
} catch (e) {
  console.error('responses query failed:', e);
  responses = [];
}

// FALSCH: Alles in einem try/catch
// Eine fehlende Tabelle crasht alles!
```

---

## Discount Code Implementation
Vor neuem Discount IMMER pruefen:
1. Ist der Code in `validDiscountCodes` Handler? (create-checkout-session)
2. Wird ein Stripe Coupon erstellt?
3. Steht der Code in `discountInfo` Lookup?

---

*Loaded by: Development Sessions, Burst-9 (Doctor)*
