import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NotificationCenter from './NotificationCenter.vue';

describe('NotificationCenter.vue', () => {
  describe('Rendering', () => {
    it('should render notification center container', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.find('.notification-center').exists()).toBe(true);
    });

    it('should render notifications container', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.find('.notifications-container').exists()).toBe(true);
    });

    it('should render notification panel', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.find('.notification-panel').exists()).toBe(true);
    });

    it('should render empty state when no notifications', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.find('.empty-state').text()).toContain('알림이 없습니다');
    });

    it('should render panel header with title', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.find('.panel-header h3').text()).toBe('알림 센터');
    });

    it('should render statistics display', () => {
      const wrapper = mount(NotificationCenter);
      const stats = wrapper.findAll('.stat');
      expect(stats.length).toBe(3);
    });
  });

  describe('Display', () => {
    it('should display notification tabs', () => {
      const wrapper = mount(NotificationCenter);
      const tabs = wrapper.findAll('.tab-btn');
      expect(tabs.length).toBe(6);
    });

    it('should highlight active tab', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;
      vm.activeFilter = 'success';
      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll('.tab-btn');
      const successTab = tabs.find(tab => tab.classes().includes('active'));
      expect(successTab?.text()).toContain('성공');
    });

    it('should display notification with correct type', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'success',
        priority: 'high',
        title: 'Success',
        message: 'Operation completed',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const notification = wrapper.find('.notification');
      expect(notification.classes()).toContain('type-success');
    });

    it('should display notification with correct priority', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'error',
        priority: 'critical',
        title: 'Error',
        message: 'Critical error',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const notification = wrapper.find('.notification');
      expect(notification.classes()).toContain('priority-critical');
    });

    it('should display close button on notification', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Info',
        message: 'Information',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.btn-close').exists()).toBe(true);
    });

    it('should display action button when action provided', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Action Required',
        message: 'Please review',
        autoDismiss: false,
        action: { label: 'Review', callback: () => {} }
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.btn-action').exists()).toBe(true);
      expect(wrapper.find('.btn-action').text()).toBe('Review');
    });

    it('should display progress bar for auto-dismiss notifications', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Info',
        message: 'Will dismiss',
        autoDismiss: true,
        dismissTime: 5000
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.notification-progress').exists()).toBe(true);
    });

    it('should display correct icon for each type', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const icons: Record<string, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ⓘ'
      };

      for (const [type, icon] of Object.entries(icons)) {
        expect(vm.getIcon(type)).toBe(icon);
      }
    });

    it('should display unread count in statistics', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Unread',
        message: 'Test',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const unreadStat = wrapper.findAll('.stat')[1];
      expect(unreadStat.find('.value').text()).toBe('1');
    });
  });

  describe('Interaction', () => {
    it('should dismiss notification when close button clicked', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test',
        message: 'Message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications.length).toBe(1);

      await wrapper.find('.btn-close').trigger('click');
      expect(vm.allNotifications.length).toBe(0);
    });

    it('should clear all notifications', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 1',
        message: 'Message 1',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'success',
        priority: 'high',
        title: 'Test 2',
        message: 'Message 2',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications.length).toBe(2);
      vm.clearAll();
      expect(vm.allNotifications.length).toBe(0);
    });

    it('should filter notifications by type', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'success',
        priority: 'high',
        title: 'Success',
        message: 'Success message',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'error',
        priority: 'high',
        title: 'Error',
        message: 'Error message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      vm.activeFilter = 'success';
      await wrapper.vm.$nextTick();
      expect(vm.filteredNotifications.length).toBe(1);
      expect(vm.filteredNotifications[0].type).toBe('success');
    });

    it('should filter active (unread) notifications', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 1',
        message: 'Message 1',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 2',
        message: 'Message 2',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      vm.activeFilter = 'active';
      expect(vm.filteredNotifications.length).toBe(2);

      vm.allNotifications[0].read = true;
      await wrapper.vm.$nextTick();
      expect(vm.activeNotifications.length).toBe(1);
    });

    it('should mark notification as read when clicked', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test',
        message: 'Message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const notification = vm.allNotifications[0];
      expect(notification.read).toBe(false);

      vm.focusNotification(notification);
      expect(notification.read).toBe(true);
    });

    it('should execute action callback when action button clicked', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;
      const callback = vi.fn();

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Action',
        message: 'Test action',
        autoDismiss: false,
        action: { label: 'Click', callback }
      });
      await wrapper.vm.$nextTick();

      await wrapper.find('.btn-action').trigger('click');
      expect(callback).toHaveBeenCalled();
    });

    it('should remove notification after action execution', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Action',
        message: 'Test',
        autoDismiss: false,
        action: { label: 'Click', callback: () => {} }
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications.length).toBe(1);
      await wrapper.find('.btn-action').trigger('click');
      expect(vm.allNotifications.length).toBe(0);
    });

    it('should switch tabs', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      expect(vm.activeFilter).toBe('all');

      const tabs = wrapper.findAll('.tab-btn');
      await tabs[1].trigger('click');
      expect(vm.activeFilter).toBe('active');
    });
  });

  describe('State', () => {
    it('should track unread notification count', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 1',
        message: 'Message 1',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 2',
        message: 'Message 2',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.unreadCount).toBe(2);

      vm.allNotifications[0].read = true;
      await wrapper.vm.$nextTick();
      expect(vm.unreadCount).toBe(1);
    });

    it('should track priority notification count', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Low',
        message: 'Low priority',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'error',
        priority: 'critical',
        title: 'Critical',
        message: 'Critical error',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.priorityCount).toBe(1);
    });

    it('should manage dismiss timers', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const id = vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Auto',
        message: 'Will auto-dismiss',
        autoDismiss: true,
        dismissTime: 5000
      });

      expect(vm.dismissTimers.has(id)).toBe(true);

      vm.dismissNotification(0);
      expect(vm.dismissTimers.has(id)).toBe(false);
    });

    it('should sort notifications by timestamp descending', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'First',
        message: 'First message',
        autoDismiss: false
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Second',
        message: 'Second message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.filteredNotifications[0].title).toBe('Second');
      expect(vm.filteredNotifications[1].title).toBe('First');
    });

    it('should maintain notification list independently', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test',
        message: 'Message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const initialCount = vm.allNotifications.length;
      vm.activeFilter = 'success';
      expect(vm.allNotifications.length).toBe(initialCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long notification message', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const longMessage = 'A'.repeat(500);
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Long',
        message: longMessage,
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications[0].message).toBe(longMessage);
      expect(vm.allNotifications[0].message.length).toBe(500);
    });

    it('should handle special characters in message', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const specialMessage = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Special',
        message: specialMessage,
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications[0].message).toBe(specialMessage);
    });

    it('should handle rapid notification additions', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      for (let i = 0; i < 10; i++) {
        vm.addNotification({
          type: 'info',
          priority: 'low',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          autoDismiss: false
        });
      }
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications.length).toBe(10);
    });

    it('should handle mixed notification types', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const types = ['success', 'error', 'warning', 'info'];
      types.forEach(type => {
        vm.addNotification({
          type: type as any,
          priority: 'medium',
          title: type,
          message: `${type} message`,
          autoDismiss: false
        });
      });
      await wrapper.vm.$nextTick();

      expect(vm.allNotifications.length).toBe(4);
      expect(vm.allNotifications.every(n => types.includes(n.type))).toBe(true);
    });

    it('should handle dismissing notification that no longer exists', () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.dismissNotification(99);
      expect(vm.allNotifications.length).toBe(0);
    });
  });

  describe('Specialized', () => {
    it('should expose addNotification via defineExpose', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.vm.addNotification).toBeDefined();
      expect(typeof wrapper.vm.addNotification).toBe('function');
    });

    it('should expose dismissNotification via defineExpose', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.vm.dismissNotification).toBeDefined();
      expect(typeof wrapper.vm.dismissNotification).toBe('function');
    });

    it('should expose clearAll via defineExpose', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.vm.clearAll).toBeDefined();
      expect(typeof wrapper.vm.clearAll).toBe('function');
    });

    it('should expose allNotifications via defineExpose', () => {
      const wrapper = mount(NotificationCenter);
      expect(wrapper.vm.allNotifications).toBeDefined();
    });

    it('should generate unique notification IDs', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const id1 = vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 1',
        message: 'Message 1',
        autoDismiss: false
      });
      const id2 = vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Test 2',
        message: 'Message 2',
        autoDismiss: false
      });

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^notif-\d+-[\d.]+$/);
    });

    it('should update statistics accurately', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'error',
        priority: 'critical',
        title: 'Critical',
        message: 'Critical error',
        autoDismiss: false
      });
      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Info',
        message: 'Info message',
        autoDismiss: false
      });
      await wrapper.vm.$nextTick();

      const stats = wrapper.findAll('.stat');
      expect(stats[0].find('.value').text()).toBe('2');
      expect(stats[1].find('.value').text()).toBe('2');
      expect(stats[2].find('.value').text()).toBe('1');
    });

    it('should format timestamp correctly', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      const testDate = new Date('2026-05-22T14:30:00');
      const formatted = vm.formatTime(testDate);
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should calculate progress percentage correctly', async () => {
      const wrapper = mount(NotificationCenter);
      const vm = wrapper.vm as any;

      vm.addNotification({
        type: 'info',
        priority: 'low',
        title: 'Progress',
        message: 'Test',
        autoDismiss: true,
        dismissTime: 1000
      });
      await wrapper.vm.$nextTick();

      const id = vm.allNotifications[0].id;
      const progress = vm.getProgressPercentage(id);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
