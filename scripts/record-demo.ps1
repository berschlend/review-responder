<#
.SYNOPSIS
    ReviewResponder Demo Video - 1-Click Recording + Processing

.DESCRIPTION
    Dieses Script macht ALLES:
    1. Prueft alle Dependencies (OBS, FFmpeg, Python)
    2. Konfiguriert OBS automatisch
    3. Oeffnet Demo-Seite im Browser
    4. Zeigt Anweisungen
    5. Wartet auf Recording-Datei
    6. Fuehrt automatisches Post-Processing aus

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

# ========== EDGE CASE HANDLERS ==========

function Test-AllDependencies {
    $errors = @()

    # 1. FFmpeg Check
    $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if (-not $ffmpeg) {
        $errors += "FFmpeg nicht gefunden! Installiere mit: winget install ffmpeg"
    }

    # 2. Python Check
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) {
        $errors += "Python nicht gefunden! Installiere von python.org"
    }

    # 3. Videos Folder Check
    if (-not (Test-Path $RecordingDir)) {
        New-Item -ItemType Directory -Force -Path $RecordingDir | Out-Null
        Write-Color "  Videos Ordner erstellt: $RecordingDir" "Yellow"
    }

    # 4. Output Folder Check
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
        Write-Color "  Output Ordner erstellt: $OutputDir" "Yellow"
    }

    # 5. Post-Processing Script Check
    $postScript = "$ProjectDir\scripts\demo-video-postprocess.py"
    if (-not (Test-Path $postScript)) {
        $errors += "Post-Processing Script fehlt: $postScript"
    }

    return $errors
}

function Test-InternetConnection {
    try {
        $response = Invoke-WebRequest -Uri "https://tryreviewresponder.com" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

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

function Test-OBSConfigured {
    $scenePath = "$env:APPDATA\obs-studio\basic\scenes\ReviewResponder Demo.json"
    return (Test-Path $scenePath)
}

function Setup-OBS {
    $setupScript = "$ProjectDir\scripts\setup-obs.ps1"
    if (Test-Path $setupScript) {
        Write-Color "Starte OBS Auto-Setup..." "Yellow"
        & $setupScript
        return $true
    }
    return $false
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

    # Edge Case: Input file exists and has content?
    if (-not (Test-Path $InputPath)) {
        Write-Color "  FEHLER: Input-Datei nicht gefunden: $InputPath" "Red"
        return $null
    }

    $inputSize = (Get-Item $InputPath).Length
    if ($inputSize -lt 10000) {  # Less than 10KB = probably corrupt
        Write-Color "  FEHLER: Recording zu klein ($inputSize bytes) - moeglicherweise korrupt" "Red"
        Write-Host "  Bitte nochmal aufnehmen."
        return $null
    }

    $pythonScript = "$ProjectDir\scripts\demo-video-postprocess.py"

    # Timestamp fuer unique filename
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outputPath = "$OutputDir\demo-video-$timestamp.mp4"

    if (Test-Path $pythonScript) {
        Write-Color "  Verarbeite: $InputPath" "Gray"
        Write-Color "  Output: $outputPath" "Gray"

        # Run Python with error capture
        $result = python $pythonScript $InputPath $outputPath 2>&1

        if (Test-Path $outputPath) {
            $outputSize = (Get-Item $outputPath).Length
            if ($outputSize -gt 10000) {
                Write-Color "`nFERTIG! Video gespeichert:" "Green"
                Write-Host "  $outputPath"
                Write-Host "  Groesse: $([math]::Round($outputSize / 1MB, 2)) MB"

                # Video oeffnen
                Start-Process $outputPath
                return $outputPath
            } else {
                Write-Color "  FEHLER: Output-Video zu klein - FFmpeg Problem?" "Red"
            }
        } else {
            Write-Color "  FEHLER: Output-Video nicht erstellt" "Red"
            Write-Host "  Python Output: $result"
        }
    } else {
        Write-Color "Post-Processing Script nicht gefunden: $pythonScript" "Red"
    }

    # Fallback: Original Video oeffnen
    Write-Color "`nFallback: Oeffne Original-Recording ohne Overlays..." "Yellow"
    Start-Process $InputPath
    return $InputPath
}

# ========== MAIN ==========

Write-Banner

# 0. Dependency Check (EDGE CASES!)
Write-Color "Pruefe Dependencies..." "Gray"
$depErrors = Test-AllDependencies
if ($depErrors.Count -gt 0) {
    Write-Color "`nFEHLENDE DEPENDENCIES:" "Red"
    foreach ($err in $depErrors) {
        Write-Host "  - $err"
    }
    Write-Host ""
    Write-Color "Bitte installiere fehlende Dependencies und starte neu." "Yellow"
    Read-Host "Druecke Enter zum Beenden"
    exit 1
}
Write-Color "  Alle Dependencies OK!" "Green"

# 0b. Internet Check
Write-Color "Pruefe Internet-Verbindung..." "Gray"
if (-not (Test-InternetConnection)) {
    Write-Color "  WARNUNG: Demo-Seite nicht erreichbar!" "Yellow"
    Write-Host "  Die Demo-Seite wird moeglicherweise nicht laden."
    Write-Host "  Fortfahren trotzdem? (Enter = Ja, Ctrl+C = Abbrechen)"
    Read-Host
}

# 1. OBS Check
Write-Color "Pruefe OBS Installation..." "Gray"
$obs = Test-OBSInstalled
if (-not $obs) {
    Write-Color "OBS nicht gefunden!" "Red"
    Write-Host ""
    Write-Host "Bitte installiere OBS Studio:"
    Write-Host "  https://obsproject.com/download"
    Write-Host ""
    Read-Host "Druecke Enter wenn OBS installiert ist"
    $obs = Test-OBSInstalled
}

# 1b. OBS Setup Check
if ($obs -and -not (Test-OBSConfigured)) {
    Write-Color "OBS noch nicht konfiguriert - starte Auto-Setup..." "Yellow"
    Setup-OBS
    Write-Host ""
    Write-Color "WICHTIG: Waehle in OBS jetzt Chrome Window und Webcam aus!" "Yellow"
    Write-Host "  1. Rechtsklick auf 'Chrome Window' -> Properties -> Fenster waehlen"
    Write-Host "  2. Rechtsklick auf 'Webcam' -> Properties -> Kamera waehlen"
    Write-Host "  3. Webcam verkleinern und nach unten-links ziehen"
    Write-Host ""
    Read-Host "Druecke Enter wenn OBS fertig eingerichtet ist"
} elseif ($obs) {
    Write-Color "OBS bereits konfiguriert!" "Green"
    # OBS mit richtiger Scene Collection starten
    $obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
    Start-Process $obsPath -ArgumentList "--collection `"ReviewResponder Demo`""
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
