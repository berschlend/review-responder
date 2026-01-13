# Chrome Web Store Listing

## Extension Name
**Google Review Response Generator - AI**

---

## Short Description (132 chars max)
Google review response generator with AI. Personalized replies for Google Maps, Yelp, TripAdvisor & more. Add business context.

---

## Detailed Description (English)

**The #1 Google review response generator. Reply to reviews in seconds, not hours.**

This AI-powered review response generator helps businesses reply to reviews professionally and quickly on:
• Google Maps
• Yelp
• TripAdvisor
• Booking.com
• Facebook
• Trustpilot

Just click the "Respond" button next to any review, or select the review text - a floating button appears!

**KEY FEATURES:**

⚡ **Lightning Fast** - Responses in under 3 seconds
🎯 **One-Click Responses** - Generate directly on the review page
🌍 **50+ Languages** - Auto-detects and responds in reviewer's language
🎨 **4 Response Tones** - Professional, Friendly, Formal, or Apologetic
✨ **Personalized** - AI crafts unique replies based on each review
🏢 **Business Context** - Add your business name & details for branded responses

**HOW IT WORKS:**

1. Browse reviews on Google Maps, Yelp, TripAdvisor or any supported platform
2. Click "Respond" button OR select any review text
3. Choose your tone and generate
4. Copy and paste your personalized response

**PERFECT FOR:**
- Restaurant owners
- Hotel managers
- Local business owners
- Marketing agencies
- Anyone managing online reviews

**PRICING:**
- Free: 20 responses/month
- Starter ($29/mo): 300 responses
- Pro ($49/mo): 800 responses + analytics
- Unlimited ($99/mo): Unlimited responses + API access

Start responding to reviews in seconds, not hours. Try ReviewResponder free today!

---

## Detailed Description (German)

**Der #1 Google Review Response Generator. Antworte auf Bewertungen in Sekunden, nicht Stunden.**

Dieser KI-gestützte Review Response Generator hilft Unternehmen, professionell und schnell auf Bewertungen zu antworten auf:
• Google Maps
• Yelp
• TripAdvisor
• Booking.com
• Facebook
• Trustpilot

Klicke einfach auf "Respond" neben einer Bewertung, oder markiere den Bewertungstext - ein Button erscheint!

**HAUPTFUNKTIONEN:**

⚡ **Blitzschnell** - Antworten in unter 3 Sekunden
🎯 **Ein-Klick-Antworten** - Direkt auf der Bewertungsseite generieren
🌍 **50+ Sprachen** - Erkennt automatisch die Sprache der Bewertung
🎨 **4 Antwort-Töne** - Professionell, Freundlich, Formell oder Entschuldigend
✨ **Personalisiert** - KI erstellt einzigartige Antworten für jede Bewertung
🏢 **Business Context** - Füge deinen Firmennamen hinzu für gebrandete Antworten

**SO FUNKTIONIERT'S:**

1. Bewertungen auf Google Maps, Yelp, TripAdvisor oder einer anderen Plattform durchsuchen
2. "Respond" Button klicken ODER Bewertungstext markieren
3. Ton wählen und generieren
4. Personalisierte Antwort kopieren und einfügen

**PERFEKT FÜR:**
- Restaurantbesitzer
- Hotelmanager
- Lokale Unternehmen
- Marketing-Agenturen
- Jeden, der Online-Bewertungen verwaltet

---

## Category
**Productivity**

## Language
English (Primary), German

---

## Privacy Policy URL
https://tryreviewresponder.com/privacy

## Website
https://tryreviewresponder.com

## Support Email
berend.mainz@web.de

---

## Screenshots Required (1280x800 or 640x400)

1. **screenshot-1-popup.png** - Extension popup with login/usage display
2. **screenshot-2-maps-button.png** - Google Maps with "Generate Response" button visible
3. **screenshot-3-response-panel.png** - Response panel with generated response
4. **screenshot-4-copy-success.png** - After copying, showing success state

---

## Promotional Images (Optional)

- **Small Tile (440x280)** - Logo + tagline
- **Marquee (1400x560)** - Feature showcase

---

## ZIP File Location
`C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\chrome-extension-v1.6.0.zip`

---

## Google OAuth Setup (REQUIRED for Google Sign-In)

After uploading to Chrome Web Store, you need to add the extension's redirect URL to Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select the OAuth 2.0 Client ID for ReviewResponder
3. Under "Authorized redirect URIs", add:
   `https://<EXTENSION_ID>.chromiumapp.org/`

   Replace `<EXTENSION_ID>` with your Chrome Web Store extension ID
   (visible after publishing or in chrome://extensions when loaded unpacked)

4. Save the changes

**Note:** The extension ID from Chrome Web Store is permanent. For local testing, the ID may vary.

---

## Submission Checklist

### Before Submitting:
- [ ] Extension getestet auf Google Maps
- [ ] Alle Features funktionieren (Generate, Copy, Tones)
- [ ] 3+ Screenshots erstellt (1280x800 px)
- [ ] ZIP-Datei erstellt (ohne screenshots/ Ordner)
- [ ] Chrome Developer Account ($5 einmalig)

### ZIP erstellen (PowerShell):
```powershell
cd "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
Compress-Archive -Path "chrome-extension\manifest.json", "chrome-extension\background.js", "chrome-extension\content.js", "chrome-extension\content.css", "chrome-extension\popup.html", "chrome-extension\popup.js", "chrome-extension\popup.css", "chrome-extension\templates-library.js", "chrome-extension\icons" -DestinationPath "chrome-extension-v1.6.0.zip" -Force
```

### Nach Einreichung:
- Review dauert 1-3 Werktage
- Bei Ablehnung: Feedback lesen, fixen, neu einreichen
