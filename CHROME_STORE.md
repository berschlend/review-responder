# ReviewResponder - Chrome Web Store Submission Guide

> Diese Datei enthält alle Informationen für die Veröffentlichung der Chrome Extension im Web Store.

---

## STORE LISTING

### Extension Name

```
ReviewResponder - AI Review Responses
```

### Short Description (132 characters max)

```
Generate professional AI responses to Google Reviews in seconds. Save hours and never miss a review again.
```

### Detailed Description (For Chrome Web Store)

```
ReviewResponder helps business owners respond to Google Reviews quickly and professionally using AI.

HOW IT WORKS:
1. Open Google Maps and find a review you want to respond to
2. Click the "Generate AI Response" button that appears
3. Get a professional, personalized response in seconds
4. Copy and paste - done!

KEY FEATURES:

AI-Powered Responses
- Generates contextual, professional responses
- Understands review sentiment and content
- Adapts tone based on star rating

Multiple Tones
- Professional: Business-appropriate responses
- Friendly: Warm and personal touch
- Formal: Corporate communication style
- Apologetic: For handling negative feedback

50+ Languages
- Automatic language detection
- Responds in the same language as the review
- Perfect for international businesses

Works Directly on Google Maps
- No need to copy/paste reviews
- One-click response generation
- Seamless workflow integration

PERFECT FOR:
- Restaurant owners
- Hotel managers
- Retail store owners
- Service businesses
- Anyone managing Google Reviews

PRICING:
- Free: 20 responses/month to try it out
- Starter ($29/mo): 300 responses
- Professional ($49/mo): 800 responses + Analytics
- Unlimited ($99/mo): Unlimited responses + API access

GET STARTED:
1. Install the extension
2. Create a free account at reviewresponder.com
3. Start responding to reviews in seconds!

Questions? Contact us at berend.mainz@web.de

---
Made with care for busy business owners who want to maintain great customer relationships.
```

### Category

```
Productivity
```

### Language

```
English (United States)
```

---

## REQUIRED ASSETS

### Icons (Already Created)

- [x] `icon16.png` - 16x16px (Favicon)
- [x] `icon48.png` - 48x48px (Extension management page)
- [x] `icon128.png` - 128x128px (Web Store)

### Screenshots (1280x800 or 640x400)

Screenshots müssen noch erstellt werden. Empfohlene Screenshots:

1. **screenshot-1-overview.png** (1280x800)
   - Google Maps mit ReviewResponder Button sichtbar
   - Zeigt die Integration in Google Maps

2. **screenshot-2-generate.png** (1280x800)
   - Response wird generiert
   - Zeigt die AI in Aktion

3. **screenshot-3-result.png** (1280x800)
   - Fertige Response im Popup
   - Copy-Button sichtbar

4. **screenshot-4-tones.png** (1280x800)
   - Tone-Auswahl Dropdown
   - Zeigt die verschiedenen Optionen

5. **screenshot-5-dashboard.png** (1280x800)
   - Web Dashboard mit History
   - Zeigt zusätzliche Features

### Promotional Images (Optional aber empfohlen)

- Small Promo Tile: 440x280px
- Large Promo Tile: 920x680px
- Marquee Promo Tile: 1400x560px

---

## PRIVACY POLICY

Die Privacy Policy muss unter einer öffentlichen URL erreichbar sein.

**URL:** `https://review-responder-frontend.onrender.com/privacy`

### Privacy Policy Text für Extension:

```
ReviewResponder Chrome Extension - Privacy Policy

Last updated: January 2026

1. DATA COLLECTION

The ReviewResponder Chrome Extension collects:
- Review text content (only when you click "Generate Response")
- Your authentication token (stored locally)

We do NOT collect:
- Browsing history
- Personal information beyond what you provide at registration
- Data from pages you don't interact with

2. DATA USAGE

Collected data is used solely to:
- Generate AI responses to reviews
- Authenticate your account
- Track usage for billing purposes

3. DATA STORAGE

- Authentication tokens are stored locally in Chrome's secure storage
- Review data is sent to our servers only when generating responses
- We do not sell or share your data with third parties

4. PERMISSIONS EXPLAINED

- activeTab: To detect reviews on Google Maps
- storage: To save your login session
- clipboardWrite: To copy responses to clipboard
- host_permissions: To communicate with Google Maps and our API

5. CONTACT

For privacy questions: berend.mainz@web.de

6. CHANGES

We may update this policy. Check reviewresponder.com/privacy for the latest version.
```

---

## SUBMISSION CHECKLIST

### Before Submission:

- [x] manifest.json version: 1.0.0
- [x] manifest_version: 3 (required)
- [x] All icons present (16, 48, 128px)
- [x] Description under 132 characters
- [ ] Screenshots created (1280x800)
- [ ] Privacy policy URL live
- [ ] Extension tested on latest Chrome
- [ ] No console errors
- [ ] All features working

### Chrome Developer Account:

- One-time registration fee: $5
- Developer Dashboard: https://chrome.google.com/webstore/devconsole

### Submission Steps:

1. Go to Chrome Developer Dashboard
2. Click "New Item"
3. Upload ZIP of chrome-extension folder
4. Fill in Store Listing (use text above)
5. Upload screenshots
6. Add Privacy Policy URL
7. Select category: Productivity
8. Submit for review

### Review Time:

- First submission: 1-3 business days
- Updates: Usually same day or next day

---

## CREATING THE ZIP FILE

```bash
# Navigate to chrome-extension folder
cd chrome-extension

# Create ZIP (exclude unnecessary files)
zip -r ../reviewresponder-extension.zip . -x "*.git*" -x "*.DS_Store" -x "create-icons.html"

# Or on Windows PowerShell:
Compress-Archive -Path * -DestinationPath ../reviewresponder-extension.zip -Force
```

Files to include in ZIP:

- manifest.json
- popup.html
- popup.js
- popup.css
- content.js
- content.css
- icons/icon16.png
- icons/icon48.png
- icons/icon128.png

---

## SCREENSHOTS ERSTELLEN (ANLEITUNG)

### Tool-Empfehlung:

- Chrome DevTools (F12) > Device Toolbar > Set to 1280x800
- Oder: Screenshot-Tool wie Snagit, Greenshot

### Screenshot 1: Overview

1. Öffne Google Maps
2. Suche ein Business mit Reviews
3. Zeige ReviewResponder Button bei einer Review
4. Screenshot bei 1280x800

### Screenshot 2: Generate

1. Klicke auf "Generate Response"
2. Screenshot während Loading-Animation
3. Oder: Screenshot des geöffneten Popup

### Screenshot 3: Result

1. Generierte Response im Popup
2. Copy-Button deutlich sichtbar
3. Tone-Dropdown sichtbar

### Screenshot 4: Dashboard

1. Öffne Web-Dashboard
2. Zeige Response History
3. Analytics oder Usage Stats

---

## SUPPORT INFORMATION

### Support Email:

```
berend.mainz@web.de
```

### Website:

```
https://review-responder-frontend.onrender.com
```

### Support URL (für Store Listing):

```
https://review-responder-frontend.onrender.com/help
```

---

## VERSION HISTORY

| Version | Datum    | Änderungen      |
| ------- | -------- | --------------- |
| 1.0.0   | Jan 2026 | Initial release |

---

## NOTES

- Chrome Web Store Review kann 1-3 Tage dauern
- Bei Ablehnung: Feedback lesen und Änderungen vornehmen
- Updates sind schneller als Erstsubmission
- Nutzer-Reviews helfen beim Ranking

---

**Nächster Schritt:** Screenshots erstellen und Extension im Chrome Developer Dashboard hochladen!
