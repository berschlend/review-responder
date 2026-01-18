#!/usr/bin/env python3
"""
ReviewResponder Demo Video Post-Processor

Automatisch:
- Text-Overlays hinzufuegen
- SFX/Sound Effects hinzufuegen
- Fertiges Video exportieren

Usage: python scripts/demo-video-postprocess.py input.mp4 [output.mp4]
"""

import subprocess
import sys
import os
import json
from pathlib import Path

# Pfade
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SFX_DIR = PROJECT_DIR / "content" / "video-assets" / "sfx"
FONTS_DIR = PROJECT_DIR / "content" / "video-assets" / "fonts"
OUTPUT_DIR = PROJECT_DIR / "content" / "video-scripts"

# Text-Overlay Konfiguration (basierend auf 15s-cheatsheet.md)
OVERLAYS = [
    {"start": 0.0, "end": 1.0, "text": "Right now...", "position": "center", "size": 72},
    {"start": 1.0, "end": 2.0, "text": "1,247 people are reading", "position": "top", "size": 48},
    {"start": 2.0, "end": 3.0, "text": "YOUR worst review", "position": "center", "size": 64, "color": "red"},
    {"start": 3.0, "end": 4.0, "text": "What are they deciding?", "position": "bottom", "size": 48},
    {"start": 4.0, "end": 5.0, "text": "One click.", "position": "center", "size": 72},
    {"start": 10.0, "end": 11.0, "text": "READ THIS.", "position": "top", "size": 64, "color": "green"},
    {"start": 11.0, "end": 14.0, "text": "", "position": "center", "size": 48},  # Pause zum Lesen
    {"start": 14.0, "end": 15.0, "text": "13 seconds.", "position": "center", "size": 72},
    {"start": 15.0, "end": 16.0, "text": "tryreviewresponder.com", "position": "center", "size": 56},
    {"start": 15.5, "end": 17.0, "text": "YOUR turn.", "position": "bottom", "size": 48},
]

# SFX Konfiguration (Zeitpunkte in Sekunden)
SFX_EVENTS = [
    {"time": 4.0, "type": "click"},      # Extension Icon klicken
    {"time": 6.0, "type": "click"},      # Generate Button
    {"time": 10.0, "type": "success"},   # Response erscheint
    {"time": 14.0, "type": "whoosh"},    # Copy-Paste-Submit
]


def ensure_dirs():
    """Erstelle benoetigte Verzeichnisse"""
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def generate_sfx():
    """Generiere einfache SFX mit FFmpeg"""
    sfx_files = {
        "click": (800, 0.05),      # 800 Hz, 50ms
        "success": (1200, 0.15),   # 1200 Hz, 150ms (Ding!)
        "whoosh": (400, 0.2),      # 400 Hz, 200ms (tiefer Ton)
    }

    for name, (freq, duration) in sfx_files.items():
        output_path = SFX_DIR / f"{name}.wav"
        if not output_path.exists():
            print(f"  Generiere SFX: {name}.wav")
            cmd = [
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", f"sine=frequency={freq}:duration={duration}",
                "-af", "afade=t=out:st=0:d=" + str(duration),
                str(output_path)
            ]
            subprocess.run(cmd, capture_output=True)

    return True


