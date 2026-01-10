# ReviewResponder - Claude Code Memory

> **LIES MICH ZUERST!** Diese Datei ist das zentrale Gedächtnis für alle Claude Code Sessions.

---

## QUICK START FÜR NEUE CLAUDE SESSIONS

### Deine Rolle
Du bist ein autonomer Entwickler für ReviewResponder - eine SaaS-App für KI-generierte Review-Antworten.
**Ziel:** $1000/Monat Umsatz durch ~30 zahlende Kunden.

### Regeln für autonomes Arbeiten
1. **Immer testen** - Vor dem Push: Funktioniert es?
2. **Immer committen & pushen** - Nach jeder fertigen Änderung
3. **Immer MEMORY.md updaten** - Dokumentiere was du gemacht hast
4. **Keine Konflikte** - Lies die aktuelle MEMORY.md bevor du anfängst
5. **User nur fragen wenn nötig** - Nutze AskUserQuestion nur für wichtige Entscheidungen

### Workflow
```
1. MEMORY.md lesen (diese Datei)
2. Einen Task aus CURRENT_TASKS auswählen
3. Task erledigen
4. Testen
5. Git commit & push
6. MEMORY.md updaten (Task als erledigt markieren, neuen Stand dokumentieren)
```

---

## LIVE URLS

| Service | URL |
|---------|-----|
| **Frontend** | https://review-responder-frontend.onrender.com |
| **Backend API** | https://review-responder.onrender.com |
| **GitHub** | https://github.com/berschlend/review-responder |

---

## CURRENT_TASKS (Aktuelle Aufgaben)

**Stand: 10.01.2026 - 20:00 Uhr**

### 🔴 USER MUSS MACHEN (Nicht für Claude):
- [x] Resend.com Account erstellen + RESEND_API_KEY in Render eintragen ✅
- [x] Stripe Yearly Prices erstellen + Price IDs in Render eintragen ✅
- [ ] Demo-Video aufnehmen (2 Min Walkthrough) und YouTube/Loom Link einfügen
- [x] **Google OAuth Setup** - Google Cloud Console Credentials erstellt ✅
- [ ] **ANTHROPIC_API_KEY in Render eintragen** (für Smart AI / Claude)
- [ ] **Eigene Domain für Outreach-Emails** (MORGEN):
  1. Domain kaufen (~$10/Jahr bei Namecheap oder Porkbun)
  2. Domain in Resend verifizieren (DNS-Einträge hinzufügen)
  3. Claude: Email-Absender im Code auf neue Domain ändern
  4. Outreach-System aktivieren

### ✅ HEUTE ERLEDIGT (10.01.2026):
- [x] **Google Sign-In aktiviert** - OAuth Consent Screen + Client ID in Render konfiguriert
- [x] **Hybrid AI System implementiert** - Smart AI (Claude) + Standard (GPT-4o-mini)
  - Neue Limits: Free=20, Starter=300, Pro=800, Unlimited=∞
  - AI Model Selector im Dashboard (Auto/Smart/Standard)
  - Pricing Page mit neuen Features aktualisiert
- [x] **Admin Plan-Wechsel Fix** - Dashboard zeigt jetzt korrekte Plan-Daten nach Redirect
  - Problem: Nach `/api/admin/set-plan?redirect=1` wurden alte Daten angezeigt
  - Ursache: User-State im AuthContext wurde nicht aktualisiert
  - Fix: `api.get('/auth/me')` und `fetchStats()` nach Plan-Param erkannt
- [x] **Chrome Extension Language Bug GEFIXT** ✅
  - Problem: Extension antwortete nicht in der Sprache des Reviews
  - Ursache: `outputLanguage: 'auto'` wurde gesendet statt erkannte Sprache
  - Fix: Erkannte Sprache in `panel.dataset.detectedLanguage` speichern
  - Fix: `outputLanguage: detectedLanguage` an alle API-Calls senden
  - Fix: Explizite Sprach-Anweisung im `additionalContext` Prompt
  - Alle 5 Generate-Funktionen aktualisiert (generateResponse, generateResponseWithModifier, editExistingResponse, turboGenerate, generateQueueResponse)
- [x] **Profil-Seite mit Account-Management** ✅
  - ProfileMenu Dropdown in Navbar (ersetzt Logout Button)
  - ProfilePage mit 4 Tabs: Account, Security, Notifications, Danger Zone
  - Password ändern (mit Verifikation)
  - Email ändern (2-Schritt mit Bestätigungs-Email)
  - Notification Einstellungen (Weekly Summary, Usage Alerts, Billing)
  - Account löschen (mit Password + DELETE Bestätigung, Stripe Cleanup)
  - ConfirmEmailPage für Email-Bestätigung
  - 6 neue Backend-Endpoints
- [x] **Chrome Extension: Response Templates System** ✅
  - 💾 Templates Button im Header öffnet Template Manager
  - Templates speichern & wiederverwenden (max 10)
  - chrome.storage.sync für Cross-Device Sync
  - Quick Template Dropdown zum schnellen Laden
  - "Save as Template" Button nach Generation
  - Templates mit Name, Content, Tone gespeichert
- [x] **Chrome Extension: Draft Mode (Auto-Save)** ✅
  - 📝 Drafts Button im Header zeigt Badge mit Anzahl
  - Auto-Save beim Panel-Schließen (wenn Response > 20 Zeichen)
  - Drafts Overlay mit Liste aller Drafts
  - Continue Button lädt Draft zurück ins Panel
  - Delete Button für einzelne Drafts
  - Max 10 Drafts, ältere werden auto-gelöscht
  - Orange/Amber Farbschema für Drafts

### 🟡 NÄCHSTE CLAUDE TASKS (Wähle einen):

| # | Task | Schwierigkeit | Dateien |
|---|------|---------------|---------|
| 1 | **Tone Preview** (zeige Beispiel-Snippets für jeden Tone) | Leicht | `chrome-extension/content.js` |
| 2 | **Response Quality Score** (Bewertung nach Generation) | Mittel | `chrome-extension/content.js` |
| 3 | Chrome Web Store Screenshots (3 weitere) | Leicht | `chrome-extension/screenshots/` |
| 4 | Chrome Web Store Einreichung | Leicht | ZIP + Store Listing fertig |
| 5 | Landing Page A/B Testing | Mittel | `frontend/src/App.js` |

### 🔴 BEKANNTE BUGS:

**1. ~~Chrome Extension antwortet nicht in nativer Sprache des Reviews~~** ✅ GEFIXT
- Fix: Erkannte Sprache wird jetzt an API gesendet (nicht mehr 'auto')
- Fix: Explizite Sprach-Anweisung im Prompt

