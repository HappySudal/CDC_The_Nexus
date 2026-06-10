---
name: presentation-design
description: Use when choosing the visual identity and design system for a presentation deck — palette, typography, layout templates, and signature element — before or during pptx creation. Selects a visual concept from references/design-archetypes.md (inspired by global research firms like McKinsey/BCG/Bain or ad agencies like Pentagram/Ogilvy/IDEO) that fits the topic and audience. Pairs with the pptx skill for execution.
license: Adapted from Anthropic's frontend-design skill. Complete attribution in LICENSE.txt
---

# Presentation Design

Approach this as the design lead for a consulting or creative agency known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, layout, and signature elements that are specific to this presentation's topic and audience.

## Ground it in the Subject

Before designing, read the **design-brief.md** and **outline.md** produced by the data-organizer-agent. Understand:
- What is the topic and core narrative?
- Who is the audience (executives, creatives, technologists, etc.)?
- What tone is required (formal, bold, innovative, trustworthy, etc.)?

Name one concrete archetype from `references/design-archetypes.md` that best fits this brief. Or, if the brief is between two styles, justify a thoughtful blend of two archetypes. The subject's own world—its industry conventions, visual languages used by similar presentations, and the audience's expectations—is where distinctive choices come from.

If no single archetype is a perfect fit, **do not** default to a generic blue corporate template or a plain white PowerPoint deck. Instead, articulate which aspects of two archetypes you're borrowing and why.

## Design Principles

### Token System for Presentations

Build a compact **design system** with four named components:

**1. Color Palette (4–6 named hex values)**
- Pick the palette from your chosen archetype in `design-archetypes.md`
- Name each color: e.g., "Navy Primary: #1A2B4C, White Base: #FFFFFF, Cobalt Accent: #2E5BFF, Light Gray: #F5F5F5"
- Assign a dominance strategy: one color should appear 60-70% of the time (slides, backgrounds, structural elements), 1-2 supporting tones (section dividers, secondary content), one sharp accent (headlines, key data callouts, emphasis)
- Do not give all colors equal visual weight

**2. Typography (header/body/data-label pairing) | 타이포그래피**
- Pick typefaces that actually render in PowerPoint and Google Slides (avoid web-only fonts)
- PowerPoint와 Google Slides에서 렌더링되는 폰트 선택 (웹 전용 폰트 피하기)
- Pair a **display face** (header, slide titles) with a **body face** (supporting text, descriptions) and optionally a **data/utility face** (chart labels, captions, fine print)
- **제목 폰트** (Pretendard)와 **본문 폰트** (Noto Sans KR Medium) 조합 사용
- Set intentional scale: titles 36-44pt, headers 20-24pt, body 14-16pt
- 폰트 크기: 제목 36-44pt, 섹션 헤더 20-24pt, 본문 14-16pt
- **Standard pairing | 표준 조합**: Pretendard for all titles, Noto Sans KR Medium for all body text and labels
- **표준 조합**: 제목은 Pretendard, 본문/라벨은 Noto Sans KR Medium

**3. Layout Templates (reusable slide grids)**
- Define 3-4 core layout patterns you'll vary across all slides (don't repeat the exact same layout):
  - Two-column (text left, visual right)
  - Icon + text rows (small icon in colored circle, bold header, description)
  - 2x2 or 2x3 grid (content blocks with visual hierarchy)
  - Half-bleed image (full-height image on left or right, text overlay on other side)
- Specify margins (e.g., 0.5" minimum), spacing (0.3-0.5" between blocks), and recurring elements (header bars, footer information)
- State which layout templates are suited to which content types (e.g., "Use two-column for data + insight, grid for case studies")

**4. Signature Element (one memorable, repeated motif)**
- Pick a single visual element tied to your chosen archetype that will repeat across every slide:
  - Large oversized stat callouts (McKinsey style)
  - A colored geometric shape (Bain style)
  - A thin structural rule or network motif (Deloitte / tech-forward style)
  - A hand-drawn annotation or icon (IDEO style)
- This element should feel intentional, not decorative, and should reinforce the brand/tone of the presentation

### Grounding in Context, Not Defaults

**AI-generated decks cluster around three looks:**
1. **Generic blue corporate** — navy background, centered titles, bullet lists, beige accents (looks like any corporate intranet)
2. **Default PowerPoint** — white background, Arial/Calibri, standard bullet hierarchy, no visual variety
3. **Stock photo + gradient title slides** — oversized hero images on title slides, serif typeface with script accents, often trendy but trendy-in-a-generic-way

Avoid all three unless your **design-brief explicitly asks for one of them.** Where the brief is open-ended, use `references/design-archetypes.md` to make a distinctive choice. Your job is to ensure the presentation's visual system feels designed *for this topic and audience*, not borrowed from a template gallery.

### Restraint and Self-Critique

**Spend your boldness in one place.** Let your signature element be the one memorable thing; keep everything around it quiet and disciplined. Cut any decoration that does not serve the brief or the content. A restrained palette with one bold accent color works harder than a multicolor explosion.

**Build to a quality floor without announcing it:**
- Sufficient contrast between text and backgrounds (minimum WCAG AA standard: 4.5:1 for body text)
- Consistent spacing and alignment across all slides (use the layout templates)
- Responsive thinking: slides should work on both 16:9 widescreen and 4:3 aspect ratios if the client needs both
- Slide deck structure: title, navigation/agenda, numbered content sections, conclusion, sources

