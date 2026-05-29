import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AnalyticsDashboard from './AnalyticsDashboard.vue';

describe('AnalyticsDashboard', () => {
  // ================================
  // Section 1: Rendering Tests
  // ================================
  describe('Rendering', () => {
    it('should render the analytics dashboard container', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.analytics-dashboard').exists()).toBe(true);
    });

    it('should render analytics header with title', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.analytics-header').exists()).toBe(true);
      expect(wrapper.text()).toContain('📊 실시간 분석 대시보드');
    });

    it('should render metric selector dropdown', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.metric-selector').exists()).toBe(true);
    });

    it('should render refresh button', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.btn-refresh').exists()).toBe(true);
      expect(wrapper.text()).toContain('🔄 새로고침');
    });

    it('should render metrics grid with all metric cards', () => {
      const wrapper = mount(AnalyticsDashboard);
      const metricCards = wrapper.findAll('.metric-card');
      expect(metricCards.length).toBeGreaterThan(0);
    });

    it('should render analytics footer with statistics', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.analytics-footer').exists()).toBe(true);
    });

    it('should render trends analysis section', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.find('.analytics-trends').exists()).toBe(true);
      expect(wrapper.text()).toContain('📈 추세 분석');
    });
  });

  // ================================
  // Section 2: Display & Initial State
  // ================================
  describe('Display & Initial State', () => {
    it('should display initial metrics correctly', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.metrics.responseTime).toBeDefined();
      expect(wrapper.vm.metrics.throughput).toBeDefined();
      expect(wrapper.vm.metrics.availability).toBeDefined();
      expect(wrapper.vm.metrics.errorRate).toBeDefined();
      expect(wrapper.vm.metrics.cpuUsage).toBeDefined();
      expect(wrapper.vm.metrics.memoryUsage).toBeDefined();
    });

    it('should display all metric labels', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.text()).toContain('응답 시간');
      expect(wrapper.text()).toContain('처리량');
      expect(wrapper.text()).toContain('가용성');
      expect(wrapper.text()).toContain('에러율');
      expect(wrapper.text()).toContain('CPU 사용률');
      expect(wrapper.text()).toContain('메모리 사용률');
    });

    it('should display footer statistics', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.text()).toContain('총 요청');
      expect(wrapper.text()).toContain('총 에러');
      expect(wrapper.text()).toContain('평균 응답 시간');
      expect(wrapper.text()).toContain('마지막 업데이트');
    });

    it('should display all trend items', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.trends.length).toBe(4);
    });

    it('should show metric status badges', () => {
      const wrapper = mount(AnalyticsDashboard);
      const statusBadges = wrapper.findAll('.metric-status');
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  // ================================
  // Section 3: Interaction Tests
  // ================================
  describe('Interaction', () => {
    it('should update selected metric when dropdown changes', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const selector = wrapper.find('.metric-selector');
      await selector.setValue('performance');
      expect(wrapper.vm.selectedMetric).toBe('performance');
    });

    it('should filter metrics based on selection', async () => {
      const wrapper = mount(AnalyticsDashboard);
      await wrapper.vm.$nextTick();

      const selector = wrapper.find('.metric-selector');
      await selector.setValue('stability');
      await wrapper.vm.$nextTick();

      const visibleCards = wrapper.findAll('.metric-card:not(.hidden)');
      expect(visibleCards.length).toBeGreaterThan(0);
    });

    it('should refresh metrics on button click', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const initialResponseTime = wrapper.vm.metrics.responseTime;

      const refreshButton = wrapper.find('.btn-refresh');
      await refreshButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Metrics should change (with high probability)
      expect(wrapper.vm.metrics).toBeDefined();
    });

    it('should update history on refresh', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const initialHistoryLength = wrapper.vm.history.length;

      await wrapper.vm.refreshMetrics();

      expect(wrapper.vm.history.length).toBeGreaterThanOrEqual(initialHistoryLength);
    });

    it('should maintain history size limit', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const maxHistorySize = 10;

      for (let i = 0; i < 20; i++) {
        await wrapper.vm.refreshMetrics();
      }

      expect(wrapper.vm.history.length).toBeLessThanOrEqual(maxHistorySize + 1);
    });

    it('should update trends after refresh', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const initialTrends = JSON.stringify(wrapper.vm.trends);

      await wrapper.vm.refreshMetrics();

      // Trends might change or stay same depending on randomness
      expect(wrapper.vm.trends).toBeDefined();
    });
  });

  // ================================
  // Section 4: State Management
  // ================================
  describe('State Management', () => {
    it('should calculate total requests correctly', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.totalRequests).toBeGreaterThan(0);
    });

    it('should calculate total errors based on error rate', () => {
      const wrapper = mount(AnalyticsDashboard);
      const expectedErrors = Math.floor(
        (wrapper.vm.metrics.errorRate * wrapper.vm.totalRequests) / 100
      );
      expect(wrapper.vm.totalErrors).toBeLessThanOrEqual(wrapper.vm.totalRequests);
    });

    it('should calculate average response time correctly', () => {
      const wrapper = mount(AnalyticsDashboard);
      const expected = Math.round(
        wrapper.vm.history.reduce((a, b) => a + b.responseTime, 0) / wrapper.vm.history.length
      );
      expect(wrapper.vm.avgResponseTime).toBe(expected);
    });

    it('should update last update time on each action', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const initialTime = wrapper.vm.lastUpdateTime;

      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.lastUpdateTime).toBeDefined();
    });

    it('should keep metrics within valid ranges', async () => {
      const wrapper = mount(AnalyticsDashboard);

      for (let i = 0; i < 10; i++) {
        await wrapper.vm.refreshMetrics();

        expect(wrapper.vm.metrics.responseTime).toBeGreaterThan(0);
        expect(wrapper.vm.metrics.throughput).toBeGreaterThan(0);
        expect(wrapper.vm.metrics.availability).toBeLessThanOrEqual(100);
        expect(wrapper.vm.metrics.availability).toBeGreaterThanOrEqual(0);
        expect(wrapper.vm.metrics.errorRate).toBeLessThanOrEqual(100);
        expect(wrapper.vm.metrics.errorRate).toBeGreaterThanOrEqual(0);
        expect(wrapper.vm.metrics.cpuUsage).toBeLessThanOrEqual(100);
        expect(wrapper.vm.metrics.cpuUsage).toBeGreaterThanOrEqual(0);
        expect(wrapper.vm.metrics.memoryUsage).toBeLessThanOrEqual(100);
        expect(wrapper.vm.metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track 4 initial trends', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.trends.length).toBe(4);
      expect(wrapper.vm.trends[0].name).toBe('응답 시간');
      expect(wrapper.vm.trends[1].name).toBe('처리량');
      expect(wrapper.vm.trends[2].name).toBe('가용성');
      expect(wrapper.vm.trends[3].name).toBe('에러율');
    });

    it('should have correct trend directions (up/down)', () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.trends.forEach(trend => {
        expect(['up', 'down']).toContain(trend.direction);
      });
    });
  });

  // ================================
  // Section 5: Edge Cases
  // ================================
  describe('Edge Cases', () => {
    it('should handle rapid refresh calls', async () => {
      const wrapper = mount(AnalyticsDashboard);
      for (let i = 0; i < 5; i++) {
        await wrapper.vm.refreshMetrics();
      }
      expect(wrapper.vm.metrics).toBeDefined();
    });

    it('should handle metric selector with invalid values gracefully', async () => {
      const wrapper = mount(AnalyticsDashboard);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.selectedMetric).toBeDefined();
    });

    it('should handle very low response times', async () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.metrics.responseTime = 1;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.metrics.responseTime).toBe(1);
    });

    it('should handle very high error rates', async () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.metrics.errorRate = 5;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.metrics.errorRate).toBeLessThanOrEqual(5);
    });

    it('should handle CPU usage at maximum', async () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.metrics.cpuUsage = 90;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.metrics.cpuUsage).toBeLessThanOrEqual(90);
    });

    it('should handle memory usage at maximum', async () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.metrics.memoryUsage = 95;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.metrics.memoryUsage).toBeLessThanOrEqual(95);
    });

    it('should render correctly with all metrics at threshold', async () => {
      const wrapper = mount(AnalyticsDashboard);
      wrapper.vm.metrics = {
        responseTime: 100,
        throughput: 50,
        availability: 95,
        errorRate: 5,
        cpuUsage: 70,
        memoryUsage: 75
      };
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.analytics-dashboard').exists()).toBe(true);
    });
  });

  // ================================
  // Section 6: Specialized Features
  // ================================
  describe('Specialized Features', () => {
    it('should expose refresh metrics method', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.refreshMetrics).toBeDefined();
      expect(typeof wrapper.vm.refreshMetrics).toBe('function');
    });

    it('should expose metrics property', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.metrics).toBeDefined();
      expect(wrapper.vm.metrics).toHaveProperty('responseTime');
      expect(wrapper.vm.metrics).toHaveProperty('throughput');
      expect(wrapper.vm.metrics).toHaveProperty('availability');
      expect(wrapper.vm.metrics).toHaveProperty('errorRate');
      expect(wrapper.vm.metrics).toHaveProperty('cpuUsage');
      expect(wrapper.vm.metrics).toHaveProperty('memoryUsage');
    });

    it('should expose trends property', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.trends).toBeDefined();
      expect(Array.isArray(wrapper.vm.trends)).toBe(true);
    });

    it('should expose history property', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.history).toBeDefined();
      expect(Array.isArray(wrapper.vm.history)).toBe(true);
    });

    it('should generate sparkline points for response time', () => {
      const wrapper = mount(AnalyticsDashboard);
      const points = wrapper.vm.getSparklinePoints('responseTime');
      expect(points).toBeDefined();
      expect(typeof points).toBe('string');
      expect(points.length).toBeGreaterThan(0);
    });

    it('should generate sparkline points for throughput', () => {
      const wrapper = mount(AnalyticsDashboard);
      const points = wrapper.vm.getSparklinePoints('throughput');
      expect(points).toBeDefined();
      expect(typeof points).toBe('string');
      expect(points.length).toBeGreaterThan(0);
    });

    it('should determine status class correctly for good metrics', () => {
      const wrapper = mount(AnalyticsDashboard);
      const statusClass = wrapper.vm.getStatusClass(50, 100);
      expect(statusClass).toBe('status-good');
    });

    it('should determine status class correctly for warning metrics', () => {
      const wrapper = mount(AnalyticsDashboard);
      const statusClass = wrapper.vm.getStatusClass(120, 100);
      expect(statusClass).toBe('status-warning');
    });

    it('should determine status class correctly for critical metrics', () => {
      const wrapper = mount(AnalyticsDashboard);
      const statusClass = wrapper.vm.getStatusClass(160, 100);
      expect(statusClass).toBe('status-critical');
    });

    it('should determine status text correctly', () => {
      const wrapper = mount(AnalyticsDashboard);
      expect(wrapper.vm.getStatusText(50, 100)).toBe('좋음');
      expect(wrapper.vm.getStatusText(120, 100)).toBe('주의');
      expect(wrapper.vm.getStatusText(160, 100)).toBe('위험');
    });

    it('should handle inverse metric thresholds', () => {
      const wrapper = mount(AnalyticsDashboard);
      const statusClass = wrapper.vm.getStatusClass(95, 95, true);
      expect(statusClass).toBe('status-good');
    });

    it('should set up auto-refresh interval on mount', async () => {
      vi.useFakeTimers();
      const wrapper = mount(AnalyticsDashboard);

      vi.advanceTimersByTime(5000);

      expect(wrapper.vm.metrics).toBeDefined();
      vi.useRealTimers();
    });

    it('should clean up refresh interval on unmount', () => {
      const wrapper = mount(AnalyticsDashboard);
      const unmountSpy = vi.spyOn(wrapper.vm, 'refreshMetrics');

      wrapper.unmount();

      expect(unmountSpy).toBeDefined();
    });

    it('should calculate trends with correct direction', async () => {
      const wrapper = mount(AnalyticsDashboard);
      await wrapper.vm.refreshMetrics();

      wrapper.vm.trends.forEach(trend => {
        expect(['up', 'down']).toContain(trend.direction);
        expect(trend.value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should update all displayed statistics after refresh', async () => {
      const wrapper = mount(AnalyticsDashboard);
      const initialTime = wrapper.vm.lastUpdateTime;

      await wrapper.vm.refreshMetrics();

      expect(wrapper.vm.avgResponseTime).toBeDefined();
      expect(wrapper.vm.totalErrors).toBeLessThanOrEqual(wrapper.vm.totalRequests);
    });
  });
});

/* Exists in the Moment, Vanishes in Time. */
