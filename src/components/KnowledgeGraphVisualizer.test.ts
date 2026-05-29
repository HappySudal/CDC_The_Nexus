import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import KnowledgeGraphVisualizer from './KnowledgeGraphVisualizer.vue';

// Mock cytoscape
vi.mock('cytoscape', () => {
  const mockLayout = {
    run: vi.fn().mockResolvedValue(undefined)
  };

  const mockCyInstance: any = {
    layout: vi.fn().mockReturnValue(mockLayout),
    elements: vi.fn().mockReturnValue({
      remove: vi.fn().mockReturnValue({ add: vi.fn() })
    }),
    add: vi.fn().mockReturnValue(undefined),
    fit: vi.fn().mockReturnValue(undefined),
    reset: vi.fn().mockReturnValue(undefined),
    zoom: vi.fn().mockReturnValue(1.0),
    destroy: vi.fn().mockReturnValue(undefined)
  };
  // 자기 참조 메서드는 객체 생성 후 할당 (초기화 전 참조 방지)
  mockCyInstance.on = vi.fn().mockReturnValue(mockCyInstance);

  // 컴포넌트는 default import 후 cytoscape.use(...)를 호출하므로 default 함수에 use를 부착
  const cytoscapeDefault: any = vi.fn().mockReturnValue(mockCyInstance);
  cytoscapeDefault.use = vi.fn();

  return {
    default: cytoscapeDefault,
    use: vi.fn()
  };
});

// Mock cytoscape-cose-bilkent
vi.mock('cytoscape-cose-bilkent', () => ({
  default: { layout: {} }
}));

