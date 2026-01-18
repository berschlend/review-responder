<#
.SYNOPSIS
    OBS Auto-Setup fuer ReviewResponder Demo Recording

.DESCRIPTION
    Erstellt automatisch:
    - Scene Collection "ReviewResponder Demo"
    - Window Capture (Chrome)
    - Video Capture (Webcam)
    - Output Settings (MP4, 1080p)

.USAGE
    .\scripts\setup-obs.ps1
#>

$ErrorActionPreference = "Continue"

# Pfade
$OBSConfigPath = "$env:APPDATA\obs-studio"
$ScenesPath = "$OBSConfigPath\basic\scenes"
$ProfilesPath = "$OBSConfigPath\basic\profiles"

# Farben
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "=============================================" "Cyan"
Write-Color "   OBS Auto-Setup fuer Demo Recording" "Cyan"
Write-Color "=============================================" "Cyan"
Write-Host ""

# 1. Ordner erstellen
Write-Color "[1/4] Erstelle OBS Konfigurationsordner..." "Yellow"
New-Item -ItemType Directory -Force -Path $ScenesPath | Out-Null
New-Item -ItemType Directory -Force -Path $ProfilesPath | Out-Null
New-Item -ItemType Directory -Force -Path "$ProfilesPath\ReviewResponder" | Out-Null
Write-Color "  Done!" "Green"

# 2. Scene Collection erstellen
Write-Color "[2/4] Erstelle Scene Collection..." "Yellow"

$sceneCollection = @"
{
    "current_scene": "Demo Recording",
    "current_program_scene": "Demo Recording",
    "scene_order": [
        {"name": "Demo Recording"}
    ],
    "name": "ReviewResponder Demo",
    "sources": [
        {
            "prev_ver": 503316480,
            "name": "Chrome Window",
            "uuid": "chrome-window-001",
            "id": "window_capture",
            "versioned_id": "window_capture",
            "settings": {
                "window": "",
                "priority": 1,
                "cursor": true
            },
            "mixers": 0,
            "sync": 0,
            "flags": 0,
            "volume": 1.0,
            "balance": 0.5,
            "enabled": true,
            "muted": false,
            "push-to-mute": false,
            "push-to-mute-delay": 0,
            "push-to-talk": false,
            "push-to-talk-delay": 0,
            "hotkeys": {}
        },
        {
            "prev_ver": 503316480,
            "name": "Webcam",
            "uuid": "webcam-001",
            "id": "dshow_input",
            "versioned_id": "dshow_input",
            "settings": {
                "video_device_id": "",
                "res_type": 1,
                "resolution": "1280x720"
            },
            "mixers": 255,
            "sync": 0,
            "flags": 0,
            "volume": 1.0,
            "balance": 0.5,
            "enabled": true,
            "muted": false,
            "push-to-mute": false,
            "push-to-mute-delay": 0,
            "push-to-talk": false,
            "push-to-talk-delay": 0,
            "hotkeys": {}
        }
    ],
    "groups": [],
    "quick_transitions": [],
    "transitions": [],
    "saved_projectors": [],
    "current_transition": "Fade",
    "transition_duration": 300,
    "modules": {}
}
"@

$sceneCollection | Out-File -FilePath "$ScenesPath\ReviewResponder Demo.json" -Encoding UTF8
Write-Color "  Done!" "Green"

# 3. Profile erstellen (Output Settings)
Write-Color "[3/4] Erstelle Recording Profile..." "Yellow"

$profileBasic = @"
[General]
Name=ReviewResponder

[Video]
BaseCX=1920
BaseCY=1080
OutputCX=1920
OutputCY=1080
FPSType=0
FPSCommon=30

[Output]
Mode=Simple
FilePath=$env:USERPROFILE\Videos
RecFormat=mp4
RecEncoder=x264
RecQuality=Stream
"@

$profileBasic | Out-File -FilePath "$ProfilesPath\ReviewResponder\basic.ini" -Encoding UTF8
Write-Color "  Done!" "Green"

# 4. OBS starten mit Scene Collection
Write-Color "[4/4] Starte OBS mit Demo-Setup..." "Yellow"

$obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
if (Test-Path $obsPath) {
    Start-Process $obsPath -ArgumentList "--collection `"ReviewResponder Demo`" --profile `"ReviewResponder`""
    Start-Sleep -Seconds 3
    Write-Color "  OBS gestartet!" "Green"
} else {
    Write-Color "  OBS nicht gefunden!" "Red"
}

Write-Host ""
Write-Color "=============================================" "Green"
Write-Color "   FAST FERTIG! Nur noch 2 Schritte:" "Green"
Write-Color "=============================================" "Green"
Write-Host ""
Write-Host "1. In OBS: Sources -> 'Chrome Window' -> Properties"
Write-Host "   -> Waehle das Chrome Fenster mit der Demo-Seite"
Write-Host ""
Write-Host "2. In OBS: Sources -> 'Webcam' -> Properties"
Write-Host "   -> Waehle deine Webcam"
Write-Host ""
Write-Host "3. Webcam verkleinern und nach unten-links ziehen"
Write-Host ""
Write-Color "FERTIG! Du kannst jetzt record-demo.ps1 nutzen!" "Cyan"
Write-Host ""
