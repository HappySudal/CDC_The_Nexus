# CLAUDE.md | SynologyDrive Root Context

**Last Updated**: 2026-05-17 | **Status**: Active Governance + Development

This file provides Claude Code with essential guidance for working across the SynologyDrive ecosystem.

---

## 🚀 Quick Start (Hub Navigation)

### For CDC Platform Development (Next.js 14)
**CDC is a child node of this Root hub.** For CDC-specific commands, setup, and architecture, see:
→ `02_Creative Destruction Council/CLAUDE.md`

### For Root-Level System Management
```bash
python 01_Control_Tower\24_Scripts\99_SYSTEM_AUDIT.py  # Full system audit
python 01_Control_Tower\24_Scripts\obsidian_vault_sync.py  # Sync vault
powershell -ExecutionPolicy Bypass -File 01_Control_Tower\24_Scripts\Send-CDCNotification.ps1 -Message "your message"
```

### CDC Npm Commands Reference
For complete npm command reference, see CDC's own CLAUDE.md:
→ `02_Creative Destruction Council/CLAUDE.md` — contains full npm commands table

---

## 📁 Directory Structure (Hub-Spoke Architecture)

**Root Level = Central HUB** (defines governance, infrastructure, standards for entire ecosystem)

```
SynologyDrive/
│
├── 🔴 TIER 0 — Sacred Grounds (Chairman only, no access)
│   ├── 00_philosophy/            [⛔ Philosophy core]
│   ├── 10_Asset_자료/            [⛔ Personal assets]
│   └── Dev_Model/                [⛔ AI models]
│
├── 🏛️ TIER 0 — System Infrastructure (Chairman + Leo Custodian)
│   └── 01_Control_Tower/
│       ├── 01_MASTER_CONSTITUTION.md [Highest governance authority]
│       ├── 24_Scripts/           [System audit, sync, notification scripts]
│       └── 99_Violations/        [Constitution violation log]
│
├── 🧭 CHILD NODES — All Reference Root HUB Inbound Only
│   ├── 02_Creative Destruction Council/
│   │   └── CLAUDE.md             [← References Root for governance]
│   │
│   ├── 20_Projects/
│   │   └── */CLAUDE.md           [← References Root for governance]
│   │
│   └── [Future nodes...]         [← All point to Root, never vice-versa]
│
├── 📊 Cross-Cutting Artifacts
│   ├── 05_Reports/               [Daily/Project/CDC reports]
│   └── .claude/
│       ├── rules/                [제0조~제7조 governance rules]
│       └── projects/MEMORY.md    [Persistent memory index]
```

**Hub-Spoke Rule (제2조)**:
- **Root CLAUDE.md** (this file) = central HUB → governs ALL child nodes
- **Child CLAUDE.md** (CDC, Projects, etc.) = child nodes → reference Root inbound only
- ✅ Unidirectional: Child can say "See Root for rules" but Root doesn't contain CDC-specific commands
- ❌ NO circular references: Root Quick Start does NOT repeat CDC npm table

**Access Zones (제6조)**:
- **TIER 0 Sacred** (`00_philosophy/`, `10_Asset_자료/`, `Dev_Model/`): Off-limits without explicit Chairman directive
- **TIER 0 System** (`01_Control_Tower/`): System governance core (Chairman + Leo)

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|:---:|:---|:---|
| **Framework** | Next.js 14 + React 18 | App Router, SSR capable |
| **Language** | TypeScript 5 | Strict mode (no `any`) |
| **Styling** | Tailwind CSS 3 | With Tailwind Merge |
| **UI/Animation** | Lucide React + Framer Motion | Icons & smooth transitions |
| **AI** | Google Generative AI SDK | Claude/Gemini integration |
| **Testing** | Playwright | E2E automation |
| **Infrastructure** | INFRA_CONFIG.json | Port registry (3333 = CDC) |

---

## 🏗️ Critical Architecture Patterns

### Path Aliases (Must Use `@/`)
```typescript
// ✅ Correct
import { LanguageContext } from '@/context/LanguageContext';
import { Dashboard } from '@/components/Dashboard';

// ❌ Wrong (relative paths)
import { LanguageContext } from '../../../context/LanguageContext';
```

### State Management
- **Global**: `LanguageContext` for language switching across entire platform
- **Local**: `useState` for component-scoped state
- **Server**: Next.js server components (default) or API routes

### Infrastructure Registry (INFRA_CONFIG.json)
- **3333**: CDC Dashboard (primary)
- **4000**: OpenClaude API
- **5000**: TwinBrain ETL
- **6000**: NAS Admin

---

## 📋 Governance Rules (Essential)

**See detailed rules in `.claude/rules/`:**

| File | Rule | Core Concept |
|:---:|:---|:---|
| `rule_00_sovereignty.md` | **SOVEREIGN PROTOCOL** | 5-step approval flow (STEP 1→2→3) |
| `rule_03_execution.md` | **Zero-Defect Execution** | 4-phase lifecycle with Phase 3 self-validation |
| `rule_06_governance.md` | **Tier 0 Protection** | 3 off-limit zones (philosophy/assets/models) |
| `coding-style.md` | **Style & Encoding** | UTF-8-BOM for .ps1, ASCII diagrams (no Mermaid), file footers |

**TL;DR**: Get approval (STEP 2→3) → Execute → Self-validate (Phase 3) → Report in 5-column table.

---

## ⚠️ Common Issues & Solutions

### Issue #1: "Module not found" Errors
**Symptom**: `Cannot find '@/components/MyComponent'`  
**Solution**: Check path alias in `tsconfig.json` and file extension. Verify file exists at `src/components/MyComponent.tsx`.

