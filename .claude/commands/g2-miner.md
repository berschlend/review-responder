# G2 Negative Review Miner

Scrape G2.com fuer unzufriedene Kunden von Konkurrenz-Produkten.

## Parameter
- $COMPETITOR: Konkurrenzprodukt (z.B. "birdeye", "podium", "reviewtrackers")

## Workflow

1. **Browser oeffnen**
   - Navigiere zu: `https://www.g2.com/products/$COMPETITOR/reviews`

2. **Nach negativen Reviews filtern**
   - Klicke auf Rating-Filter
   - Waehle 1-3 Sterne

3. **Reviews scrapen**
   Fuer jeden Review:
   - Reviewer Name
   - Reviewer Titel/Position
   - Firma des Reviewers
   - Star Rating
   - Review Titel
   - "What do you dislike?" Abschnitt (Beschwerde)
   - Review Datum

4. **Firmen-Info extrahieren**
   Fuer jede Firma:
   - Firmenname aus Review
   - Versuche Website zu finden (Google Suche: "Firmenname website")

5. **Email finden**
   Fuer jede Firma:
   - Scrape Website fuer Email
   - Oder: Hunter.io API falls konfiguriert

6. **An Backend senden**
   POST zu: `https://review-responder.onrender.com/api/sales/competitor-leads`
   Header: `x-api-key: [ADMIN_SECRET]`
   Body:
   ```json
   {
     "leads": [
       {
         "company_name": "ABC Restaurant Group",
         "reviewer_name": "John Smith",
         "reviewer_title": "Marketing Manager",
         "competitor": "$COMPETITOR",
         "star_rating": 2,
         "review_title": "Too expensive for what you get",
         "complaint_summary": "Hidden fees, poor customer support...",
         "review_date": "2024-01-15",
         "g2_url": "https://g2.com/...",
         "website": "https://abcrestaurants.com"
       }
     ]
   }
   ```

7. **Report erstellen**
   Zeige:
   - Anzahl negative Reviews gefunden
   - Anzahl einzigartige Firmen
   - Anzahl mit Email
   - Anzahl an Backend gesendet

## Ziel-Konkurrenten
- birdeye
- podium
- reviewtrackers
- reputation
- yext

## Beispiel-Aufruf
```
/g2-miner birdeye
```

## Wichtig
- Max 30 Reviews pro Durchlauf
- Nur Reviews der letzten 12 Monate
- 3-5 Sekunden Pause zwischen Seiten
