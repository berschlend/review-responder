# LinkedIn Auto-Connector

Finde und verbinde dich mit Restaurant/Hotel Owners auf LinkedIn.

## Parameter
- $SEARCH_QUERY: Suchbegriff (z.B. "Restaurant Owner", "Hotel Manager")
- $LOCATION: Optional - Location Filter (z.B. "Germany", "Berlin")

## Voraussetzung
- User muss bei LinkedIn eingeloggt sein im Browser

## Workflow

1. **Browser oeffnen**
   - Navigiere zu: `https://www.linkedin.com/search/results/people/?keywords=$SEARCH_QUERY`
   - Falls $LOCATION: Fuege Location-Filter hinzu

2. **Profile scrapen**
   Fuer jedes Profil auf der Seite:
   - Name
   - Titel/Position
   - Firma
   - Location
   - LinkedIn URL

3. **Pruefen ob bereits connected**
   - Ueberspringe Profile mit "Message" Button (bereits connected)
   - Nur Profile mit "Connect" Button

4. **Connection Request senden**
   Fuer jeden qualifizierten Lead (max 20 pro Tag!):
   - Klicke "Connect"
   - Wenn "Add a note" Option: Klicke darauf
   - Fuege personalisierte Nachricht ein:
     ```
     Hi [NAME], ich sehe Sie arbeiten bei [COMPANY] im Bereich [TITLE].
     Wuerde mich gerne vernetzen - ich arbeite an Loesungen fuer
     Review Management im Hospitality-Bereich.
     ```
   - Klicke "Send"

5. **An Backend senden**
   POST zu: `https://review-responder.onrender.com/api/sales/linkedin-leads`
   Header: `x-api-key: [ADMIN_SECRET]`
   Body:
   ```json
   {
     "leads": [
       {
         "name": "Max Mustermann",
         "title": "Restaurant Owner",
         "company": "Gasthaus Zum Loewen",
         "location": "Berlin, Germany",
         "linkedin_url": "https://linkedin.com/in/..."
       }
     ]
   }
   ```

6. **Connection Status updaten**
   Aktualisiere DB: `connection_sent = TRUE, connection_sent_at = NOW()`

7. **Report erstellen**
   Zeige:
   - Anzahl Profile gefunden
   - Anzahl Connection Requests gesendet
   - Anzahl uebersprungen (bereits connected)

## Beispiel-Aufruf
```
/linkedin-connect "Restaurant Owner" Germany
```

## WICHTIG - LinkedIn Limits
- MAX 20-25 Connections pro Tag
- MAX 100 Connections pro Woche
- Bei Warnung/Limit: SOFORT STOPPEN
- 5-10 Sekunden Pause zwischen Requests
- Keine Automation-Warnung riskieren!

## Follow-up (separate Session)
Nach 3-5 Tagen:
1. Gehe zu "My Network" > "Connections"
2. Finde neue Connections
3. Sende Follow-up Nachricht (manuell oder mit separatem Command)
