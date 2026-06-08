# The Nexus Windows 서비스 설정 가이드

## 📋 개요

The Nexus 애플리케이션을 Windows 백그라운드 서비스로 자동 시작하도록 설정합니다.

**포함되는 서비스:**
- 🌐 TheNexus-DevServer (Vite 개발 서버, 포트 5173)
- 🤖 TheNexus-AutoCommit (자동 커밋 시스템, 15분 주기)
- ⚙️ TheNexus-Orchestration (오케스트레이션 엔진)

---

## 🚀 빠른 시작 (관리자 모드)

### 1️⃣ PowerShell 관리자 모드로 열기

```powershell
# Windows 시작 메뉴에서 "PowerShell" 검색
# 오른쪽 클릭 → "관리자 권한으로 실행"
```

### 2️⃣ 서비스 등록 스크립트 실행

```powershell
cd "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\01_Proposal_Presentation"

# 스크립트 실행 정책 일시 변경
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 서비스 등록
.\Register-TheNexus-Services.ps1
```

### 3️⃣ 결과 확인

```
✅ 모든 서비스 등록 완료!

📊 등록된 서비스:
  1️⃣ TheNexus-DevServer (부팅 시 자동 시작)
  2️⃣ TheNexus-AutoCommit (부팅 시 자동 시작)
  3️⃣ TheNexus-Orchestration (부팅 시 자동 시작)
```

---

## 🎯 서비스 관리

### Windows Task Scheduler에서 관리

```
1. 시작 메뉴 → "작업 스케줄러" 검색
2. 왼쪽 패널 → "작업 스케줄러 라이브러리"
3. 폴더: "The Nexus"
4. 서비스 선택 후:
   - 실행: 오른쪽 클릭 → "실행"
   - 중지: 오른쪽 클릭 → "끝내기"
   - 속성: 오른쪽 클릭 → "속성" → 설정 변경
```

### PowerShell에서 관리

```powershell
# 서비스 시작
Start-ScheduledTask -TaskPath "\The Nexus" -TaskName "TheNexus-DevServer"
Start-ScheduledTask -TaskPath "\The Nexus" -TaskName "TheNexus-AutoCommit"
Start-ScheduledTask -TaskPath "\The Nexus" -TaskName "TheNexus-Orchestration"

# 서비스 중지
Stop-ScheduledTask -TaskPath "\The Nexus" -TaskName "TheNexus-DevServer"

# 서비스 상태 확인
Get-ScheduledTask -TaskPath "\The Nexus" | Select-Object TaskName, State
```

---

## 📊 로그 확인

### 로그 파일 위치

```
C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\logs\services\
```

각 서비스는 다음 패턴으로 로그를 생성합니다:
- `dev_2026-06-09_14-30-45.log`
- `auto-commit_2026-06-09_14-30-45.log`
- `orchestration_2026-06-09_14-30-45.log`

### 로그 확인 (PowerShell)

```powershell
# 최신 로그 확인
Get-ChildItem "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\logs\services" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  Get-Content -Tail 50
```

---

## ⚙️ 수동 설정 (고급)

### 스크립트 파일 위치

```
C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\01_Proposal_Presentation\
├── Register-TheNexus-Services.ps1    (등록 스크립트)
├── TheNexus-Service-Launcher.ps1     (런처 스크립트)
└── NSSM_SERVICE_SETUP_GUIDE.md       (이 파일)
```

### 수동으로 작업 추가

```powershell
# Task Scheduler COM 객체 생성
$schedule = New-Object -ComObject Schedule.Service
$schedule.Connect()

# 폴더 생성
$root_folder = $schedule.GetFolder("\")
$root_folder.CreateFolder("The Nexus")

# 작업 등록 (자세한 내용은 Register-TheNexus-Services.ps1 참고)
```

---

## 🔧 문제 해결

### 문제 1: "액세스가 거부되었습니다" 오류

**원인**: 관리자 권한 부족  
**해결책**:
1. PowerShell을 관리자 모드로 실행
2. 스크립트 실행 정책 변경:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
   ```

### 문제 2: 서비스가 시작되지 않음

**원인**: 권한 또는 경로 오류  
**해결책**:
1. 로그 파일 확인: `logs/services/` 폴더
2. 작업 스케줄러에서 "마지막 실행 결과" 확인
3. PowerShell 실행 정책 다시 확인

### 문제 3: "파일을 찾을 수 없습니다" 오류

**원인**: 프로젝트 경로 또는 스크립트 경로 오류  
**해결책**:
1. 경로 확인: `C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\` 존재 여부
2. npm 설치 확인: `npm list` 실행
3. 절대 경로 사용 (상대 경로 사용 금지)

---

## 📌 부팅 시 자동 시작

모든 서비스는 다음 설정으로 등록됩니다:

- ✅ **자동 시작**: 부팅 시 30초 대기 후 자동 시작
- ✅ **재시작**: 실패 시 5분 간격으로 최대 3회 재시작
- ✅ **권한**: 최고 권한(System)으로 실행
- ✅ **시간 제한**: 없음 (무제한 실행)

---

## 🔒 보안 고려사항

1. **권한**: System 권한으로 실행 (관리자 모드)
2. **로그 보관**: 로그 파일은 보안 정보 포함 가능
3. **경로**: 절대 경로만 사용하여 보안 강화
4. **방화벽**: The Nexus가 필요한 포트 개방 (기본: 5173, 3333, 8888)

---

## 📞 추가 정보

- **작업 스케줄러**: `taskschd.msc` 또는 `Task Scheduler`
- **Event Viewer**: `eventvwr.msc` (System 로그)
- **Services**: `services.msc` (기타 서비스 확인)

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**

Last Updated: 2026-06-09