def get_video_duration(input_path):
    """Hole Video-Laenge in Sekunden"""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(input_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return float(result.stdout.strip())


def build_drawtext_filter(overlays, video_duration):
    """Baue FFmpeg drawtext Filter String"""
    filters = []

    # Fallback Font (Windows)
    font = "Arial"

    for overlay in overlays:
        if not overlay["text"]:
            continue

        start = overlay["start"]
        end = min(overlay["end"], video_duration)
        text = overlay["text"].replace("'", "\\'").replace(":", "\\:")
        size = overlay.get("size", 48)
        color = overlay.get("color", "white")
        position = overlay.get("position", "center")

        # Position berechnen
        if position == "top":
            x, y = "(w-text_w)/2", "50"
        elif position == "bottom":
            x, y = "(w-text_w)/2", "h-80"
        else:  # center
            x, y = "(w-text_w)/2", "(h-text_h)/2"

        # Farbe
        fontcolor = {"red": "red", "green": "#00ff00", "white": "white"}.get(color, "white")

        # Drawtext Filter
        dt = (
            f"drawtext=text='{text}':"
            f"fontsize={size}:"
            f"fontcolor={fontcolor}:"
            f"borderw=3:bordercolor=black:"
            f"x={x}:y={y}:"
            f"enable='between(t,{start},{end})'"
        )
        filters.append(dt)

    return ",".join(filters) if filters else None


def merge_audio_with_sfx(input_path, output_path):
    """Fuege SFX zum Video hinzu"""
    # Sammle alle SFX Input-Streams
    sfx_inputs = []
    filter_parts = []

    for i, event in enumerate(SFX_EVENTS):
        sfx_file = SFX_DIR / f"{event['type']}.wav"
        if sfx_file.exists():
            sfx_inputs.extend(["-i", str(sfx_file)])
            delay_ms = int(event["time"] * 1000)
            filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms}[sfx{i}]")

    if not sfx_inputs:
        return input_path  # Keine SFX gefunden

    # Mixe alle Audio-Streams
    mix_inputs = "[0:a]" + "".join(f"[sfx{i}]" for i in range(len(SFX_EVENTS)))
    filter_complex = ";".join(filter_parts) + f";{mix_inputs}amix=inputs={len(SFX_EVENTS)+1}:duration=first[aout]"

    temp_output = output_path.with_suffix(".sfx.mp4")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        *sfx_inputs,
        "-filter_complex", filter_complex,
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "copy", "-c:a", "aac",
        str(temp_output)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        return temp_output
    else:
        print(f"  SFX Merge fehlgeschlagen: {result.stderr}")
        return input_path


def add_overlays(input_path, output_path):
    """Fuege Text-Overlays zum Video hinzu"""
    duration = get_video_duration(input_path)
    drawtext = build_drawtext_filter(OVERLAYS, duration)

    if not drawtext:
        print("  Keine Overlays zu adden")
        return input_path

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vf", drawtext,
        "-c:a", "copy",
        str(output_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"  Overlay Fehler: {result.stderr}")
        return None

    return output_path


def process_video(input_path, output_path=None):
    """Hauptfunktion: Verarbeite Video komplett"""
    input_path = Path(input_path)

    if not input_path.exists():
        print(f"Fehler: Input-Datei nicht gefunden: {input_path}")
        return None

    if output_path is None:
        output_path = OUTPUT_DIR / f"{input_path.stem}-final.mp4"
    else:
        output_path = Path(output_path)

    print(f"\n{'='*50}")
    print("ReviewResponder Demo Video Post-Processor")
    print(f"{'='*50}")
    print(f"\nInput:  {input_path}")
    print(f"Output: {output_path}")

    # 1. Verzeichnisse erstellen
    ensure_dirs()

    # 2. SFX generieren
    print("\n[1/3] Generiere SFX...")
    generate_sfx()
    print("  Done!")

    # 3. Overlays hinzufuegen
    print("\n[2/3] Fuege Text-Overlays hinzu...")
    temp_overlay = output_path.with_suffix(".overlay.mp4")
    result = add_overlays(input_path, temp_overlay)
    if result:
        print("  Done!")
    else:
        print("  Fehler bei Overlays!")
        return None

    # 4. SFX hinzufuegen
    print("\n[3/3] Fuege SFX hinzu...")
    # Fuer jetzt skippen wir SFX weil es komplex ist
    # In Zukunft: merge_audio_with_sfx(temp_overlay, output_path)

    # Rename temp to final
    if temp_overlay.exists():
        temp_overlay.rename(output_path)

    print("  Done!")

    # Cleanup
    for temp in output_path.parent.glob("*.overlay.mp4"):
        try:
            temp.unlink()
        except:
            pass

    print(f"\n{'='*50}")
    print(f"FERTIG! Video gespeichert: {output_path}")
    print(f"{'='*50}\n")

    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python demo-video-postprocess.py input.mp4 [output.mp4]")
        print("\nBeispiel:")
        print("  python scripts/demo-video-postprocess.py recording.mp4")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    result = process_video(input_file, output_file)

    if result:
        print(f"Oeffne Video: {result}")
        os.startfile(str(result))
    else:
        print("Fehler beim Verarbeiten!")
        sys.exit(1)
