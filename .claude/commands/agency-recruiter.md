# SEO Agency Recruiter

Finde Local SEO Agencies auf Clutch.co fuer White-Label Partnerships.

## Parameter
- $SERVICE: Service-Filter (z.B. "local-seo", "reputation-management")
- $LOCATION: Optional - Location (z.B. "united-states", "germany")

## Workflow

1. **Browser oeffnen**
   - Navigiere zu: `https://clutch.co/agencies/$SERVICE`
   - Falls $LOCATION: Fuege Location-Filter hinzu

2. **Agency-Liste scrapen**
   Fuer jede Agency auf der Seite:
   - Agency Name
   - Website URL
   - Clutch URL
   - Rating (Sterne)
   - Anzahl Reviews
   - Services (Liste)
   - Location
   - Min Project Size
   - Hourly Rate
   - Employees (Groesse)

3. **Detail-Seiten besuchen**
   Fuer jede Agency:
   - Oeffne Clutch Profil
   - Extrahiere Kontakt-Info (wenn vorhanden)
   - Notiere spezifische Services

4. **Email finden**
   Fuer jede Agency:
   - Besuche deren Website
   - Suche auf /contact, /about, /team Seiten
   - Extrahiere Email (bevorzugt: contact@, info@, hello@)
   - Falls moeglich: Name des Founders/CEO finden

5. **An Backend senden**
   POST zu: `https://review-responder.onrender.com/api/sales/agency-leads`
   Header: `x-api-key: [ADMIN_SECRET]`
   Body:
   ```json
   {
     "leads": [
       {
         "agency_name": "Local SEO Experts Inc",
         "website": "https://localseoexperts.com",
         "clutch_url": "https://clutch.co/profile/...",
         "clutch_rating": 4.8,
         "num_reviews": 45,
         "services": "Local SEO, Google My Business, Review Management",
         "location": "New York, USA",
         "min_project_size": "$1,000+",
         "hourly_rate": "$100 - $149",
         "employees": "10-49"
       }
     ]
   }
   ```

6. **Report erstellen**
   Zeige:
   - Anzahl Agencies gefunden
   - Anzahl mit Email
   - Anzahl an Backend gesendet
   - Top Services (haeufigste)

## Beispiel-Aufruf
```
/agency-recruiter local-seo united-states
```

## Filter-Empfehlungen
Beste Ziel-Agencies:
- Bieten "Local SEO" oder "Google My Business" an
- 10-100 Mitarbeiter (nicht zu klein, nicht zu gross)
- Min Project Size: $1,000-$10,000
- Rating > 4.0
- Reviews > 10

## Service-Kategorien auf Clutch
- `local-seo`
- `reputation-management`
- `digital-marketing`
- `seo`

## Wichtig
- Max 30 Agencies pro Durchlauf
- 3-5 Sekunden Pause zwischen Seiten
- Website-Scraping: Max 3 Unterseiten pro Agency
