# PPT Automation Agent Team — Project Documentation

## Overview

The **PPT Automation Agent Team** is a coordinated system of three Claude Code subagents and two skills that work together to research, organize, design, and generate professional presentations.

**Workflow**: Research topic → Collect assets → Organize content → Design visual system → Build and QA the final PPTX.

---

## Workspace Layout

All projects follow a strict folder structure so agents can reliably hand off work to each other via fixed-name files.

```
PPT_Team_Agent\
├── .claude\
│   ├── agents\                     # Three subagents (each is a .md file)
│   │   ├── research-agent.md
│   │   ├── data-collection-agent.md
│   │   └── data-organizer-agent.md
│   └── skills\                     # Two skills
│       ├── presentation-design\
│       │   ├── SKILL.md            # Design philosophy & archetype selector
│       │   ├── LICENSE.txt         # Attribution (from frontend-design)
│       │   └── references\
│       │       └── design-archetypes.md  # 8 global design concepts
│       └── pptx\                   # PowerPoint creation & manipulation
│           ├── SKILL.md, editing.md, pptxgenjs.md, LICENSE.txt
│           └── scripts\            # Python utilities (not fully vendored yet)
│
├── projects\                       # Per-presentation working folders
│   └── <project-slug>\
│       ├── 00_brief.md             # Topic, audience, goal, slide count
│       ├── 01_research\
│       │   ├── research-notes.md   # Research Agent output: findings by theme
│       │   └── sources.md          # Research Agent output: source list w/ citations
│       ├── 02_assets\
│       │   ├── pdfs\ images\ data\ # Downloaded files by type
│       │   └── manifest.md         # Data Collection Agent output: download status
│       ├── 03_content-plan\
│       │   ├── outline.md          # Data Organizer output: slide-by-slide plan
│       │   └── design-brief.md     # Data Organizer output: visual direction + gaps
│       └── 04_output\
│           └── <slug>.pptx         # Final generated presentation
│
└── CLAUDE.md                       # This file
```

**File Contracts (Agents read/write these):**
- `sources.md`: Table with `ID | Title | URL | Type | Priority | Notes` — Research Agent writes, Data Collection Agent reads
- `manifest.md`: Table with `Source ID | Local Path | URL | Type | Status | Notes` — Data Collection Agent writes, Data Organizer Agent reads
- `research-notes.md` + `sources.md` + `manifest.md` → `outline.md` + `design-brief.md` — Data Organizer Agent reads three, writes two

---

## Agents

### 1. **research-agent** (.claude/agents/research-agent.md)
**When to invoke:** At the start of a new presentation project, or whenever the Data Organizer Agent identifies a research gap.

**Inputs:** A brief and optionally a project folder path.

**Process:** Runs PDF-focused web searches (targeting industry reports, whitepapers, analyst studies), skims results with `WebFetch`, and synthesizes findings into themed sections.

**Outputs:** 
- `01_research/research-notes.md` — Themed findings with [S1], [S2], ... citation markers
- `01_research/sources.md` — Markdown table of all sources (ID | Title | URL | Type | Priority | Notes)

---

### 2. **data-collection-agent** (.claude/agents/data-collection-agent.md)
**When to invoke:** After Research Agent produces `sources.md`, or when Data Organizer Agent identifies missing assets.

**Inputs:** `01_research/sources.md` and optionally an existing `02_assets/manifest.md` to avoid re-downloading.

**Process:** Downloads PDFs, images, datasets from each source URL into appropriately labeled subfolders (pdfs/, images/, data/). Handles failures gracefully (404, paywall, redirect) without stopping the entire run.

**Outputs:**
- `02_assets/pdfs/`, `02_assets/images/`, `02_assets/data/` — Downloaded files named `S<ID>_<title>.<ext>`
- `02_assets/manifest.md` — Markdown table tracking download status per source (Source ID | Local Path | URL | Type | Status | Notes)

---

### 3. **data-organizer-agent** (.claude/agents/data-organizer-agent.md)
**When to invoke:** Once Research and Collection agents have completed their work, or when the user asks to "outline" or "plan" the presentation.

**Inputs:** All three upstream files (`research-notes.md`, `sources.md`, `manifest.md`) plus the optional `00_brief.md`.

**Process:** Reads all inputs, determines presentation structure (~title, agenda, 3-6 content sections, conclusion, sources), and builds a **slide-by-slide outline**. Identifies gaps (missing data or assets) and **delegates back** to Research Agent and Data Collection Agent via `Task` (up to 2 follow-up rounds per agent) to fill gaps. Then writes the final content and design direction.

