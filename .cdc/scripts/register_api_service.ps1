#Requires -Version 5.1
<#
.SYNOPSIS
    Register / Unregister CDC Validation API as a Windows Scheduled Task.

.DESCRIPTION
    Creates a Scheduled Task that auto-starts validation_api.py at system
    boot, running as the current user (no admin elevation required for
    user-scoped task).

.PARAMETER Mode
    Register   = Create and enable the task
    Unregister = Remove the task
    Status     = Show task state
    Start      = Start the task now
    Stop       = Stop the task now

.NOTES
    Author: Claude Opus 4.7
    Date:   2026-05-23

    Task name: "CDC Validation API"
    The task runs under the current user account at logon.
#>

[CmdletBinding()]
param(
    [ValidateSet("Register", "Unregister", "Status", "Start", "Stop")]
    [string]$Mode = "Status"
)

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$TaskName   = "CDC Validation API"
$ScriptPath = "C:\99_Develop\SynologyDrive\.cdc\scripts\validation_api.py"
$PyLauncher = (Get-Command py -ErrorAction SilentlyContinue).Source
if (-not $PyLauncher) { $PyLauncher = (Get-Command python -ErrorAction SilentlyContinue).Source }
if (-not $PyLauncher) { Write-Error "No Python interpreter found"; exit 1 }

$LogDir = "C:\99_Develop\SynologyDrive\.cdc\logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }

function Register-CDCTask {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Task already exists. Unregister first or use update mode." -ForegroundColor Yellow
        return
    }

    # Build action: py.exe validation_api.py --port 8888  (output redirected)
    $argsString = "`"$ScriptPath`" --port 8888"
    $action = New-ScheduledTaskAction -Execute $PyLauncher -Argument $argsString -WorkingDirectory "C:\99_Develop\SynologyDrive\.cdc\scripts"

    # Trigger: At logon of current user
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

    # Principal: Run as current user, with limited privileges (no elevation)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    # Settings: Allow start on battery, no time limit
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Days 365) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 5) `
        -StartWhenAvailable

    Register-ScheduledTask -TaskName $TaskName `
        -Action $action -Trigger $trigger -Principal $principal -Settings $settings `
        -Description "CDC Validation API — Universal Constitution enforcement service. Auto-starts at user logon." | Out-Null

    Write-Host "[OK] Scheduled Task '$TaskName' registered." -ForegroundColor Green
    Write-Host "      Python:  $PyLauncher" -ForegroundColor Gray
    Write-Host "      Script:  $ScriptPath" -ForegroundColor Gray
    Write-Host "      Trigger: At logon ($env:USERNAME)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[NEXT] Run with -Mode Start to start now, or it will start at next logon." -ForegroundColor Cyan
}

function Unregister-CDCTask {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "[OK] Scheduled Task '$TaskName' unregistered." -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] Task not registered." -ForegroundColor Gray
    }
}

function Show-CDCTaskStatus {
    $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $t) {
        Write-Host "[STATE] NOT REGISTERED" -ForegroundColor Yellow
        return
    }
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "[STATE] Registered: $($t.State)" -ForegroundColor Green
    Write-Host "        LastRunTime:   $($info.LastRunTime)"
    Write-Host "        LastTaskResult: $($info.LastTaskResult) (0=success)"
    Write-Host "        NextRunTime:   $($info.NextRunTime)"
    Write-Host "        NumberOfMissedRuns: $($info.NumberOfMissedRuns)"
}

function Start-CDCTask {
    if (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] Task not registered. Run -Mode Register first." -ForegroundColor Red
        return
    }
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "[OK] Task started." -ForegroundColor Green
}

function Stop-CDCTask {
    if (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
        Write-Host "[INFO] Task not registered." -ForegroundColor Gray
        return
    }
    Stop-ScheduledTask -TaskName $TaskName
    Write-Host "[OK] Task stopped." -ForegroundColor Yellow
}

# ============================================================================
# Main
# ============================================================================
switch ($Mode) {
    "Register"   { Register-CDCTask }
    "Unregister" { Unregister-CDCTask }
    "Status"     { Show-CDCTaskStatus }
    "Start"      { Start-CDCTask }
    "Stop"       { Stop-CDCTask }
}

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
