# PJT_CDC_The_Nexus CLAUDE.md Enhancement Report
**Date:** 2026-05-27  
**Status:** Architecture Analysis Complete | Implementation Ready  
**Prepared for:** Chairman Sudal  

---

## Executive Summary

The existing PJT_CDC_The_Nexus CLAUDE.md provides comprehensive governance-level documentation aligned with the CDC SOVEREIGN PROTOCOL. However, critical architectural documentation gaps prevent efficient developer onboarding and create ambiguity around Electron process model, IPC communication patterns, and service layer integration.

This report identifies 10 specific gaps and proposes 9 targeted enhancement sections to transform CLAUDE.md into a complete architectural reference suitable for both governance and technical development workflows.

---

## Process Architecture Overview

### Electron 3-Process Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │  MAIN PROCESS            │  │  RENDERER PROCESS        │        │
│  │  (Node.js + Electron)    │  │  (Chromium + Vue 3)      │        │
│  │                          │  │                          │        │
│  │ • Window management      │  │ • Vue components (16)    │        │
│  │ • File system access     │  │ • DOM rendering          │        │
│  │ • Ollama inference       │  │ • User interactions      │        │
│  │ • Discord WebSocket      │  │ • State management       │        │
│  │ • Knowledge graphs       │  │ • Event listeners        │        │
│  │ • Config storage         │  │                          │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│            ▲                                 ▲                      │
│            │         IPC BRIDGE             │                      │
│            └─────────────────────────────────┘                      │
│         (ipc-handlers.js + ipc-channels.js)                         │
│                                                                     │
│  ┌──────────────────────────┐                                      │
│  │  PRELOAD CONTEXT         │                                      │
│  │  (Context Isolation)     │                                      │
│  │                          │                                      │
│  │ • Validates IPC calls    │                                      │
│  │ • Restricts API access   │                                      │
│  │ • Security boundary      │                                      │
│  └──────────────────────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory & Responsibility Matrix

### 16 Vue Components by Tier

| TIER | COMPONENTS (Count) | PURPOSE |
|:---|:---|:---|
| **Knowledge Graph** (1) | KnowledgeGraphVisualizer.vue | Cytoscape.js rendering, graph layout management |
| **Dashboard** (4) | AgentDashboard, StatusDashboard, RealTimeDashboard, AnalyticsDashboard | System state visualization, metrics display |
| **Configuration** (4) | ConfigPanel, OllamaModelDownloader, DiscordSetupWizard, ConstitutionViewer | System settings, model management, governance |
| **Interaction** (4) | AgentCommandPanel, SearchInterface, TaskCreationForm, NotificationCenter | User input, command execution, feedback |
| **Monitoring** (2) | SystemHealthMonitor, LogViewer | Health tracking, log inspection |
| **Application** (1) | App.vue | Root orchestrator, component composition |

---

## Main Process Service Architecture

### 10 Electron Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                    IPC ROUTING LAYER                            │
│            (ipc-handlers.js + ipc-channels.js)                  │
└─────────────────────────────────────────────────────────────────┘
        │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼
    ┌────────┬──────────┬──────────┬──────────┬──────────┐
    │ Ollama │ Discord  │Knowledge │  Config  │ LLM      │
    │ Manager│ Bridge   │ Graph    │ Manager  │ Agent    │
    │        │ (Async   │          │          │          │
    │        │ WS)      │          │          │          │
    └────────┴──────────┴──────────┴──────────┴──────────┘
