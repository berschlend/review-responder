# ReviewResponder - Todo Liste

> Letzte Aktualisierung: 13.01.2026

---

## DEMO VIDEOS & UPLOAD CHECKLISTE

### Verfügbare Videos

| Video | Pfad | Status |
|-------|------|--------|
| `walkthrough-video-v2.mp4` | frontend/public/ | Aktuell auf Landing Page |
| `demo-video.mp4` | frontend/public/ | Backup |
| `extension-demo-final.mp4` | content/video-scripts/ | Extension Demo |
| `demo-video-final.mp4` | content/video-scripts/ | FALSCHE AUDIO |
| `extension-demo.mp4` | scripts/generate-demo-video/ | Alt |

### Upload-Ziele

| Plattform | Video | Status | URL/Notes |
|-----------|-------|--------|-----------|
| **YouTube (ungelistet)** | walkthrough-video-v2.mp4 | [ ] TODO | Für Embedding |
| **YouTube (ungelistet)** | extension-demo-final.mp4 | [ ] TODO | Für Embedding |
| **Chrome Web Store** | extension-demo-final.mp4 | [ ] TODO | Max 30 Sek, 1280x800 |
| **Capterra** | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing |
| **G2** | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing |
| **GetApp** | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing |
| **Product Hunt** | walkthrough-video-v2.mp4 | [ ] TODO | Launch Day |
| **Landing Page** | walkthrough-video-v2.mp4 | [x] DONE | tryreviewresponder.com |

### Video-Anforderungen pro Plattform

| Plattform | Max Länge | Format | Auflösung |
|-----------|-----------|--------|-----------|
| YouTube | Unbegrenzt | MP4 | 1080p+ |
| Chrome Web Store | 30 Sek | MP4/WebM | 1280x800 |
| Capterra | 3 Min | YouTube Link | - |
| G2 | 2 Min | YouTube Link | - |
| Product Hunt | 2 Min | YouTube/Direct | - |

---

## NEUES UPDATE: Google Sign-In für Extension (11.01.2026)

### Was Claude gerade erledigt hat:
- [x] **Google Sign-In Button** - Hinzugefügt zu Extension Popup
- [x] **OAuth Flow implementiert** - `chrome.identity.launchWebAuthFlow()`
- [x] **identity Permission** - Manifest.json aktualisiert
- [x] **Version 1.5.2** - Neues ZIP erstellt (86KB)
- [x] **Git gepusht** - Commit `89cad64a`

### Was DU jetzt machen musst:

1. **Google Cloud Console konfigurieren** (2 Min)
   - https://console.cloud.google.com/apis/credentials
   - OAuth Client ID auswählen
   - Redirect URI hinzufügen: `https://<EXTENSION_ID>.chromiumapp.org/`
   - Extension ID bekommst du nach Upload zum Chrome Web Store

2. **Screenshots machen** (10 Min)
   - Google Maps mit Restaurant + Reviews öffnen
   - Extension nutzen, Screenshots mit `Win + Shift + S`
   - 3-5 Bilder bei 1280x800 px

3. **Chrome Web Store Submit** (5 Min)
   - https://chrome.google.com/webstore/devconsole
   - ZIP hochladen: `chrome-extension-v1.5.2.zip`
   - Text aus `chrome-extension/STORE_LISTING.md` kopieren

4. **Demo Video aufnehmen** (optional, 15 Min)

---

## 🟠 AKTUELL IN ARBEIT

### Stripe Zahlungsmethoden Fix
- [ ] **Stripe Link zeigt nicht alle Zahlungsmethoden** - PayPal, SEPA etc. fehlen im Checkout
  - Checkout Session prüfen: `payment_method_types` korrekt?
  - Stripe Dashboard prüfen: Sind alle Methoden aktiviert?
  - Link (Stripe Wallet) Konfiguration checken

