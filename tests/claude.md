# CLAUDE.md — tests/ (테스트 작성 규범)

> **The Nexus E2E & 통합 테스트 지침**
> Vitest 기반 단위, 통합, E2E 테스트 작성

---

## 📁 테스트 폴더 구조

```
tests/
├── unit/                    (단위 테스트)
│   ├── utils.test.ts
│   └── graphUtils.test.ts
├── integration/             (통합 테스트)
│   ├── AgentWorkflow.test.ts
│   └── GraphIntegration.test.ts
├── e2e/                     (종단간 테스트)
│   ├── UserFlow.test.ts
│   └── ElectronApp.test.ts
└── fixtures/                (테스트 데이터)
    ├── sampleAgents.json
    └── sampleGraph.json
```

---

## 🎯 테스트 작성 규칙

### 1️⃣ 파일명 규칙

```
[Target].test.ts  또는  [Target].spec.ts
```

**예시**:
- `AgentDashboard.test.ts` (컴포넌트 단위)
- `graphIntegration.test.ts` (통합)
- `userFlow.test.ts` (E2E)

### 2️⃣ 기본 구조

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ComponentUnderTest from '@/components/ComponentUnderTest.vue';

describe('ComponentUnderTest', () => {
  let wrapper;
  let testData;

  beforeEach(() => {
    // 테스트 초기화
    testData = { id: 1, name: 'Test' };
    wrapper = mount(ComponentUnderTest, {
      props: { data: testData },
    });
  });

  afterEach(() => {
    // 정리
    wrapper?.unmount();
  });

  it('should render correctly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should emit update on action', async () => {
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update')).toBeTruthy();
  });
});
```

---

## 📊 테스트 레벨별 전략

### Level 1: 단위 테스트 (Unit)

**목적**: 개별 컴포넌트/함수 동작

```js
describe('AgentCommandPanel', () => {
  it('should initialize with empty command', () => {
    const wrapper = mount(AgentCommandPanel);
    expect(wrapper.vm.command).toBe('');
  });

  it('should parse command string correctly', () => {
    const wrapper = mount(AgentCommandPanel);
    wrapper.vm.parseCommand('list agents');
    expect(wrapper.vm.parsedCommand).toEqual({
      action: 'list',
      target: 'agents',
    });
  });
});
```

**커버리지 목표**: 85%+

### Level 2: 통합 테스트 (Integration)

**목적**: 여러 컴포넌트 협력 동작

```js
describe('AgentWorkflow Integration', () => {
  it('should complete full agent command workflow', async () => {
    const wrapper = mount({
      template: `
        <div>
          <AgentCommandPanel @execute="handleExecute" />
          <AgentDashboard :status="executionStatus" />
        </div>
      `,
      components: { AgentCommandPanel, AgentDashboard },
      data: () => ({ executionStatus: 'idle' }),
      methods: {
        handleExecute(cmd) {
          this.executionStatus = 'running';
          // 시뮬레이션
          setTimeout(() => {
            this.executionStatus = 'complete';
          }, 100);
        },
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.executionStatus).toBe('running');
  });
});
```

**커버리지 목표**: 70%+

### Level 3: E2E 테스트 (Electron App)

**목적**: 실제 Electron 앱 동작

```js
describe('Nexus Electron App', () => {
  // Electron 스펙 테스트
  // (별도 파일 또는 Playwright 사용)
});
```

---

## 🧪 테스트 작성 Best Practices

### 1️⃣ AAA 패턴 (Arrange-Act-Assert)

```js
it('should update agent status on command', async () => {
  // Arrange: 테스트 데이터 준비
  const agent = { id: 1, status: 'idle' };
  const wrapper = mount(AgentDashboard, { props: { agent } });

  // Act: 액션 실행
  await wrapper.find('[data-test="status-button"]').trigger('click');

  // Assert: 검증
  expect(wrapper.vm.agent.status).toBe('active');
});
```

### 2️⃣ 명확한 테스트명

**❌ 나쁜 예**:
```js
it('works', () => { ... });
it('test 1', () => { ... });
```

**✅ 좋은 예**:
```js
it('should update agent status from idle to active on button click', () => { ... });
it('should emit error event when API call fails', () => { ... });
```

### 3️⃣ 테스트 고립 (Isolation)

```js
// ✅ 각 테스트는 독립적
describe('AgentPanel', () => {
  it('test A', () => { ... });  // 상태 없음
  it('test B', () => { ... });  // test A와 독립
});

// ❌ 금지: 테스트 간 의존성
describe('BadTests', () => {
  let sharedState;
  it('test A sets state', () => { sharedState = 'value'; });
  it('test B depends on A', () => { expect(sharedState).toBe('value'); });
});
```

### 4️⃣ Mock & Stub 사용

```js
import { vi } from 'vitest';

describe('AgentAPI', () => {
  it('should handle API error', async () => {
    // API 모킹
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    
    // 테스트
    const result = await callAPI(fetchMock);
    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalled();
  });
});
```

---

## 🚨 주의사항

| 사항 | 설명 |
|:---|:---|
| ❌ 타이밍 버그 | `await wrapper.vm.$nextTick()` 필수 |
| ❌ 메모리 누수 | `afterEach`에서 정리 필수 |
| ❌ 전역 상태 오염 | 각 테스트마다 격리된 state |
| ❌ 느린 테스트 | 불필요한 delay 제거 |
| ❌ 플레이키한 테스트 | 타이밍에 의존하지 않기 |

---

## 📈 테스트 실행 & 모니터링

### 실행 명령어

```bash
# 전체 테스트 실행
npm run test

# Watch 모드 (파일 변경 시 자동 실행)
npm run test -- --watch

# 특정 파일만 실행
npm run test -- AgentDashboard.test.ts

# 커버리지 리포트 생성
npm run test -- --coverage

# UI 모드 (브라우저에서 시각화)
npm run test:ui
```

### 커버리지 목표

| 유형 | 목표 |
|:---|:---:|
| **Line** | 85%+ |
| **Branch** | 80%+ |
| **Function** | 85%+ |
| **Statement** | 85%+ |

---

## 🔄 CI/CD 통합

### Pre-commit Hook

```bash
# .husky/pre-commit
npm run test -- --bail  # 실패하면 commit 중단
```

### GitHub Actions (예시)

```yaml
- name: Run Tests
  run: npm run test
  
- name: Check Coverage
  run: npm run test -- --coverage --bail
```

---

## 📚 Fixture & Mock 데이터

### Fixture 파일 (tests/fixtures/)

```json
// sampleAgents.json
{
  "agents": [
    { "id": 1, "name": "Agent1", "status": "active" },
    { "id": 2, "name": "Agent2", "status": "idle" }
  ]
}
```

### Fixture 사용

```js
import sampleAgents from '../fixtures/sampleAgents.json';

it('should load agents from fixture', () => {
  const wrapper = mount(AgentList, {
    props: { agents: sampleAgents.agents },
  });
  expect(wrapper.findAll('[data-test="agent"]')).toHaveLength(2);
});
```

---

## 🎯 테스트 주기

| 단계 | 타이밍 | 행동 |
|:---|:---|:---|
| **개발 중** | 파일 저장 | `npm run test -- --watch` |
| **커밋 전** | 수동 | `npm run test` (전체) |
| **PR 제출 시** | 자동 | GitHub Actions 실행 |
| **병합 전** | 자동 | CI/CD 통과 확인 |

---

## 📞 참조

- **Vitest 공식 문서**: https://vitest.dev/
- **Vue Test Utils**: https://test-utils.vuejs.org/
- **부모 Claude.md**: `../claude.md`

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