```

**Service Modules:**
- `main.js` — Window lifecycle, Electron initialization, preload injection
- `preload.js` — Context isolation, security boundary, safe API exposure
- `ipc-handlers.js` — Message routing, handler invocation, error propagation
- `ipc-channels.js` — Channel definitions, message type contracts
- `ollama-manager.js` — Model download, cache management, inference execution
- `llm-agent.js` — LLM inference wrapper, prompt composition
- `knowledge-graph.js` — Graph storage (sqlite), CRUD, Cytoscape synchronization
- `config-manager.js` — Persistent storage, hot-reload, schema validation
- `discord-bridge.js` — Bot initialization, OAuth flow, gateway connection
- `discord-ws-bridge.js` — WebSocket management, event streaming

---

## Identified Documentation Gaps (Priority Order)

| # | Gap Description | Severity | Est. Lines |
|:---:|:---|:---:|:---:|
| 1 | No process architecture diagram showing 3-process model and IPC boundary | CRITICAL | 40 (ASCII) |
| 2 | No IPC channel reference table with params/returns | CRITICAL | 30 (table) |
| 3 | No component-to-service mapping showing which Vue components use which IPC channels | HIGH | 50 (diagram) |
| 4 | No Cytoscape.js integration patterns and event handlers | HIGH | 60 (guide) |
| 5 | No Discord WebSocket integration workflow | HIGH | 50 (workflow) |
| 6 | No Ollama lifecycle documentation (DL → Cache → Inference) | MEDIUM | 60 (guide) |
| 7 | No single-component test execution examples | MEDIUM | 10 (examples) |
| 8 | No integration of folder-specific claude.md files | MEDIUM | 20 (links) |
| 9 | No data flow diagrams (Vue state ↔ IPC ↔ main process) | MEDIUM | 40 (ASCII) |
| 10 | No Electron DevTools/debugging guide | LOW | 30 (guide) |

---

## Recommended CLAUDE.md Enhancement Plan

### Phase 1: Critical Additions (80 lines)

1. **New Section: "🏗️ Architecture Overview"** (Location: After "프로젝트 개요")
   - ASCII process architecture diagram
   - IPC boundary visualization
   - Service module locations
   - 10,000-foot data flow view

2. **New Section: "📡 IPC Communication Guide"** (Location: After "🛠️ 개발 환경")
   - Complete channel reference table (15-20 channels)
   - Expected parameters per channel
   - Return types and error patterns
   - Rate limiting recommendations

### Phase 2: High-Priority Enhancements (150 lines)

3. **Update "🛠️ 개발 환경 명령어"** section
   - Add: `npm run test -- ComponentName.test.ts` (single test)
   - Add: `npm run test -- --reporter=verbose`
   - Add: Port references and auto-reload behavior

4. **Update "📋 핵심 규칙"** section
   - Add "Electron-Specific Rules" subsection
   - ❌ No blocking operations in main process
   - ❌ No DOM access from main process
   - ❌ No large unchunked data via IPC

5. **New Section: "🎨 Component Integration Patterns"** (130 lines)
   - Cytoscape graph rendering lifecycle
   - Real-time dashboard update patterns
   - Form submission to llm-agent flow
   - Discord message streaming pattern

### Phase 3: Medium-Priority Enhancements (180 lines)

6. **New Section: "🧠 Service Layer Documentation"**
   - Ollama: DL → cache → inference workflow
   - Discord: OAuth → WebSocket → dispatch
   - Knowledge Graph: CRUD → layout → Cytoscape
   - Configuration: Persistent storage, hot-reload

7. **New Section: "🔍 Debugging & Development Tips"**
   - Enable Electron DevTools (F12)
   - IPC message logging setup
   - Remote Ollama connection
   - Discord test bot configuration
   - Cytoscape layout debugging

### Phase 4: Supporting Documentation (70 lines)

8. **New Section: "🧪 Testing Component Isolation"**
   - Single component test: `npm run test -- ComponentName.test.ts`
   - Mock Electron IPC in Vue tests
   - Async IPC.invoke testing patterns
   - Event emission verification

9. **New Section: "📚 Folder-Specific Documentation References"**
   - `src/claude.md` (Vue 3 Composition API patterns)
   - `electron/claude.md` (main process best practices)
   - `tests/claude.md` (Vitest strategy)
   - `docs/claude.md` (design decisions)

### Phase 5: Process Updates (20 lines)

10. **Update "🔄 작업 프로세스"** (SOVEREIGN PROTOCOL)
    - Clarify STEP 3: IPC testing procedures
    - Enhance STEP 4: DevTools/console validation
    - Refine STEP 5: Cross-process verification

---

## Implementation Summary

| Phase | Focus | Lines | Effort |
|:---:|:---|:---:|:---:|
| 1 | Critical architecture documentation | 80 | 1 hour |
| 2 | High-priority rules & patterns | 150 | 1.5 hours |
| 3 | Service layer & debugging | 180 | 2 hours |
| 4 | Testing & reference docs | 70 | 1 hour |
| 5 | Process updates | 20 | 0.5 hours |
| **TOTAL** | **Complete architectural coverage** | **~500** | **~6 hours** |

---

## Expected Outcomes After Enhancement

✅ **Developer Onboarding**: New developers can understand 3-process model within 1 hour  
✅ **IPC Debugging**: Complete reference table eliminates guesswork  
✅ **Service Integration**: Clear patterns for adding new components and services  
✅ **Testing Strategy**: Explicit examples for isolated component testing  
✅ **Governance Alignment**: SOVEREIGN PROTOCOL STEP 3-4 clarification for IPC validation  

---

## Notes & Recommendations

1. **File Organization**: Create `src/claude.md`, `electron/claude.md`, `tests/claude.md` as companions to root CLAUDE.md
2. **Version Control**: Tag enhancement commit as "docs(nexus): v0.4.0-architecture-complete"
3. **Periodic Review**: Update architecture diagrams when IPC channels are added
4. **Integration Testing**: Test all 9 enhancement sections against actual codebase before deployment

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**

---

*Report prepared by Claude Code | 2026-05-27*