### Chrome Extension Release v1.5.2
- [x] Extension fertig testen - CLAUDE HAT GETESTET
- [x] Google Sign-In hinzugefügt - FERTIG
- [ ] 3 Screenshots machen (1280x800 px, sauberer Browser) - **DU MUSST MACHEN**
- [x] ZIP erstellen - `chrome-extension-v1.5.2.zip` FERTIG (86KB)
- [ ] Google Cloud Console Redirect URI konfigurieren - **DU MUSST MACHEN**
- [ ] Chrome Web Store einreichen - **DU MUSST MACHEN**
- [x] Chrome Developer Account: Vorhanden

### Videos (nach Extension Release)
- [ ] **Video 1:** Extension Demo (30-60 Sek) → ExtensionPromoCard
- [ ] **Video 2:** Full Walkthrough (2 Min) → Landing Page
  - 0:00-0:30 Extension installieren & erste Review
  - 0:30-1:00 Features: Tones, Templates, Variations
  - 1:00-1:30 Dashboard: History, Analytics, Bulk
  - 1:30-2:00 Team Features, Pricing CTA

---

## 🔴 SALES PRIORITY - Erste Kunden bekommen!

### 1. Automated Outreach System aktivieren
- [ ] **API Keys in Render prüfen:**
  - [ ] `GOOGLE_PLACES_API_KEY` - Haben wir schon? Sonst: console.cloud.google.com
  - [ ] `HUNTER_API_KEY` - ✅ Haben wir (für Outreach)
  - [ ] `ADMIN_SECRET` - Für Dashboard-Zugriff
  - [ ] `CRON_SECRET` - Für automatische Jobs
- [ ] **Outreach Dashboard checken:** Siehe `.claude/secrets.local` für URL mit Admin-Key
- [ ] **Resend Logs checken:** https://resend.com/emails (gehen Outreach-Mails raus?)
- [ ] **Cron-Job läuft?** Täglich 10:00 Uhr Berlin → scrapen + emails senden

### 2. Google Ads starten ($50-100 Test)
- [ ] Google Ads Account erstellen
- [ ] Kampagne für "google review response generator" Keywords
- [ ] Landing Pages sind fertig: `/google-review-response-generator`, `/restaurant-review-responses`
- [ ] Budget: $50 für 1 Woche testen

### 3. Product Hunt Launch
- [ ] Launch-Tag festlegen (Dienstag oder Mittwoch beste Tage)
- [ ] `PRODUCT_HUNT_CONFIG.isLaunched = true` setzen
- [ ] Upvote-Netzwerk aktivieren (Freunde, LinkedIn Kontakte)
- [ ] HUNTLAUNCH Coupon (60% off) ist schon im Code

### 4. LinkedIn Outreach (manuell)
- [ ] 25 Connection Requests pro Tag an Restaurant/Hotel Owner
- [ ] Templates sind fertig in `content/outreach/linkedin-messages.md`
- [ ] Ziel: 5 Conversations → 1-2 Demos pro Woche

---

## 🟡 FOLLOW-UP CHECKS

### Täglich prüfen:
- [ ] Outreach Dashboard: Neue Leads? Emails gesendet?
- [ ] Resend: Werden Emails zugestellt? Bounces?
- [ ] Stripe Dashboard: Neue Kunden?

### Wöchentlich prüfen:
- [ ] Google Search Console: Impressionen? Klicks? Keywords?
- [ ] Analytics: Welche Landing Pages konvertieren?

---

## 🟢 HEUTE ERLEDIGT (11.01.2026)

- [x] **Video-Platzhalter auf Landing Page** - Extension Demo Preview mit Play-Button in Chrome Extension Section
- [x] **Yelp Scan Reviews gefixt** - CSS-Selektoren für dynamische Klassen aktualisiert
- [x] **Video-Strategie geplant** - 2 Videos (Extension Demo + Full Walkthrough)
- [x] **Chrome Web Store Vorbereitung** - Store Listing + Account vorhanden

## 🟢 ERLEDIGT (10.01.2026)

- [x] **Google Search Console eingerichtet**
  - Domain verifiziert: tryreviewresponder.com
  - Sitemap eingereicht: 13 Seiten
  - Indexierung läuft (2-7 Tage)
- [x] **Team Feature getestet & gefixt**
  - Team Member sieht Owner's Plan
  - Rollen vereinfacht (nur Member)
  - Shared Usage funktioniert
