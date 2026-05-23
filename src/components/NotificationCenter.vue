<template>
  <div class="notification-center">
    <div class="notifications-container">
      <div
        v-for="(notification, index) in activeNotifications"
        :key="notification.id"
        :class="['notification', `type-${notification.type}`, `priority-${notification.priority}`]"
      >
        <div class="notification-header">
          <span class="icon">{{ getIcon(notification.type) }}</span>
          <h4 class="title">{{ notification.title }}</h4>
          <button @click="dismissNotification(index)" class="btn-close">✕</button>
        </div>
        <p class="message">{{ notification.message }}</p>
        <div v-if="notification.action" class="notification-action">
          <button @click="handleAction(notification, index)" class="btn-action">
            {{ notification.action.label }}
          </button>
        </div>
        <div class="notification-progress" v-if="notification.autoDismiss">
          <div class="progress-bar" :style="{ width: getProgressPercentage(notification.id) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="notification-panel">
      <div class="panel-header">
        <h3>알림 센터</h3>
        <button @click="clearAll" class="btn-clear" v-if="allNotifications.length > 0">모두 삭제</button>
      </div>

      <div class="notification-tabs">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeFilter = tab"
          :class="['tab-btn', { active: activeFilter === tab }]"
        >
          {{ getTabLabel(tab) }}
        </button>
      </div>

      <div class="notification-history">
        <div v-if="filteredNotifications.length === 0" class="empty-state">
          알림이 없습니다.
        </div>
        <div
          v-for="(notification, index) in filteredNotifications"
          :key="notification.id"
          :class="['history-item', `type-${notification.type}`]"
          @click="focusNotification(notification)"
        >
          <span class="timestamp">{{ formatTime(notification.timestamp) }}</span>
          <span class="icon">{{ getIcon(notification.type) }}</span>
          <div class="content">
            <h5>{{ notification.title }}</h5>
            <p>{{ notification.message.substring(0, 100) }}{{ notification.message.length > 100 ? '...' : '' }}</p>
          </div>
          <span class="status" :class="{ read: notification.read }">
            {{ notification.read ? '읽음' : '새로움' }}
          </span>
        </div>
      </div>

      <div class="panel-stats">
        <div class="stat">
          <span class="label">총 알림</span>
          <span class="value">{{ allNotifications.length }}</span>
        </div>
        <div class="stat">
          <span class="label">읽지 않음</span>
          <span class="value">{{ unreadCount }}</span>
        </div>
        <div class="stat">
          <span class="label">중요</span>
          <span class="value">{{ priorityCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoDismiss: boolean;
  dismissTime?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

const allNotifications = ref<Notification[]>([]);
const activeFilter = ref<'all' | 'active' | 'success' | 'error' | 'warning' | 'info'>('all');
const dismissTimers = ref<Map<string, ReturnType<typeof setTimeout>>>(new Map());

const tabs = ['all', 'active', 'success', 'error', 'warning', 'info'] as const;

const activeNotifications = computed(() => {
  return allNotifications.value.filter(n => {
    if (activeFilter.value === 'all') return true;
    if (activeFilter.value === 'active') return !n.read;
    return n.type === activeFilter.value;
  });
});

const filteredNotifications = computed(() => {
  let filtered = allNotifications.value;

  if (activeFilter.value === 'active') {
    filtered = filtered.filter(n => !n.read);
  } else if (activeFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === activeFilter.value);
  }

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
});

const unreadCount = computed(() => {
  return allNotifications.value.filter(n => !n.read).length;
});

const priorityCount = computed(() => {
  return allNotifications.value.filter(n => n.priority === 'critical' || n.priority === 'high').length;
});

const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ'
  };
  return icons[type] || 'ⓘ';
};

const getTabLabel = (tab: string): string => {
  const labels: Record<string, string> = {
    all: '모든 알림',
    active: '활성',
    success: '성공',
    error: '오류',
    warning: '경고',
    info: '정보'
  };
  return labels[tab] || tab;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ko-KR');
};

const getProgressPercentage = (notificationId: string): number => {
  const notification = allNotifications.value.find(n => n.id === notificationId);
  if (!notification || !notification.autoDismiss || !notification.dismissTime) return 100;

  const created = notification.timestamp.getTime();
  const now = Date.now();
  const elapsed = now - created;
  const remaining = Math.max(0, (notification.dismissTime - elapsed) / notification.dismissTime);

  return remaining * 100;
};

