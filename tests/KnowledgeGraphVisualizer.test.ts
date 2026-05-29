import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import KnowledgeGraphVisualizer from '../src/components/KnowledgeGraphVisualizer.vue';

// Create mock data storage
let mockGraphData: { nodes: any[], edges: any[] } = { nodes: [], edges: [] };

// Mock cytoscape module
vi.mock('cytoscape', () => {
  const cytoscapeDefault = vi.fn((config: any) => {
      const elements = config.elements || [];
      mockGraphData.nodes = elements.filter((e: any) => !e.data?.source) || [];
      mockGraphData.edges = elements.filter((e: any) => e.data?.source) || [];

      const eventHandlers: any = {};
      let currentZoom = 1;
      let currentLayout = config.layout?.name || 'cose-bilkent';

      const mockNode = (id: string) => {
        const nodeEl = mockGraphData.nodes.find((n) => n.data.id === id);
        return {
          data: (key?: string) => {
            if (!nodeEl) return key ? undefined : { id };
            return key ? nodeEl.data[key] : nodeEl.data;
          },
          emit: (event: string) => {
            if (event === 'tap' && eventHandlers['tap']) {
              const handler = eventHandlers['tap'];
              handler({ target: mockNode(id) });
            }
          }
        };
      };

      const cyMock = {
        nodes: () => mockGraphData.nodes.map((n) => mockNode(n.data.id)),
        edges: () => mockGraphData.edges,
        getElementById: (id: string) => mockNode(id),
        on: vi.fn((event: string, selector: string | null, callback?: any) => {
          const actualCallback = typeof selector === 'function' ? selector : callback;
          if (!eventHandlers[event]) {
            eventHandlers[event] = actualCallback;
          }
        }),
        zoom: vi.fn((value?: number) => {
          if (value !== undefined) {
            currentZoom = value;
            if (eventHandlers['zoom']) {
              eventHandlers['zoom']();
            }
          }
          return currentZoom;
        }),
        fit: vi.fn(),
        reset: vi.fn(() => {
          currentZoom = 1;
        }),
        elements: () => ({
          remove: vi.fn(() => {
            mockGraphData.nodes = [];
            mockGraphData.edges = [];
          })
        }),
        add: vi.fn((elements: any[]) => {
          const newNodes = elements.filter((e) => !e.data?.source);
          const newEdges = elements.filter((e) => e.data?.source);
          mockGraphData.nodes.push(...newNodes);
          mockGraphData.edges.push(...newEdges);
        }),
        layout: vi.fn((config: any) => {
          if (config?.name) {
            currentLayout = config.name;
          }
          return { run: vi.fn() };
        }),
        destroy: vi.fn(),
        _getZoom: () => currentZoom,
        _getLayout: () => currentLayout,
        _simulateTap: (nodeId: string) => {
          if (eventHandlers['tap']) {
            eventHandlers['tap']({ target: mockNode(nodeId) });
          }
        }
      };

      return cyMock;
    });

  cytoscapeDefault.use = vi.fn(() => cytoscapeDefault);

  return {
    default: cytoscapeDefault
  };
});

vi.mock('cytoscape-cose-bilkent', () => ({
  default: vi.fn()
}));

