# Demo Video Briefing fuer Berend

> **Ziel:** 15-Sekunden Video das konvertiert.
> **Status:** ALLES READY! Nur PC Restart fuer Visual C++ noetig.

---

## QUICK START (TL;DR)

```powershell
# Nach PC Restart einfach ausfuehren:
.\scripts\record-demo.ps1

# Das Script macht ALLES automatisch:
# - Prueft Dependencies (FFmpeg, Python, OBS)
# - Startet OBS mit richtiger Config
# - Oeffnet Demo-Seite
# - Zeigt dir das Script
# - Wartet auf deine Recording
# - Fuegt Overlays hinzu
# - Oeffnet fertiges Video
```

---

## VOR DEM ERSTEN MAL (Einmalig)

### Schritt 1: PC Neustarten
Visual C++ wurde installiert - PC muss neu starten.

### Schritt 2: Script starten
```powershell
cd "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
.\scripts\record-demo.ps1
```

### Schritt 3: OBS einrichten (nur beim 1. Mal!)
Das Script richtet OBS automatisch ein. Du musst nur:
1. **Rechtsklick auf "Chrome Window"** -> Properties -> Chrome Fenster waehlen
2. **Rechtsklick auf "Webcam"** -> Properties -> Deine Kamera waehlen
3. **Webcam verkleinern** und nach unten-links ziehen

**Fertig! Ab jetzt ist alles 1-Click.**

---

## WAS AUTOMATISCH PASSIERT

| Schritt | Automatisch? | Was du tun musst |
|---------|--------------|------------------|
| Dependencies pruefen | ✅ JA | - |
| OBS starten | ✅ JA | - |
| Demo-Seite oeffnen | ✅ JA | - |
| Script anzeigen | ✅ JA | Lesen! |
| Recording erkennen | ✅ JA | Start/Stop in OBS |
| Text-Overlays | ✅ JA | - |
| Video oeffnen | ✅ JA | - |

---

## WAS DU SAGST (15 Sekunden)

```
[0:00] "Schau dir diese Review an..."
[0:03] "Das zerstoert gerade dein Business."
[0:05] *klick auf Extension Button*
[0:07] "Ein Klick..."
[0:10] *Response erscheint*
[0:11] "...und fertig."
[0:13] "tryreviewresponder.com"
```

---

## WAS DU KLICKST (Timing)

```
0:04 - CLICK auf "Respond" Button (Extension)
0:06 - CLICK auf "Generate" Button
0:07-0:09 - WARTEN (Loading Animation)
0:10 - Response erscheint!
0:14 - CLICK Copy -> Paste -> Submit (schnell!)
```

---

## CHECKLISTE (vor jedem Recording)

```
[ ] Einfarbiges Shirt (dunkelblau/schwarz/grau)
[ ] Licht VOR dir (nicht hinter dir!)
[ ] Hintergrund aufgeraeumt
[ ] Handy auf stumm
[ ] Wasser getrunken
```

---

## EDGE CASES (Was wenn...?)

| Problem | Loesung |
|---------|---------|
| "FFmpeg nicht gefunden" | `winget install ffmpeg` und neu starten |
| "Python nicht gefunden" | Von python.org installieren |
| "OBS nicht gefunden" | obsproject.com/download |
| "Demo-Seite laedt nicht" | Internet pruefen |
| Webcam zu dunkel | Mehr Licht von vorne |
| Recording zu kurz | Mind. 10 Sek aufnehmen |
| Video korrupt | Nochmal aufnehmen |
| Post-Processing failed | Original wird trotzdem geoeffnet |

---

## TEXT-OVERLAYS (werden automatisch eingefuegt)

| Zeit | Text | Farbe |
|------|------|-------|
| 0:00 | "Right now..." | Weiss |
| 0:01 | "1,247 people are reading" | Weiss |
| 0:02 | "YOUR worst review" | **ROT** |
| 0:03 | "What are they deciding?" | Weiss |
| 0:04 | "One click." | Weiss |
| 0:10 | "READ THIS." | **GRUEN** |
| 0:14 | "13 seconds." | Weiss |
| 0:15 | "tryreviewresponder.com" | Weiss |
| 0:15 | "YOUR turn." | Weiss |

---

## DATEIEN

| Datei | Beschreibung |
|-------|--------------|
| `scripts/record-demo.ps1` | Haupt-Script (1-Click) |
| `scripts/setup-obs.ps1` | OBS Auto-Konfiguration |
| `scripts/demo-video-postprocess.py` | Overlay-Generator |
| `content/video-assets/sfx/` | Sound Effects |
| `content/video-scripts/` | Output-Videos landen hier |

---

## NACH DEM RECORDING

1. **Video anschauen** (oeffnet sich automatisch)
2. **Gefaellt es?**
   - JA → Upload zu TikTok/Instagram/YouTube
   - NEIN → Nochmal aufnehmen (Script erneut starten)

---

## ALTERNATIVE: Stumme Version

Falls Reden zu schwer:
- Einfach NUR klicken, nichts sagen
- Die Text-Overlays erzaehlen die Story
- Oft sogar besser fuer Social Media!

---

## MOTIVATION

> "Das erste Video ist das schwerste. Danach wird's Routine."
>
> 15 Sekunden. Ein Take. Kein Perfektionismus.
>
> **Schlechtes Video online > Perfektes Video nie gemacht.**

---

## SUPPORT

Bei Problemen:
```powershell
# Manuelles Post-Processing falls noetig:
python scripts\demo-video-postprocess.py "C:\Users\Berend Mainz\Videos\recording.mp4"
```

Oder frag Claude!
