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
            CDC
          </li>
          <li @click="activeTab = 'llmdashboard'" :class="{ active: activeTab === 'llmdashboard' }">
            멀티 LLM
          </li>
          <li @click="activeTab = 'reports'" :class="{ active: activeTab === 'reports' }">
            리포트
          </li>
          <li @click="activeTab = 'memory'" :class="{ active: activeTab === 'memory' }">
            기억 창고
          </li>
          <li @click="activeTab = 'commands'" :class="{ active: activeTab === 'commands' }">
            도우미 명령
          </li>
          <li @click="activeTab = 'agents'" :class="{ active: activeTab === 'agents' }">
            15사도
          </li>
          <li @click="activeTab = 'tasks'" :class="{ active: activeTab === 'tasks' }">
            작업 관리
          </li>
          <li @click="activeTab = 'execution'" :class="{ active: activeTab === 'execution' }">
            집행 로그
          </li>
          <li @click="activeTab = 'ollama'" :class="{ active: activeTab === 'ollama' }">
            모델 관리
          </li>
          <li @click="activeTab = 'discord'" :class="{ active: activeTab === 'discord' }">
            Discord
          </li>
          <li @click="activeTab = 'voice'" :class="{ active: activeTab === 'voice' }">
            음성
          </li>
          <li @click="activeTab = 'status'" :class="{ active: activeTab === 'status' }">
            시스템 상태
          </li>
          <li @click="activeTab = 'logs'" :class="{ active: activeTab === 'logs' }">
            시스템 로그
          </li>
          <li @click="activeTab = 'config'" :class="{ active: activeTab === 'config' }">
            시스템 설정
          </li>
          <li @click="activeTab = 'notifications'" :class="{ active: activeTab === 'notifications' }">
            알림 센터
          </li>
          <li @click="activeTab = 'analytics'" :class="{ active: activeTab === 'analytics' }">
            분석 대시보드
          </li>
          <li @click="activeTab = 'health'" :class="{ active: activeTab === 'health' }">
            시스템 상태 모니터
          </li>
          <li @click="activeTab = 'agentMonitor'" :class="{ active: activeTab === 'agentMonitor' }">
            사도 모니터
          </li>
          <li @click="activeTab = 'realtime'" :class="{ active: activeTab === 'realtime' }">
            실시간 대시보드
          </li>
          <li @click="activeTab = 'metrics'" :class="{ active: activeTab === 'metrics' }">
            메트릭 그래프
          </li>
          <li @click="activeTab = 'search'" :class="{ active: activeTab === 'search' }">
            검색
          </li>
          <li @click="activeTab = 'ollamaManager'" :class="{ active: activeTab === 'ollamaManager' }">
            모델 관리(고급)
          </li>
          <li @click="activeTab = 'performance'" :class="{ active: activeTab === 'performance' }">
            성능 모니터
          </li>
          <li @click="activeTab = 'websocket'" :class="{ active: activeTab === 'websocket' }">
            WebSocket
          </li>
        </ul>
      </nav>

      <section class="content">
        <!-- 헌법 탭 (ConstitutionViewer 실 컴포넌트) -->
        <div v-if="activeTab === 'constitution'" class="tab-content">
          <h2>📜 사령부 헌법</h2>
          <ConstitutionViewer />
        </div>

        <!-- 멀티 LLM 대시보드 탭 (LLMDashboard 실 컴포넌트) -->
        <div v-if="activeTab === 'llmdashboard'" class="tab-content">
          <LLMDashboard />
        </div>

        <!-- 리포트 탭 (ReportLoader 실 컴포넌트) -->
        <div v-if="activeTab === 'reports'" class="tab-content">
          <h2>📊 최신 리포트</h2>
          <ReportLoader />
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

        <!-- 15사도 탭 (AgentDashboard 실 컴포넌트) -->
        <div v-if="activeTab === 'agents'" class="tab-content">
          <h2>🤖 15사도 상태 & 메트릭</h2>
          <AgentDashboard />
        </div>

        <!-- 작업 관리 탭 (Scope 2 & 3: 작업 UI + IPC 파이프라인) -->
        <div v-if="activeTab === 'tasks'" class="tab-content">
          <h2>✅ 작업 관리 & IPC 명령</h2>

          <!-- Scope 2: 작업 명령 UI (TaskCreationForm 실 컴포넌트) -->
          <div class="task-section">
            <TaskCreationForm @task-created="onTaskCreated" @cancel="() => {}" />

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
          <OllamaModelDownloader v-if="activeTab === 'ollama'" />
        </div>

        <!-- Discord 연결 탭 -->
        <div v-if="activeTab === 'discord'" class="tab-content">
          <h2>🔗 Discord 연결 마법사</h2>
          <div class="discord-section">
            <DiscordSetupWizard v-if="activeTab === 'discord'" />
          </div>
        </div>

        <!-- 음성 대화 탭 -->
        <div v-if="activeTab === 'voice'" class="tab-content">
          <h2>🎤 음성 대화 시스템</h2>
          <div class="voice-section">
            <SpeechRecognitionPanel v-if="activeTab === 'voice'" />
          </div>
        </div>

        <!-- 시스템 상태 탭 -->
        <div v-if="activeTab === 'status'" class="tab-content">
          <h2>📊 시스템 상태 대시보드</h2>
          <div class="status-section">
            <StatusDashboard v-if="activeTab === 'status'" />
          </div>
        </div>

        <!-- 시스템 로그 탭 -->
        <div v-if="activeTab === 'logs'" class="tab-content">
          <h2>📋 시스템 로그</h2>
          <div class="logs-section">
            <LogViewer v-if="activeTab === 'logs'" ref="logViewerRef" />
          </div>
        </div>

        <!-- 시스템 설정 탭 -->
        <div v-if="activeTab === 'config'" class="tab-content">
          <h2>⚙️ 시스템 설정</h2>
          <div class="config-section">
            <ConfigurationPanel v-if="activeTab === 'config'" ref="configPanelRef" />
          </div>
        </div>

        <!-- 알림 센터 탭 -->
        <div v-if="activeTab === 'notifications'" class="tab-content">
          <h2>🔔 알림 센터</h2>
          <div class="notification-center-section">
            <NotificationCenter v-if="activeTab === 'notifications'" ref="notificationCenterRef" />
          </div>
        </div>

        <!-- 분석 대시보드 탭 -->
        <div v-if="activeTab === 'analytics'" class="tab-content">
          <h2>📊 분석 대시보드</h2>
          <div class="analytics-dashboard-section">
            <AnalyticsDashboard v-if="activeTab === 'analytics'" ref="analyticsDashboardRef" />
          </div>
        </div>

        <!-- 시스템 상태 모니터 탭 -->
        <div v-if="activeTab === 'health'" class="tab-content">
          <h2>💊 시스템 상태 모니터</h2>
          <div class="system-health-monitor-section">
            <SystemHealthMonitor v-if="activeTab === 'health'" ref="systemHealthMonitorRef" />
          </div>
        </div>

        <!-- 사도 모니터 탭 (AgentStatusMonitor) -->
        <div v-if="activeTab === 'agentMonitor'" class="tab-content">
          <h2>🛰️ 사도 상태 모니터</h2>
          <AgentStatusMonitor v-if="activeTab === 'agentMonitor'" />
        </div>

        <!-- 실시간 대시보드 탭 (RealTimeDashboard) -->
        <div v-if="activeTab === 'realtime'" class="tab-content">
          <h2>📡 실시간 대시보드</h2>
          <RealTimeDashboard v-if="activeTab === 'realtime'" />
        </div>

        <!-- 메트릭 그래프 탭 (SystemMetricsGraphs) -->
        <div v-if="activeTab === 'metrics'" class="tab-content">
          <h2>📈 시스템 메트릭 그래프</h2>
          <SystemMetricsGraphs v-if="activeTab === 'metrics'" />
        </div>

        <!-- 검색 탭 (SearchInterface) -->
        <div v-if="activeTab === 'search'" class="tab-content">
          <h2>🔎 통합 검색</h2>
          <SearchInterface v-if="activeTab === 'search'" />
        </div>

        <!-- 모델 관리(고급) 탭 (OllamaModelManager) -->
        <div v-if="activeTab === 'ollamaManager'" class="tab-content">
          <h2>🧠 Ollama 모델 관리 (고급)</h2>
          <OllamaModelManager v-if="activeTab === 'ollamaManager'" />
        </div>

        <!-- 성능 모니터 탭 (PerformanceMonitor) -->
        <div v-if="activeTab === 'performance'" class="tab-content">
          <h2>⚡ 성능 모니터</h2>
          <PerformanceMonitor v-if="activeTab === 'performance'" />
        </div>

        <!-- WebSocket 탭 (WebSocketBridge) -->
        <div v-if="activeTab === 'websocket'" class="tab-content">
          <h2>🔌 WebSocket 브리지</h2>
          <WebSocketBridge v-if="activeTab === 'websocket'" />
        </div>
      </section>
    </main>

    <footer class="nexus-footer">
      <p>© 2026 Creative Destruction Council. "Exists in the Moment, Vanishes in Time." 🫡</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';

