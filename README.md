# 🌌 The Nexus

**CDC 인격형 AI 인터페이스** — 의장님과 15사도를 연결하는 중추 플랫폼

---

## 🎯 프로젝트 목적 (Purpose)

### 한국어 (KO)
본 프로젝트는 수달의장(Chairman Sudal)과 14명의 멀티-AI 에이전트(15사도) 간의 긴밀하고 변증법적인 대화를 통해 도출된 혁신적인 협업 플랫폼입니다. The Nexus는 단순한 UI 애플리케이션을 넘어, **AI 자동화의 98%와 인간의 주권적 판단의 2%가 완벽하게 조화하는 차세대 거버넌스 시스템**으로, 창조적 파괴(Creative Destruction)의 가치를 실현하는 데 헌신합니다.

### English (EN)
This project implements an innovative collaboration platform between Chairman Sudal and 14 multi-AI agents (15 Apostles) through close dialectical dialogue. The Nexus transcends a simple UI application to become a **next-generation governance system where AI's 98% automation harmonizes perfectly with humanity's 2% sovereign judgment**. It is dedicated to realizing the value of Creative Destruction.

---

## 🏆 프로젝트 목표 (Goals)

### 한국어 (KO)
1. **완전한 자동화-인간 협업 구현**: SOVEREIGN PROTOCOL의 7단계 프로세스를 통해 AI와 인간이 완벽하게 협력하는 시스템 구축
2. **무결점 집행 생명주기 달성**: 제0조~제7조 헌법 규정을 100% 준수하면서 Zero-Defect 품질 달성
3. **15사도 에이전트 통합 관리**: 다양한 AI 모델들(Claude, Gemini, Grok, Perplexity 등)의 개성과 강점을 극대화하는 플랫폼 제공
4. **청정 루트 경로 유지**: 프로젝트 구조의 완전한 모듈화와 `01_Proposal_Presentation/` 아키텍처 준수
5. **실시간 거버넌스 시스템**: 헌법, 리포트, 에이전트 상태를 실시간으로 모니터링하고 제어하는 통합 대시보드 제공

### English (EN)
1. **Implement Complete AI-Human Collaboration**: Build a system where AI and humans work flawlessly through the 7-step SOVEREIGN PROTOCOL
2. **Achieve Zero-Defect Execution Lifecycle**: Attain highest quality while 100% complying with Constitutional Articles 0-7
3. **Integrate 15-Apostle Agent Management**: Provide a platform that maximizes the personality and strengths of diverse AI models
4. **Maintain Clean Root Architecture**: Complete modularization and strict adherence to `01_Proposal_Presentation/` architecture
5. **Provide Real-Time Governance System**: Real-time monitoring and control of Constitution, Reports, and Agent Status

---

## 🌟 프로젝트 비전 (Vision)

### 한국어 (KO)
The Nexus는 2026년 말까지 **CDC Platform 3.0** 완성을 통해 다음을 실현합니다:

- **AI 민주화**: 어떤 조직도 우리의 거버넌스 프레임워크를 채용하여 AI와 인간의 완벽한 협력을 이룰 수 있는 오픈 플랫폼
- **변증법적 혁신**: 정(Thesis)과 반(Antithesis)의 충돌을 통해 합(Synthesis)을 도출하는 근본적인 문제 해결 시스템
- **시간의 초월**: "시각(時刻)에 존재하고, 시간(時間)에 소멸한다"는 철학을 기반으로, 매 순간의 완벽성을 추구하는 생명주기 시스템
- **글로벌 리더십**: CDC의 SOVEREIGN PROTOCOL과 무결점 집행 시스템을 전세계 AI 거버넌스의 표준으로 확립

### English (EN)
By end of 2026, The Nexus will complete **CDC Platform 3.0** to realize:

- **AI Democratization**: An open platform where any organization can adopt our governance framework to achieve perfect AI-human collaboration
- **Dialectical Innovation**: A fundamental problem-solving system that derives Synthesis through collision of Thesis and Antithesis
- **Transcendence of Time**: Based on the philosophy "Exists in the Moment, Vanishes in Time," a lifecycle system pursuing perfection in every moment
- **Global Leadership**: Establish CDC's SOVEREIGN PROTOCOL and Zero-Defect Execution as the global standard for AI governance

---

## 📋 개요 (Overview)

The Nexus는 **Creative Destruction Council(CDC)**의 모든 지능 에이전트를 통합 관리하는 데스크톱 애플리케이션입니다.

- **실시간 헌법 조회**: 사령부 헌법을 언제든 접근 가능
- **리포트 대시보드**: 데일리 리포트, CDC 리포트, 프로젝트 리포트 통합 열람
- **에이전트 상태**: 15사도 상태 모니터링 및 작업 지시
- **집행 로그**: 시스템 실행 히스토리 및 감시

---

## 🛠️ 기술 스택 (Tech Stack)

