# Register The Nexus Services with Windows Task Scheduler
# 실행 권한: Administrator
# 목적: The Nexus를 Windows 서비스로 자동 시작

# 실행 권한 확인
$admin = [Security.Principal.WindowsIdentity]::GetCurrent().Groups -contains 'S-1-5-32-544'
if (-not $admin) {
    Write-Host "❌ 관리자 권한이 필요합니다!"
    Write-Host "PowerShell을 관리자 모드로 실행한 후 다시 시도하세요."
    exit 1
}

Write-Host "🔧 The Nexus 서비스 등록 시작..."

$project_path = "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus"
$launcher_script = Join-Path $project_path "01_Proposal_Presentation\TheNexus-Service-Launcher.ps1"
$task_folder = "\The Nexus"

# Task Scheduler 폴더 생성
try {
    $schedule = New-Object -ComObject Schedule.Service
    $schedule.Connect()

    $root_folder = $schedule.GetFolder("\")
    try {
        $root_folder.CreateFolder($task_folder)
        Write-Host "✅ Task Scheduler 폴더 생성: $task_folder"
    } catch {
        Write-Host "⚠️ 폴더 이미 존재: $task_folder"
    }
} catch {
    Write-Host "❌ Task Scheduler 접근 실패: $_"
    exit 1
}

# 서비스 정의
$services = @(
    @{
        Name = "TheNexus-DevServer"
        Description = "The Nexus Vite Development Server"
        Command = "powershell.exe"
        Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher_script`" -Service dev"
        Trigger = "SYSTEM"
    },
    @{
        Name = "TheNexus-AutoCommit"
        Description = "The Nexus Automated Commit System"
        Command = "powershell.exe"
        Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher_script`" -Service auto-commit"
        Trigger = "SYSTEM"
    },
    @{
        Name = "TheNexus-Orchestration"
        Description = "The Nexus Orchestration Engine"
        Command = "powershell.exe"
        Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher_script`" -Service orchestration"
        Trigger = "SYSTEM"
    }
)

# 각 서비스 등록
foreach ($service in $services) {
    try {
        Write-Host ""
        Write-Host "📋 서비스 등록: $($service.Name)"

        # TaskScheduler XML 정의
        $xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')</Date>
    <Author>The Nexus Admin</Author>
    <Description>$($service.Description)</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT30S</Delay>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$($service.Trigger)</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <Duration>PT10M</Duration>
      <WaitTimeout>PT1H</WaitTimeout>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <Priority>7</Priority>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <RestartOnFailure>
      <Enabled>true</Enabled>
      <Interval>PT5M</Interval>
      <Count>3</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$($service.Command)</Command>
      <Arguments>$($service.Arguments)</Arguments>
      <WorkingDirectory>$project_path</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

        # XML 파일 저장
        $xml_path = Join-Path $project_path "01_Proposal_Presentation\$($service.Name).xml"
        Set-Content -Path $xml_path -Value $xml -Encoding UTF16

        # Task 등록
        $task_path = "$task_folder\$($service.Name)"
        $schedule.Connect()
        $folder = $schedule.GetFolder($task_folder)

        # 기존 작업 제거 (있으면)
        try {
            $folder.DeleteTask($service.Name, 0)
            Write-Host "  ℹ️ 기존 작업 삭제"
        } catch {}

        # 새 작업 등록
        $folder.RegisterTaskDefinition($service.Name, $xml, 6, $null, $null, 0) | Out-Null
        Write-Host "  ✅ 서비스 등록 완료: $task_path"

    } catch {
        Write-Host "  ❌ 등록 실패: $_"
    }
}

Write-Host ""
Write-Host "✅ 모든 서비스 등록 완료!"
Write-Host ""
Write-Host "📊 등록된 서비스:"
Write-Host "  1️⃣ TheNexus-DevServer (부팅 시 자동 시작)"
Write-Host "  2️⃣ TheNexus-AutoCommit (부팅 시 자동 시작)"
Write-Host "  3️⃣ TheNexus-Orchestration (부팅 시 자동 시작)"
Write-Host ""
Write-Host "🎯 관리 방법:"
Write-Host "  • 시작: taskschd.msc → The Nexus → 오른쪽 클릭 → 실행"
Write-Host "  • 중지: 서비스 중지 버튼 클릭"
Write-Host "  • 로그: $project_path\logs\services\"
Write-Host ""
Write-Host "⚠️ 참고:"
Write-Host "  • 처음 부팅 시 30초 대기 후 서비스 시작"
Write-Host "  • 실패 시 5분 간격으로 최대 3회 재시작"
Write-Host "  • 로그는 각 시작 시마다 새로 생성됨"
