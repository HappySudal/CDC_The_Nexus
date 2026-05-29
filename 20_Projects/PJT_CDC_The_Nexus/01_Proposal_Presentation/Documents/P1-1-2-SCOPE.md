# P1-1-2: KnowledgeGraphVisualizer.vue 구현 범위 & 계획

**기간**: 2026-05-21 ~ 2026-05-28 (8일)  
**담당자**: 개발자  
**산출물**: KnowledgeGraphVisualizer.vue (+ 테스트 + 문서)  
**상태**: 🚀 준비 완료

---

## 📋 목표 (The Goal)

"배운 정보들을 지도처럼 보여주기"

사용자가 The Nexus가 배운 모든 개념들(노드)과 그들 간의 관계(엣지)를 **시각적으로** 탐색할 수 있어야 합니다.

### 주요 요구사항:
1. ✅ 지식 그래프 노드 렌더링 (원형, 라벨 표시)
2. ✅ 노드 간 관계선(엣지) 표시
3. ✅ 대화형 기능: 클릭 → 노드 상세 정보 팝업
4. ✅ 성능: 1000개 노드 이상도 부드럽게
5. ✅ 모바일 호환: 반응형 레이아웃

---

## 🛠️ 기술 스택

### 그래프 시각화 라이브러리: **cytoscape.js** ✅

```typescript
// package.json에 추가
"dependencies": {
  "cytoscape": "^3.28.1",
  "cytoscape-cose-bilkent": "^4.1.0"  // 레이아웃 알고리즘
}
```

**선택 근거**:
- 그래프 시각화에 **특화** (노드/엣지 렌더링 최적)
- Vue 3과 완벽 통합
- 상호작용 API 풍부 (클릭, 드래그, 확대/축소)
- 성능 우수 (1000+ 노드 부드러움)
- 러닝커브 낮음 (D3.js보다)

### 보조 라이브러리:
- `@vitejs/plugin-vue`: Vue 3 지원
- `tailwind`: 스타일링
- `vitest`: 단위 테스트

---

## 📐 구조 설계

### 컴포넌트 파일 구조:
```
src/components/
├── KnowledgeGraphVisualizer.vue      (메인 컴포넌트, ~400줄)
├── KnowledgeGraphNode.ts              (노드 인터페이스)
├── KnowledgeGraphEdge.ts              (엣지 인터페이스)
└── composables/
    └── useKnowledgeGraphRender.ts    (cytoscape 초기화 로직)

tests/
└── KnowledgeGraphVisualizer.test.ts  (~300줄, 15+ 시나리오)
```

### KnowledgeGraphVisualizer.vue 구조:
```typescript
<template>
  <div class="graph-container">
    <!-- cytoscape 렌더링 영역 -->
    <div ref="graphElement" class="cy"></div>
    
    <!-- 선택된 노드 정보 패널 -->
    <div v-if="selectedNode" class="node-details-panel">
      <h3>{{ selectedNode.label }}</h3>
      <p>{{ selectedNode.description }}</p>
      <button @click="closeDetails">닫기</button>
    </div>
    
    <!-- 범례 & 제어판 -->
    <div class="graph-controls">
      <button @click="fitToScreen">전체 보기</button>
      <button @click="resetZoom">리셋</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import cytoscape, { Core } from 'cytoscape';
import cose from 'cytoscape-cose-bilkent';

// Props: knowledge graph 데이터
interface Props {
  nodes: { id: string; label: string; description?: string }[];
  edges: { source: string; target: string; label?: string }[];
}

const props = defineProps<Props>();

// 상태
const graphElement = ref<HTMLElement>();
const cy = ref<Core>();
const selectedNode = ref<any>(null);

// cytoscape 초기화
onMounted(() => {
  if (!graphElement.value) return;

  cy.value = cytoscape({
    container: graphElement.value,
    elements: [
      ...props.nodes.map(n => ({ data: { id: n.id, label: n.label } })),
      ...props.edges.map(e => ({ data: { source: e.source, target: e.target } }))
    ],
    style: [{
      selector: 'node',
      style: {
        'background-color': '#61affe',
        'label': 'data(label)',
        'text-valign': 'center'
      }
    }],
    layout: { name: 'cose-bilkent' }
  });

  // 클릭 이벤트
  cy.value.on('tap', 'node', (evt) => {
    selectedNode.value = evt.target.data();
  });
});
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 600px;
  position: relative;
}

.cy {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
}

.node-details-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 300px;
}
</style>
```

---

