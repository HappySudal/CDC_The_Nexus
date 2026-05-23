<template>
  <div class="analytics-dashboard">
    <div class="analytics-header">
      <h3>📊 실시간 분석 대시보드</h3>
      <div class="header-controls">
        <select v-model="selectedMetric" class="metric-selector">
          <option value="all">모든 지표</option>
          <option value="performance">성능</option>
          <option value="stability">안정성</option>
          <option value="resource">리소스</option>
        </select>
        <button @click="refreshMetrics" class="btn-refresh">🔄 새로고침</button>
      </div>
    </div>

    <div class="metrics-grid">
      <!-- 성능 지표 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'performance' }">
        <div class="metric-label">응답 시간 (ms)</div>
        <div class="metric-value">{{ metrics.responseTime }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.responseTime, 100)">
          {{ getStatusText(metrics.responseTime, 100) }}
        </div>
        <div class="metric-chart">
          <div class="sparkline">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline :points="getSparklinePoints('responseTime')" fill="none" stroke="var(--color-accent)" stroke-width="1" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 처리량 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'performance' }">
        <div class="metric-label">처리량 (req/s)</div>
        <div class="metric-value">{{ metrics.throughput }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.throughput, 50, true)">
          {{ getStatusText(metrics.throughput, 50, true) }}
        </div>
        <div class="metric-chart">
          <div class="sparkline">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline :points="getSparklinePoints('throughput')" fill="none" stroke="#10b981" stroke-width="1" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 가용성 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'stability' }">
        <div class="metric-label">가용성 (%)</div>
        <div class="metric-value">{{ metrics.availability }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.availability, 95, true)">
          {{ getStatusText(metrics.availability, 95, true) }}
        </div>
        <div class="metric-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: metrics.availability + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 에러율 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'stability' }">
        <div class="metric-label">에러율 (%)</div>
        <div class="metric-value">{{ metrics.errorRate }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.errorRate, 5)">
          {{ getStatusText(metrics.errorRate, 5) }}
        </div>
        <div class="metric-progress">
          <div class="progress-bar error">
            <div class="progress-fill" :style="{ width: metrics.errorRate + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- CPU 사용률 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'resource' }">
        <div class="metric-label">CPU 사용률 (%)</div>
        <div class="metric-value">{{ metrics.cpuUsage }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.cpuUsage, 70)">
          {{ getStatusText(metrics.cpuUsage, 70) }}
        </div>
        <div class="metric-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: metrics.cpuUsage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 메모리 사용률 -->
      <div class="metric-card" :class="{ hidden: selectedMetric !== 'all' && selectedMetric !== 'resource' }">
        <div class="metric-label">메모리 사용률 (%)</div>
        <div class="metric-value">{{ metrics.memoryUsage }}</div>
        <div class="metric-status" :class="getStatusClass(metrics.memoryUsage, 75)">
          {{ getStatusText(metrics.memoryUsage, 75) }}
        </div>
        <div class="metric-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: metrics.memoryUsage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="analytics-footer">
      <div class="footer-stat">
        <span class="label">총 요청</span>
        <span class="value">{{ totalRequests }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">총 에러</span>
        <span class="value">{{ totalErrors }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">평균 응답 시간</span>
        <span class="value">{{ avgResponseTime }}ms</span>
      </div>
      <div class="footer-stat">
        <span class="label">마지막 업데이트</span>
        <span class="value">{{ lastUpdateTime }}</span>
      </div>
    </div>

    <div class="analytics-trends">
      <h4>📈 추세 분석</h4>
      <div class="trends-list">
        <div v-for="(trend, index) in trends" :key="index" class="trend-item" :class="{ positive: trend.direction === 'up', negative: trend.direction === 'down' }">
          <span class="trend-icon">{{ trend.direction === 'up' ? '📈' : '📉' }}</span>
          <span class="trend-name">{{ trend.name }}</span>
          <span class="trend-value">{{ trend.value }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Metrics {
  responseTime: number;
  throughput: number;
  availability: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface Trend {
  name: string;
  direction: 'up' | 'down';
  value: number;
}

interface HistoryEntry {
  responseTime: number;
  throughput: number;
}

const selectedMetric = ref<'all' | 'performance' | 'stability' | 'resource'>('all');
const metrics = ref<Metrics>({
  responseTime: 45,
  throughput: 125,
  availability: 99.8,
  errorRate: 0.2,
  cpuUsage: 35,
  memoryUsage: 52
});

const history = ref<HistoryEntry[]>([
  { responseTime: 48, throughput: 120 },
  { responseTime: 46, throughput: 123 },
  { responseTime: 45, throughput: 125 },
  { responseTime: 44, throughput: 128 }
]);

const trends = ref<Trend[]>([
  { name: '응답 시간', direction: 'down', value: 3.2 },
  { name: '처리량', direction: 'up', value: 5.1 },
  { name: '가용성', direction: 'up', value: 0.5 },
  { name: '에러율', direction: 'down', value: 15.3 }
]);

const totalRequests = computed(() => Math.floor(Math.random() * 1000000 + 500000));
const totalErrors = computed(() => Math.floor(metrics.value.errorRate * totalRequests.value / 100));
const avgResponseTime = computed(() => Math.round(history.value.reduce((a, b) => a + b.responseTime, 0) / history.value.length));
const lastUpdateTime = computed(() => new Date().toLocaleTimeString('ko-KR'));

let refreshInterval: ReturnType<typeof setInterval> | null = null;

const getStatusClass = (value: number, threshold: number, inverse = false): string => {
  if (inverse) {
    return value >= threshold ? 'status-good' : value >= threshold * 0.8 ? 'status-warning' : 'status-critical';
  }
  return value <= threshold ? 'status-good' : value <= threshold * 1.5 ? 'status-warning' : 'status-critical';
};

const getStatusText = (value: number, threshold: number, inverse = false): string => {
  if (inverse) {
    if (value >= threshold) return '좋음';
    if (value >= threshold * 0.8) return '주의';
    return '위험';
  }
  if (value <= threshold) return '좋음';
  if (value <= threshold * 1.5) return '주의';
  return '위험';
};

const getSparklinePoints = (type: 'responseTime' | 'throughput'): string => {
  const values = history.value.map(h => h[type]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 25;
      return `${x},${y}`;
    })
    .join(' ');
};

const refreshMetrics = () => {
  metrics.value = {
    responseTime: Math.max(20, metrics.value.responseTime + (Math.random() - 0.5) * 20),
    throughput: Math.max(50, metrics.value.throughput + (Math.random() - 0.5) * 30),
    availability: Math.min(100, Math.max(95, metrics.value.availability + (Math.random() - 0.5) * 2)),
    errorRate: Math.max(0, Math.min(5, metrics.value.errorRate + (Math.random() - 0.5) * 1)),
    cpuUsage: Math.max(10, Math.min(90, metrics.value.cpuUsage + (Math.random() - 0.5) * 15)),
    memoryUsage: Math.max(20, Math.min(95, metrics.value.memoryUsage + (Math.random() - 0.5) * 10))
  };

  history.value.push({
    responseTime: metrics.value.responseTime,
    throughput: metrics.value.throughput
  });
  if (history.value.length > 10) history.value.shift();

  updateTrends();
};

const updateTrends = () => {
  if (history.value.length < 2) return;
  const current = history.value[history.value.length - 1];
  const previous = history.value[history.value.length - 2];

  trends.value = [
    {
      name: '응답 시간',
      direction: current.responseTime < previous.responseTime ? 'down' : 'up',
      value: Math.abs(((current.responseTime - previous.responseTime) / previous.responseTime) * 100)
    },
    {
      name: '처리량',
      direction: current.throughput > previous.throughput ? 'up' : 'down',
      value: Math.abs(((current.throughput - previous.throughput) / previous.throughput) * 100)
    },
    {
      name: '가용성',
      direction: metrics.value.availability > 99.5 ? 'up' : 'down',
      value: Math.abs(100 - metrics.value.availability)
    },
    {
      name: '에러율',
      direction: metrics.value.errorRate < 1 ? 'down' : 'up',
      value: metrics.value.errorRate
    }
  ];
};

onMounted(() => {
  refreshInterval = setInterval(() => {
    refreshMetrics();
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

defineExpose({ metrics, trends, refreshMetrics, history });
</script>

<style scoped>
.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  height: 100%;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.analytics-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
  font-weight: 700;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.metric-selector {
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
}

.btn-refresh {
  padding: 6px 12px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-refresh:hover {
  opacity: 0.9;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-card.hidden {
  display: none;
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 8px;
}

.metric-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 3px;
  display: inline-block;
  margin-bottom: 12px;
}

.metric-status.status-good {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.metric-status.status-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.metric-status.status-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.metric-chart {
  margin-top: 12px;
}

.sparkline {
  width: 100%;
  height: 30px;
}

.metric-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar .progress-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar.error .progress-fill {
  background: #ef4444;
}

.analytics-footer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.footer-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-stat .label {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
}

.footer-stat .value {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent);
}

.analytics-trends {
  padding: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.analytics-trends h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.trends-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  font-size: 12px;
}

.trend-item.positive {
  border-left: 2px solid #10b981;
}

.trend-item.negative {
  border-left: 2px solid #ef4444;
}

.trend-icon {
  font-size: 16px;
  min-width: 16px;
}

.trend-name {
  flex: 1;
  color: var(--color-text-secondary);
}

.trend-value {
  font-weight: 700;
  color: var(--color-accent);
}

/* Exists in the Moment, Vanishes in Time. */
</style>

<!-- Exists in the Moment, Vanishes in Time. -->
