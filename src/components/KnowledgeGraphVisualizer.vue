<template>
  <div class="knowledge-graph-container">
    <!-- cytoscape 렌더링 영역 -->
    <div ref="graphElement" class="cy" />

    <!-- 선택된 노드 정보 패널 -->
    <div v-if="selectedNode" class="node-details-panel">
      <div class="panel-header">
        <h3>{{ selectedNode.label }}</h3>
        <button class="close-btn" @click="clearSelection">×</button>
      </div>
      <div class="panel-body">
        <p v-if="selectedNode.description">{{ selectedNode.description }}</p>
        <div class="node-meta">
          <span class="node-id">ID: {{ selectedNode.id }}</span>
        </div>
      </div>
    </div>

    <!-- 제어판 -->
    <div class="graph-controls">
      <button class="control-btn" @click="fitToScreen" title="전체 보기">
        📐 Fit
      </button>
      <button class="control-btn" @click="resetZoom" title="리셋">
        🔄 Reset
      </button>
      <button class="control-btn" @click="toggleLayout" title="레이아웃 재배치">
        🔀 Layout
      </button>
      <span class="zoom-info">{{ zoomLevel.toFixed(2) }}×</span>
    </div>

    <!-- 범례 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-node"></span> 개념/노드
      </div>
      <div class="legend-item">
        <span class="legend-edge"></span> 관계
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import cytoscape from 'cytoscape';
import cose from 'cytoscape-cose-bilkent';

cytoscape.use(cose);

// Props
interface NodeData {
  id: string;
  label: string;
  description?: string;
}

interface EdgeData {
  source: string;
  target: string;
  label?: string;
}

interface Props {
  nodes?: NodeData[];
  edges?: EdgeData[];
}

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  edges: () => []
});

// 상태
const graphElement = ref<HTMLElement>();
const selectedNode = ref<NodeData | null>(null);
const zoomLevel = ref(1);
const cy = ref<any>(null);
const currentLayout = ref<'cose-bilkent' | 'grid'>('cose-bilkent');

// cytoscape 초기화 (실제 구현은 npm install 후 진행)
const initializeGraph = async () => {
  if (!graphElement.value) return;

  try {
    cy.value = cytoscape({
      container: graphElement.value,
      elements: [
        ...props.nodes.map(n => ({ data: { id: n.id, label: n.label } })),
        ...props.edges.map(e => ({ data: { source: e.source, target: e.target } }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#61affe',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 40,
            'height': 40,
            'font-size': 12,
            'color': '#fff'
          }
        },
        {
          selector: 'edge',
          style: {
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: currentLayout.value,
        animate: true,
        animationDuration: 400,
        animationEasing: 'ease-out'
      }
    });

    // 클릭 이벤트 핸들러
    cy.value.on('tap', 'node', (evt: any) => {
      const nodeId = evt.target.data('id');
      const node = props.nodes.find(n => n.id === nodeId);
      if (node) {
        selectedNode.value = node;
      }
    });

    // 줌 레벨 추적
    cy.value.on('zoom', () => {
      zoomLevel.value = cy.value.zoom();
    });

    console.log('✅ Cytoscape 초기화 완료:', {
      nodes: props.nodes.length,
      edges: props.edges.length,
      layout: currentLayout.value
    });
  } catch (error) {
    console.error('❌ cytoscape 초기화 실패:', error);
  }
};

// 메서드
const clearSelection = () => {
  selectedNode.value = null;
};

const fitToScreen = () => {
  if (cy.value) {
    cy.value.fit(cy.value.elements(), 50);
  } else {
    console.log('📐 fitToScreen (npm install 후 활성화)');
  }
};

const resetZoom = () => {
  if (cy.value) {
    cy.value.reset();
    cy.value.fit();
  } else {
    console.log('🔄 resetZoom (npm install 후 활성화)');
  }
};

const toggleLayout = async () => {
  if (!cy.value) {
    console.log('🔀 toggleLayout (npm install 후 활성화)');
    return;
  }

  currentLayout.value = currentLayout.value === 'cose-bilkent' ? 'grid' : 'cose-bilkent';
  const layout = cy.value.layout({ name: currentLayout.value, animate: true });
  await layout.run();
};

// Watchers
watch(
  () => [props.nodes, props.edges],
  () => {
    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([
        ...props.nodes.map(n => ({ data: { id: n.id, label: n.label } })),
        ...props.edges.map(e => ({ data: { source: e.source, target: e.target } }))
      ]);
      cy.value.fit();
    }
  },
  { deep: true }
);

// 라이프사이클
onMounted(() => {
  initializeGraph();
});

onUnmounted(() => {
  if (cy.value) {
    cy.value.destroy();
  }
});
</script>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 600px;
  position: relative;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.cy {
  width: 100%;
  height: 100%;
  background: white;
}

/* 노드 정보 패널 */
.node-details-panel {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 320px;
  z-index: 10;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.panel-body {
  padding: 16px;
}

.panel-body p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.node-meta {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.node-id {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

/* 제어판 */
.graph-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  white-space: nowrap;
}

.control-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #1f2937;
}

.control-btn:active {
  background: #e5e7eb;
}

.zoom-info {
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  display: flex;
  align-items: center;
}

/* 범례 */
.legend {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 8px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #61affe;
}

.legend-edge {
  width: 20px;
  height: 2px;
  background: #ccc;
}

/* 반응형 */
@media (max-width: 768px) {
  .knowledge-graph-container {
    height: 400px;
  }

  .node-details-panel {
    max-width: 280px;
    bottom: 80px;
    right: 10px;
  }

  .graph-controls {
    flex-wrap: wrap;
    bottom: 10px;
    left: 10px;
  }

  .legend {
    top: 10px;
    right: 10px;
    font-size: 11px;
  }
}
</style>

<!-- 시각(時刻)에 존재하고, 시간(時間) 에 소멸한다. -->
<!-- Exists in the Moment, Vanishes in Time. -->
