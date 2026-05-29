# CLAUDE.md — The Nexus (PJT_CDC_The_Nexus)

> **의장님 중추 인터페이스 개발 지침**
> 본 문서는 The Nexus 프로젝트 전체의 작업 규범을 정의합니다.

---

## 🏗️ 프로젝트 개요

| 항목 | 내용 |
|:---|:---|
| **이름** | The Nexus (CDC 인격형 AI 인터페이스) |
| **버전** | 0.3.0 |
| **스택** | Vue 3 + Vite + Electron + Vitest |
| **용도** | 의장님과 15사도를 연결하는 중추 플랫폼 |
| **상태** | Phase 3 개발 중 (Section 4 진행) |

---

## 🛠️ 개발 환경 명령어

| 명령어 | 목적 | 포트 |
|:---|:---|:---|
| `npm run dev` | 개발 서버 + Electron 동시 실행 | 5173 |
| `npm run build` | Vite 빌드 + Electron 패킹 | — |
| `npm run preview` | 빌드 결과 미리보기 | 4173 |
| `npm run test` | Vitest 전체 테스트 | — |
| `npm run test:ui` | Vitest UI 모드 | 51204 |
| `npm run start` | Electron 앱 실행 | — |
| `npm run dist` | 배포 가능한 빌드 생성 | — |

---

## 📋 핵심 규칙

### 1️⃣ 단일 진실 (Single Source of Truth)

```
@01_Control_Tower/01_MASTER_CONSTITUTION.yaml
 └─ NEXUS 하위 모든 작업 → 헌법 검증 필수
```

### 2️⃣ 폴더별 책임

| 폴더 | 책임 | claude.md |
|:---|:---|:---|
| **src/** | Vue 컴포넌트 + 로직 | `src/claude.md` |
| **src/components/** | UI 컴포넌트 (Vitest) | `src/claude.md` 참조 |
| **tests/** | 통합 테스트 | `tests/claude.md` |
| **electron/** | Electron 메인 프로세스 | `electron/claude.md` |
| **docs/** | 기술 문서 | `docs/claude.md` |
| **01_Proposal_Presentation/** | 프레젠테이션 | `01_Proposal_Presentation/claude.md` |
| **Report/** | 세션/일일 리포트 | `Report/claude.md` |
| **dist/** | 빌드 산물 (커밋 금지) | `dist/claude.md` |

### 3️⃣ 파일명 규칙

- **Vue 컴포넌트**: PascalCase (예: `AgentDashboard.vue`)
- **테스트**: `[Component].test.ts` (Vitest)
- **유틸**: camelCase (예: `graphUtils.js`)
- **리포트**: `[Type]_[Date]_[Title]_[Model].md` (SOP-15/28)

### 4️⃣ 절대 금지사항

- ❌ `dist/` 폴더 커밋 (`.gitignore` 확인)
- ❌ `node_modules/` 수정
- ❌ 절대 경로 사용 (Vue에서는 `@/` 별칭만)
- ❌ Mermaid 다이어그램 (ASCII만 사용)
- ❌ console.log 남겨두기 (production 제거)

### 5️⃣ 세션 시작 체크리스트

1. **헌법 정독**: `01_Control_Tower/01_MASTER_CONSTITUTION.md`
2. **일일 리포트**: `05_Reports/LATEST_REPORT.md`
3. **위반 사항 확인**: `01_Control_Tower/CONSTITUTION_VIOLATIONS_LOG.md`
4. **의장님 브리핑**: 5열 도표로 현황 보고
5. **테스트 실행**: `npm run test`

---

## 🔄 작업 프로세스 (SOVEREIGN PROTOCOL)

### STEP 1: 지시 파악 검증
의장님 지시 수신 → 5열 도표로 요약 보고

### STEP 2: 파악 확인 및 승인
의장님의 "수행하라" 사인 대기

### STEP 3: 업무 수행
- `npm run dev` 실행 (개발 서버)
- 코드 작성 + 테스트 동시 진행
- **Phase 3 자체 검증 필수**

### STEP 4: 자체 검증 ⚠️ 절대 생략 불가
- 실제 기능 동작 확인 (UI + Electron)
- 테스트 커버리지 확인
- 크로스 시스템 영향 검사 (Grep)

### STEP 5: 5열 도표 보고
- 변경 전/후 비교
- 테스트 결과 + 커버리지
- 잔여 업무 기록

---

## 📊 품질 메트릭

| 지표 | 목표 | 측정 방법 |
|:---|:---:|:---|
| **테스트 커버리지** | 85%+ | `npm run test` → coverage |
| **UI 반응성** | 100ms 이내 | DevTools 프로파일링 |
| **번들 크기** | <2MB | `npm run build` → dist 분석 |
| **무한루프 감지** | 0 | Vitest + Chrome DevTools |

---

## 🚨 오류 처리

오류 발생 시:

1. **로그 수집**: DevTools + Vitest 출력
2. **근본원인 분석**: RCA + Antithesis (3-모델 검증)
3. **자동 복구**: 해당 되면 즉시 수정
4. **보고**: 의장님께 상세 리포트 제출

---

## 📞 문의 및 참조

- **헌법**: `.cdc/CONSTITUTION.yaml`
- **에이전트 명단**: `.cdc/adapters/Agent_Roster.md`
- **리포트 규칙**: `.claude/rules/reporting-rules.md`
- **코드 스타일**: `.claude/rules/coding-style.md`

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
