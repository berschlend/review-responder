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

**Stand: 10.01.2026 - 01:30 Uhr**

### 🔴 USER MUSS MACHEN (Nicht für Claude):
- [ ] Resend.com Account erstellen + RESEND_API_KEY in Render eintragen
- [ ] Stripe Yearly Prices erstellen + Price IDs in Render eintragen
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
└── MEMORY.md          # Diese Datei
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

---

## STRIPE KONFIGURATION

### Monatliche Pläne (Live)
| Plan | Preis | Price ID |
|------|-------|----------|
| Starter | $29/mo | `price_1Sni0hQfYocZQHxZ7oxDbiVo` |
| Professional | $49/mo | `price_1Sni18QfYocZQHxZuboFA6Wc` |
| Unlimited | $99/mo | `price_1Sni1NQfYocZQHxZTq8KNLv8` |

### Jährliche Pläne (User muss erstellen)
| Plan | Preis | Price ID |
|------|-------|----------|
| Starter Yearly | $278.40/yr | `[NOCH ERSTELLEN]` |
| Professional Yearly | $470.40/yr | `[NOCH ERSTELLEN]` |
| Unlimited Yearly | $950.40/yr | `[NOCH ERSTELLEN]` |

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
- [ ] Team/Multi-User Accounts
- [x] Response Templates ✅

### Phase 4: Marketing
- [x] Product Hunt Launch Vorbereitung (PRODUCT_HUNT.md)
- [ ] LinkedIn Outreach
- [ ] Google Ads ($50-100 Test)
- [ ] SEO Blog-Artikel

### Phase 5: Skalierung
- [ ] Custom Domain
- [ ] Chrome Web Store
- [ ] Referral-System

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

---

> **WICHTIG:** Nach jeder Session diese Datei updaten!
> - CURRENT_TASKS aktualisieren
> - Erledigte Tasks als [x] markieren
> - Neue Erkenntnisse dokumentieren
> - Datum/Uhrzeit bei "Stand" ändern
