# PPT Automation Agent Team | 프레젠테이션 자동화 에이전트팀

**Project Purpose**: End-to-end PowerPoint generation from topic to finished deck. A coordinated team of 3 research/content agents and 2 design/build skills, connected via fixed-name file contracts.

**프로젝트 목적**: 주제에서 완성된 PPT까지 전체 자동화. 3개의 리서치/콘텐츠 에이전트와 2개의 디자인/빌드 스킬이 고정명 파일 계약으로 연결된 조직된 팀.

---

## 🏗️ Workspace Layout | 워크스페이스 구조

```
PPT_Team_Agent/
├── .claude/
│   ├── agents/
│   │   ├── research-agent.md                  # 웹 리서치, PDF 우선, research-notes.md + sources.md 생성
│   │   ├── data-collection-agent.md           # sources.md → 파일 다운로드, manifest.md 생성
│   │   └── data-organizer-agent.md            # 종합 정리, outline.md + design-brief.md 생성
│   └── skills/
│       ├── presentation-design/
│       │   ├── SKILL.md                       # 글로벌 디자인 에이전시 아키타입 기반 설계
│       │   ├── LICENSE.txt
│       │   └── references/
│       │       ├── design-archetypes.md       # 8가지 디자인 아키타입 (McKinsey, BCG, Bain, Gartner, Pentagram, W+K, Ogilvy, IDEO)
│       │       ├── design-agencies.md         # 14개 글로벌 디자인 에이전시 포트폴리오
│       │       ├── color-palette-resources.md # 색상 팔레트 개발 도구 및 프로세스
│       │       └── diagram-infographic-resources.md # 다이어그램 & 인포그래픽 제작 도구
│       └── pptx/                               # Vendored from Anthropic skills (unmodified)
│           ├── SKILL.md
│           ├── editing.md
│           ├── pptxgenjs.md
│           ├── LICENSE.txt
│           └── scripts/...
├── projects/
│   └── <project-slug>/
│       ├── 00_brief.md                        # 주제, 대상 청중, 목표, 슬라이드 수 (에이전트가 읽음)
│       ├── 01_research/
│       │   ├── research-notes.md              # Research Agent: 주제별 정리, [S1][S2].. 인용
│       │   └── sources.md                     # Research Agent: 테이블 (ID | Title | URL | Type | Priority | Notes)
│       ├── 02_assets/
│       │   ├── pdfs/, images/, data/
│       │   └── manifest.md                    # Data Collection: 다운로드 상태 추적
│       ├── 03_content-plan/
│       │   ├── outline.md                     # Organizer: 슬라이드별 계획 (인용 + 시각 제안)
│       │   └── design-brief.md                # Organizer: 톤/대상청중 + (나중) 선택 아키타입
│       └── 04_output/
│           └── <slug>_<내용>_[설명]_yyyymmdd.pptx  # 최종 PPT (파일명 규약 아래 참고)
└── CLAUDE.md                                   # 이 파일
```

**File-based Contracts (에이전트 간 계약 파일)**:
- `00_brief.md`: 프로젝트 정의
- `01_research/{research-notes.md, sources.md}`: Research Agent 출력
- `02_assets/manifest.md`: Data Collection Agent 출력
- `03_content-plan/{outline.md, design-brief.md}`: Organizer Agent 출력
- `04_output/<slug>.pptx`: Final output

---

## 👥 Agents | 에이전트 (3개)

### 1. **research-agent** | 리서치 에이전트
- **역할**: 주제에 대한 웹 리서치, PDF 우선 수집
- **입력**: `projects/<slug>/00_brief.md`
- **출력**: `01_research/research-notes.md`, `01_research/sources.md`
- **도구**: WebSearch, WebFetch, Read, Write
- **재호출**: data-organizer-agent가 research-gap 지시 시 (gap-filling mode)
- **참고자료**: `.claude/agents/research-agent-resources.md` (85+ 신뢰도 높은 조사원)

### 2. **data-collection-agent** | 데이터 수집 에이전트
- **역할**: sources.md의 파일들을 다운로드, asset 폴더에 정리
- **입력**: `01_research/sources.md`
- **출력**: `02_assets/{pdfs/images/data/}` + `02_assets/manifest.md`
- **도구**: Read, Write, PowerShell (Invoke-WebRequest for binary downloads), WebFetch
- **파일명 규약**: `S<ID>_<slugified-title>.<ext>` (예: `S1_mckinsey_ai_trends_2026.pdf`)
- **재호출**: organizer-agent가 새로운 source rows 추가 지시 시

