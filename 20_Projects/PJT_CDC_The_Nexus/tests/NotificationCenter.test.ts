import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import NotificationCenter from '@/components/NotificationCenter.vue';

describe('NotificationCenter.vue', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(NotificationCenter);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should mount successfully', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.notification-center').exists()).toBe(true);
    });

    it('should initialize with empty notifications', () => {
      const vm = wrapper.vm as any;
      expect(vm.activeNotifications.length).toBe(0);
      expect(vm.allNotifications.length).toBe(0);
    });

    it('should initialize filter to all', () => {
      const vm = wrapper.vm as any;
      expect(vm.activeFilter).toBe('all');
    });

    it('should have notification tabs', () => {
      expect(wrapper.findAll('.tab-btn').length).toBeGreaterThan(0);
    });
  });

  describe('Notification Management', () => {
    it('should add notification to list', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Test',
        message: 'Test message',
        type: 'info',
        priority: 'normal',
      });
      await nextTick();
      expect(vm.allNotifications.length).toBe(1);
    });

    it('should dismiss notification by index', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Test',
        message: 'Test message',
        type: 'info',
      });
      await nextTick();

      vm.dismissNotification(0);
      await nextTick();
      expect(vm.activeNotifications.length).toBe(0);
    });

    it('should clear all notifications', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({ title: 'Test 1', message: 'Msg 1', type: 'info' });
      vm.addNotification({ title: 'Test 2', message: 'Msg 2', type: 'warning' });
      await nextTick();

      vm.clearAll();
      await nextTick();
      expect(vm.allNotifications.length).toBe(0);
    });
  });

  describe('Notification Filtering', () => {
    beforeEach(async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({ title: 'Info', message: 'Info msg', type: 'info', read: true });
      vm.addNotification({ title: 'Error', message: 'Error msg', type: 'error', read: false });
      vm.addNotification({ title: 'Success', message: 'Success msg', type: 'success', read: false });
      await nextTick();
    });

    it('should show all notifications when filter is all', () => {
      const vm = wrapper.vm as any;
      vm.activeFilter = 'all';
      expect(vm.filteredNotifications.length).toBe(3);
    });

    it('should filter by active (unread) status', () => {
      const vm = wrapper.vm as any;
      vm.activeFilter = 'active';
      expect(vm.filteredNotifications.length).toBe(2);
    });

    it('should filter by type', () => {
      const vm = wrapper.vm as any;
      vm.activeFilter = 'error';
      expect(vm.filteredNotifications.every((n: any) => n.type === 'error')).toBe(true);
    });
  });

  describe('Notification Actions', () => {
    it('should execute notification action', async () => {
      const vm = wrapper.vm as any;
      const actionCallback = vi.fn();
      vm.addNotification({
        title: 'Action test',
        message: 'Test action',
        type: 'info',
        action: { label: 'Confirm', callback: actionCallback },
      });
      await nextTick();

      vm.handleAction(vm.activeNotifications[0], 0);
      expect(actionCallback).toHaveBeenCalled();
    });

    it('should mark notification as read when focused', () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Focus test',
        message: 'Test focus',
        type: 'info',
        read: false,
      });

      vm.focusNotification(vm.allNotifications[0]);
      expect(vm.allNotifications[0].read).toBe(true);
    });
  });

  describe('Notification Display', () => {
    it('should display notification with correct type class', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Test',
        message: 'Test',
        type: 'warning',
      });
      await nextTick();

      const notification = wrapper.find('.notification');
      expect(notification.classes()).toContain('type-warning');
    });

    it('should display notification with correct priority class', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Test',
        message: 'Test',
        type: 'info',
        priority: 'high',
      });
      await nextTick();

      const notification = wrapper.find('.notification');
      expect(notification.classes()).toContain('priority-high');
    });

    it('should render close button', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({
        title: 'Test',
        message: 'Test',
        type: 'info',
      });
      await nextTick();

      expect(wrapper.find('.btn-close').exists()).toBe(true);
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar for auto-dismiss notifications', async () => {
      const vm = wrapper.vm as any;
      const notifId = vm.addNotification({
        title: 'Auto dismiss',
        message: 'Will auto dismiss',
        type: 'info',
        priority: 'normal',
        autoDismiss: true,
        dismissTime: 3000,
      });
      await nextTick();

      expect(wrapper.find('.notification-progress').exists()).toBe(true);
    });

    it('should calculate progress percentage correctly', async () => {
      const vm = wrapper.vm as any;
      const notifId = vm.addNotification({
        title: 'Test Progress',
        message: 'Testing progress calculation',
        type: 'info',
        priority: 'normal',
        autoDismiss: true,
        dismissTime: 5000,
      });
      await nextTick();

      const progress = vm.getProgressPercentage(notifId);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Statistics Display', () => {
    it('should display unread count', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({ title: '1', message: '1', type: 'info', read: false });
      vm.addNotification({ title: '2', message: '2', type: 'info', read: false });
      vm.addNotification({ title: '3', message: '3', type: 'info', read: true });
      await nextTick();

      expect(vm.unreadCount).toBe(2);
    });

    it('should display priority count', async () => {
      const vm = wrapper.vm as any;
      vm.addNotification({ title: '1', message: '1', type: 'info', priority: 'high' });
      vm.addNotification({ title: '2', message: '2', type: 'info', priority: 'high' });
      vm.addNotification({ title: '3', message: '3', type: 'info', priority: 'normal' });
      await nextTick();

      expect(vm.priorityCount).toBe(2);
    });
  });

  describe('Icon Mapping', () => {
    it('should return correct icon for each type', () => {
      const vm = wrapper.vm as any;
      expect(vm.getIcon('info')).toBeDefined();
      expect(vm.getIcon('error')).toBeDefined();
      expect(vm.getIcon('warning')).toBeDefined();
      expect(vm.getIcon('success')).toBeDefined();
    });
  });

  describe('Time Formatting', () => {
    it('should format timestamp correctly', () => {
      const vm = wrapper.vm as any;
      const now = new Date();
      const formatted = vm.formatTime(now);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no notifications in filtered view', async () => {
      const vm = wrapper.vm as any;
      vm.activeFilter = 'error';
      await nextTick();

      expect(wrapper.find('.empty-state').exists()).toBe(true);
      expect(wrapper.find('.empty-state').text()).toContain('알림이 없습니다');
    });
  });
});

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