**Outputs:**
- `03_content-plan/outline.md` — Complete slide-by-slide plan (title | key message | content | suggested visual | notes | data sources) for each slide
- `03_content-plan/design-brief.md` — Design direction including topic, audience, tone, recommended visual archetype(s) from references/design-archetypes.md, and any known gaps

---

## Skills

### 1. **presentation-design** (.claude/skills/presentation-design/)
| 1️⃣ **프레젠테이션 디자인 스킬 | Presentation Design Skill**

**When to invoke | 호출 시기:** When planning or executing the visual identity/design system for a deck (palette, typography, layout, signature element).

**Reads | 읽음:**
- `design-brief.md` and `outline.md` (produced by Data Organizer Agent)
- `references/design-archetypes.md` (8 curated design systems inspired by global research firms and ad agencies)
- `references/pptx-resources.md` (참고 사이트 및 영감 소스 | Reference sites for design inspiration)

**Process | 프로세스:** Selects the best-fit archetype (or thoughtfully blends two) from the reference guide, then documents the final design system: palette (4-6 named hex colors), typography (Pretendard + Noto Sans KR Medium), layout templates (3-4 core reusable patterns), and signature element (one memorable motif to repeat).

**Writes | 작성:** Design system details back into `design-brief.md` or a new `design-system.md`, which the pptx skill will read and apply.

**Key References | 주요 참고자료:**
- `references/design-archetypes.md` — 8 archetypes:
  - **Research-group style**: Global Insight (McKinsey), Structured Argument (BCG), Bold Minimal (Bain), Future Signals (Gartner/Deloitte)
  - **Ad-agency style**: Systemic Identity (Pentagram), Conversational Provocateur (Wieden+Kennedy), Classic Craft (Ogilvy), Connected Systems (R/GA · IDEO)
- `references/pptx-resources.md` — PowerPoint 템플릿 사이트, 색상 팔레트 영감, 디자인 참고 자료

---

### 2. **pptx** (.claude/skills/pptx/)
**When to invoke:** When building, editing, reading, or exporting a `.pptx` file.

**Reads:**
- `outline.md` and `design-brief.md` / `design-system.md` for content and visual direction
- Existing `.pptx` templates (if building from a template)

**Process:** Either creates slides from scratch using PptxGenJS (if no template exists) or unpacks/edits an existing template. Applies the design system (palette, typography, layout, signature) consistently across all slides. Runs an internal QA loop: converts to images, inspects visually for text overflow, alignment, contrast, and other issues; fixes problems; re-verifies until no new issues are found.

**Tools:**
- `python -m markitdown <file.pptx>` — extract text content
- `python scripts/thumbnail.py` — generate visual overview grid
- `python scripts/office/unpack.py` — unpack PPTX to raw XML for editing
- `pptxgenjs` — create new presentations from scratch (JavaScript)
- `soffice --convert-to pdf` + `pdftoppm` — convert to images for visual QA

**Outputs:** `04_output/<slug>.pptx` — final presentation

---

## Font Standards | 폰트 표준

모든 발표 자료는 다음 폰트를 표준으로 사용합니다 | Standard fonts for all presentations:

- **제목 | Title Font**: Pretendard (Bold, ExtraBold, SemiBold 등 무게 자유)
- **본문 | Body Font**: Noto Sans KR Medium
- **모든 아키텍처에 동일 적용** | Applied consistently across all design archetypes

**설치 필요 | Installation required:**
- Pretendard: https://www.pretendard.io/ (무료 | Free)
- Noto Sans KR: https://fonts.google.com/noto/specimen/Noto+Sans+KR (무료 | Free)

---

## Prerequisites & Dependencies

### Python Packages
```bash
pip install "markitdown[pptx]"   # Text extraction from PPTX files
pip install Pillow              # Image processing (used by thumbnail.py)
pip install lxml                # XML parsing (used by scripts/office/validators/)
```

### Node.js Package
```bash
npm install -g pptxgenjs        # PowerPoint creation library (JavaScript)
```

### System Tools
- **LibreOffice** (`soffice` command):
  ```bash
  winget install -e --id TheDocumentFoundation.LibreOffice
  ```
  Used for PDF conversion during visual QA.

- **Poppler** (`pdftoppm` command):
  ```bash
  winget search poppler
  # Find the correct package ID and install, e.g.:
  winget install poppler
  ```
  Used to rasterize PDF pages to images for visual inspection.

### Verification (run after installation)
```bash
python -m markitdown --help     # Should show markitdown usage
python -c "import PIL; print(PIL.__version__)"  # Should print PIL version
npm list -g pptxgenjs           # Should list installed pptxgenjs
soffice --version               # Should show LibreOffice version
pdftoppm -v                     # Should show Poppler version
```