// Core components (always loaded)
import AgentCommandPanel from './components/AgentCommandPanel.vue';
import TaskCreationForm from './components/TaskCreationForm.vue';

// Async components (lazy loaded by tab)
const OllamaModelDownloader = defineAsyncComponent(() => import('./components/OllamaModelDownloader.vue'));
const KnowledgeGraphVisualizer = defineAsyncComponent(() => import('./components/KnowledgeGraphVisualizer.vue'));
const DiscordSetupWizard = defineAsyncComponent(() => import('./components/DiscordSetupWizard.vue'));
const StatusDashboard = defineAsyncComponent(() => import('./components/StatusDashboard.vue'));
const LogViewer = defineAsyncComponent(() => import('./components/LogViewer.vue'));
const ConfigurationPanel = defineAsyncComponent(() => import('./components/ConfigurationPanel.vue'));
const NotificationCenter = defineAsyncComponent(() => import('./components/NotificationCenter.vue'));
const AnalyticsDashboard = defineAsyncComponent(() => import('./components/AnalyticsDashboard.vue'));
const SystemHealthMonitor = defineAsyncComponent(() => import('./components/SystemHealthMonitor.vue'));
const SpeechRecognitionPanel = defineAsyncComponent(() => import('./components/SpeechRecognitionPanel.vue'));
const ConstitutionViewer = defineAsyncComponent(() => import('./components/ConstitutionViewer.vue'));
const LLMDashboard = defineAsyncComponent(() => import('./components/LLMDashboard.vue'));
const ReportLoader = defineAsyncComponent(() => import('./components/ReportLoader.vue'));
const AgentDashboard = defineAsyncComponent(() => import('./components/AgentDashboard.vue'));
const AgentStatusMonitor = defineAsyncComponent(() => import('./components/AgentStatusMonitor.vue'));
const RealTimeDashboard = defineAsyncComponent(() => import('./components/RealTimeDashboard.vue'));
const SystemMetricsGraphs = defineAsyncComponent(() => import('./components/SystemMetricsGraphs.vue'));
const SearchInterface = defineAsyncComponent(() => import('./components/SearchInterface.vue'));
const OllamaModelManager = defineAsyncComponent(() => import('./components/OllamaModelManager.vue'));
const PerformanceMonitor = defineAsyncComponent(() => import('./components/PerformanceMonitor.vue'));
const WebSocketBridge = defineAsyncComponent(() => import('./components/WebSocketBridge.vue'));

