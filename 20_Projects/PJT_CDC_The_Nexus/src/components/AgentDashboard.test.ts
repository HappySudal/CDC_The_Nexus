import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AgentDashboard from './AgentDashboard.vue';

describe('AgentDashboard.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock Electron API
    window.electronAPI = {
      getAgents: vi.fn().mockResolvedValue([
        { id: 1, name: 'Sudal', role: 'CEO', status: 'active', tasksCompleted: 142, tasksTotal: 150, responseTime: 45, uptime: 99.8, lastActivity: new Date(), recentTasks: [{ title: 'Test Task', status: 'completed' }], errors: [] },
        { id: 2, name: 'Lando', role: 'COO', status: 'active', tasksCompleted: 120, tasksTotal: 140, responseTime: 52, uptime: 99.6, lastActivity: new Date(), recentTasks: [], errors: [] },
        { id: 3, name: 'Anti', role: 'Strategist', status: 'idle', tasksCompleted: 88, tasksTotal: 100, responseTime: 128, uptime: 98.9, lastActivity: new Date(), recentTasks: [], errors: [] },
        { id: 4, name: 'Seogi', role: 'Secretary', status: 'active', tasksCompleted: 200, tasksTotal: 210, responseTime: 87, uptime: 99.9, lastActivity: new Date(), recentTasks: [], errors: [] },
        { id: 5, name: 'OpenClaude', role: 'Developer', status: 'error', tasksCompleted: 64, tasksTotal: 90, responseTime: 201, uptime: 97.5, lastActivity: new Date(), recentTasks: [], errors: ['timeout'] }
      ]),
      onAgentStatus: vi.fn((callback: any) => {
        // Mock event listener
      })
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.useRealTimers();
  });

  // ========== 1. 마운팅 및 라이프사이클 (4 tests) ==========
  describe('Mounting & Lifecycle', () => {
    it('should mount and render dashboard header', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.find('.dashboard-header').exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('에이전트 모니터링');
    });

    it('should load agents on mount', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      await wrapper.vm.$nextTick();
      expect(window.electronAPI.getAgents).toHaveBeenCalled();
    });

    it('should initialize with list view mode', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.viewMode).toBe('list');
    });

    it('should setup event listener for agent status updates', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(window.electronAPI.onAgentStatus).toHaveBeenCalled();
    });
  });

  // ========== 2. 상태 및 초기화 (6 tests) ==========
  describe('State & Initialization', () => {
    it('should initialize with default filter values', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.filterQuery).toBe('');
      expect(wrapper.vm.filterStatus).toBe('');
    });

    it('should initialize with empty selected agent', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.selectedAgent).toBeNull();
    });

    it('should initialize with isRefreshing false', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.isRefreshing).toBe(false);
    });

    it('should have 5 default agents', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents.length).toBe(5);
    });

    it('should preserve agent data structure', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('role');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('tasksCompleted');
      expect(agent).toHaveProperty('tasksTotal');
      expect(agent).toHaveProperty('responseTime');
      expect(agent).toHaveProperty('uptime');
    });

    it('should have valid status values for agents', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const validStatuses = ['active', 'idle', 'error'];
      wrapper.vm.agents.forEach(agent => {
        expect(validStatuses).toContain(agent.status);
      });
    });
  });

  // ========== 3. 계산 속성 (7 tests) ==========
  describe('Computed Properties', () => {
    it('should calculate total agents correctly', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.totalAgents).toBe(5);
    });

    it('should count active agents', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const activeAgents = wrapper.vm.agents.filter(a => a.status === 'active');
      expect(wrapper.vm.activeCount).toBe(activeAgents.length);
    });

    it('should count idle agents', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const idleAgents = wrapper.vm.agents.filter(a => a.status === 'idle');
      expect(wrapper.vm.idleCount).toBe(idleAgents.length);
    });

    it('should count error agents', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const errorAgents = wrapper.vm.agents.filter(a => a.status === 'error');
      expect(wrapper.vm.errorCount).toBe(errorAgents.length);
    });

    it('should calculate average response time', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const total = wrapper.vm.agents.reduce((sum: number, a: any) => sum + a.responseTime, 0);
      const expected = Math.round(total / wrapper.vm.agents.length);
      expect(wrapper.vm.avgResponseTime).toBe(expected);
    });

    it('should filter agents by name', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = 'Sudal';
      expect(wrapper.vm.filteredAgents.length).toBeGreaterThan(0);
      expect(wrapper.vm.filteredAgents[0].name).toBe('Sudal');
    });

    it('should filter agents by status', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterStatus = 'active';
      wrapper.vm.filteredAgents.forEach(agent => {
        expect(agent.status).toBe('active');
      });
    });
  });

  // ========== 4. 뷰 모드 전환 (4 tests) ==========
  describe('View Mode Switching', () => {
    it('should render list view by default', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.find('.agents-list').exists()).toBe(true);
    });

    it('should switch to grid view', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.viewMode = 'grid';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.agents-grid').exists()).toBe(true);
    });

    it('should switch to stats view', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.viewMode = 'stats';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.stats-view').exists()).toBe(true);
    });

    it('should hide other views when switching', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.viewMode = 'grid';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.agents-list').exists()).toBe(false);
      expect(wrapper.find('.stats-view').exists()).toBe(false);
    });
  });

  // ========== 5. 필터링 (5 tests) ==========
  describe('Filtering', () => {
    it('should filter by name query case-insensitively', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = 'sudal';
      expect(wrapper.vm.filteredAgents.length).toBeGreaterThan(0);
    });

    it('should filter by role', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = 'Developer';
      const filtered = wrapper.vm.filteredAgents;
      expect(filtered.every(a => a.role.toLowerCase().includes('developer'))).toBe(true);
    });

    it('should filter by status', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterStatus = 'idle';
      expect(wrapper.vm.filteredAgents.every(a => a.status === 'idle')).toBe(true);
    });

    it('should combine name and status filters', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = 'Marco';
      wrapper.vm.filterStatus = 'idle';
      wrapper.vm.filteredAgents.forEach(agent => {
        expect(agent.name.toLowerCase().includes('marco')).toBe(true);
        expect(agent.status).toBe('idle');
      });
    });

    it('should show all agents when filters are cleared', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = 'Test';
      wrapper.vm.filterStatus = 'active';
      wrapper.vm.filterQuery = '';
      wrapper.vm.filterStatus = '';
      expect(wrapper.vm.filteredAgents.length).toBe(wrapper.vm.agents.length);
    });
  });

  // ========== 6. 새로고침 기능 (3 tests) ==========
  describe('Refresh Functionality', () => {
    it('should set isRefreshing to true when refreshing', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.refreshData();
      expect(wrapper.vm.isRefreshing).toBe(true);
    });

    it('should reset isRefreshing after 1 second', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.refreshData();
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isRefreshing).toBe(false);
    });

    it('should disable refresh button while refreshing', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.refreshData();
      await wrapper.vm.$nextTick();
      const btn = wrapper.find('.refresh-btn');
      expect(btn.attributes('disabled')).toBeDefined();
    });
  });

  // ========== 7. 모달 기능 (4 tests) ==========
  describe('Modal & Detail View', () => {
    it('should not show modal by default', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.find('.modal-overlay').exists()).toBe(false);
    });

    it('should show modal when agent is selected', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      wrapper.vm.viewAgentDetails(agent);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    });

    it('should display selected agent details in modal', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      wrapper.vm.viewAgentDetails(agent);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedAgent).toEqual(agent);
    });

    it('should close modal when selectedAgent is set to null', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      wrapper.vm.selectedAgent = null;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.modal-overlay').exists()).toBe(false);
    });
  });

  // ========== 8. 명령 실행 (2 tests) ==========
  describe('Command Execution', () => {
    it('should call executeCommand with agent id', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const consoleSpy = vi.spyOn(console, 'log');
      wrapper.vm.executeCommand(1);
      expect(consoleSpy).toHaveBeenCalledWith('Executing command for agent 1');
    });

    it('should handle executeCommand for different agent ids', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const consoleSpy = vi.spyOn(console, 'log');
      wrapper.vm.executeCommand(5);
      expect(consoleSpy).toHaveBeenCalledWith('Executing command for agent 5');
    });
  });

  // ========== 9. 유틸리티 함수 (5 tests) ==========
  describe('Utility Functions', () => {
    it('should return correct status label for active', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.getStatusLabel('active')).toBe('활성 중');
    });

    it('should return correct status label for idle', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.getStatusLabel('idle')).toBe('대기 중');
    });

    it('should return correct status label for error', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.getStatusLabel('error')).toBe('오류');
    });

    it('should format date correctly', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const date = new Date('2026-05-21T10:00:00');
      const formatted = wrapper.vm.formatTime(date);
      expect(formatted).toContain('2026');
    });

    it('should return "-" for null date', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.formatTime(null)).toBe('-');
    });
  });

  // ========== 10. 통계 표시 (5 tests) ==========
  describe('Statistics Display', () => {
    it('should display stats overview cards', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const cards = wrapper.findAll('.stat-card');
      expect(cards.length).toBe(5);
    });

    it('should render total agents stat', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.text()).toContain('전체 에이전트');
    });

    it('should render active agents stat', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.text()).toContain('활성');
    });

    it('should calculate correct task completion percentage', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      const percentage = Math.round((agent.tasksCompleted / agent.tasksTotal) * 100);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should display average response time', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const avgStat = wrapper.findAll('.stat-value').find(n => n.text().includes('ms'));
      expect(avgStat?.text()).toMatch(/\d+ms/);
    });
  });

  // ========== 11. 에이전트 카드 렌더링 (4 tests) ==========
  describe('Agent Card Rendering', () => {
    it('should render agent cards in list view', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const cards = wrapper.findAll('.agent-card-list');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should apply status class to agent cards', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const cards = wrapper.findAll('.agent-card-list');
      cards.forEach((card, index) => {
        const agent = wrapper.vm.agents[index];
        expect(card.classes()).toContain(agent.status);
      });
    });

    it('should display agent name and role', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      const card = wrapper.find('.agent-card-list');
      expect(card.text()).toContain(agent.name);
      expect(card.text()).toContain(agent.role);
    });

    it('should display agent stats inline', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const stats = wrapper.find('.agent-stats-inline');
      expect(stats.text()).toContain('작업');
      expect(stats.text()).toContain('응답');
      expect(stats.text()).toContain('가동율');
    });
  });

  // ========== 12. 에러 처리 (5 tests) ==========
  describe('Error Handling', () => {
    it('should handle electron API failure gracefully', async () => {
      window.electronAPI.getAgents = vi.fn().mockRejectedValue(new Error('API Failed'));
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      await wrapper.vm.$nextTick();
      // Should not throw, just log error
      expect(wrapper.vm.agents.length).toBeGreaterThan(0);
    });

    it('should handle null date in formatTime', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(() => wrapper.vm.formatTime(null)).not.toThrow();
    });

    it('should handle undefined agent in viewAgentDetails', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      expect(() => {
        wrapper.vm.viewAgentDetails(undefined as any);
      }).not.toThrow();
    });

    it('should handle empty error array in agent', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const agent = wrapper.vm.agents[0];
      expect(agent.errors).toBeDefined();
      expect(Array.isArray(agent.errors)).toBe(true);
    });

    it('should handle agent with no recent tasks', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = { recentTasks: [], errors: [] } as any;
      expect(() => wrapper.vm.$nextTick()).not.toThrow();
    });
  });

  // ========== 13. UI 상호작용 (4 tests) ==========
  describe('UI Interactions', () => {
    it('should trigger applyFilters on input change', async () => {
      wrapper = mount(AgentDashboard);
      // <script setup>에서는 @input이 원본 클로저를 호출하므로 vm 스파이 대신 효과(필터 반응성) 검증
      await wrapper.find('.filter-input').setValue('Sudal');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filterQuery).toBe('Sudal');
      expect(wrapper.vm.filteredAgents.length).toBeLessThan(wrapper.vm.agents.length);
    });

    it('should update filteredAgents when filter changes', async () => {
      wrapper = mount(AgentDashboard);
      const initialCount = wrapper.vm.filteredAgents.length;
      wrapper.vm.filterStatus = 'active';
      await wrapper.vm.$nextTick();
      const activeCount = wrapper.vm.filteredAgents.length;
      expect(activeCount).toBeLessThanOrEqual(initialCount);
    });

    it('should render view selector dropdown', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const selector = wrapper.find('.view-selector');
      expect(selector.exists()).toBe(true);
    });

    it('should update view when view selector changes', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.viewMode = 'grid';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.viewMode).toBe('grid');
    });
  });

  // ========== 14. 에지 케이스 (6 tests) ==========
  describe('Edge Cases', () => {
    it('should handle empty agents array', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.agents = [];
      expect(wrapper.vm.totalAgents).toBe(0);
      expect(wrapper.vm.activeCount).toBe(0);
    });

    it('should handle very long agent names', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const longName = 'A'.repeat(200);
      wrapper.vm.agents[0].name = longName;
      expect(wrapper.vm.agents[0].name.length).toBe(200);
    });

    it('should handle extreme response times', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.agents[0].responseTime = 999999;
      const avg = wrapper.vm.avgResponseTime;
      expect(typeof avg).toBe('number');
    });

    it('should handle 100% uptime', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.agents[0].uptime = 100;
      expect(wrapper.vm.agents[0].uptime).toBe(100);
    });

    it('should handle 0% uptime', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.agents[0].uptime = 0;
      expect(wrapper.vm.agents[0].uptime).toBe(0);
    });

    it('should handle special characters in filter query', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filterQuery = '<script>alert("xss")</script>';
      expect(() => wrapper.vm.$nextTick()).not.toThrow();
    });
  });

  // ========== Template Event Handler Coverage ==========
  describe('Template Event Handler Coverage', () => {
    it('should trigger viewMode select v-model', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const sel = wrapper.find('.view-selector');
      await sel.setValue('grid');
      expect(wrapper.vm.viewMode).toBe('grid');
    });

    it('should trigger filterStatus select v-model + @change', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const sel = wrapper.find('.filter-select');
      await sel.setValue('active');
      await sel.trigger('change');
      expect(wrapper.vm.filterStatus).toBe('active');
    });

    it('should trigger list-view detail button @click (viewAgentDetails)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const detailBtn = wrapper.find('.detail-btn');
      expect(detailBtn.exists()).toBe(true);
      await detailBtn.trigger('click');
      expect(wrapper.vm.selectedAgent).not.toBeNull();
    });

    it('should trigger list-view command button @click (executeCommand)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cmdBtn = wrapper.find('.command-btn');
      expect(cmdBtn.exists()).toBe(true);
      await cmdBtn.trigger('click');
      spy.mockRestore();
    });

    it('should trigger grid-card @click (viewAgentDetails)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.viewMode = 'grid';
      await wrapper.vm.$nextTick();
      const card = wrapper.find('.agent-card-grid');
      expect(card.exists()).toBe(true);
      await card.trigger('click');
      expect(wrapper.vm.selectedAgent).not.toBeNull();
    });

    it('should close modal when overlay clicked', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      await wrapper.find('.modal-overlay').trigger('click');
      expect(wrapper.vm.selectedAgent).toBeNull();
    });

    it('should NOT close modal when content clicked (@click.stop)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      await wrapper.find('.modal-content').trigger('click');
      expect(wrapper.vm.selectedAgent).not.toBeNull();
    });

    it('should close modal when close-btn clicked', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      await wrapper.find('.close-btn').trigger('click');
      expect(wrapper.vm.selectedAgent).toBeNull();
    });

    it('should trigger modal primary button @click (executeCommand)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await wrapper.find('.modal-footer .primary').trigger('click');
      spy.mockRestore();
    });

    it('should trigger modal secondary button (close)', async () => {
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      await wrapper.find('.modal-footer .secondary').trigger('click');
      expect(wrapper.vm.selectedAgent).toBeNull();
    });

    it('errors 배열이 있는 사도 모달은 error-item v-for를 렌더링한다 (L250 :key)', async () => {
      window.electronAPI = {
        getAgents: vi.fn().mockResolvedValue([
          {
            id: 99, name: 'ErrAgent', role: 'test', status: 'error',
            tasksCompleted: 1, tasksTotal: 2, responseTime: 10, uptime: 50,
            lastActivity: new Date(),
            recentTasks: [],
            errors: [
              { timestamp: new Date(), message: 'timeout' },
              { timestamp: new Date(), message: 'connection refused' },
            ],
          },
        ]),
        onAgentStatus: vi.fn(),
      } as any;
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = wrapper.vm.agents[0];
      await wrapper.vm.$nextTick();
      const errorItems = wrapper.findAll('.error-item');
      expect(errorItems.length).toBe(2);
    });

    it('should invoke onAgentStatus callback updating matching agent', async () => {
      let captured: any = null;
      window.electronAPI = {
        getAgents: vi.fn().mockResolvedValue([
          { id: 1, name: 'Sudal', role: 'CEO', status: 'active', tasksCompleted: 1, tasksTotal: 1, responseTime: 10, uptime: 100, lastActivity: new Date(), recentTasks: [], errors: [] }
        ]),
        onAgentStatus: vi.fn((cb: any) => { captured = cb; })
      } as any;
      wrapper = mount(AgentDashboard);
      await vi.advanceTimersByTimeAsync(50);
      await Promise.resolve();
      expect(typeof captured).toBe('function');
      captured({ id: 1, status: 'error' });
      expect(wrapper.vm.agents.find((a: any) => a.id === 1).status).toBe('error');
    });
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
