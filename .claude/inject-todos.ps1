# inject-todos.ps1
# Recursively finds TODO.md files from current directory up to git root
# and outputs their contents for Claude context injection

param(
    [string]$StartDir = (Get-Location).Path
)

# Find git root
function Get-GitRoot {
    param([string]$Dir)
    $current = $Dir
    while ($current -ne "") {
        if (Test-Path (Join-Path $current ".git")) {
            return $current
        }
        $parent = Split-Path $current -Parent
        if ($parent -eq $current) { break }
        $current = $parent
    }
    return $null
}

$gitRoot = Get-GitRoot -Dir $StartDir
if (-not $gitRoot) {
    exit 0
}

# Collect TODO.md files from current dir up to git root
$todoFiles = @()
$current = $StartDir

while ($current -and $current.Length -ge $gitRoot.Length) {
    $todoPath = Join-Path $current "TODO.md"
    if (Test-Path $todoPath) {
        $todoFiles += $todoPath
    }
    if ($current -eq $gitRoot) { break }
    $current = Split-Path $current -Parent
}

# Output in reverse order (root first, then subdirs)
[array]::Reverse($todoFiles)

foreach ($file in $todoFiles) {
    $relativePath = $file.Substring($gitRoot.Length + 1)
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if ($content) {
        Write-Output ""
        Write-Output "# todoMd"
        Write-Output "Contents of $relativePath :"
        Write-Output ""
        Write-Output $content
    }
}