**2. Admin Panel Login funktioniert nicht!**
- URL: `/admin` - zeigt "Invalid admin key" obwohl Key korrekt ist
- Backend funktioniert (curl mit X-Admin-Key Header funktioniert!)
- Problem liegt im Frontend (React State / Header wird nicht richtig gesendet)
- Admin Key: `rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U`
- Dateien: `frontend/src/App.js` (AdminPage Komponente, ca. Zeile 7360)

---

## 🤖 MARKETING AUTOMATION BACKLOG (Für morgen)

> **ZIEL:** Vollautomatisierte Lead-Generierung für erste Sales

### Priority 1 - Schnell & Hoher Impact

| # | System | Beschreibung | Leads/Monat | Setup |
|---|--------|--------------|-------------|-------|
| 1 | **Reddit/Quora Auto-Responder** | Automatisch relevante Fragen finden, hilfreiche Antworten generieren | 20-50 | 2h |
| 2 | **Twitter/X Auto-Engagement** | Keywords monitoren, relevante Tweets finden, Auto-Replies | 30-100 | 3h |
| 3 | **SEO Auto-Pilot** | 5 Artikel/Woche automatisch generieren & publishen | 50-200 | 3h |

### Priority 2 - Mittlerer Impact

| # | System | Beschreibung | Leads/Monat | Setup |
|---|--------|--------------|-------------|-------|
| 4 | **Competitor Review Scraper** | Unzufriedene Kunden von Birdeye/Podium/etc finden | 10-30 | 2h |
| 5 | **Personalized Demo Generator** | Auto-generierte Demo-Videos für jeden Lead | 5-15 | 4h |
| 6 | **Webinar Funnel Automation** | Evergreen Webinar mit Fake-Live Sessions | 20-50 | 6h |

### Priority 3 - Langfristig

| # | System | Beschreibung | Leads/Monat | Setup |
|---|--------|--------------|-------------|-------|
| 7 | **Affiliate Auto-Recruitment** | YouTuber/Blogger automatisch finden & anschreiben | 10-30 | 3h |

---

### 📋 PROMPT: Reddit/Quora Auto-Responder

```
Lies CLAUDE.md. Erstelle automatisches Reddit/Quora System:

BACKEND (server.js):
1. POST /api/cron/reddit-monitor - Täglich ausführen
   - Reddit API: Suche nach Keywords in Subreddits
   - Keywords: "review response", "negative review", "respond to reviews", "google reviews help"
   - Subreddits: r/smallbusiness, r/Entrepreneur, r/restaurateur, r/hoteliers, r/marketing
   - Speichere in `reddit_opportunities` Tabelle

2. POST /api/cron/quora-monitor - Täglich
   - Quora durchsuchen nach relevanten Fragen

3. GET /api/marketing/opportunities - Dashboard
   - Post Title, URL, Upvotes, Suggested Answer (AI generiert)

4. Neue Tabellen: reddit_opportunities, quora_opportunities

5. Antwort-Templates: Mehrwert zuerst, Tool-Mention subtil am Ende

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: Twitter/X Auto-Engagement

```
Lies CLAUDE.md. Erstelle Twitter Automation:

BACKEND (server.js):
1. POST /api/cron/twitter-monitor - Alle 4 Stunden
   - Twitter API v2: Search recent tweets
   - Keywords: "negative review", "bad google review", "review killing my business"
   - Speichere in `twitter_opportunities`, AI bewertet Relevanz (1-10)

2. POST /api/cron/twitter-engage - Täglich
   - Top 10 Tweets, generiere hilfreiche Replies

3. Twitter Content Calendar:
   - 3 Tweets/Tag auto-generieren
   - Mix: Tips 40%, Stats 30%, Promo 20%, Memes 10%

4. GET /api/marketing/twitter-dashboard

ENV: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: SEO Auto-Pilot

```
Lies CLAUDE.md. Erstelle SEO Content Pipeline:

BACKEND (server.js):
1. POST /api/cron/seo-content - Täglich 6 AM
   - Wählt Keyword aus `seo_keywords` Tabelle
   - Generiert 1500-Wort Artikel via OpenAI
   - Auto-Internal Linking
   - Status: draft → scheduled → published

2. Keywords Tabelle mit 100+ Long-tail Keywords:
   - "how to respond to 1 star google review"
   - "negative yelp review response examples"
   - "hotel tripadvisor review reply template"

3. GET /api/blog/scheduled - Content Calendar
4. POST /api/blog/:id/publish - Veröffentlicht Artikel

FRONTEND:
- /blog Route mit allen Artikeln
- SEO Meta Tags automatisch
- Schema.org BlogPosting Markup

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: Competitor Review Scraper

```
Lies CLAUDE.md. Erstelle Competitor Monitoring:

BACKEND (server.js):
1. POST /api/cron/competitor-monitor - Wöchentlich
   Konkurrenten: Birdeye, Podium, Reputation.com, ReviewTrackers, Yext

   Suche auf: G2, Capterra, TrustPilot, Twitter (@birdeye "terrible")

2. Speichere in `competitor_leads`:
   - company_name, platform, complaint_type, contact_info, original_url

3. Auto-Outreach generieren:
   - "Ich hab gesehen du hattest Probleme mit [Competitor]..."

4. GET /api/marketing/competitor-leads - Dashboard

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: Personalized Demo Generator

```
Lies CLAUDE.md. Erstelle automatische Demo-Videos:

BACKEND (server.js):
1. POST /api/demo/generate
   Input: { businessName, industry, sampleReview }
   - Generiere Response via OpenAI
   - Screenshot mit Puppeteer
   - Speichere in /public/demos/{leadId}/

2. POST /api/outreach/send-demo-email
   - Personalisierte Email mit Demo-Link

3. Tracking: Wer hat Demo angeschaut? Conversion?

4. Neue Tabelle: personalized_demos

FRONTEND:
- /demo/:id - Personalisierte Demo-Ansicht
- CTA: "Get Your Free Trial"

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: Webinar Funnel Automation

```
Lies CLAUDE.md. Erstelle Evergreen Webinar-Funnel:

BACKEND (server.js):
1. POST /api/webinar/register - Email, Name, Business Type
2. POST /api/cron/webinar-reminders - 24h, 1h vorher, Follow-up
3. Neue Tabellen: webinar_registrations, webinar_attendees

FRONTEND:
1. /webinar - Landing Page mit Countdown
2. /webinar/live - "Live" Webinar (eigentlich Aufnahme)
   - Fake Live Chat Replay
   - CTA Overlay bei Key Moments
