# Chrome Web Store Listing

## Extension Name
**ReviewResponder - AI Review Responses**

---

## Short Description (132 chars max)
AI review responses for Google, Yelp & TripAdvisor. 50+ languages, 4 tones, templates, quality scores. Save hours every week.

---

## Detailed Description (English)

**Stop wasting hours writing review responses. Let AI do it in seconds.**

ReviewResponder helps businesses respond to reviews professionally and quickly on Google Maps, Yelp, TripAdvisor and more. Just click the "Generate Response" button next to any review, or simply select the review text - a floating button will appear! Get a perfectly crafted response instantly.

**KEY FEATURES:**

🚀 **One-Click Responses** - Generate directly on Google Maps, Yelp, TripAdvisor & more
🌍 **50+ Languages** - Auto-detects and responds in reviewer's language
🎨 **4 Response Tones** - Professional, Friendly, Formal, or Apologetic
📊 **3 Response Variations** - Get multiple options, pick your favorite
⭐ **Quality Score** - AI rates your response (Excellent/Good/Needs Work)
📋 **50+ Industry Templates** - Restaurant, Hotel, Retail, Healthcare & more
💾 **Auto-Save Drafts** - Never lose your work when closing the panel
⚡ **Lightning Fast** - Responses in under 3 seconds

**HOW IT WORKS:**

1. Browse reviews on Google Maps, Yelp, or TripAdvisor
2. Click "Generate Response" button OR select any review text
3. Choose your tone and pick from 3 variations
4. Copy and paste the response

**TIP:** No button visible? Just select the review text and a floating "Respond" button will appear!

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

**Hör auf, Stunden mit Review-Antworten zu verschwenden. Lass KI das in Sekunden erledigen.**

ReviewResponder hilft Unternehmen, professionell und schnell auf Bewertungen zu antworten - auf Google Maps, Yelp, TripAdvisor und mehr. Klicke einfach auf "Generate Response" neben einer Bewertung, oder markiere den Bewertungstext - ein schwebender Button erscheint! Erhalte sofort eine perfekt formulierte Antwort.

**HAUPTFUNKTIONEN:**

🚀 **Ein-Klick-Antworten** - Direkt auf Google Maps, Yelp, TripAdvisor & mehr
🌍 **50+ Sprachen** - Erkennt automatisch die Sprache der Bewertung
🎨 **4 Antwort-Töne** - Professionell, Freundlich, Formell oder Entschuldigend
📊 **3 Antwort-Varianten** - Mehrere Optionen, wähle deine Lieblingsantwort
⭐ **Qualitäts-Score** - KI bewertet deine Antwort (Excellent/Good/Needs Work)
📋 **50+ Branchen-Templates** - Restaurant, Hotel, Einzelhandel, Gesundheit & mehr
💾 **Auto-Speichern** - Entwürfe gehen beim Schließen nicht verloren
⚡ **Blitzschnell** - Antworten in unter 3 Sekunden

**SO FUNKTIONIERT'S:**

1. Bewertungen auf Google Maps, Yelp oder TripAdvisor durchsuchen
2. "Generate Response" Button klicken ODER Bewertungstext markieren
3. Ton wählen und aus 3 Varianten auswählen
4. Antwort kopieren und einfügen

**TIPP:** Kein Button sichtbar? Einfach den Bewertungstext markieren und ein "Respond" Button erscheint!

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
