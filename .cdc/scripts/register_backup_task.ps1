#Requires -Version 5.1
<#
.SYNOPSIS
    Register / Unregister CDC Backup as a daily Windows Scheduled Task.

.DESCRIPTION
    Runs backup.py snapshot + prune every day at 03:00.
    Captures stdout/stderr to .cdc/logs/backup_task.log.

.PARAMETER Mode
    Register | Unregister | Status | RunNow
#>

[CmdletBinding()]
param(
    [ValidateSet("Register", "Unregister", "Status", "RunNow")]
    [string]$Mode = "Status"
)

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$TaskName    = "CDC Daily Backup"
$BackupScript = "C:\99_Develop\SynologyDrive\.cdc\scripts\backup.py"
$LogDir      = "C:\99_Develop\SynologyDrive\.cdc\logs"
$LogFile     = "$LogDir\backup_task.log"
$PyLauncher  = (Get-Command py -ErrorAction SilentlyContinue).Source
if (-not $PyLauncher) { $PyLauncher = (Get-Command python -ErrorAction SilentlyContinue).Source }
if (-not $PyLauncher) { Write-Error "No Python interpreter found"; exit 1 }

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Register-BackupTask {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Task already exists. Unregister first." -ForegroundColor Yellow
        return
    }

    # Wrap two python calls (snapshot + prune) via PowerShell -Command
    $cmd = "& '$PyLauncher' '$BackupScript' snapshot *>> '$LogFile'; " +
           "& '$PyLauncher' '$BackupScript' prune *>> '$LogFile'"
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"$cmd`""

    $trigger = New-ScheduledTaskTrigger -Daily -At "03:00"

    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
        -StartWhenAvailable

    Register-ScheduledTask -TaskName $TaskName `
        -Action $action -Trigger $trigger -Principal $principal -Settings $settings `
        -Description "CDC daily memory.db snapshot + 30-day retention prune. Output: .cdc/logs/backup_task.log" | Out-Null

    Write-Host "[OK] Scheduled Task '$TaskName' registered (daily 03:00)" -ForegroundColor Green
}

function Unregister-BackupTask {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "[OK] Task '$TaskName' removed." -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] Task not registered." -ForegroundColor Gray
    }
}

function Show-Status {
    $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $t) {
        Write-Host "[STATE] NOT REGISTERED" -ForegroundColor Yellow
        return
    }
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "[STATE] $($t.State)" -ForegroundColor Green
    Write-Host "        LastRunTime:    $($info.LastRunTime)"
    Write-Host "        LastTaskResult: $($info.LastTaskResult)"
    Write-Host "        NextRunTime:    $($info.NextRunTime)"
}

function Invoke-RunNow {
    if (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] Task not registered." -ForegroundColor Red
        return
    }
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "[OK] Task triggered manually." -ForegroundColor Green
}

switch ($Mode) {
    "Register"   { Register-BackupTask }
    "Unregister" { Unregister-BackupTask }
    "Status"     { Show-Status }
    "RunNow"     { Invoke-RunNow }
}

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
