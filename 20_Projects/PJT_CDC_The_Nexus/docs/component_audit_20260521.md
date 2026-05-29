# Component Audit Report - 2026-05-21
## Existing Components vs. Planned Section 2 Components

**작성일**: 2026-05-21  
**담당자**: Claude Haiku 4.5  
**목적**: Section 2 시작 전 기존 컴포넌트 감사 및 신규 vs. 확장 방향 결정

---

## 📊 Executive Summary

| 항목 | 수치 | 상태 |
|:---:|:---:|:---:|
| **기존 Vue 컴포넌트** | 6개 | ✅ 감사완료 |
| **총 라인 수** | 3,452줄 | - |
| **평균 크기** | 575줄/컴포넌트 | - |
| **P1-1-1 (진행중)** | 388줄 | 75% 완료 |
| **대규모 컴포넌트** | 2개 | AgentDashboard, RealTimeDashboard |
| **전문화 컴포넌트** | 4개 | Search, Task, Constitution, Ollama |
| **新規/拡張 결정** | 5개 | 명시됨 (아래 참조) |

---

## 🗂️ 기존 컴포넌트 상세 분석

### 1️⃣ OllamaModelDownloader.vue (P1-1-1)
**상태**: ✅ 진행중 (75% 완료)  
**라인 수**: 388줄  
**목적**: Ollama 모델 다운로드 및 로드 관리

#### 기능
- Ollama 연결 상태 확인 (자동 재시도 3회)
- 사용 가능한 모델 목록 조회
- 권장 모델 선택 (llama2, mistral, neural-chat)
- 커스텀 모델 입력 지원
- 모델 다운로드 (진행률 추적)
- 모델 로드 및 상태 관리
- IPC 브릿지 통신

#### 테스트 현황
- ✅ 42개 단위 테스트 (모두 통과)
- ✅ 10개 통합 테스트 (모두 통과)
- ✅ 95.2% 코드 커버리지

#### 다음 단계
- [ ] 실제 Ollama 환경 수동 테스트 (2026-05-22)
- [ ] 성능 프로파일링 (2026-05-23)
- [ ] 문서화 완성 (2026-05-24)

---

### 2️⃣ AgentDashboard.vue
**상태**: ✅ 기존 완성  
**라인 수**: 1,094줄  
**목적**: 5개 에이전트 모니터링 및 관리

#### 기능
- 5개 에이전트 상태 모니터링 (Sudal, Lando, OpenClaude, Marco, Guardian)
- 3가지 뷰 모드: 리스트(카드), 그리드(컴팩트), 통계(분포)
- 이름/역할 필터링 + 상태 필터 (활성/유휴/에러)
- 에이전트 상세 정보 모달
  - 기본 정보, 작업 통계, 최근 작업, 에러 로그
- 메트릭: 완료 작업/총 작업, 응답 시간, 가용성 %
- IPC: `window.electronAPI.getAgents()` 및 `onAgentStatus` 리스너

#### 계산 속성
```
- totalAgents: 총 에이전트 수
- activeCount / idleCount / errorCount: 상태별 집계
- avgResponseTime: 평균 응답 시간
- filteredAgents: 필터 적용된 에이전트 목록
```

#### 설계 패턴
- Vue 3 Composition API + TypeScript
- Reactive state 관리 (ref, computed)
- Modal 컴포넌트 재사용
- IPC 리스너 등록/해제 (메모리 누수 방지)

---

### 3️⃣ RealTimeDashboard.vue
**상태**: ✅ 기존 완성  
**라인 수**: 800줄  
**목적**: 4대 시스템 실시간 모니터링

#### 모니터링 대상
| 시스템 | 메트릭 | 업데이트 주기 |
|:---:|:---|:---:|
| **Ollama** | 상태, 활성 모델, 응답 시간 | 5초 |
| **Morning Protocol** | 실행 상태, 완료율, 마지막 실행 | 5초 |
| **TwinBrain** | 상태, 데이터 처리, 에러율 | 5초 |
| **Nexus** | 연결 상태, 사용자 수, 이벤트/초 | 5초 |

#### 주요 기능
- 통합 상태바 (건강/경고/심각) + 타임스탬프
- 4개 모니터 카드 (시스템별 진행률 막대)
- 활동 로그 (최근 50개 이벤트, 용량 제한)
- 성능 섹션
  - 1시간 추이 차트
  - 알림 시스템 (최대 10개, 자동 해제)
- 자동 새로고침 토글

