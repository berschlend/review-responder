# Automated Outreach Setup Guide

## Was das System macht (100% automatisch)

Jeden Tag um 9 AM UTC:
1. **Scrape** 10 neue Business-Leads von Google Maps
2. **Find** Email-Adressen via Hunter.io
3. **Send** personalisierte Cold Emails an neue Leads
4. **Follow-up** automatisch nach 3 und 7 Tagen
5. **Track** Email-Opens mit unsichtbarem Pixel

**Du musst NICHTS tun** - außer einmalig die API Keys einrichten.

---

## SETUP (5 Minuten)

### Schritt 1: Google Places API Key (KOSTENLOS - $200/Monat Guthaben)

1. Gehe zu: https://console.cloud.google.com/
2. Erstelle ein neues Projekt (oder nutze bestehendes)
3. Aktiviere die "Places API":
   - APIs & Services → Library
   - Suche "Places API" → Enable
4. Erstelle API Key:
   - APIs & Services → Credentials
   - Create Credentials → API Key
5. Kopiere den Key

**In Render hinzufügen:**
```
GOOGLE_PLACES_API_KEY=AIza...
```

### Schritt 2: Hunter.io API Key (KOSTENLOS - 25 Requests/Monat)

1. Gehe zu: https://hunter.io/users/sign_up
2. Erstelle kostenlosen Account
3. Gehe zu: https://hunter.io/api_keys
4. Kopiere deinen API Key

**In Render hinzufügen:**
```
HUNTER_API_KEY=abc123...
```

**Upgrade-Option:** Für $49/Monat bekommst du 1000 Requests = 1000 Emails gefunden.

### Schritt 3: Admin Secret erstellen

Generiere einen zufälligen String (z.B. mit: https://randomkeygen.com/)

**In Render hinzufügen:**
```
ADMIN_SECRET=dein-geheimer-key-hier
CRON_SECRET=dein-geheimer-key-hier
```

### Schritt 4: Resend Domain verifizieren

Deine Emails kommen von `hello@reviewresponder.io`.

1. Gehe zu: https://resend.com/domains
2. Füge deine Domain hinzu
3. Verifiziere die DNS-Einträge

**Alternative:** Ändere die From-Adresse im Code zu deiner verifizierten Domain.

### Schritt 5: Render Cron Job einrichten

1. Gehe zu Render Dashboard
2. Klicke auf dein Backend Service
3. Settings → Cron Jobs → Add Cron Job
4. Konfiguration:
   - **Name:** Daily Outreach
   - **Command:** `curl -X POST "https://review-responder.onrender.com/api/cron/daily-outreach?secret=DEIN_CRON_SECRET"`
   - **Schedule:** `0 9 * * *` (9 AM UTC = 10 AM Berlin)

---

## Alle Environment Variables (Render Backend)

```env
# Bestehende (schon da)
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=...
FRONTEND_URL=https://review-responder-frontend.onrender.com
RESEND_API_KEY=re_...

# NEU für Outreach
GOOGLE_PLACES_API_KEY=AIza...
HUNTER_API_KEY=abc123...
ADMIN_SECRET=geheimer-admin-key
CRON_SECRET=geheimer-cron-key
```

---

## Dashboard anschauen

Nach dem Setup kannst du die Outreach-Stats sehen:

```
https://review-responder.onrender.com/api/outreach/dashboard?key=DEIN_ADMIN_SECRET
```

Zeigt:
- Total Leads
- Emails gesendet
- Open Rate
- Letzte Aktivitäten

---

## Manuelle Tests (Optional)

### Leads scrapen:
```bash
curl -X POST "https://review-responder.onrender.com/api/outreach/scrape-leads" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: DEIN_ADMIN_SECRET" \
  -d '{"query": "restaurant", "city": "New York", "limit": 5}'
```

### Emails finden:
```bash
curl -X POST "https://review-responder.onrender.com/api/outreach/find-emails" \
  -H "X-Admin-Key: DEIN_ADMIN_SECRET"
```

### Cold Emails senden:
```bash
curl -X POST "https://review-responder.onrender.com/api/outreach/send-emails" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: DEIN_ADMIN_SECRET" \
  -d '{"limit": 5}'
```

---

## Erwartete Ergebnisse

| Metrik | Pro Woche | Pro Monat |
|--------|-----------|-----------|
| Neue Leads | 70 | 300 |
| Emails gefunden | 30-40 | 120-160 |
| Cold Emails gesendet | 200 | 800 |
| Opens (20% rate) | 40 | 160 |
| Replies (5% rate) | 10 | 40 |
| Demos (25% of replies) | 2-3 | 10 |
| **Conversions (30%)** | **1** | **3-4** |

**Bei $29-99/Monat pro Kunde = $100-$400 MRR nach dem ersten Monat**

---

## Kosten

| Service | Kosten | Limit |
|---------|--------|-------|
| Google Places API | $0 (ersten $200 frei) | ~10,000 Requests |
| Hunter.io Free | $0 | 25 Emails/Monat |
| Hunter.io Starter | $49/mo | 1000 Emails/Monat |
| Resend | $0 (ersten 100 Emails frei) | Dann $0.001/Email |

**Für den Start: $0/Monat möglich!**

---

## Troubleshooting

### "GOOGLE_PLACES_API_KEY not configured"
→ Füge den Key in Render Environment Variables hinzu

### "HUNTER_API_KEY not configured"
→ Erstelle kostenlosen Hunter.io Account

### Emails werden nicht gesendet
→ Prüfe RESEND_API_KEY und Domain-Verifizierung

### Cron Job läuft nicht
→ Prüfe den Cron Job in Render Settings

---

## Email Templates anpassen

Die Templates sind in `backend/server.js` unter `EMAIL_TEMPLATES`:

- `sequence1` - Erste Cold Email
- `sequence2` - Follow-up nach 3 Tagen
- `sequence3` - Letzte Email nach 7 Tagen

Variablen:
- `{business_name}` - Name des Unternehmens
- `{business_type}` - Art (restaurant, hotel, etc.)
- `{review_count}` - Anzahl Google Reviews
- `{city}` - Stadt
- `{email}` - Email (für Tracking)

---

*Setup abgeschlossen? Das System läuft jetzt vollautomatisch!*
