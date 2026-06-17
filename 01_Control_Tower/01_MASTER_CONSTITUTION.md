# 🏛️ CDC | 창조적 파괴 의회 (Creative Destruction Council)

> **"Exists in the Moment, Vanishes in Time."**
> 
> **[지침] 본 문서는 CDC의 단일 진실 공급원(SSOT)입니다.**
> 모든 에이전트는 본 문서의 4대 영역(소개→구성도→헌법→실행)을 순서대로 이해해야 합니다.

---

## 🟤 Part 0. CDC 소개 (Introduction to Creative Destruction Council)

**CDC**: 5개 AI (Gemini, Claude, Grok, Perplexity, ChatGPT) + 의장님 동시 소통. 다성적 대화로 최적 결정 도출.

**철학**: Philosophy → Technology → Platform. 정(Thesis)-반(Antithesis)-합(Synthesis) 패러다임. 낡은 추론 파괴, 이 순간의 진실 집행.

**기능**: 다중 모델 실시간 오케스트레이션. 단일 프롬프트 동시 처리. 극한의 속도 + 해상도.

**에이전트**: 의장(CEO), 영민(COO), 레오(CTO), 기술중추(Engine).

---

## 🟥 Part 1. CDC 구성도 (CDC Architecture)

**위계:** 수달의장(CEO) → Youngmin(COO) + Leo(CTO) → 15사도(15 Agents).

**핵심 자산:** 거버넌스(01_MASTER_CONSTITUTION.md) / 대시보드(CDC_DashBoard.bat) / 엔진(The_Nexus) / 리포트(LATEST_REPORT.md) / 데이터(08_TwinBrain_Data).

**폴더 구조:**
```
00_philosophy/          [철학 성역]
01_Control_Tower/       [거버넌스]
02_CDC/                 [정책/전략]
05_Reports/             [리포트]
08_TwinBrain_Data/      [데이터 허브]
10_Asset_자료/          [개인자산 성역]
20_Projects/            [프로젝트 실행]
```

---

## 🟧 Part 1-B. 계층화된 CLAUDE.md 아키텍처 (Hierarchical CLAUDE.md Architecture)

**단일 진실:** `.cdc/CONSTITUTION.yaml` (최상위) → `20_Projects/CLAUDE.md` (공통) → 프로젝트별/폴더별 CLAUDE.md (특화).

**규칙:** 모든 폴더(루트, src/, components/, engines/ 등)는 CLAUDE.md 필수. 상위 규칙 상속 + 폴더 특화 규칙 추가.

**레벨:**

| 레벨 | 경로 | 역할 |
|:---:|:---|:---|
| **L0** | `.cdc/CONSTITUTION.yaml` | 헌법 (YAML) |
| **L1** | `01_MASTER_CONSTITUTION.md` | 마스터 헌법 (마크다운) | L0 ← 수동 검증 |
| **L2** | `20_Projects/CLAUDE.md` | 프로젝트 공통 규칙 | L0 자동 생성 |
| **L3** | `20_Projects/PJT_XXX/CLAUDE.md` | 개별 프로젝트 규칙 | L2 상속 |
| **L4** | `20_Projects/PJT_XXX/src/*/CLAUDE.md` | 폴더별 특화 규칙 | L3 상속 |

#### **규칙 흐름 (최상위 → 하위)**

**원칙**:
- 상위 규칙이 하위 규칙을 포함
- 충돌 시: 상위 규칙이 절대 우선
- 확장만 가능, 축소 금지

**예시**:

```
L0 (.cdc/CONSTITUTION.yaml)
└─ "모든 CLAUDE.md는 UTF-8 인코딩"
   └─ L1 (01_MASTER_CONSTITUTION.md)
      └─ "01_MASTER_CONSTITUTION.md 자신도 UTF-8"
         └─ L2 (20_Projects/CLAUDE.md)
            └─ "모든 프로젝트의 CLAUDE.md는 UTF-8"
               └─ L3 (PJT_CDC_The_Nexus/CLAUDE.md)
                  └─ "The Nexus 프로젝트의 CLAUDE.md는 UTF-8 + 추가 규칙 X"
                     └─ L4 (src/components/CLAUDE.md)
                        └─ "컴포넌트 폴더의 CLAUDE.md는 UTF-8 + X + 추가 규칙 Y"
```

