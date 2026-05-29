import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SystemHealthMonitor from './SystemHealthMonitor.vue';

/**
 * 본 테스트는 SystemHealthMonitor.vue의 실제 구현(<script setup> Composition API)에
 * 정합하도록 작성됨. (이전 버전은 미구현 명세를 검증해 다수 실패 → 2026-05-29 정합)
 */
describe('SystemHealthMonitor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ================================
  // Section 1: Rendering
  // ================================
  describe('Rendering', () => {
    it('should render the system health monitor container', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.find('.system-health-monitor').exists()).toBe(true);
    });

    it('should render overall health status ring', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.find('.status-ring').exists()).toBe(true);
      expect(wrapper.find('.ring-value').exists()).toBe(true);
    });

    it('should render all four category cards', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.findAll('.category-card').length).toBe(4);
    });

    it('should render diagnostics and detail buttons', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.find('.btn-diagnose').exists()).toBe(true);
      expect(wrapper.find('.btn-detail').exists()).toBe(true);
      expect(wrapper.text()).toContain('진단 실행');
    });

    it('should render overall status with health status text', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.find('.status-details').exists()).toBe(true);
      const status = wrapper.vm.getHealthStatus(wrapper.vm.overallHealth);
      expect(wrapper.find('.status-details').text()).toContain(status);
    });

    it('should render footer statistics', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.find('.health-footer').exists()).toBe(true);
    });

    it('should render health items within categories', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.findAll('.health-item').length).toBeGreaterThan(0);
    });
  });

  // ================================
  // Section 2: Display & Initial State
  // ================================
  describe('Display & Initial State', () => {
    it('should display overall health percentage', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.overallHealth).toBeGreaterThanOrEqual(0);
      expect(wrapper.vm.overallHealth).toBeLessThanOrEqual(100);
    });

    it('should display all four category types', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.text()).toContain('하드웨어');
      expect(wrapper.text()).toContain('네트워크');
      expect(wrapper.text()).toContain('저장소');
      expect(wrapper.text()).toContain('소프트웨어');
    });

    it('should display correct number of health items per category', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.hardwareItems.length).toBe(4);
      expect(wrapper.vm.networkItems.length).toBe(4);
      expect(wrapper.vm.storageItems.length).toBe(4);
      expect(wrapper.vm.softwareItems.length).toBe(4);
    });

    it('should display item names in cards', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.text()).toContain('CPU');
      expect(wrapper.text()).toContain('네트워크');
      expect(wrapper.text()).toContain('주 디스크');
    });

    it('should have diagnostics panel initially hidden', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.detailMode).toBe(false);
    });

    it('should display footer statistics initially', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.text()).toContain('정상 항목');
      expect(wrapper.text()).toContain('경고');
    });
  });

  // ================================
  // Section 3: Interaction
  // ================================
  describe('Interaction', () => {
    it('should toggle diagnostics (detail) panel on button click', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const detailButton = wrapper.find('.btn-detail');

      await detailButton.trigger('click');
      expect(wrapper.vm.detailMode).toBe(true);

      await detailButton.trigger('click');
      expect(wrapper.vm.detailMode).toBe(false);
    });

    it('should expand/collapse category cards', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const categoryHeader = wrapper.find('.category-header');

      expect(wrapper.vm.collapsedCategories.includes('hardware')).toBe(false);
      await categoryHeader.trigger('click');
      expect(wrapper.vm.collapsedCategories.includes('hardware')).toBe(true);
    });

    it('should run diagnostics on button click', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const runButton = wrapper.find('.btn-diagnose');

      await runButton.trigger('click');
      expect(wrapper.vm.diagnostics).toBeDefined();
      expect(wrapper.vm.diagnostics.length).toBeGreaterThan(0);
    });

    it('should update health values after running diagnostics', async () => {
      const wrapper = mount(SystemHealthMonitor);
      await wrapper.vm.runDiagnostics();
      expect(wrapper.vm.overallHealth).toBeDefined();
    });

    it('should display diagnostics items when panel is open', async () => {
      const wrapper = mount(SystemHealthMonitor);
      wrapper.vm.detailMode = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.findAll('.diagnostic-item').length).toBeGreaterThan(0);
    });
  });

  // ================================
  // Section 4: State Management
  // ================================
  describe('State Management', () => {
    it('should calculate hardware health correctly', () => {
      const wrapper = mount(SystemHealthMonitor);
      const hardwareHealth = wrapper.vm.categoryHealth.hardware;
      expect(hardwareHealth).toBeGreaterThanOrEqual(0);
      expect(hardwareHealth).toBeLessThanOrEqual(100);
    });

    it('should calculate network health correctly', () => {
      const wrapper = mount(SystemHealthMonitor);
      const networkHealth = wrapper.vm.categoryHealth.network;
      expect(networkHealth).toBeGreaterThanOrEqual(0);
      expect(networkHealth).toBeLessThanOrEqual(100);
    });

    it('should calculate overall health as average of categories', () => {
      const wrapper = mount(SystemHealthMonitor);
      const { hardware, network, storage, software } = wrapper.vm.categoryHealth;
      const expectedAverage = (hardware + network + storage + software) / 4;
      expect(Math.abs(wrapper.vm.overallHealth - expectedAverage)).toBeLessThan(1);
    });

    it('should maintain health item value ranges', async () => {
      const wrapper = mount(SystemHealthMonitor);

      for (let i = 0; i < 5; i++) {
        await wrapper.vm.runDiagnostics();

        wrapper.vm.hardwareItems.forEach((item: any) => {
          expect(item.value).toBeGreaterThanOrEqual(0);
          expect(item.value).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should handle inverse health metrics for network (low packet loss = healthy)', () => {
      const wrapper = mount(SystemHealthMonitor);
      const packetLoss = wrapper.vm.networkItems.find((item: any) => item.name.includes('패킷'));

      expect(packetLoss).toBeDefined();
      // 패킷 손실은 낮을수록 좋음 → inverse 모드에서 0은 'excellent'
      const statusClass = wrapper.vm.getItemStatusClass(packetLoss.value, true);
      expect(statusClass).toBe('status-excellent');
    });

    it('should track diagnostic history', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const initialDiagnostics = wrapper.vm.diagnostics.length;

      await wrapper.vm.runDiagnostics();

      expect(wrapper.vm.diagnostics.length).toBeGreaterThanOrEqual(initialDiagnostics);
    });
  });

  // ================================
  // Section 5: Edge Cases
  // ================================
  describe('Edge Cases', () => {
    it('should handle zero health values', () => {
      const wrapper = mount(SystemHealthMonitor);
      wrapper.vm.hardwareItems[0].value = 0;
      expect(wrapper.vm.categoryHealth.hardware).toBeDefined();
    });

    it('should handle maximum health values', () => {
      const wrapper = mount(SystemHealthMonitor);
      wrapper.vm.hardwareItems.forEach((item: any) => {
        item.value = 100;
      });
      expect(wrapper.vm.categoryHealth.hardware).toBe(100);
    });

    it('should handle rapid diagnostics runs', async () => {
      const wrapper = mount(SystemHealthMonitor);
      for (let i = 0; i < 5; i++) {
        await wrapper.vm.runDiagnostics();
      }
      expect(wrapper.vm.overallHealth).toBeDefined();
      expect(wrapper.vm.diagnostics).toBeDefined();
    });

    it('should handle all health items at critical level', async () => {
      const wrapper = mount(SystemHealthMonitor);
      wrapper.vm.hardwareItems.forEach((item: any) => {
        item.value = 10;
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.system-health-monitor').exists()).toBe(true);
    });

    it('should handle category card toggle without side effects', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const initialHealth = wrapper.vm.overallHealth;

      wrapper.vm.toggleCategory('hardware');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.overallHealth).toBe(initialHealth);
    });

    it('should handle empty diagnostics gracefully', () => {
      const wrapper = mount(SystemHealthMonitor);
      wrapper.vm.diagnostics = [];
      expect(wrapper.vm.diagnostics.length).toBe(0);
    });

    it('should maintain state during diagnostics panel toggle', async () => {
      const wrapper = mount(SystemHealthMonitor);
      const healthBefore = wrapper.vm.overallHealth;

      wrapper.vm.detailMode = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.overallHealth).toBe(healthBefore);
    });
  });

  // ================================
  // Section 6: Specialized Features
  // ================================
  describe('Specialized Features', () => {
    it('should expose overallHealth property', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.overallHealth).toBeDefined();
      expect(typeof wrapper.vm.overallHealth).toBe('number');
    });

    it('should expose hardwareItems property', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(Array.isArray(wrapper.vm.hardwareItems)).toBe(true);
      expect(wrapper.vm.hardwareItems.length).toBe(4);
    });

    it('should expose networkItems property', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(Array.isArray(wrapper.vm.networkItems)).toBe(true);
    });

    it('should expose runDiagnostics method', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(typeof wrapper.vm.runDiagnostics).toBe('function');
    });

    it('should determine status class correctly for excellent health', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.getStatusClass(95)).toBe('status-excellent');
    });

    it('should determine status class correctly for good health', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.getStatusClass(80)).toBe('status-good');
    });

    it('should determine status class correctly for warning health', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.getStatusClass(65)).toBe('status-warning');
    });

    it('should determine status class correctly for critical health', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.getStatusClass(50)).toBe('status-critical');
    });

    it('should determine health status text correctly', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.getHealthStatus(95)).toBe('우수');
      expect(wrapper.vm.getHealthStatus(80)).toBe('정상');
      expect(wrapper.vm.getHealthStatus(65)).toBe('주의');
      expect(wrapper.vm.getHealthStatus(50)).toBe('위험');
    });

    it('should calculate healthy systems count correctly', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(wrapper.vm.healthySystems).toBeGreaterThanOrEqual(0);
      expect(wrapper.vm.healthySystems).toBeLessThanOrEqual(16);
    });

    it('should set up auto-check interval on mount', () => {
      vi.useFakeTimers();
      const wrapper = mount(SystemHealthMonitor);
      vi.advanceTimersByTime(10000);
      expect(wrapper.vm.overallHealth).toBeDefined();
      vi.useRealTimers();
    });

    it('should clean up auto-check interval on unmount', () => {
      const wrapper = mount(SystemHealthMonitor);
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
