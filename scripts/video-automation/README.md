# Demo Video Automation

> **Ziel:** Berend drueckt 1 Knopf, nimmt auf, Claude macht den Rest.

---

## Quick Start (3 Schritte)

### 1. Recording starten
```powershell
.\scripts\video-automation\record-demo.ps1
```

### 2. In OBS aufnehmen
- F9 = Start
- Demo durchfuehren (15 Sekunden)
- F10 = Stop

### 3. Post-Production
```powershell
.\scripts\video-automation\post-process.ps1 -InputVideo "C:\...\dein-video.mp4"
```

**Fertig!** Video hat Text-Overlays und ist upload-ready.

---

## Was passiert automatisch

| Phase | Script | Automation |
|-------|--------|------------|
| Pre-Check | record-demo.ps1 | API warm, Demo-Page live |
| Recording | OBS + Berend | Berend macht Demo |
| Post-Prod | post-process.ps1 | Text-Overlays, Encoding |

---

## Text-Overlays (automatisch eingefuegt)

| Zeit | Text |
|------|------|
| 0-3s | "Right now..." |
| 3-6s | "This review is DESTROYING your business" |
| 10-13s | "One click. Done." |
| 14-16s | "tryreviewresponder.com" |

---

## Troubleshooting

### OBS zeigt falsches Fenster
1. Scene: "Window Capture"
2. Window: Chrome auswählen
3. Demo-Page Tab aktiv

### Text-Overlays falsch positioniert
Edit `post-process.ps1` → `$Overlays` Array

### Video zu lang/kurz
Timestamps in `$Overlays` anpassen

---

## Claude Post-Production

Nach Recording kann Claude:
1. Video analysieren (Screenshots)
2. Schnitte vorschlagen
3. Overlays anpassen
4. ffmpeg commands generieren

Sag einfach: "Hier ist das Video, mach es fertig"

---

## Dateien

```
scripts/video-automation/
├── record-demo.ps1      # Pre-check + Browser oeffnen
├── post-process.ps1     # FFmpeg Post-Production
└── README.md            # Diese Datei

content/video-recordings/
└── demo-final-*.mp4     # Fertige Videos
```