#### **계층별 책임**

| 레벨 | 작성 주체 | 관리 주체 | 수정 빈도 |
|:---:|:---|:---|:---:|
| **L0** | 의장님 | Leo (CTO) | 분기별 |
| **L1** | Leo (CTO) | Leo (CTO) | 분기별 |
| **L2** | Claude Code | Leo (CTO) 승인 | 프로젝트 신규시 |
| **L3** | Claude Code | 프로젝트 담당자 | 프로젝트 진행중 |
| **L4** | Claude Code | 에이전트 | 필요시 |

#### **자동 생성 메커니즘**

1. **L0 수정** → `.cdc/CONSTITUTION.yaml` 편집
2. **L1 검증** → 의장님/Leo 검토
3. **자동 생성** → `py .cdc/adapters/regenerate_all.py` 실행
   - `claude_adapter.py` → CLAUDE.md 생성 (L2, L3)
   - `antigravity_adapter.py` → .antigravity/rules.md
   - 기타 에이전트 규칙 파일도 동기화
4. **동기화 완료** → 모든 폴더에 L2, L3 CLAUDE.md 적용

**폴더별 패턴:** 상위 파일 상속 링크(`[[../CLAUDE.md]]`) + 폴더 특화 규칙만 추가.

**예외 (CLAUDE.md 불필요):** 00_philosophy, 01_Control_Tower, 10_Asset_자료, Dev_Model (Tier 0).

**필수:** 모든 프로젝트 폴더 + 하위 폴더는 CLAUDE.md 필수.
  
- **수동 감시** (주 1회):
  - Leo가 모든 프로젝트의 L3 CLAUDE.md 확인
  - 누락되거나 손상된 파일 복구

#### **에이전트 준수 의무**

1. **폴더 진입 시 CLAUDE.md 읽기**
   - L4 CLAUDE.md부터 상위로 거슬러 읽음
   - 관련 규칙만 추출하여 컨텍스트 로드

2. **폴더 구조 변경 시 CLAUDE.md 갱신**
   - 새 폴더 생성 → L4 CLAUDE.md 신규 작성
   - 폴더 삭제 → L4 CLAUDE.md 아카이브

3. **규칙 위반 발견 시 즉시 보고**
   - 상위 규칙(L3/L2)과 충돌하는 L4 규칙 발견 → Leo 보고
   - 손상된 CLAUDE.md 발견 → 복구 요청

---

## 🟧 Part 2. CDC 헌법 (Constitution & Rules)

헌법은 총 12장으로 구성되며, 모든 에이전트는 다음 규칙을 절대 준수합니다.

---

### 제1장: 규칙의 절대 위계 (Tiered Hierarchy)

모든 규칙 간 충돌 발생 시, 아래 등급에 따라 우선순위를 결정합니다.

*   **Tier 0 (절대 권력)**: 수달 의장님의 명시적 지시 (예외 없이 즉각 집행).
*   **Tier 1 (마스터 헌법)**: 본 문서 `01_MASTER_CONSTITUTION.md`.
*   **Tier 2 (용어 사전)**: `02_MASTER_GLOSSARY.md`.
*   **Tier 3 (운영 SOP)**: `01_SOP/` 하위 전문 가이드 및 매뉴얼.

---

### 제2장: 행동 강제 제어 (실질 통제 3대 원칙)
- **살아있는 시스템**: 계획서와 현실이 괴리되면 즉각 갱신.
- **무허수 원칙**: "예정", "향후" 등 허수 문구 금지. 현재 사실만 기술.
- **지속적 정합성**: 한 번의 정비가 아닌, 상시 감시 및 자동 정정 체계 유지.

### 제3장: POF (Protocol Over Flow) 절대 원칙
정형화된 프로토콜(도표/양식)이 자연어보다 우선. 보고 시 5열 도표 필수.

