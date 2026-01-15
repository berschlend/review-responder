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
5. **Nach Deploy:** "Deployed! Frontend/Backend live in ~2-3 Min"

### Workflow
```
CLAUDE.md lesen → TODO.md checken → Task → Testen → Git push → CLAUDE.md updaten
```

### Wichtige Dateien
- **CLAUDE.md** - Technische Docs, Code Style
- **TODO.md** - Aktuelle Tasks, Prioritäten
- **`.claude/secrets.local`** - Admin URLs, API Keys (lokal)

---

## PROJECT TIMELINE

> **Projekt-Start:** 10. Januar 2026 (~5 Tage alt)
> **Aktuelle Phase:** Launch & First Customers

### Meilensteine

| Datum | Meilenstein | Status |
|-------|-------------|--------|
| 10.01.2026 | Projekt gestartet | ✅ |
| 13.01.2026 | Chrome Extension eingereicht | ✅ |
| 14.01.2026 | Conversion System 2.0 live | ✅ |
| TBD | Erster zahlender Kunde | ⏳ |
| TBD | $100 MRR erreicht | ⏳ |
| TBD | $1000 MRR Ziel | ⏳ |
| TBD | Chrome Extension approved | ⏳ |

### Projekt-Alter berechnen
- **Tag 1:** 10.01.2026
- **Heute:** Dynamisch (Claude checkt aktuelles Datum)
- **Formel:** Heute - 10.01.2026 = Projekt-Alter in Tagen

---

## MCPs & TOOLS

| MCP | Beschreibung |
|-----|--------------|
| Memory MCP | Persistentes Gedächtnis |
| Gemini Design MCP | Frontend outsourcen |
| Chrome MCP | Browser Automation (`claude --chrome`) |

### Chrome MCP Regel
> Im Plan Mode **IMMER** markieren: **🌐 CHROME MCP: JA/NEIN**

### Chrome Tab Management (NEU 15.01.2026)

**Problem:** Parallele Claude Sessions teilen dieselbe Tab-Gruppe = Chaos.

**Lösung:** Session-basiertes Tab Tracking mit Auto-Cleanup.

#### Bei Session-Start (`claude --chrome`):
```powershell
# 1. Session setzen (BEVOR claude startet!)
$env:CLAUDE_SESSION = "1"  # oder "2", "RR", etc.
claude --chrome

# 2. In Claude: /chrome-init ausführen
```

#### Während der Session:
```powershell
# Nach JEDEM neuen Tab oder Navigate:
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action register -TabId "[ID]" -TabUrl "[URL]"
```

#### Bei Session-Ende:
- Stop-Hook ruft automatisch Tab-Cleanup auf
- Oder manuell: `/chrome-cleanup`

#### Protected Tabs (werden NIE geschlossen):
- `*linkedin.com*` - Login-Sessions
- `*gmail.com*`, `*mail.google.com*` - Email
- `*stripe.com*` - Payments
- `*render.com*` - Deployment
- `*github.com*` - Code
- `*cron-job.org*` - Cron Jobs