3. /webinar/replay - 48h Replay

CONTENT:
- Webinar Script (20 Min)
- Follow-up Email Sequenz (5 Emails)

Commit & push, update CLAUDE.md.
```

---

### 📋 PROMPT: Affiliate Auto-Recruitment

```
Lies CLAUDE.md. Erstelle Affiliate Auto-Recruitment:

BACKEND (server.js):
1. POST /api/cron/find-affiliates - Wöchentlich
   - YouTube Videos über "review management"
   - Blogs über "small business tools"
   - Podcast Hosts
   Speichere in `potential_affiliates`

2. POST /api/affiliate/auto-outreach
   - "Hey [Name], loved your [content]. 30% lifetime commission..."

3. Affiliate Portal:
   - /affiliate/apply, /affiliate/dashboard
   - Auto-Approval wenn > 1000 Followers

FRONTEND:
- /partners Landing Page
- /affiliate/dashboard für Affiliates

Commit & push, update CLAUDE.md.
```

---

### 📊 Erwartete Ergebnisse (alle Systeme zusammen)

| Metrik | Pro Monat |
|--------|-----------|
| Automatische Leads | 150-500 |
| Qualifizierte Leads | 50-150 |
| Demo Requests | 20-50 |
| **Neue Kunden** | **5-15** |
| **MRR Potential** | **$150-750** |

---

### ✅ FRÜHER ERLEDIGT:
- [x] PostgreSQL Migration (Daten persistent)
- [x] Password Reset Flow mit Resend.com
- [x] Jahres-Abos mit 20% Rabatt
- [x] Regenerate Button für andere Tones
- [x] Chrome Extension Fixes + Google Maps Preview
- [x] API Tests (alle bestanden)
- [x] **Ehrliches Marketing** - Fake Social Proof entfernt
- [x] "Just Launched" Badge + Early Adopter Messaging
- [x] Demo Examples statt fake Testimonials
- [x] 50% Launch Discount implementiert (Code: EARLY50)
- [x] 30-Day Money Back Guarantee
- [x] SEO Meta Tags + Open Graph + Twitter Cards + Schema.org
- [x] Privacy Policy & Terms of Service Seiten
- [x] Demo-Video Section mit Placeholder (Video noch aufnehmen!)
- [x] **Exit-Intent Popup** mit 20% Rabatt (Email-Capture, einmal pro Session)
- [x] **OG Image** für Social Sharing (1200x630px, professionelles Design)
- [x] **Product Hunt Launch Vorbereitung** - PRODUCT_HUNT.md mit Tagline, Description, Features, Maker Comment
- [x] **Response Templates** - Templates speichern & als Startpunkt nutzen
- [x] **QA-Test** - Live-App getestet, API-Dokumentation korrigiert, BUGS-Sektion erstellt
- [x] **Bulk Response Generation** - Bis zu 20 Reviews auf einmal (Starter/Pro/Unlimited)
- [x] **Review Analytics Dashboard** - Charts & Statistiken (Pro/Unlimited only)
- [x] **Referral System** - Invite Friends, Get 1 Month Free
- [x] **Email Notifications** - Weekly Summary, 80% Usage Alert, Plan Renewal Emails
- [x] **Keyboard Shortcuts** - Cmd/Ctrl + Enter, N, 1-4, /, Shift+C
- [x] **Chrome Extension Sprach-Bug Fix** - `outputLanguage: 'match'` zu `'auto'` geändert, defensive checks hinzugefügt
- [x] **SEO Blog Artikel Generator** - AI-generierte SEO-Artikel für Review-Management (Pro/Unlimited only)
- [x] **Team/Multi-User Accounts** - Team-Mitglieder einladen (Pro: 3, Unlimited: 10), Rollen (Admin/Member/Viewer), Shared Usage
- [x] **API Key System für Entwickler** - REST API für Unlimited-Plan User (5 Keys, 100 req/Tag, Dokumentation mit Code-Beispielen)
- [x] **LinkedIn Outreach System** - 5 Connection Messages, 5 Follow-ups, Target Audiences, Scraper Script, Tracking Template
- [x] **Cold Email System** - 3 Email-Sequenzen (Restaurant, Hotel, Service), Tracking Pixel, Email Finder Guide
- [x] **Product Hunt Launch Automation** - HUNTLAUNCH Coupon (60% off), Badge, Countdown Timer, Launch Banner, Checklists, Social Posts
- [x] **Automated Outreach System** - 100% automatisch: Google Places Lead Scraping, Hunter.io Email Finding, Cold Email Sequences, Auto Follow-ups
- [x] **Google Ads Landing Pages** - 5 dedizierte Landing Pages mit UTM Tracking (Restaurant, Hotel, Local Business, Google, Yelp)
- [x] **Affiliate/Partner System** - 20% recurring commission, Affiliate Dashboard, Marketing Materials, Payout System
- [x] **Admin Panel** - /admin Seite mit Affiliate-Verwaltung (Genehmigen/Ablehnen/Suspendieren), Payouts verarbeiten, User-Statistiken

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App
│   ├── src/App.js     # Hauptlogik (Landing, Dashboard, Auth)
│   ├── src/App.css    # Styles
│   └── public/        # Static files
├── backend/           # Express API
│   ├── server.js      # Alle API Endpoints
│   └── package.json   # Dependencies
├── chrome-extension/  # Browser Extension
│   ├── manifest.json
│   ├── popup.html/js
│   └── content.js
├── content/           # Marketing & Launch Content
│   ├── outreach/      # Sales Outreach
│   │   ├── linkedin-messages.md
│   │   ├── cold-emails.md
│   │   ├── email-finder-guide.md
│   │   ├── target-audiences.md
│   │   └── tracking-template.csv
│   ├── product-hunt/  # PH Launch
│   │   ├── launch-checklist.md
│   │   ├── hunter-outreach.md
│   │   ├── upvote-strategy.md
│   │   └── launch-day-schedule.md
│   └── social/        # Social Media Posts
│       ├── launch-twitter.md
│       └── launch-linkedin.md
├── scripts/           # Automation Scripts
│   └── linkedin-scraper.js
└── CLAUDE.md          # Diese Datei
```

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render Static Site) |
| Backend | Node.js/Express (Render Web Service) |
| Datenbank | PostgreSQL (Render) |
| Payments | Stripe (Live-Modus) |
| AI | OpenAI GPT-4o-mini |
| Email | Resend.com |

---

