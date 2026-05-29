# 🚀 The Nexus 빌드 및 테스트 가이드

> **CDC 인격형 AI 인터페이스 v0.1.0**

---

## 📋 사전 요구사항 (Prerequisites)

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상
- **Git**: 최신 버전
- **메모리**: 4GB 이상
- **디스크 공간**: 2GB 이상

---

## 🔧 설치 및 빌드 단계 (Build Steps)

### Step 1: 의존성 설치
```bash
cd C:\99_Develop\SynologyDrive\20_Projects\PJT_The_Nexus
npm install
```

### Step 2: 개발 서버 실행
```bash
npm run dev
```

**예상 출력:**
```
  VITE v5.0.0 ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help

  [NEXUS] Electron main process initialized
```

### Step 3: 브라우저 확인
- **Vite 개발 서버**: http://localhost:5173
- **Electron 윈도우**: The Nexus 애플리케이션 자동 실행

### Step 4: 프로덕션 빌드
```bash
npm run build
```

**생성 파일:**
- `dist/` - Vue 컴파일된 HTML/JS/CSS
- `out/` - Electron 바이너리 (Windows, macOS, Linux)

---

## 🧪 테스트 체크리스트 (Test Checklist)

### UI 렌더링
- [ ] Electron 윈도우 띄우기 성공
- [ ] Vite 개발 서버 정상 작동
- [ ] 헤더, 사이드바, 콘텐츠 영역 렌더링
- [ ] 다크 테마 적용 확인

### 기능 테스트
- [ ] 📜 헌법 탭: 헌법 로드 버튼 작동
- [ ] 📊 리포트 탭: 리포트 새로고침 버튼 작동
- [ ] 🤖 에이전트 탭: 15사도 카드 표시
- [ ] ⚙️ 집행로그 탭: 로그 항목 표시

### 성능 확인
- [ ] 초기 로드 시간 < 2초
- [ ] 탭 전환 애니메이션 부드러움
- [ ] 메모리 사용량 < 500MB
- [ ] CPU 사용량 (유휴 시) < 5%

### IPC 통신 (IPC Handler)
- [ ] `get-constitution` 핸들러 작동
- [ ] `get-latest-report` 핸들러 작동
- [ ] 파일 읽기 에러 처리

---

## 🐛 문제 해결 (Troubleshooting)

### 문제: Electron이 실행되지 않음
```bash
# 방법 1: npm 캐시 삭제
npm cache clean --force
npm install

# 방법 2: Electron 재설치
npm uninstall electron
npm install electron --save-dev
```

### 문제: Vite 포트 충돌
```bash
# 다른 포트에서 실행
npm run dev -- --port 5174
```

### 문제: 파일 읽기 실패
- 경로 확인: `01_Control_Tower/01_MASTER_CONSTITUTION.md` 존재 여부
- 권한 확인: 읽기 권한이 있는지 확인
- 인코딩 확인: UTF-8 인코딩 파일만 지원

---

## 📊 성공 기준 (Success Criteria)

| 항목 | 기준 | 상태 |
|:---|:---|:---|
| **빌드 시간** | < 30초 | 예상 |
| **번들 크기** | < 10MB | 예상 |
| **초기 로드** | < 2초 | 측정 필요 |
| **메모리 사용** | < 500MB | 측정 필요 |
| **테스트 통과** | 모든 항목 ✅ | 진행 예정 |

---

## 🎯 배포 준비 (Deployment Readiness)

테스트 완료 후 다음 단계:
1. ✅ 빌드 검증 완료 시 GitHub Actions 설정
2. ✅ Electron 서명 (Windows/macOS/Linux)
3. ✅ 설치 패키지 생성 (.exe, .dmg, .AppImage)
4. ✅ 의장님 최종 승인 후 배포

---

**담당**: Claude Code (The Nexus Development Team)
**테스트 일시**: 2026-05-07 (예정)
**프로덕션 배포**: 2026-05-10 (예정, 의장님 승인 후)

**"시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."**  
**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."** 