### 3. **data-organizer-agent** | 콘텐츠 조직 에이전트
- **역할**: 리서치 + 자료 → 슬라이드별 계획 + 디자인 브리프
- **입력**: `research-notes.md`, `sources.md`, `manifest.md`, `00_brief.md`
- **출력**: `03_content-plan/outline.md`, `03_content-plan/design-brief.md`
- **도구**: Read, Write, Edit, Glob, Grep, Task
- **협업**: Task로 research-agent (gap-fill) / data-collection-agent (new downloads) 위임 가능 (최대 2라운드/에이전트)

---

## 🎨 Skills | 스킬 (2개)

### 1. **presentation-design** | 프레젠테이션 디자인 스킬
- **목적**: design-brief.md 읽고 → 글로벌 디자인 에이전시 아키타입 중 선택 → 칼라/타입/레이아웃/시그니처 결정
- **입력**: `design-brief.md`, `outline.md`
- **참고자료**:
  - `design-archetypes.md` (8가지 아키타입: McKinsey/BCG/Bain/Gartner/Pentagram/Wieden+Kennedy/Ogilvy/IDEO)
  - `design-agencies.md` (14개 글로벌 에이전시 포트폴리오)
  - `color-palette-resources.md` (색상 도구 & 프로세스)
  - `diagram-infographic-resources.md` (다이어그램 도구 & 패턴)
- **출력**: 설계된 디자인 시스템 (색상, 타이포, 레이아웃, 시그니처) → `design-brief.md`에 기록

### 2. **pptx** | PowerPoint 빌드 스킬
- **목적**: design-system + outline.md → 완성된 .pptx 파일 생성
- **입력**: `design-brief.md`, `outline.md`, `02_assets/`
- **출력**: `04_output/<slug>_<내용>_[설명]_yyyymmdd.pptx` (파일명 규약 아래 참고)
- **기능**: 슬라이드 생성, 자료 삽입, 애니메이션, QA (markitdown + LibreOffice)

---

## 📋 PPTX Filename Format | PPT 파일명 규약

**규칙 (Rule)**:
```
<PJT명>_<내용>_[설명]_yyyymmdd.pptx
```

**구성요소 (Components)**:
- **<PJT명>**: 프로젝트/클라이언트 약칭 또는 프레젠테이션 주제 (예: `AI_Strategy`, `MarketAnalysis`, `ProductLaunch`)
- **<내용>**: 내용 주제 (명사형, 필수) (예: `Q1_Market_Overview`, `Trends_2026`, `Case_Studies`)
- **[설명]**: 설명/버전 (명사형, 선택) (예: `_Executive_Summary`, `_Detailed_Analysis`, `_Draft_v2`)
  - 필요할 때만 포함. 없으면 생략 가능
- **yyyymmdd**: 작성 날짜 (예: `20260610`)

**예시 (Examples)**:
1. 기본형: `AI_Strategy_Market_Overview_20260610.pptx`
2. 설명 포함: `MarketAnalysis_Q1_Executive_Summary_20260610.pptx`
3. 간단한 형태: `ProductLaunch_Proposal_20260610.pptx`
4. 버전 포함: `ClientPitch_Full_Analysis_Draft_v2_20260610.pptx`

**작성 단계 (When to Apply)**:
- **outline.md 작성 시**: 프로젝트 메타 정보에 예상 파일명 기록
- **pptx 스킬 실행 시**: outline.md의 파일명 규약 적용하여 최종 .pptx 생성
- **여러 버전**: [설명]으로 구분 (예: `_Draft`, `_Final`, `_Client_Approved`)

---

## 🛠️ Dependencies | 의존성

### Python Libraries
```bash
pip install "markitdown[pptx]"
pip install Pillow
```

### Node.js
```bash
npm install -g pptxgenjs
```

### System Tools
- **LibreOffice** (`soffice` command): PDF validation, document conversion
  ```powershell
  winget install -e --id TheDocumentFoundation.LibreOffice
  ```
- **Poppler** (`pdftoppm` command): PDF to image conversion
  ```powershell
  winget search poppler    # 정확한 패키지명 확인
  winget install <package-id>
  ```

### Verification
After installation, verify each tool:
```powershell
python -m markitdown --help
python -c "import PIL; print(PIL.__version__)"
npm list -g pptxgenjs
soffice --version
pdftoppm -v
```

---

## 🔄 End-to-End Workflow | 전체 워크플로우

### **Step 1: 프로젝트 초기화**
사용자가 주제와 청중을 제시 → `.claude/agents/data-organizer-agent.md`의 Task 도구로 research-agent 호출
또는 수동으로:
```bash
# 1. Create project folder
mkdir projects/<slug>

# 2. Create brief
echo "# <Topic>
Audience: <Audience>
Goal: <Goal>
Target Slides: <N>
" > projects/<slug>/00_brief.md
```

