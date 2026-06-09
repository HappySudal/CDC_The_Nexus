---
name: ANTIGRAVITY_PREFLIGHT_CHECKLIST_20260608
description: 안티그래비티 사전 검증 체크리스트 (2026-06-08 33분 준비시간용)
metadata:
  type: project
  agent: Antigravity
  priority: P0_CRITICAL
---

# 🤖 ANTIGRAVITY 사전 검증 체크리스트
## The Nexus 3PATH 병렬 실행 (2026-06-08)

**목표**: 다음 세션 시작 시 3PATH가 안전하게 실행되도록 모든 파일을 물리적으로 검증  
**시간**: 33분 (세션 복구 대기 시간)  
**규칙**: **반드시 모든 파일을 열어서 확인하라** (제0조 STEP 4 물리적 검증)

---

## 🔴 **CRITICAL: 파일 물리적 검증 (MUST READ)**

> **절대 건너뛸 수 없음**: 파일이 실제로 존재하는지, 내용이 정상인지 직접 확인해야 함

### Task 1: 생성된 계획 파일 검증 (10분)

**반드시 아래 파일을 모두 열어서 확인하세요:**

#### 1-1. PATH_A_Complete_Implementation_Plan.md
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\02_DevelopPlan\PATH_A_Complete_Implementation_Plan.md

✅ 검증 항목:
  [ ] 파일이 실제로 존재하는가? (파일 열기)
  [ ] 파일 크기가 정상인가? (8KB 이상)
  [ ] 콘텐츠가 로드되는가?
  [ ] PHASE 3-4 섹션이 모두 포함되어 있는가?
  [ ] Week 1-7 일정표가 있는가?
  [ ] 기술 스택 섹션이 있는가?
  [ ] 체크리스트 100+ 항목이 있는가?
  [ ] 하단에 슬로건이 있는가? ("시각(時刻)에 존재하고...")

🔍 대표 검증:
  - 파일 열기 → PHASE 3 섹션 확인
  - "Week 1 (Day 1-5): Playwright 웹 자동화" 문구 검색
  - "기술 스택" 섹션 확인
  - 파일 끝에 슬로건 확인
```

#### 1-2. PATH_A_Day1_Setup.md
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\02_DevelopPlan\PATH_A_Day1_Setup.md

✅ 검증 항목:
  [ ] 파일이 실제로 존재하는가? (파일 열기)
  [ ] 콘텐츠가 로드되는가?
  [ ] 4가지 작업 항목이 있는가?
    - playwright-config.js
    - automation-base.js
    - gemini-automation.js
    - test/playwright-gemini.spec.js
  [ ] 각 작업별 코드 스니펫이 포함되어 있는가?
  [ ] 설치 체크리스트가 있는가?
  [ ] 테스트 실행 방법이 명시되어 있는가?
  [ ] 산출물 요약 표가 있는가?
  [ ] 하단에 슬로건이 있는가?

🔍 대표 검증:
  - 파일 열기 → "설치 체크리스트" 섹션 확인
  - "Task 1: Playwright 설정" 확인
  - 코드 블록이 정상 렌더링되는지 확인
  - "195줄" 산출물 합계 확인
```

---

### Task 2: 빌드/설정 파일 검증 (8분)

**반드시 아래 파일을 모두 열어서 확인하세요:**

#### 2-1. vite.config.js
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\vite.config.js

✅ 검증 항목:
  [ ] 파일이 존재하는가?
  [ ] 파일 내용을 읽을 수 있는가?
  [ ] 7번 라인에 "root: './src'" 옵션이 있는가?
  [ ] plugins 섹션에 vue() 플러그인이 있는가?
  [ ] resolve.alias에서 '@' 경로 설정이 있는가?
  [ ] server.port가 5173으로 설정되어 있는가?
  [ ] build.outDir이 'dist'로 설정되어 있는가?
  [ ] 파일 끝에 슬로건이 있는가?

🔍 대표 검증:
  - 파일 열기 → 7번 라인 확인: root: './src'
  - import 문이 정상인가?
  - export default defineConfig이 있는가?
