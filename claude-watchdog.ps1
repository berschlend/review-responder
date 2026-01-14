# Claude Night Watchdog
# Startet Claude automatisch neu und checkt auf Login-Requests

$PROJECT_DIR = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$LOCK_DIR = "$PROJECT_DIR\content\claude-locks"

Write-Host "=== CLAUDE NIGHT WATCHDOG ===" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_DIR"
Write-Host "Lock Dir: $LOCK_DIR"
Write-Host ""

# Sicherstellen dass Lock-Verzeichnis existiert
if (-not (Test-Path $LOCK_DIR)) {
    New-Item -ItemType Directory -Path $LOCK_DIR -Force | Out-Null
    Write-Host "Created lock directory" -ForegroundColor Green
}

$iteration = 0

while ($true) {
    $iteration++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host ""
    Write-Host "[$timestamp] === ITERATION $iteration ===" -ForegroundColor Yellow

    # Check ob Login-Request existiert BEVOR Claude gestartet wird
    $loginRequest = "$LOCK_DIR\LOGIN_REQUEST.md"
    if (Test-Path $loginRequest) {
        Write-Host ""
        Write-Host "!!! LOGIN REQUEST DETECTED !!!" -ForegroundColor Red
        Write-Host ""
        Get-Content $loginRequest
        Write-Host ""
        Write-Host "Please handle the login in the browser, then delete LOGIN_REQUEST.md" -ForegroundColor Yellow
        Write-Host "File location: $loginRequest"
        Write-Host ""
        Read-Host "Press Enter when done..."

        # Check ob User die Datei geloescht hat
        if (Test-Path $loginRequest) {
            Write-Host "LOGIN_REQUEST.md still exists. Deleting it now..." -ForegroundColor Yellow
            Remove-Item $loginRequest -Force
        }
    }

    Write-Host "[$timestamp] Starting Claude Night Blast..." -ForegroundColor Green

    # Wechsle ins Projekt-Verzeichnis und starte Claude
    Push-Location $PROJECT_DIR
    try {
        # Starte Claude mit Chrome MCP und night-blast command
        claude --chrome -e "/night-blast"
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    $endTime = Get-Date -Format "HH:mm:ss"
    Write-Host "[$endTime] Claude exited with code: $exitCode" -ForegroundColor Yellow

    # Check ob es Zeit ist aufzuhoeren (08:00 - 22:00 = Tagzeit)
    $hour = (Get-Date).Hour
    if ($hour -ge 8 -and $hour -lt 22) {
        Write-Host ""
        Write-Host "Daytime reached (08:00-22:00). Stopping watchdog." -ForegroundColor Cyan
        Write-Host "Total iterations: $iteration"
        break
    }

    # Kurze Pause bevor Neustart
    Write-Host "Restarting in 10 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "=== WATCHDOG STOPPED ===" -ForegroundColor Cyan
