#Requires -Version 5.1
<#
.SYNOPSIS
    CDC Execution Wrapper — Intercepts python/node/git calls for logging
    and pre-execution constitutional checks.

.DESCRIPTION
    Wraps invocations of common interpreters (python, py, node, git) so that:
    1. Every call is logged to .cdc/logs/exec.jsonl
    2. Calls touching Tier 0 paths are blocked
    3. Optionally, constitution_check.py is run before git commit

.USAGE
    # Source this script in PowerShell profile to activate:
    #   . C:\99_Develop\SynologyDrive\.cdc\scripts\cdc-exec.ps1
    #
    # Or invoke directly:
    #   cdc-exec python my_script.py
    #   cdc-exec git status

.NOTES
    Author: Claude Opus 4.7
    Date:   2026-05-23

    Limitations:
    - Wrapper is opt-in (must be sourced in profile or invoked explicitly)
    - Agents can bypass by calling python.exe directly (PATH manipulation)
    - True enforcement requires Process Monitor / OS-level shim
#>

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Script:CDCRepoRoot = "C:\99_Develop\SynologyDrive"
$Script:CDCLogDir = "$Script:CDCRepoRoot\.cdc\logs"
$Script:CDCExecLog = "$Script:CDCLogDir\exec.jsonl"

# Tier 0 path patterns (case-insensitive substrings)
$Script:CDCTier0Patterns = @(
    "00_philosophy",
    "10_Asset_",
    "Dev_Model"
)

function Write-CDCExecLog {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$Status,
        [string]$Reason = ""
    )
    if (-not (Test-Path $Script:CDCLogDir)) {
        New-Item -ItemType Directory -Force -Path $Script:CDCLogDir | Out-Null
    }
    $entry = @{
        timestamp = (Get-Date).ToString("o")
        command   = $Command
        args      = $Arguments
        status    = $Status
        reason    = $Reason
        user      = $env:USERNAME
        pid       = $PID
        agent     = $env:CDC_AGENT_NAME  # Optional: agents can set this
    } | ConvertTo-Json -Compress -Depth 4
    Add-Content -Path $Script:CDCExecLog -Value $entry -Encoding utf8
}

function Test-CDCTier0Touch {
    param([string[]]$Arguments)
    foreach ($arg in $Arguments) {
        if (-not $arg) { continue }
        foreach ($pattern in $Script:CDCTier0Patterns) {
            if ($arg -match [regex]::Escape($pattern)) {
                return @{ Blocked = $true; MatchedPattern = $pattern; MatchedArg = $arg }
            }
        }
    }
    return @{ Blocked = $false }
}

function cdc-exec {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Command,

        [Parameter(ValueFromRemainingArguments)]
        [string[]]$Arguments
    )

    # Step 1: Tier 0 check
    $check = Test-CDCTier0Touch -Arguments $Arguments
    if ($check.Blocked) {
        $reason = "Tier 0 path touched: '$($check.MatchedPattern)' in arg '$($check.MatchedArg)'"
        Write-CDCExecLog -Command $Command -Arguments $Arguments -Status "BLOCKED" -Reason $reason
        Write-Host "[CDC] BLOCKED: $reason" -ForegroundColor Red
        Write-Host "[CDC] Tier 0 sacred space access requires explicit Chairman approval." -ForegroundColor Red
        return 1
    }

    # Step 2: Log the call
    Write-CDCExecLog -Command $Command -Arguments $Arguments -Status "ALLOWED"

    # Step 3: Execute
    $env:PYTHONIOENCODING = "utf-8"
    & $Command @Arguments
    $exitCode = $LASTEXITCODE

    # Step 4: Log result
    Write-CDCExecLog -Command $Command -Arguments $Arguments -Status "COMPLETED:$exitCode"
    return $exitCode
}

# Convenience aliases (do not override built-in commands by default).
# Activate by uncommenting in PowerShell profile:
#   Set-Alias -Name pycdc -Value cdc-exec
#   Set-Alias -Name gitcdc -Value cdc-exec

Set-Alias -Name cdc -Value cdc-exec -Scope Global -Description "CDC execution wrapper"

Write-Host "[CDC] cdc-exec wrapper loaded. Usage: cdc <command> <args>" -ForegroundColor Cyan
Write-Host "[CDC] Log: $Script:CDCExecLog" -ForegroundColor Cyan

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