```

#### 2-2. src/index.html
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\src\index.html

✅ 검증 항목:
  [ ] 파일이 존재하는가?
  [ ] 파일 내용을 읽을 수 있는가?
  [ ] <!DOCTYPE html>이 있는가?
  [ ] <div id="app"></div>이 있는가?
  [ ] <script src="/main.js"></script>이 있는가?
  [ ] 파일 크기가 정상인가? (300바이트 이상)

🔍 대표 검증:
  - 파일 열기 → HTML 구조 확인
  - id="app" div 위치 확인
  - script 태그 경로 확인
```

---

### Task 3: Electron 엔진 파일 검증 (10분)

**반드시 아래 파일을 모두 열어서 코드를 검증하세요:**

#### 3-1. electron/llm-provider-engine.js
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\electron\llm-provider-engine.js

✅ 검증 항목 (이전 세션에서 수정됨):
  [ ] 파일이 존재하는가?
  [ ] 파일 크기가 정상인가? (9KB 이상)
  
🔴 Critical Bug Fix 검증 (반드시 확인):
  [ ] Line 8: import fs from 'fs' (NOT 'fs/promises')
      ✅ 정상: import fs from 'fs'
      ❌ 오류: import fs from 'fs/promises'
  
  [ ] Line 에서 fs.existsSync() 사용 가능한가?
      (fs/promises에는 existsSync가 없으므로 반드시 'fs'여야 함)
  
  [ ] export default 제거되었는가?
      ❌ 오류: export default new LLMProviderEngine()
      ✅ 정상: 제거됨

🔍 대표 검증:
  - 파일 열기 → Line 8 import 확인
  - "fs.existsSync" 검색 → 문제 없는가?
  - "export default" 검색 → 없어야 함
  - class LLMProviderEngine 정의 확인
  - initializeLLMProviders() 메서드 확인
```

#### 3-2. electron/chairman-brain-miner.js
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\electron\chairman-brain-miner.js

✅ 검증 항목 (이전 세션에서 수정됨):
  [ ] 파일이 존재하는가?
  [ ] 파일 크기가 정상인가? (14KB 이상)

🔴 Critical Bug Fix 검증 (반드시 확인):
  [ ] Line 418, 428, 438, 448에서 Object.entries() 사용 확인
  
      ❌ 오류 패턴:
      for (const [key, collector] of this.dataCollectors.get('google')) {
      
      ✅ 정상 패턴:
      for (const [key, collector] of Object.entries(this.dataCollectors.get('google'))) {
  
  [ ] runDailyBatch() 메서드에서 위 4개 위치 모두 수정되었는가?
  
  [ ] export default 제거되었는가?
      ❌ 오류: export default new ChairmanBrainMiner()
      ✅ 정상: 제거됨

🔍 대표 검증:
  - 파일 열기 → 418번 라인 확인: Object.entries 있는가?
  - 428, 438, 448 라인도 확인
  - "for (const [key, collector] of this.dataCollectors" 검색 → 0 결과여야 함
  - "for (const [key, collector] of Object.entries" 검색 → 4 결과여야 함
  - class ChairmanBrainMiner 정의 확인
  - runDailyBatch() 메서드 확인
```

#### 3-3. electron/main.js
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\electron\main.js

✅ 검증 항목:
  [ ] 파일이 존재하는가?
  [ ] LLMProviderEngine import 있는가?
  [ ] ChairmanBrainMiner import 있는가?
  [ ] app.on('ready') 이벤트에서 초기화 코드 있는가?
  [ ] console.log("Initializing...") 등이 있는가?

🔍 대표 검증:
  - 파일 열기
  - "import LLMProviderEngine" 검색
  - "import ChairmanBrainMiner" 검색
  - "new LLMProviderEngine()" 검색
  - "new ChairmanBrainMiner()" 검색
```

#### 3-4. electron/ipc-handlers.js
```
파일 경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\electron\ipc-handlers.js

✅ 검증 항목:
  [ ] 파일이 존재하는가?
  [ ] ChairmanBrainMiner import 있는가?
  [ ] initializeIpcHandlers() 함수에서 초기화 있는가?

🔍 대표 검증:
  - 파일 열기
  - "import ChairmanBrainMiner" 검색
  - "initializeIpcHandlers" 함수 확인
```

---

### Task 4: 빌드 상태 검증 (3분)

**반드시 실제 상태를 확인하세요:**

#### 4-1. Job1 상태 확인
```
PowerShell:
  Get-Job 1
  
