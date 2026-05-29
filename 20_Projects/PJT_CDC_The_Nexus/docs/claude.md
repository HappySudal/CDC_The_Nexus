# CLAUDE.md — docs/ (기술 문서)

> **The Nexus 기술 문서 작성 규범**
> 개발자/사용자 문서, API 문서, 아키텍처 설명

---

## 📁 문서 구조

```
docs/
├── README.md                   (프로젝트 개요)
├── ARCHITECTURE.md             (시스템 아키텍처)
├── API.md                      (IPC API 문서)
├── COMPONENTS.md               (컴포넌트 카탈로그)
├── SETUP.md                    (개발 환경 설정)
├── DEPLOYMENT.md               (배포 가이드)
├── TROUBLESHOOTING.md          (트러블슈팅)
└── guides/
    ├── adding-component.md     (컴포넌트 추가 가이드)
    ├── custom-graph.md         (그래프 커스터마이징)
    └── ipc-communication.md    (IPC 통신 가이드)
```

---

## 📝 문서 작성 규칙

### 1️⃣ Markdown 형식

**헤더 계층**:
```markdown
# 제목 (H1 - 파일 제목)
## 섹션 (H2)
### 소섹션 (H3)
#### 상세 항목 (H4)
```

**예시**:
```markdown
# ARCHITECTURE

## System Overview
### Component Diagram
#### Vue Components
```

### 2️⃣ 코드 블록 언어 명시

```markdown
\`\`\`js
// JavaScript 코드
const x = 1;
\`\`\`

\`\`\`bash
# Bash 명령어
npm run dev
\`\`\`

\`\`\`vue
<!-- Vue 컴포넌트 -->
<template>...</template>
\`\`\`
```

### 3️⃣ 표 사용

```markdown
| 항목 | 설명 | 예시 |
|:---|:---|:---|
| Props | 입력 데이터 | `modelValue: String` |
| Events | 발생 이벤트 | `@update:modelValue` |
```

### 4️⃣ 경고/주의 박스

```markdown
> **⚠️ 주의**: 이 부분은 위험합니다.

> **📌 참고**: 추가 정보입니다.

> **✅ 팁**: 좋은 습관입니다.
```

---

## 📚 문서 종류별 템플릿

### API 문서 (API.md)

```markdown
# IPC API Reference

## agent:execute

### 요청
\`\`\`js
await window.api.invoke('agent:execute', {
  command: 'list agents',
  timeout: 5000
})
\`\`\`

### 응답
\`\`\`json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Agent1", "status": "active" }
  ]
}
\`\`\`

### 에러 응답
\`\`\`json
{
  "success": false,
  "error": "Command execution timeout"
}
\`\`\`

### 설명
Agent 명령을 Main Process에서 실행합니다.

### 매개변수
- `command` (string): 실행할 명령어
- `timeout` (number, optional): 타임아웃 (ms). 기본값: 10000
```

### 컴포넌트 카탈로그 (COMPONENTS.md)

```markdown
# 컴포넌트 카탈로그

## AgentDashboard

### Props
- `agentId` (string, required): 에이전트 ID
- `isActive` (boolean, default: false): 활성화 여부

### Events
- `action`: 사용자 액션 발생
- `error`: 오류 발생

### 사용 예시
\`\`\`vue
<AgentDashboard
  :agentId="currentAgent.id"
  :isActive="true"
  @action="handleAction"
  @error="handleError"
/>
\`\`\`

### 위치
`src/components/AgentDashboard.vue`

### 테스트
`src/components/AgentDashboard.test.ts`
```

### 가이드 문서 (guides/*.md)

```markdown
# Adding a New Component

## Step 1: Create Vue File
\`\`\`bash
touch src/components/MyComponent.vue
\`\`\`

## Step 2: Write Component
[구현 방법 설명]

## Step 3: Write Tests
\`\`\`bash
touch src/components/MyComponent.test.ts
\`\`\`

## Step 4: Integrate
[통합 방법 설명]

## Common Pitfalls
- 상대 경로 사용 (대신 @/ 사용)
- Props 검증 누락
- 테스트 누락
```

---

## 🏗️ 아키텍처 문서

### 시스템 다이어그램 (ASCII)

```markdown
# Architecture

## System Overview

\`\`\`
┌─────────────────────────────────────────────┐
│           Electron Main Process             │
│  (Window Management, IPC Router)            │
└────────────────┬────────────────────────────┘
                 │ (IPC Channel)
┌────────────────▼────────────────────────────┐
│         Vue 3 Renderer (Vite)               │
│  ┌─────────────────────────────────────┐   │
│  │    App.vue (Root Container)         │   │
│  │  ├─ AgentDashboard                  │   │
│  │  ├─ KnowledgeGraphVisualizer        │   │
│  │  └─ AnalyticsDashboard              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
\`\`\`

### 데이터 흐름

User Input → Component → IPC Invoke → Main → Process → IPC Reply → UI Update
```

---

## 📊 문서 품질 기준

| 항목 | 기준 |
|:---|:---|
| **명확성** | 처음 본 개발자도 이해 가능 |
| **코드 예시** | 모든 주요 개념에 예시 포함 |
| **최신성** | 코드와 문서 동기화 |
| **완성도** | 모든 공개 API 문서화 |
| **검색성** | 목차와 링크 포함 |

---

## 🔄 문서 유지 관리

### 커밋과 함께 문서 업데이트

```bash
# 코드 변경 시
npm run build      # 빌드
npm run test       # 테스트
# docs/*.md 업데이트
git add docs/
git commit -m "docs: Update API docs for new IPC handler"
```

### 정기 검토

- **월 1회**: 문서 완성도 검토
- **분기 1회**: 아키텍처 문서 동기화
- **매 릴리스**: 변경사항 로그 업데이트

---

## 🚫 금지사항

| 항목 | 이유 |
|:---|:---|
| ❌ 오래된 정보 | 혼동 유발 |
| ❌ 스크린샷 정보 | UI 변경 시 유지 어려움 |
| ❌ 구체적 버전번호 | 빨리 구식됨 |
| ❌ Mermaid 다이어그램 | ASCII 사용 |
| ❌ 상대 경로 | `../../../` 금지 |

---

## 📞 참조

- **부모 Claude.md**: `../claude.md`
- **마크다운 가이드**: https://commonmark.org/
- **GitHub 마크다운**: https://docs.github.com/en/get-started/writing-on-github

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
