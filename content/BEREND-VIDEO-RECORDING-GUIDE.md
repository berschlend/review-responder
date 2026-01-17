# Demo Video Recording Guide

> **Ziel:** Alles bereit, du musst nur noch OBS starten und aufnehmen.

---

## 5-MINUTEN QUICK-START

### 1. Vorher checken (1 Min)
- [ ] Chrome offen mit Extension installiert
- [ ] OBS bereit (Profile: 1920x1080, 30fps)
- [ ] Demo-Page Tab offen

### 2. URL oeffnen (Copy-Paste)
```
https://tryreviewresponder.com/demo-video-page.html?hideControls=true
```

**Mit Timer:**
```
https://tryreviewresponder.com/demo-video-page.html?hideControls=true&showTimer=true
```

### 3. Recording starten
1. OBS: "Start Recording"
2. Flow ausfuehren (siehe Script unten)
3. OBS: "Stop Recording"

### 4. Fertig!
Video liegt in deinem OBS Output Folder.

---

## 15-SEKUNDEN SCRIPT (AUSWENDIG LERNEN)

```
TIMING CHEATSHEET - An Screen kleben!

[0-3s]  HOOK
        - Review auf Screen zeigen
        - Cursor auf 1-Stern Review

[4-6s]  CLICK
        - Extension Icon klicken
        - Generate Button klicken

[7-9s]  WAIT
        - Loading Animation laeuft
        - Nichts tun, warten

[10-13s] RESPONSE
        - Response erscheint
        - 3 Sekunden zeigen!

[14-15s] PASTE
        - Copy klicken
        - In Textfeld pasten
        - Submit klicken
```

---

## DEMO-PAGE FEATURES

### Controls (unten rechts)
| Button | Funktion |
|--------|----------|
| Reset Demo | Alles zuruecksetzen |
| Toggle Timer | Timer ein/aus |
| Hide Controls | Buttons verstecken |

### URL Parameter
| Parameter | Wert | Effekt |
|-----------|------|--------|
| `hideControls` | `true` | Versteckt Buttons (fuer Recording) |
| `showTimer` | `true` | Zeigt Stopuhr |
| `business` | Text | Aendert Business-Name |
| `review` | Text | Aendert Review-Text |

### Custom URL Beispiel
```
?hideControls=true&business=Mein%20Restaurant&review=Schreckliches%20Essen!
```

---

## EXTENSION SETUP

Die Extension erkennt die Demo-Page automatisch:
- Platform: "Demo"
- Reply Button: Funktioniert
- Generate: Funktioniert
- Copy & Paste: Funktioniert

**Teste vorher:**
1. Demo-Page oeffnen
2. Extension Icon klicken
3. "Generate" klicken
4. Response erscheint
5. "Copy" klicken
6. "Reply" auf der Page klicken
7. Ctrl+V pasten
8. "Post reply" klicken

---

## OBS SETTINGS

### Profile erstellen: "ReviewResponder Demo"

| Setting | Wert |
|---------|------|
| Resolution | 1920x1080 |
| FPS | 30 |
| Output Format | MP4 (H.264) |
| Bitrate | 8000 kbps |
| Audio | Desktop Audio only |

### Scene Setup
1. **Source:** "Window Capture"
2. **Window:** Chrome - Demo Video Page
3. **Optional:** Timer Overlay (wenn nicht URL Parameter)

### Hotkeys (empfohlen)
| Aktion | Taste |
|--------|-------|
| Start Recording | F9 |
| Stop Recording | F10 |

---

## TROUBLESHOOTING

### Problem: Extension reagiert nicht
**Loesung:**
1. Page refreshen (Ctrl+R)
2. Extension Icon klicken (muss aktiv sein)
3. Falls grau: Chrome Extension Seite oeffnen, Extension aktivieren

### Problem: Generate Button fehlt
**Loesung:**
1. Review-Text auf der Page markieren
2. Dann Extension oeffnen
3. Generate sollte erscheinen

### Problem: Demo-Page laed nicht
**Loesung:**
1. URL checken (tryreviewresponder.com nicht localhost)
2. Internet-Verbindung pruefen
3. Inkognito Tab probieren

### Problem: Paste funktioniert nicht
**Loesung:**
1. Erst "Reply" Button klicken (oeffnet Textfeld)
2. In Textfeld klicken
3. Ctrl+V druecken
4. Falls nichts: Extension "Copy" nochmal klicken

---

## POST-PRODUCTION CHEATSHEET

### Text-Overlays (CapCut/DaVinci)

| Zeit | Text | Farbe | Animation |
|------|------|-------|-----------|
| 0:00 | "Right now..." | Weiss | Fade in |
| 0:01 | "1,247 people" | Rot #FF4444 | Pop |
| 0:02 | "YOUR worst review" | Weiss | Slide |
| 0:10 | "READ THIS." | Blau #2196F3 | Shake |
| 0:14 | "13 seconds." | Gruen #4CAF50 | Scale up |
| 0:15 | "tryreviewresponder.com" | Orange #FF6B35 | Glow |

### Sound Effects (Pixabay)

| Zeit | Sound | Pixabay Suche |
|------|-------|---------------|
| 0:03 | Tension | "suspense hit short" |
| 0:04 | Click | "ui click soft" |
| 0:06 | Button | "button press digital" |
| 0:10 | Success | "notification ding" |
| 0:14 | Whoosh | "whoosh success" |

### Farben (Hex-Codes)
```
Weiss:  #FFFFFF
Rot:    #FF4444
Gelb:   #FFD700
Blau:   #2196F3
Gruen:  #4CAF50
Orange: #FF6B35
```

---

## EXPORT SETTINGS

| Platform | Resolution | Format |
|----------|------------|--------|
| YouTube | 1920x1080 | MP4 H.264 |
| TikTok | 1080x1920 | MP4 H.264 |
| LinkedIn | 1920x1080 | MP4 H.264 |

**Dateiname:** `rr-15s-your-review-v1.mp4`

---

## PRE-FLIGHT CHECKLIST

Vor jedem Recording durchgehen:

- [ ] 1. Chrome geschlossen und neu geoeffnet
- [ ] 2. Extension aktiv (Icon nicht grau)
- [ ] 3. Demo-Page URL korrekt
- [ ] 4. Controls versteckt (?hideControls=true)
- [ ] 5. OBS auf richtige Scene
- [ ] 6. OBS Output Folder leer / Platz vorhanden
- [ ] 7. Notifications aus (Focus Mode)
- [ ] 8. Maus-Cursor sichtbar (nicht zu klein)
- [ ] 9. Test-Run ohne Recording gemacht
- [ ] 10. Kaffee geholt

---

## WEITERE RESSOURCEN

| Datei | Inhalt |
|-------|--------|
| `content/video-15s-ultra.md` | Vollstaendiges 15s Script |
| `content/video-scripts-final.md` | 30s/45s/60s Scripts |
| `content/video-scripts/15s-cheatsheet.md` | Timing auf 1 Seite |
| `content/video-assets/sfx/README.md` | Sound Effects Links |
| `content/video-assets/backup-review-texts.md` | Fallback Review-Texte |

---

## QUICK LINKS

- **Demo Page:** https://tryreviewresponder.com/demo-video-page.html
- **Pixabay SFX:** https://pixabay.com/sound-effects/
- **Canva:** https://canva.com (Thumbnail Templates)

---

**Los geht's! Du hast alles was du brauchst.**
