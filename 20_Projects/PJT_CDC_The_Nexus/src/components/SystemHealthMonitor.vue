<template>
  <div class="system-health-monitor">
    <div class="health-header">
      <h3>💊 시스템 상태 모니터</h3>
      <div class="header-actions">
        <button @click="runDiagnostics" class="btn-diagnose">🔧 진단 실행</button>
        <button @click="toggleDetailMode" class="btn-detail">{{ detailMode ? '간단 보기' : '상세 보기' }}</button>
      </div>
    </div>

    <div class="health-status">
      <div class="overall-status">
        <div class="status-ring" :class="getStatusClass(overallHealth)">
          <div class="ring-value">{{ overallHealth }}%</div>
          <div class="ring-label">시스템 건강도</div>
        </div>
        <div class="status-details">
          <div class="detail-item">
            <span class="label">상태</span>
            <span class="value" :class="getStatusColorClass(overallHealth)">{{ getHealthStatus(overallHealth) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">마지막 점검</span>
            <span class="value">{{ lastCheckTime }}</span>
          </div>
          <div class="detail-item">
            <span class="label">가동 시간</span>
            <span class="value">{{ uptimeHours }}시간</span>
          </div>
        </div>
      </div>
    </div>

    <div class="health-categories">
      <!-- 하드웨어 카테고리 -->
      <div class="category-card" :class="{ collapsed: collapsedCategories.includes('hardware') }">
        <div class="category-header" @click="toggleCategory('hardware')">
          <span class="icon">⚙️</span>
          <span class="name">하드웨어</span>
          <div class="category-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: categoryHealth.hardware + '%' }"></div>
            </div>
            <span class="health-text">{{ categoryHealth.hardware }}%</span>
          </div>
          <span class="collapse-icon">{{ collapsedCategories.includes('hardware') ? '▶' : '▼' }}</span>
        </div>
        <div v-if="!collapsedCategories.includes('hardware')" class="category-content">
          <div v-for="(item, index) in hardwareItems" :key="index" class="health-item">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-progress">
              <div class="progress-bar" :class="getItemStatusClass(item.value)">
                <div class="progress-fill" :style="{ width: item.value + '%' }"></div>
              </div>
            </div>
            <span class="item-value">{{ item.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 네트워크 카테고리 -->
      <div class="category-card" :class="{ collapsed: collapsedCategories.includes('network') }">
        <div class="category-header" @click="toggleCategory('network')">
          <span class="icon">🌐</span>
          <span class="name">네트워크</span>
          <div class="category-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: categoryHealth.network + '%' }"></div>
            </div>
            <span class="health-text">{{ categoryHealth.network }}%</span>
          </div>
          <span class="collapse-icon">{{ collapsedCategories.includes('network') ? '▶' : '▼' }}</span>
        </div>
        <div v-if="!collapsedCategories.includes('network')" class="category-content">
          <div v-for="(item, index) in networkItems" :key="index" class="health-item">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-progress">
              <div class="progress-bar" :class="getItemStatusClass(item.value, true)">
                <div class="progress-fill" :style="{ width: item.value + '%' }"></div>
              </div>
            </div>
            <span class="item-value">{{ item.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 저장소 카테고리 -->
      <div class="category-card" :class="{ collapsed: collapsedCategories.includes('storage') }">
        <div class="category-header" @click="toggleCategory('storage')">
          <span class="icon">💾</span>
          <span class="name">저장소</span>
          <div class="category-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: categoryHealth.storage + '%' }"></div>
            </div>
            <span class="health-text">{{ categoryHealth.storage }}%</span>
          </div>
          <span class="collapse-icon">{{ collapsedCategories.includes('storage') ? '▶' : '▼' }}</span>
        </div>
        <div v-if="!collapsedCategories.includes('storage')" class="category-content">
          <div v-for="(item, index) in storageItems" :key="index" class="health-item">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-progress">
              <div class="progress-bar" :class="getItemStatusClass(item.value)">
                <div class="progress-fill" :style="{ width: item.value + '%' }"></div>
              </div>
            </div>
            <span class="item-value">{{ item.value }}%</span>
          </div>
        </div>
      </div>

      <!-- 소프트웨어 카테고리 -->
      <div class="category-card" :class="{ collapsed: collapsedCategories.includes('software') }">
        <div class="category-header" @click="toggleCategory('software')">
          <span class="icon">📦</span>
          <span class="name">소프트웨어</span>
          <div class="category-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: categoryHealth.software + '%' }"></div>
            </div>
            <span class="health-text">{{ categoryHealth.software }}%</span>
          </div>
          <span class="collapse-icon">{{ collapsedCategories.includes('software') ? '▶' : '▼' }}</span>
        </div>
        <div v-if="!collapsedCategories.includes('software')" class="category-content">
          <div v-for="(item, index) in softwareItems" :key="index" class="health-item">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-progress">
              <div class="progress-bar" :class="getItemStatusClass(item.value)">
                <div class="progress-fill" :style="{ width: item.value + '%' }"></div>
              </div>
            </div>
            <span class="item-value">{{ item.value }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="detailMode" class="diagnostics-panel">
      <h4>📋 진단 결과</h4>
      <div class="diagnostics-list">
        <div v-for="(diagnostic, index) in diagnostics" :key="index" class="diagnostic-item" :class="diagnostic.severity">
          <span class="severity-icon">{{ diagnostic.severity === 'error' ? '❌' : diagnostic.severity === 'warning' ? '⚠️' : '✅' }}</span>
          <div class="diagnostic-content">
            <span class="title">{{ diagnostic.title }}</span>
            <span class="message">{{ diagnostic.message }}</span>
          </div>
          <span class="timestamp">{{ diagnostic.timestamp }}</span>
        </div>
      </div>
    </div>

    <div class="health-footer">
      <div class="footer-stat">
        <span class="label">정상 항목</span>
        <span class="value">{{ healthySystems }}/{{ totalSystems }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">경고</span>
        <span class="value">{{ warningCount }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">에러</span>
        <span class="value">{{ errorCount }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">자동 검사</span>
        <span class="value">{{ autoCheckEnabled ? '활성' : '비활성' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface HealthItem {
  name: string;
  value: number;
}

interface Diagnostic {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
}

const detailMode = ref(false);
const collapsedCategories = ref<string[]>([]);
const autoCheckEnabled = ref(true);

const hardwareItems = ref<HealthItem[]>([
  { name: 'CPU 온도', value: 45 },
  { name: '메모리 사용률', value: 62 },
  { name: 'GPU 상태', value: 85 },
  { name: '디스크 I/O', value: 35 }
]);

const networkItems = ref<HealthItem[]>([
  { name: '연결 상태', value: 100 },
  { name: '대역폭 사용률', value: 45 },
  { name: '패킷 손실', value: 0 },
  { name: 'DNS 응답', value: 98 }
]);

const storageItems = ref<HealthItem[]>([
  { name: '주 디스크', value: 68 },
  { name: '데이터베이스', value: 52 },
  { name: '캐시', value: 41 },
  { name: '로그', value: 35 }
]);

const softwareItems = ref<HealthItem[]>([
  { name: '업데이트 상태', value: 100 },
  { name: '라이센스', value: 90 },
  { name: '서비스 실행', value: 95 },
  { name: '보안 패치', value: 100 }
]);

const diagnostics = ref<Diagnostic[]>([
  { title: '시스템 체크', message: '모든 서비스가 정상 실행 중입니다', severity: 'info', timestamp: '00:05' },
  { title: 'CPU 모니터링', message: '온도가 정상 범위 내입니다', severity: 'info', timestamp: '00:04' },
  { title: '메모리 경고', message: '메모리 사용률이 60%를 초과했습니다', severity: 'warning', timestamp: '00:03' },
  { title: '디스크 공간', message: '주 디스크 여유 공간이 부족합니다', severity: 'warning', timestamp: '00:02' }
]);

const uptimeHours = ref(47);
const lastCheckTime = computed(() => new Date().toLocaleTimeString('ko-KR'));

const categoryHealth = computed(() => ({
  hardware: Math.round(
    hardwareItems.value.reduce((a, b) => a + b.value, 0) / hardwareItems.value.length
  ),
  network: Math.round(
    networkItems.value.reduce((a, b) => a + b.value, 0) / networkItems.value.length
  ),
  storage: Math.round(
    storageItems.value.reduce((a, b) => a + b.value, 0) / storageItems.value.length
  ),
  software: Math.round(
    softwareItems.value.reduce((a, b) => a + b.value, 0) / softwareItems.value.length
  )
}));

const overallHealth = computed(() => {
  const avg =
    (categoryHealth.value.hardware +
      categoryHealth.value.network +
      categoryHealth.value.storage +
      categoryHealth.value.software) /
    4;
  return Math.round(avg);
});

const allItems = computed(() => [
  ...hardwareItems.value,
  ...networkItems.value,
  ...storageItems.value,
  ...softwareItems.value
]);

const healthySystems = computed(() =>
  allItems.value.filter(item => item.value >= 80).length
);

const totalSystems = computed(() => allItems.value.length);

const warningCount = computed(() =>
  allItems.value.filter(item => item.value >= 60 && item.value < 80).length
);

const errorCount = computed(() =>
  allItems.value.filter(item => item.value < 60).length
);

const getStatusClass = (health: number): string => {
  if (health >= 90) return 'status-excellent';
  if (health >= 75) return 'status-good';
  if (health >= 60) return 'status-warning';
  return 'status-critical';
};

const getStatusColorClass = (health: number): string => {
  if (health >= 90) return 'color-excellent';
  if (health >= 75) return 'color-good';
  if (health >= 60) return 'color-warning';
  return 'color-critical';
};

const getHealthStatus = (health: number): string => {
  if (health >= 90) return '우수';
  if (health >= 75) return '정상';
  if (health >= 60) return '주의';
  return '위험';
};

const getItemStatusClass = (value: number, inverse = false): string => {
  if (inverse) {
    // For metrics where lower is better (packet loss, etc.)
    if (value <= 10) return 'status-excellent';
    if (value <= 30) return 'status-good';
    if (value <= 50) return 'status-warning';
    return 'status-critical';
  }
  // For metrics where higher is better
  if (value >= 90) return 'status-excellent';
  if (value >= 75) return 'status-good';
  if (value >= 60) return 'status-warning';
  return 'status-critical';
};

const toggleCategory = (category: string) => {
  const index = collapsedCategories.value.indexOf(category);
  if (index > -1) {
    collapsedCategories.value.splice(index, 1);
  } else {
    collapsedCategories.value.push(category);
  }
};

const toggleDetailMode = () => {
  detailMode.value = !detailMode.value;
};

const runDiagnostics = () => {
  hardwareItems.value.forEach(item => {
    item.value = Math.max(20, item.value + (Math.random() - 0.5) * 20);
  });
  networkItems.value.forEach(item => {
    item.value = Math.max(0, Math.min(100, item.value + (Math.random() - 0.5) * 15));
  });
  storageItems.value.forEach(item => {
    item.value = Math.max(20, Math.min(95, item.value + (Math.random() - 0.5) * 10));
  });
  softwareItems.value.forEach(item => {
    item.value = Math.max(80, item.value + (Math.random() - 0.5) * 5);
  });

  const newDiagnostic: Diagnostic = {
    title: '자동 진단 완료',
    message: `시스템 건강도: ${overallHealth.value}% - 진단 완료`,
    severity: overallHealth.value >= 80 ? 'info' : 'warning',
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  };

  diagnostics.value.unshift(newDiagnostic);
  if (diagnostics.value.length > 10) diagnostics.value.pop();
};

let autoCheckInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (autoCheckEnabled.value) {
    autoCheckInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        runDiagnostics();
      }
    }, 10000);
  }
});

onUnmounted(() => {
  if (autoCheckInterval) clearInterval(autoCheckInterval);
});

defineExpose({
  overallHealth,
  categoryHealth,
  hardwareItems,
  networkItems,
  storageItems,
  softwareItems,
  diagnostics,
  runDiagnostics
});
</script>

<style scoped>
.system-health-monitor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  height: 100%;
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.health-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-diagnose,
.btn-detail {
  padding: 6px 12px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-diagnose:hover,
.btn-detail:hover {
  opacity: 0.9;
}

.health-status {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 20px;
}

.overall-status {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.status-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.ring-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-accent);
}

.ring-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.detail-item .value {
  font-size: 13px;
  font-weight: 700;
}

.value.color-excellent {
  color: #10b981;
}

.value.color-good {
  color: #0ea5e9;
}

.value.color-warning {
  color: #f59e0b;
}

.value.color-critical {
  color: #ef4444;
}

.health-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.category-header:hover {
  background: var(--color-border);
}

.category-header .icon {
  font-size: 18px;
}

.category-header .name {
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.category-health {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.health-bar {
  width: 60px;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: var(--color-accent);
}

.health-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent);
  min-width: 30px;
}

.collapse-icon {
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.category-card.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

.category-content {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.health-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.health-item:last-child {
  border-bottom: none;
}

.item-name {
  font-size: 12px;
  color: var(--color-text-primary);
  min-width: 80px;
  font-weight: 500;
}

.item-progress {
  flex: 1;
}

.progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

.progress-bar.status-excellent .progress-fill {
  background: #10b981;
}

.progress-bar.status-good .progress-fill {
  background: #0ea5e9;
}

.progress-bar.status-warning .progress-fill {
  background: #f59e0b;
}

.progress-bar.status-critical .progress-fill {
  background: #ef4444;
}

.item-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent);
  min-width: 35px;
  text-align: right;
}

.diagnostics-panel {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 16px;
}

.diagnostics-panel h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.diagnostics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.diagnostic-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid;
}

.diagnostic-item.info {
  background: rgba(59, 130, 246, 0.1);
  border-left-color: #3b82f6;
}

.diagnostic-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border-left-color: #f59e0b;
}

.diagnostic-item.error {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #ef4444;
}

.severity-icon {
  font-size: 16px;
  min-width: 16px;
}

.diagnostic-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.diagnostic-content .title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.diagnostic-content .message {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.timestamp {
  font-size: 10px;
  color: var(--color-text-secondary);
  min-width: 35px;
  text-align: right;
}

.health-footer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 12px;
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

/* Exists in the Moment, Vanishes in Time. */
</style>

<!-- Exists in the Moment, Vanishes in Time. -->
