<template>
  <div class="agent-dashboard">
    <!-- 헤더 -->
    <div class="dashboard-header">
      <h2>🤖 에이전트 모니터링 대시보드</h2>
      <div class="header-controls">
        <button @click="refreshData" :disabled="isRefreshing" class="refresh-btn">
          {{ isRefreshing ? '새로고침 중...' : '🔄 새로고침' }}
        </button>
        <select v-model="viewMode" class="view-selector">
          <option value="list">목록 보기</option>
          <option value="grid">격자 보기</option>
          <option value="stats">통계 보기</option>
        </select>
      </div>
    </div>

    <!-- 전체 통계 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-value">{{ totalAgents }}</div>
        <div class="stat-label">전체 에이전트</div>
      </div>
      <div class="stat-card">
        <div class="stat-value active">{{ activeCount }}</div>
        <div class="stat-label">활성</div>
      </div>
      <div class="stat-card">
        <div class="stat-value idle">{{ idleCount }}</div>
        <div class="stat-label">대기</div>
      </div>
      <div class="stat-card">
        <div class="stat-value error">{{ errorCount }}</div>
        <div class="stat-label">오류</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgResponseTime }}ms</div>
        <div class="stat-label">평균 응답시간</div>
      </div>
    </div>

    <!-- 필터 및 검색 -->
    <div class="filter-bar">
      <input
        v-model="filterQuery"
        type="text"
        placeholder="에이전트 이름이나 역할로 검색..."
        @input="applyFilters"
        class="filter-input"
      />
      <select v-model="filterStatus" @change="applyFilters" class="filter-select">
        <option value="">모든 상태</option>
        <option value="active">활성</option>
        <option value="idle">대기</option>
        <option value="error">오류</option>
      </select>
    </div>

    <!-- 목록 보기 -->
    <div v-if="viewMode === 'list'" class="agents-list">
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="agent-card-list"
        :class="{ [agent.status]: true }"
      >
        <div class="agent-info">
          <div class="agent-header">
            <span class="agent-name">{{ agent.name }}</span>
            <span class="status-badge" :class="agent.status">{{ getStatusLabel(agent.status) }}</span>
          </div>
          <p class="agent-role">{{ agent.role }}</p>
          <div class="agent-stats-inline">
            <span>📊 작업: {{ agent.tasksCompleted }}/{{ agent.tasksTotal }}</span>
            <span>⏱️ 응답: {{ agent.responseTime }}ms</span>
            <span>🔄 가동율: {{ agent.uptime }}%</span>
          </div>
        </div>
        <div class="agent-actions">
          <button @click="viewAgentDetails(agent)" class="action-btn detail-btn">
            상세
          </button>
          <button @click="executeCommand(agent.id)" class="action-btn command-btn">
            명령
          </button>
        </div>
      </div>
    </div>

    <!-- 격자 보기 -->
    <div v-if="viewMode === 'grid'" class="agents-grid">
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="agent-card-grid"
        :class="{ [agent.status]: true }"
        @click="viewAgentDetails(agent)"
      >
        <div class="card-header">
          <h3>{{ agent.name }}</h3>
          <span class="status-indicator" :class="agent.status"></span>
        </div>
        <p class="card-role">{{ agent.role }}</p>
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-value">{{ agent.tasksCompleted }}</span>
            <span class="metric-label">작업</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ agent.responseTime }}</span>
            <span class="metric-label">ms</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ agent.uptime }}</span>
            <span class="metric-label">%</span>
          </div>
        </div>
        <div class="card-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: agent.uptime + '%' }"></div>
          </div>
          <span class="progress-label">가동율</span>
        </div>
      </div>
    </div>

    <!-- 통계 보기 -->
    <div v-if="viewMode === 'stats'" class="stats-view">
      <div class="stats-grid">
        <div class="stat-section">
          <h3>시스템 상태</h3>
          <div class="chart-placeholder">
            <div class="status-distribution">
              <div class="status-item">
                <span class="status-name">활성</span>
                <span class="status-count">{{ activeCount }}</span>
              </div>
              <div class="status-item">
                <span class="status-name">대기</span>
                <span class="status-count">{{ idleCount }}</span>
              </div>
              <div class="status-item">
                <span class="status-name">오류</span>
                <span class="status-count">{{ errorCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-section">
          <h3>작업 완료도</h3>
          <div class="completion-stats">
            <div v-for="agent in filteredAgents" :key="agent.id" class="completion-item">
              <span class="agent-name-small">{{ agent.name }}</span>
              <div class="completion-bar">
                <div
                  class="completion-fill"
                  :style="{ width: (agent.tasksCompleted / agent.tasksTotal * 100) + '%' }"
                ></div>
              </div>
              <span class="completion-percent">
                {{ Math.round(agent.tasksCompleted / agent.tasksTotal * 100) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="stat-section">
          <h3>응답시간 (평균)</h3>
          <div class="response-times">
            <div v-for="agent in filteredAgents" :key="agent.id" class="response-item">
              <span class="agent-name-small">{{ agent.name }}</span>
              <span class="response-value">{{ agent.responseTime }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 에이전트 상세 정보 모달 -->
    <div v-if="selectedAgent" class="modal-overlay" @click="selectedAgent = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedAgent.name }} - 상세 정보</h2>
          <button @click="selectedAgent = null" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h3>기본 정보</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">역할</span>
                <span class="value">{{ selectedAgent.role }}</span>
              </div>
              <div class="detail-item">
                <span class="label">상태</span>
                <span class="value" :class="selectedAgent.status">
                  {{ getStatusLabel(selectedAgent.status) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="label">가동율</span>
                <span class="value">{{ selectedAgent.uptime }}%</span>
              </div>
              <div class="detail-item">
                <span class="label">응답시간</span>
                <span class="value">{{ selectedAgent.responseTime }}ms</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>작업 통계</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">완료한 작업</span>
                <span class="value">{{ selectedAgent.tasksCompleted }}/{{ selectedAgent.tasksTotal }}</span>
              </div>
              <div class="detail-item">
                <span class="label">성공률</span>
                <span class="value">
                  {{ Math.round(selectedAgent.tasksCompleted / selectedAgent.tasksTotal * 100) }}%
                </span>
              </div>
              <div class="detail-item">
                <span class="label">마지막 활동</span>
                <span class="value">{{ formatTime(selectedAgent.lastActivity) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>최근 작업</h3>
            <div class="recent-tasks">
              <div v-if="selectedAgent.recentTasks && selectedAgent.recentTasks.length > 0">
                <div v-for="(task, idx) in selectedAgent.recentTasks" :key="idx" class="task-item">
                  <span class="task-title">{{ task.title }}</span>
                  <span class="task-status" :class="task.status">{{ task.status }}</span>
                </div>
              </div>
              <p v-else class="no-data">최근 작업이 없습니다.</p>
            </div>
          </div>

          <div class="detail-section">
            <h3>에러 로그</h3>
            <div class="error-log">
              <div v-if="selectedAgent.errors && selectedAgent.errors.length > 0">
                <div v-for="(error, idx) in selectedAgent.errors" :key="idx" class="error-item">
                  <span class="error-time">{{ formatTime(error.timestamp) }}</span>
                  <span class="error-message">{{ error.message }}</span>
                </div>
              </div>
              <p v-else class="no-data">에러가 없습니다.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="executeCommand(selectedAgent.id)" class="action-btn primary">
            명령 실행
          </button>
          <button @click="selectedAgent = null" class="action-btn secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const viewMode = ref('list');
const filterQuery = ref('');
const filterStatus = ref('');
const isRefreshing = ref(false);
const selectedAgent = ref(null);
const agents = ref([
        {
          id: 1,
          name: 'Sudal',
          role: 'CEO & Strategic Authority',
          status: 'active',
          tasksCompleted: 142,
          tasksTotal: 150,
          responseTime: 45,
          uptime: 99.8,
          lastActivity: new Date(),
          recentTasks: [
            { title: 'Track C 승인', status: 'completed' },
            { title: 'Phase 1 체크리스트 배포', status: 'completed' }
          ],
          errors: []
        },
        {
          id: 2,
          name: 'Lando',
          role: 'Control Center & COO',
          status: 'active',
          tasksCompleted: 128,
          tasksTotal: 140,
          responseTime: 52,
          uptime: 99.6,
          lastActivity: new Date(Date.now() - 5 * 60000),
          recentTasks: [
            { title: '시스템 상태 점검', status: 'completed' },
            { title: '에이전트 조율', status: 'completed' }
          ],
          errors: []
        },
        {
          id: 3,
          name: 'OpenClaude',
          role: 'Developer & Engineering',
          status: 'active',
          tasksCompleted: 89,
          tasksTotal: 100,
          responseTime: 128,
          uptime: 98.9,
          lastActivity: new Date(Date.now() - 10 * 60000),
          recentTasks: [
            { title: 'Vue 3 컴포넌트 개발', status: 'completed' },
            { title: 'Python 자동화 스크립트', status: 'completed' }
          ],
          errors: [
            { timestamp: new Date(Date.now() - 30 * 60000), message: 'psutil 의존성 누락' }
          ]
        },
        {
          id: 4,
          name: 'Marco',
          role: 'MCP Integration & Management',
          status: 'idle',
          tasksCompleted: 34,
          tasksTotal: 50,
          responseTime: 201,
          uptime: 95.5,
          lastActivity: new Date(Date.now() - 60 * 60000),
          recentTasks: [
            { title: 'NAS 동기화 설정', status: 'pending' }
          ],
          errors: []
        },
        {
          id: 5,
          name: 'Guardian',
          role: 'Security & Compliance',
          status: 'active',
          tasksCompleted: 67,
          tasksTotal: 75,
          responseTime: 87,
          uptime: 99.2,
          lastActivity: new Date(Date.now() - 15 * 60000),
          recentTasks: [
            { title: '보안 감사', status: 'completed' },
            { title: '접근 제어 설정', status: 'completed' }
          ],
          errors: []
        }
      ]
    );

const totalAgents = computed(() => agents.value.length);
const activeCount = computed(() => agents.value.filter(a => a.status === 'active').length);
const idleCount = computed(() => agents.value.filter(a => a.status === 'idle').length);
const errorCount = computed(() => agents.value.filter(a => a.status === 'error').length);

const avgResponseTime = computed(() => {
  const total = agents.value.reduce((sum, a) => sum + a.responseTime, 0);
  return Math.round(total / agents.value.length);
});

const filteredAgents = computed(() => {
  return agents.value.filter(agent => {
    const matchesQuery = agent.name.toLowerCase().includes(filterQuery.value.toLowerCase()) ||
                        agent.role.toLowerCase().includes(filterQuery.value.toLowerCase());
    const matchesStatus = !filterStatus.value || agent.status === filterStatus.value;
    return matchesQuery && matchesStatus;
  });
});

function refreshData() {
  isRefreshing.value = true;
  setTimeout(() => {
    isRefreshing.value = false;
  }, 1000);
}

function applyFilters() {
  // 필터 자동 적용 (computed(filteredAgents)에서 처리, no-op 핸들러)
}

function viewAgentDetails(agent) {
  selectedAgent.value = agent;
}

function executeCommand(agentId) {
  console.log(`Executing command for agent ${agentId}`);
  alert('에이전트에 명령을 실행합니다.');
}

function getStatusLabel(status) {
  const labels = {
    active: '활성 중',
    idle: '대기 중',
    error: '오류'
  };
  return labels[status] || status;
}

function formatTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

async function loadAgents() {
  try {
    if (window.electronAPI && window.electronAPI.getAgents) {
      const result = await window.electronAPI.getAgents();
      if (result && result.data) {
        agents.value = result.data;
      } else if (Array.isArray(result)) {
        agents.value = result;
      }
    }
  } catch (error) {
    console.error('[AgentDashboard] Failed to load agents:', error);
  }
}

onMounted(() => {
  loadAgents();

  if (window.electronAPI) {
    window.electronAPI.onAgentStatus?.((agentData) => {
      const agent = agents.value.find(a => a.id === agentData.id);
      if (agent) {
        Object.assign(agent, agentData);
      }
    });
  }
});
</script>

<style scoped>
.agent-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #0a0e27;
  color: #e0e6ed;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 24px;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.refresh-btn,
.view-selector {
  padding: 10px 16px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #0d95d3;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view-selector {
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #0ea5e9;
  margin-bottom: 8px;
}

.stat-value.active {
  color: #22c55e;
}

.stat-value.idle {
  color: #fbbf24;
}

.stat-value.error {
  color: #ef4444;
}

.stat-label {
  font-size: 12px;
  color: #7a8ba0;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.filter-input,
.filter-select {
  padding: 10px 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 6px;
  color: #e0e6ed;
  font-size: 14px;
}

.filter-input {
  flex: 1;
}

.filter-input:focus {
  outline: none;
  border-color: #0ea5e9;
}

.agents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-card-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  transition: all 0.2s;
}

.agent-card-list:hover {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.agent-card-list.active {
  border-left: 4px solid #22c55e;
}

.agent-card-list.idle {
  border-left: 4px solid #fbbf24;
}

.agent-card-list.error {
  border-left: 4px solid #ef4444;
}

.agent-info {
  flex: 1;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.agent-name {
  font-weight: 600;
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

.status-badge.active {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.idle {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-badge.error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.agent-role {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #7a8ba0;
}

.agent-stats-inline {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #c4d0df;
}

.agent-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.detail-btn {
  background-color: #0ea5e9;
  color: #fff;
}

.detail-btn:hover {
  background-color: #0d95d3;
}

.command-btn {
  background-color: #1a2f5f;
  color: #7a8ba0;
}

.command-btn:hover {
  background-color: #253551;
  color: #0ea5e9;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.agent-card-grid {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-card-grid:hover {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #0ea5e9;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.active {
  background-color: #22c55e;
}

.status-indicator.idle {
  background-color: #fbbf24;
}

.status-indicator.error {
  background-color: #ef4444;
}

.card-role {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #7a8ba0;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1a2f5f;
  margin-bottom: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-value {
  font-weight: 600;
  color: #0ea5e9;
}

.metric-label {
  font-size: 11px;
  color: #7a8ba0;
}

.card-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 4px;
  background-color: #1a2f5f;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #22c55e;
  transition: width 0.3s;
}

.progress-label {
  font-size: 11px;
  color: #7a8ba0;
}

.stats-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.stat-section {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
}

.stat-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #0ea5e9;
}

.chart-placeholder {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
}

.status-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #0a0e27;
  border-radius: 4px;
}

.status-name {
  font-size: 13px;
  color: #7a8ba0;
}

.status-count {
  font-weight: 600;
  color: #0ea5e9;
}

.completion-stats,
.response-times {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completion-item,
.response-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-name-small {
  width: 100px;
  font-size: 12px;
  color: #7a8ba0;
}

.completion-bar {
  flex: 1;
  height: 6px;
  background-color: #1a2f5f;
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background-color: #0ea5e9;
  transition: width 0.3s;
}

.completion-percent {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 600;
}

.response-value {
  font-size: 12px;
  color: #c4d0df;
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #1a2f5f;
}

.modal-header h2 {
  margin: 0;
  color: #0ea5e9;
}

.close-btn {
  background: none;
  border: none;
  color: #7a8ba0;
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #0ea5e9;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-section h3 {
  margin: 0;
  font-size: 14px;
  color: #0ea5e9;
  text-transform: uppercase;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: #0a0e27;
  border-radius: 4px;
}

.label {
  font-size: 11px;
  color: #7a8ba0;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.value {
  font-size: 13px;
  color: #c4d0df;
  font-weight: 500;
}

.recent-tasks,
.error-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item,
.error-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #0a0e27;
  border-radius: 4px;
  font-size: 12px;
}

.task-title,
.error-message {
  color: #c4d0df;
  flex: 1;
}

.task-status {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.task-status.completed {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.task-status.pending {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.error-time {
  font-size: 11px;
  color: #7a8ba0;
  min-width: 120px;
}

.no-data {
  margin: 0;
  font-size: 12px;
  color: #7a8ba0;
  text-align: center;
  padding: 16px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #1a2f5f;
}

.primary {
  background-color: #0ea5e9;
  color: #fff;
  flex: 1;
}

.primary:hover {
  background-color: #0d95d3;
}

.secondary {
  background-color: #1a2f5f;
  color: #7a8ba0;
  flex: 1;
}

.secondary:hover {
  background-color: #253551;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