## API ENDPOINTS (Backend)

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/register` | User registrieren |
| POST | `/api/auth/login` | Login, gibt JWT Token |
| POST | `/api/auth/forgot-password` | Password Reset Email |
| POST | `/api/auth/reset-password` | Neues Password setzen |
| POST | `/api/generate` | AI Response generieren |
| POST | `/api/generate-bulk` | Bulk Response Generation (bis zu 20) |
| GET | `/api/stats` | Usage Stats |
| GET | `/api/responses/history` | Response History |
| POST | `/api/billing/create-checkout` | Stripe Checkout |
| POST | `/api/billing/portal` | Stripe Customer Portal |
| POST | `/api/webhooks/stripe` | Stripe Webhook |
| POST | `/api/capture-email` | Email Capture (Exit-Intent) |
| GET | `/api/templates` | User's Response Templates |
| POST | `/api/templates` | Neues Template speichern |
| PUT | `/api/templates/:id` | Template aktualisieren |
| DELETE | `/api/templates/:id` | Template löschen |
| GET | `/api/analytics` | Analytics Dashboard Daten (Pro/Unlimited) |
| GET | `/api/referrals` | User's Referral Stats & Code |
| GET | `/api/referrals/validate/:code` | Referral Code validieren (public) |
| GET | `/api/settings/notifications` | Email Notification Settings |
| PUT | `/api/settings/notifications` | Settings aktualisieren |
| POST | `/api/cron/weekly-summary` | Wöchentliche Summary Emails (Cron) |
| GET | `/api/blog/topics` | Vorgefertigte SEO Topic-Vorschläge |
| POST | `/api/blog/generate` | SEO Blog-Artikel generieren (Pro/Unlimited) |
| GET | `/api/blog/history` | Generierte Artikel abrufen |
| GET | `/api/blog/:id` | Einzelnen Artikel abrufen |
| DELETE | `/api/blog/:id` | Artikel löschen |
| GET | `/api/keys` | API Keys des Users abrufen (Unlimited only) |
| POST | `/api/keys` | Neuen API Key erstellen (max 5) |
| PUT | `/api/keys/:id` | API Key umbenennen oder de/aktivieren |
| DELETE | `/api/keys/:id` | API Key löschen |
| POST | `/api/v1/generate` | Public API Endpoint (mit X-API-Key Header) |
| GET | `/api/team` | Team-Mitglieder abrufen (Pro/Unlimited) |
| POST | `/api/team/invite` | Team-Mitglied einladen |
| GET | `/api/team/invite/:token` | Einladungs-Token validieren (public) |
| POST | `/api/team/accept` | Einladung annehmen |
| PUT | `/api/team/:memberId/role` | Rolle ändern (Admin/Member/Viewer) |
| DELETE | `/api/team/:memberId` | Mitglied entfernen |
| GET | `/api/team/my-team` | Eigene Team-Info abrufen |
| POST | `/api/team/leave` | Team verlassen |
| GET | `/api/outreach/track-open` | Tracking Pixel für Email Opens |
| GET | `/api/outreach/stats` | Outreach Kampagnen-Statistiken (Admin) |
| POST | `/api/affiliate/apply` | Affiliate-Bewerbung einreichen |
| GET | `/api/affiliate/stats` | Affiliate-Statistiken (Clicks, Conversions, Earnings) |
| GET | `/api/affiliate/payouts` | Payout-Historie abrufen |
| POST | `/api/affiliate/payout` | Payout anfordern (Min. $50) |
| PUT | `/api/affiliate/settings` | Affiliate-Einstellungen ändern (Payout Method, Email) |
| GET | `/api/affiliate/validate/:code` | Affiliate-Code validieren (public) |
| GET | `/api/affiliate/track/:code` | Affiliate-Click tracken & Redirect (public) |
| GET | `/api/admin/affiliates` | Alle Affiliates auflisten (Admin Key) |
| GET | `/api/admin/affiliates/:id` | Affiliate-Details abrufen (Admin Key) |
| PUT | `/api/admin/affiliates/:id/status` | Affiliate genehmigen/ablehnen (Admin Key) |
| PUT | `/api/admin/affiliates/:id/commission` | Commission Rate ändern (Admin Key) |
| POST | `/api/admin/affiliates/:id/payout` | Payout verarbeiten (Admin Key) |
| GET | `/api/admin/stats` | Admin-Statistiken (User, Affiliates, Revenue) |
| PUT | `/api/auth/change-password` | Password ändern (mit aktuelles Password Verifikation) |
| POST | `/api/auth/change-email-request` | Email-Änderung anfordern (sendet Bestätigungs-Email) |
| POST | `/api/auth/confirm-email-change` | Email-Änderung bestätigen (Token validieren) |
| GET | `/api/settings/notifications` | Notification Preferences abrufen |
| PUT | `/api/settings/notifications` | Notification Preferences aktualisieren |
| DELETE | `/api/auth/delete-account` | Account löschen (mit Password + "DELETE" Bestätigung) |

---

## FEATURES (Fertig)

- ✅ User Registration & Login
- ✅ Password Reset Flow (Resend.com)
- ✅ AI Response Generation (4 Tones: Professional, Friendly, Formal, Apologetic)
- ✅ 50+ Sprachen (automatische Erkennung)
- ✅ Stripe Payments (Monthly & Yearly mit 20% Rabatt)
- ✅ Usage Tracking (Free: 5, Starter: 100, Pro: 300, Unlimited: ∞)
- ✅ Response History
- ✅ Business Context Personalization
- ✅ Response Templates (speichern & als Startpunkt nutzen)
- ✅ Bulk Response Generation (bis zu 20 Reviews auf einmal)
- ✅ Analytics Dashboard mit Charts (Pro/Unlimited)
- ✅ Referral System (Invite Friends, Get 1 Month Free)
- ✅ Email Notifications (Weekly Summary, 80% Usage Alert, Plan Renewal)
- ✅ SEO Blog Generator (Pro/Unlimited) - AI-generierte SEO-Artikel für Marketing
- ✅ API Key System (Unlimited only) - REST API mit 5 Keys, 100 req/Tag, Dokumentation
- ✅ Team/Multi-User Accounts (Pro: 3, Unlimited: 10) - Rollen: Admin, Member, Viewer, Shared Usage
- ✅ Affiliate/Partner Program - 20% recurring commission, Dashboard, Marketing Materials, Payout System
- ✅ Admin Panel (/admin) - Affiliate-Verwaltung, User-Stats, Payout-Processing
- ✅ Profile Page (/profile) - Account-Info, Password/Email ändern, Notification Settings, Account löschen

---

## STRIPE KONFIGURATION

### Monatliche Pläne (Live)
| Plan | Preis | Price ID |
|------|-------|----------|
| Starter | $29/mo | `price_1Sni0hQfYocZQHxZ7oxDbiVo` |
| Professional | $49/mo | `price_1Sni18QfYocZQHxZuboFA6Wc` |
| Unlimited | $99/mo | `price_1Sni1NQfYocZQHxZTq8KNLv8` |

### Jährliche Pläne (Live)
| Plan | Preis | Price ID |
|------|-------|----------|
| Starter Yearly | $278.40/yr | `price_1SnkL2QfYocZQHxZPvaX6mru` |
| Professional Yearly | $470.40/yr | `prod_TlEUSJsa7ULdZj` |
| Unlimited Yearly | $950.40/yr | `price_1SnkObQfYocZQHxZ5zNYTN3f` |

---

## ENVIRONMENT VARIABLES (Render Backend)

```
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-api03-... (für Smart AI / Claude)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_1Sni0hQfYocZQHxZ7oxDbiVo
STRIPE_PRO_PRICE_ID=price_1Sni18QfYocZQHxZuboFA6Wc
STRIPE_UNLIMITED_PRICE_ID=price_1Sni1NQfYocZQHxZTq8KNLv8
JWT_SECRET=...
NODE_ENV=production
FRONTEND_URL=https://review-responder-frontend.onrender.com
RESEND_API_KEY=[NOCH EINTRAGEN]
```

---

## GIT WORKFLOW

```bash
# Nach jeder Änderung:
cd "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
git add -A
git commit -m "Beschreibung der Änderung"
git push

