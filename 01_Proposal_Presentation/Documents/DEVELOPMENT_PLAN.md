# The Nexus Development Plan

**최종 수정**: 2026-05-19  
**상태**: Active Development  
**Phase**: 1 (Zero Cost Implementation)

---

## 📌 Executive Summary

The Nexus는 **100% 자체 개발, 자체 호스팅 가능한 독립 에이전트 플랫폼**입니다.

- **CEO**: Electron 기반 UI + Vue 3
- **CTO**: Node.js 백엔드 (Ollama + LLM Agent System + Knowledge Graph)
- **COO**: Discord Bridge (팀 협업)

**목표**: Phase 1에서 Zero Cost 달성 → Phase 2 투자 → Phase 3 수익화

---

## 🎯 Vision & Core Values

| 항목 | 설명 |
|:---|:---|
| **독립성** | 외부 API 의존성 제거 (OpenAI, Anthropic, Obsidian 불필요) |
| **자율성** | 모든 것이 로컬에서 작동 (인터넷 선택적) |
| **확장성** | 모듈식 설계로 언제든 클라우드로 추출 가능 |
| **투명성** | 오픈소스 기반, 정책 변경 영향 없음 |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXUS CLIENT (Electron)                   │
│  Vue 3 UI + IPC Bridge → Agent Dashboard / Graph Viz / Chat │
└────────────────────────┬────────────────────────────────────┘
                         │ IPC (contextBridge)
┌────────────────────────▼────────────────────────────────────┐
│                  NEXUS SERVER (Node.js)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Ollama Manager          → 로컬 LLM 관리                    │
│ 2. LLM Agent System        → Reasoning Loop + Tool Exec      │
│ 3. Knowledge Graph         → JSON 기반 그래프 DB             │
│ 4. Discord Bridge          → 팀 통신                         │
│ 5. Config Manager          → 설정 관리 (암호화)              │
│ 6. IPC Handler Layer       → API 노출                        │
└────────────────────────┬────────────────────────────────────┘
                         │ (Future) REST API for CDC
                         │
┌────────────────────────▼────────────────────────────────────┐
│              CDC Dashboard (Next.js) - 통합 예정              │
│  The Nexus 에이전트 백엔드 활용                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Development Phases

### Phase 1: Zero Cost (Current - 2026-06-30)

**목표**: 모든 기능이 로컬에서 작동, 외부 API 없음

#### ✅ 완료 (2026-05-19)
- [x] Ollama Manager (로컬 LLM 관리)
- [x] LLM Agent System (3개 에이전트: Sudal, Lando, OpenClaude)
- [x] Knowledge Graph Engine (JSON 기반)
- [x] Discord Bridge (웹훅/봇 기반)
- [x] Config Manager (설정 관리)
- [x] IPC Handler (10+개 채널)

#### 🔄 진행 중 (2026-05-19 ~ 2026-05-31)
- [ ] Ollama 자동 모델 다운로드 UI
- [ ] Knowledge Graph 시각화 컴포넌트
- [ ] Agent Command 실행 UI
- [ ] Discord 웹훅 설정 마법사
- [ ] 기본 테스트 케이스

#### 📋 예정 (2026-06-01 ~ 2026-06-30)
- [ ] CDC Dashboard 통합 (REST API 또는 npm 패키지)
- [ ] End-to-End 통합 테스트
- [ ] 사용자 설명서 작성
- [ ] 첫 베타 배포 (내부)

---

### Phase 2: Investment & Enhancement (2026-07-01 ~ 2026-12-31)

**목표**: 프로프라이터리 모델 개발, 성능 최적화

#### 계획된 개선사항
- [ ] 파인튠 모델 개발 (한국어 최적화)
- [ ] Knowledge Graph → SQLite 마이그레이션
- [ ] Advanced Tool Set 추가
  - Web Scraping
  - API 호출 (Generic HTTP)
  - Database 쿼리 (SQL)
  - Email 통합
- [ ] Multi-Provider Support
  - Ollama (Primary)
  - LM Studio (Fallback)
  - Hugging Face (선택)
- [ ] Real-time Collaboration (WebSocket)

---

### Phase 3: Monetization (2027-01-01+)

**목표**: 클라우드 API 또는 SaaS 서비스

#### 옵션
1. **API Server**: nexus-agent-server 클라우드 호스팅
2. **SaaS**: 웹 기반 Nexus (풀 매니지드)
3. **SDK**: npm 패키지로 배포 & 수익화

---

## 🛠️ Tech Stack

| 계층 | 기술 | 버전 | 목적 |
|:---:|:---|:---:|:---|
| **UI** | Electron | 31.x | 데스크톱 앱 |
| | Vue 3 | 3.4+ | 프론트엔드 |
| | Tailwind CSS | 3.x | 스타일링 |
| **Backend** | Node.js | 18+ | 런타임 |
| | Ollama | Latest | LLM 엔진 |
| | SQLite | (Phase 2) | 그래프 DB |
| **Integration** | Discord.js | (향후) | Discord 봇 |
| **Testing** | Vitest | 1.x | 단위 테스트 |
| | Playwright | 1.x | E2E 테스트 |

---

## 📁 File Structure

