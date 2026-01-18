<#
.SYNOPSIS
    ReviewResponder Demo Video - 1-Click Recording + Processing

.DESCRIPTION
    Dieses Script macht ALLES:
    1. Prueft OBS Installation
    2. Oeffnet Demo-Seite im Browser
    3. Zeigt Anweisungen
    4. Wartet auf Recording-Datei
    5. Fuehrt automatisches Post-Processing aus

.USAGE
    .\scripts\record-demo.ps1
#>

$ErrorActionPreference = "Continue"

# Konfiguration
$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DemoUrl = "https://tryreviewresponder.com/demo-video-page.html?hideControls=true"
$RecordingDir = "$env:USERPROFILE\Videos"
$OutputDir = "$ProjectDir\content\video-scripts"
$CheatsheetPath = "$ProjectDir\content\video-scripts\15s-cheatsheet.md"

# Farben
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Banner {
    Clear-Host
    Write-Color "=============================================" "Cyan"
    Write-Color "   ReviewResponder Demo Video Recorder" "Cyan"
    Write-Color "=============================================" "Cyan"
    Write-Host ""
}

function Test-OBSInstalled {
    $obsPath = Get-Command obs64.exe -ErrorAction SilentlyContinue
    if (-not $obsPath) {
        $obsPath = Get-ChildItem "C:\Program Files\obs-studio\bin\64bit\obs64.exe" -ErrorAction SilentlyContinue
    }
    return $obsPath
}

function Show-Checklist {
    Write-Color "`nVOR DEM RECORDING - Checkliste:" "Yellow"
    Write-Host ""
    Write-Host "  [ ] Einfarbiges Shirt an (dunkelblau/schwarz/grau)"
    Write-Host "  [ ] Licht AUF dein Gesicht (nicht von hinten!)"
    Write-Host "  [ ] Hintergrund aufgeraeumt"
    Write-Host "  [ ] Handy auf stumm"
    Write-Host "  [ ] Wasser getrunken"
    Write-Host ""
}

function Show-Script {
    Write-Color "15-SEKUNDEN SCRIPT:" "Green"
    Write-Host ""
    Write-Host "  0:00  'Schau dir diese Review an...'"
    Write-Host "  0:03  'Das zerstoert gerade dein Business.'"
    Write-Host "  0:05  *klick auf Extension Button*"
    Write-Host "  0:07  'Ein Klick...'"
    Write-Host "  0:10  *Response erscheint*"
    Write-Host "  0:11  '...und fertig.'"
    Write-Host "  0:13  'tryreviewresponder.com'"
    Write-Host ""
}

function Show-TimingCheatsheet {
    Write-Color "TIMING (was du KLICKST):" "Magenta"
    Write-Host ""
    Write-Host "  0:04 - CLICK auf 'Respond' Button"
    Write-Host "  0:06 - CLICK auf 'Generate' Button"
    Write-Host "  0:07-0:09 - WARTEN (Loading...)"
    Write-Host "  0:10 - Response erscheint!"
    Write-Host "  0:14 - CLICK Copy -> Paste -> Submit"
    Write-Host ""
}

function Wait-ForRecording {
    Write-Color "`nWarte auf neue Recording-Datei in: $RecordingDir" "Gray"
    Write-Host "(Starte OBS Recording, dann stoppe wenn fertig)"
    Write-Host ""

    # Hole aktuelle Dateien
    $existingFiles = Get-ChildItem "$RecordingDir\*.mp4", "$RecordingDir\*.mkv", "$RecordingDir\*.webm" -ErrorAction SilentlyContinue
    $existingPaths = $existingFiles | ForEach-Object { $_.FullName }

    $timeout = 600  # 10 Minuten max
    $elapsed = 0
    $checkInterval = 2

    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval

        # Suche neue Dateien
        $currentFiles = Get-ChildItem "$RecordingDir\*.mp4", "$RecordingDir\*.mkv", "$RecordingDir\*.webm" -ErrorAction SilentlyContinue

        foreach ($file in $currentFiles) {
            if ($file.FullName -notin $existingPaths) {
                # Warte bis Datei fertig geschrieben
                Start-Sleep -Seconds 2
                $size1 = (Get-Item $file.FullName).Length
                Start-Sleep -Seconds 1
                $size2 = (Get-Item $file.FullName).Length

                if ($size1 -eq $size2 -and $size2 -gt 0) {
                    Write-Color "`nNeue Recording gefunden: $($file.Name)" "Green"
                    return $file.FullName
                }
            }
        }

        # Progress anzeigen
        Write-Host "." -NoNewline
    }

    Write-Color "`nTimeout - keine neue Recording gefunden" "Red"
    return $null
}

