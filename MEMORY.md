# ReviewResponder - Projekt Memory

## Was wurde gebaut
Eine vollständige SaaS-App die KI-generierte Antworten auf Google/Yelp Reviews erstellt.

## Live URLs
- **Frontend**: https://review-responder-frontend.onrender.com
- **Backend API**: https://review-responder.onrender.com

## Tech Stack
- **Frontend**: React, hosted auf Render (Static Site)
- **Backend**: Node.js/Express, hosted auf Render (Web Service)
- **Datenbank**: PostgreSQL (gehostet auf Render)
- **Zahlungen**: Stripe (Live-Modus aktiv)
- **AI**: OpenAI GPT-4o-mini

## Stripe Live Konfiguration
- **Starter Plan**: $29/Monat - Price ID: `price_1Sni0hQfYocZQHxZ7oxDbiVo`
- **Professional Plan**: $49/Monat - Price ID: `price_1Sni18QfYocZQHxZuboFA6Wc`
- **Unlimited Plan**: $99/Monat - Price ID: `price_1Sni1NQfYocZQHxZTq8KNLv8`
- Webhook eingerichtet für automatische Abo-Aktivierung

## Render Environment Variables (Backend)
Diese sind bereits eingetragen:
- `DATABASE_URL` - PostgreSQL Connection String (von Render PostgreSQL)
- `OPENAI_API_KEY` - OpenAI API Key
- `STRIPE_SECRET_KEY` - Live Stripe Secret Key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Live Webhook Secret (whsec_...)
- `STRIPE_STARTER_PRICE_ID` - price_1Sni0hQfYocZQHxZ7oxDbiVo
- `STRIPE_PRO_PRICE_ID` - price_1Sni18QfYocZQHxZuboFA6Wc
- `STRIPE_UNLIMITED_PRICE_ID` - price_1Sni1NQfYocZQHxZTq8KNLv8
- `JWT_SECRET` - Auto-generiert
- `NODE_ENV` - production
- `FRONTEND_URL` - https://review-responder-frontend.onrender.com

## Render Environment Variables (Frontend)
- `REACT_APP_API_URL` - https://review-responder.onrender.com/api

## GitHub Repository
- https://github.com/berschlend/review-responder
- User: berschlend
- Email: berend.mainz@web.de

## Lokaler Projektpfad
`C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder`

## Features
- ✅ User Registration & Login
- ✅ AI Review Response Generation (4 Tone-Optionen)
- ✅ Stripe Subscription Payments
- ✅ Automatische Abo-Aktivierung via Webhook
- ✅ Usage Tracking & Limits (Free: 5, Starter: 100, Pro: 300, Unlimited: ∞)
- ✅ Response History
- ✅ Business Context Personalization (AI nutzt Unternehmensdetails)
- ✅ 50+ Sprachen Support (automatische Spracherkennung)
- ✅ Chrome Extension für 1-Klick Antworten direkt auf Google Maps

## Chrome Extension
Die Extension liegt in `/chrome-extension/` und ermöglicht:
- Login mit bestehendem Account
- 1-Klick Antwort-Generierung direkt auf Google Maps
- "Generate Response" Button bei jeder Bewertung
- Popup für manuelle Eingabe

Installation: Siehe `/chrome-extension/INSTALL.md`

## Bekannte Issues / Gelöst
1. better-sqlite3 funktionierte nicht auf Windows → gewechselt zu sql.js
2. OpenAI Key wurde geleakt → neuer Key erstellt, .gitignore hinzugefügt
3. react-scripts Permission denied → CI=false zum build command hinzugefügt
4. SQLite Daten wurden bei jedem Deploy gelöscht → gewechselt zu PostgreSQL

## PostgreSQL Datenbank Setup (Render)

Die Datenbank muss einmalig auf Render erstellt werden:

### 1. PostgreSQL auf Render erstellen
1. Gehe zu https://dashboard.render.com
2. Klicke "New" → "PostgreSQL"
3. Wähle einen Namen (z.B. "review-responder-db")
4. Region: Frankfurt (EU Central)
5. Plan: Free (oder Starter für bessere Performance)
6. Klicke "Create Database"

