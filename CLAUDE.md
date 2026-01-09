# ReviewResponder - Projektkontext für Claude

> Diese Datei wird automatisch von Claude Code gelesen. Für aktuelle Tasks siehe MEMORY.md

## Projekt

**ReviewResponder** - SaaS für KI-generierte Review-Antworten
- **Ziel:** $1000/Monat durch ~30 zahlende Kunden
- **Status:** Live & funktionsfähig

## URLs

| Service | URL |
|---------|-----|
| Frontend | https://review-responder-frontend.onrender.com |
| Backend | https://review-responder.onrender.com |
| GitHub | https://github.com/berschlend/review-responder |

## Tech Stack

- **Frontend:** React (Render Static Site)
- **Backend:** Node.js/Express (Render Web Service)
- **Datenbank:** PostgreSQL (Render)
- **Payments:** Stripe (Live)
- **AI:** OpenAI GPT-4o-mini
- **Email:** Resend.com

## Projektstruktur

```
ReviewResponder/
├── frontend/src/App.js    # React App (Landing, Dashboard, Auth)
├── backend/server.js      # Express API
├── chrome-extension/      # Browser Extension
├── MEMORY.md              # Aktuelle Tasks & Changelog
└── CLAUDE.md              # Diese Datei
```

## Wichtige Regeln

1. **Immer MEMORY.md zuerst lesen** - Dort sind aktuelle Tasks
2. **Nach Änderungen committen & pushen** - Render deployed automatisch
3. **MEMORY.md updaten** - Nach erledigten Tasks
4. **Keine Fake-Daten** - Kein Fake Social Proof, keine erfundenen Testimonials
5. **User fragen bei wichtigen Entscheidungen**

## Features (Fertig)

- User Auth (Register, Login, Password Reset)
- AI Response Generation (4 Tones, 50+ Sprachen)
- Stripe Payments (Monthly & Yearly)
- Chrome Extension mit Google Maps Preview
- Privacy Policy & Terms of Service
- Exit-Intent Popup mit Rabatt
- Demo-Video Section (Placeholder)

## Stripe Preise (Live)

| Plan | Monthly | Price ID |
|------|---------|----------|
| Starter | $29 | `price_1Sni0hQfYocZQHxZ7oxDbiVo` |
| Professional | $49 | `price_1Sni18QfYocZQHxZuboFA6Wc` |
| Unlimited | $99 | `price_1Sni1NQfYocZQHxZTq8KNLv8` |

## Kontakt

- **User:** Berend Mainz
- **Email:** berend.mainz@web.de

---

**Für aktuelle Aufgaben immer `MEMORY.md` lesen!**