const addNotification = (options: Omit<Notification, 'id' | 'timestamp' | 'read'> & { dismissTime?: number }) => {
  const id = `notif-${Date.now()}-${Math.random()}`;
  const notification: Notification = {
    id,
    timestamp: new Date(),
    read: false,
    autoDismiss: options.autoDismiss ?? true,
    dismissTime: options.dismissTime ?? 5000,
    ...options
  };

  allNotifications.value.unshift(notification);

  if (notification.autoDismiss && notification.dismissTime) {
    const timer = setTimeout(() => {
      dismissNotification(allNotifications.value.findIndex(n => n.id === id));
    }, notification.dismissTime);

    dismissTimers.value.set(id, timer);
  }

  return id;
};

const dismissNotification = (index: number) => {
  if (index >= 0 && index < allNotifications.value.length) {
    const notification = allNotifications.value[index];
    const timer = dismissTimers.value.get(notification.id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.value.delete(notification.id);
    }
    allNotifications.value.splice(index, 1);
  }
};

const clearAll = () => {
  dismissTimers.value.forEach(timer => clearTimeout(timer));
  dismissTimers.value.clear();
  allNotifications.value = [];
};

const focusNotification = (notification: Notification) => {
  const index = allNotifications.value.findIndex(n => n.id === notification.id);
  if (index >= 0) {
    allNotifications.value[index].read = true;
  }
};

const handleAction = (notification: Notification, index: number) => {
  if (notification.action) {
    notification.action.callback();
  }
  dismissNotification(index);
};

defineExpose({ addNotification, dismissNotification, clearAll, allNotifications });
</script>

<style scoped>
.notification-center {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  height: 100%;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.notification {
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-left: 4px solid;
  border-radius: 6px;
  animation: slideIn 0.3s ease-out;
}

.notification.type-success {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.notification.type-error {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.notification.type-warning {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.notification.type-info {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification .icon {
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  font-size: 14px;
}

.notification .title {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.notification .btn-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.notification .btn-close:hover {
  background: var(--color-border);
}

.notification .message {
  margin: 0 0 8px 28px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.notification-action {
  margin-left: 28px;
  margin-bottom: 8px;
}

.notification-action .btn-action {
  padding: 4px 12px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.notification-action .btn-action:hover {
  opacity: 0.9;
}

.notification-progress {
  margin-left: 28px;
  height: 2px;
  background: var(--color-border);
  border-radius: 1px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.1s linear;
}

.notification-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.btn-clear {
  padding: 4px 12px;
  background: transparent;
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-clear:hover {
  background: rgba(14, 165, 233, 0.1);
}

.notification-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.notification-history {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.history-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  transition: background 0.2s;
}

.history-item:hover {
  background: rgba(14, 165, 233, 0.1);
}

.history-item.type-success {
  border-left: 3px solid #10b981;
}

.history-item.type-error {
  border-left: 3px solid #ef4444;
}

.history-item.type-warning {
  border-left: 3px solid #f59e0b;
}

.history-item.type-info {
  border-left: 3px solid #3b82f6;
}

.history-item .timestamp {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 50px;
}

.history-item .icon {
  font-weight: bold;
  min-width: 16px;
  text-align: center;
  font-size: 12px;
}

.history-item .content {
  flex: 1;
  min-width: 0;
}

.history-item .content h5 {
  margin: 0 0 2px 0;
  font-size: 12px;
  color: var(--color-text-primary);
}

.history-item .content p {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: normal;
  word-break: break-word;
}

.history-item .status {
  font-size: 11px;
  color: var(--color-accent);
  white-space: nowrap;
}

.history-item .status.read {
  color: var(--color-text-secondary);
}

.panel-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border-top: 1px solid var(--color-border);
  padding: 12px 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border-right: 1px solid var(--color-border);
}

.stat:last-child {
  border-right: none;
}

.stat .label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stat .value {
  font-size: 16px;
  color: var(--color-accent);
  font-weight: bold;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* Exists in the Moment, Vanishes in Time. */
</style>

<!-- Exists in the Moment, Vanishes in Time. -->
