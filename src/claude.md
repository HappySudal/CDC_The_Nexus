# CLAUDE.md — src/ (Vue 컴포넌트 개발)

> **The Nexus 프론트엔드 컴포넌트 개발 규범**
> Vue 3 + Vite 환경에서 컴포넌트 작성 및 테스트

---

## 📁 폴더 구조

```
src/
├── App.vue                      (루트 앱 컴포넌트)
├── main.js                      (Vite 진입점)
├── claude.md                    (이 파일)
└── components/
    ├── AgentCommandPanel.vue    (Agent 명령 패널)
    ├── AgentCommandPanel.test.ts
    ├── AgentDashboard.vue       (Agent 대시보드)
    ├── AgentDashboard.test.ts
    ├── AnalyticsDashboard.vue   (분석 대시보드)
    ├── AnalyticsDashboard.test.ts
    ├── ConfigurationPanel.vue   (설정 패널)
    ├── ConfigurationPanel.test.ts
    ├── ConstitutionViewer.vue   (헌법 뷰어)
    ├── ConstitutionViewer.test.ts
    ├── DiscordSetupWizard.vue   (Discord 설정)
    ├── DiscordSetupWizard.test.ts
    ├── KnowledgeGraphVisualizer.vue (그래프 시각화)
    ├── KnowledgeGraphVisualizer.test.ts
    ├── LogViewer.vue
    └── [계속...]
```

---

## 🎯 컴포넌트 작성 규칙

### 1️⃣ Vue 3 Composition API

**필수 구조**:

```vue
<template>
  <!-- UI 마크업 -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Props 정의
defineProps({
  modelValue: String,
  disabled: Boolean,
});

// Emits 정의
const emit = defineEmits(['update:modelValue', 'action']);

// 반응형 상태
const internalState = ref(null);

// 계산 속성
const derivedValue = computed(() => {
  // 파생 데이터
});

// 라이프사이클
onMounted(() => {
  // 초기화
});
</script>

<style scoped>
/* 컴포넌트별 스타일 (scoped 필수) */
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
```

### 2️⃣ 절대 경로 (@/ 별칭만)

**✅ 올바른 예**:
```js
import { utils } from '@/utils/graphUtils.js';
import ConfigPanel from '@/components/ConfigurationPanel.vue';
```

**❌ 금지**:
```js
import { utils } from '../../../utils/graphUtils.js';
import ConfigPanel from '../ConfigurationPanel.vue';
```

### 3️⃣ Props & Events 명시

**Props**:
```js
defineProps({
  agentName: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  config: { type: Object, default: () => ({}) },
});
```

**Emits**:
```js
const emit = defineEmits(['update:agentName', 'action-triggered', 'error']);
```

### 4️⃣ 반응형 데이터 관리

```js
// ✅ 사용
const count = ref(0);
const list = ref([]);

// ❌ 금지: 직접 object 변경
const state = { x: 0 }; // 반응형 아님
```

---

## 🧪 테스트 규칙 (Vitest + Vue Test Utils)

### 1️⃣ 테스트 파일명

```
ComponentName.test.ts (확장자 필수)
```

### 2️⃣ 테스트 구조

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentDashboard from './AgentDashboard.vue';

describe('AgentDashboard', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(AgentDashboard, {
      props: { agentId: 'test-agent' },
    });
  });

  it('should render agent name', () => {
    expect(wrapper.text()).toContain('test-agent');
  });

  it('should emit action on button click', async () => {
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('action')).toBeTruthy();
  });
});
```

### 3️⃣ 커버리지 목표

- **라인**: 85%+
- **브랜치**: 80%+
- **함수**: 85%+

**확인 명령어**:
```bash
npm run test -- --coverage
```

---

## 🚫 절대 금지사항

| 항목 | 이유 |
|:---|:---|
| ❌ `console.log` 남기기 | Production에서 제거됨 |
| ❌ inline style | scoped CSS 사용 |
| ❌ 전역 변수 | Props/Emits/Provide-Inject 사용 |
| ❌ setTimeout 남용 | 비동기 처리는 Promise/async-await |
| ❌ 상대 경로 | `@/` 별칭만 사용 |
| ❌ v-html | XSS 위험, 텍스트만 사용 |

---

## 🔄 개발 워크플로우

### 1️⃣ 컴포넌트 작성

```bash
npm run dev  # Vite 개발 서버 + Electron 실행
```

### 2️⃣ 동시 테스트

```bash
# 다른 터미널에서
npm run test -- --watch
```

### 3️⃣ 검증

```bash
npm run test            # 전체 테스트 실행
npm run test -- AgentDashboard.test.ts  # 개별 테스트
```

### 4️⃣ 빌드 검증

```bash
npm run build          # Vite 빌드 + 번들 분석
npm run preview        # 빌드 결과 미리보기
```

---

## 📊 성능 최적화

### 1️⃣ 번들 크기 관리

- Cytoscape 라이브러리: ~1.2MB (필수)
- Vue 3: ~150KB (gzipped)
- 목표: 전체 < 2MB

### 2️⃣ 렌더링 성능

- `v-for` 사용 시 반드시 `:key` 지정
- 큰 리스트는 `v-virtual-scroller` 고려
- 계산 속성으로 필터링/정렬 (재계산 최소화)

### 3️⃣ 메모리 누수 방지

```js
onUnmounted(() => {
  // 이벤트 리스너 정리
  window.removeEventListener('resize', handler);
  // 타이머 정리
  clearInterval(timer);
  // 구독 정리
  subscription.unsubscribe();
});
```

---

## 🛠️ 디버깅 팁

### Vue DevTools

```bash
npm run dev  # DevTools 자동 활성화
# Chrome DevTools → Vue 탭에서 컴포넌트 상태 확인
```

### 성능 프로파일링

```js
// 성능 측정
const start = performance.now();
// ... 코드 실행
console.time('operation-name');
// ... 작업
console.timeEnd('operation-name');
```

### 호환성 검사

```bash
npm run test -- --coverage    # 테스트 커버리지
npm run build                 # 빌드 경고 확인
```

---

## 📞 참조

- **Vue 3 Docs**: https://vuejs.org/
- **Vite**: https://vitejs.dev/
- **Vitest**: https://vitest.dev/
- **Cytoscape**: https://cytoscape.org/
- **부모 Claude.md**: `../claude.md`

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