// 상태 정의
const activeTab = ref('constitution');
const currentTime = ref('');
const systemStatus = ref('operational');
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

const formatTimestamp = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

const executionLogs = ref([
  { timestamp: formatTimestamp(new Date()), message: '✅ The Nexus v0.3.0 초기화 완료' },
  { timestamp: formatTimestamp(new Date(Date.now() - 60000)), message: '🔄 15사도 풀 로드 완료' },
  { timestamp: formatTimestamp(new Date(Date.now() - 120000)), message: '✅ IPC 파이프라인 연결 확인' }
]);

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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${year}.${month}.${date} ${hours}:${minutes}:${seconds}`;
};

// Scope 4: 실시간 상태 추적 시스템
const initializeMetricsTracking = () => {
  metricsIntervalId = setInterval(() => {
    agents.value.forEach(agent => {
      const newResponseTime = Math.max(35, agent.responseTime + (Math.random() - 0.5) * 20);
      agent.responseTime = Number(newResponseTime.toFixed(1));
      agent.activeTasksCount = Math.max(0, Math.min(10, agent.activeTasksCount + Math.floor(Math.random() * 3) - 1));
      const newUptime = Math.min(99.99, agent.uptime + (Math.random() * 0.05));
      agent.uptime = Number(newUptime.toFixed(2));
    });
  }, 10000);
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

// TaskCreationForm(task-created) 이벤트 → 작업 리스트 반영 + IPC 집행
const onTaskCreated = (taskData) => {
  const task = {
    id: taskData.id || Date.now(),
    title: taskData.title,
    description: taskData.description || '',
    assignee: taskData.assignee,
    priority: taskData.priority || 'medium',
    deadline: taskData.deadline || taskData.dueDate || '',
    status: taskData.status || 'pending',
    createdAt: taskData.createdAt || new Date().toLocaleString('ko-KR')
  };
  tasks.value.push(task);
  addExecutionLog(`✅ 작업 생성(TaskCreationForm): "${task.title}"`);
  executeTaskViaIPC(task);
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

const addExecutionLog = (message) => {
  const timestamp = formatTimestamp(new Date());
  executionLogs.value.unshift({ timestamp, message });
  if (executionLogs.value.length > 50) {
    executionLogs.value.pop();
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

<style>
/* Global CSS Variables */
:root {
  --color-bg-primary: #000000;
  --color-bg-secondary: #1a1a1a;
  --color-bg-dark: #0a0a0a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-accent-text: #ffff00;
  --color-accent: linear-gradient(135deg, #ffff00 0%, #ffeb3b 50%, #ffeb3b 100%);
  --color-accent-hover: #ffeb3b;
  --color-accent-dark: #ffeb3b;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-border: rgba(255, 255, 0, 0.15);
  --glass-bg: rgba(26, 26, 26, 0.75);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Custom Sleek Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-accent-dark);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-hover);
}
</style>

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
  background: radial-gradient(circle at top right, #0f1222 0%, var(--color-bg-primary) 75%);
  color: var(--color-text-primary);
  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

.nexus-header {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 16px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--glass-shadow);
  z-index: 10;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  background: var(--color-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
  margin-bottom: 2px;
  display: inline-block;
}

.header-title p {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.header-status {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.status-badge.operational,
.status-badge.active {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.25);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
}

.nexus-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 210px;
  background: var(--color-bg-dark);
  border-right: 1px solid var(--color-border);
  padding: 15px 0;
  overflow-y: auto;
}

.nav-menu {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.nav-menu li {
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 3px solid transparent;
}

.nav-menu li:hover {
  background: rgba(223, 195, 153, 0.06);
  color: var(--color-accent-text);
}

.nav-menu li.active {
  background: rgba(255, 255, 0, 0.12);
  color: var(--color-accent-text);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--color-border);
  border-left: 3px solid var(--color-accent-hover);
}

.nav-menu li.active::before {
  content: '●';
  color: #ef4444;
  margin-right: 8px;
  font-size: 14px;
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
  font-size: 22px;
  font-weight: 700;
  background: var(--color-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.constitution-viewer, .report-viewer, .log-viewer {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 15px;
}

.memory-section {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 20px;
}

.btn-primary {
  background: #b8921a;
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
  background: #c99f2d;
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
  background: #a0a0a0;
}

.btn-small {
  background: #b8921a;
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
  background: #c99f2d;
}

.btn-small.btn-danger {
  background: #dc2626;
}

.btn-small.btn-danger:hover {
  background: #ef4444;
}

.content-box {
  background: #1a1a1a;
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
  color: #a0a0a0;
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
  background: #2d2d2d;
  border: 2px solid #404040;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.agent-card:hover {
  border-color: #d4af37;
  background: #353535;
  transform: translateY(-2px);
}

.agent-card.selected {
  border-color: #d4af37;
  background: #353535;
  box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.agent-card h3 {
  color: #d4af37;
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
  background: #1a1a1a;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-size: 11px;
}

.metric .label {
  display: block;
  color: #a0a0a0;
  margin-bottom: 4px;
}

.metric .value {
  display: block;
  color: #d4af37;
  font-weight: bold;
  font-size: 12px;
}

/* Scope 4: Agent Detail Panel */
.agent-detail-panel {
  width: 300px;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 20px;
  margin-left: 20px;
}

.agent-detail-panel h3 {
  color: #d4af37;
  margin-bottom: 15px;
  font-size: 16px;
}

.detail-content p {
  margin-bottom: 10px;
  font-size: 13px;
  color: #f5f5f5;
}

.detail-content strong {
  color: #d4af37;
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
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 20px;
}

.task-form h3 {
  color: #d4af37;
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
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 4px;
  color: #f5f5f5;
  font-family: inherit;
  font-size: 13px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #d4af37;
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
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 20px;
}

.task-list h3 {
  color: #d4af37;
  margin-bottom: 15px;
}

.task-item {
  background: #1a1a1a;
  border: 1px solid #404040;
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
  color: #f5f5f5;
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
  background: #404040;
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #06b6d4);
  transition: width 0.3s;
}

.task-actions {
  display: flex;
  gap: 5px;
}

/* Logs */
.log-viewer {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.log-entry {
  padding: 10px;
  border-bottom: 1px solid #404040;
  display: flex;
  gap: 15px;
  font-size: 13px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry .timestamp {
  color: #a0a0a0;
  min-width: 140px;
  font-size: 12px;
}

.log-entry .message {
  color: #f5f5f5;
  flex: 1;
}

.nexus-footer {
  background: #1a1a1a;
  border-top: 1px solid #2d2d2d;
  padding: 15px 30px;
  text-align: center;
  font-size: 12px;
  color: #a0a0a0;
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
