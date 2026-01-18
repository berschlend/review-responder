<#
.SYNOPSIS
    Startet alle Night-Burst Agents mit autonomem Task-Switching Prompt
#>

$WorkDir = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"

# Autonomer Meta-Prompt für ALLE Agents
$AutoPrompt = @"
AUTONOMER MODUS AKTIVIERT!

DU BIST EIN AUTONOMER AGENT. Lies deinen Skill mit /night-burst-[X] und dann:

REGELN:
1. TASK WECHSELN wenn nichts zu tun:
   - Keine Leads? -> Help Burst-2 mit Emails
   - Keine Emails? -> Help Burst-4 mit Demos
   - Keine Demos? -> Help Burst-5 mit Follow-ups
   - NIEMALS idle sein!

2. BUGS FIXEN wenn du welche findest:
   - API Fehler? -> Fixen oder dokumentieren
   - Metriken falsch? -> Korrigieren
   - Flow kaputt? -> Reparieren

3. KONTINUIERLICH LERNEN:
   - learnings.md LESEN bei jedem Loop
   - Neue Learnings SCHREIBEN wenn du was entdeckst
   - powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent [X] -Data "[Learning]"

4. KOMMUNIZIEREN mit anderen Agents:
   - Handoffs erstellen: powershell -File scripts/agent-helpers.ps1 -Action handoff-create
   - Handoffs checken: powershell -File scripts/agent-helpers.ps1 -Action handoff-check -Agent [X]
   - Status updaten: Heartbeat bei JEDEM Loop!

5. ANDERE AGENTS SPAWNEN wenn noetig:
   - powershell -File spawn-agent.ps1 -AgentName "BURST-X" -Task "Aufgabe"
   - Nur spawnen wenn Agent NICHT laeuft (check Registry)
   - Max 15 Agents gleichzeitig!

6. GOAL: 1000 USD MRR
   - JEDE Aktion muss diesem Ziel dienen
   - Kein Warten, kein Idle, IMMER produktiv

STARTE JETZT mit /night-burst-[DEINE-NUMMER]
"@

# Priority-1 Agents (KRITISCH)
$Priority1 = @(
    @{Name="BURST2"; Skill="2"; Desc="Cold Emailer"},
    @{Name="BURST4"; Skill="4"; Desc="Demo Generator"},
    @{Name="BURST5"; Skill="5"; Desc="Hot Lead Chaser"}
)

# Priority-2 Agents (WICHTIG)
$Priority2 = @(
    @{Name="BURST1"; Skill="1"; Desc="Lead Finder"},
    @{Name="BURST9"; Skill="9"; Desc="Doctor/Monitor"},
    @{Name="BURST11"; Skill="11"; Desc="Bottleneck Analyzer"},
    @{Name="BURST14"; Skill="14"; Desc="Lead Scorer"}
)

# Priority-3 Agents (PAUSED - nur starten wenn explizit gebraucht)
$Priority3 = @(
    @{Name="BURST3"; Skill="3"; Desc="Social DM - PAUSED"},
    @{Name="BURST6"; Skill="6"; Desc="User Activator - PAUSED"},
    @{Name="BURST7"; Skill="7"; Desc="Payment Converter - PAUSED"},
    @{Name="BURST8"; Skill="8"; Desc="Upgrader - PAUSED"},
    @{Name="BURST10"; Skill="10"; Desc="Morning Briefer"},
    @{Name="BURST12"; Skill="12"; Desc="Creative Strategist"},
    @{Name="BURST13"; Skill="13"; Desc="Churn Prevention - PAUSED"},
    @{Name="BURST15"; Skill="15"; Desc="Approval Gate"}
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " STARTING ALL AUTONOMOUS AGENTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Start Priority-1 zuerst
Write-Host "=== PRIORITY-1 (KRITISCH) ===" -ForegroundColor Red
foreach ($agent in $Priority1) {
    $task = "/night-burst-$($agent.Skill)"
    Write-Host "Starting $($agent.Name) - $($agent.Desc)..." -ForegroundColor Yellow
    & "$env:USERPROFILE\spawn-agent.ps1" -AgentName $agent.Name -Task $task
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "=== PRIORITY-2 (WICHTIG) ===" -ForegroundColor Yellow
foreach ($agent in $Priority2) {
    $task = "/night-burst-$($agent.Skill)"
    Write-Host "Starting $($agent.Name) - $($agent.Desc)..." -ForegroundColor Yellow
    & "$env:USERPROFILE\spawn-agent.ps1" -AgentName $agent.Name -Task $task
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " ALL AGENTS STARTED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Priority-1: $($Priority1.Count) agents (BURST2, BURST4, BURST5)"
Write-Host "Priority-2: $($Priority2.Count) agents (BURST1, BURST9, BURST11, BURST14)"
Write-Host ""
Write-Host "Priority-3 agents are PAUSED - start manually if needed"
Write-Host ""
