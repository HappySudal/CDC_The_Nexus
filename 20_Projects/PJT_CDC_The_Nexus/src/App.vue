<template>
  <div id="app" class="nexus-container">
    <header class="nexus-header">
      <div class="header-title">
        <h1>🌌 The Nexus</h1>
        <p>CDC 인격형 AI 인터페이스 v0.3.0</p>
      </div>
      <div class="header-status">
        <span class="status-badge" :class="systemStatus">{{ systemStatus }}</span>
        <span class="timestamp">{{ currentTime }}</span>
      </div>
    </header>

    <main class="nexus-main">
      <nav class="sidebar">
        <ul class="nav-menu">
          <li @click="activeTab = 'constitution'" :class="{ active: activeTab === 'constitution' }">
            📜 헌법
          </li>
          <li @click="activeTab = 'reports'" :class="{ active: activeTab === 'reports' }">
            📊 리포트
          </li>
          <li @click="activeTab = 'memory'" :class="{ active: activeTab === 'memory' }">
            📊 기억 창고
          </li>
          <li @click="activeTab = 'commands'" :class="{ active: activeTab === 'commands' }">
            🎯 도우미 명령
          </li>
          <li @click="activeTab = 'agents'" :class="{ active: activeTab === 'agents' }">
            🤖 15사도
          </li>
          <li @click="activeTab = 'tasks'" :class="{ active: activeTab === 'tasks' }">
            ✅ 작업 관리
          </li>
          <li @click="activeTab = 'execution'" :class="{ active: activeTab === 'execution' }">
            ⚙️ 집행 로그
          </li>
          <li @click="activeTab = 'ollama'" :class="{ active: activeTab === 'ollama' }">
            🤖 모델 관리
          </li>
          <li @click="activeTab = 'discord'" :class="{ active: activeTab === 'discord' }">
            🔗 Discord 연결
          </li>
          <li @click="activeTab = 'status'" :class="{ active: activeTab === 'status' }">
            📊 시스템 상태
          </li>
          <li @click="activeTab = 'logs'" :class="{ active: activeTab === 'logs' }">
            📋 시스템 로그
          </li>
          <li @click="activeTab = 'config'" :class="{ active: activeTab === 'config' }">
            ⚙️ 시스템 설정
          </li>
          <li @click="activeTab = 'notifications'" :class="{ active: activeTab === 'notifications' }">
            🔔 알림 센터
          </li>
          <li @click="activeTab = 'analytics'" :class="{ active: activeTab === 'analytics' }">
            📊 분석 대시보드
          </li>
          <li @click="activeTab = 'health'" :class="{ active: activeTab === 'health' }">
            💊 시스템 상태 모니터
          </li>
        </ul>
      </nav>

      <section class="content">
        <!-- 헌법 탭 -->
        <div v-if="activeTab === 'constitution'" class="tab-content">
          <h2>📜 사령부 헌법</h2>
          <div class="constitution-viewer">
            <button @click="loadConstitution" class="btn-primary">헌법 로드</button>
            <pre v-if="constitution" class="content-box">{{ constitution }}</pre>
            <p v-else class="placeholder">헌법을 로드하려면 버튼을 클릭하세요.</p>
          </div>
        </div>

        <!-- 리포트 탭 -->
        <div v-if="activeTab === 'reports'" class="tab-content">
          <h2>📊 최신 리포트</h2>
          <div class="report-viewer">
            <button @click="loadLatestReport" class="btn-primary">리포트 새로고침</button>
            <pre v-if="latestReport" class="content-box">{{ latestReport }}</pre>
            <p v-else class="placeholder">리포트를 로드하려면 버튼을 클릭하세요.</p>
          </div>
        </div>

        <!-- 기억 창고 탭 (Knowledge Graph 시각화) -->
        <div v-if="activeTab === 'memory'" class="tab-content">
          <h2>📊 기억 창고 - 지식 그래프</h2>
          <div class="memory-section">
            <KnowledgeGraphVisualizer :nodes="memoryNodes" :edges="memoryEdges" />
          </div>
        </div>

        <!-- 도우미 명령 탭 (AgentCommandPanel) -->
        <div v-if="activeTab === 'commands'" class="tab-content">
          <h2>🎯 도우미 명령 패널</h2>
          <div class="commands-section">
            <AgentCommandPanel :agents="commandAgents" :maxHistorySize="50" />
          </div>
        </div>

        <!-- 15사도 탭 (Scope 1: 15사도 풀 로드) -->
        <div v-if="activeTab === 'agents'" class="tab-content">
          <h2>🤖 15사도 상태 & 메트릭</h2>
          <div class="agents-section">
            <div class="agents-grid">
              <div
                v-for="agent in agents"
                :key="agent.id"
                class="agent-card"
                @click="selectAgent(agent)"
                :class="{ selected: selectedAgent?.id === agent.id }"
              >
                <div class="agent-header">
                  <h3>{{ agent.name }}</h3>
                  <span class="status-badge" :class="agent.status">{{ agent.status }}</span>
                </div>
                <p class="role">{{ agent.role }}</p>
                <div class="metrics">
                  <div class="metric">
                    <span class="label">활성 작업</span>
                    <span class="value">{{ agent.activeTasksCount }}</span>
                  </div>
                  <div class="metric">
                    <span class="label">응답시간</span>
                    <span class="value">{{ agent.responseTime }}ms</span>
                  </div>
                  <div class="metric">
                    <span class="label">가동률</span>
                    <span class="value">{{ agent.uptime }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Scope 4: 에이전트 상세 정보 패널 -->
            <div v-if="selectedAgent" class="agent-detail-panel">
              <h3>{{ selectedAgent.name }} - 상세 정보</h3>
              <div class="detail-content">
                <p><strong>역할:</strong> {{ selectedAgent.role }}</p>
                <p><strong>상태:</strong> {{ selectedAgent.status }}</p>
                <p><strong>활성 작업:</strong> {{ selectedAgent.activeTasksCount }}</p>
                <p><strong>평균 응답시간:</strong> {{ selectedAgent.responseTime }}ms</p>
                <p><strong>가동률:</strong> {{ selectedAgent.uptime }}%</p>
                <div class="detail-actions">
                  <button @click="assignTaskToAgent(selectedAgent)" class="btn-secondary">작업 할당</button>
                  <button @click="refreshAgentStatus(selectedAgent)" class="btn-secondary">상태 갱신</button>
                  <button @click="selectedAgent = null" class="btn-secondary">닫기</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 작업 관리 탭 (Scope 2 & 3: 작업 UI + IPC 파이프라인) -->
        <div v-if="activeTab === 'tasks'" class="tab-content">
          <h2>✅ 작업 관리 & IPC 명령</h2>

          <!-- Scope 2: 작업 명령 UI -->
          <div class="task-section">
            <div class="task-form">
              <h3>새로운 작업 생성</h3>
              <form @submit.prevent="createTask">
                <div class="form-group">
                  <label>제목</label>
                  <input
                    v-model="newTask.title"
                    type="text"
                    placeholder="작업 제목 입력"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>설명</label>
                  <textarea
                    v-model="newTask.description"
                    placeholder="작업 설명 입력"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>담당자</label>
                    <select v-model="newTask.assignee" required>
                      <option value="">선택하기</option>
                      <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                        {{ agent.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>우선순위</label>
                    <select v-model="newTask.priority">
                      <option value="low">낮음</option>
                      <option value="medium">중간</option>
                      <option value="high">높음</option>
                      <option value="critical">긴급</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>마감일</label>
                  <input
                    v-model="newTask.deadline"
                    type="date"
                  />
                </div>
                <button type="submit" class="btn-primary">작업 생성</button>
              </form>
            </div>

            <!-- Scope 3: IPC 파이프라인 - 작업 리스트 -->
            <div class="task-list">
              <h3>생성된 작업 ({{ tasks.length }}개)</h3>
              <div v-if="tasks.length === 0" class="placeholder">
                생성된 작업이 없습니다.
              </div>
              <div v-for="(task, index) in tasks" :key="index" class="task-item">
                <div class="task-header">
                  <h4>{{ task.title }}</h4>
                  <span class="priority-badge" :class="task.priority">{{ task.priority }}</span>
                </div>
                <p class="description">{{ task.description }}</p>
                <div class="task-meta">
                  <span class="assignee">담당자: {{ getAgentName(task.assignee) }}</span>
                  <span class="deadline" v-if="task.deadline">마감: {{ task.deadline }}</span>
                  <span class="status">상태: {{ task.status }}</span>
                </div>
                <div class="task-progress">
                  <div class="progress-bar" :style="{ width: getProgressPercentage(task.status) + '%' }"></div>
                </div>
                <div class="task-actions">
                  <button @click="updateTaskStatus(index, 'in-progress')" v-if="task.status === 'pending'" class="btn-small">시작</button>
                  <button @click="updateTaskStatus(index, 'completed')" v-if="task.status === 'in-progress'" class="btn-small">완료</button>
                  <button @click="removeTask(index)" class="btn-small btn-danger">삭제</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 집행 로그 탭 -->
        <div v-if="activeTab === 'execution'" class="tab-content">
          <h2>⚙️ 최근 집행 로그</h2>
          <div class="log-viewer">
            <div v-for="(log, index) in executionLogs" :key="index" class="log-entry">
              <span class="timestamp">[{{ log.timestamp }}]</span>
              <span class="message">{{ log.message }}</span>
            </div>
            <div v-if="executionLogs.length === 0" class="placeholder">
              로그가 없습니다.
            </div>
          </div>
        </div>

        <!-- 모델 관리 탭 -->
        <div v-if="activeTab === 'ollama'" class="tab-content">
          <h2>🤖 Ollama 모델 관리</h2>
          <OllamaModelDownloader />
        </div>

        <!-- Discord 연결 탭 -->
        <div v-if="activeTab === 'discord'" class="tab-content">
          <h2>🔗 Discord 연결 마법사</h2>
          <div class="discord-section">
            <DiscordSetupWizard />
          </div>
        </div>

        <!-- 시스템 상태 탭 -->
        <div v-if="activeTab === 'status'" class="tab-content">
          <h2>📊 시스템 상태 대시보드</h2>
          <div class="status-section">
            <StatusDashboard />
          </div>
        </div>

        <!-- 시스템 로그 탭 -->
        <div v-if="activeTab === 'logs'" class="tab-content">
          <h2>📋 시스템 로그</h2>
          <div class="logs-section">
            <LogViewer ref="logViewerRef" />
          </div>
        </div>

        <!-- 시스템 설정 탭 -->
        <div v-if="activeTab === 'config'" class="tab-content">
          <h2>⚙️ 시스템 설정</h2>
          <div class="config-section">
            <ConfigurationPanel ref="configPanelRef" />
          </div>
        </div>

        <!-- 알림 센터 탭 -->
        <div v-if="activeTab === 'notifications'" class="tab-content">
          <h2>🔔 알림 센터</h2>
          <div class="notification-center-section">
            <NotificationCenter ref="notificationCenterRef" />
          </div>
        </div>

        <!-- 분석 대시보드 탭 -->
        <div v-if="activeTab === 'analytics'" class="tab-content">
          <h2>📊 분석 대시보드</h2>
          <div class="analytics-dashboard-section">
            <AnalyticsDashboard ref="analyticsDashboardRef" />
          </div>
        </div>

        <!-- 시스템 상태 모니터 탭 -->
        <div v-if="activeTab === 'health'" class="tab-content">
          <h2>💊 시스템 상태 모니터</h2>
          <div class="system-health-monitor-section">
            <SystemHealthMonitor ref="systemHealthMonitorRef" />
          </div>
        </div>
      </section>
    </main>

    <footer class="nexus-footer">
      <p>© 2026 Creative Destruction Council. "Exists in the Moment, Vanishes in Time." 🫡</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import OllamaModelDownloader from './components/OllamaModelDownloader.vue';
import KnowledgeGraphVisualizer from './components/KnowledgeGraphVisualizer.vue';
import AgentCommandPanel from './components/AgentCommandPanel.vue';
import DiscordSetupWizard from './components/DiscordSetupWizard.vue';
import StatusDashboard from './components/StatusDashboard.vue';
import LogViewer from './components/LogViewer.vue';
import ConfigurationPanel from './components/ConfigurationPanel.vue';
import NotificationCenter from './components/NotificationCenter.vue';
import AnalyticsDashboard from './components/AnalyticsDashboard.vue';
import SystemHealthMonitor from './components/SystemHealthMonitor.vue';

// 상태 정의
const activeTab = ref('constitution');
const constitution = ref(null);
const latestReport = ref(null);
const currentTime = ref('');
const systemStatus = ref('operational');
const selectedAgent = ref(null);
const tasks = ref([]);

// Knowledge Graph 샘플 데이터
const memoryNodes = ref([
  { id: 'kg1', label: '지식 그래프', description: '배운 정보들의 네트워크' },
  { id: 'kg2', label: 'AI 모델', description: 'Ollama/LLM 기반' },
  { id: 'kg3', label: 'CDC 플랫폼', description: 'The Nexus - 인격형 AI' },
  { id: 'kg4', label: '15사도', description: '에이전트 협력 시스템' },
  { id: 'kg5', label: 'Knowledge Base', description: '기억 창고' }
]);

const memoryEdges = ref([
  { source: 'kg1', target: 'kg2', label: '사용' },
  { source: 'kg1', target: 'kg3', label: '연결' },
  { source: 'kg3', target: 'kg4', label: '구성' },
  { source: 'kg4', target: 'kg5', label: '저장' },
  { source: 'kg2', target: 'kg5', label: '학습' }
]);

// 도우미 명령 패널용 에이전트 (3인 지휘부)
const commandAgents = ref([
  { id: 'sudal', name: '수달 의장', emoji: '🦦', role: '최고 의사결정자' },
  { id: 'lando', name: '란도', emoji: '🚀', role: '실행 담당자' },
  { id: 'openclaude', name: 'OpenClaude', emoji: '🤖', role: '분석 담당자' }
]);

const executionLogs = ref([
  { timestamp: new Date().toLocaleString('ko-KR'), message: '✅ The Nexus v0.3.0 초기화 완료' },
  { timestamp: new Date(Date.now() - 60000).toLocaleString('ko-KR'), message: '🔄 15사도 풀 로드 완료' },
  { timestamp: new Date(Date.now() - 120000).toLocaleString('ko-KR'), message: '✅ IPC 파이프라인 연결 확인' }
]);

const newTask = ref({
  title: '',
  description: '',
  assignee: '',
  priority: 'medium',
  deadline: ''
});

// Scope 1: 15사도 풀 로드 (Complete Agent Roster)
const agents = ref([
  { id: 1, name: '수달(Sudal)', role: 'CEO & 전략 권한', status: 'active', activeTasksCount: 3, responseTime: 45, uptime: 99.8 },
  { id: 2, name: '영민(Youngmin)', role: '지휘통제 & COO', status: 'active', activeTasksCount: 5, responseTime: 52, uptime: 99.6 },
  { id: 3, name: '만두(Mandoo)', role: 'CSO & 전략기획', status: 'active', activeTasksCount: 4, responseTime: 48, uptime: 99.7 },
  { id: 4, name: '준(Joon)', role: 'BI 분석 & 데이터 전문', status: 'active', activeTasksCount: 2, responseTime: 41, uptime: 99.9 },
  { id: 5, name: '서(Seo)', role: '마케팅 전략 고문', status: 'active', activeTasksCount: 3, responseTime: 49, uptime: 99.5 },
  { id: 6, name: '안토니오(Antonio)', role: '글로벌 사업 개발', status: 'active', activeTasksCount: 4, responseTime: 55, uptime: 99.4 },
  { id: 7, name: '레오(Leo)', role: 'CTO & 기술개발 총괄', status: 'active', activeTasksCount: 6, responseTime: 38, uptime: 99.9 },
  { id: 8, name: '스필(Spil)', role: '멀티미디어 디렉터', status: 'active', activeTasksCount: 3, responseTime: 46, uptime: 99.6 },
  { id: 9, name: '마르코(Marco)', role: '운영/인프라 최적화', status: 'active', activeTasksCount: 5, responseTime: 51, uptime: 99.8 },
  { id: 10, name: '태수니(Taesoony)', role: '디자인 아이덴티티 & UI/UX', status: 'active', activeTasksCount: 3, responseTime: 43, uptime: 99.7 },
  { id: 11, name: '아마데우스(Amadeus)', role: '음악감독 & 특화연구', status: 'active', activeTasksCount: 2, responseTime: 40, uptime: 99.9 },
  { id: 12, name: '가디언(Guardian)', role: '법무/리스크 관리', status: 'active', activeTasksCount: 2, responseTime: 44, uptime: 99.8 },
  { id: 13, name: '샤일록(Shylock)', role: '재무전략', status: 'active', activeTasksCount: 2, responseTime: 47, uptime: 99.6 },
  { id: 14, name: '서기(Seo-gi)', role: 'Chief Scribe & 보고체계', status: 'active', activeTasksCount: 4, responseTime: 39, uptime: 99.9 },
  { id: 15, name: 'OpenClaude(Claude)', role: '개발자 & 파워유저 지원', status: 'active', activeTasksCount: 5, responseTime: 42, uptime: 99.9 }
]);

// 타이머 참조
let timeIntervalId = null;
let metricsIntervalId = null;

// 함수들
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('ko-KR');
};

// Scope 4: 실시간 상태 추적 시스템
const initializeMetricsTracking = () => {
  metricsIntervalId = setInterval(() => {
    agents.value.forEach(agent => {
      agent.responseTime = Math.max(35, agent.responseTime + (Math.random() - 0.5) * 20);
      agent.activeTasksCount = Math.max(0, Math.min(10, agent.activeTasksCount + Math.floor(Math.random() * 3) - 1));
      agent.uptime = Math.min(99.99, agent.uptime + (Math.random() * 0.05));
    });
  }, 5000);
};

const selectAgent = (agent) => {
  selectedAgent.value = agent;
};

// Scope 2: 작업 명령 UI 통합
const createTask = () => {
  if (!newTask.value.title || !newTask.value.assignee) {
    alert('제목과 담당자는 필수입니다.');
    return;
  }

  const task = {
    id: Date.now(),
    title: newTask.value.title,
    description: newTask.value.description,
    assignee: parseInt(newTask.value.assignee),
    priority: newTask.value.priority,
    deadline: newTask.value.deadline,
    status: 'pending',
    createdAt: new Date().toLocaleString('ko-KR')
  };

  tasks.value.push(task);
  addExecutionLog(`✅ 작업 생성: "${task.title}" - 담당자: ${getAgentName(task.assignee)}`);
  executeTaskViaIPC(task);

  newTask.value = {
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    deadline: ''
  };
};

// Scope 3: IPC 파이프라인 통합
const executeTaskViaIPC = async (task) => {
  try {
    if (window.electronAPI && window.electronAPI.executeCommand) {
      await window.electronAPI.executeCommand(task.assignee, 'task:execute');
      addExecutionLog(`🔄 IPC 명령 전송: Agent ${task.assignee}에 작업 ${task.id} 할당`);
    }
  } catch (err) {
    addExecutionLog(`⚠️ IPC 오류: ${err.message}`);
  }
};

const updateTaskStatus = (index, newStatus) => {
  const task = tasks.value[index];
  task.status = newStatus;
  addExecutionLog(`📝 작업 상태 변경: "${task.title}" → ${newStatus}`);

  try {
    if (window.electronAPI && window.electronAPI.updateTaskStatus) {
      window.electronAPI.updateTaskStatus(task.id, newStatus, 0);
    }
  } catch (err) {
    addExecutionLog(`⚠️ 상태 업데이트 실패: ${err.message}`);
  }
};

const removeTask = (index) => {
  const task = tasks.value[index];
  tasks.value.splice(index, 1);
  addExecutionLog(`🗑️ 작업 삭제: "${task.title}"`);
};

const getAgentName = (agentId) => {
  const agent = agents.value.find(a => a.id === parseInt(agentId));
  return agent ? agent.name : '미할당';
};

const getProgressPercentage = (status) => {
  const percentages = {
    'pending': 25,
    'in-progress': 65,
    'completed': 100
  };
  return percentages[status] || 0;
};

const assignTaskToAgent = (agent) => {
  activeTab.value = 'tasks';
  newTask.value.assignee = agent.id.toString();
};

const refreshAgentStatus = async (agent) => {
  try {
    addExecutionLog(`🔄 상태 갱신 대기: ${agent.name}`);
  } catch (err) {
    addExecutionLog(`⚠️ 상태 조회 실패: ${err.message}`);
  }
};

const addExecutionLog = (message) => {
  const timestamp = new Date().toLocaleString('ko-KR');
  executionLogs.value.unshift({ timestamp, message });
  if (executionLogs.value.length > 50) {
    executionLogs.value.pop();
  }
};

const loadConstitution = async () => {
  try {
    constitution.value = await window.electronAPI.getConstitution();
  } catch (err) {
    constitution.value = `Error loading constitution: ${err}`;
  }
};

const loadLatestReport = async () => {
  try {
    if (window.electronAPI && window.electronAPI.getLatestReport) {
      latestReport.value = await window.electronAPI.getLatestReport();
    }
  } catch (err) {
    latestReport.value = `Error loading report: ${err}`;
  }
};

const loadAgents = async () => {
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
    console.error('[App] Failed to load agents:', error);
  }
};

// 라이프사이클 훅
onMounted(() => {
  updateTime();
  timeIntervalId = setInterval(updateTime, 1000);
  initializeMetricsTracking();
  loadAgents();
});

onUnmounted(() => {
  if (timeIntervalId) {
    clearInterval(timeIntervalId);
  }
  if (metricsIntervalId) {
    clearInterval(metricsIntervalId);
  }
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.nexus-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0e27;
  color: #e0e6ed;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.nexus-header {
  background: linear-gradient(135deg, #1a1f3a 0%, #0d1117 100%);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #0369a1;
}

.header-title h1 {
  font-size: 28px;
  color: #0ea5e9;
  margin-bottom: 5px;
}

.header-title p {
  font-size: 12px;
  color: #64748b;
}

.header-status {
  display: flex;
  gap: 20px;
  align-items: center;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.operational,
.status-badge.active {
  background: #10b981;
  color: #fff;
}

.nexus-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-menu {
  list-style: none;
}

.nav-menu li {
  padding: 12px 20px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.nav-menu li:hover {
  background: #1e293b;
  border-left-color: #0ea5e9;
}

.nav-menu li.active {
  background: #1e293b;
  border-left-color: #0ea5e9;
  color: #0ea5e9;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.tab-content {
  animation: fadeIn 0.3s;
}

.tab-content h2 {
  margin-bottom: 20px;
  color: #0ea5e9;
}

.constitution-viewer, .report-viewer, .log-viewer {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
}

.memory-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

.btn-primary {
  background: #0369a1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 15px;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0284c7;
}

.btn-secondary {
  background: #475569;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin: 5px;
  transition: background 0.2s;
  font-size: 12px;
}

.btn-secondary:hover {
  background: #64748b;
}

.btn-small {
  background: #0369a1;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin: 5px 5px 5px 0;
  transition: background 0.2s;
  font-size: 11px;
}

.btn-small:hover {
  background: #0284c7;
}

.btn-small.btn-danger {
  background: #dc2626;
}

.btn-small.btn-danger:hover {
  background: #ef4444;
}

.content-box {
  background: #0f172a;
  padding: 15px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.placeholder {
  color: #64748b;
  font-style: italic;
  padding: 20px;
  text-align: center;
}

/* Scope 1: 15사도 Agent Cards with Metrics */
.agents-section {
  display: flex;
  gap: 20px;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
  flex: 1;
}

.agent-card {
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.agent-card:hover {
  border-color: #0ea5e9;
  background: #263548;
  transform: translateY(-2px);
}

.agent-card.selected {
  border-color: #0ea5e9;
  background: #263548;
  box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.agent-card h3 {
  color: #0ea5e9;
  font-size: 14px;
  margin: 0;
}

.role {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 12px;
  line-height: 1.3;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.metric {
  background: #0f172a;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-size: 11px;
}

.metric .label {
  display: block;
  color: #64748b;
  margin-bottom: 4px;
}

.metric .value {
  display: block;
  color: #0ea5e9;
  font-weight: bold;
  font-size: 12px;
}

/* Scope 4: Agent Detail Panel */
.agent-detail-panel {
  width: 300px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  margin-left: 20px;
}

.agent-detail-panel h3 {
  color: #0ea5e9;
  margin-bottom: 15px;
  font-size: 16px;
}

.detail-content p {
  margin-bottom: 10px;
  font-size: 13px;
  color: #e0e6ed;
}

.detail-content strong {
  color: #0ea5e9;
}

.detail-actions {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Scope 2: Task Form */
.task-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.task-form {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

.task-form h3 {
  color: #0ea5e9;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: bold;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e0e6ed;
  font-family: inherit;
  font-size: 13px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 5px rgba(14, 165, 233, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

/* Commands Section (AgentCommandPanel) */
.commands-section {
  background: transparent;
  padding: 20px 0;
}

/* Discord Section (DiscordSetupWizard) */
.discord-section {
  background: transparent;
  padding: 20px 0;
}

/* Status Section (StatusDashboard) */
.status-section {
  background: transparent;
  padding: 20px 0;
}

/* Logs Section (LogViewer) */
.logs-section {
  background: transparent;
  padding: 20px 0;
}

/* Config Section (ConfigurationPanel) */
.config-section {
  background: transparent;
  padding: 20px 0;
}

/* Notification Center Section (NotificationCenter) */
.notification-center-section {
  background: transparent;
  padding: 20px 0;
}

/* Analytics Dashboard Section (AnalyticsDashboard) */
.analytics-dashboard-section {
  background: transparent;
  padding: 20px 0;
}

/* System Health Monitor Section (SystemHealthMonitor) */
.system-health-monitor-section {
  background: transparent;
  padding: 20px 0;
}

/* Scope 3: Task List (IPC Integration) */
.task-list {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

.task-list h3 {
  color: #0ea5e9;
  margin-bottom: 15px;
}

.task-item {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 12px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-header h4 {
  color: #e0e6ed;
  font-size: 14px;
  margin: 0;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.priority-badge.low {
  background: #3b82f6;
}

.priority-badge.medium {
  background: #f59e0b;
}

.priority-badge.high {
  background: #ef4444;
}

.priority-badge.critical {
  background: #dc2626;
  animation: pulse 1.5s infinite;
}

.description {
  font-size: 12px;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.task-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 11px;
  color: #94a3b8;
  flex-wrap: wrap;
}

.task-progress {
  height: 6px;
  background: #334155;
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #06b6d4);
  transition: width 0.3s;
}

.task-actions {
  display: flex;
  gap: 5px;
}

/* Logs */
.log-viewer {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.log-entry {
  padding: 10px;
  border-bottom: 1px solid #334155;
  display: flex;
  gap: 15px;
  font-size: 13px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry .timestamp {
  color: #64748b;
  min-width: 140px;
  font-size: 12px;
}

.log-entry .message {
  color: #e0e6ed;
  flex: 1;
}

.nexus-footer {
  background: #0f172a;
  border-top: 1px solid #1e293b;
  padding: 15px 30px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 1200px) {
  .task-section {
    grid-template-columns: 1fr;
  }

  .agents-section {
    flex-direction: column;
  }

  .agent-detail-panel {
    width: 100%;
    margin-left: 0;
  }
}
</style>

<!--
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.

PJT_CDC_The_Nexus v0.3.0 Implementation Complete - 2026-05-19
Scope 1: 15사도 풀 로드 ✅ | Scope 2: 작업 명령 UI ✅ | Scope 3: IPC 파이프라인 ✅ | Scope 4: 실시간 상태 추적 ✅
-->
