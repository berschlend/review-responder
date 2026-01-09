# ReviewResponder - Projekt Memory

## Was wurde gebaut
Eine vollständige SaaS-App die KI-generierte Antworten auf Google/Yelp Reviews erstellt.

## Live URLs
- **Frontend**: https://review-responder-frontend.onrender.com
- **Backend API**: https://review-responder.onrender.com

## Tech Stack
- **Frontend**: React, hosted auf Render (Static Site)
- **Backend**: Node.js/Express, hosted auf Render (Web Service)
- **Datenbank**: SQLite (sql.js)
- **Zahlungen**: Stripe (Live-Modus aktiv)
- **AI**: OpenAI GPT-4o-mini

## Stripe Live Konfiguration
- **Starter Plan**: $29/Monat - Price ID: `price_1Sni0hQfYocZQHxZ7oxDbiVo`
- **Professional Plan**: $49/Monat - Price ID: `price_1Sni18QfYocZQHxZuboFA6Wc`
- **Unlimited Plan**: $99/Monat - Price ID: `price_1Sni1NQfYocZQHxZTq8KNLv8`
- Webhook eingerichtet für automatische Abo-Aktivierung

## Render Environment Variables (Backend)
Diese sind bereits eingetragen:
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

## Bekannte Issues / Gelöst
1. better-sqlite3 funktionierte nicht auf Windows → gewechselt zu sql.js
2. OpenAI Key wurde geleakt → neuer Key erstellt, .gitignore hinzugefügt
3. react-scripts Permission denied → CI=false zum build command hinzugefügt

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

## Nächste Schritte für €1000/Monat
1. Marketing-Content generieren (AUTO_MARKETING.bat)
2. Content auf Medium, LinkedIn, Twitter posten
3. ~25-35 zahlende Kunden gewinnen

## Kontakt User
- Name: Berend Mainz
- GitHub Email: berend.mainz@web.de
- Andere Email: berend.jakob.mainz@gmail.com