#### IPC 리스너
```typescript
- onSystemMetrics: 메트릭 업데이트
- onActivityLog: 로그 항목 추가
- onAlert: 알림 발생
(모두 용량 관리 포함)
```

#### 계산 속성
```typescript
- overallStatus: 계단식 심각도 확인
  (critical → warning → healthy)
```

---

### 4️⃣ SearchInterface.vue
**상태**: ✅ 기존 완성  
**라인 수**: 352줄  
**목적**: 통합 검색 인터페이스

#### 검색 기능
- 키워드 검색
- 필터링
  - 시스템 (Ollama, CDC, TwinBrain, Nexus)
  - 날짜 범위
  - 상태 (완료/진행/대기)
  - 태그
- 정렬 (관련성/날짜/제목)
- 페이지네이션 (10항목/페이지)

#### UI 구성
- 검색 바 + 필터 패널
- 결과 카드 (스니펫, 메타데이터 태그)
- 상세 보기 패널 (하이라이팅)
- 모의 결과 2개 제공 (IPC 준비)

#### IPC 통합
```typescript
- window.electronAPI.onSearchResults(callback)
  // 서버로부터 검색 결과 수신
```

#### 설계 특징
- 상태 관리 간단함 (필터/검색 로직만)
- IPC 통합 준비 완료

---

### 5️⃣ TaskCreationForm.vue
**상태**: ✅ 기존 완성  
**라인 수**: 395줄  
**목적**: 작업 생성 및 설정

#### 폼 구조 (7개 필드셋)
1. **기본 정보**
   - 제목, 설명
   - 우선도 (4단계: 낮/중/높/긴급)
   - 카테고리 (5종: CDC/Morning/TwinBrain/Nexus/기타)

2. **담당 및 의존성**
   - 담당자 (7명: Sudal, Lando, OpenClaude, Marco, Leo, Guardian, Amadeus)
   - 의존성 추적
   - 팀 할당 (3개 트랙 또는 전사)

3. **일정**
   - 시작일 (기본: 오늘)
   - 완료일 (기본: 내일)
   - 예상 시간
   - 마일스톤 (Phase 1, 2A-2E)

4. **태그**
   - 커스텀 태그 추가/제거
   - 시스템 태그 (Nexus, Ollama, Morning, TwinBrain, CDC)

5. **옵션**
   - 블로킹 작업 여부
   - 승인 필요 여부
   - 반복 설정 (일간/주간/월간 패턴)

#### 검증 및 피드백
- 폼 검증 (에러 표시)
- 성공 알림
- IPC: `window.electronAPI.createTask(taskData)`

---

### 6️⃣ ConstitutionViewer.vue
**상태**: ✅ 기존 완성  
**라인 수**: 223줄  
**목적**: CDC 마스터 헌법 열람

#### 기능
- 6개 섹션 표시
  - 철학
  - 규칙 계층
  - 통제
  - 아키텍처
  - 물리적 계층
  - 에이전트
- 섹션별 네비게이션 버튼
- 키워드 검색 + 하이라이팅
- 북마크 시스템
- 새로고침 버튼

