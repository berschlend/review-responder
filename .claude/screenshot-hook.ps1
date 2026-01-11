# Screenshot Hook für Claude Code
# Liest Prompt von stdin (JSON), prüft auf Keywords, führt Screenshot-Script aus

# JSON von stdin lesen
$jsonInput = [Console]::In.ReadToEnd()

try {
    $data = $jsonInput | ConvertFrom-Json
    $prompt = $data.prompt.ToLower()
} catch {
    exit 0  # Kein gültiges JSON = nichts tun
}

# Keywords prüfen (nur wenn wirklich Screenshot gemeint)
$screenshotPatterns = @(
    "screenshot",
    "screen shot",
    "bildschirmfoto",
    "hab.*bild",
    "bild gemacht",
    "foto gemacht"
)

$matched = $false
foreach ($pattern in $screenshotPatterns) {
    if ($prompt -match $pattern) {
        $matched = $true
        break
    }
}

if (-not $matched) {
    exit 0  # Keine Keywords = nichts ausgeben
}

# Screenshot aus Clipboard holen
$screenshotScript = "C:\Users\Berend Mainz\clipboard-screenshot.ps1"
if (Test-Path $screenshotScript) {
    $result = & $screenshotScript 2>$null
    if ($result -and (Test-Path $result)) {
        # Context für Claude ausgeben (plain text = wird injiziert)
        Write-Output "# screenshotHook"
        Write-Output "Screenshot aus Clipboard gespeichert: $result"
        Write-Output "Bitte lies das Bild mit dem Read-Tool: $result"
    }
}

exit 0
