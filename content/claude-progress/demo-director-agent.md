# DEMO-DIRECTOR Agent

> **Status:** READY
> **Session Name:** `$env:CLAUDE_SESSION = "DEMO-DIRECTOR"`
> **Last Updated:** 18.01.2026

---

## Mission

Alles fuer Demo-Video vorbereiten sodass Berend nur noch:
1. OBS starten
2. Browser oeffnen
3. Record druecken
4. Fertig

---

## Was wurde gebaut

### 1. Demo-Video-Page (NEU!)
**URL:** `https://tryreviewresponder.com/demo-video-page.html`
**Lokal:** `http://localhost:3000/demo-video-page.html`

**Features:**
- Google Maps Look (professionell, clean)
- 1-Stern Review (The Godfrey Hotel Hollywood)
- Reply Button -> oeffnet Reply-Feld
- Submit Button -> zeigt "Your reply was posted"
- Timer Overlay (optional)
- Reset Button fuer mehrere Takes

**URL Parameter:**
| Parameter | Beispiel | Beschreibung |
|-----------|----------|--------------|
| `?hideControls=true` | Versteckt Demo-Controls |
| `?showTimer=true` | Zeigt Timer Overlay |
| `?business=NAME` | Anderer Business-Name |
| `?review=TEXT` | Anderer Review-Text |

### 2. Extension Update
**File:** `chrome-extension/content.js`

**Aenderungen:**
- "Demo" Platform in PLATFORM_SELECTORS hinzugefuegt
- detectPlatform() erkennt jetzt:
  - `localhost` / `127.0.0.1` -> Demo Mode
  - `tryreviewresponder.com/demo*` -> Demo Mode
- "Demo" zu supportedPlatforms hinzugefuegt
- Paste & Submit funktioniert auf Demo-Page!

---

## Video Recording Flow

### Vorbereitung (1x)
1. Extension neu laden (chrome://extensions -> Reload)
2. Demo-Page oeffnen: `tryreviewresponder.com/demo-video-page.html`
3. OBS starten, 1920x1080, 30fps

### Recording (pro Take)
```
1. [0:00] Review-Text markieren
2. [0:02] Extension Panel oeffnet
3. [0:04] "Generate" klicken
4. [0:06-0:09] Loading Animation
5. [0:10] Response erscheint - PAUSE (Viewer liest!)
6. [0:13] "Paste & Submit" klicken
7. [0:14] Text im Reply-Feld + Submit
8. [0:15] "Your reply was posted" erscheint
9. STOP Recording
```

### Nach jedem Take
- Klick "Reset Demo" Button (unten rechts)
- Oder Seite neu laden

---

## Scripts Reference

| Script | Datei | Empfohlen fuer |
|--------|-------|----------------|
| **15s Ultra** | `content/video-15s-ultra.md` | TikTok, Reels |
| 30s | `content/video-scripts-final.md` | YouTube Shorts |
| 45s | `content/video-scripts-final.md` | LinkedIn, YouTube |

**Empfehlung:** 15s Version ZUERST (70% Completion Rate)

---

## Checklist vor Recording

- [ ] Extension neu geladen?
- [ ] Demo-Page laed richtig?
- [ ] Review-Text ist selektierbar?
- [ ] "Reply" Button funktioniert?
- [ ] Extension erkennt Platform als "Demo"?
- [ ] Generate funktioniert (API)?
- [ ] Paste & Submit Button sichtbar?
- [ ] OBS settings: 1920x1080, 30fps?
- [ ] Browser: Keine anderen Tabs sichtbar?
- [ ] Notifications deaktiviert?

---

## Troubleshooting

| Problem | Loesung |
|---------|---------|
| Extension zeigt nicht "Demo" | Extension neu laden |
| Paste & Submit fehlt | `supportedPlatforms` pruefen |
| Generate Error | Server warmup: curl API einmal |
| Reply-Feld reagiert nicht | Page neu laden |

---

## Quick Commands

```bash
# Server warmup
curl -s "https://review-responder.onrender.com/api/public/stats"

# Extension neu laden (Chrome)
# chrome://extensions -> ReviewResponder -> Reload

# Demo-Page lokal
cd frontend && npm start
# Dann: http://localhost:3000/demo-video-page.html
```

---

## Aktivierung

Sag:
```
Aktiviere DEMO-DIRECTOR
```

Oder starte mit:
```powershell
$env:CLAUDE_SESSION = "DEMO-DIRECTOR"
claude --chrome
```