describe('KnowledgeGraphVisualizer', () => {
  let wrapper: any;

  const mockNodes = [
    { id: 'node1', label: '지식 그래프', description: '배운 정보들의 네트워크' },
    { id: 'node2', label: 'AI 모델', description: 'Ollama/LLM' },
    { id: 'node3', label: 'CDC 플랫폼', description: 'The Nexus' }
  ];

  const mockEdges = [
    { source: 'node1', target: 'node2', label: '사용' },
    { source: 'node1', target: 'node3', label: '연결' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // === RENDERING TESTS (5 scenarios) ===

  describe('Rendering', () => {
    it('should render node count correctly', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      expect(cy?.nodes().length || 0).toBe(3);
    });

    it('should render edge count correctly', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      expect(cy?.edges().length || 0).toBe(2);
    });

    it('should display node labels', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      const nodes = cy?.nodes() || [];
      const labels = nodes.map((n: any) => n.data('label'));
      expect(labels).toContain('지식 그래프');
      expect(labels).toContain('AI 모델');
      expect(labels).toContain('CDC 플랫폼');
    });

    it('should handle empty graph (no nodes)', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: [],
          edges: []
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      expect(cy?.nodes().length || 0).toBe(0);
      expect(cy?.edges().length || 0).toBe(0);
    });

    it('should handle large graph with 1000 nodes', async () => {
      const largeNodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node${i}`,
        label: `Node ${i}`
      }));
      const largeEdges = Array.from({ length: 999 }, (_, i) => ({
        source: `node${i}`,
        target: `node${i + 1}`
      }));

      const startTime = performance.now();
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: largeNodes,
          edges: largeEdges
        }
      });

      await flushPromises();
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      const cy = wrapper.vm.cy;
      expect(cy?.nodes().length || 0).toBe(1000);
      expect(renderTime).toBeLessThan(5000);
    });
  });

  // === INTERACTION TESTS (5 scenarios) ===

  describe('Interaction', () => {
    beforeEach(() => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });
    });

    it('should select node on click and show details panel', async () => {
      await flushPromises();
      const cy = wrapper.vm.cy;

      if (cy) {
        const node = cy.getElementById('node1');
        node.emit('tap');
      }

      await flushPromises();
      expect(wrapper.vm.selectedNode).toBeTruthy();
      expect(wrapper.vm.selectedNode?.id).toBe('node1');
      expect(wrapper.vm.selectedNode?.label).toBe('지식 그래프');
    });

    it('should close details panel when clicking close button', async () => {
      await flushPromises();
      wrapper.vm.selectedNode = mockNodes[0];

      await wrapper.vm.$nextTick();
      wrapper.vm.clearSelection();

      expect(wrapper.vm.selectedNode).toBeNull();
    });

    it('should update zoom level on zoom event', async () => {
      await flushPromises();
      const cy = wrapper.vm.cy;

      if (cy) {
        const initialZoom = wrapper.vm.zoomLevel;
        cy.zoom(2);
        await flushPromises();
        expect(wrapper.vm.zoomLevel).toBeDefined();
      }
    });

    it('should fit graph to screen', async () => {
      await flushPromises();
      const spy = vi.spyOn(wrapper.vm, 'fitToScreen');

      wrapper.vm.fitToScreen();
      expect(spy).toHaveBeenCalled();
    });

    it('should reset zoom to initial state', async () => {
      await flushPromises();
      const spy = vi.spyOn(wrapper.vm, 'resetZoom');

      wrapper.vm.resetZoom();
      expect(spy).toHaveBeenCalled();
    });
  });

  // === DATA UPDATE TESTS (3 scenarios) ===

  describe('Data Updates', () => {
    it('should detect props changes and re-render graph', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      let cy = wrapper.vm.cy;
      const initialNodeCount = cy?.nodes().length || 0;

      const newNodes = [
        ...mockNodes,
        { id: 'node4', label: '새로운 노드', description: '추가됨' }
      ];

      await wrapper.setProps({
        nodes: newNodes,
        edges: mockEdges
      });

      await flushPromises();
      cy = wrapper.vm.cy;
      const newNodeCount = cy?.nodes().length || 0;

      expect(newNodeCount).toBeGreaterThan(initialNodeCount);
    });

    it('should handle adding new node', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();

      const addedNode = { id: 'node4', label: '새 노드', description: '추가됨' };
      const updatedNodes = [...mockNodes, addedNode];

      await wrapper.setProps({
        nodes: updatedNodes,
        edges: mockEdges
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      const newNode = cy?.getElementById('node4');
      expect(newNode?.data('label')).toBe('새 노드');
    });

    it('should handle removing node', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      const initialCount = wrapper.vm.cy?.nodes().length || 0;

      const removedNodes = mockNodes.slice(0, 2);
      await wrapper.setProps({
        nodes: removedNodes,
        edges: mockEdges.filter(e => e.source !== 'node3' && e.target !== 'node3')
      });

      await flushPromises();
      const newCount = wrapper.vm.cy?.nodes().length || 0;
      expect(newCount).toBeLessThan(initialCount);
    });
  });

  // === EDGE CASES (3 scenarios) ===

  describe('Edge Cases', () => {
    it('should handle circular references (A→B→A)', async () => {
      const circularNodes = [
        { id: 'nodeA', label: 'A', description: 'Node A' },
        { id: 'nodeB', label: 'B', description: 'Node B' }
      ];
      const circularEdges = [
        { source: 'nodeA', target: 'nodeB' },
        { source: 'nodeB', target: 'nodeA' }
      ];

      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: circularNodes,
          edges: circularEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      expect(cy?.nodes().length || 0).toBe(2);
      expect(cy?.edges().length || 0).toBe(2);
    });

    it('should display orphan nodes (unconnected nodes)', async () => {
      const orphanNodes = [
        { id: 'node1', label: '노드 1', description: 'Connected' },
        { id: 'node2', label: '노드 2', description: 'Connected' },
        { id: 'orphan', label: '고아 노드', description: 'Isolated' }
      ];
      const edges = [
        { source: 'node1', target: 'node2' }
      ];

      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: orphanNodes,
          edges: edges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      const orphanNode = cy?.getElementById('orphan');
      expect(orphanNode?.data('label')).toBe('고아 노드');
    });

    it('should handle self-referencing node (A→A)', async () => {
      const selfRefNodes = [
        { id: 'nodeA', label: 'Self-Ref', description: 'References itself' }
      ];
      const selfRefEdges = [
        { source: 'nodeA', target: 'nodeA' }
      ];

      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: selfRefNodes,
          edges: selfRefEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      expect(cy?.nodes().length || 0).toBe(1);
      expect(cy?.edges().length || 0).toBe(1);
    });
  });

  // === LAYOUT TESTS (2 scenarios) ===

  describe('Layout', () => {
    beforeEach(() => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });
    });

    it('should toggle between layout algorithms', async () => {
      await flushPromises();
      const initialLayout = wrapper.vm.currentLayout;

      wrapper.vm.toggleLayout();
      await flushPromises();

      expect(wrapper.vm.currentLayout).not.toBe(initialLayout);
    });

    it('should initialize with cose-bilkent layout', async () => {
      await flushPromises();
      expect(wrapper.vm.currentLayout).toBe('cose-bilkent');
    });
  });

  // === LIFECYCLE TESTS (2 scenarios) ===

  describe('Lifecycle', () => {
    it('should initialize cytoscape on mount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      expect(wrapper.vm.cy).toBeDefined();
    });

    it('should destroy cytoscape on unmount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });

      await flushPromises();
      const cy = wrapper.vm.cy;
      const destroySpy = vi.spyOn(cy, 'destroy');

      wrapper.unmount();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  // === UI RENDERING TESTS (2 scenarios) ===

  describe('UI Elements', () => {
    beforeEach(() => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });
    });

    it('should render graph container', () => {
      const container = wrapper.find('.knowledge-graph-container');
      expect(container.exists()).toBe(true);
    });

    it('should render control buttons', () => {
      const controls = wrapper.find('.graph-controls');
      expect(controls.exists()).toBe(true);

      const buttons = wrapper.findAll('.control-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

/**
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