#### 콘텐츠 처리
- 마크다운 파싱 (### 제목 형식)
- 섹션 필터링 보기
- 기본 10항목 표시
- 마지막 업데이트 타임스탬프

#### IPC 통합
```typescript
- window.electronAPI.getConstitution()
- window.electronAPI.onConstitutionUpdate(callback)
```

#### 실시간 동기화
- 5초 주기 폴링
- 변경 감지 및 업데이트

---

## 🎯 Section 2 계획 컴포넌트 vs. 기존 컴포넌트 매핑

| 계획 컴포넌트 | 마일스톤 | 기존 중복 | 결정 | 상세 |
|:---|:---:|:---:|:---:|:---|
| **P1-1-2**<br/>KnowledgeGraphVisualizer | 100% | ❌ 없음 | 🆕 신규 | 지식 그래프 시각화 (cytoscape.js) - 신규 기술 필요 |
| **P1-1-3**<br/>AgentCommandPanel | 50% | ✅ AgentDashboard | 🔄 확장 | 기존 AgentDashboard 확장 (명령 실행 기능 추가) |
| **P1-1-4**<br/>DiscordSetupWizard | 50% | ❌ 없음 | 🆕 신규 | Discord 연동 설정 마법사 - 신규 |
| **P1-1-5**<br/>StatusDashboard | 50% | ✅ RealTimeDashboard | 🔄 확장 | 기존 RealTimeDashboard 확장 (더 상세한 메트릭) |

---

## 📋 상세 권장사항

### P1-1-2: KnowledgeGraphVisualizer.vue → 🆕 신규 생성
**사유**: 기존 컴포넌트 중 지식 그래프 시각화 기능 없음

#### 구현 전략
1. **라이브러리**: cytoscape.js (그래프 렌더링)
2. **데이터 소스**: Ollama 대화 이력 또는 CDC 문서
3. **상호작용**: 노드 클릭, 엣지 호버, 드래그
4. **스타일**: Tailwind CSS + cytoscape 테마
5. **크기 예상**: 400-500줄

#### IPC 인터페이스
```typescript
window.electronAPI.getKnowledgeGraph()
  → { nodes: [{ id, label, type }], edges: [{ source, target }] }
```

---

### P1-1-3: AgentCommandPanel.vue → 🔄 기존 확장
**기반**: AgentDashboard.vue (1,094줄) → 확장

#### 확장 계획
1. **기존 재사용 부분**
   - 에이전트 목록 표시
   - 상태 필터링
   - 카드 레이아웃
   
2. **추가 기능** (아래 모두 신규)
   - 명령 실행 폼 (텍스트 입력 + 파라미터)
   - 명령 큐 시각화
   - 실행 결과 패널
   - 명령 히스토리 로그
   
3. **IPC 신규 호출**
   ```typescript
   window.electronAPI.executeCommand(agentId, command, params)
   window.electronAPI.onCommandResult(callback)
   ```

#### 구현 방식
```typescript
// AgentDashboard.vue를 상속/확장
// 신규 <AgentCommandPanel> 섹션 추가
// 기존 이름: AgentDashboard → 변경 추천: AgentMonitoringPanel
// 신규 이름: AgentCommandPanel (기존 명령 기능 추가)
```

#### 크기 예상
- AgentDashboard 기반: 1,094줄
- 명령 실행 기능 추가: +200-300줄
- **총 예상**: 1,300-1,400줄

---

### P1-1-4: DiscordSetupWizard.vue → 🆕 신규 생성
**사유**: 기존 컴포넌트 중 Discord 연동 기능 없음

#### 구현 전략
1. **마법사 단계** (5-7단계)
   - Step 1: Discord 서버 선택
   - Step 2: 봇 토큰 입력
   - Step 3: 채널 선택 (공지/로그/명령)
   - Step 4: 권한 설정
   - Step 5: 웹훅 생성 확인
   - Step 6: 테스트 메시지 전송
   - Step 7: 완료 및 저장

2. **UI 구성**
   - 진행률 표시
   - 단계별 폼 검증
   - 이전/다음/완료 버튼
   - 오류 처리 및 복구 옵션

3. **IPC 인터페이스**
   ```typescript
   window.electronAPI.validateDiscordToken(token)
   window.electronAPI.getDiscordServers()
   window.electronAPI.createWebhook(serverId, channelId)
   window.electronAPI.sendTestMessage(webhookUrl)
   window.electronAPI.saveDiscordConfig(config)
   ```

#### 크기 예상
- 마법사 UI: 250-300줄
- 폼 로직: 150-200줄
- **총 예상**: 400-500줄

---

### P1-1-5: StatusDashboard.vue → 🔄 기존 확장
**기반**: RealTimeDashboard.vue (800줄) → 확장

#### 확장 계획
1. **기존 재사용 부분**
   - 4개 시스템 모니터링 (Ollama, Morning, TwinBrain, Nexus)
   - 실시간 메트릭 업데이트
   - 활동 로그
   - IPC 리스너 패턴

2. **추가 기능** (신규)
   - 더 상세한 메트릭
     - CPU/메모리 사용률
     - 네트워크 지연 (latency 그래프)
     - 디스크 I/O
     - 쿼리 성능 (응답 시간 히스토그램)
   - 시스템별 히트맵 (시간대별 부하)
   - 커스텀 메트릭 추가 기능
   - 성능 알람 설정 (임계값)

3. **IPC 신규 호출**
   ```typescript
   window.electronAPI.getDetailedMetrics(systemId)
     → { cpu, memory, disk, latency, queries }
   window.electronAPI.onDetailedMetrics(callback)
   ```

#### 구현 방식
```typescript
// RealTimeDashboard.vue를 상속/확장
// 신규 <DetailedMetricsPanel> 추가
// 기존: RealTimeDashboard (기본 모니터링)
// 신규: StatusDashboard (상세 메트릭)
// OR 단일 파일로 통합 (탭 구조)
```

#### 크기 예상
- RealTimeDashboard 기반: 800줄
- 상세 메트릭 + 그래프: +300-400줄
- **총 예상**: 1,100-1,200줄

---

## ✅ 결정 요약표

| 컴포넌트 | 타입 | 기존 기반 | 신규 라인 | 우선순위 | 예상 완료 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **P1-1-1** | 기존 완성 | - | 388 | ✅ 1순위 | 2026-05-24 |
| **P1-1-2** | 🆕 신규 | - | 450 | 🔴 2순위 | 2026-06-07 |
| **P1-1-3** | 🔄 확장 | AgentDashboard | +250 | 🟡 3순위 | 2026-06-14 |
| **P1-1-4** | 🆕 신규 | - | 450 | 🟡 3순위 | 2026-06-21 |
| **P1-1-5** | 🔄 확장 | RealTimeDashboard | +350 | 🟡 3순위 | 2026-06-28 |

---

## 🚀 Section 2 구현 방향 (최종 권장)

### Phase 1: 기존 확장 우선 (2026-06-01 ~ 2026-06-14)
1. **P1-1-3 AgentCommandPanel** 
   - AgentDashboard 확장 (명령 실행 기능)
   - 예상 기간: 10일
   
2. **P1-1-5 StatusDashboard**
   - RealTimeDashboard 확장 (상세 메트릭)
   - 예상 기간: 14일

### Phase 2: 신규 컴포넌트 (2026-06-15 ~ 2026-06-28)
1. **P1-1-2 KnowledgeGraphVisualizer**
   - 신규 생성 (cytoscape.js)
   - 예상 기간: 7일
   
2. **P1-1-4 DiscordSetupWizard**
   - 신규 생성 (마법사 UI)
   - 예상 기간: 7일

### 전체 일정 (수정)
```
P1-1-1: 2026-05-21 ~ 2026-05-24 (100% 완료)
P1-1-2: 2026-06-01 ~ 2026-06-07 (신규)
P1-1-3: 2026-06-01 ~ 2026-06-14 (확장)
P1-1-4: 2026-06-15 ~ 2026-06-21 (신규)
P1-1-5: 2026-06-08 ~ 2026-06-28 (확장)
---
Section 2 완료: 2026-06-28
```

---

## 📌 구현 체크리스트

### P1-1-1 (현재 진행)
- [ ] 실제 Ollama 수동 테스트 (2026-05-22)
- [ ] 성능 프로파일링 (2026-05-23)
- [ ] 문서화 (2026-05-24)
- [ ] 100% 마일스톤 달성

### P1-1-2 (신규 생성)
- [ ] cytoscape.js 라이브러리 검증 POC
- [ ] IPC 인터페이스 설계
- [ ] 데이터 모델 정의
- [ ] 그래프 렌더링 구현
- [ ] 상호작용 기능 (클릭, 호버, 드래그)
- [ ] 테스트 작성 (95% 커버리지 목표)

### P1-1-3 (AgentDashboard 확장)
- [ ] AgentDashboard → AgentMonitoringPanel 재명명
- [ ] AgentCommandPanel 새 컴포넌트 생성
- [ ] 명령 실행 폼 UI
- [ ] 명령 큐 시각화
- [ ] 결과 패널 및 히스토리
- [ ] IPC 통합
- [ ] 테스트 작성

### P1-1-4 (신규 생성)
- [ ] 마법사 단계 설계 (5-7단계)
- [ ] Discord API 통합 계획
- [ ] 각 단계별 폼 검증 로직
- [ ] 오류 처리 및 복구
- [ ] IPC 인터페이스 구현
- [ ] 테스트 작성

### P1-1-5 (RealTimeDashboard 확장)
- [ ] RealTimeDashboard 분석 및 리팩토링 계획
- [ ] 상세 메트릭 수집 로직
- [ ] 시스템별 히트맵 그래프
- [ ] 성능 알람 설정 UI
- [ ] 커스텀 메트릭 추가 기능
- [ ] IPC 통합
- [ ] 테스트 작성

---

## 📚 참고 문서

| 문서 | 경로 | 용도 |
|:---|:---|:---|
| 일일 보고서 | `05_Reports/DailyReport_20260521_*.md` | P1-1-1 진행 현황 |
| 테스트 결과 | `tests/TEST_RESULTS_20260521.md` | 테스트 상세 결과 |
| 단위 테스트 | `tests/OllamaModelDownloader.test.ts` | 테스트 코드 참조 |
| 통합 테스트 | `tests/OllamaModelDownloader.integration.test.ts` | 통합 테스트 참조 |

---

**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**
