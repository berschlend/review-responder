# Increase Pagefile (Virtual Memory) - REQUIRES ADMIN
# Usage: Run PowerShell as Administrator, then:
# powershell -ExecutionPolicy Bypass -File scripts/increase-pagefile.ps1

Write-Host "=== INCREASE VIRTUAL MEMORY ===" -ForegroundColor Cyan
Write-Host "This requires Administrator privileges!" -ForegroundColor Yellow
Write-Host ""

# Check if admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell > Run as Administrator" -ForegroundColor Yellow
    exit 1
}

# Get current settings
$cs = Get-CimInstance Win32_ComputerSystem
$currentSetting = $cs.AutomaticManagedPagefile

Write-Host "Current Setting: AutomaticManagedPagefile = $currentSetting"

# For 8GB RAM, recommend 16-32GB pagefile for heavy workloads
$initialSizeMB = 16384  # 16 GB
$maxSizeMB = 32768      # 32 GB

Write-Host "`nRecommended for 8GB RAM + heavy Claude sessions:"
Write-Host "  Initial Size: $($initialSizeMB/1024) GB"
Write-Host "  Maximum Size: $($maxSizeMB/1024) GB"
Write-Host ""

$confirm = Read-Host "Apply these settings? [y/N]"
if ($confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

try {
    # Disable automatic management
    $cs | Set-CimInstance -Property @{AutomaticManagedPagefile=$false}

    # Set custom pagefile size
    $pagefile = Get-CimInstance -ClassName Win32_PageFileSetting -ErrorAction SilentlyContinue

    if ($pagefile) {
        # Update existing
        $pagefile | Set-CimInstance -Property @{
            InitialSize = $initialSizeMB
            MaximumSize = $maxSizeMB
        }
    } else {
        # Create new
        New-CimInstance -ClassName Win32_PageFileSetting -Property @{
            Name = "C:\pagefile.sys"
            InitialSize = $initialSizeMB
            MaximumSize = $maxSizeMB
        }
    }

    Write-Host "`nPagefile configured successfully!" -ForegroundColor Green
    Write-Host "RESTART REQUIRED to apply changes." -ForegroundColor Yellow

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nManual steps:" -ForegroundColor Yellow
    Write-Host "1. Press Win+R, type: sysdm.cpl"
    Write-Host "2. Advanced tab > Performance Settings"
    Write-Host "3. Advanced tab > Virtual Memory > Change"
    Write-Host "4. Uncheck 'Automatically manage'"
    Write-Host "5. Select C: drive > Custom size"
    Write-Host "6. Initial: 16384 MB, Maximum: 32768 MB"
    Write-Host "7. Click Set, OK, and restart"
}
