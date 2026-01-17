# ReviewResponder - Todo Liste

> Letzte Aktualisierung: 17.01.2026 (Session wrap-up)

---

## 🔴 NIGHT-BURST V3.1 VERIFIZIERUNG (16.01.2026 Morgen)

**Task Scheduler startet heute Nacht um 01:30 deutscher Zeit.**

### Was passiert um 01:30:

```
01:30 → Task Scheduler startet night-burst-launcher.ps1
         ↓
       Launcher setzt High Performance Power Plan (kein Sleep)
         ↓
       Launcher startet night-burst-orchestrator.ps1
         ↓
       Für jeden der 15 Agents:
         1. Get-BestAccount.ps1 wählt Account mit niedrigstem Usage
            (aus .claude-acc1, .claude-acc2, .claude-acc3)
         2. Agent startet mit:
            - $env:CLAUDE_CONFIG_DIR = Gewählter Account
            - $env:CLAUDE_SESSION = "BURST1..15"
            - --dangerously-skip-permissions (Full Autonomy)
            - --chrome (für Burst-1 Lead Finder, Burst-3 Social DM)
         3. Agent führt seinen Slash-Command aus (/night-burst-1 bis /night-burst-15)
         ↓
       Agents arbeiten autonom die Nacht durch
         ↓
11:30 → Auto-Stop nach 10 Stunden
       Power Plan wird zurückgesetzt
```

### Morgen früh verifizieren:

- [ ] **Log-File checken:** `logs/night-burst-2026-01-16.log`
  ```powershell
  Get-Content ".\logs\night-burst-2026-01-16.log"
  ```
- [ ] **Agent Registry prüfen:** Welche Agents liefen?
  ```powershell
  Get-Content ".\content\claude-progress\agent-registry.json"
  ```
- [ ] **Account Usage checken:** Wurden alle 3 Accounts genutzt?
  ```powershell
  .\scripts\Get-BestAccount.ps1 -Verbose
  ```
- [ ] **Morning Report lesen:** `content/claude-progress/for-berend.md`
- [ ] **Learnings checken:** `content/claude-progress/learnings.md`

### Bei Problemen:

- **Agents nicht gestartet?** → Log auf Fehler prüfen, Claude CLI testen
- **Nur 1 Account genutzt?** → stats-cache.json der Accounts prüfen
- **PC war im Sleep?** → Power Settings checken, High Performance als Default

---

## ⏳ BLOCKED / WAITING

| Was | Wartet auf | Seit | Nächste Aktion |
|-----|------------|------|----------------|
| **Phone Outreach (3 Hot Leads)** | **Berend morgen früh** | **18.01** | **Call-Preps ready in `content/call-prep/`. Prio: Ti Cafe → Trattoria → Sphere** |
| **Night-Burst System** | **Manuellen Neustart** | **17.01** | **6 Agents STALE, Burst-6 nie gestartet. Siehe for-berend.md für Commands** |
| Chrome Extension v1.6.2 | Chrome Review (1-3 Tage) | 15.01 | Bei Approval → Google Ads schalten |
| AnyDesk Remote (Laptop zu) | HDMI Dummy Plug kaufen | 16.01 | Amazon bestellen (~5€) → Einstecken |
| **AWS SES Domain Verification** | AWS automatische Verifizierung | 18.01 | DNS Records gesetzt, wartet auf AWS Check (10-60 min, max 72h) |

---

## ✅ CHROME WEB STORE - Eingereicht (15.01.2026)

- [x] ZIP v1.6.2 hochgeladen
- [x] Description ohne Keyword-Spam
- [x] Promo-Bilder (440x280 + 1400x560)
- [x] Privacy-Tab ausgefüllt
- [x] Test-Account: `reviewer@tryreviewresponder.com` / `ChromeReview2026!`
- [x] Submitted for Review

### Nach neuem Demo-Video:
- [ ] **YouTube Demo URL updaten** im Chrome Web Store
  - Aktuell: https://www.youtube.com/watch?v=6lujm4Z_Q_Y
  - Neu: [TBD - neues Video aufnehmen]

