import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LogViewer from './LogViewer.vue';

describe('LogViewer.vue', () => {
  describe('Rendering', () => {
    it('should render log viewer container', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.find('.log-viewer').exists()).toBe(true);
    });

    it('should display header with title', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.find('h2').text()).toBe('System Logs');
    });

    it('should render control buttons', () => {
      const wrapper = mount(LogViewer);
      const buttons = wrapper.findAll('.btn-action');
      expect(buttons.length).toBe(2);
      expect(buttons[0].text()).toBe('Clear Logs');
      expect(buttons[1].text()).toBe('Export');
    });

    it('should render filter level dropdown', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.find('.filter-select').exists()).toBe(true);
    });

    it('should display stat cards', () => {
      const wrapper = mount(LogViewer);
      const statCards = wrapper.findAll('.stat-card');
      expect(statCards.length).toBe(3);
    });
  });

  describe('Display', () => {
    it('should show empty state when no logs', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.find('.empty-state').text()).toBe('No logs found');
    });

    it('should display log entry with correct structure', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Test message');
      await wrapper.vm.$nextTick();

      const logEntry = wrapper.find('.log-entry');
      expect(logEntry.exists()).toBe(true);
      expect(logEntry.find('.message').text()).toBe('Test message');
    });

    it('should format timestamp correctly', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Test');
      await wrapper.vm.$nextTick();

      const timestamp = wrapper.find('.timestamp');
      expect(timestamp.text()).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should display log level badge', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('error', 'Error message');
      await wrapper.vm.$nextTick();

      const badge = wrapper.find('.level-badge');
      expect(badge.text()).toBe('ERROR');
      expect(badge.classes()).toContain('error');
    });

    it('should show total logs count', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Log 1');
      vm.addLog('warning', 'Log 2');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.stat-value').text()).toBe('2');
    });
  });

  describe('Interaction', () => {
    it('should filter logs by level', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('error', 'Error 1');
      vm.addLog('info', 'Info 1');
      vm.addLog('error', 'Error 2');
      await wrapper.vm.$nextTick();

      const select = wrapper.find('.filter-select');
      await select.setValue('error');
      await wrapper.vm.$nextTick();

      const entries = wrapper.findAll('.log-entry');
      expect(entries.length).toBe(2);
    });

    it('should clear all logs on button click', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Test');
      await wrapper.vm.$nextTick();

      vi.stubGlobal('confirm', vi.fn(() => true));
      await wrapper.find('.btn-action').trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.empty-state').exists()).toBe(true);
    });

    it('should not clear logs if confirmation is cancelled', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Test');
      await wrapper.vm.$nextTick();

      vi.stubGlobal('confirm', vi.fn(() => false));
      await wrapper.find('.btn-action').trigger('click');
      await wrapper.vm.$nextTick();

      const entries = wrapper.findAll('.log-entry');
      expect(entries.length).toBe(1);
    });

    it('should export logs as CSV', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Test log');
      await wrapper.vm.$nextTick();

      const createElementSpy = vi.spyOn(document, 'createElement');
      const buttons = wrapper.findAll('.btn-action');
      await buttons[1].trigger('click');

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('State', () => {
    it('should track error count correctly', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('error', 'Error 1');
      vm.addLog('error', 'Error 2');
      vm.addLog('info', 'Info 1');
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).errorCount).toBe(2);
    });

    it('should track warning count correctly', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('warning', 'Warn 1');
      vm.addLog('warning', 'Warn 2');
      vm.addLog('warning', 'Warn 3');
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).warningCount).toBe(3);
    });

    it('should update total logs when adding entries', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;

      expect((wrapper.vm as any).totalLogs).toBe(0);
      vm.addLog('info', 'Log');
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).totalLogs).toBe(1);
    });

    it('should reset filter when clearing selection', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('error', 'Error');
      vm.addLog('info', 'Info');
      await wrapper.vm.$nextTick();

      const select = wrapper.find('.filter-select');
      await select.setValue('error');
      await select.setValue('');
      await wrapper.vm.$nextTick();

      const entries = wrapper.findAll('.log-entry');
      expect(entries.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', async () => {
      const wrapper = mount(LogViewer);
      const longMessage = 'A'.repeat(500);
      const vm = wrapper.vm as any;
      vm.addLog('info', longMessage);
      await wrapper.vm.$nextTick();

      const message = wrapper.find('.message');
      expect(message.text()).toBe(longMessage);
    });

    it('should handle special characters in messages', async () => {
      const wrapper = mount(LogViewer);
      const specialMessage = '<script>alert("test")</script>';
      const vm = wrapper.vm as any;
      vm.addLog('info', specialMessage);
      await wrapper.vm.$nextTick();

      const message = wrapper.find('.message');
      expect(message.text()).toBe(specialMessage);
    });

    it('should handle rapid log additions', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;

      for (let i = 0; i < 100; i++) {
        vm.addLog('info', `Log ${i}`);
      }
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).totalLogs).toBe(100);
    });

    it('should handle all log levels', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      const levels: Array<'error' | 'warning' | 'info' | 'debug'> = ['error', 'warning', 'info', 'debug'];

      levels.forEach(level => {
        vm.addLog(level, `${level} message`);
      });
      await wrapper.vm.$nextTick();

      const entries = wrapper.findAll('.log-entry');
      expect(entries.length).toBe(4);
    });
  });

  describe('Specialized', () => {
    it('should update footer info text', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('info', 'Log 1');
      vm.addLog('info', 'Log 2');
      await wrapper.vm.$nextTick();

      const footer = wrapper.find('.info-text');
      expect(footer.text()).toContain('Showing 2 of 2');
    });

    it('should apply correct CSS classes for log levels', async () => {
      const wrapper = mount(LogViewer);
      const vm = wrapper.vm as any;
      vm.addLog('error', 'Error');
      await wrapper.vm.$nextTick();

      const entry = wrapper.find('.log-entry');
      expect(entry.classes()).toContain('level-error');
    });

    it('should expose addLog method', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.vm.addLog).toBeDefined();
      expect(typeof wrapper.vm.addLog).toBe('function');
    });

    it('should expose logs ref', () => {
      const wrapper = mount(LogViewer);
      expect(wrapper.vm.logs).toBeDefined();
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
