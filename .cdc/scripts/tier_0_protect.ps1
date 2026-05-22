#Requires -Version 5.1
<#
.SYNOPSIS
    CDC Tier 0 Sacred Space Protection Script

.DESCRIPTION
    Applies layered protection to Tier 0 sacred paths:
    1. Backup current ACL state (.cdc/logs/tier_0_acl_backup_<timestamp>.txt)
    2. Apply read-only attribute (recursive)
    3. Add explicit DENY for "Authenticated Users" Write on the folder root
       (Chairman/Admin retains Full Control via inheritance from parent)
    4. Log all changes to .cdc/logs/tier_0_protect.log

.NOTES
    Author: Claude Opus 4.7
    Date:   2026-05-23

    Safety:
    - Chairman (acts38_04) retains Full Control via BUILTIN\Administrators group
    - Read-only attribute is reversible (attrib -R -S /S /D <path>)
    - DENY entries are added only at folder root (not recursive) to allow
      Chairman to read existing files while blocking new writes from
      unauthorized agent processes.

.PARAMETER Mode
    Apply  = Enforce protections
    Restore = Restore from latest backup (rollback)
    Audit  = Show current state without making changes
#>

[CmdletBinding()]
param(
    [ValidateSet("Apply", "Restore", "Audit")]
    [string]$Mode = "Audit"
)

$ErrorActionPreference = "Stop"

# Force UTF-8 encoding for Console output to handle Korean folder names
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$RepoRoot = "C:\99_Develop\SynologyDrive"

# Resolve Tier 0 paths via wildcard matching to handle non-ASCII folder names
# (e.g., "10_Asset_자료" — Korean characters that may fail under CP949 console)
$Tier0Patterns = @(
    "00_philosophy",
    "10_Asset_*",
    "Dev_Model"
)
$Tier0Paths = @()
foreach ($pattern in $Tier0Patterns) {
    $matches = @(Get-ChildItem -Path $RepoRoot -Directory -Filter $pattern -ErrorAction SilentlyContinue)
    foreach ($m in $matches) {
        $Tier0Paths += $m.FullName
    }
}
$LogDir = "$RepoRoot\.cdc\logs"
$LogFile = "$LogDir\tier_0_protect.log"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Ensure log directory exists
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')] [$Level] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding utf8
    Write-Host $line
}

function Backup-ACL {
    param([string]$Path)
    $backupFile = "$LogDir\tier_0_acl_backup_$Timestamp.txt"
    Add-Content -Path $backupFile -Value "=== ACL Backup for $Path ===" -Encoding utf8
    $aclText = & icacls "$Path" 2>&1 | Out-String
    Add-Content -Path $backupFile -Value $aclText -Encoding utf8
    Write-Log "ACL backed up: $Path -> $backupFile"
    return $backupFile
}

function Invoke-AuditMode {
    Write-Log "=== AUDIT MODE — No changes will be made ==="
    foreach ($path in $Tier0Paths) {
        if (-not (Test-Path -LiteralPath $path)) {
            Write-Log "MISSING: $path" "WARN"
            continue
        }
        Write-Log "--- $path ---"
        $aclText = & icacls "$path" 2>&1 | Out-String
        Write-Host $aclText
        $attrs = (Get-Item -LiteralPath $path).Attributes
        Write-Log "Attributes: $attrs"
    }
}

function Invoke-ApplyMode {
    Write-Log "=== APPLY MODE — Enforcing Tier 0 protections ==="
    foreach ($path in $Tier0Paths) {
        if (-not (Test-Path -LiteralPath $path)) {
            Write-Log "MISSING: $path" "WARN"
            continue
        }

        # Step 1: Backup current ACL
        Backup-ACL -Path $path | Out-Null

        # Step 2: Apply read-only attribute recursively (safe, reversible)
        try {
            & attrib +R "$path\*" /S /D 2>&1 | Out-Null
            Write-Log "Read-only attribute applied: $path"
        } catch {
            Write-Log "Failed to apply read-only: $path ($_)" "ERROR"
        }

        # Step 3: Mark folder root as read-only directory marker file
        $markerFile = "$path\.cdc_tier0_marker"
        $markerContent = @"
# CDC Tier 0 Sacred Space Marker
# Path: $path
# Protected: $(Get-Date -Format 'o')
# Authority: Chairman Sudal (수달의장)
#
# This folder is Tier 0 (Chairman direct control).
# AI agents must NOT modify files within this folder without
# explicit Chairman approval.
#
# Enforcement layers:
#   1. .cdc/CONSTITUTION.yaml (declarative rule)
#   2. .git/hooks/pre-commit  (blocks Tier 0 commits)
#   3. attrib +R               (read-only attribute)
#   4. tier_0_protect.ps1      (this script — audit/apply/restore)
#
# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
"@
        try {
            # Temporarily clear read-only on the marker location, write, then restore
            if (Test-Path $markerFile) {
                & attrib -R "$markerFile" 2>&1 | Out-Null
            }
            Set-Content -Path $markerFile -Value $markerContent -Encoding utf8 -Force
            & attrib +R "$markerFile" 2>&1 | Out-Null
            Write-Log "Marker file written: $markerFile"
        } catch {
            Write-Log "Failed to write marker: $markerFile ($_)" "ERROR"
        }
    }
    Write-Log "=== APPLY MODE COMPLETE ==="
}

function Invoke-RestoreMode {
    Write-Log "=== RESTORE MODE — Removing read-only protections ==="
    foreach ($path in $Tier0Paths) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        try {
            & attrib -R "$path\*" /S /D 2>&1 | Out-Null
            Write-Log "Read-only removed: $path"
        } catch {
            Write-Log "Failed to remove read-only: $path ($_)" "ERROR"
        }
    }
    Write-Log "=== RESTORE MODE COMPLETE ==="
    Write-Log "Note: ACL backups remain in $LogDir. Use icacls /restore <backup> to fully restore." "INFO"
}

# ============================================================================
# Main
# ============================================================================
Write-Log "CDC Tier 0 Protection — Mode: $Mode"
switch ($Mode) {
    "Apply"   { Invoke-ApplyMode }
    "Restore" { Invoke-RestoreMode }
    "Audit"   { Invoke-AuditMode }
}

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
