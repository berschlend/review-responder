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

**Stand: 09.01.2026 - 19:30 Uhr**

### 🔴 USER MUSS MACHEN (Nicht für Claude):
- [ ] Resend.com Account erstellen + RESEND_API_KEY in Render eintragen
- [ ] Stripe Yearly Prices erstellen + Price IDs in Render eintragen

### 🟡 NÄCHSTE CLAUDE TASKS (Wähle einen):

| # | Task | Schwierigkeit | Dateien |
|---|------|---------------|---------|
| 1 | Social Proof auf Landing Page (User Count, Testimonials) | Einfach | `frontend/src/App.js` |
| 2 | Trust Badges hinzufügen (SSL, Secure Payment Icons) | Einfach | `frontend/src/App.js`, `App.css` |
| 3 | Demo-Video Section auf Landing Page | Mittel | `frontend/src/App.js` |
| 4 | Bulk Response Generation (mehrere Reviews auf einmal) | Schwer | `backend/server.js`, `frontend/src/App.js` |
| 5 | Response Templates speichern & wiederverwenden | Mittel | `backend/server.js`, `frontend/src/App.js` |
| 6 | SEO Meta Tags & Open Graph optimieren | Einfach | `frontend/public/index.html` |

### ✅ HEUTE ERLEDIGT:
- [x] PostgreSQL Migration (Daten persistent)
- [x] Password Reset Flow mit Resend.com
- [x] Jahres-Abos mit 20% Rabatt
- [x] Regenerate Button für andere Tones
- [x] Chrome Extension Fixes
- [x] API Tests (alle bestanden)

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
| GET | `/api/user/stats` | Usage Stats |
| GET | `/api/user/history` | Response History |
| POST | `/api/create-checkout-session` | Stripe Checkout |
| POST | `/api/webhooks/stripe` | Stripe Webhook |

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
- [ ] Social Proof (Testimonials, User Count)
- [ ] Trust Badges
- [ ] Demo-Video
- [ ] Exit-Intent Popup

### Phase 3: Features
- [ ] Bulk Response Generation
- [ ] Review Analytics Dashboard
- [ ] Team/Multi-User Accounts
- [ ] Response Templates

### Phase 4: Marketing
- [ ] Product Hunt Launch
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

## KONTAKT

- **User:** Berend Mainz
- **GitHub:** berschlend
- **Email:** berend.mainz@web.de

---

## CHANGELOG

### 09.01.2026
- PostgreSQL Migration
- Password Reset mit Resend.com
- Jahres-Abos (20% Rabatt)
- Regenerate Button
- Chrome Extension Fixes
- MEMORY.md optimiert für Claude Sessions

---

> **WICHTIG:** Nach jeder Session diese Datei updaten!
> - CURRENT_TASKS aktualisieren
> - Erledigte Tasks als [x] markieren
> - Neue Erkenntnisse dokumentieren
> - Datum/Uhrzeit bei "Stand" ändern
