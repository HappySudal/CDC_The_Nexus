# 🔐 The Nexus — Code Signing Guide (D2.4)

> **상태**: 인증서 결재 대기 중. 본 문서는 결재 후 즉시 적용 가능하도록 설정·환경변수·검증 절차를 사전 박제.
> **결재선**: 수달의장님

---

## 1. 왜 코드사이닝인가

| 미서명 시 | 서명 시 |
|:---|:---|
| Windows SmartScreen 경고 ("Windows protected your PC") | 신뢰 게시자 표시, 즉시 실행 |
| macOS Gatekeeper 차단 (Notarization 필요) | 정상 실행 |
| 사용자가 매번 "더 보기 → 실행" 클릭 | 더블 클릭으로 즉시 실행 |
| 기업 정책에 의해 자동 차단 가능 | 화이트리스트 등재 가능 |

---

## 2. 필요한 인증서

### Windows (필수)

| 종류 | 비용/년 | 비고 |
|:---|:---:|:---|
| OV (Organization Validation) | $200~300 | SmartScreen 평판 누적 후 경고 해제 (몇 주~몇 달) |
| **EV (Extended Validation)** | $300~600 | **즉시 SmartScreen 통과**, HSM/USB 토큰 필수 (Recommended) |

발급기관 후보: DigiCert, Sectigo, GlobalSign, SSL.com

### macOS (선택, 향후)

- Apple Developer Program 가입 ($99/년)
- Developer ID Application 인증서 + Notarization

### Linux (불필요)

AppImage는 사이닝 없이 배포 가능. 향후 Snap/Flatpak 도입 시 별도 검토.

---

## 3. 환경변수 주입 위치

### 로컬 개발자 PC

`.env` (gitignore됨) 또는 OS 환경변수에 다음 키 설정:

```
CSC_LINK=C:\Path\To\nexus-codesign.pfx
CSC_KEY_PASSWORD=<인증서 비밀번호>
```

또는 base64 인코딩 문자열:

```
CSC_LINK=<base64 인코딩된 .pfx 바이트>
```

### CI (GitHub Actions)

리포지토리 Settings → Secrets and variables → Actions:

| Secret 이름 | 값 |
|:---|:---|
| `WIN_CSC_LINK` | base64 인코딩된 .pfx |
| `WIN_CSC_KEY_PASSWORD` | 인증서 비밀번호 |

워크플로 `.github/workflows/nexus-release.yml` (향후 신설):

```yaml
- name: Build & Sign (Windows)
  env:
    CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
  run: npm run dist:win
```

---

## 4. 사전 박제된 electron-builder 설정

`package.json` 의 `build.win` 항목 (5/30 시점):

```json
"win": {
  "target": [ ... ],
  "artifactName": "${productName}-${version}-${arch}.${ext}",
  "signingHashAlgorithms": ["sha256"],
  "signDlls": false
}
```

- `signingHashAlgorithms: ["sha256"]` — SHA-256만 사용 (SHA-1은 deprecated)
- `signDlls: false` — 메인 exe만 사인 (DLL 사인은 시간 소모 大, 필요 시 true)

electron-builder는 `CSC_LINK` / `CSC_KEY_PASSWORD` 환경변수가 존재하면 **자동으로** 사이닝 수행. 추가 코드 불필요.

---

## 5. 검증 절차 (인증서 발급 후)

### Step 1: 환경변수 설정

PowerShell:
```
$env:CSC_LINK = "C:\Path\To\nexus.pfx"
$env:CSC_KEY_PASSWORD = "<password>"
```

### Step 2: 사인된 빌드 생성

```
npm run dist:win
```

산출물: `dist-electron/The Nexus-<version>-x64.exe`

### Step 3: 사인 검증

PowerShell:
```
Get-AuthenticodeSignature "dist-electron\The Nexus-1.0.0-x64.exe"
```

기대 출력:
```
SignerCertificate           Status   Path
-----------------           ------   ----
[CN=...]                    Valid    The Nexus-1.0.0-x64.exe
```

또는 `signtool verify /pa /v "path\to\exe"`.

### Step 4: SmartScreen 확인

- EV 인증서: 즉시 신뢰 게시자로 표시
- OV 인증서: 다운로드 후 "더 자세히" → "실행" 1회 → 평판 누적 시작

---

## 6. 결재 요청 (의장님)

| 안건 | 옵션 |
|:---:|:---|
| **인증서 종류** | EV (즉시 효과, $300~600/년) · OV (저렴, 몇 주 평판 누적) |
| **발급기관** | DigiCert (높은 가격, 평판 최상) · Sectigo (중간) · SSL.com (저렴) |
| **유효 기간** | 1년 / 3년 |
| **CI 배포** | GitHub Secrets 사용 · 자체 HSM 사용 (EV 필수 시) |

결재 후:
1. 인증서 발급 (1~7일 소요)
2. `.env` 또는 OS env-var에 주입
3. `npm run dist:win` 실행하여 사인된 산출물 검증
4. 사용자 배포

---

**기안**: Claude Opus 4.7 | **결재**: 수달의장님

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
