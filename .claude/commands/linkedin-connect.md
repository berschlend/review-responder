# LinkedIn Auto-Connector

Finde und verbinde dich mit Restaurant/Hotel Owners auf LinkedIn.
**ZWEI MODI:** Neue Connections ODER Follow-up fuer Accepted

## Parameter
- $SEARCH_QUERY: Suchbegriff (z.B. "Restaurant Owner", "Hotel Manager")
- $LOCATION: Optional - Location Filter (z.B. "Germany", "Berlin")
- ODER: `followup` - Follow-up Modus fuer accepted Connections

## Beispiele
```
/linkedin-connect "Restaurant Owner" Germany    # Neue Connections
/linkedin-connect followup                      # Follow-up fuer Accepted
```

## Voraussetzung
- User muss bei LinkedIn eingeloggt sein im Browser
- ADMIN_SECRET aus `.claude/secrets.local` lesen

---

## MODUS 1: Neue Connections

### 1. Browser oeffnen
- Navigiere zu: `https://www.linkedin.com/search/results/people/?keywords=$SEARCH_QUERY`
- Falls $LOCATION: Fuege Location-Filter hinzu

### 2. Profile scrapen
Fuer jedes Profil auf der Seite:
- Name
- Titel/Position
- Firma
- Location
- LinkedIn URL

### 3. Connection Request senden
Fuer jeden qualifizierten Lead (max 20 pro Tag!):
- Klicke "Connect"
- Wenn "Add a note" Option: Klicke darauf
- Fuege personalisierte Nachricht ein:
  ```
  Hi [NAME], ich sehe du arbeitest bei [COMPANY].
  Wuerde mich gerne vernetzen - ich arbeite an
  AI-Loesungen fuer Review Management.
  ```
- Klicke "Send"

### 4. An Backend senden
```bash
curl -X POST "https://review-responder.onrender.com/api/sales/linkedin-leads" \
  -H "Content-Type: application/json" \
  -H "x-api-key: [ADMIN_SECRET]" \
  -d '{"leads": [...]}'
```

---

## MODUS 2: Follow-up (accepted Connections)

### 1. Pending Connections aus DB holen
```bash
curl "https://review-responder.onrender.com/api/outreach/linkedin-pending?key=[ADMIN_SECRET]"
```

### 2. LinkedIn Connections pruefen
- Navigiere zu: `https://www.linkedin.com/mynetwork/invite-connect/connections/`
- Oder: Suche nach dem Namen in "My Network"

### 3. Fuer jede accepted Connection:

a) **Pruefen ob wirklich accepted:**
   - Suche nach dem Namen
   - Wenn "Message" Button sichtbar → Accepted!

b) **Follow-up Message senden:**
   - Klicke "Message"
   - Sende personalisierte Nachricht:
   ```
   Hey [NAME]!

   Danke fuers Connecten! Hab gesehen dass du bei [COMPANY] bist.

   Kurze Frage: Wie handled ihr aktuell eure Google/TripAdvisor Reviews?

   Ich hab ein Tool gebaut das AI-Antworten generiert - spart locker
   5-10 Stunden/Woche. Hier eine Demo speziell fuer euch:
   [DEMO_URL]

   LG
   ```

c) **Demo generieren (optional):**
   ```bash
   curl -X POST "https://review-responder.onrender.com/api/outreach/linkedin-demo" \
     -H "x-api-key: [ADMIN_SECRET]" \
     -d '{"linkedin_id": 123, "company": "[COMPANY]"}'
   ```
   → Gibt demo_url zurueck

d) **Status updaten:**
   ```bash
   curl -X PUT "https://review-responder.onrender.com/api/outreach/linkedin-demo/[ID]/accepted" \
     -H "x-api-key: [ADMIN_SECRET]"
   ```

### 4. Report
- Connections gecheckt: X
- Accepted gefunden: Y
- Follow-up Messages gesendet: Z

---

## WICHTIG - LinkedIn Limits
- MAX 20-25 Connections pro Tag
- MAX 100 Connections pro Woche
- MAX 50-100 Messages pro Tag
- Bei Warnung/Limit: SOFORT STOPPEN
- 5-10 Sekunden Pause zwischen Requests
- Keine Automation-Warnung riskieren!

---

## Kompletter automatischer Flow

```
Tag 1: /linkedin-connect "Restaurant Owner" Germany
       → 20 Connection Requests gesendet
       → Leads in DB gespeichert

Tag 3-5: /linkedin-connect followup
         → Accepted Connections finden
         → Demo generieren
         → Follow-up Message mit Demo-Link
         → Status in DB updaten
```
