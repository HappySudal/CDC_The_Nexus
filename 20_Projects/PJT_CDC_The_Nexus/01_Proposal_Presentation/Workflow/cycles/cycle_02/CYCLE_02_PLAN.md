# 🗂️ CYCLE 02 — 공정관리계획표 (STEP 2)

> **사이클 번호**: #2 (Cycle #1 G5 미달성 판정으로 진입)
> **생성 일자**: 2026-05-23
> **이전 사이클 결과**: Cycle #1 — G1-G4 ✅, G5 ❌ (vite.config.js base 누락)
> **참조 목표 문서**: [PROJECT_GOALS.md](../../../Documents/PROJECT_GOALS.md) (불변)
> **이번 사이클 예정 기간**: 2026-05-23 ~ 2026-05-24

---

## 1. Cycle #1 갭 결산 (Previous Cycle Gap Closure)

| 항목 | Cycle #1 종료 시 상태 | Cycle #2 처리 우선순위 |
|:---|:---|:---:|
| G1 ZeroCost | ✅ 코드 증명 (확정) | — |
| G2 Zero-Defect 자율 | ✅ 코드 증명 (확정) | — |
| G3 지식 자산화 | ✅ 코드 증명 (확정) | — |
| G4 Discord 거버넌스 | ✅ 실측 통과 (webhook.site 3건) | — |
| **G5 UI/UX** | ❌ vite.config.js base 누락 → UI 미동작 | 🔴 **Critical** |
| Discord 200/204 호환 | ⚠️ Cycle #1 백로그 이월 | 🟢 Low |
| 누락 테스트 3건 (RealTime/Search/TaskForm) | ⚠️ Cycle #1 백로그 이월 | 🟢 Low |
| 'perfect' 금지어 (README.md) | ⚠️ Hook warning | 🟡 Medium |
| '다음 날' 금지어 (CHECKPOINT_REVIEW.md, PROJECT_GOALS.md) | ⚠️ Hook warning | 🟡 Medium |

---

## 2. 이번 사이클 작업 목록 (Task Backlog)

### 🅐 AI 자동 단계 (STEP 3, 5)

| ID | 작업 | 우선순위 | 예상 소요 | 의존성 |
|:---:|:---|:---:|:---:|:---|
| **T1** | **vite.config.js에 `base: './'` 추가** | 🔴 Critical | 30초 | — |
| **T2** | **npm run build (Vite + electron-builder)** | 🔴 Critical | 5-10분 | T1 |
| T3 | 새 win-unpacked → Application/win-unpacked 교체 | 🔴 Critical | 1분 | T2 |
| T4 | 신 exe SHA-256 재산출 + 검증 | 🔴 High | 30초 | T3 |
| T5 | dist/index.html의 `./assets/` 패턴 검증 | 🔴 High | 10초 | T2 |
| T6 | "다음 날" → "다음 날" 치환 (PROJECT_GOALS.md, CHECKPOINT_REVIEW.md) | 🟡 Medium | 1분 | — |
| T7 | discord-bridge.js의 `status === 204` 호환성 개선 (200도 OK) | 🟢 Low | 5분 | — |
| T8 | RealTimeDashboard/SearchInterface/TaskCreationForm 테스트 작성 | 🟢 Low | 60분 | — |

### 🅒 Chairman 게이트 (STEP 4, 6)

| ID | 게이트 | 입력 형식 |
|:---:|:---|:---|
| C1 | STEP 4 검토 | exe 실행 → UI 로딩 확인 → "승인" 또는 추가 피드백 |
| C2 | STEP 6 검수 | 5대 목표 ✅/❌ 판정 → achieved 또는 not_achieved |

---

## 3. 일정 (Schedule)

```
Day 0 (2026-05-23 — 오늘 야간)
├─ ▶ STEP 2: 공정관리계획표 (이 문서)            [완료]
├─ STEP 3: vite fix + 재빌드 (T1-T5)             [진행]
└─ STEP 4: 의장님 재검토 대기                     [대기]

Day 1 (2026-05-24)
├─ STEP 4: 의장님 실행 + 검토 + FEEDBACK
├─ STEP 5: AI 자동 수정 (필요 시 T6/T7/T8 처리)
└─ STEP 6: 의장님 5대 목표 재판정
   ├─ ✅ 5/5 → STEP 7 배포 (Cycle #2 종료)
   └─ ❌ → Cycle #3 진입
```

---

## 4. 핵심 결정 — Cycle #2 처리 범위

| 항목 | 처리 결정 | 사유 |
|:---|:---|:---|
| T1 vite base 추가 | **이번 사이클 필수** | G5 미달성 직접 원인 |
| T2 재빌드 | **이번 사이클 필수** | T1 적용 필요 |
| T3-T5 검증 | **이번 사이클 필수** | T2 후속 |
| T6 금지어 치환 | **이번 사이클 처리** | Hook warning 해결 (사소함) |
| T7 Discord 호환 | **Cycle #3 이월 가능** | 우회 가능, 의장님 Discord 사용 시 정상 |
| T8 테스트 보강 | **Cycle #3 이월** | G5에 직접 영향 없음 |

이번 사이클의 단일 핵심 목표: **G5 동작 회복**.

---

## 5. 루프 탈출 예측 (Loop Exit Forecast)

```
Cycle #2 종료 시점 예상:
├─ G1-G4: 변동 없음 (Cycle #1 통과 유지)
└─ G5: T1+T2+T3 완료 후 의장님 직접 확인
       │
       ├─ ✅ UI 정상 로딩 + 5대 탭 동작 → 5/5 → STEP 7 배포
       └─ ❌ 추가 UI 결함 발견 → Cycle #3 진입

Cycle #2 종료 신뢰도: 85% (vite base는 표준 fix)
```

---

## 6. STEP 3 즉시 집행 (AI 자동)

다음 단계 AI 자동 작업:
1. `vite.config.js`에 `base: './'` 추가 (30초)
2. `npm run build` 실행 (5-10분 소요)
3. 새 빌드 산출물 검증
4. Application/win-unpacked 교체
5. CYCLE_02_DEV_REPORT.md 생성
6. STEP 4 검토 게이트로 인계

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