# Render deployed automatisch nach jedem Push!
```

---

## ROADMAP ZU $1000/MONAT

### Phase 1: Stabilität ✅ FERTIG
- [x] Core Features
- [x] Stripe Payments
- [x] PostgreSQL
- [x] Chrome Extension

### Phase 2: Conversion (AKTUELL)
- [x] Social Proof (Live Demo Examples)
- [x] Trust Badges (SSL, Stripe, GDPR)
- [x] Demo-Video Section (Placeholder - Video aufnehmen!)
- [x] Exit-Intent Popup ✅

### Phase 3: Features
- [x] Bulk Response Generation ✅
- [x] Review Analytics Dashboard ✅
- [x] Team/Multi-User Accounts ✅
- [x] Response Templates ✅

### Phase 4: Marketing
- [x] Product Hunt Launch Vorbereitung (PRODUCT_HUNT.md)
- [x] LinkedIn Outreach System ✅
- [ ] Google Ads ($50-100 Test)
- [ ] SEO Blog-Artikel

### Phase 5: Skalierung
- [ ] Custom Domain
- [ ] Chrome Web Store
- [x] Referral-System ✅

---

## BEKANNTE ISSUES & FIXES

| Issue | Lösung |
|-------|--------|
| better-sqlite3 auf Windows | Gewechselt zu sql.js, dann PostgreSQL |
| Daten bei Deploy gelöscht | PostgreSQL auf Render |
| react-scripts Permission | CI=false im build command |

---

## BUGS (QA-Test 09.01.2026 - 23:10 Uhr)

### Getestete Flows:
| Flow | Status | Anmerkungen |
|------|--------|-------------|
| User Registration | ✅ OK | Stripe Customer wird automatisch erstellt |
| Login | ✅ OK | JWT Token funktioniert |
| Response Generation | ✅ OK | AI antwortet korrekt, Spracherkennung funktioniert |
| History | ✅ OK | Responses werden gespeichert und angezeigt |
| Stats | ✅ OK | Usage wird korrekt getrackt |
| Password Reset | ✅ OK | Endpoint erreichbar (Resend noch nicht konfiguriert) |
| Email Capture | ✅ OK | Funktioniert, gibt SAVE20 Code zurück |
| Templates | ✅ OK | CRUD funktioniert |
| Bulk Generation | ✅ OK | Gibt Upgrade-Meldung für Free Plan |
| Analytics | ✅ OK | Gibt Upgrade-Meldung für Free Plan |
| Referrals | ✅ OK | Generiert Code, Stats funktionieren |
| API Keys | ✅ OK | Gibt Upgrade-Meldung für Free Plan |
| Blog Generator | ✅ OK | Gibt Upgrade-Meldung für Free Plan |
| Testimonials | ✅ OK | Public Endpoint funktioniert |

### Offene Bugs:
| # | Bug | Schweregrad | Status |
|---|-----|-------------|--------|
| - | Keine offenen Bugs | - | - |

### Behobene Bugs:
| # | Bug | Lösung | Datum |
|---|-----|--------|-------|
| 1 | Backend nicht vollständig deployed | Git commit & push für fehlende Features | 09.01.2026 23:08 |
| 2 | Dashboard bleibt leer (weißer Bildschirm) | Fehlender `showKeyboardHelp` useState hinzugefügt | 09.01.2026 |
| 3 | Dashboard white screen (ReferenceError) | Fehlender `Keyboard` Icon Import in lucide-react | 09.01.2026 |
| 3 | Neue Endpoints 404 (capture-email, templates, bulk, referrals) | Code war lokal aber nicht committed | 09.01.2026 23:08 |

**QA-Test 09.01.2026 23:10:**
Alle Endpoints erfolgreich getestet nach dem letzten Deploy

### Dokumentationsfehler (behoben):
- `/api/user/stats` wurde zu `/api/stats` korrigiert
- `/api/user/history` wurde zu `/api/responses/history` korrigiert
- `/api/create-checkout-session` wurde zu `/api/billing/create-checkout` korrigiert

---

## SCREENSHOT TOOL

Zum Teilen von Screenshots mit Claude:

1. Screenshot machen: `Win + Shift + S`
2. User sagt "hab" oder "screenshot"
3. Claude führt aus:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Berend Mainz\clipboard-screenshot.ps1"
```
4. Dann mit Read tool das Bild lesen

Das Script liegt unter: `C:\Users\Berend Mainz\clipboard-screenshot.ps1`

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

## MARKETING CHANGES (NEU!)

### Ehrliches Marketing statt Fake Social Proof:
- **Entfernt**: "500+ Businesses", "15,000+ Responses", Fake Testimonials
- **Hinzugefügt**: 
  - "Just Launched" Badge
  - Early Adopter Counter (7/50 spots)
  - Live Demo Examples mit echten AI Responses
  - 50% Launch Discount (Code: EARLY50)
  - 30-Day Money Back Guarantee

### Launch Discount Implementation:
- Backend: Stripe Coupon Creation in `/api/billing/create-checkout`
- Frontend: Automatisch EARLY50 Code angewendet
- Discount: 50% OFF forever für erste 50 Kunden

