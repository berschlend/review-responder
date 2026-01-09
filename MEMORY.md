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

## Nächste Schritte für $1000/Monat
1. Automatisiertes Marketing-Script erstellen
2. E-Mail Outreach automatisieren
3. ~25-35 zahlende Kunden gewinnen

## Kontakt User
- Name: Berend Mainz
- GitHub Email: berend.mainz@web.de
- Andere Email: berend.jakob.mainz@gmail.com