### Issue #2: Lint Errors Block Commit
**Symptom**: `npm run build` fails with ESLint errors  
**Solution**: Run `npm run lint --fix` to auto-fix most issues. For remaining errors, review and manually fix.

### Issue #3: TypeScript Strict Mode Violations
**Symptom**: Type `any` is not assignable to type `never`  
**Solution**: Use explicit types (`interface`, `type`) instead of `any`. Never circumvent strict mode.

### Issue #4: Development Server Won't Start
**Symptom**: Port 3333 already in use  
**Solution**: 
```bash
# Check what's using port 3333
lsof -i :3333  # macOS/Linux
netstat -ano | findstr :3333  # Windows

# Kill the process or change port in .env.local
NEXT_PUBLIC_PORT=3334
```

### Issue #5: Hot Reload Not Working
**Symptom**: Changes don't appear after `npm run dev`  
**Solution**: 
1. Stop dev server (Ctrl+C)
2. Clear `.next/` folder: `rm -rf .next`
3. Restart: `npm run dev`
4. Hard refresh browser (Ctrl+Shift+Delete)

### Issue #6: Cannot Access Tier 0 Folders
**Symptom**: "Permission denied" for 01_Control_Tower/  
**Solution**: You don't have access. These are system-only directories. If you need access, get explicit authorization from Chairman.

---

## 📊 Session Startup Checklist

**Every session, in order:**

1. ✅ **Read constitution**: `.claude/rules/rule_00_sovereignty.md` (understand SOVEREIGN PROTOCOL)
2. ✅ **Read daily report**: `05_Reports/LATEST_REPORT.md` (points to current day's DailyReport_YYYYMMDD_*.md)
3. ✅ **Brief Chairman**: Report in 5-column table:
   - **구분**: Yesterday's completed / Today's tasks
   - **변경전**: Previous state
   - **변경후**: Current state
   - **잔여업무**: Remaining work
   - **비고**: Notes

**Skip this = immediate re-audit. Non-negotiable.**

---

## 🎯 Code Quality Checklist (Before Commit)

```bash
# 1. Auto-fix linting issues
npm run lint --fix

# 2. Verify TypeScript (strict mode)
npm run type-check

# 3. Test build locally
npm run build

# 4. Verify on http://localhost:3333
npm run dev
# → Test the feature manually

# 5. Check for cross-system impact (제6조)
grep -r "ComponentName" --include="*.tsx" src/
grep -r "function_name" --include="*.ts" src/lib/
# → Ensure all references are updated

# 6. Verify file footer added (제2-1조)
# All new/modified files must end with:
# **"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."**
# **"Exists in the Moment, Vanishes in Time."**
```

---

## 📚 Key Files Quick Reference

| File | Purpose | When to Read |
|:---:|:---|:---|
| `.claude/rules/rule_00_sovereignty.md` | SOVEREIGN PROTOCOL (5-step approval) | Session start, before major work |
| `.claude/rules/rule_03_execution.md` | Zero-Defect Execution (Phase 1-4) | Before implementation |
| `.claude/rules/coding-style.md` | File footers, encoding, diagram rules | When creating files |
| `.claude/rules/rule_06_governance.md` | Tier 0 protection, cross-system audit | Before accessing folders |
| `INFRA_CONFIG.json` | Port mappings & service definitions | When adding new services |
| `05_Reports/LATEST_REPORT.md` | Pointer to current daily report | Every session start |
| `01_Control_Tower/01_MASTER_CONSTITUTION.md` | Highest authority document | Session start |

---

## ✅ Do's and ❌ Don'ts (Quick Reference)

| ✅ DO | ❌ DON'T |
|:---|:---|
| Use `@/` path aliases | Use relative paths like `../../../` |
| Run `npm run lint --fix` before commit | Commit with ESLint violations |
| Add file footers to all new files | Omit the bilingual slogan |
| Test on http://localhost:3333 before reporting | Skip local testing |
| Follow existing component patterns | Invent new patterns without discussion |
| Use TypeScript explicit types | Use `any` type |
| Verify Phase 3 self-validation | Skip self-validation & report directly |
| Check cross-system impact (grep) | Modify one file and hope nothing breaks |

---

## 🚨 Never Do These (Fatal Errors - 제4조)

1. **Report black-box results** without proof
2. **Evade errors emotionally** instead of analyzing root cause
3. **Lose context of rules** mid-session (Rule Checkpoint catches this)
4. **Hallucinate facts** or fabricate documentation
5. **Accept broken directives** without pushing back
6. **Lazy execution** with placeholders like "...중략..."
7. **Blind retry loops** without analyzing error logs
8. **Skip Phase 3 self-validation** and report directly
9. **Whack-a-mole debugging** (fix symptoms, not root cause)
10. **Violate vocabulary or format rules**

---

## 🔗 Antithesis Check (Before Finalizing)

Validate your analysis from 3 angles:

1. **Gemini 1.5**: Any logical gaps or missed context?
2. **Direct critique**: Am I avoiding uncomfortable truths?
3. **Fact check**: Is this approach current/optimal?

**Collision → Synthesis happens BEFORE reporting.**

---

## 📊 Cross-System Impact Audit (제6조)

After **any file modification**, audit for unintended impacts:

```bash
# Example: If you rename a function
grep -r "old_function_name" --include="*.ts" --include="*.tsx" src/
grep -r "old_function_name" --include="*.js" --include="*.jsx" .

# Update ALL references. Partial fixes = Fatal Error #9.
```

---

**Framework**: Next.js 14 + React 18 + TypeScript 5 (Strict)  
**Port**: 3333  
**Quality Standard**: 20/20 ✅

**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**
