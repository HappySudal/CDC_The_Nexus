# 🎯 PROJECT_GOALS — The Nexus

> **STEP 1 산출물 (기획 단계)**
> 의장님(수달대표)과 AI Agents 간 변증법적 질의응답으로 도출된 **불변 목표 문서**.
> 수정은 STEP 1 재진입 시에만 허용. 모든 후속 사이클(STEP 2-6)은 이 문서를 기준으로 평가된다.

---

## 1. 프로젝트 정체성 (Identity)

| 항목 | 값 |
|:---|:---|
| **프로젝트명** | The Nexus (PJT_CDC_The_Nexus) |
| **버전** | v0.3.0 → 목표 v1.0.0 |
| **수권자** | 수달의장 (Chairman Sudal) |
| **시작일** | 2026-05-07 |
| **목표 완료일** | 2026-05-31 |
| **기획 확정일** | 2026-05-23 |

---

## 2. 핵심 목적 (Core Purpose)

> **"클라우드 의존성 제로의 100% 로컬 환경에서, CDC 마스터 헌법을 물리적으로 준수하며 자율 코딩 및 지식 박제를 실행하는 [인격형 멀티 AI 거버넌스 통제 OS]를 완성한다."**

근거 문서: [CorePurposel_The_Nexus.md](../../CorePurposel_The_Nexus.md)

---

## 3. 5대 핵심 목표 (Core Goals) — 루프 탈출 판정 기준

각 목표는 STEP 6 검수에서 의장님이 ✅/❌ 판정합니다. **5개 모두 ✅ 시 STEP 7 배포로 진입**합니다.

### G1. 엣지 AI 자립성 극대화 (ZeroCost 운영)
- **달성 기준**: 외부 클라우드 API 호출 0건 + 로컬 Ollama 통한 LLM 추론 정상 동작
- **측정 방법**: `ollama-manager.js` 동작 로그 + API 비용 청구서 $0
- **현재 상태**: ✅ 구현 완료 (코드 분석 증명)

### G2. Zero-Defect 에이전트 자율 실행
- **달성 기준**: ReAct 루프(5회 반복)로 에이전트가 코드를 sandboxed 환경에서 자율 수정 가능
- **측정 방법**: `llm-agent.js` 의 `NexusAgent.run()` 실행 성공 + `sanitizePath()` 가드레일 검증
- **현재 상태**: ✅ 구현 완료

### G3. 지식의 영속적 자산화 (TwinBrain 연동)
- **달성 기준**: Knowledge Graph + TwinBrain Python 검색 엔진 양방향 통신 동작
- **측정 방법**: `knowledge-graph.js` + `ipc-handlers.js search:documents` 핸들러 동작
- **현재 상태**: ✅ 구현 완료

### G4. 헌법 거버넌스 강제 (실시간 감시)
- **달성 기준**: `fs.watch()` 기반 헌법 파일 실시간 추적 + Discord Bridge 푸시 정상 동작
- **측정 방법**: `ipc-handlers.js constitution:get` + `discord-bridge.js` 동작 로그
- **현재 상태**: ✅ 구현 완료

### G5. 의장님 UI/UX 적합성 (인격형 인터페이스)
- **달성 기준**: 15개 Vue 컴포넌트로 5대 제어망을 의장님이 직관적으로 조작 가능
- **측정 방법**: 의장님 직접 실행 + 모든 핵심 기능 동작 확인 (STEP 6 검수)
- **현재 상태**: ⏳ 의장님 검수 대기 (가장 중요한 게이트)

---

## 4. 루프 탈출 기준 (Loop Exit Criteria)

STEP 2-6 사이클은 다음 모든 조건이 만족될 때까지 반복됩니다.

```
배포(STEP 7) 진입 조건 = G1 ✅ AND G2 ✅ AND G3 ✅ AND G4 ✅ AND G5 ✅

추가 안전 게이트:
  - 회귀 테스트 100% 통과
  - exe 무결성 SHA-256 일치
  - README/CHANGELOG 버전 동기화
  - 의장님 디지털 서명 수령
```

---

## 5. 비-목표 (Non-Goals — 명시적 제외)

이 사이클들에서 **다루지 않는** 것들:

| # | 비-목표 | 이유 |
|:---:|:---|:---|
| N1 | macOS/Linux 빌드 | Windows 우선, v1.0.0 이후 검토 |
| N2 | 다중 사용자 동시 접속 | 의장님 단독 사용 전제 |
| N3 | 클라우드 동기화 | ZeroCost 원칙 위배 |
| N4 | 외부 API 통합 (OpenAI 등) | 로컬 Ollama로 자립 |
| N5 | 모바일 앱 | 데스크톱 전용 |

---

## 6. 변증법적 질의응답 기록 (Dialectic Record)

> 본 목표 수립 과정에서 AI Agents가 질문하고 의장님이 응답한 핵심 변증법 기록입니다.

| # | AI 질문 | 의장님 응답 |
|:---:|:---|:---|
| Q1 | "클라우드 API를 일부라도 사용할까요?" | "절대 금지. ZeroCost는 절대 원칙이다." |
| Q2 | "에이전트 자율 코딩 범위는?" | "sandboxed 한정. WORKSPACE_ROOT 밖 접근 금지." |
| Q3 | "헌법 위반 시 처리는?" | "fs.watch로 실시간 감지 + Discord 즉시 알림." |
| Q4 | "UI 컴포넌트 우선순위는?" | "헌법 열람 > 에이전트 통제 > 지식 그래프 > 모니터링." |
| Q5 | "v1.0.0 완료 시점은?" | "5월 말까지. 지연 시 사이클 반복으로 완성도 확보." |

---

## 7. 인증 (Authentication)

```
기획 확정 일자: 2026-05-23
수권자: 수달의장 (Chairman Sudal)
프레임워크: SOVEREIGN PROTOCOL + Project Buildup Workflow (7-Stage with Loop)
헌법 참조: .cdc/CONSTITUTION.yaml → project_buildup_workflow
```

**의장님 서명란** (STEP 1 확정 시 기입):

```
서명일: ______________
서명: __________________
판정: [ ] 목표 확정  [ ] 수정 필요
```

---

> ⚠️ **본 문서는 불변(Immutable)입니다.**
> 수정이 필요한 경우 의장님 명시적 STEP 1 재진입 지시가 필요합니다.
> STEP 2-6 사이클 내에서 이 문서를 수정하는 행위는 헌법 위반으로 간주됩니다.

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