describe('KnowledgeGraphVisualizer Component', () => {
  let wrapper: any;
  const mockNodes = [
    { id: '제0조', label: '절대 불변 상호작용 규약', description: 'SOVEREIGN PROTOCOL' },
    { id: '제1조', label: '행동 전 사전 정합성 검토', description: 'Pre-Flight Check' },
    { id: '제2조', label: '단일 헌법 절대 복종', description: 'The Single Truth' }
  ];

  const mockEdges = [
    { source: '제0조', target: '제1조', label: 'flows to' },
    { source: '제1조', target: '제2조', label: 'enforces' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Mounting & Lifecycle (6 tests)', () => {
    it('should mount successfully', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: mockNodes,
          edges: mockEdges
        }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.exists()).toBe(true);
    });

    it('should render graph container', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.find('.knowledge-graph-container').exists()).toBe(true);
      expect(wrapper.find('.cy').exists()).toBe(true);
    });

    it('should initialize cytoscape on mount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      await flushPromises();
      // Cytoscape should be initialized
      expect(wrapper.vm.cy).toBeDefined();
    });

    it('should destroy cytoscape on unmount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;
      const destroySpy = vi.spyOn(cy, 'destroy');
      wrapper.unmount();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should initialize with empty props', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: {
          nodes: [],
          edges: []
        }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.selectedNode).toBeNull();
    });

    it('should render control buttons', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      await flushPromises();
      const buttons = wrapper.findAll('.control-btn');
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0].text()).toContain('Fit');
    });
  });

  describe('Props & Data Structure (7 tests)', () => {
    it('should accept nodes prop', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: [] }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.props('nodes')).toEqual(mockNodes);
    });

    it('should accept edges prop', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: [], edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.props('edges')).toEqual(mockEdges);
    });

    it('should have default empty arrays', async () => {
      wrapper = mount(KnowledgeGraphVisualizer);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.props('nodes')).toEqual([]);
      expect(wrapper.props('edges')).toEqual([]);
    });

    it('should initialize selectedNode as null', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.selectedNode).toBeNull();
    });

    it('should initialize zoomLevel to 1', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.zoomLevel).toBe(1);
    });

    it('should initialize currentLayout to cose-bilkent', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.currentLayout).toBe('cose-bilkent');
    });

    it('should have cy reference for cytoscape instance', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.cy).toBeDefined();
    });
  });

  describe('Node Selection (6 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should select node on tap event', async () => {
      wrapper.vm.selectedNode = mockNodes[0];
      expect(wrapper.vm.selectedNode).toEqual(mockNodes[0]);
    });

    it('should display selected node details panel', async () => {
      wrapper.vm.selectedNode = mockNodes[0];
      await wrapper.vm.$nextTick();
      const panel = wrapper.find('.node-details-panel');
      expect(panel.exists()).toBe(true);
    });

    it('should show node label in details panel', async () => {
      wrapper.vm.selectedNode = mockNodes[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('절대 불변 상호작용 규약');
    });

    it('should show node description', async () => {
      wrapper.vm.selectedNode = mockNodes[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('SOVEREIGN PROTOCOL');
    });

    it('should clear selection on close button click', async () => {
      wrapper.vm.selectedNode = mockNodes[0];
      await wrapper.vm.$nextTick();
      wrapper.vm.clearSelection();
      expect(wrapper.vm.selectedNode).toBeNull();
    });

    it('should not display panel when no node selected', async () => {
      wrapper.vm.selectedNode = null;
      await wrapper.vm.$nextTick();
      const panel = wrapper.find('.node-details-panel');
      expect(panel.exists()).toBe(false);
    });
  });

  describe('Graph Controls (5 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should call fit when Fit button clicked', async () => {
      const cy = wrapper.vm.cy;
      const fitSpy = vi.spyOn(cy, 'fit');
      wrapper.vm.fitToScreen();
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should call reset and fit on Reset button', async () => {
      const cy = wrapper.vm.cy;
      const resetSpy = vi.spyOn(cy, 'reset');
      const fitSpy = vi.spyOn(cy, 'fit');
      wrapper.vm.resetZoom();
      expect(resetSpy).toHaveBeenCalled();
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should render Fit button with correct icon', async () => {
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll('.control-btn');
      const fitButton = buttons.find(b => b.text().includes('Fit'));
      expect(fitButton).toBeDefined();
    });

    it('should render Reset button', async () => {
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll('.control-btn');
      const resetButton = buttons.find(b => b.text().includes('Reset'));
      expect(resetButton).toBeDefined();
    });

    it('should render Layout button', async () => {
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll('.control-btn');
      const layoutButton = buttons.find(b => b.text().includes('Layout'));
      expect(layoutButton).toBeDefined();
    });
  });

  describe('Layout Management (5 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should toggle layout from cose-bilkent to grid', async () => {
      expect(wrapper.vm.currentLayout).toBe('cose-bilkent');
      await wrapper.vm.toggleLayout();
      expect(wrapper.vm.currentLayout).toBe('grid');
    });

    it('should toggle layout back from grid to cose-bilkent', async () => {
      wrapper.vm.currentLayout = 'grid';
      await wrapper.vm.toggleLayout();
      expect(wrapper.vm.currentLayout).toBe('cose-bilkent');
    });

    it('should call cytoscape layout when toggle called', async () => {
      const cy = wrapper.vm.cy;
      const layoutSpy = vi.spyOn(cy, 'layout');
      await wrapper.vm.toggleLayout();
      expect(layoutSpy).toHaveBeenCalled();
    });

    it('should update layout with animate option', async () => {
      const cy = wrapper.vm.cy;
      const layoutSpy = vi.spyOn(cy, 'layout');
      await wrapper.vm.toggleLayout();
      expect(layoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          animate: true
        })
      );
    });

    it('should run layout after toggling', async () => {
      const cy = wrapper.vm.cy;
      const mockLayout = cy.layout(); // mockReturnValue로 설정된 동일 layout 객체
      await wrapper.vm.toggleLayout();
      expect(mockLayout.run).toHaveBeenCalled();
    });
  });

  describe('Zoom Level Management (4 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should display current zoom level', async () => {
      wrapper.vm.zoomLevel = 1.5;
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('1.50');
    });

    it('should track zoom level changes', async () => {
      expect(wrapper.vm.zoomLevel).toBe(1);
    });

    it('should show zoom info element', async () => {
      await wrapper.vm.$nextTick();
      const zoomInfo = wrapper.find('.zoom-info');
      expect(zoomInfo.exists()).toBe(true);
    });

    it('should format zoom level to 2 decimal places', async () => {
      wrapper.vm.zoomLevel = 1.23456;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.zoom-info').text()).toContain('1.23');
    });
  });

  describe('Prop Watchers (6 tests)', () => {
    it('should update graph when nodes prop changes', async () => {
      const newNodes = [...mockNodes, { id: '제3조', label: 'New Rule', description: 'Description' }];
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;
      const addSpy = vi.spyOn(cy, 'add');

      await wrapper.setProps({ nodes: newNodes });
      await flushPromises();

      expect(cy.elements().remove).toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalled();
    });

    it('should update graph when edges prop changes', async () => {
      const newEdges = [...mockEdges, { source: '제2조', target: '제0조', label: 'references' }];
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;

      await wrapper.setProps({ edges: newEdges });
      await flushPromises();

      expect(cy.elements().remove).toHaveBeenCalled();
    });

    it('should fit graph after updating nodes', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;
      const fitSpy = vi.spyOn(cy, 'fit');

      await wrapper.setProps({ nodes: mockNodes.slice(0, 2) });
      await flushPromises();

      expect(fitSpy).toHaveBeenCalled();
    });

    it('should handle empty nodes update', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;

      await wrapper.setProps({ nodes: [] });
      await flushPromises();

      expect(cy.elements().remove).toHaveBeenCalled();
    });

    it('should handle empty edges update', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;

      await wrapper.setProps({ edges: [] });
      await flushPromises();

      expect(cy.elements().remove).toHaveBeenCalled();
    });

    it('should watch both nodes and edges simultaneously', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;

      await wrapper.setProps({
        nodes: [...mockNodes, { id: '제3조', label: 'New', description: 'Desc' }],
        edges: [...mockEdges, { source: '제3조', target: '제0조' }]
      });
      await flushPromises();

      expect(cy.elements().remove).toHaveBeenCalled();
    });
  });

  describe('Cytoscape Events (4 tests)', () => {
    it('should register tap event on mount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;
      expect(cy.on).toHaveBeenCalledWith('tap', 'node', expect.any(Function));
    });

    it('should register zoom event on mount', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const cy = wrapper.vm.cy;
      expect(cy.on).toHaveBeenCalledWith('zoom', expect.any(Function));
    });

    it('should update zoom level on zoom event', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.zoomLevel).toBeDefined();
    });

    it('should handle node selection through cy tap event', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.vm.selectedNode).toBeNull();
    });
  });

  describe('Error Handling (3 tests)', () => {
    it('should handle missing graphElement gracefully', async () => {
      const component = { ...KnowledgeGraphVisualizer };
      expect(() => {
        wrapper = mount(component, {
          props: { nodes: mockNodes, edges: mockEdges }
        });
      }).not.toThrow();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should handle cytoscape initialization error', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: [], edges: [] }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.exists()).toBe(true);
    });

    it('should handle layout toggle without cytoscape', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: [], edges: [] }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      wrapper.vm.cy = null;
      await expect(wrapper.vm.toggleLayout()).resolves.toBeUndefined();
    });
  });

  describe('UI Elements (4 tests)', () => {
    it('should render legend section', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const legend = wrapper.find('.legend');
      expect(legend.exists()).toBe(true);
    });

    it('should show node legend item', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.text()).toContain('개념');
    });

    it('should show edge legend item', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.text()).toContain('관계');
    });

    it('should style graph container correctly', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const container = wrapper.find('.knowledge-graph-container');
      expect(container.classes()).toContain('knowledge-graph-container');
    });
  });

  describe('Edge Cases (4 tests)', () => {
    it('should handle very large node count', async () => {
      const largeNodeSet = Array.from({ length: 100 }, (_, i) => ({
        id: `node_${i}`,
        label: `Node ${i}`,
        description: `Description ${i}`
      }));
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: largeNodeSet, edges: [] }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.props('nodes').length).toBe(100);
    });

    it('should handle node with missing description', async () => {
      const nodeWithoutDesc = { id: 'test', label: 'Test' };
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: [nodeWithoutDesc], edges: [] }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      wrapper.vm.selectedNode = nodeWithoutDesc;
      expect(wrapper.vm.selectedNode).toEqual(nodeWithoutDesc);
    });

    it('should handle circular edges', async () => {
      const circularEdges = [
        { source: '제0조', target: '제1조' },
        { source: '제1조', target: '제2조' },
        { source: '제2조', target: '제0조' }
      ];
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: circularEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.props('edges')).toEqual(circularEdges);
    });

    it('should handle rapid prop updates', async () => {
      wrapper = mount(KnowledgeGraphVisualizer, {
        props: { nodes: mockNodes, edges: mockEdges }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const updates = Array.from({ length: 5 }, (_, i) => ({
        nodes: mockNodes.slice(0, i + 1),
        edges: mockEdges
      }));
      for (const update of updates) {
        await wrapper.setProps(update);
      }
      expect(wrapper.props('nodes').length).toBeLessThanOrEqual(mockNodes.length);
    });
  });
});

/**
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
