<template>
  <div class="log-viewer">
    <div class="header">
      <h2>System Logs</h2>
      <div class="controls">
        <button @click="clearLogs" class="btn-action">Clear Logs</button>
        <button @click="exportLogs" class="btn-action">Export</button>
        <select v-model="filterLevel" class="filter-select">
          <option value="">All Levels</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
        </select>
      </div>
    </div>

    <div class="log-stats">
      <div class="stat-card">
        <span class="stat-label">Total Logs</span>
        <span class="stat-value">{{ totalLogs }}</span>
      </div>
      <div class="stat-card error">
        <span class="stat-label">Errors</span>
        <span class="stat-value">{{ errorCount }}</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-label">Warnings</span>
        <span class="stat-value">{{ warningCount }}</span>
      </div>
    </div>

    <div class="log-container">
      <div
        v-if="filteredLogs.length === 0"
        class="empty-state"
      >
        No logs found
      </div>
      <div
        v-for="(log, idx) in filteredLogs"
        :key="idx"
        :class="['log-entry', `level-${log.level}`]"
      >
        <span class="timestamp">{{ formatTime(log.timestamp) }}</span>
        <span class="level-badge" :class="log.level">{{ log.level.toUpperCase() }}</span>
        <span class="message">{{ log.message }}</span>
      </div>
    </div>

    <div class="footer">
      <span class="info-text">Showing {{ filteredLogs.length }} of {{ totalLogs }} logs</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
}

const logs = ref<LogEntry[]>([]);
const filterLevel = ref<string>('');

const totalLogs = computed(() => logs.value.length);

const errorCount = computed(() =>
  logs.value.filter(l => l.level === 'error').length
);

const warningCount = computed(() =>
  logs.value.filter(l => l.level === 'warning').length
);

const filteredLogs = computed(() => {
  if (!filterLevel.value) return logs.value;
  return logs.value.filter(l => l.level === filterLevel.value);
});

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

const clearLogs = () => {
  if (confirm('Clear all logs?')) {
    logs.value = [];
  }
};

const exportLogs = () => {
  const csv = logs.value
    .map(l => `${l.timestamp.toISOString()},${l.level},${l.message}`)
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs_${Date.now()}.csv`;
  a.click();
};

// Public method for external log injection
const addLog = (level: LogEntry['level'], message: string) => {
  logs.value.push({
    timestamp: new Date(),
    level,
    message
  });
};

defineExpose({ addLog, logs });
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
}

.header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-action {
  padding: 6px 12px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-action:hover {
  background: var(--color-accent-hover);
}

.filter-select {
  padding: 6px 10px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
}

.log-stats {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.stat-card {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border-radius: 4px;
  min-width: 100px;
}

.stat-card.error {
  border-left: 3px solid #ef4444;
}

.stat-card.warning {
  border-left: 3px solid #f59e0b;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text-primary);
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: var(--color-bg-primary);
  border-left: 3px solid transparent;
  font-family: monospace;
  font-size: 12px;
}

.log-entry.level-error {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.log-entry.level-warning {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.log-entry.level-info {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.log-entry.level-debug {
  border-left-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
}

.timestamp {
  color: var(--color-text-secondary);
  min-width: 60px;
}

.level-badge {
  font-weight: bold;
  padding: 0 4px;
  border-radius: 2px;
  min-width: 60px;
  text-align: center;
}

.level-badge.error {
  background: #ef4444;
  color: white;
}

.level-badge.warning {
  background: #f59e0b;
  color: white;
}

.level-badge.info {
  background: #3b82f6;
  color: white;
}

.level-badge.debug {
  background: #8b5cf6;
  color: white;
}

.message {
  flex: 1;
  color: var(--color-text-primary);
  word-break: break-word;
}

.footer {
  padding: 8px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