### Pricing-Entscheidung:
- ✅ **KEINE konkreten Preise** im Chrome Web Store (Flexibilität!)
- Nur: "Free: 20 responses/month (no credit card required)"
- Verweis auf Website für Paid Plans

---

## DEMO VIDEOS & UPLOAD CHECKLISTE

### 🎬 PRIORITÄT: Neues Demo Video aufnehmen!

- [ ] **NACH CALL (17.01): Main Demo Video aufnehmen**
  - **WARTE AUF:** One-Click Submit Feature testen (nach Call mit Google Business Account)
  - Scripts: `content/demo-video-script.md` + `content/video-scripts-final.md` + `content/video-15s-ultra.md`
  - Empfehlung: 15s Version ZUERST (70% Completion Rate vs 30%)
  - Extension geladen unter: `chrome-extension/` (v1.7.0)
  - Test-Account: `reviewer@tryreviewresponder.com` / `ChromeReview2026!`

- [ ] **IM CALL: One-Click Submit Feature testen**
  - Mit Google Business User testen (Instant Submit Funktion)
  - Wenn funktioniert: Im Video zeigen "One click. Posted."
  - Wenn nicht: Copy/Paste Flow zeigen (immer noch gut)

- [ ] **GIF für One-Click Feature erstellen**
  - Nur wenn Paste & Submit Test erfolgreich
  - Für Landing Page / Social Media / Chrome Web Store
  - Zeigt "One-Click Submit" Funktion in Action

---

### Verfügbare Videos

| Video                      | Pfad                         | Status                   |
| -------------------------- | ---------------------------- | ------------------------ |
| `walkthrough-video-v2.mp4` | frontend/public/             | Aktuell auf Landing Page |
| `demo-video.mp4`           | frontend/public/             | Backup                   |
| `extension-demo-final.mp4` | content/video-scripts/       | Extension Demo           |
| `demo-video-final.mp4`     | content/video-scripts/       | FALSCHE AUDIO            |
| `extension-demo.mp4`       | scripts/generate-demo-video/ | Alt                      |

### Upload-Ziele

| Plattform                | Video                    | Status   | URL/Notes              |
| ------------------------ | ------------------------ | -------- | ---------------------- |
| **YouTube (ungelistet)** | walkthrough-video-v2.mp4 | [ ] TODO | Für Embedding          |
| **YouTube (ungelistet)** | extension-demo-final.mp4 | [ ] TODO | Für Embedding          |
| **Chrome Web Store**     | extension-demo-final.mp4 | [ ] TODO | Max 30 Sek, 1280x800   |
| **Capterra**             | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing       |
| **G2**                   | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing       |
| **GetApp**               | walkthrough-video-v2.mp4 | [ ] TODO | Software Listing       |
| **Product Hunt**         | walkthrough-video-v2.mp4 | [ ] TODO | Launch Day             |
| **Landing Page**         | walkthrough-video-v2.mp4 | [x] DONE | tryreviewresponder.com |

### Video-Anforderungen pro Plattform

| Plattform        | Max Länge  | Format         | Auflösung |
| ---------------- | ---------- | -------------- | --------- |
| YouTube          | Unbegrenzt | MP4            | 1080p+    |
| Chrome Web Store | 30 Sek     | MP4/WebM       | 1280x800  |
| Capterra         | 3 Min      | YouTube Link   | -         |
| G2               | 2 Min      | YouTube Link   | -         |
| Product Hunt     | 2 Min      | YouTube/Direct | -         |

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

### Chrome Extension v1.6.2 - IM REVIEW

- [x] Extension v1.6.2 submitted (15.01.2026)
- [ ] Wartet auf Chrome Review (1-3 Tage) → BLOCKED
- [ ] Nach Approval: YouTube Demo-Video URL updaten

### Demo Videos (BLOCKED - warte auf One-Click Test)

