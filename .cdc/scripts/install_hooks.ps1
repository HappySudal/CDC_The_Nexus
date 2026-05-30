# ============================================================================
# CDC Hook Installer (PowerShell) — .cdc/hooks/ → .git/hooks/ 복사
# ============================================================================
# 사용: pwsh .cdc/scripts/install_hooks.ps1
# Windows 환경 동기화 시 bash 미가용 케이스용 보조 스크립트.
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel 2>&1).Trim()
if (-not $repoRoot) {
    Write-Error "git 저장소 루트를 찾을 수 없습니다."
    exit 2
}

$srcDir = Join-Path $repoRoot '.cdc/hooks'
$dstDir = Join-Path $repoRoot '.git/hooks'

if (-not (Test-Path $srcDir)) {
    Write-Error "Hook 원본 디렉토리($srcDir)가 없습니다."
    exit 2
}

Write-Host "[CDC] Hook 설치 시작"
Write-Host "       Source: $srcDir"
Write-Host "       Target: $dstDir"
Write-Host ""

$installed = 0
Get-ChildItem -Path $srcDir -File | ForEach-Object {
    $name = $_.Name
    $dst = Join-Path $dstDir $name

    if (Test-Path $dst) {
        $backup = "$dst.bak.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Host "  WARN 기존 $name 존재 -> 백업: $backup"
        Copy-Item $dst $backup
    }

    Copy-Item $_.FullName $dst -Force
    Write-Host "  OK Installed: $name"
    $installed++
}

Write-Host ""
Write-Host "[CDC] $installed 개 hook 설치 완료"
exit 0

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
