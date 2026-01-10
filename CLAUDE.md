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

**Stand: 10.01.2026 - 04:00 Uhr**

### 🔴 USER MUSS MACHEN (Nicht für Claude):
- [x] Resend.com Account erstellen + RESEND_API_KEY in Render eintragen ✅
- [x] Stripe Yearly Prices erstellen + Price IDs in Render eintragen ✅
- [ ] Demo-Video aufnehmen (2 Min Walkthrough) und YouTube/Loom Link einfügen

### 🟡 NÄCHSTE CLAUDE TASKS (Wähle einen):

| # | Task | Schwierigkeit | Dateien |
|---|------|---------------|---------|
| 1 | Chrome Extension Improvement | Mittel | `chrome-extension/` |
| 2 | Landing Page A/B Testing | Mittel | `frontend/src/App.js` |
| 3 | Custom Domain Setup | Leicht | Dokumentation |

### ✅ HEUTE ERLEDIGT:
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
- ✅ Chrome Extension
- ✅ Regenerate mit anderem Tone
- ✅ Response Templates (speichern & als Startpunkt nutzen)
- ✅ Bulk Response Generation (bis zu 20 Reviews auf einmal)
- ✅ Analytics Dashboard mit Charts (Pro/Unlimited)
- ✅ Referral System (Invite Friends, Get 1 Month Free)
- ✅ Email Notifications (Weekly Summary, 80% Usage Alert, Plan Renewal)
- ✅ SEO Blog Generator (Pro/Unlimited) - AI-generierte SEO-Artikel für Marketing
- ✅ API Key System (Unlimited only) - REST API mit 5 Keys, 100 req/Tag, Dokumentation
- ✅ Team/Multi-User Accounts (Pro: 3, Unlimited: 10) - Rollen: Admin, Member, Viewer, Shared Usage

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

---

> **WICHTIG:** Nach jeder Session diese Datei updaten!
> - CURRENT_TASKS aktualisieren
> - Erledigte Tasks als [x] markieren
> - Neue Erkenntnisse dokumentieren
> - Datum/Uhrzeit bei "Stand" ändern
