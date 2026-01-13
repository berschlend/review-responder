# Yelp Review Audit Bot

Scrape Yelp fuer Businesses mit niedrigen Review-Antwortraten.

## Parameter
- $CITY: Stadt zum Scrapen (z.B. "Berlin", "Munich", "Hamburg")
- $CATEGORY: Kategorie (z.B. "restaurants", "hotels", "dentists")

## Workflow

1. **Browser oeffnen**
   - Navigiere zu: `https://www.yelp.com/search?find_desc=$CATEGORY&find_loc=$CITY`

2. **Business-Liste scrapen**
   Fuer jeden Business auf der Seite:
   - Business Name
   - Yelp URL
   - Anzahl Reviews
   - Rating
   - Kategorie
   - Website (wenn vorhanden)

3. **Detail-Seiten besuchen**
   Fuer jeden Business mit >20 Reviews:
   - Oeffne die Business-Seite
   - Zaehle "Business Owner" Antworten in den Reviews
   - Berechne Response Rate: (Owner Responses / Total Reviews) * 100

4. **Leads filtern**
   Behalte nur Businesses mit:
   - Response Rate < 20%
   - Mindestens 30 Reviews

5. **Email finden**
   Fuer jeden Lead:
   - Wenn Website vorhanden: Scrape Website fuer Email
   - Suche auf /contact, /about, /impressum Seiten
   - Regex: Email-Pattern finden

6. **An Backend senden**
   POST zu: `https://review-responder.onrender.com/api/sales/yelp-leads`
   Header: `x-api-key: [ADMIN_SECRET aus .claude/secrets.local]`
   Body:
   ```json
   {
     "leads": [
       {
         "business_name": "Restaurant XYZ",
         "yelp_url": "https://yelp.com/biz/...",
         "city": "$CITY",
         "category": "$CATEGORY",
         "total_reviews": 156,
         "owner_responses": 12,
         "response_rate": 7.7,
         "website": "https://...",
         "phone": "+49..."
       }
     ]
   }
   ```

7. **Report erstellen**
   Zeige Zusammenfassung:
   - Anzahl gescrapte Businesses
   - Anzahl qualifizierte Leads
   - Anzahl mit Email gefunden
   - Anzahl an Backend gesendet

## Beispiel-Aufruf
```
/yelp-audit Berlin restaurants
```

## Wichtig
- Max 50 Businesses pro Durchlauf (Yelp Rate Limits)
- 2-3 Sekunden Pause zwischen Requests
- Keine Captchas loesen - bei Captcha abbrechen und User informieren