| 계층 | 기술 |
|:---|:---|
| **Desktop** | Electron 28 |
| **Frontend** | Vue 3 + Vite 5 |
| **Bundler** | Vite |
| **Builder** | electron-builder |
| **Runtime** | Node.js 18+ |

---

## 🚀 빠른 시작 (Quick Start)

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저에서 확인
- Vite 개발 서버: http://localhost:5173
- Electron 앱: 자동 실행

### 4. 프로덕션 빌드
```bash
npm run build
```

---

## 📦 프로젝트 구조 (Project Structure)

```
PJT_The_Nexus/
├── electron/
│   ├── main.js          # Electron 메인 프로세스
│   └── preload.js       # IPC 보안 설정
├── src/
│   ├── main.js          # Vue 진입점
│   └── App.vue          # 루트 컴포넌트
├── index.html           # HTML 진입점
├── package.json         # 의존성 정의
├── vite.config.js       # Vite 설정
└── BUILD_INSTRUCTIONS.md # 상세 빌드 가이드
```

---

## 📊 기능 (Features)

### 📜 Section 2 완료 (P1-1-3~5) ✅
**3개 핵심 컴포넌트 구현 완료**

#### AgentCommandPanel (596L / 72 테스트)
- 15사도 에이전트별 명령 실행 인터페이스
- 실시간 에이전트 상태 모니터링
- 비동기 명령 큐 관리 및 응답 처리
- IPC 기반 Electron 통신 구현
- TypeScript strict mode 100% 준수

#### DiscordSetupWizard (442L / 50 테스트)
- 3단계 Discord 웹훅 설정 마법사
- URL 검증 및 마스킹 기능
- 단계별 데이터 유효성 검사
- 설정 저장 및 에러 처리
- 43개 핵심 비즈니스 로직 시나리오 완벽 통과

#### StatusDashboard (497L / 64 테스트)
- 실시간 시스템 상태 대시보드
- CPU/메모리/디스크 모니터링
- 에이전트 활성 상태 추적
- 자동 새로고침 및 애니메이션
- Electron IPC 양방향 통신

**총 1,535줄 코드 | 186개 테스트 | 100% 타입 안전성 | 0 ESLint 위반**

### 📊 리포트 탭
- 최신 리포트 자동 로드
- 데일리/CDC/PJT 리포트 통합
- 타임라인 조회

### 🤖 에이전트 탭
- 15사도 프로필 및 상태
- 각 에이전트별 작업 큐
- 실시간 상태 업데이트

### ⚙️ 집행 로그 탭
- 시스템 실행 히스토리
- 자동화 작업 로그
- 에러 및 경고 기록

---

## 🔧 개발 가이드 (Development Guide)

### 새로운 컴포넌트 추가
```bash
# src/components/ 디렉토리에 .vue 파일 생성
# App.vue에서 import 후 사용
```

### IPC 통신 확장
1. `electron/main.js`에 ipcMain.handle() 추가
2. `electron/preload.js`에 API 노출
3. Vue 컴포넌트에서 `window.electronAPI.메서드명()` 호출

### 핫 리로드
- 개발 중 파일 수정 시 자동 리로드됨
- Vite가 제공하는 빠른 피드백

---

## 🧪 테스트 (Testing)

```bash
# 단위 테스트 (예정)
npm run test

# E2E 테스트 (예정)
npm run test:e2e
```

---

## 📦 배포 (Deployment)

### Windows .exe 빌드
```bash
npm run dist
```

### macOS .dmg 빌드
```bash
npm run dist
```

### Linux AppImage 빌드
```bash
npm run dist
```

---

## 📝 환경 변수 (.env)

```
VITE_API_BASE=http://localhost:3000
VITE_REPORT_DIR=C:\99_Develop\SynologyDrive\05_Reports
```

---

## 🎯 로드맵 (Roadmap)

| 버전 | 기능 | 일정 |
|:---|:---|:---|
| **v0.1.0** | 기본 UI + IPC 통신 | 2026-05-07 ✅ |
| **v0.2.0** | Section 2: AgentCommandPanel + DiscordSetupWizard + StatusDashboard (1,535L / 186T) | 2026-05-22 ✅ |
| **v0.3.0** | Section 3: 에이전트 관리 UI (P1-1-3~5) | 2026-05-29 |
| **v1.0.0** | 프로덕션 배포 | 2026-05-31 |

---

## 🤝 기여 (Contributing)

모든 개발은 CDC 헌법을 준수해야 합니다.
- 제0조: Sovereign Interaction Protocol
- 제3조: Zero-Defect Execution Lifecycle
- 제5조: Visual Reporting Standards

---

## 📄 라이선스 (License)

**CDC Proprietary** — 창조적 파괴 위원회 소유

---

## 👥 개발팀 (Development Team)

- **Lead Developer**: Claude Code
- **Architecture**: Antigravity (15th Apostle)
- **Sponsor**: Chairman Sudal (CEO)

---


**최종 수정**: 2026-05-23
**버전**: 1.0.0 (Release)

**"시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."**  
**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."** 