## EXIT-INTENT POPUP DETAILS

### Implementation:
- **Trigger**: Mouse leaves viewport (geht zum Browser Tab/Close Button)
- **Delay**: 5 Sekunden nach Seitenaufruf (nicht sofort nerven)
- **Frequency**: Nur einmal pro Session (sessionStorage)
- **Offer**: 20% Rabatt auf ersten Monat (Code: SAVE20)
- **Features**:
  - Email-Capture Form
  - Schönes Design mit Gradient Header
  - Smooth slideIn Animation
  - Success State nach Email-Eingabe
  - Click outside oder X Button zum Schließen

### Backend Integration (NEU!):
- **Endpoint**: POST `/api/capture-email`
- **Database**: `email_captures` Tabelle (email, discount_code, source, converted, created_at)
- **Email Validation**: Nutzt validator.js
- **Duplicate Check**: Verhindert mehrfache Einträge für gleiche Email
- **Welcome Email**: Automatisch via Resend mit Discount Code (wenn konfiguriert)
- **Frontend**: Connected via axios im ExitIntentPopup Component

## AUTOMATED OUTREACH SYSTEM (NEU!)

> **100% AUTOMATISCH** - Läuft täglich ohne manuellen Eingriff

### Was es macht (jeden Tag 9 AM UTC):
1. Scrapt 10 neue Business-Leads von Google Maps
2. Findet Email-Adressen via Hunter.io
3. Sendet personalisierte Cold Emails
4. Follow-ups nach 3 und 7 Tagen
5. Trackt Email-Opens

### Setup erforderlich (einmalig 5 Min):
Siehe `OUTREACH_SETUP.md` für komplette Anleitung.

| Variable | Wo bekommst du es |
|----------|-------------------|
| `GOOGLE_PLACES_API_KEY` | console.cloud.google.com (kostenlos) |
| `HUNTER_API_KEY` | hunter.io (25 free/Monat) |
| `ADMIN_SECRET` | Selbst generieren |
| `CRON_SECRET` | Selbst generieren |

### Neue Endpoints:
| Endpoint | Beschreibung |
|----------|--------------|
| `POST /api/outreach/scrape-leads` | Leads von Google Maps scrapen |
| `POST /api/outreach/find-emails` | Emails via Hunter.io finden |
| `POST /api/outreach/send-emails` | Cold Emails senden |
| `POST /api/outreach/send-followups` | Follow-up Sequenz |
| `POST /api/cron/daily-outreach` | Komplette tägliche Automation |
| `GET /api/outreach/dashboard?key=X` | Stats & Dashboard |

### Email-Sequenz:
- **Tag 1:** Erste Cold Email (Value Prop + Free Trial)
- **Tag 4:** Follow-up (Social Proof + Stats)
- **Tag 8:** Letzte Email (Scarcity + Discount)

### Erwartete Ergebnisse:
| Pro Monat | Anzahl |
|-----------|--------|
| Leads | 300 |
| Emails gefunden | 120-160 |
| Cold Emails | 800 |
| Replies (~5%) | 40 |
| **Neue Kunden** | **3-4** |

---

## LINKEDIN OUTREACH SYSTEM (Manual - Optional)

### Files:
| Datei | Beschreibung |
|-------|--------------|
| `content/outreach/linkedin-messages.md` | Connection + Follow-up Message Templates |
| `content/outreach/target-audiences.md` | Zielgruppen mit LinkedIn Search Queries |
| `content/outreach/tracking-template.csv` | Google Sheets Import-Template |
| `content/outreach/tracking-template.md` | Anleitung für Tracking Sheet |
| `scripts/linkedin-scraper.js` | Node.js Script für Prospect Research |

### Weekly Outreach Schedule:
| Tag | Aktion | Ziel |
|-----|--------|------|
| Montag | 25 Connection Requests | Restaurants |
| Dienstag | 25 Connection Requests | Hotels |
| Mittwoch | Follow-ups an Accepts | Alle |
| Donnerstag | 25 Connection Requests | Local Businesses |
| Freitag | 25 Connection Requests | Agencies/Franchises |

### Ziel-Metriken:
- **100 Connection Requests/Woche**
- **25% Accept Rate** = 25 neue Connections
- **20% Response Rate** = 5 Conversations
- **2-3 Demos/Woche**
- **1-2 Conversions/Woche**

### Scraper Setup:
```bash
cd scripts
npm install
node linkedin-scraper.js "https://linkedin.com/search/results/people/?keywords=restaurant%20owner"
```

---

## COLD EMAIL SYSTEM

### Files:
| Datei | Beschreibung |
|-------|--------------|
| `content/outreach/cold-emails.md` | 3 Email-Sequenzen mit je 4 Emails |
| `content/outreach/email-finder-guide.md` | Tools & Methoden zum Email-Finden |

### Email Sequenzen:
| Sequenz | Zielgruppe | Emails | Zeitraum |
|---------|------------|--------|----------|
| A | Restaurant Owners | 4 | 14 Tage |
| B | Hotel Managers | 4 | 14 Tage |
| C | Local Service Businesses | 4 | 14 Tage |

### Tracking Pixel:
```html
<img src="https://review-responder.onrender.com/api/outreach/track-open?email={{EMAIL}}&campaign={{CAMPAIGN}}" width="1" height="1" style="display:none" />
```

### Stats Endpoint:
```
GET /api/outreach/stats?secret=reviewresponder2026
```
Zeigt: Total Opens, Unique Opens, By Campaign, By Day, Recent Opens

### Email Finder Tools:
- **Hunter.io** - Domain Search, Email Finder, Chrome Extension
- **Apollo.io** - 275M+ Kontakte, Email Sequenzen
- **Snov.io** - Email Finder & Verifier, bestes Preis-Leistung

### Sending Schedule:
| Tag | Zeit | Aktion |
|-----|------|--------|
| 1 | Di 10:00 | Email 1 (Eisbrecher) |
| 4 | Fr 14:00 | Email 2 (Social Proof) |
| 8 | Di 10:00 | Email 3 (Urgency) |
| 14 | Fr 14:00 | Email 4 (Break-up) |

---

## CHANGELOG