### 2. DATABASE_URL zum Backend hinzufügen
1. Warte bis die Datenbank erstellt ist (~1-2 Minuten)
2. Kopiere die "Internal Database URL" (beginnt mit postgres://...)
3. Gehe zu review-responder Backend → Environment
4. Füge neue Variable hinzu:
   - Key: `DATABASE_URL`
   - Value: [Die kopierte Internal URL]
5. Klicke "Save Changes"

### 3. Backend neu deployen
- Das Backend wird automatisch neu deployen
- Beim Start werden alle Tabellen automatisch erstellt
- Bestehende User müssen sich neu registrieren (einmalig)

## Custom Domain einrichten

Um eine eigene Domain (z.B. reviewresponder.app) einzurichten:

### 1. Domain kaufen
- Gehe zu https://www.namecheap.com oder https://domains.google.com
- Kaufe eine Domain (z.B. reviewresponder.app, reviewresponder.io, reviewai.app)
- Kosten: ~10-15€/Jahr

### 2. Domain mit Render verbinden

**Für Frontend:**
1. Render Dashboard → review-responder-frontend → Settings → Custom Domains
2. Klicke "Add Custom Domain"
3. Gib ein: `www.deinedomain.com` und `deinedomain.com`
4. Render gibt dir DNS-Einstellungen

**Für Backend (optional):**
1. Render Dashboard → review-responder → Settings → Custom Domains
2. Füge hinzu: `api.deinedomain.com`

### 3. DNS bei Domain-Registrar einstellen

Gehe zu deinem Domain-Provider und füge diese DNS-Einträge hinzu:

```
Typ: CNAME
Name: www
Wert: review-responder-frontend.onrender.com

Typ: A
Name: @
Wert: (IP von Render, wird im Dashboard angezeigt)

Typ: CNAME
Name: api
Wert: review-responder.onrender.com
```

### 4. Environment Variables updaten

Nach Domain-Setup in Render aktualisieren:
- Backend: `FRONTEND_URL=https://www.deinedomain.com`
- Frontend: `REACT_APP_API_URL=https://api.deinedomain.com/api`

### 5. Stripe Webhook updaten

In Stripe Dashboard den Webhook auf die neue URL ändern:
`https://api.deinedomain.com/api/webhooks/stripe`

---

---

## ENTWICKLUNGSPLAN - Roadmap zu $1000/Monat

### Ziel: ~25-35 zahlende Kunden (bei durchschnittlich $35/Kunde)

---

### PHASE 1: Produkt-Stabilität (Aktueller Stand)
- [x] Core Features fertig (AI-Responses, Multi-Language, Tones)
- [x] Stripe Payments funktionieren (Live-Modus)
- [x] Chrome Extension erstellt
- [x] PostgreSQL für persistente Daten
- [ ] **Erste echte User-Tests durchführen**
- [ ] **Bugs aus User-Feedback fixen**

### PHASE 2: Conversion-Optimierung
- [ ] Landing Page A/B Testing (Headline, CTA)
- [ ] Social Proof hinzufügen (Testimonials, User Count)
- [ ] Demo-Video auf Landing Page
- [ ] Trust Badges (SSL, Secure Payment)
- [ ] Exit-Intent Popup mit Discount
- [ ] Email-Capture für nicht-konvertierende Besucher

### PHASE 3: Feature-Erweiterungen (Value Adds)
- [ ] **Bulk Response Generation** (mehrere Reviews auf einmal)
- [ ] **Review Analytics Dashboard** (Sentiment-Analyse)
- [ ] **Email Notifications** bei neuen Reviews
- [ ] **Team/Multi-User Accounts**
- [ ] **API Access** für Enterprise-Kunden
- [ ] **Yelp/TripAdvisor Integration** (nicht nur Google)
- [ ] **Response Templates** speichern & wiederverwenden
- [ ] **Brand Voice Training** (AI lernt den eigenen Stil)

### PHASE 4: Marketing & Growth
- [ ] SEO-optimierte Blog-Artikel
- [ ] LinkedIn Outreach zu Restaurant/Hotel-Ownern
- [ ] Google Ads Kampagne ($50-100 Test-Budget)
- [ ] Product Hunt Launch
- [ ] AppSumo Lifetime Deal (für schnelle Einnahmen)
- [ ] Affiliate-Programm starten
- [ ] Cold Email Kampagne an lokale Businesses

### PHASE 5: Skalierung
- [ ] Custom Domain (reviewresponder.app o.ä.)
- [ ] Chrome Web Store Veröffentlichung
- [ ] Referral-System (Kunden werben Kunden)
- [ ] Enterprise-Tier mit Custom Pricing

---

## Für neue Claude Code Sessions

**WICHTIG:** Bei jedem neuen Kontext-Fenster diese Datei zuerst lesen lassen!

### Quick-Start Prompt für neue Sessions:
```
Lies bitte C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\MEMORY.md
und fahre mit der Entwicklung fort. Aktueller Stand und nächste Aufgaben
sind dort dokumentiert.
```

### Parallel Sessions in Claude Desktop:
Ja, du kannst mehrere Claude Code Sessions parallel laufen lassen:
1. Öffne mehrere Terminal-Fenster
2. Starte in jedem `claude` mit dem Quick-Start Prompt
3. Jede Session sollte an einem anderen Task arbeiten (z.B. eine macht Frontend, eine Backend)
4. **WICHTIG:** Beide sollten diese MEMORY.md lesen UND updaten wenn sie fertig sind

### Aktuelle Prioritäten (Update bei jeder Session):
**Stand: 09.01.2026**
1. PostgreSQL Datenbank wurde gerade eingerichtet - TESTEN ob alles funktioniert
2. Chrome Extension testen
3. Ersten echten User-Test durchführen
4. Bugs dokumentieren und fixen

### Bekannte offene Todos:
- [ ] Testen: Registrierung mit neuer PostgreSQL DB
- [ ] Testen: Login funktioniert
- [ ] Testen: Response-Generierung funktioniert
- [ ] Testen: Stripe Payment Flow
- [ ] Testen: Chrome Extension mit Live-Backend

---

## Alte Sektion (für Referenz)

## Kontakt User
- Name: Berend Mainz
- GitHub Email: berend.mainz@web.de
- Andere Email: berend.jakob.mainz@gmail.com
