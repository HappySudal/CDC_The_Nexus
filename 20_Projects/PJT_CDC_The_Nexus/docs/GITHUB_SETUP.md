# GitHub Actions 설정 가이드

## 📋 개요

The Nexus 프로젝트는 GitHub Actions를 통해 자동 빌드, 테스트, 코드사이닝, 배포를 수행합니다.

---

## 🔐 GitHub Secrets 설정

### 1️⃣ Windows 코드사이닝 인증서

**필수 준비:**
- Windows Code Signing Certificate (.pfx 파일)
- 인증서 암호

**설정 방법:**

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. 다음 2개 시크릿 추가:

```
Name: WINDOWS_CERTIFICATE
Value: [.pfx 파일을 base64로 인코딩한 값]

Name: WINDOWS_CERTIFICATE_PASSWORD
Value: [인증서 암호]
```

**Base64 인코딩:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\cert.pfx")) | Set-Clipboard
```

---

### 2️⃣ macOS 코드사이닝 (Apple Developer)

**필수 준비:**
- Apple Developer ID (Apple 개발자 계정)
- App-specific password (Apple ID 앱 암호)
- Team ID

**설정 방법:**

1. GitHub Secrets 추가:

```
Name: APPLE_ID
Value: [your.apple@id.com]

Name: APPLE_ID_PASSWORD
Value: [app-specific-password]

Name: APPLE_TEAM_ID
Value: [XXXXXXXXXX]
```

**App-specific Password 생성:**
- appleid.apple.com 접속
- Security → App-specific passwords → 생성
- "GitHub Actions"라고 이름 지정

---

## 🚀 빌드 트리거

### 자동 트리거
- `main`, `master`, `develop` 브랜치에 push 시 자동 빌드
- Pull Request 시 자동 테스트

### 수동 릴리스
```bash
# 태그 생성 (자동 릴리스 생성)
git tag -a v0.4.0 -m "Release v0.4.0"
git push origin v0.4.0
```

---

## 📊 워크플로우 단계

| 단계 | 설명 | 플랫폼 | 소요시간 |
|:---|:---|:---|:---:|
| 1. Checkout | 코드 다운로드 | All | 30s |
| 2. Node.js Setup | 환경 설정 | All | 1m |
| 3. Dependencies | npm install | All | 2m |
| 4. Linter | ESLint 실행 | All | 1m |
| 5. Vite Build | Vue 번들 생성 | All | 2m |
| 6. Unit Tests | Vitest 실행 | All | 3m |
| 7. E2E Tests | Playwright 테스트 | All | 5m |
| 8. Electron Build | 플랫폼별 패킹 | Win/Mac/Linux | 5m |
| 9. Code Signing | 바이너리 사이닝 | Win/Mac | 3m |
| 10. Release | GitHub Releases 생성 | (태그만) | 2m |

**총 소요시간**: ~25분 (테스트 포함)

---

## ✅ 검증

### 빌드 성공 확인
- GitHub 저장소 → Actions 탭에서 워크플로우 상태 확인
- 각 단계별 로그 조회 가능

### 번들 크기 검증
- Workflow에서 자동 검증 (250KB 초과 시 경고)
- 실패해도 빌드는 진행됨 (continue-on-error)

### 아티팩트 다운로드
- Actions → 해당 워크플로우 → Artifacts
- `build-artifacts-[os]` 다운로드 가능 (7일 보관)

---

## 🔧 문제 해결

### 빌드 실패 (Missing Linter)
**해결:** `.eslintrc.cjs` 확인
```bash
npm install --save-dev eslint eslint-plugin-vue
```

### 테스트 실패
**해결:** `vitest.config.js` 확인, 로컬 테스트 우선 실행
```bash
npm run test:ci
```

### 코드사이닝 실패 (Windows)
**원인:** 인증서 만료 또는 암호 오류
**해결:** 새 인증서로 시크릿 업데이트

### macOS 사이닝 실패
**원인:** Apple ID 암호 오류 또는 Team ID 불일치
**해결:** 
```bash
# 로컬에서 먼저 테스트
npm run dist:mac
```

---

## 📈 모니터링

### CI 대시보드
- GitHub Actions → The Nexus 저장소
- 각 워크플로우 실행 내역 조회 가능

### 자동 알림
- 빌드 실패 시 GitHub 이메일 자동 발송
- PR 체크 실패 시 자동 표시

---

## 🎯 다음 단계

1. ✅ GitHub Secrets 설정 완료
2. ✅ 첫 푸시로 워크플로우 테스트
3. ✅ 태그 생성으로 릴리스 자동화
4. ✅ GitHub Releases에서 배포판 다운로드

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