### 09.01.2026
- **BUGFIX: Dashboard bleibt leer** - Fehlender `showKeyboardHelp` useState in DashboardPage hinzugefügt (Zeile 2313)
- PostgreSQL Migration
- Password Reset mit Resend.com
- Jahres-Abos (20% Rabatt)
- Regenerate Button
- Chrome Extension Fixes
- Ehrliches Marketing implementiert
- Launch Discount System
- Exit-Intent Popup mit Email Capture
- Backend Integration für Email Capture (POST /api/capture-email)
- Welcome Email via Resend mit Discount Code
- MEMORY.md optimiert für Claude Sessions
- OG Image für Social Sharing erstellt (1200x630px)
- **Product Hunt Launch Vorbereitung** - PRODUCT_HUNT.md erstellt
- **Response Templates Feature** implementiert:
  - Neue `response_templates` Tabelle in PostgreSQL
  - CRUD API Endpoints (GET, POST, PUT, DELETE /api/templates)
  - "Save as Template" Button im Dashboard
  - Template-Dropdown mit "Use as starting point" Option
  - Max 20 Templates pro User
- **Bulk Response Generation** implementiert:
  - POST /api/generate-bulk Endpoint
  - Bis zu 20 Reviews auf einmal verarbeiten
  - Verfügbar für Pro/Unlimited Pläne
  - Tab-basierte UI im Dashboard (Single/Bulk/History)
  - Fortschrittsanzeige und Fehlermeldungen
- **Review Analytics Dashboard** implementiert:
  - GET /api/analytics Endpoint (nur Pro/Unlimited)
  - Line Chart: Responses over time (letzte 30 Tage)
  - Pie Chart: Verteilung nach Tone
  - Bar Charts: Platform & Rating Breakdown
  - Quick Stats: Total, This Week, Avg/Day, Most Used Tone
  - Schöne Upgrade-Seite für Free/Starter User
  - recharts Library für Charts
- **Referral System** implementiert:
  - Neue `referrals` Tabelle in PostgreSQL
  - Unique Referral Code für jeden User (REF-XXXXXXXX)
  - GET /api/referrals - Stats & Referral Link
  - GET /api/referrals/validate/:code - Code validieren (public)
  - Dashboard Widget mit Stats (Invited, Converted, Credits)
  - Referral Link kopieren mit einem Klick
  - Referral Banner auf Landing Page bei ?ref=CODE
  - Automatische Reward-Vergabe bei Stripe Checkout
  - 1 Month Free Credit für Referrer wenn Referred User zahlt
- **Email Notifications** implementiert:
  - Neue DB Spalten: email_weekly_summary, email_usage_alerts, email_billing_updates
  - GET/PUT /api/settings/notifications - Settings API
  - Wöchentlicher Summary Email (Responses, Usage %)
  - 80% Usage Alert Email (automatisch bei Response Generation)
  - Plan Renewal Email (automatisch bei Stripe invoice.paid)
  - POST /api/cron/weekly-summary - Cron Endpoint für wöchentliche Emails
  - Schöne HTML Email Templates mit Branding
  - User kann jede Email-Art an/ausschalten
- **SEO Blog Artikel Generator** implementiert:
  - Neue `blog_articles` Tabelle in PostgreSQL
  - 12 vorgefertigte SEO-optimierte Topics
  - Benutzerdefinierte Topics möglich
  - Keyword-Targeting für SEO
  - Längenauswahl (500-2000 Wörter)
  - 3 Tones: Informativ, Überzeugend, Casual
  - Meta-Description automatisch generiert
  - Markdown-Rendering im Preview
  - Download als .md oder .txt
  - Copy-to-Clipboard Funktion
  - Artikel-History mit Pagination
  - Nur für Pro/Unlimited Pläne
  - Upgrade-Prompt für Free/Starter User
- **Team/Multi-User Accounts** implementiert:
  - Bestehende `team_members` Tabelle erweitert
  - Pro Plan: 3 Team-Mitglieder, Unlimited: 10 Mitglieder
  - Rollen: Admin (generate + history + settings), Member (generate + own history), Viewer (read-only)
  - Email-Einladungen via Resend.com mit Token-System
  - Shared Usage: Team-Mitglieder nutzen Owner's Kontingent
  - TeamPage: Mitglieder einladen, Rollen ändern, entfernen
  - JoinTeamPage: Einladungen annehmen via /join-team?token=...
  - Team-Button im Dashboard Header (Pro Badge für Free/Starter)
  - Team-Mitglieder nutzen Business Context des Owners

### 10.01.2026
- **API Key System für Entwickler** implementiert
- **Team Management UI** - Frontend für Team-Verwaltung
- **LinkedIn Outreach System** implementiert:
  - 5 Connection Request Messages (personalisiert, < 300 chars)
  - 5 Follow-up Message Templates
  - Target Audiences Dokumentation (Restaurant, Hotel, Franchise, etc.)
  - LinkedIn Scraper Script (Node.js + Playwright)
  - Tracking Sheet Template (CSV + Google Sheets Format)
  - Ziel: 100 Prospects/Woche kontaktieren
- **Cold Email Outreach System** implementiert:
  - 3 Email-Sequenzen: Restaurant, Hotel, Local Services
  - Jede Sequenz hat 4 Emails über 2 Wochen
  - Tracking Pixel für Email Opens (GET /api/outreach/track-open)
  - Stats Endpoint für Kampagnen-Analyse (GET /api/outreach/stats)
  - `outreach_tracking` Tabelle in PostgreSQL
  - Email Finder Guide (Hunter.io, Apollo.io, Snov.io)
  - Personalisierungs-Checkliste & A/B Test Tracking
  - CAN-SPAM & GDPR Compliance Hinweise
- **Product Hunt Launch Automation** implementiert:
  - Backend: HUNTLAUNCH Coupon (60% off, 24h gültig) in `/api/billing/create-checkout`
  - Frontend: `ProductHuntBadge` Component (zeigt "Featured on Product Hunt" wenn isLaunched=true)
  - Frontend: `CountdownTimer` Component (24h Countdown mit HRS:MIN:SEC)
  - Frontend: `ProductHuntLaunchBanner` (Top-Banner mit Discount Code und CTA)
  - Frontend: `PRODUCT_HUNT_CONFIG` in App.js (isLaunched, launchEndTime, productHuntUrl)
  - Content: `/content/product-hunt/launch-checklist.md` (2-Wochen-Plan bis Launch)
  - Content: `/content/product-hunt/hunter-outreach.md` (Top Hunter kontaktieren, Templates)
  - Content: `/content/product-hunt/upvote-strategy.md` (legale Upvote-Quellen, Templates)
  - Content: `/content/product-hunt/launch-day-schedule.md` (stündlicher Plan für Launch Day)
  - Social: `/content/social/launch-twitter.md` (10 Tweets + Thread)
  - Social: `/content/social/launch-linkedin.md` (3 Posts + Connection Templates)
