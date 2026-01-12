# Video Demo Checklist - ReviewResponder Extension v1.5.4

## Pre-Recording Setup

### Browser Setup
- [ ] Use Chrome (fresh profile or incognito for clean look)
- [ ] Install extension from `chrome-extension-v1.5.4.zip` (or load unpacked)
- [ ] Log in with: `berend.mainz@web.de` / `Cleeberg1`
- [ ] Clear browser history (optional, for clean URL bar)
- [ ] Set browser zoom to 100%
- [ ] Disable other extensions (avoid visual clutter)

### Screen Setup
- [ ] Resolution: 1920x1080 or 1280x720
- [ ] Close unnecessary tabs
- [ ] Hide bookmarks bar (Ctrl+Shift+B)
- [ ] Clean desktop (if visible)

---

## Video Script (Based on Audio)

### Scene 1: "Klick und generieren" (Click and Generate)
**Show:** Google Maps business page with reviews
**Action:**
1. Select a review text (10+ characters)
2. Show the floating button appearing (now larger, 64px with glow)
3. Click the floating button
4. Panel opens with the review loaded

### Scene 2: "Antwort-Knoepfe erscheinen automatisch"
**Show:** Navigate to Google Maps review page
**Action:**
1. Page loads
2. Green "Scan Reviews" button appears (bottom-left, pulsing)
3. Click the button

### Scene 3: "Text waehlen - Knopf erscheint direkt da"
**Show:** Any review text on the page
**Action:**
1. Highlight/select a review with mouse
2. Floating button appears near cursor
3. Click it to open panel

### Scene 4: "Batch-Modus"
**Show:** Panel with batch button in header
**Action:**
1. Click the batch button (clipboard icon) in panel header
2. Shows review count found on page
3. Select tone from dropdown

### Scene 5: "Generieren alle - Jede Antwort in Sekunden"
**Show:** Batch mode overlay
**Action:**
1. Click "Generate All Responses"
2. Show progress bar with shimmer animation
3. Tabs appear with generated responses

### Scene 6: "Geschaeftskontext und Ton kustomisieren"
**Show:** Panel options section
**Action:**
1. Show tone slider (Apologetic ↔ Friendly)
2. Show length dropdown (Short/Medium/Long)
3. Show emoji toggle

### Scene 7: "Professionell, freundlich oder entschuldigend"
**Show:** Tone dropdown
**Action:**
1. Click tone dropdown
2. Show 3 options: Professional, Friendly, Apologetic
3. Select one, show response changes

### Scene 8: "Ein Klick zum Kopieren"
**Show:** Generated response in panel
**Action:**
1. Click "Copy" button
2. Button turns green with animation
3. Toast notification: "Copied!"

### Scene 9: "Direkt in Antwort-Box - fertig"
**Show:** Google Maps reply field
**Action:**
1. Click "Paste & Submit" button
2. Response auto-fills into reply field
3. Ready to submit

### Scene 10: CTA
**Show:** tryreviewresponder.com
**Action:** Navigate to landing page, show pricing

---

## Key Visual Improvements in v1.5.4

| Feature | What Changed |
|---------|--------------|
| Floating Button | Larger (64px), enhanced glow shadow |
| Copy Button | Green gradient + bounce animation on success |
| Progress Bar | Shimmer animation effect |
| Scan Reviews Button | Pulsing glow animation |

---

## Keyboard Shortcuts (for smooth demo)

| Shortcut | Action |
|----------|--------|
| Alt+R | Generate response from selected text |
| Alt+T | Toggle Turbo Mode |
| Alt+C | Copy response |
| Alt+P | Open panel (ignores turbo mode) |
| Alt+Q | Toggle Queue/Batch Mode |
| Esc | Close panel/overlays |

---

## Troubleshooting

**If extension doesn't load:**
- Check if extension is enabled in chrome://extensions
- Reload the page after installing

**If no Scan Reviews button:**
- Only appears on supported platforms (Google Maps, Yelp, TripAdvisor)
- Wait 1 second after page loads

**If API errors:**
- Check login status (click extension icon)
- Verify internet connection
- Backend: https://review-responder.onrender.com may need to wake up (cold start)

**If reviews don't load on Google Maps:**
- Scroll down in the left panel to trigger lazy loading
- Click "See all reviews" link
- Try a different business

---

## Files

- Extension ZIP: `chrome-extension-v1.5.4.zip` (1.3 MB)
- Audio Script: `C:\Users\Berend Mainz\Documents\Audioaufzeichnungen\Aufzeichnung (73).m4a`

---

**Ready for recording!**