- [x] sitemap.xml erstellt
- [x] robots.txt erstellt
- [x] Alle URLs auf tryreviewresponder.com umgestellt

---

## 📋 BACKLOG (Später)

### Chrome Extension
- [ ] Chrome Web Store Screenshots (3 weitere)
- [ ] Chrome Web Store Einreichung (ZIP + Listing fertig)
- [ ] Tone Preview (Beispiel-Snippets für jeden Tone)
- [ ] Weitere Plattformen fixen wenn nötig (TripAdvisor, Trustpilot, Booking, Facebook)

### Content
- [ ] Demo-Video aufnehmen (2 Min Walkthrough)
- [ ] Blog-Artikel schreiben (SEO)


---

## HEUTE möglicherweise ERLEDIGT bzw angegangen (10.01.2026)

### Chrome Extension v1.4.0 - 6 neue Features
- [x] Response Quality Score (AI-Bewertung: Excellent/Good/Needs Work)
- [x] Response Variations (3 Optionen auf einmal: A/B/C Tabs)
- [x] Analytics Widget (Wochenstatistik + Sparkline-Chart)
- [x] Template Library (50+ vorgefertigte Templates nach Branche)
- [x] Tone Strength Slider (visueller Slider statt Dropdown)
- [x] Multi-Account Support (mehrere Business-Profile)
- [x] Response Templates System (speichern & wiederverwenden)
- [x] Draft Mode (Auto-Save beim Panel-Schließen)
- [x] One-Shot Perfect Response (Auto-Tone Empfehlung)
- [x] Daily Streak & Achievements (Gamification)
- [x] Language Bug GEFIXT (antwortet jetzt in Review-Sprache)

### Dashboard & Backend
- [x] Google Sign-In aktiviert (OAuth Consent Screen + Client ID)
- [x] Hybrid AI System (Smart AI Claude + Standard GPT-4o-mini)
- [x] Admin Plan-Wechsel Fix (Dashboard zeigt korrekte Daten)
- [x] Template-Bearbeitung im Dashboard (Edit-Button + Modal)
- [x] Profil-Seite mit Account-Management (4 Tabs)
- [x] Frontend Inkonsistenzen gefixt (Limits, Features, Team Members)
- [x] /admin Route mit ProtectedRoute geschützt

### Infrastructure
- [x] Custom Domain LIVE (https://tryreviewresponder.com)
- [x] Outreach-Emails von outreach@tryreviewresponder.com
- [x] Cron-Job läuft täglich 10:00 Uhr Berlin

---

## ✅ FRÜHER evt. ERLEDIGT

### 09.01.2026
- [x] PostgreSQL Migration
- [x] Password Reset Flow
- [x] Jahres-Abos (20% Rabatt)
- [x] Ehrliches Marketing
- [x] Exit-Intent Popup
- [x] Response Templates
- [x] Bulk Generation
- [x] Analytics Dashboard
- [x] Referral System
- [x] Email Notifications
- [x] SEO Blog Generator
- [x] Team/Multi-User Accounts
- [x] API Key System
- [x] Affiliate/Partner System
- [x] Admin Panel

### 10.01.2026 (früher am Tag)
- [x] Cold Email System
- [x] Product Hunt Launch Automation
- [x] Google Ads Landing Pages (5 Seiten) brauchen noch improvment und adds dann halt noch schalten
- [x] Automated Outreach System

---

## 📊 Ziel

**$1000/Monat** durch ~30 zahlende Kunden

| Metrik | Aktuell | Ziel |
|--------|---------|------|
| Zahlende Kunden | 0 | 30 |
| MRR | $0 | $1000 |
| Free Users | 0 | 100+ |

---

## 🔗 Quick Links

| Link | URL |
|------|-----|
| **Live App** | https://tryreviewresponder.com |
| **Backend API** | https://review-responder.onrender.com |
| **Outreach Dashboard** | Siehe `.claude/secrets.local` |
| **Render Dashboard** | https://dashboard.render.com |
| **Stripe Dashboard** | https://dashboard.stripe.com |
| **Resend Logs** | https://resend.com/emails |

---

> Bei Fragen: Neue Claude Session starten und CLAUDE.md lesen lassen!