### **Step 2: 리서치 (Research Agent)**
```bash
# 수동 호출 또는 organizer-agent의 Task 위임
# research-agent가 WebSearch (filetype:pdf 우선) + WebFetch 실행
# 출력: 01_research/research-notes.md (주제별 섹션), 01_research/sources.md (table)
```

### **Step 3: 데이터 수집 (Data Collection Agent)**
```bash
# organizer-agent 또는 수동 호출
# sources.md의 각 행 → PowerShell Invoke-WebRequest로 다운로드
# 파일명: S<ID>_<title>.<ext> → 02_assets/{pdfs/, images/, data/}
# 출력: 02_assets/manifest.md (download status)
```

### **Step 4: 콘텐츠 조직 (Organizer Agent)**
```bash
# research-notes.md + sources.md + manifest.md 읽음
# Gap 감지 시 Task로 step 2/3 재호출 (max 2 rounds each)
# 출력: 03_content-plan/outline.md (slide-by-slide plan with [Sn] citations)
#       03_content-plan/design-brief.md (tone, audience, design archetypes guidance)
```

### **Step 5: 디자인 선택 (Presentation Design Skill)**
```bash
# design-brief.md + outline.md 읽음
# design-archetypes.md 중 선택 (or blend) → 칼라/타입/레이아웃/시그니처 결정
# 선택 이유 기록 → design-brief.md 업데이트
```

### **Step 6: PPT 빌드 (PPTX Skill)**
```bash
# design-brief.md + outline.md + 02_assets/ 읽음
# pptxgenjs로 슬라이드 생성 (design-system 적용)
# 자료 삽입 (charts, images), QA 실행
# 출력: 04_output/<slug>_<내용>_[설명]_yyyymmdd.pptx (파일명 규약 준수)
```

---

## 📚 Font Standards | 폰트 규격

**제목 (Titles)**: Pretendard
- 설치: https://github.com/orioncactus/pretendard/releases
- 가중치: Bold, SemiBold
- 크기: 20-28pt (slide headings)

**본문 (Body)**: Noto Sans KR Medium
- 설치: https://fonts.google.com/noto/specimen/Noto+Sans+KR
- 가중치: Medium (400)
- 크기: 12-16pt

모든 디자인 아키타입 및 PowerPoint 생성에서 이 폰트 쌍을 일관되게 적용합니다.

---

## 📖 Typical User Journey | 사용 흐름 예시

```
사용자: "AI 트렌드에 대한 경영진 보고 자료 PPT를 만들어줄 수 있을까?
        청중은 C-level executives, 슬라이드는 20장."

↓

에이전트 팀:
1. research-agent: "AI trends 2026" + "market analysis" 검색 → research-notes.md + sources.md
2. data-collection-agent: sources.md의 PDFs 다운로드 → manifest.md
3. data-organizer-agent: 
   - research-notes.md 읽음 → outline.md 작성 (20 slides: Title, Agenda, Trends×5, Data×3, Outlook, Q&A)
   - design-brief.md: "Executive, Strategic, McKinsey-style simplicity"
   - Gap 감지 → research-agent에 Task: "recent case studies" 추가 검색
4. presentation-design: design-brief.md + design-archetypes.md → McKinsey 스타일 선택
   - Navy #1A2B4C + Cobalt accent, Pretendard/Noto Sans KR, Grid layout, "Exhibit" framing
5. pptx: outline.md 슬라이드별로 실행
   - 차트/이미지 삽입, McKinsey 스타일 적용
   - 최종: AI_Strategy_Trends_Executive_Summary_20260610.pptx

↓

사용자: 완성된 PPT 다운로드, 세밀한 조정 (선택) 후 프레젠테이션
```

---

## 🚀 Quick Start for New Session

1. **프로젝트 폴더 준비**: `projects/<new-slug>/00_brief.md` 작성
2. **research-agent 호출**: WebSearch (PDF-first) → `01_research/` 생성
3. **data-collection-agent 호출**: sources.md 기반 다운로드 → `02_assets/` 생성
4. **data-organizer-agent 호출**: 종합 정리 → `03_content-plan/` 생성
5. **presentation-design 호출**: 디자인 결정 → design-brief.md 업데이트
6. **pptx 호출**: 최종 PPT 생성 → `04_output/<slug>.pptx`

---

*시각(時刻)에 존재하고, 시간(時間)에 소멸한다.*  
*Exists in the Moment, Vanishes in Time.*