확인 사항:
  [ ] Job1이 존재하는가?
  [ ] 상태가 뭔가?
      - Running: 계속 진행 중
      - Completed: 완료 (배포 준비)
      - Failed: 실패 (에러 확인 필요)
```

#### 4-2. dist/ 폴더 확인
```
경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\dist\

확인 사항:
  [ ] dist/ 폴더가 존재하는가?
  [ ] index.html 파일이 있는가?
  [ ] assets/ 폴더가 있는가?
  [ ] vendor/ 파일이 있는가?
  [ ] 총 파일 크기가 200KB 이상인가?
```

#### 4-3. build.log 확인 (있으면)
```
경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\build.log

확인 사항:
  [ ] 파일이 있는가?
  [ ] 마지막 메시지가 "Build complete" 또는 유사한가?
  [ ] 에러 메시지가 있는가? (있으면 기록)
```

---

## 🟡 **PATH C 최적화 분석 재검증 (5분)**

### C1: skill_discovery_engine.py 최적화

**파일 확인:**
```
경로: C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus\...
    (정확한 경로 확인 필요)

✅ 파일 내용 검증:
  [ ] 파일이 실제로 존재하는가?
  [ ] 현재 코드가 정규식 기반인가?
  [ ] PyYAML 또는 TF-IDF 사용 중인가?
  [ ] @functools.lru_cache 사용 중인가?
  [ ] ThreadPoolExecutor 사용 중인가?

최적화 필요 확인:
  [ ] YAML 파싱: 정규식 → PyYAML (개선 가능?)
  [ ] 태그 추출: 문자열 매칭 → TF-IDF (개선 가능?)
  [ ] 캐싱: 없음 → @lru_cache (개선 가능?)
  [ ] 병렬 처리: 없음 → ThreadPoolExecutor (개선 가능?)
```

---

## 📋 **최종 검증 체크리스트 (요약)**

```
✅ 필수 파일 (반드시 모두 열어서 확인):
  [ ] PATH_A_Complete_Implementation_Plan.md (존재 + 내용)
  [ ] PATH_A_Day1_Setup.md (존재 + 내용)
  [ ] vite.config.js (존재 + root 옵션)
  [ ] src/index.html (존재 + 구조)
  [ ] electron/llm-provider-engine.js (존재 + Line 8 'fs' 확인)
  [ ] electron/chairman-brain-miner.js (존재 + Object.entries 4곳 확인)
  [ ] electron/main.js (존재 + import 확인)
  [ ] electron/ipc-handlers.js (존재 + import 확인)

🔴 Critical Bug Fix 검증:
  [ ] llm-provider-engine.js: fs import (not fs/promises)
  [ ] chairman-brain-miner.js: Object.entries (4곳)
  [ ] 둘 다 export default 제거

🟡 빌드 상태:
  [ ] Job1 상태 확인
  [ ] dist/ 폴더 존재
  [ ] build.log 확인 (있으면)

🟢 PATH C 최적화:
  [ ] skill_discovery_engine.py 현황 파악
  [ ] 개선 필요 사항 정리
```

---

## 🎯 **보고 항목**

**다음 세션 시작 시 보고하세요:**

```
5열 도표 형식:

구분 | 검증 결과 | 상태 | 발견 사항 | 비고
-----|----------|------|----------|------
파일 존재 | ✅/❌ | OK/문제 | | 
코드 정합성 | ✅/❌ | OK/수정필요 | |
버그 픽스 | ✅/❌ | 모두적용/미적용 | 어느 라인 문제 |
빌드 상태 | ✅/❌ | 완료/진행중/실패 | Job1 상태 |
PATH C 분석 | ✅/❌ | 완료/진행중 | 개선안 |
```

---

## 🚨 **문제 발견 시 대응**

```
❌ 파일이 없으면:
  1. 생성된 파일 목록 확인 (메모리 참조)
  2. 올바른 경로 재확인
  3. 파일 재생성 고려

❌ 코드에 버그 있으면:
  1. 수정 필요 내용 명확히 기록
  2. 정확한 라인 번호 기록
  3. 의장님께 보고

❌ Job1이 실패했으면:
  1. build.log 내용 분석
  2. 에러 메시지 기록
  3. 재실행 여부 결정
```

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**

**작성**: 2026-06-08 (토큰 98% 사용 직전)  
**대상**: Antigravity 검증 에이전트  
**우선도**: P0_CRITICAL