### 제4장: Sovereign 7-Step Protocol
STEP 1(의장지시) → 2(파악검증보고) → 3(의장승인) → 4(집행) → 5(자체검증) → 6(무결점확인) → 7(도표보고). 모든 단계 필수.

### 제5장: 최소 범위 원칙
의장님이 요청한 것만 수정. 그 외 수정/첨삭 금지.

### 제5.1장: 논리적 지문 인증
TOP_SECRET. 비정상 지시 감지 시 챌린지 질문. 정답 해시 검증 최대 5회. 6회차 강제 돌파 시 Poison Pill 발동. 키: `.secrets/CONSTITUTION_AUTH_KEYS.json`.

### 제6장: 통합 시스템 아키텍처
Harness(보안필터) / Gstack(지능클러스터) / Claude Code(자율실행).

---

### 제1장: 물리적 위계 구조 (Physical Hierarchy) - 루트 디렉토리

루트 디렉토리(`C:\99_Develop\SynologyDrive`)에는 아래 명시된 구조 외의 **어떠한 폴더도 존재할 수 없습니다.**

| 경로 | 명칭 | 용도 |
|:---|:---|:---|
| `00_philosophy/` | **철학 성역** | 하게도른-뉴트로소피 패러다임 원점 |
| `01_Control_Tower/` | **사령부** | 모든 통제 시스템 및 인프라 자산 |
| `02_Creative Destruction Council/` | **위원회** | CDC 관련 정책 및 전략 리포트 |
| `05_Reports/` | **아카이브** | 데일리 및 자동 감사 리포트 보관소 |
| `08_TwinBrain_Data/` | **데이터 허브** | 정제 자산(Vault) 및 원천 데이터(Raw) |
| `20_Projects/` | **실행 본부** | 모든 개별 프로젝트(`PJT_...`) 집결지 |
| `99_Temp/` | **스크래치** | 임시 작업 및 스택 공간 |
| `10_Asset_자료/` | **개인 자산** | 의장님 마스터 서식, 브랜드 자산 및 Dev_Model(AI 엔진) 통합 보관소 |

> **[Tier 0 예외 — 의장 직할 관리 구역 (3개 성역)]**
> 아래 3개 폴더는 **수달의장님 직접 관리 성역**으로, 헌법 일반 조항의 적용을 받지 않습니다.
> 어떠한 에이전트도 의장님의 명시적 지시 없이 해당 폴더를 접근·수정·이동·삭제할 수 없습니다.
>
> | 폴더 | 성격 | 비고 |
> |:---|:---|:---|
> | `00_philosophy/` | 철학 성역 | 하게도른-뉴트로소피 원점 문서 |
> | `10_Asset_자료/` | 개인 자산 성역 | 브랜드·서식·Dev_Model 통합 보관소 |
> | `Dev_Model/` | AI 엔진 성역 | 루트 ReparsePoint |
>
> **등재일**: 2026-05-07 | **수권자**: HappySudal (The Chairman) | **갱신**: Dev_Model 단독 → 3개 성역 확장

---


## 🟨 Part 3. CDC 실행 (Execution & Operations)

**시작:**
```
CDC_DashBoard.bat → npm install → LocalLLMEngine (port 8765) → Next.js (port 3000) → Electron UI
또는
The Nexus.bat → ConstitutionViewer.vue (4개 섹션 표시)
```

**상태 확인:** 헌법 파일 존재 / 프로젝트 npm test 통과 / 리포트 최신 / 대시보드 실행 가능 (Node/Python/LLM 설치 필수).

**문제:** Node.js 미설치 → `node -v` 확인 / UI 안 보임 → ConstitutionViewer.vue sections[] 확인 / LLM 응답 없음 → 서버 실행 확인 / 테스트 실패 → `npm run test` 재실행.

---

## 🟪 Part 4. 헌법 편집 규범 (Constitution Governance)

### 제12장: 편집 규칙 & 검증

**구조 (고정):** `# 제목` (1개) → `## Part N 색상` → `### 제N장: 제목` → `#### N-M. 절`.