**Critique your own work:**
- Once you've drafted the design system, review it against the brief: Does this system feel like it was designed for *this topic*, or could you drop it into any other presentation and it would still work?
- If a color, font choice, or layout template could easily swap into a completely different presentation and still "work," revise that choice—it's not distinctive enough.
- Take a step back: Are you using the signature element consistently? Is the palette actually reducing to the intended dominance (60% primary, 20% secondary, 20% accent)?

## Process: Two-Pass Design

**Pass 1: Brainstorm**
- Read the brief and outline carefully
- Pick (or justify blending) one or two archetypes from `design-archetypes.md`
- Sketch the token system: colors, type pairing, layout patterns, signature element
- Document this in a working note or outline

**Pass 2: Critique & Finalize**
- Review your design system against the brief: Is this specific to this presentation, or generic?
- Check the palette against the archetype—are you following it, or deviating? If deviating, articulate why.
- Verify typography choices will render in PowerPoint
- Test the layout templates: can you apply them consistently to 3-4 different slide types (title, data, narrative, conclusion)?
- If something reads like a default choice (e.g., "blue because it's trustworthy"), revise it or justify it explicitly in relation to the brief

**Pass 3: Record & Hand Off**
Once satisfied, record the final design system in one of two ways:

**Option A: Append to design-brief.md**
```markdown
## Chosen Design System

**Visual Archetype**: [Archetype Name] — [reason it fits the brief]

**Color Palette**:
- Primary: #XXXXXX (Navy, 60% coverage)
- Secondary: #XXXXXX (Light Gray, 20% coverage)
- Accent: #XXXXXX (Cobalt Blue, 20% coverage)

**Typography**:
- Headers: Georgia Bold (44pt titles, 20pt section headers)
- Body: Calibri Regular (14pt base, 12pt fine print)
- Data/Utility: Consolas (chart labels, captions)

**Layout Templates**:
1. Two-column: Text left (50%), visual right (50%), 0.5" margins
2. Grid: 2x2 content blocks with 0.3" gutters
3. Half-bleed: Full-height image + text overlay
4. Hero: Headline + single stat call-out

**Signature Element**:
Large oversized stat callouts (60-72pt number + 14pt label) appearing on every data slide

**Rationale**:
This system reflects [Archetype Name]'s emphasis on [what that archetype stands for]. The navy grounds the executive tone, cobalt accent draws eyes to key metrics, and the large stat callouts reinforce data-first narrative without sacrificing clarity.
```

**Option B: Create a separate design-system.md**
If the design system is substantial (e.g., multiple color variations, detailed component guidelines), create a new file `03_content-plan/design-system.md` with the full specification.

## Hand-Off to PPTX Skill

Once you've finalized the design system, the **pptx skill** will read:
- Your chosen palette and typography from design-brief.md (or design-system.md)
- The layout templates you defined
- The signature element(s) to repeat

The pptx skill will apply these consistently when building the actual slides via `pptxgenjs.md` (building from scratch) or `editing.md` (using a template). You don't need to generate any PPTX yourself—your job is to make the aesthetic and strategic decisions; the pptx skill handles the mechanics.

## More on Copy & Content

Words in a presentation serve one purpose: to help the audience understand and remember. As the design lead, you care about how words are presented (font size, weight, placement, hierarchy) more than writing the words themselves—the organizer-agent has done that. But ensure the design system you choose will support the copy effectively:

- If headlines are often one or two words, your display typeface can be bold and experimental
- If body text is dense (multi-line paragraphs), choose a highly legible body face and generous line-spacing
- Large stat callouts need extra-legible fonts and strong contrast with the background
- Labels on charts or diagrams should be sized and colored to read clearly at presentation distance (typically 14-18pt minimum)

## Avoid (Common Presentation Design Mistakes)

- **Don't repeat the exact same layout** — if slide 3 is two-column, don't make slide 4 two-column in the same way; vary the pattern
- **Don't center body text** — left-align paragraphs and lists; only center titles and key callouts
- **Don't default to blue** — pick colors that reflect the specific topic and audience
- **Don't center all titles** — try left-aligned or full-bleed placement where it strengthens the layout
- **Don't create text-only slides** — every slide needs a visual element (chart, image, icon, shape) to maintain engagement and break up walls of text
- **Don't low-contrast text** — always test contrast ratios; avoid light text on light backgrounds or dark text on dark backgrounds
- **Don't use decorative lines under titles** — this is a hallmark of AI-generated slides; use whitespace, background color, or the signature element instead
- **Don't commit fully to one layout if it doesn't serve the content** — restraint is good, but variation is essential
- **Don't assume "professional" means "boring"** — even the most formal executive decks can have a visual signature that's memorable and intentional

## Final Checkpoint | 최종 확인 사항

Before declaring the design system complete, ask yourself:
1. **Is this specific? | 이것이 구체적인가?** If I showed this palette, type pairing, and layout templates to a peer, could they identify what topic/audience this was designed for?
2. **Is it defensible? | 이것을 정당화할 수 있는가?** Can I articulate *why* each choice fits the brief, or am I defaulting to habit?
3. **Is it sustainable? | 이것을 유지할 수 있는가?** Can I apply these four components (color, type, layout, signature) consistently across 15+ slides without running out of ideas or falling into repetition?

If you answer "yes" to all three, the design system is ready for the pptx skill to execute.

---

## Resources | 참고자료

**디자인 영감과 베스트 프랙티스 학습:**  
See `references/pptx-resources.md` for:
- 무료 PowerPoint 템플릿 사이트
- 디자인 영감 소스
- 단계별 활용 방법
- 아키텍처별 참고 사이트 추천

---

*시각(時刻)에 존재하고, 시간(時間)에 소멸한다.*
*Exists in the Moment, Vanishes in Time.*