#### Tab Status checken:
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\chrome-tab-manager.ps1" -Action status
```

#### Stale Sessions (>30 min inaktiv):
- Werden beim Status-Check angezeigt
- Können manuell bereinigt werden

---

## CODE STYLE

### TypeScript
- NIEMALS `any` oder `enum` - nutze String Unions
- Alle Funktionen brauchen Return-Types

### React
- Functional Components only
- Props typisieren, Hooks für State
- Event Handler: `handle` Prefix

### Naming
- Components: PascalCase
- Hooks: `use` Prefix
- Constants: SCREAMING_SNAKE_CASE

### Git Commits
`feat:` | `fix:` | `chore:` | `docs:` | `refactor:`

---

## LIVE URLS

| Service | URL |
|---------|-----|
| Frontend | https://tryreviewresponder.com |
| Backend | https://review-responder.onrender.com |
| GitHub | https://github.com/berschlend/review-responder |

### Service Dashboards
- **Render:** dashboard.render.com
- **Stripe:** dashboard.stripe.com
- **Cron-job.org:** console.cron-job.org
- **Resend:** resend.com/emails

---

## CRON JOBS (cron-job.org)

| Job | Schedule |
|-----|----------|
| Keep-Alive | */15 * * * * |
| Blog Generation | 06:00 Mo/Mi/Fr |
| Scraper Alerts | 08:00 täglich |
| Demo Generation | 08:00 täglich |
| Twitter Auto-Post | 09:00 täglich |
| Daily Outreach | 09:00 täglich |
| Weekly Summary | 09:00 Montags |
| Drip Emails | 10:00 täglich |
| Pre-Reg Drip | 11:00 täglich |
| Demo Follow-Up | 12:00 täglich |
| **Night Loop** | **22:00-06:00 stündlich** |

### Night Automation (NEU 14.01.2026)
Läuft autonom ohne User-Input:
- **22:00** - Hot Lead Follow-Ups (Demos für Klicker)
- **23:00** - Second Follow-Up ("1 Monat gratis")
- **00:00** - Stats Collection
- **01:00** - Dead Lead Revival ("Problem solved?")
- **02:00** - A/B Test Evaluation
- **03:00-06:00** - Idle

**Endpoints:**
- `/api/cron/night-loop` - Master Endpoint (orchestriert alles)
- `/api/cron/revive-dead-leads` - Reaktiviert 7+ Tage alte Leads
- `/api/cron/ab-test-evaluate` - Bewertet A/B Tests automatisch

---

## CURRENT TASKS

**Stand: 14.01.2026**

### Chrome Web Store
**Status:** Überprüfung läuft (eingereicht 13.01)
- Extension v1.6.1
- Test Account: reviewer@tryreviewresponder.com

### USER TODO:
- [ ] Demo-Videos aufnehmen (Main 60s, Extension 30s, Bulk 30s)
- [ ] Reddit API Keys holen
- [ ] Google Indexierung für 36 URLs (5-10/Tag)
- [ ] Snov.io API Keys in Render

### SEO Landing Pages
- **46+ live** (Plattformen + Branchen)
- Email-Capture → 4-Email Drip über 14 Tage

### Outreach Metriken (14.01 Nacht 22:30 UTC)
- **1,988 Leads** (+1,460 heute!)
- **572 Emails** gesendet
- **23 Clicks** (4.0% CTR) - +6 heute
- **22 Hot Leads** - aktiv engagiert
- **0 Conversions** ← Conversion Fixes deployed!

**Session-Ergebnis:**
- Exit Intent Popup mit 30% Discount
- Email Subjects mit Star-Rating (A/B Winner: 100%)
- Response Gate: nur 1 Response sichtbar
- Auto-Redirect nach Email-Capture

---

## LINKEDIN OUTREACH STATUS (14.01.2026)

> **WICHTIG für neue Claude Sessions:** Diese Daten VOR LinkedIn-Aktionen checken!

### Pending Connections (DB: `linkedin_leads`)
| Name | Company | Demo URL | Connection Sent |
|------|---------|----------|-----------------|
| Max T. | Nachtcafé Dortmund | rr-demo-6f4a2d | **JA (14.01)** |
| Bjoern F. | Augustiner Klosterwirt | rr-demo-7b3e8c | **JA (14.01)** |
| Issa | Oceans Kassel | rr-demo-8a2f5d | **JA (14.01)** |
| Katharina P. | Augustiner am Platzl | rr-demo-9c1d4e | **JA (14.01)** |
| Lena F. | Luisenbad | rr-demo-3e7b2a | **JA (14.01)** |

**ACHTUNG:** DB-Feld `connection_sent` ist NICHT zuverlässig!
→ IMMER LinkedIn direkt checken unter: linkedin.com/mynetwork/invitation-manager/sent/

### Follow-Up Workflow
1. **Gesendete Invitations checken** → linkedin.com/mynetwork/invitation-manager/sent/
2. **Accepted?** → Wenn ja: Follow-Up Message mit Demo-URL senden
3. **DB updaten:** `PUT /api/outreach/linkedin-demo/[ID]/accepted`

### LinkedIn API Limits (KRITISCH!)
- MAX 20-25 Connection Requests/Tag
- MAX 100 Connection Requests/Woche
- MAX 50-100 Messages/Tag
- Bei Warnung: SOFORT STOPPEN!

---

## LEARNINGS

### Email Deliverability
- "Hey" statt "Hallo" → Primary Inbox
- Keine Emojis, keine Marketing-Floskeln

### AI Response Qualität (Anti-Slop System)

**Datei:** `backend/server.js` → `generateDemoResponse()`
**Blacklist:** `backend/promptExamples.js` → `AI_SLOP_PHRASES`, `AI_SLOP_WORDS`

**Core Principles:**
1. Reviewer BY NAME ansprechen (firstName extrahieren)
2. EINE spezifische Sache aus Review referenzieren
3. VOLLER Business Name am Ende (" - Business Name")
4. Kurz: 1-2 Sätze (positiv), 2-3 Sätze (negativ)
5. Keine Exclamation Marks, immer Contractions

**Blacklisted Phrases (instant rejection):**
- Gratitude Slop: "Thank you for your feedback", "We appreciate..."
- Corporate Speak: "We strive to...", "Your satisfaction is our priority"
- Emotional: "thrilled", "delighted", "amazing", "wonderful"
- Claude-spezifisch: "hit the spot", "glad it worked out", "good to hear", "swing by"

**Mental Model im Prompt:**
> "Imagine: You just read this review on your phone while waiting for coffee.
> You have 20 seconds to tap out a quick response. What would you actually type?"

**Before/After Examples:**
- "Thank you for your feedback" → [delete - just respond]
- "We're thrilled" → "Nice" oder "Glad"
- "We sincerely apologize" → "That's on us"
- "looking forward to seeing you" → "See you next time"

**Gute Response-Patterns:**
- "The mushroom risotto is our chef's favorite too."
- "45 minutes is way too long. That's on us."
- "Fair point about the noise. We're looking at that."

### API Limits (KRITISCH 14.01.2026!)
- **SerpAPI: 960% ÜBER LIMIT** ← Demo-Generierung schlägt fehl!
- **Outscraper: 500/Monat** (Primary, auch am Limit)
- Google Places: nur 5 Reviews → nicht nutzbar
- Hunter.io: 25/Monat → Website Scraper als Primary

**WORKAROUND wenn APIs am Limit:**
1. TripAdvisor Scraping funktioniert noch (`/scrape-leads`)
2. Chrome MCP für manuelles Scraping (instabil aber möglich)
3. Demo-Generierung ohne Reviews → Fallback-Template

---

## TECH STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | React (Render) |
| Backend | Node.js/Express (Render) |
| DB | PostgreSQL (Render) |
| Payments | Stripe |
| AI | GPT-4o-mini + Claude Sonnet + Gemini 2.5 |
| Email | Resend + Brevo |

---

## PLAN LIMITS

| Plan | Smart | Standard | Total |
|------|-------|----------|-------|
| Free | 3 | 17 | 20 |
| Starter $29 | 100 | 200 | 300 |
| Pro $49 | 300 | 500 | 800 |
| Unlimited $99 | ∞ | ∞ | ∞ |

### Feature Gating
- **Free:** Chrome Extension only
- **Starter+:** History, Export
- **Pro+:** Bulk, Analytics, Teams
- **Unlimited:** API Access

---

## API ENDPOINTS

### Core
- `POST /api/generate` - Single
- `POST /api/generate-bulk` - Bulk (Pro+)
- `GET /api/stats` | `GET /api/responses/history`

### Auth
- `POST /api/auth/register|login|google`
- `POST /api/auth/forgot-password|reset-password`

### Billing
- `POST /api/billing/create-checkout|portal`

### Admin
- `GET /api/admin/stats|set-plan|api-costs|scraper-status`

### Outreach
- `GET /api/cron/daily-outreach|demo-followup|scraper-alerts`

---

## COMPLETED FEATURES

### Core
- Auth (Email + Google OAuth)
- AI Generation (4 Tones, 50+ Languages)
- Hybrid AI, Templates, Bulk

### Premium
- Analytics, Teams, API Keys
- SEO Blog Generator

### Chrome Extension v1.6.1
- Google Maps, Yelp, TripAdvisor, Booking, Facebook, Trustpilot
- One-Click Response, Business Context

### Marketing Automation
- Daily Outreach + Drip Emails (VOLLAUTOMATISCH)
- Demo Generation + Follow-Up (VOLLAUTOMATISCH)
- Twitter Auto-Post (VOLLAUTOMATISCH)
- LinkedIn Outreach (SEMI-MANUELL - siehe unten)
- Click/Open Tracking (VOLLAUTOMATISCH)

### Automation Status (15.01.2026)
**VOLLAUTOMATISCH (läuft 24/7):**
- Daily Outreach, Drip Emails, Demo Follow-Up, Twitter, Blog Generation
- **Night-Blast** - Lead Scraping + Email Finding + Outreach (21:00, 01:00, 05:00 UTC)
- **Night-Loop** - Hourly Tasks via node-cron:
  - Hour 0 (23:00 UTC): Demo Expiration Emails (Day 3, Day 5)
  - Hour 2 (01:05 UTC): Magic Link Re-Engagement für Hot Leads

**SEMI-MANUELL (erfordert `claude --chrome`):**
- `/linkedin-connect` - Demos werden auto-generiert, Connection Requests manuell
- `/scrape-leads` - TripAdvisor Scraping
- `/g2-miner` - G2 Competitor Mining
- `/yelp-audit` - Yelp Lead Auditing

---

## NACHT-LOG 15.01.2026 23:10 UTC

**Session:** Night Blast (Second Wave)
**Aktionen:**
1. **Magic Link Re-Engagement** - 11 neue Emails an Hot Leads
   - `/api/cron/reengage-clickers` getriggert
   - Alle unregistrierten Clicker bekamen Magic Links
2. **🎉 10 NEUE USER-REGISTRIERUNGEN via Magic Links!**
   - The Smith (New York), Sphere Tim Raue (Berlin)
   - Komodo Miami, Augustiner Klosterwirt (München)
   - Madame Brasserie (Paris), Zurich Marriott
   - Romano Law (New York), AWAY SPA (Edinburgh)
   - 25hours Hotel (Zürich), Bullring (Birmingham)
3. **Outreach Blast** - 50 Emails gesendet (Daily Limit erreicht)
   - 648 Total Emails gesendet (Session Start: 572)
   - 376 Leads kontaktiert (Session Start: 301)
4. **TripAdvisor Lead Import** - House of Food Porn (Miami)
5. **LinkedIn Check** - 1 pending (Bjoern Hiller, Block House)

**Metriken (23:10 UTC):**
- 1992 Leads (+4)
- 495 Leads mit Email (+31)
- 648 Emails gesendet (+76)
- 23 Clicks (stabil)
- 10 neue Registrierungen (via Magic Links!)
- 0 Zahlende Kunden (noch nicht)

**Erkenntnisse:**
- Magic Links funktionieren - Users werden auto-registriert
- ABER: Keiner hat das Produkt noch aktiv genutzt (response_count: 0)
- Nächster Schritt: Warten auf User-Aktivität oder Onboarding-Nudge implementieren

---

## NACHT-LOG 15.01.2026 ~22:30

**Session:** Sales Automation Setup + Chrome MCP Debugging

**Aktionen:**
1. **Night Loop Cron verifiziert** - Läuft bereits stündlich (`0 * * * *`)
   - Alle 8 Stunden-Jobs bereits konfiguriert bei cron-job.org
   - Hot Lead Follow-Ups, Dead Lead Revival, A/B Tests laufen autonom
2. **Chrome MCP Tab-Chaos diagnostiziert**
   - Problem: Alle Claude Sessions teilen dieselbe Tab-Gruppe
   - Lösung dokumentiert in globaler CLAUDE.md:
     - Option 1: Nur EINE Session nutzt Chrome MCP
     - Option 2: Separate Chrome Profile pro Session
3. **Lead-Scraping abgebrochen** (Chrome MCP instabil)
   - LinkedIn, TripAdvisor, G2 Tasks verschoben auf stabile Session

**Metriken (Status Check ~21:17):**
- 644 Leads total
- 391 mit Email
- 499 Emails gesendet
- 18 Clicks (3.6% Click Rate)
- 17 Hot Leads (haben geklickt!)
- 0 Conversions

**Erkenntnis:** Chrome MCP braucht Session-Isolation für Boris Flow.
**TODO:** Parallele Chrome Sessions mit separaten Profilen testen.

---

## NACHT-LOG 15.01.2026 01:45

**Session:** Night Blast (Continued)
**Aktionen:**
1. **Re-Engagement Blast** - 29 Magic Link Emails an Hot Leads gesendet
   - `/api/cron/reengage-clickers` 3x getriggert
   - Alle 23 Clickers + neue bekommen Magic Login Links
2. **V2 Conversion Gates Validiert** - Alles funktioniert:
   - Nur 1 Response sichtbar (Rest hinter Email-Gate)
   - Copy-Button triggert Email-Modal
   - Auto-Redirect zu /register nach Email-Eingabe
   - Email wird pre-filled, Discount wird angezeigt
3. **TripAdvisor Scraping** - 14 neue Leads mit Email:
   - Miami (6): Barsecco, Mayami Wynwood, Café La Trova, Marabu, ADRIFT Mare, House of Food Porn
   - Amsterdam (4): Arles, Restaurant Red, The Pantry, Midtown Grill
   - Denver (4): Buckhorn Exchange, Anise Vietnamese, Marco's Coal-Fired, Izakaya Den
4. **LinkedIn Check** - 1 ausstehende Einladung (Bjoern Hiller, Block House)

**Metriken (01:45 UTC):**
- 19 User (11 neu via Magic Links)
- 7 Aktiviert (36.8% Activation Rate)
- 448 Total Responses
- 0 Zahlende Kunden

**Erkenntnis:** Magic Link Users registrieren sich aber nutzen Produkt nicht aktiv.
**TODO:** Onboarding-Nudge Email implementieren

---

## KÜRZLICH ERLEDIGT (15.01 Nacht)

- **Magic Link Authentication System** - Passwordless Login für Hot Leads
  - `GET /api/auth/magic-login/:token` - Auto-create Account + JWT Login
  - `POST /api/auth/create-magic-link` - Generate 7-day valid token
  - Frontend: `/magic-login` Route mit auto-redirect zu Dashboard
  - Click-Tracking: `reengagement_emails.clicked_at`

- **Re-Engagement Cron** - Automatische Magic Links für unregistrierte Clicker
  - `GET /api/cron/reengage-clickers` - Findet Hot Leads die nicht registriert sind
  - DE/EN Email Detection basierend auf Stadt
  - Läuft automatisch um 01:05 UTC (02:05 Berlin)

- **Demo Expiration System** - Urgency Emails für expirierende Demos
  - `GET /api/cron/demo-expiration-emails`
  - Day 3: "Your demo expires in 4 days"
  - Day 5: "Last chance - demo expires tomorrow"
  - Day 7+: Demo marked as expired, Frontend zeigt "Expired" State
  - Läuft automatisch um 23:00 UTC (00:00 Berlin)

- **Dashboard Stats erweitert** - Magic Link & Demo Expiration Tracking
  - `magic_links`: sent, clicked, converted
  - `demo_expiration`: total, expired, day3_sent, day5_sent

- **Internal Scheduler** - node-cron für komplette Autonomie
  - Night-Loop läuft jetzt ohne externe cron-job.org
  - Alle Tasks vollautomatisch über Nacht

---

## KÜRZLICH ERLEDIGT (15.01 Früh)

- **TripAdvisor Boston Scraping** - 4 neue Leads mit Email:
  - Terramia Ristorante (terramia93@gmail.com)
  - Antico Forno (office@anticofornoboston.com)
  - Carmelinas (info@carmelinasboston.com)
  - Mamma Maria (info@mammamaria.com)
- **LinkedIn Connection Requests gesendet** - 5 deutsche Restaurant-Owner
  - Alle haben personalisierte Demo-URLs bekommen
  - DB-Feld `connection_sent` ist NICHT zuverlässig → LinkedIn direkt checken!
- **CLAUDE.md dokumentiert** - LinkedIn Status + API Limits für zukünftige Sessions
- **API Limit Problem** - SerpAPI bei 960%, alle Hot Lead Demos schlugen fehl
  - 14 Hot Leads konnten keine Demos bekommen (keine Reviews)
  - Workaround: TripAdvisor + manuelles Scraping

---

## KÜRZLICH ERLEDIGT (14.01 Nacht - Spät)

- **Demo Page Conversion Gates v2** - Verbesserte Conversion nach First-Principles Analyse
  - **Problem:** 17 Hot Leads klickten, 0 Conversions - Email-Gate wurde ignoriert
  - **Fix 1: Auto-Redirect zu Signup** - Nach Email-Eingabe → 2s delay → Redirect zu /register?email=...
  - **Fix 2: Nur 1 Response sichtbar** - Statt 2 jetzt nur 1, Rest hinter "Unlock with Email"
  - **Fix 3: Email Pre-Fill** - RegisterPage akzeptiert jetzt `?email=` Parameter
  - **Root Cause:** User bekamen vollen Wert (3 Responses sichtbar) ohne zu konvertieren
  - **Neue Commits:** 24fa5a8f, ddde24f5 - Live & getestet

- **Demo Page Conversion Gates v1** - Initial Implementation
  - **Fix 1: Email-Gate für Copy** - Modal erscheint bei Klick auf "Copy"
  - **Fix 2: 24h Countdown Timer** - "30% OFF expires in HH:MM:SS"
  - Neuer Endpoint: `POST /api/public/demo-email-capture`
  - Captured Emails werden als `warm_lead` in outreach_leads gespeichert

---

## KÜRZLICH ERLEDIGT (14.01 Nacht)

- **Night Automation System** - Läuft autonom die ganze Nacht ohne Chrome/Input
  - `/api/cron/night-loop` - Master Endpoint orchestriert alle Nacht-Aktionen
  - `/api/cron/revive-dead-leads` - Reaktiviert 7+ Tage alte Leads
  - `/api/cron/ab-test-evaluate` - Automatische A/B Test Auswertung
  - A/B Testing Tabelle + Admin Endpoints
  - Erster A/B Test erstellt: "Subject Line - Personal vs Business"
  - **USER TODO:** Night Loop Cron bei cron-job.org einrichten (22:00-06:00 UTC)

---

## KÜRZLICH ERLEDIGT (14.01 Abend)

- **Hot Lead Auto-Demo System** - Personalisierte Demos für Clicker
  - `/api/cron/followup-clickers` generiert jetzt automatisch Demos
  - Demo mit echten Reviews + AI Responses direkt in Follow-Up Email
  - Neuer Endpoint `/api/admin/send-hot-lead-demos` für bestehende Hot Leads
  - Fallback Email wenn Demo-Generierung fehlschlägt
- **Second Follow-Up verbessert** - Inkludiert Demo-URL wenn vorhanden
  - "Last chance" Messaging mit 1 Monat Free Offer
  - German/English Detection bleibt erhalten
- **Demo Page Sticky CTA** - Conversion-Optimierung
  - Sticky Bar am unteren Rand für alle Geräte (nicht nur Mobile)
  - 30% OFF Badge prominent sichtbar
  - "Start Free Trial" statt generischem CTA
- **API Limit Problem erkannt** - SerpAPI bei 960% vom Limit
  - Outscraper ist Primary, aber beide APIs scheinen am Limit
  - Neue Demos werden ohne Reviews generiert
  - TODO: Mehr API Keys oder alternative Scraping-Methode

---

## KÜRZLICH ERLEDIGT (14.01 Vormittag)

- **Conversion Funnel für Ersten Sale** - 3 Quick Wins implementiert:
  - Welcome Email mit WELCOME30 (30% off, 7-Tage Urgency)
  - Demo Auto-Discount: ?discount=DEMO30 automatisch in CTA-Links
  - Micro-Pricing Toast bei Response 15-19 ("Get 10 for $5")
  - Neue Stripe Coupons: WELCOME30, DEMO30 (beide 30% off)
- **Smart Email Finding** - Personal Emails statt info@/contact@
  - Team Member Extraktion von /team, /about Seiten
  - `generatePersonalEmails()` - Name→Email Patterns (firstname@, firstname.lastname@)
  - Umlaut-Handling (ä→ae, ö→oe, ü→ue, ß→ss)
  - `isValidPersonName()` mit Blacklist (filtert "and CEO" etc.)
  - Email-Priorisierung: Personal > Generic
  - Bug-Fix: Owner-Patterns nutzen jetzt auch die Name-Validierung
- **Test-Daten Bereinigung** - Admin Endpoints zum Cleanup von Metriken
  - `/api/admin/cleanup-test-data` - Entfernt Test-Accounts, Emails, Clicks
  - `/api/admin/reset-test-opens` - Setzt Test-Opens zurück
  - Erkannt: 26% "Open Rate" sind Bot-Scans (3 Sek nach Versand)
  - Echte Metrik: 3.4% Click Rate (17 echte Klicks)
- **Direct Review Links auf Demo Pages** - Jede Review verlinkt jetzt direkt zur echten Google Review!
  - Outscraper API: `review_link` und `review_id` werden jetzt extrahiert
  - SerpAPI Fallback: `link` wird extrahiert
  - Frontend: "View This Review on Google" statt allgemeiner Link
  - Automatisch für alle zukünftigen Demos (Daily Outreach, LinkedIn, Manual)
- **Loading Animation Fix** - `.animate-spin` CSS Klasse hinzugefügt
- **Rate Limit → CTA Scroll** - Bei "Daily limit reached" scrollt automatisch zur Signup-Section
- **Conversion System 2.0** - Free→Paid Conversion verbessern:
  - Usage Analytics Tab im Admin Panel (Distribution, Stats, Exit Surveys)
  - Upgrade Modal bei 20 Response Limit (statt nur Toast)
  - Exit Survey Tracking (warum User nicht upgraden)
  - Micro-Pricing: $5 für 10 Responses (Stripe: `price_1SpQPRQfYocZQHxZNiEwUKl0`)
- Google Indexierung: 2 URLs beantragt
- 2 Cron Jobs angelegt (Demo Follow-Up, Scraper Alerts)
- Sales Automation Blast (13 Städte, +210 Leads)
- API Costs Dashboard
- Multi-Fallback Email System

---

## PROJEKT-STRUKTUR

```
ReviewResponder/
├── frontend/          # React App
├── backend/           # Express API (server.js)
├── chrome-extension/  # Browser Extension
├── content/           # Marketing, Leads
├── .claude/
│   ├── settings.json
│   ├── commands/      # Slash Commands
│   └── secrets.local  # API Keys (lokal)
├── CLAUDE.md
└── TODO.md
```

---

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

> **Nach jeder Session:** CURRENT_TASKS updaten, Datum ändern!