function Process-Video {
    param([string]$InputPath)

    Write-Color "`nStarte Post-Processing..." "Yellow"

    $pythonScript = "$ProjectDir\scripts\demo-video-postprocess.py"
    $outputPath = "$OutputDir\demo-video-final.mp4"

    if (Test-Path $pythonScript) {
        python $pythonScript $InputPath $outputPath

        if (Test-Path $outputPath) {
            Write-Color "`nFERTIG! Video gespeichert:" "Green"
            Write-Host "  $outputPath"

            # Video oeffnen
            Start-Process $outputPath
            return $outputPath
        }
    } else {
        Write-Color "Post-Processing Script nicht gefunden: $pythonScript" "Red"
    }

    return $null
}

# ========== MAIN ==========

Write-Banner

# 1. OBS Check
Write-Color "Pruefe OBS Installation..." "Gray"
$obs = Test-OBSInstalled
if (-not $obs) {
    Write-Color "OBS nicht gefunden!" "Red"
    Write-Host ""
    Write-Host "Bitte installiere OBS Studio:"
    Write-Host "  https://obsproject.com/download"
    Write-Host ""
    Write-Host "Nach Installation:"
    Write-Host "  1. OBS oeffnen"
    Write-Host "  2. Sources -> Video Capture Device (Webcam)"
    Write-Host "  3. Sources -> Window Capture (Chrome)"
    Write-Host "  4. Webcam unten links positionieren"
    Write-Host ""
    Read-Host "Druecke Enter wenn OBS eingerichtet ist"
}

# 2. Demo-Seite oeffnen
Write-Color "`nOeffne Demo-Seite im Browser..." "Gray"
Start-Process $DemoUrl
Start-Sleep -Seconds 2

# 3. Checkliste zeigen
Show-Checklist

# 4. Script zeigen
Show-Script

# 5. Timing zeigen
Show-TimingCheatsheet

# 6. Bereit?
Write-Color "=============================================" "Cyan"
Write-Color "BEREIT ZUM RECORDING!" "Green"
Write-Color "=============================================" "Cyan"
Write-Host ""
Write-Host "1. Oeffne OBS"
Write-Host "2. Stelle sicher Webcam + Chrome Window sichtbar"
Write-Host "3. Klicke 'Start Recording' in OBS"
Write-Host "4. Folge dem Script oben (15 Sekunden)"
Write-Host "5. Klicke 'Stop Recording' in OBS"
Write-Host ""
Write-Color "Dieses Script wartet automatisch auf die Recording..." "Gray"
Write-Host ""

Read-Host "Druecke Enter wenn du bereit bist"

# 7. Warte auf Recording
$recordingPath = Wait-ForRecording

if ($recordingPath) {
    # 8. Post-Processing
    $finalPath = Process-Video -InputPath $recordingPath

    if ($finalPath) {
        Write-Host ""
        Write-Color "=============================================" "Green"
        Write-Color "ALLES FERTIG!" "Green"
        Write-Color "=============================================" "Green"
        Write-Host ""
        Write-Host "Video mit Overlays: $finalPath"
        Write-Host ""
        Write-Host "Naechste Schritte:"
        Write-Host "  1. Video anschauen (oeffnet sich automatisch)"
        Write-Host "  2. Upload zu TikTok/Instagram/YouTube"
        Write-Host ""
    }
} else {
    Write-Color "`nKeine Recording gefunden. Bitte manuell verarbeiten:" "Yellow"
    Write-Host "  python scripts\demo-video-postprocess.py <input.mp4>"
}

Write-Host ""
Read-Host "Druecke Enter zum Beenden"