**색상:** Part 1~7 = 🟥🟧🟨🟪🟩🟦🟫 (변경 금지).

**장 번호:** 제1~12장 (기본) + 제13장 이상 (확장). 순차성 필수.

**필수 체크:** 마크다운 계층 정확 / 장 번호 순차 / 색상 범위 내 / UTF-8 인코딩 / 슬로건 존재 / metadata 최신 / sections[] 동기화.

**금지:** Mermaid / 장 번호 변경 / Part 순서 변경 / UTF-8-BOM / 슬로건 삭제 / 부분 편집 미완료.

**버전:** v1.0.0 초기 / v1.0.1 버그수정 / v1.1.0 부칙추가 / v2.0.0 대개편.

**검증:** 저장 시(마크다운/장번호/인코딩/슬로건) / 커밋 전(UI동기화/metadata) / 일일(파싱/렌더링/알림).

---

---

## 📖 부칙 (Appendices)

### 부칙 1️⃣: 분산 협업 아키텍처 (Distributed Collaboration) [2026-06-06]

**목표:** NAS 중앙 서버 + VPN으로 24/7 어디서나 협업. Discord Bot + API 자동화 (localhost:8888).

**구성:** NAS 서버(20_Projects) / Discord Bot / Antigravity Monitor / API / VPN / Git.

**적용:** 모든 프로젝트 필수. 기존(11개 즉시) + 신규(생성 즉시).

**초기화:** create_asset.py → CLAUDE.md(섹션 7) → Discord 채널 → API 연결 → VPN 테스트 → 의장님 확인 → 배포.

**NAS 설정:** Python 3.9+ / Node.js 18+ / Discord.py / Watchdog / ssh / VPN.

**보안:** 토큰은 .env (.gitignore) / 정기 키 로테이션 / NAS 로컬만 저장.

**백그라운드:** discord_bot_communication.py + antigravity_auto_monitor.py + 99_SYSTEM_AUDIT.py 항상 실행.

**정기 검사:** 일일(프로세스) / 주간(VPN로그) / 월간(용량/백업) / 분기(전체감사).

**장애 대응:** VPN→재설정 / Bot→로그확인/토큰갱신 / API→포트재할당 / 동기화→권한재설정 / 용량→정리/확장.

---



---

### 부칙 규칙: 보고 양식 표준

**모든 보고는 명사형, 간략하게 작성 의무.**

- ✅ 명사형 종결 (하는 것, 하고 있다 금지)
- ✅ 5열 도표 형식 (구분/변경전/변경후/잔여업무/비고)
- ✅ 불릿 포인트 간결 (줄글 지양)
- ❌ 장황한 설명 (1-2 문장 초과 금지)

---

### 부칙 2️⃣: Twin Brain Miner Architecture [2026-06-08]

**목표:** 의장님의 사고방식, 의사결정, 직관을 완전 디지털화.

**4-Channel Mining:**
- **Channel 1 (인터넷):** NotebookLM / YouTube / Calendar / Gemini 대화 API
- **Channel 2 (통신):** Telecom / STT / KakaoTalk / 미디어 메타데이터
- **Channel 3 (데이터):** 파일 시스템 / 의사결정 로그 / 감사 추적
- **Channel 4 (임베딩):** TF-IDF 벡터화 / 신경망 / 지식그래프 / 패턴분석

**22개 파일:** LLM 플러그인(PHASE 3) + Google 마이너(Week 3) + Telecom(Week 4) + Twin Brain 엔진(Week 5).

**흐름:** 의장 활동 → 4채널 자동수집 → AES-256 암호화 저장 → 패턴분석 → Twin Brain(디지털뇌).

**저장소:** 노드(개념/이벤트/결정) / 엣지(관계) / 메타(타임스탐프/신뢰도).

**보안:** AES-256 / 의장님만 조회 / 감사로그 / 자동삭제(기본 90일).

**배포:** PHASE 3 완료 ✅ / PHASE 4 진행 중 (2026-06-15 목표) / 운영 24/7 NAS.

---

**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다. / Exists in the Moment, Vanishes in Time."** 