- **Google Ads Landing Pages** implementiert:
  - 5 dedizierte Landing Pages für Google Ads Kampagnen
  - `/google-review-response-generator` - Google Reviews
  - `/yelp-review-reply-tool` - Yelp Reviews
  - `/restaurant-review-responses` - Restaurant Owners (orange/rot Gradient)
  - `/hotel-review-management` - Hotels & B&Bs (blau/lila Gradient)
  - `/local-business-reviews` - **NEU** Local Businesses (grün Gradient)
  - UTM Tracking auf allen Landing Pages (sessionStorage)
  - Register-Flow liest UTM aus sessionStorage und sendet ans Backend
  - DB: `utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page`
  - Campaign Attribution: Welche Google Ads Kampagne converted am besten?
- **Hybrid AI System implementiert** (Smart AI + Standard):
  - Backend: @anthropic-ai/sdk installiert, Claude Sonnet 4 für Smart AI
  - Backend: PLAN_LIMITS mit smartResponses/standardResponses
  - Backend: Neue DB-Spalten (smart_responses_used, standard_responses_used, ai_model)
  - Backend: Alle Generate-Endpoints unterstützen AI-Model-Auswahl (auto/smart/standard)
  - Backend: /api/stats gibt smart/standard Usage zurück
  - Frontend: AI Model Selector in Single + Bulk Generation
  - Frontend: Stats-Anzeige mit Smart/Standard-Balken
  - Frontend: AI Badge auf generierten Responses
  - Pricing: Neue Limits (Free: 3+17=20, Starter: 100+200=300, Pro: 300+500=800, Unlimited: ∞)

## PRODUCT HUNT LAUNCH SETUP

Am Launch-Tag in `frontend/src/App.js` ändern:

```javascript
const PRODUCT_HUNT_CONFIG = {
  isLaunched: true, // Auf true setzen!
  launchEndTime: new Date('2025-XX-XXTXX:XX:XX-08:00'), // 24h nach Launch
  productHuntUrl: 'https://www.producthunt.com/posts/reviewresponder', // Echte URL
};
```

Dann Frontend neu deployen und Launch genießen!

- **Automated Outreach System** implementiert:
  - Backend: Google Places API Lead Scraping (`/api/outreach/scrape-leads`)
  - Backend: Hunter.io Email Finding (`/api/outreach/find-emails`)
  - Backend: Automated Cold Email Sending (`/api/outreach/send-emails`)
  - Backend: Follow-up Sequenz nach 3 und 7 Tagen (`/api/outreach/send-followups`)
  - Backend: Daily Cron Endpoint (`/api/cron/daily-outreach`) für vollautomatische Ausführung
  - Backend: Dashboard Endpoint (`/api/outreach/dashboard`)
  - 3 Email Templates: Sequence 1 (Value Prop), Sequence 2 (Social Proof), Sequence 3 (Scarcity)
  - Neue Tabellen: `outreach_leads`, `outreach_emails`, `outreach_campaigns`
  - OUTREACH_SETUP.md mit Setup-Anleitung (5 Min)
  - Erwartete Ergebnisse: 300 Leads/Monat → 3-4 neue Kunden
- **Affiliate/Partner System** implementiert:
  - Backend: 4 neue Tabellen (affiliates, affiliate_clicks, affiliate_conversions, affiliate_payouts)
  - Backend: 7 neue Endpoints (/api/affiliate/apply, /stats, /payouts, /payout, /settings, /track/:code, /validate/:code)
  - Backend: 20% recurring commission automatisch bei Stripe invoice.paid
  - Backend: affiliate_id Spalte zu users Tabelle hinzugefügt
  - Frontend: AffiliateLandingPage (/affiliate) - How it works, Earnings Calculator, Apply Form
  - Frontend: AffiliateDashboardPage (/affiliate/dashboard) - Stats, Clicks Chart, Conversions, Payouts
  - Frontend: Marketing Materials Tab mit Email Template, Social Post, Key Selling Points
  - Frontend: Affiliate-Banner auf Landing Page bei ?aff=CODE
  - Frontend: affiliateCode Tracking in localStorage + Registration
  - Features: Min. $50 Payout, PayPal/Bank Transfer, 30-Day Cookie
- **Profile Page mit Account-Management** implementiert:
  - Backend: DB Schema erweitert (email_change_token, email_change_new_email, email_change_expires_at)
  - Backend: GET /api/auth/me erweitert (createdAt, oauthProvider, profilePicture, hasPassword, Notification Prefs)
  - Backend: PUT /api/auth/change-password (Aktuelles Password verifizieren, neues setzen)
  - Backend: POST /api/auth/change-email-request (Email-Änderung anfordern, Token senden)
  - Backend: POST /api/auth/confirm-email-change (Token validieren, Email aktualisieren)
  - Backend: GET/PUT /api/settings/notifications (Email-Einstellungen)
  - Backend: DELETE /api/auth/delete-account (mit Stripe Cleanup)
  - Frontend: ProfileMenu Dropdown in Navbar (ersetzt Logout Button)
  - Frontend: ProfilePage mit 4 Tabs: Account, Security, Notifications, Danger Zone
  - Frontend: ConfirmEmailPage für Email-Bestätigung via Link
  - Routes: /profile (protected), /confirm-email (public)

---

## GOOGLE SIGN-IN SETUP

### User muss machen:

1. **Google Cloud Console** öffnen: https://console.cloud.google.com
2. Neues Projekt erstellen oder bestehendes nutzen
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application Type: **Web application**
5. Name: `ReviewResponder`
6. **Authorized JavaScript origins** hinzufügen:
   - `http://localhost:3000` (für lokale Entwicklung)
   - `https://review-responder-frontend.onrender.com` (Produktion)
7. **Client ID kopieren** (endet mit `.apps.googleusercontent.com`)
8. **Environment Variables setzen:**
   - **Backend (Render):** `GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com`
   - **Frontend (Render):** `REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com`
9. Beide Services neu deployen

### Technische Details:
- Backend Endpoint: `POST /api/auth/google`
- Google Identity Services (GSI) Library
- Token-Verifikation mit google-auth-library
- Neue DB-Spalten: `oauth_provider`, `oauth_id`, `profile_picture`
- Bestehende Email-Accounts werden automatisch verknüpft

### Ohne Google Client ID:
- App funktioniert normal mit Email/Password Login
- Google Button wird nicht angezeigt (graceful degradation)

---

> **WICHTIG:** Nach jeder Session diese Datei updaten!
> - CURRENT_TASKS aktualisieren
> - Erledigte Tasks als [x] markieren
> - Neue Erkenntnisse dokumentieren
> - Datum/Uhrzeit bei "Stand" ändern
