# Demo Video Briefing fuer Berend

> **Ziel:** 15-Sekunden Video das konvertiert.
> **Setup:** 1-Click Script macht fast alles automatisch!

---

## 1-CLICK RECORDING (NEU!)

### So einfach geht's jetzt:

```powershell
# Im Terminal ausfuehren:
powershell -File "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\scripts\record-demo.ps1"
```

**Oder:** Doppelklick auf `scripts\record-demo.ps1`

### Was das Script macht:
1. Prueft ob OBS installiert ist
2. Oeffnet die Demo-Seite automatisch
3. Zeigt dir das Script + Timing an
4. Wartet auf deine Recording
5. Fuegt automatisch Text-Overlays hinzu
6. Oeffnet das fertige Video

---

## VOR DEM ERSTEN MAL (einmalig, 10 Min)

### 1. OBS installieren
- Download: https://obsproject.com/download
- Installieren, dann OBS oeffnen

### 2. OBS einrichten

**Webcam hinzufuegen:**
1. Unten bei "Sources" → Klick auf "+"
2. Waehle "Video Capture Device"
3. Waehle deine Webcam
4. OK klicken
5. Webcam auf ~300x200 Pixel verkleinern
6. Nach unten links ziehen

**Chrome Window hinzufuegen:**
1. Sources → + → "Window Capture"
2. Waehle Chrome Fenster
3. OK klicken

**Scene sollte so aussehen:**
```
+------------------------------------+
|                                    |
|     [Chrome Window Capture]        |
|                                    |
|                                    |
| +------+                           |
| |Webcam|                           |
| +------+                           |
+------------------------------------+
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

**Alternative: Stumme Version**
- Du zeigst nur mit der Maus
- Text-Overlays werden automatisch eingefuegt
- Einfacher, weniger Fehler

---

## WAS DU KLICKST (Timing)

```
0:04 - CLICK auf "Respond" Button (Extension)
0:06 - CLICK auf "Generate" Button
0:07-0:09 - WARTEN (Loading Animation)
0:10 - Response erscheint!
0:14 - CLICK Copy → Paste → Submit (schnell!)
```

---

## NACH DEM RECORDING

**Das Script macht automatisch:**
- Text-Overlays einfuegen
- Video speichern nach `content/video-scripts/demo-video-final.mp4`
- Video oeffnen

**Du machst:**
1. Video anschauen (gefaellt es dir?)
2. Upload zu TikTok/Instagram/YouTube

---

## FALLS ES NICHT KLAPPT

| Problem | Loesung |
|---------|---------|
| OBS findet Webcam nicht | Anderes Programm nutzt Webcam? Schliessen! |
| Webcam zu dunkel | Mehr Licht von vorne |
| Hintergrund haesslich | OBS Filter → Background Removal |
| Stimme klingt komisch | Stumme Version machen |
| Demo zu lang | Schneller klicken, weniger reden |
| Script findet Recording nicht | Manuell: `python scripts\demo-video-postprocess.py <input.mp4>` |

---

## TECHNISCHE DETAILS

**Was passiert im Hintergrund:**

1. `record-demo.ps1` - Hauptscript, startet alles
2. `demo-video-postprocess.py` - Fuegt Overlays hinzu mit FFmpeg
3. `content/video-assets/sfx/` - Sound Effects (click.wav, success.wav, whoosh.wav)

**Overlays die automatisch eingefuegt werden:**
- "Right now..." (0:00)
- "1,247 people are reading" (0:01)
- "YOUR worst review" (0:02) - ROT
- "One click." (0:04)
- "READ THIS." (0:10) - GRUEN
- "13 seconds." (0:14)
- "tryreviewresponder.com" (0:15)
- "YOUR turn." (0:15)

---

## MOTIVATION

> "Das erste Video ist das schwerste. Danach wird's Routine."
>
> 15 Sekunden. Ein Take. Kein Perfektionismus.
>
> Schlechtes Video online > Perfektes Video nie gemacht.

---

## QUICK START (TL;DR)

1. **Einmalig:** OBS installieren + einrichten (10 Min)
2. **Jeden Tag:** Script starten → Recording → Fertig!

```powershell
.\scripts\record-demo.ps1
```