- [ ] **Video 1:** 15 Sek Extension Demo
  - BLOCKED: Warte auf One-Click Submit Test mit Google Business Account
  - Script ready: `content/video-15s-ultra.md`

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
- [ ] **LinkedIn Verifizierung** - Blauen Badge holen für mehr Vertrauen
  - ⚠️ ID-Scan hat nicht funktioniert (14.01.2026)
  - Alternativen: Arbeitgeber-Verifizierung, Ausbildung-Verifizierung

---

## 🟡 FOLLOW-UP CHECKS

### Morgen (14.01.2026) checken:

- [ ] **Cron Jobs in cron-job.org** - Sollten jetzt funktionieren nach POST→GET Fix
  - daily-outreach (09:00)
  - send-drip-emails (10:00)
  - send-tripadvisor-emails (09:00)

### Täglich prüfen:

- [ ] Outreach Dashboard: Neue Leads? Emails gesendet?
- [ ] Resend: Werden Emails zugestellt? Bounces?
- [ ] Stripe Dashboard: Neue Kunden?

### Wöchentlich prüfen:

- [ ] Google Search Console: Impressionen? Klicks? Keywords?
- [ ] Analytics: Welche Landing Pages konvertieren?

---

## 🟢 HEUTE ERLEDIGT (18.01.2026)

