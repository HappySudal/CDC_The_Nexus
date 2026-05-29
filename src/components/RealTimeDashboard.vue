<template>
  <div class="realtime-dashboard">
    <!-- 상단 상태 표시줄 -->
    <div class="status-bar">
      <div class="system-status" :class="overallStatus">
        <span class="status-light"></span>
        <span class="status-text">{{ getStatusText(overallStatus) }}</span>
      </div>
      <div class="timestamp">{{ currentTime }}</div>
      <button @click="toggleAutoRefresh" class="auto-refresh-btn" :class="{ active: autoRefresh }">
        {{ autoRefresh ? '⏸️ 자동 갱신 중단' : '▶️ 자동 갱신 시작' }}
      </button>
    </div>

    <!-- 시스템 모니터링 그리드 -->
    <div class="monitoring-grid">
      <!-- Ollama 시스템 -->
      <div class="monitor-card ollama" :class="systems.ollama.status">
        <div class="card-header">
          <h3>🧠 Ollama</h3>
          <span class="status-badge" :class="systems.ollama.status">{{ systems.ollama.status }}</span>
        </div>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">CPU</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: systems.ollama.cpu + '%' }"></div>
            </div>
            <span class="metric-value">{{ systems.ollama.cpu }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">메모리</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: systems.ollama.memory + '%' }"></div>
            </div>
            <span class="metric-value">{{ systems.ollama.memory }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">응답시간</span>
            <span class="metric-value">{{ systems.ollama.latency }}ms</span>
          </div>
        </div>
        <div class="card-info">
          <p>모델: {{ systems.ollama.model }}</p>
          <p>토큰/초: {{ systems.ollama.throughput }}</p>
        </div>
      </div>

      <!-- Morning Protocol -->
      <div class="monitor-card morning" :class="systems.morning.status">
        <div class="card-header">
          <h3>📅 Morning Protocol</h3>
          <span class="status-badge" :class="systems.morning.status">{{ systems.morning.status }}</span>
        </div>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">실행률</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: systems.morning.completion + '%' }"></div>
            </div>
            <span class="metric-value">{{ systems.morning.completion }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">대기시간</span>
            <span class="metric-value">{{ systems.morning.queueTime }}ms</span>
          </div>
          <div class="metric">
            <span class="metric-label">처리량</span>
            <span class="metric-value">{{ systems.morning.throughput }} tasks/min</span>
          </div>
        </div>
        <div class="card-info">
          <p>마지막 실행: {{ formatTime(systems.morning.lastRun) }}</p>
          <p>상태: {{ systems.morning.message }}</p>
        </div>
      </div>

      <!-- TwinBrain Data -->
      <div class="monitor-card twinbrain" :class="systems.twinbrain.status">
        <div class="card-header">
          <h3>🧬 TwinBrain</h3>
          <span class="status-badge" :class="systems.twinbrain.status">{{ systems.twinbrain.status }}</span>
        </div>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">저장소 용량</span>
            <div class="metric-bar">
              <div class="metric-fill" :style="{ width: systems.twinbrain.storageUsage + '%' }"></div>
            </div>
            <span class="metric-value">{{ systems.twinbrain.storageUsage }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">동기화</span>
            <span class="metric-value">{{ systems.twinbrain.syncStatus }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">데이터 포인트</span>
            <span class="metric-value">{{ systems.twinbrain.dataPoints }}</span>
          </div>
        </div>
        <div class="card-info">
          <p>Vault: {{ systems.twinbrain.vaultSize }}GB</p>
          <p>Raw: {{ systems.twinbrain.rawSize }}GB</p>
        </div>
      </div>

      <!-- Nexus App -->
      <div class="monitor-card nexus" :class="systems.nexus.status">
        <div class="card-header">
          <h3>🌌 Nexus</h3>
          <span class="status-badge" :class="systems.nexus.status">{{ systems.nexus.status }}</span>
        </div>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">프로세스 상태</span>
            <span class="metric-value">{{ systems.nexus.processState }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">활성 창</span>
            <span class="metric-value">{{ systems.nexus.activeWindows }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">최근 오류</span>
            <span class="metric-value" :class="{ 'has-error': systems.nexus.errors > 0 }">
              {{ systems.nexus.errors }} 건
            </span>
          </div>
        </div>
        <div class="card-info">
          <p>버전: {{ systems.nexus.version }}</p>
          <p>마지막 업데이트: {{ formatTime(systems.nexus.lastUpdate) }}</p>
        </div>
      </div>
    </div>

    <!-- 활동 로그 -->
    <div class="activity-log">
      <div class="log-header">
        <h3>📋 실시간 활동 로그</h3>
        <button @click="clearLogs" class="clear-btn">로그 초기화</button>
      </div>
      <div class="log-container">
        <div v-if="activityLogs.length === 0" class="no-logs">
          로그가 없습니다.
        </div>
        <div v-for="(log, idx) in activityLogs" :key="idx" class="log-entry" :class="log.level">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-system">[{{ log.system }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 성능 차트 -->
    <div class="performance-section">
      <div class="chart-container">
        <h3>시스템 성능 추이 (최근 1시간)</h3>
        <div class="chart-placeholder">
          <div class="chart-line">
            <svg viewBox="0 0 400 100" class="simple-chart">
              <polyline
                points="0,80 50,60 100,70 150,50 200,45 250,55 300,40 350,50 400,35"
                fill="none"
                stroke="#0ea5e9"
                stroke-width="2"
              />
              <line x1="0" y1="90" x2="400" y2="90" stroke="#1a2f5f" stroke-width="1" />
            </svg>
          </div>
          <div class="chart-labels">
            <span>-1h</span>
            <span>-30m</span>
            <span>현재</span>
          </div>
        </div>
      </div>

      <div class="alerts-container">
        <h3>⚠️ 알림</h3>
        <div v-if="alerts.length === 0" class="no-alerts">
          활성 알림이 없습니다.
        </div>
        <div v-for="(alert, idx) in alerts" :key="idx" class="alert-item" :class="alert.severity">
          <span class="alert-icon">{{ getSeverityIcon(alert.severity) }}</span>
          <div class="alert-content">
            <p class="alert-title">{{ alert.title }}</p>
            <p class="alert-message">{{ alert.message }}</p>
          </div>
          <button @click="dismissAlert(idx)" class="dismiss-btn">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';

const currentTime = ref('');
const autoRefresh = ref(true);
let refreshInterval = null;
let timeInterval = null;

const systems = reactive({
  ollama: {
    status: 'healthy',
    cpu: 45,
    memory: 62,
    latency: 120,
    model: 'llama2:7b',
    throughput: 180
  },
  morning: {
    status: 'healthy',
    completion: 92,
    queueTime: 45,
    throughput: 15,
    lastRun: new Date(Date.now() - 30 * 60000),
    message: '정상 실행 중'
  },
  twinbrain: {
    status: 'healthy',
    storageUsage: 71,
    syncStatus: '동기화 완료',
    dataPoints: 45230,
    vaultSize: 2.3,
    rawSize: 1.8
  },
  nexus: {
    status: 'healthy',
    processState: '실행 중',
    activeWindows: 3,
    errors: 0,
    version: 'v0.1.0',
    lastUpdate: new Date(Date.now() - 2 * 60 * 60000)
  }
});

const activityLogs = ref([
  {
    timestamp: new Date(),
    system: 'Nexus',
    level: 'info',
    message: 'ConstitutionViewer 컴포넌트 로드 완료'
  },
  {
    timestamp: new Date(Date.now() - 60000),
    system: 'TwinBrain',
    level: 'info',
    message: '데이터 동기화 완료 (45,230개 포인트)'
  },
  {
    timestamp: new Date(Date.now() - 120000),
    system: 'Ollama',
    level: 'info',
    message: '모델 추론 요청 처리 완료'
  }
]);

const alerts = ref([
  {
    severity: 'warning',
    title: 'Ollama 메모리 사용량',
    message: '메모리 사용량이 60% 초과했습니다. 모니터링 필요.'
  }
]);

const overallStatus = computed(() => {
  const statuses = Object.values(systems).map(s => s.status);
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'healthy';
});

function updateTime() {
  const now = new Date();
  // 안정적인 시간 형식: YYYY-MM-DD HH:mm:ss
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    clearInterval(refreshInterval);
  }
}

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    updateMetrics();
  }, 5000);
}

function updateMetrics() {
  systems.ollama.cpu = Math.max(20, Math.min(80, systems.ollama.cpu + (Math.random() - 0.5) * 10));
  systems.ollama.memory = Math.max(50, Math.min(75, systems.ollama.memory + (Math.random() - 0.5) * 5));
  updateTime();
}

function clearLogs() {
  activityLogs.value = [];
}

function dismissAlert(idx) {
  alerts.value.splice(idx, 1);
}

function getStatusText(status) {
  const texts = {
    healthy: '🟢 정상',
    warning: '🟡 주의',
    critical: '🔴 위험'
  };
  return texts[status] || '상태 불명';
}

function getSeverityIcon(severity) {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨'
  };
  return icons[severity] || '❓';
}

function formatTime(date) {
  if (!date) return '-';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

onMounted(() => {
  updateTime();
  timeInterval = setInterval(() => updateTime(), 1000);
  startAutoRefresh();

  // IPC 리스너
  if (window.electronAPI) {
    window.electronAPI.onSystemMetrics?.((metrics) => {
      if (metrics.ollama) {
        Object.assign(systems.ollama, metrics.ollama);
      }
    });

    window.electronAPI.onActivityLog?.((log) => {
      activityLogs.value.unshift(log);
      if (activityLogs.value.length > 50) {
        activityLogs.value.pop();
      }
    });

    window.electronAPI.onAlert?.((alert) => {
      alerts.value.unshift(alert);
      if (alerts.value.length > 10) {
        alerts.value.pop();
      }
    });
  }
});

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.realtime-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #0a0e27;
  color: #e0e6ed;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #0a0e27 0%, #0f1a38 100%);
  border: 1px solid #1a2f5f;
  border-radius: 8px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.status-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.system-status.healthy .status-light {
  background-color: #22c55e;
}

.system-status.warning .status-light {
  background-color: #fbbf24;
}

.system-status.critical .status-light {
  background-color: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timestamp {
  font-size: 13px;
  color: #7a8ba0;
}

.auto-refresh-btn {
  padding: 8px 16px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.auto-refresh-btn:hover {
  background-color: #0d95d3;
}

.auto-refresh-btn.active {
  background-color: #22c55e;
}

.monitoring-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.monitor-card {
  padding: 16px;
  background-color: #0f1a38;
  border: 2px solid #1a2f5f;
  border-radius: 8px;
  transition: all 0.3s;
}

.monitor-card:hover {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.monitor-card.healthy {
  border-left: 4px solid #22c55e;
}

.monitor-card.warning {
  border-left: 4px solid #fbbf24;
  background-color: rgba(251, 191, 36, 0.05);
}

.monitor-card.critical {
  border-left: 4px solid #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1a2f5f;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #0ea5e9;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.healthy {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.warning {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-badge.critical {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.card-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #7a8ba0;
  font-weight: 500;
}

.metric-bar {
  height: 6px;
  background-color: #1a2f5f;
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #22c55e);
  transition: width 0.3s ease;
}

.metric-value {
  font-size: 13px;
  color: #c4d0df;
  font-weight: 600;
}

.card-info {
  padding-top: 8px;
  border-top: 1px solid #1a2f5f;
  font-size: 12px;
  color: #7a8ba0;
}

.card-info p {
  margin: 4px 0;
}

.activity-log {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1a2f5f;
}

.log-header h3 {
  margin: 0;
  color: #0ea5e9;
}

.clear-btn {
  padding: 6px 12px;
  background-color: #1a2f5f;
  color: #7a8ba0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background-color: #253551;
  color: #0ea5e9;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-logs {
  text-align: center;
  padding: 20px;
  color: #7a8ba0;
  font-size: 12px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #0a0e27;
}

.log-entry.info {
  color: #c4d0df;
}

.log-entry.warning {
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.05);
}

.log-entry.error {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.log-time {
  color: #7a8ba0;
  min-width: 80px;
}

.log-system {
  font-weight: 600;
  color: #0ea5e9;
  min-width: 80px;
}

.log-message {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.performance-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-container,
.alerts-container {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
}

.chart-container h3,
.alerts-container h3 {
  margin: 0 0 12px 0;
  color: #0ea5e9;
  font-size: 14px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-line {
  width: 100%;
  height: 150px;
  background-color: #0a0e27;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

.simple-chart {
  width: 100%;
  height: 100%;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #7a8ba0;
}

.no-alerts {
  text-align: center;
  padding: 16px;
  color: #7a8ba0;
  font-size: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #0a0e27;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #1a2f5f;
}

.alert-item.warning {
  border-left-color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.05);
}

.alert-item.critical {
  border-left-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.alert-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #c4d0df;
}

.alert-message {
  margin: 0;
  font-size: 11px;
  color: #7a8ba0;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #7a8ba0;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.dismiss-btn:hover {
  color: #0ea5e9;
}

@media (max-width: 768px) {
  .performance-section {
    grid-template-columns: 1fr;
  }

  .status-bar {
    flex-direction: column;
    gap: 12px;
  }

  .monitoring-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
