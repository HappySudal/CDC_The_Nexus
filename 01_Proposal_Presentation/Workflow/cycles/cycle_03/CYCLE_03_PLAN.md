# 🗂️ CYCLE 03 — 공정관리계획표 (STEP 2)

> **사이클 번호**: #3 (Cycle #2 G5 부분 미달성으로 진입)
> **생성 일자**: 2026-05-23
> **이전 사이클 결과**: Cycle #2 — UI 로딩은 성공, IPC 기능 미동작
> **자율 모드**: 의장님 사전 일괄 승인 (2026-05-23 야간 휴식)

---

## 1. Cycle #2 갭 결산

| 항목 | Cycle #2 종료 | Cycle #3 처리 |
|:---|:---|:---:|
| UI 로딩 | ✅ 성공 (vite base fix) | 유지 |
| dist/index.html 경로 | ✅ ./assets/ 정상 | 유지 |
| asar 우회 (resources/app/) | ✅ 동작 | Cycle #3에서 정식 asar 복원 시도 |
| **main.js의 5개 import** | ❌ 1+개 module load 실패 | 🔴 **이번 Critical** |
| IPC 기능 | ❌ 미동작 (minimal main.js) | 🔴 fix 후 정상 main.js 복원 |

---

## 2. 이번 사이클 작업 (Cycle #3)

### Critical Path

| ID | 작업 | 도구 | 예상 |
|:---:|:---|:---|:---:|
| T1 | main.js를 dynamic import 진단판으로 임시 교체 | Write | 1분 |
| T2 | exe 실행 → NEXUS_DEBUG.log 분석 → culprit 식별 | PowerShell | 1분 |
| T3 | 식별된 culprit 모듈의 module-level 초기화를 safe 패턴으로 수정 | Edit | 2분 |
| T4 | 정상 main.js로 복원 + 모든 import 추가 | Write | 1분 |
| T5 | exe 재실행 → 완전한 UI + IPC 동작 검증 | PowerShell | 1분 |

### Cycle #3 백로그 → Cycle #4 이월
- T6: 잔여 CSS unclosed comment 6개 (test.ts 5 + vue 1+)
- T7: discord-bridge.js의 200/204 호환성
- T8: "다음 날" → "다음 날" 치환 (PROJECT_GOALS, CHECKPOINT_REVIEW)
- T9: 누락 테스트 3건 보강
- T10: src/ 원본 코드와 app/ runtime 코드 동기화 (knowledge-graph.js 등)

---

## 3. 진단 전략 — Dynamic Import

ESM static import는 hoisted라 어디서 실패했는지 추적 불가. 따라서:

```javascript
app.on('ready', async () => {
  createWindow();
  for (const mod of ['ipc-handlers', 'ollama-manager', 'llm-agent', 'knowledge-graph', 'discord-bridge']) {
    try {
      await import(`./${mod}.js`);
      log(`✅ ${mod}`);
    } catch (e) {
      log(`❌ ${mod}: ${e.message}`);
    }
  }
});
```

→ NEXUS_DEBUG.log에서 ❌ 첫 줄이 culprit.

---

## 4. 루프 탈출 예측

```
Cycle #3 종료 시점 예상:
├─ G5 UI 동작              : ✅ 유지
├─ G5 IPC 기능 (4대 제어망) : ✅ 회복 예상
└─ 5/5 → STEP 7 배포 진입

신뢰도: 80% (정확한 진단 후 fix는 단순)
```

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