- [x] **Autonome Outreach Session (Abends)**
  - 114 Cold Emails via API gesendet
  - Hot Lead Follow-Up an Tí Cafe Denver (HOT - gestern geklickt)
  - 2-3 LinkedIn Connections gesendet (Husam Alsleman, Kumar's Indian)
  - Outreach Materials dokumentiert: `content/claude-progress/outreach-materials-18-01.md`
  - Chrome Extension: Anonymous Turbo Mode Feature committed

- [x] **Real User = Generated Anywhere** - Neue Definition implementiert
  - `public_try_usage` Tabelle erweitert (session_id, email, converted_to_user_id)
  - `/api/public/try` trackt jetzt alle Session-Infos
  - `/api/admin/stats` + `/api/admin/sales-dashboard` zeigen `viaInstantTry`
  - Definition: responses OR demo_generations OR public_try_usage
  - Doku in CLAUDE.md, dev.md, monitoring.md aktualisiert

- [x] **First Response Guidance Banner** - UX Verbesserung
  - Banner auf Dashboard wenn User 0 Responses hat
  - Bessere Toast Messages bei Registration

- [x] **Demo Video Vorbereitung** - Komplett fertig
  - BEREND-VIDEO-RECORDING-GUIDE.md erstellt
  - 15s-cheatsheet.md für schnelles Recording
  - SFX README mit Pixabay Links
  - Backup Review Texts
  - Demo-Director Agent Status: COMPLETE

## 🟢 ERLEDIGT (17.01.2026)

- [x] **About Founder Section** - Trust-Building auf Landing Page
- [x] **AI Kritik-Handling Evaluation & Fixes** - First Principles Review

## 🟢 ERLEDIGT (16.01.2026)

- [x] **Email System Audit & Fixes** - Kritische Bugs behoben
  - Security: self-set-plan erfordert jetzt ADMIN_SECRET
  - CLICKER30 → DEMO30 (war broken, nicht implementiert)
  - FLASH50 Timeout: 2h → 24h (realistischer)
  - SAVE20 → WELCOME30 als Default
  - sendEmailWithFallback → sendEmail Bug gefixt
  - HTML Templates mit CTA-Buttons für Demo-Emails
  - FRONTEND_URL Fallbacks (8 Stellen) hinzugefügt
- [x] **Amazon SES Admin Card** - Im Email Tab sichtbar als Primary Provider
- [x] **Amazon Seller Email System** - Dediziertes Lead-System (war bereits committed)
  - `amazon_seller_leads` Tabelle
  - Admin Tab "Amazon Sellers"
  - Cron Job `/api/cron/send-amazon-emails`

## 🟢 FRÜHER ERLEDIGT (14.01.2026)

- [x] **Demo Generator implementiert** - Personalisierte Demos für Cold Outreach
  - SerpAPI Integration für Google Review Scraping
  - `POST /api/demo/generate` - Generiert Demo mit AI-Antworten
  - `GET /api/public/demo/:token` - Public Demo Landing Page
  - Frontend: `/demo/:token` Route mit DemoPage Komponente
- [x] **LinkedIn Demo Outreach implementiert** - Personalisierte Connection Notes
  - `POST /api/outreach/linkedin-demo` - Generiert Demo + Connection Note
  - Database: linkedin_outreach erweitert mit demo_token, demo_url, connection_note
- [x] **Admin Secret gespeichert** in `.claude/secrets.local`
- [x] **GOOGLE_PLACES_API_KEY** - Funktioniert! (getestet 14.01.2026)

## 🟢 ERLEDIGT (13.01.2026)

- [x] **Twitter Auto-Post System** - Automatische Tweets für @ExecPsychology
  - Endpoint: `GET /api/cron/twitter-post?secret=...`
  - 5 Kategorien (business_psychology, review_management, etc.)
  - AI-Slop Filter + Tweet-Generierung mit Claude Sonnet
  - **Erster Tweet erfolgreich gepostet!**
- [x] **Click-Tracking für Outreach Emails** - Messbar ob jemand klickt
  - Neuer Endpoint: `/api/outreach/track-click` (Redirect-basiert)
  - UTM-Parameter automatisch hinzugefügt
- [x] **8 neue SEO Landing Pages** - Plattformen und Branchen erweitert
  - Trustpilot, Airbnb, E-Commerce, Real Estate, Gym/Fitness, Veterinarian, Law Firm, Coffee Shop
- [x] **Frontend Redesign mit Gemini MCP** - Komplette Landing Page überarbeitet
- [x] **Review Alert Outreach System** - Personalisierte Emails mit AI-Draft
- [x] **Sales Automation** - DACH-Städte + 4 neue Branchen
- [x] **Reddit Auto-Responder** - Wartet auf API Keys (beantragt)
- [x] **Twitter/X Engagement** - Tweet-Opportunities für manuelles Engagement
- [x] **Blog SEO Verbesserungen** - Internal Linking + Schema.org Markup

## 🟢 ERLEDIGT (12.01.2026)

- [x] **SEO Auto-Pilot Blog** - Automatische Blog-Generierung mit Gemini 2.5 Pro
  - Öffentlicher Blog unter `/blog` und `/blog/:slug`
  - 25 SEO-optimierte Topics, Gemini 2.5 Pro mit Google Search Grounding
- [x] **App Verification** - Homepage, Dashboard, AI Generation getestet
- [x] **Email System auditiert** - Alle 18 Email-Typen geprüft
- [x] **Fehlende Notification Functions** - Usage Alert, Plan Renewal, Weekly Summary

## 🟢 ERLEDIGT (11.01.2026)

- [x] **Video-Platzhalter auf Landing Page** - Extension Demo Preview mit Play-Button in Chrome Extension Section
- [x] **Yelp Scan Reviews gefixt** - CSS-Selektoren für dynamische Klassen aktualisiert
- [x] **Video-Strategie geplant** - 2 Videos (Extension Demo + Full Walkthrough)
- [x] **Chrome Web Store Vorbereitung** - Store Listing + Account vorhanden
- [x] **Dogfooding Section** - "Reviews About Us, Answered By Us"
- [x] **Auto AI-Response für Testimonials** - Bei neuem Testimonial automatisch AI-Antwort

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

| Metrik          | Aktuell | Ziel  |
| --------------- | ------- | ----- |
| Zahlende Kunden | 0       | 30    |
| MRR             | $0      | $1000 |
| Free Users      | 0       | 100+  |

---

## 🔗 Quick Links

| Link                   | URL                                   |
| ---------------------- | ------------------------------------- |
| **Live App**           | https://tryreviewresponder.com        |
| **Backend API**        | https://review-responder.onrender.com |
| **Outreach Dashboard** | Siehe `.claude/secrets.local`         |
| **Render Dashboard**   | https://dashboard.render.com          |
| **Stripe Dashboard**   | https://dashboard.stripe.com          |
| **Resend Logs**        | https://resend.com/emails             |

---

> Bei Fragen: Neue Claude Session starten und CLAUDE.md lesen lassen!