## 📝 테스트 계획 (15+ 시나리오)

### 1. 렌더링 (5개):
- [ ] 노드 렌더링 (개수 확인)
- [ ] 엣지 렌더링 (개수 확인)
- [ ] 라벨 표시 (텍스트 확인)
- [ ] 빈 그래프 처리 (props.nodes = [])
- [ ] 대규모 그래프 (1000개 노드) 성능

### 2. 상호작용 (5개):
- [ ] 노드 클릭 → 정보 패널 표시
- [ ] 정보 패널 닫기
- [ ] 노드 드래그 (물리 엔진)
- [ ] 확대/축소 (마우스 휠)
- [ ] 더블 클릭 → 중앙으로 확대

### 3. 데이터 갱신 (3개):
- [ ] props 변경 감지 → 그래프 재렌더링
- [ ] 새 노드 추가
- [ ] 노드 삭제

### 4. 엣지 케이스 (2개):
- [ ] 순환 참조 (A→B→A) 처리
- [ ] 고아 노드 (연결 없는 노드) 표시

---

## 🗓️ 일정 (2026-05-21 ~ 2026-05-28)

| 날짜 | 태스크 | 산출물 | 체크 |
|:---:|:---|:---|:---|
| **5/21** | cytoscape 프로토타입 + 라이브러리 선택 완료 | 기본 그래프 렌더링 | ⬜ |
| **5/22~23** | KnowledgeGraphVisualizer.vue UI 구현 | 컴포넌트 완성 | ⬜ |
| **5/24** | 상호작용 기능 (클릭, 드래그, 확대/축소) | 전체 기능 동작 | ⬜ |
| **5/25** | 단위 테스트 작성 (15+ 시나리오) | tests/*.test.ts | ⬜ |
| **5/26~27** | App.vue 통합 + 스타일 다듬기 | 라우팅 완료 | ⬜ |
| **5/28** | 성능 최적화 + QA | 최종 리뷰 | ⬜ |

---

## 🎯 성공 기준 (Definition of Done)

✅ **P1-1-2 완료 = 다음 모두 충족**:

1. **기능**:
   - ✅ 노드/엣지 시각적 표현
   - ✅ 클릭 → 정보 패널
   - ✅ 상호작용 (드래그, 줌)

2. **테스트**:
   - ✅ 15+ 시나리오 모두 통과
   - ✅ 테스트 커버리지 > 80%

3. **성능**:
   - ✅ 1000개 노드 < 500ms 렌더링
   - ✅ 프레임 드롭 없음 (60fps)

4. **문서**:
   - ✅ 코드 내 inline 주석
   - ✅ 사용 예시 (README 섹션)

5. **통합**:
   - ✅ App.vue 라우팅 완성
   - ✅ 다른 컴포넌트와 충돌 없음

---

## 📚 참고 자료

### cytoscape.js 공식 문서:
- [Cytoscape.js Demo](http://js.cytoscape.org/)
- [API Reference](https://js.cytoscape.org/api/)
- [Tutorials](https://js.cytoscape.org/blog/)

### 학습 동영상:
- "Cytoscape.js Graph Visualization" (YouTube)

### 예시 코드:
```typescript
// cytoscape 레이아웃 옵션 (추천)
layout: {
  name: 'cose-bilkent',
  animate: true,
  animationEasing: 'ease-out',
  animationDuration: 400,
  randomize: false
}
```

---

## ⚠️ 위험 요소 & 대응

| 위험 | 증상 | 대응책 |
|:---|:---|:---|
| **cytoscape 러닝커브** | 복잡한 API 이해 어려움 | 공식 demo 분석, Stack Overflow |
| **성능 저하** (1000+ 노드) | 프레임 드롭 | layout 알고리즘 변경, 가상 스크롤 |
| **모바일 터치 지원** | 터치 제스처 미지원 | cytoscape-touch-plugin 추가 |
| **메모리 누수** | Vue 라이프사이클 오류 | unmounted에서 cy.destroy() |

---

## 🎯 P1-1-3~5 병렬 준비

P1-1-2가 진행되는 동안:
- **5/22**: P1-1-3 (AgentCommandPanel) 설계 시작
- **5/23**: P1-1-4 (DiscordSetupWizard) 설계 시작
- **5/25**: 라이브러리 선택, 테스트 구조 설계

---

**시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.**  
**Exists in the Moment, Vanishes in Time.**

---

*P1-1-2 Scope Document*  
*생성: 2026-05-20*  
*상태: 준비 완료 (Ready to Start)*
