# TheNexus Service Launcher
# Windows Task Scheduler에서 실행될 PowerShell 스크립트
# 목적: The Nexus 애플리케이션을 Windows 서비스로 실행

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "auto-commit", "orchestration")]
    [string]$Service
)

# 프로젝트 경로
$project_path = "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus"
$node_exe = "C:\Program Files\nodejs\node.exe"
$npm_cmd = "C:\Program Files\nodejs\npm.cmd"

# 로그 경로
$log_dir = Join-Path $project_path "logs\services"
if (-not (Test-Path $log_dir)) {
    New-Item -ItemType Directory -Path $log_dir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$log_file = Join-Path $log_dir "$Service`_$timestamp.log"

Write-Output "[$(Get-Date)] Starting The Nexus $Service service..." | Tee-Object -FilePath $log_file -Append

try {
    Set-Location $project_path

    switch ($Service) {
        "dev" {
            Write-Output "[$(Get-Date)] Running: npm run dev" | Tee-Object -FilePath $log_file -Append
            & $npm_cmd run dev | Tee-Object -FilePath $log_file -Append
        }
        "auto-commit" {
            Write-Output "[$(Get-Date)] Running: npm run auto-commit" | Tee-Object -FilePath $log_file -Append
            & $npm_cmd run auto-commit | Tee-Object -FilePath $log_file -Append
        }
        "orchestration" {
            Write-Output "[$(Get-Date)] Running: npm run orchestration:start" | Tee-Object -FilePath $log_file -Append
            & $npm_cmd run orchestration:start | Tee-Object -FilePath $log_file -Append
        }
    }
} catch {
    Write-Output "[$(Get-Date)] ERROR: $_" | Tee-Object -FilePath $log_file -Append
}

Write-Output "[$(Get-Date)] Service stopped" | Tee-Object -FilePath $log_file -Append
