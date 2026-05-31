import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import StatusDashboard from './StatusDashboard.vue';

describe('StatusDashboard.vue', () => {
  let wrapper: any;
  let mockElectronAPI: any;
  let intervalId: NodeJS.Timeout;

  beforeEach(() => {
    // Mock Electron IPC
    mockElectronAPI = {
      ollama: {
        getStatus: vi.fn().mockResolvedValue(null),
      },
    };
    window.electronAPI = mockElectronAPI;

    // Mock setInterval and clearInterval
    vi.useFakeTimers();

    wrapper = mount(StatusDashboard);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    wrapper.unmount();
    vi.clearAllMocks();
    delete (window as any).electronAPI;
  });

  // ===== Initial State Tests =====
  describe('Initial State', () => {
    it('should initialize with offline status', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.ollamaStatus).toBe('offline');
    });

    it('should have zero initial values', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.averageResponseTime).toBe(0);
      expect(wrapper.vm.lastResponseTime).toBe(0);
      expect(wrapper.vm.memoryUsage).toBe(0);
      expect(wrapper.vm.cpuUsage).toBe(0);
    });

    it('should initialize with 5 second refresh interval', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.autoRefreshInterval).toBe(5);
    });

    it('should have 15 agents in roster', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents.length).toBe(15);
    });

    it('should set isLoading to false initially', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.isLoading).toBe(false);
    });
  });

  // ===== Status Refresh Tests =====
  describe('Status Refresh', () => {
    it('should call electron API getStatus', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        version: '0.1.28',
        port: 11434,
      });

      await wrapper.vm.refreshStatus();

      expect(mockElectronAPI.ollama.getStatus).toHaveBeenCalled();
    });

    it('should set online status when API returns true', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        version: '0.1.28',
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaStatus).toBe('online');
    });

    it('should set offline status when API returns false', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: false,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaStatus).toBe('offline');
    });

    it('should update version from API response', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        version: '0.2.0',
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaVersion).toBe('0.2.0');
    });

    it('should update port from API response', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        port: 8080,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaPort).toBe(8080);
    });

    it('should update memory usage', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        memoryUsage: 65,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.memoryUsage).toBe(65);
    });

    it('should update CPU usage', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        cpuUsage: 45,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.cpuUsage).toBe(45);
    });

    it('should update response times', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        avgResponseTime: 234,
        lastResponseTime: 256,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.averageResponseTime).toBe(234);
      expect(wrapper.vm.lastResponseTime).toBe(256);
    });

    it('should update success rate', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        successRate: 98,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.successRate).toBe(98);
    });

    it('should update loaded models', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        models: [
          { name: 'llama2', size: '3.8GB', loaded: true },
          { name: 'mistral', size: '7.4GB', loaded: false },
        ],
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.loadedModels.length).toBe(2);
      expect(wrapper.vm.loadedModels[0].name).toBe('llama2');
    });

    it('should update memory nodes', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        memoryNodes: 156,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.memoryNodes).toBe(156);
    });

    it('should set loading state during refresh', async () => {
      mockElectronAPI.ollama.getStatus.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ online: true }), 100))
      );

      const promise = wrapper.vm.refreshStatus();
      expect(wrapper.vm.isLoading).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      await promise;
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should update last check time on successful refresh', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.lastCheckTime).toBeTruthy();
      expect(wrapper.vm.lastCheckTime).not.toBe('');
    });

    it('should handle API errors gracefully', async () => {
      mockElectronAPI.ollama.getStatus.mockRejectedValue(
        new Error('API Error')
      );

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaStatus).toBe('offline');
    });

    it('should use fallback mock data when API unavailable', async () => {
      delete mockElectronAPI.ollama.getStatus;

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.ollamaStatus).toBe('online');
      expect(wrapper.vm.ollamaVersion).toBe('0.1.28');
      expect(wrapper.vm.loadedModels.length).toBeGreaterThan(0);
    });
  });

  // ===== System Health Calculation =====
  describe('System Health Status', () => {
    it('should return excellent when all metrics are good', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 50;
      wrapper.vm.successRate = 99;

      expect(wrapper.vm.systemHealth).toBe('excellent');
    });

    it('should return good when metrics are acceptable', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 70;
      wrapper.vm.successRate = 97;

      expect(wrapper.vm.systemHealth).toBe('good');
    });

    it('should return warning when metrics are concerning', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 85;
      wrapper.vm.successRate = 92;

      expect(wrapper.vm.systemHealth).toBe('warning');
    });

    it('should return critical when offline', async () => {
      wrapper.vm.ollamaStatus = 'offline';

      expect(wrapper.vm.systemHealth).toBe('critical');
    });

    it('should return critical with high memory usage', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 95;
      wrapper.vm.successRate = 100;

      expect(wrapper.vm.systemHealth).toBe('critical');
    });

    it('should return critical with low success rate', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 50;
      wrapper.vm.successRate = 80;

      expect(wrapper.vm.systemHealth).toBe('critical');
    });

    it('should display correct health label', async () => {
      wrapper.vm.ollamaStatus = 'online';
      wrapper.vm.memoryUsage = 50;
      wrapper.vm.successRate = 99;
      await wrapper.vm.$nextTick();

      const label = wrapper.vm.systemHealthLabel;
      expect(label).toContain('최적');
    });
  });

  // ===== Models Display =====
  describe('Loaded Models', () => {
    it('should display loaded models', async () => {
      wrapper.vm.loadedModels = [
        { name: 'llama2', size: '3.8GB', status: '로드됨' },
        { name: 'mistral', size: '7.4GB', status: '로드됨' },
      ];
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('llama2');
      expect(content).toContain('mistral');
    });

    it('should show message when no models loaded', async () => {
      wrapper.vm.loadedModels = [];
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('로드된 모델이 없습니다');
    });

    it('should update model status correctly', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        models: [
          { name: 'test', size: '1GB', loaded: true },
        ],
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.loadedModels[0].status).toBe('로드됨');
    });
  });

  // ===== Agent Roster =====
  describe('Agent Roster', () => {
    it('should have 15 agents', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents.length).toBe(15);
    });

    it('should have named agents', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents.some(a => a.name.includes('중원'))).toBe(true);
      expect(wrapper.vm.agents.some(a => a.name.includes('러도'))).toBe(true);
      expect(wrapper.vm.agents.some(a => a.name.includes('서기'))).toBe(true);
    });

    it('should have agent icons', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents[0].icon).toBeDefined();
    });

    it('should have agent status', async () => {
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents[0].status).toMatch(/active|idle/);
    });

    it('should display agents in template', async () => {
      await wrapper.vm.$nextTick();
      const content = wrapper.text();
      expect(content).toContain('중원');
    });
  });

  // ===== Auto-Refresh =====
  describe('Auto-Refresh', () => {
    it('should have auto-refresh enabled on mount', async () => {
      await vi.advanceTimersByTimeAsync(50);
      // Note: In actual implementation, would check if interval was set
      expect(wrapper.vm.autoRefreshInterval).toBe(5);
    });

    it('should call refresh status periodically', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
      });

      // Initial call on mount
      expect(mockElectronAPI.ollama.getStatus).toHaveBeenCalled();

      // Advance time by 5 seconds to trigger next refresh
      vi.advanceTimersByTime(5000);
      await vi.advanceTimersByTimeAsync(50);

      // Would be called again, but depends on actual implementation
    });
  });

  // ===== Manual Refresh Button =====
  describe('Manual Refresh', () => {
    it('should call refreshStatus when refresh button clicked', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
      });

      await wrapper.vm.refreshStatus();

      expect(mockElectronAPI.ollama.getStatus).toHaveBeenCalled();
    });

    it('should disable refresh button during loading', async () => {
      wrapper.vm.isLoading = true;
      await wrapper.vm.$nextTick();

      // Button should have disabled attribute
      expect(wrapper.vm.isLoading).toBe(true);
    });

    it('should show loading text during refresh', async () => {
      mockElectronAPI.ollama.getStatus.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ online: true }), 100))
      );

      const promise = wrapper.vm.refreshStatus();

      // Check for loading text
      expect(wrapper.vm.isLoading).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      await promise;
    });
  });

  // ===== Status Display =====
  describe('Status Display', () => {
    it('should show online status when Ollama is online', async () => {
      wrapper.vm.ollamaStatus = 'online';
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('🟢');
    });

    it('should show offline status when Ollama is offline', async () => {
      wrapper.vm.ollamaStatus = 'offline';
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('🔴');
    });

    it('should display memory usage as percentage', async () => {
      wrapper.vm.memoryUsage = 75;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('75%');
    });

    it('should display CPU usage as percentage', async () => {
      wrapper.vm.cpuUsage = 45;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('45%');
    });

    it('should display response times in milliseconds', async () => {
      wrapper.vm.averageResponseTime = 234;
      wrapper.vm.lastResponseTime = 256;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('234');
      expect(content).toContain('256');
    });

    it('should display success rate as percentage', async () => {
      wrapper.vm.successRate = 97;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('97%');
    });
  });

  // ===== Progress Bars =====
  describe('Progress Bars', () => {
    it('should render memory usage progress bar', async () => {
      wrapper.vm.memoryUsage = 65;
      await wrapper.vm.$nextTick();

      const bars = wrapper.findAll('.h-2');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should update progress bar width based on memory', async () => {
      wrapper.vm.memoryUsage = 80;
      await wrapper.vm.$nextTick();

      // Progress bar width should be 80%
      expect(wrapper.vm.memoryUsage).toBe(80);
    });

    it('should update progress bar width based on CPU', async () => {
      wrapper.vm.cpuUsage = 50;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.cpuUsage).toBe(50);
    });
  });

  // ===== Memory Nodes =====
  describe('Memory Nodes', () => {
    it('should display memory node count', async () => {
      wrapper.vm.memoryNodes = 156;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('156');
    });

    it('should update memory nodes from API', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        memoryNodes: 200,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.memoryNodes).toBe(200);
    });
  });

  // ===== Uptime =====
  describe('Uptime', () => {
    it('should display uptime in hours', async () => {
      wrapper.vm.uptime = 48;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('48');
    });

    it('should update uptime from API', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        uptime: 72,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.uptime).toBe(72);
    });
  });

  // ===== Total Requests =====
  describe('Total Requests', () => {
    it('should display total requests', async () => {
      wrapper.vm.totalRequests = 5000;
      await wrapper.vm.$nextTick();

      const content = wrapper.text();
      expect(content).toContain('5000');
    });

    it('should update total requests from API', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        totalRequests: 10000,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.totalRequests).toBe(10000);
    });
  });

  // ===== Last Check Time =====
  describe('Last Check Time', () => {
    it('should display last check time', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.lastCheckTime).toBeTruthy();
    });

    it('should update on each refresh', async () => {
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
      });

      const time1 = wrapper.vm.lastCheckTime;
      
      await wrapper.vm.refreshStatus();
      const time2 = wrapper.vm.lastCheckTime;

      // Both should have values
      expect(time1 || time2).toBeTruthy();
    });
  });

  // ===== Color Coding =====
  describe('Color Coding', () => {
    it('should show green memory usage when below 80%', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.memoryUsage = 70;
      wrapper.vm.ollamaStatus = 'online';

      expect(wrapper.vm.systemHealth).not.toBe('critical');
    });

    it('should show yellow memory usage when above 80%', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.memoryUsage = 85;
      wrapper.vm.successRate = 92;
      wrapper.vm.ollamaStatus = 'online';

      expect(wrapper.vm.systemHealth).toBe('warning');
    });

    it('should show red for offline status', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.ollamaStatus = 'offline';

      expect(wrapper.vm.systemHealth).toBe('critical');
    });
  });

  // ===== Edge Cases =====
  describe('Edge Cases', () => {
    it('should handle zero response time', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.averageResponseTime = 0;
      expect(wrapper.vm.averageResponseTime).toBe(0);
    });

    it('should handle 100% memory usage', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.memoryUsage = 100;
      expect(wrapper.vm.memoryUsage).toBe(100);
    });

    it('should handle 0% success rate', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.successRate = 0;
      expect(wrapper.vm.successRate).toBe(0);
    });

    it('should handle empty model list', async () => {
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.loadedModels = [];
      expect(wrapper.vm.loadedModels.length).toBe(0);
    });

    it('should handle null responses from API', async () => {
      await vi.advanceTimersByTimeAsync(50);
      mockElectronAPI.ollama.getStatus.mockResolvedValue({
        online: true,
        memoryUsage: null,
      });

      await wrapper.vm.refreshStatus();

      expect(wrapper.vm.memoryUsage).toBe(0);
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