---

## Typical Workflow

### Example: Create a Presentation on "AI Market Trends 2026"

1. **Set up the project:**
   - Create folder `projects/ai-trends-2026/`
   - Write `00_brief.md` describing topic, audience (VP Product, 50 execs), goal (make the case for AI investment), and slide count (12-15)

2. **Research phase:**
   ```
   Invoke: research-agent
   Input: "Research AI market trends for 2026, focus on market size, adoption drivers, competitive landscape"
   Output: research-notes.md (themed findings with [S1]...[S7] citations) + sources.md (7 PDF/HTML sources)
   ```

3. **Data collection phase:**
   ```
   Invoke: data-collection-agent
   Input: (reads sources.md automatically)
   Output: Downloads S1–S7 into pdfs/ & images/, writes manifest.md with status
   ```

4. **Organization phase:**
   ```
   Invoke: data-organizer-agent
   Input: (reads research-notes.md, sources.md, manifest.md)
   Output: outline.md (Slides 1-15 detailed) + design-brief.md (recommends "Global Insight" style for executive tone)
   May delegate back to research-agent for additional data on "adoption drivers" if gap found
   ```

5. **Design phase:**
   ```
   When user says: "Design the deck with a professional but distinctive look"
   Invoke: presentation-design skill (auto-triggered)
   Reads: design-brief.md (recommends Global Insight), outline.md (data-heavy content)
   Writes: Chosen design system → navy/cobalt palette, Helvetica/Arial typography, left-grid layout, oversized stat callouts → appended to design-brief.md
   ```

6. **Build & QA phase:**
   ```
   When user says: "Build the presentation"
   Invoke: pptx skill (auto-triggered)
   Reads: outline.md (slide-by-slide content), design-brief.md (palette, typography, layout, signature)
   Builds: pptx with PptxGenJS, applies design system, converts to PDF, inspects visually
   Outputs: 04_output/ai-trends-2026.pptx (ready to present)
   ```

---

## File Naming Conventions

- **Project folders:** kebab-case, e.g., `ai-market-trends-2026`, `enterprise-strategy-q3-2026`
- **Downloaded files:** `S<id>_<title>.<ext>`, e.g., `S1_mckinsey-ai-report-2026.pdf`, `S3_competitor-logos.png`
- **Markdown files:** lowercase with hyphens, e.g., `research-notes.md`, `design-brief.md`, `outline.md`

---

## Common Tasks

### Add a new project
```bash
mkdir projects/<slug>
echo "# <Topic>\n- Audience: ...\n- Goal: ..." > projects/<slug>/00_brief.md
```

### Re-run research after organizing (gap-filling)
```
Invoke data-organizer-agent → it finds gaps → it invokes research-agent via Task
Research-agent appends new findings to research-notes.md with new [S6], [S7], ... IDs
Data-organizer-agent re-reads and incorporates into outline
```

### Inspect downloaded assets
```bash
ls -la projects/<slug>/02_assets/pdfs/
file projects/<slug>/02_assets/pdfs/S1_*.pdf
```

### View the slide outline before building
```bash
cat projects/<slug>/03_content-plan/outline.md
```

---

## Architecture Notes

- **Agents are loosely coupled via files.** Each agent reads the previous agent's outputs by fixed file names. This makes the system resumable and debuggable.
- **No centralized state.** All state lives in project folders; no database or external system.
- **Delegation via Task.** Data Organizer Agent can invoke Research or Collection agents again using Claude Code's `Task` tool when gaps are detected, up to 2 follow-up rounds per agent.
- **Skills auto-trigger.** When the user mentions "design" or "build", Claude Code's skill system auto-selects the appropriate skill based on the `description` field in SKILL.md.
- **Design is separate from execution.** The presentation-design skill is advisory (chooses a visual direction). The pptx skill executes it (builds the actual slides). This separation allows the design system to be reviewed and refined before slide-building starts.

---

## Future Enhancements

- **Python scripts directory for pptx skill:** Currently, core pptx files (SKILL.md, editing.md, pptxgenjs.md) are in place, but the Python utility scripts (scripts/thumbnail.py, scripts/office/*) are not yet fully vendored. These can be manually added or re-vendored when deeper PPTX manipulation is needed.
- **Template library:** Pre-built PPTX templates for different archetype styles could be created and stored under `.claude/templates/`.
- **QA subagent:** A dedicated skill or agent for visual QA and polish could be created to further automate the verification loop.

---

**Last Updated:** 2026-06-10

*시각(時刻)에 존재하고, 시간(時間)에 소멸한다.*
*Exists in the Moment, Vanishes in Time.*
