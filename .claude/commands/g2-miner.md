# G2 Negative Review Miner

Scrape G2.com fuer unzufriedene Kunden von Konkurrenz-Produkten.
**KOMPLETT AUTOMATISCH:** Scraping → Email finden → Demo generieren → Email senden

## Parameter
- $COMPETITOR: Konkurrenzprodukt (z.B. "birdeye", "podium", "reviewtrackers")

## Workflow

### Phase 1: G2 Reviews Scrapen

1. **Browser oeffnen**
   - Navigiere zu: `https://www.g2.com/products/$COMPETITOR/reviews?rating=1&rating=2`
   - Falls Filter nicht funktioniert: Manuell auf 1-2 Sterne filtern

2. **Reviews scrapen**
   Fuer jeden Review (max 20):
   - Reviewer Name
   - Reviewer Titel/Position
   - Firma des Reviewers
   - Star Rating (1-2)
   - "What do you dislike?" Abschnitt (Pain Point!)
   - Review Datum

### Phase 2: Email Finden (AUTOMATISCH)

3. **Fuer jede Firma:**

   a) **Website aus G2 extrahieren:**
   ```javascript
   // Oft hat G2 einen Link zur Firma
   document.querySelector('a[href*="company"]')?.href
   ```

   b) **Falls keine Website: Google suchen**
   - Navigiere zu: `https://www.google.com/search?q="FIRMENNAME"+website`
   - Nimm erstes Ergebnis

   c) **Email von Website scrapen:**
   ```javascript
   // Suche nach mailto: Links
   const emails = [...document.querySelectorAll('a[href^="mailto:"]')]
     .map(a => a.href.replace('mailto:', '').split('?')[0])
     .filter(e => !e.includes('example') && !e.includes('test'));

   // Oder im Footer/Impressum suchen
   const footerText = document.querySelector('footer')?.textContent || '';
   const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
   const foundEmails = footerText.match(emailRegex) || [];
   ```

### Phase 3: An Backend senden

4. **POST zu Backend mit ALLEN Daten:**
   ```bash
   curl -X POST "https://review-responder.onrender.com/api/sales/competitor-leads" \
     -H "Content-Type: application/json" \
     -H "x-api-key: [ADMIN_SECRET aus .claude/secrets.local]" \
     -d '{
       "leads": [...],
       "generate_demos": true,
       "send_emails": true
     }'
   ```

   Lead-Format:
   ```json
   {
     "company_name": "ABC Corp",
     "reviewer_name": "John Smith",
     "reviewer_title": "Marketing Manager",
     "competitor": "birdeye",
     "star_rating": 1,
     "complaint_summary": "Daily bugs, terrible support...",
     "review_date": "2024-01-15",
     "g2_url": "https://g2.com/...",
     "website": "https://abccorp.com",
     "email": "info@abccorp.com"
   }
   ```

### Phase 4: Backend macht automatisch

5. **Was das Backend automatisch macht:**
   - Speichert Leads in `competitor_leads`
   - Generiert Demo fuer jeden Lead (3 AI-Responses)
   - Sendet personalisierte Email mit Demo-Link
   - Pain Point aus G2 Review wird in Email erwaehnt!

## Report

Am Ende zeigen:
- Reviews gefunden: X
- Emails gefunden: X/Y (Z%)
- Demos generiert: X
- Emails gesendet: X

## Ziel-Konkurrenten
| Konkurrent | URL |
|------------|-----|
| birdeye | g2.com/products/birdeye/reviews |
| podium | g2.com/products/podium/reviews |
| reviewtrackers | g2.com/products/reviewtrackers/reviews |
| reputation | g2.com/products/reputation-com/reviews |
| yext | g2.com/products/yext/reviews |

## Beispiel
```
/g2-miner birdeye
```

## Wichtig
- Max 20 Reviews pro Durchlauf (Anti-Rate-Limit)
- Nur 1-2 Sterne Reviews (echte Pain Points)
- 3-5 Sekunden Pause zwischen Seiten
- Email-Finder: Website zuerst, dann Google