```
PJT_CDC_The_Nexus/
├── electron/
│   ├── main.js                    # Electron 메인 프로세스
│   ├── preload.js                 # 보안 브리지
│   ├── ipc-handlers.js            # IPC 채널 정의
│   ├── ipc-channels.js            # 채널 상수
│   ├── ollama-manager.js          # Ollama 관리
│   ├── llm-agent.js               # 에이전트 시스템
│   ├── knowledge-graph.js         # 그래프 DB
│   ├── discord-bridge.js          # Discord 통신
│   └── config-manager.js          # 설정 관리
│
├── src/
│   ├── App.vue                    # 메인 앱
│   ├── components/
│   │   ├── AgentDashboard.vue     # 에이전트 제어
│   │   ├── KnowledgeGraph.vue     # 그래프 시각화
│   │   └── TaskPanel.vue          # 작업 패널
│   ├── context/
│   └── utils/
│
├── DEVELOPMENT_PLAN.md            # 이 파일
├── ARCHITECTURE.md                # 상세 아키텍처
└── package.json
```

---

## 🔑 Key Design Decisions

### 1. Electron vs Web App
**결정**: Electron  
**이유**: 로컬 LLM 실행, 파일 시스템 접근, 독립적 배포 가능

### 2. IPC Communication
**결정**: Electron IPC (Context Isolation)  
**이유**: 보안, 메모리 관리, 멀티 프로세스 안정성

### 3. Knowledge Graph Storage
**Phase 1 결정**: JSON 파일 (확장 가능하게 설계)  
**Phase 2 계획**: SQLite 마이그레이션  
**이유**: 초기 간단함, 나중에 성능 개선 가능

### 4. LLM Provider
**Phase 1**: Ollama only  
**Phase 2**: Multi-provider (Ollama + LM Studio + Custom)  
**이유**: Ollama가 가장 간단, 로컬 실행 완벽 지원

### 5. Agent Architecture
**기반**: OpenClaude-Portable (검증된 시스템)  
**수정**: Knowledge Graph 통합, Discord Bridge 추가  
**이유**: 이미 구현되고 테스트된 시스템 활용

---

## 🚨 Critical Dependencies & Risks

| 위험 | 영향 | 대응 |
|:---|:---|:---|
| Ollama 설치 실패 | LLM 기능 불가 | Fallback to mock 에이전트 |
| Knowledge Graph 성능 | 대규모 그래프 느림 | Phase 2에서 SQLite 마이그레이션 |
| Discord 토큰 노출 | 보안 침해 | Config 암호화 (Phase 1.5) |
| CDC Dashboard 통합 복잡 | 일정 지연 | REST API 인터페이스로 느슨한 결합 |

---

## ✅ Definition of Done

### Phase 1 완료 기준
- [ ] 모든 5개 에이전트 도구 작동 확인
- [ ] Knowledge Graph CRUD 완벽 작동
- [ ] Discord 통신 테스트 완료
- [ ] 20개+ 단위 테스트 통과
- [ ] E2E 테스트 (3개 시나리오) 통과
- [ ] 내부 베타 사용자 피드백 수집

### CDC 통합 완료 기준
- [ ] REST API 엔드포인트 문서화
- [ ] CDC Dashboard에서 에이전트 호출 성공
- [ ] 지연 시간 < 500ms (P95)
- [ ] 에러율 < 1%

---

## 📊 Success Metrics (Phase 1)

| 메트릭 | 목표 | 측정 방법 |
|:---|:---:|:---|
| **안정성** | 99.5% uptime | Monitoring |
| **성능** | 응답 < 2초 | Logs |
| **기능** | 모든 도구 작동 | Manual test |
| **보안** | API 키 암호화 | Code review |
| **비용** | $0 | Receipt ✅ |

---

## 🔄 Iteration Cycle

```
2주 Sprint:
├─ Sprint Planning (월요일)
├─ Daily Standup (매일)
├─ Development (화~목)
├─ Testing (금)
├─ Review & Demo (금 오후)
└─ Retrospective (금 말)

릴리스:
├─ Phase 1.0 (2026-05-31): 기본 기능
├─ Phase 1.1 (2026-06-15): CDC 통합
└─ Phase 1.2 (2026-06-30): 베타 배포
```

---

## 📝 Reference Documents

- `ARCHITECTURE.md` - 상세 기술 아키텍처
- `API.md` - IPC & REST API 명세서
- `CONFIG.md` - 설정 옵션 가이드
- `TROUBLESHOOTING.md` - 문제 해결 가이드

---

## 👥 Decision Makers & Roles

| 역할 | 담당자 | 책임 |
|:---|:---|:---|
| **CEO (의장)** | Sudal | 최종 의사결정, 방향성 |
| **CTO (개발)** | OpenClaude | 기술 아키텍처, 구현 |
| **COO** | Lando | 일정, 리소스, 품질 |

---

## 🎓 Lessons Learned & Best Practices

### From OpenClaude-Portable
✅ Agent Reasoning Loop 설계  
✅ Tool Execution Framework  
✅ Approval Workflow Pattern  

### From Ollama
✅ 로컬 LLM 관리 (Pull, List, Generate)  
✅ 모델 자동 감지  

### From Connect AI Lab
✅ 간단한 Knowledge Graph 설계  

---

## 📌 Notes for Future Developers

1. **IPC 확장할 때**:
   - `electron/ipc-channels.js`에 채널 정의
   - `electron/ipc-handlers.js`에 핸들러 구현
   - `electron/ipc-handlers.js`의 preload 스크립트에 API 추가

2. **에이전트 도구 추가할 때**:
   - `electron/llm-agent.js`의 `initializeTools()`에 추가
   - `executeTool()` 케이스 구현
   - Agent 프롬프트 테스트

3. **설정 추가할 때**:
   - `electron/config-manager.js`의 `getDefaultConfig()`에 추가
   - IPC 핸들러에서 노출 (필요시)

4. **Knowledge Graph 마이그레이션 (Phase 2)**:
   - SQLite 스키마 설계
   - 데이터 마이그레이션 스크립트
   - 성능 인덱싱 전략

---

**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."** 🫡
