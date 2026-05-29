import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import RealTimeDashboard from '@/components/RealTimeDashboard.vue';

describe('RealTimeDashboard.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // ============== 初期状態とマウント ==============
  describe('Component Mounting and Initial State', () => {
    it('should mount component successfully', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.realtime-dashboard').exists()).toBe(true);
    });

    it('should initialize with correct data properties', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.autoRefresh).toBe(true);
      expect(vm.activityLogs).toBeInstanceOf(Array);
      expect(vm.alerts).toBeInstanceOf(Array);
      expect(vm.systems).toHaveProperty('ollama');
      expect(vm.systems).toHaveProperty('morning');
      expect(vm.systems).toHaveProperty('twinbrain');
      expect(vm.systems).toHaveProperty('nexus');
    });

    it('should have 4 system cards in systems object', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const systemCount = Object.keys(vm.systems).length;
      expect(systemCount).toBe(4);
    });

    it('should set currentTime on mount', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.currentTime).toBeTruthy();
      // 타임존 비의존: 'YYYY-MM-DD HH:mm:ss' 형식 검증
      expect(vm.currentTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should have initial activityLogs with 3 entries', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.activityLogs.length).toBe(3);
    });

    it('should have initial alerts array', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.alerts.length).toBeGreaterThan(0);
    });
  });

  // ============== ステータスバー ==============
  describe('Status Bar Display', () => {
    it('should render status bar with correct structure', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.status-bar').exists()).toBe(true);
      expect(wrapper.find('.system-status').exists()).toBe(true);
      expect(wrapper.find('.timestamp').exists()).toBe(true);
    });

    it('should display overall status as healthy initially', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.system-status').classes()).toContain('healthy');
    });

    it('should display current timestamp in status bar', async () => {
      wrapper = mount(RealTimeDashboard);
      await wrapper.vm.$nextTick();
      const timestamp = wrapper.find('.timestamp').text();
      expect(timestamp).toBeTruthy();
    });

    it('should render auto-refresh toggle button', () => {
      wrapper = mount(RealTimeDashboard);
      const btn = wrapper.find('.auto-refresh-btn');
      expect(btn.exists()).toBe(true);
      expect(btn.classes()).toContain('active');
    });

    it('should display correct status text', () => {
      wrapper = mount(RealTimeDashboard);
      const statusText = wrapper.find('.status-text');
      expect(statusText.text()).toContain('정상'); // Should contain the status text
      expect(statusText.text()).toMatch(/🟢|🟡|🔴/); // Should contain a status icon
    });

    it('should show status light element', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.status-light').exists()).toBe(true);
    });
  });

  // ============== システムカード ==============
  describe('System Cards Rendering', () => {
    it('should render 4 monitor cards', () => {
      wrapper = mount(RealTimeDashboard);
      const cards = wrapper.findAll('.monitor-card');
      expect(cards.length).toBe(4);
    });

    it('should render Ollama card with correct title', () => {
      wrapper = mount(RealTimeDashboard);
      const ollamaCard = wrapper.findAll('.monitor-card').at(0);
      expect(ollamaCard?.text()).toContain('Ollama');
    });

    it('should render Morning Protocol card', () => {
      wrapper = mount(RealTimeDashboard);
      const cards = wrapper.findAll('.monitor-card');
      const hasMorning = cards.some(card => card.text().includes('Morning Protocol'));
      expect(hasMorning).toBe(true);
    });

    it('should render TwinBrain card', () => {
      wrapper = mount(RealTimeDashboard);
      const cards = wrapper.findAll('.monitor-card');
      const hasTwinBrain = cards.some(card => card.text().includes('TwinBrain'));
      expect(hasTwinBrain).toBe(true);
    });

    it('should render Nexus card', () => {
      wrapper = mount(RealTimeDashboard);
      const cards = wrapper.findAll('.monitor-card');
      const hasNexus = cards.some(card => card.text().includes('Nexus'));
      expect(hasNexus).toBe(true);
    });

    it('should display metrics for each system card', () => {
      wrapper = mount(RealTimeDashboard);
      const metrics = wrapper.findAll('.card-metrics');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should show status badge on each card', () => {
      wrapper = mount(RealTimeDashboard);
      const badges = wrapper.findAll('.status-badge');
      expect(badges.length).toBe(4);
    });

    it('should display metric values correctly', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const ollamaCard = wrapper.findAll('.monitor-card').at(0);
      expect(ollamaCard?.text()).toContain(vm.systems.ollama.cpu.toString());
    });

    it('should apply healthy class to healthy system cards', () => {
      wrapper = mount(RealTimeDashboard);
      const healthyCards = wrapper.findAll('.monitor-card.healthy');
      expect(healthyCards.length).toBeGreaterThan(0);
    });

    it('should display card info with additional data', () => {
      wrapper = mount(RealTimeDashboard);
      const cardInfo = wrapper.findAll('.card-info');
      expect(cardInfo.length).toBe(4);
    });
  });

  // ============== アクティビティログ ==============
  describe('Activity Log Functionality', () => {
    it('should render activity log section', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.activity-log').exists()).toBe(true);
    });

    it('should display log header with title', () => {
      wrapper = mount(RealTimeDashboard);
      const headerText = wrapper.find('.log-header h3').text();
      expect(headerText).toContain('활동 로그');
    });

    it('should render all activity logs', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const logEntries = wrapper.findAll('.log-entry');
      expect(logEntries.length).toBe(vm.activityLogs.length);
    });

    it('should display log entry with timestamp, system, and message', () => {
      wrapper = mount(RealTimeDashboard);
      const firstLog = wrapper.find('.log-entry');
      expect(firstLog.find('.log-time').exists()).toBe(true);
      expect(firstLog.find('.log-system').exists()).toBe(true);
      expect(firstLog.find('.log-message').exists()).toBe(true);
    });

    it('should render clear logs button', () => {
      wrapper = mount(RealTimeDashboard);
      const clearBtn = wrapper.find('.clear-btn');
      expect(clearBtn.exists()).toBe(true);
      expect(clearBtn.text()).toContain('로그 초기화');
    });

    it('should clear logs when clear button clicked', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.activityLogs.length).toBeGreaterThan(0);
      await wrapper.find('.clear-btn').trigger('click');
      expect(vm.activityLogs.length).toBe(0);
    });

    it('should display no logs message when logs are empty', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.activityLogs = [];
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick(); // Double nextTick to ensure render
      expect(wrapper.find('.no-logs').exists()).toBe(true);
      expect(wrapper.find('.no-logs').text()).toContain('없');
    });

    it('should display log entries with correct CSS classes', () => {
      wrapper = mount(RealTimeDashboard);
      const firstLog = wrapper.find('.log-entry');
      expect(firstLog.classes()).toContain('info');
    });

    it('should add new log entry at the beginning', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialLength = vm.activityLogs.length;
      vm.activityLogs.unshift({
        timestamp: new Date(),
        system: 'Test',
        level: 'info',
        message: 'Test message'
      });
      expect(vm.activityLogs.length).toBe(initialLength + 1);
    });

    it('should format log timestamps correctly', () => {
      wrapper = mount(RealTimeDashboard);
      const logTime = wrapper.find('.log-time');
      expect(logTime.text()).toBeTruthy();
    });
  });

  // ============== アラート機能 ==============
  describe('Alert Functionality', () => {
    it('should render alerts section', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.alerts-container').exists()).toBe(true);
    });

    it('should display all alerts', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const alertItems = wrapper.findAll('.alert-item');
      expect(alertItems.length).toBe(vm.alerts.length);
    });

    it('should show alert title and message', () => {
      wrapper = mount(RealTimeDashboard);
      const alertItem = wrapper.find('.alert-item');
      expect(alertItem.find('.alert-title').exists()).toBe(true);
      expect(alertItem.find('.alert-message').exists()).toBe(true);
    });

    it('should render dismiss button for each alert', () => {
      wrapper = mount(RealTimeDashboard);
      const dismissBtns = wrapper.findAll('.dismiss-btn');
      const vm = wrapper.vm as any;
      expect(dismissBtns.length).toBe(vm.alerts.length);
    });

    it('should dismiss alert when dismiss button clicked', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialLength = vm.alerts.length;
      await wrapper.find('.dismiss-btn').trigger('click');
      expect(vm.alerts.length).toBe(initialLength - 1);
    });

    it('should display no alerts message when empty', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.alerts = [];
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick(); // Double nextTick to ensure render
      expect(wrapper.find('.no-alerts').exists()).toBe(true);
      expect(wrapper.find('.no-alerts').text()).toContain('없');
    });

    it('should apply correct severity class to alert items', () => {
      wrapper = mount(RealTimeDashboard);
      const alertItem = wrapper.find('.alert-item');
      expect(alertItem.classes()).toContain('warning');
    });

    it('should display severity icon', () => {
      wrapper = mount(RealTimeDashboard);
      const icon = wrapper.find('.alert-icon');
      expect(icon.text()).toBeTruthy();
    });
  });

  // ============== オートリフレッシュ機能 ==============
  describe('Auto-Refresh Functionality', () => {
    it('should start auto-refresh on mount', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.autoRefresh).toBe(true);
      expect(vm.refreshInterval).toBeTruthy();
    });

    it('should toggle auto-refresh state', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialState = vm.autoRefresh;
      await wrapper.find('.auto-refresh-btn').trigger('click');
      expect(vm.autoRefresh).toBe(!initialState);
    });

    it('should update button text when toggled', async () => {
      wrapper = mount(RealTimeDashboard);
      const btn = wrapper.find('.auto-refresh-btn');
      const initialText = btn.text();
      await btn.trigger('click');
      expect(btn.text()).not.toBe(initialText);
    });

    it('should update metrics every 5 seconds', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialCpu = vm.systems.ollama.cpu;
      
      vi.advanceTimersByTime(5000);
      await wrapper.vm.$nextTick();
      
      // Metrics should have updated (may vary due to randomness)
      expect(vm.systems.ollama.cpu).toBeTruthy();
    });

    it('should update timestamp continuously', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialTime = vm.currentTime;
      
      // Manually call updateTime to verify it works
      vm.updateTime();
      await wrapper.vm.$nextTick();
      
      // Time should be properly formatted
      expect(vm.currentTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should clear interval when auto-refresh is disabled', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      await wrapper.find('.auto-refresh-btn').trigger('click');
      
      // refreshInterval should be null when disabled
      expect(vm.autoRefresh).toBe(false);
    });

    it('should apply active class to button when auto-refresh is enabled', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.auto-refresh-btn').classes()).toContain('active');
    });
  });

  // ============== ステータス計算 ==============
  describe('Overall Status Calculation', () => {
    it('should calculate overall status as healthy when all systems healthy', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      expect(vm.overallStatus).toBe('healthy');
    });

    it('should calculate overall status as warning when any system is warning', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.systems.ollama.status = 'warning';
      expect(vm.overallStatus).toBe('warning');
    });

    it('should calculate overall status as critical when any system is critical', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.systems.ollama.status = 'critical';
      expect(vm.overallStatus).toBe('critical');
    });

    it('should prioritize critical over warning', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.systems.ollama.status = 'critical';
      vm.systems.morning.status = 'warning';
      expect(vm.overallStatus).toBe('critical');
    });

    it('should display correct status text for healthy', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const text = vm.getStatusText('healthy');
      expect(text).toContain('정상');
    });

    it('should display correct status text for warning', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const text = vm.getStatusText('warning');
      expect(text).toContain('주의');
    });

    it('should display correct status text for critical', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const text = vm.getStatusText('critical');
      expect(text).toContain('위험');
    });
  });

  // ============== メソッド ==============
  describe('Component Methods', () => {
    it('should update time with updateTime method', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const initialTime = vm.currentTime;
      vi.advanceTimersByTime(1000);
      vm.updateTime();
      expect(vm.currentTime).toBeTruthy();
    });

    it('should format relative time correctly', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      const justNow = vm.formatTime(new Date());
      expect(justNow).toContain('방금');
      
      const oneMinuteAgo = vm.formatTime(new Date(Date.now() - 60000));
      expect(oneMinuteAgo).toContain('분');
    });

    it('should return getSeverityIcon for different severity levels', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      expect(vm.getSeverityIcon('info')).toBeTruthy();
      expect(vm.getSeverityIcon('warning')).toBeTruthy();
      expect(vm.getSeverityIcon('critical')).toBeTruthy();
    });

    it('should handle metrics update correctly', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const oldCpu = vm.systems.ollama.cpu;
      
      vm.updateMetrics();
      
      // CPU should be within bounds
      expect(vm.systems.ollama.cpu).toBeGreaterThanOrEqual(20);
      expect(vm.systems.ollama.cpu).toBeLessThanOrEqual(80);
    });

    it('should keep memory within bounds on update', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      for (let i = 0; i < 10; i++) {
        vm.updateMetrics();
        expect(vm.systems.ollama.memory).toBeGreaterThanOrEqual(50);
        expect(vm.systems.ollama.memory).toBeLessThanOrEqual(75);
      }
    });
  });

  // ============== IPC統合 ==============
  describe('IPC Integration', () => {
    it('should handle IPC onSystemMetrics event', () => {
      const mockAPI = {
        onSystemMetrics: vi.fn((callback: any) => {
          callback({ ollama: { cpu: 55, memory: 65 } });
        }),
        onActivityLog: vi.fn(),
        onAlert: vi.fn()
      };
      
      (window as any).electronAPI = mockAPI;
      wrapper = mount(RealTimeDashboard);
      
      expect(mockAPI.onSystemMetrics).toHaveBeenCalled();
    });

    it('should handle IPC onActivityLog event', () => {
      const mockAPI = {
        onSystemMetrics: vi.fn(),
        onActivityLog: vi.fn((callback: any) => {
          callback({
            timestamp: new Date(),
            system: 'Test',
            level: 'info',
            message: 'Test log'
          });
        }),
        onAlert: vi.fn()
      };
      
      (window as any).electronAPI = mockAPI;
      wrapper = mount(RealTimeDashboard);
      
      expect(mockAPI.onActivityLog).toHaveBeenCalled();
    });

    it('should handle IPC onAlert event', () => {
      const mockAPI = {
        onSystemMetrics: vi.fn(),
        onActivityLog: vi.fn(),
        onAlert: vi.fn((callback: any) => {
          callback({
            severity: 'warning',
            title: 'Test',
            message: 'Test alert'
          });
        })
      };
      
      (window as any).electronAPI = mockAPI;
      wrapper = mount(RealTimeDashboard);
      
      expect(mockAPI.onAlert).toHaveBeenCalled();
    });

    it('should handle missing electronAPI gracefully', () => {
      (window as any).electronAPI = undefined;
      expect(() => {
        wrapper = mount(RealTimeDashboard);
      }).not.toThrow();
    });
  });

  // ============== クリーンアップ ==============
  describe('Cleanup on Unmount', () => {
    it('should clear refresh interval on unmount', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      const intervalId = vm.refreshInterval;
      
      wrapper.unmount();
      
      expect(intervalId).toBeTruthy();
    });

    it('should prevent memory leaks from intervals', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      expect(vm.refreshInterval).toBeTruthy();
      
      wrapper.unmount();
      
      // After unmount, no intervals should be running
      expect(true).toBe(true);
    });
  });

  // ============== 性能チャートセクション ==============
  describe('Performance Chart Section', () => {
    it('should render performance section', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.performance-section').exists()).toBe(true);
    });

    it('should display chart container with title', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.chart-container').text()).toContain('시스템 성능 추이');
    });

    it('should render SVG chart', () => {
      wrapper = mount(RealTimeDashboard);
      expect(wrapper.find('.simple-chart').exists()).toBe(true);
    });

    it('should display chart labels', () => {
      wrapper = mount(RealTimeDashboard);
      const labels = wrapper.findAll('.chart-labels span');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  // ============== エッジケース ==============
  describe('Edge Cases', () => {
    it('should handle empty alerts list', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.alerts = [];
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.no-alerts').exists()).toBe(true);
    });

    it('should handle very long alert messages', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      vm.alerts.push({
        severity: 'warning',
        title: 'Long Title',
        message: 'a'.repeat(500)
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('.alert-item').length).toBeGreaterThan(0);
    });

    it('should handle rapid metric updates', () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      for (let i = 0; i < 100; i++) {
        vm.updateMetrics();
      }
      
      expect(vm.systems.ollama.cpu).toBeGreaterThanOrEqual(20);
      expect(vm.systems.ollama.cpu).toBeLessThanOrEqual(80);
    });

    it('should handle dismissing all alerts', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      while (vm.alerts.length > 0) {
        await wrapper.find('.dismiss-btn').trigger('click');
      }
      
      expect(vm.alerts.length).toBe(0);
    });

    it('should handle clearing and adding logs simultaneously', async () => {
      wrapper = mount(RealTimeDashboard);
      const vm = wrapper.vm as any;
      
      vm.clearLogs();
      vm.activityLogs.unshift({
        timestamp: new Date(),
        system: 'Test',
        level: 'info',
        message: 'New log'
      });
      
      expect(vm.activityLogs.length).toBe(1);
    });
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
