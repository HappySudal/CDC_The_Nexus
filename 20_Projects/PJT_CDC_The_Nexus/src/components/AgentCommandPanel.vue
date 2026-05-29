<template>
  <div class="agent-command-panel">
    <!-- 헤더 -->
    <div class="panel-header">
      <h2>🤖 도우미 명령 패널</h2>
      <span class="agent-count">{{ agents.length }}명의 도우미</span>
    </div>

    <!-- 도우미 선택 -->
    <div class="agent-selector">
      <label for="agent-select">도우미 선택:</label>
      <select v-model="selectedAgent" id="agent-select" class="agent-dropdown">
        <option value="">-- 도우미를 선택해주세요 --</option>
        <option v-for="agent in agents" :key="agent.id" :value="agent.id">
          {{ agent.emoji }} {{ agent.name }} - {{ agent.role }}
        </option>
      </select>
    </div>

    <!-- 명령어 입력 -->
    <div class="command-input-section">
      <label for="command-input">명령어:</label>
      <textarea
        v-model="commandText"
        id="command-input"
        class="command-textarea"
        placeholder="도우미에게 시킬 일을 입력해주세요... (예: 오늘 할 일 정리해줘)"
        :disabled="isExecuting"
      />
      <div class="char-count">{{ commandText.length }}/500</div>
    </div>

    <!-- 옵션 -->
    <div class="options-section">
      <label class="checkbox-label">
        <input v-model="options.priority" type="checkbox" />
        긴급 처리
      </label>
      <label class="checkbox-label">
        <input v-model="options.saveToHistory" type="checkbox" />
        히스토리 저장
      </label>
      <label class="checkbox-label">
        <input v-model="options.notifyOnComplete" type="checkbox" />
        완료 알림
      </label>
    </div>

    <!-- 실행 버튼 -->
    <div class="action-buttons">
      <button
        class="btn btn-execute"
        @click="executeCommand"
        :disabled="!selectedAgent || !commandText.trim() || isExecuting"
      >
        <span v-if="!isExecuting">⚡ 명령 실행</span>
        <span v-else>⏳ 실행 중...</span>
      </button>
      <button
        class="btn btn-clear"
        @click="clearInput"
        :disabled="isExecuting"
      >
        🗑️ 초기화
      </button>
    </div>

    <!-- 상태 표시 -->
    <div v-if="executionStatus" :class="['status-display', `status-${executionStatus.type}`]">
      <div class="status-message">{{ executionStatus.message }}</div>
      <div v-if="executionStatus.details" class="status-details">
        {{ executionStatus.details }}
      </div>
    </div>

    <!-- 응답 패널 -->
    <div v-if="lastResponse" class="response-panel">
      <div class="response-header">
        <h3>{{ lastResponse.agentName }}의 응답</h3>
        <span class="response-time">{{ formatTime(lastResponse.timestamp) }}</span>
      </div>
      <div class="response-body">{{ lastResponse.content }}</div>
    </div>

    <!-- 히스토리 섹션 -->
    <div class="history-section">
      <div class="history-header">
        <h3>📋 명령 히스토리 ({{ commandHistory.length }}개)</h3>
        <button
          v-if="commandHistory.length > 0"
          class="btn-small btn-clear-history"
          @click="clearHistory"
        >
          전체 삭제
        </button>
      </div>
      <div v-if="commandHistory.length === 0" class="empty-history">
        아직 명령 히스토리가 없습니다.
      </div>
      <div v-else class="history-list">
        <div
          v-for="(item, idx) in commandHistory.slice().reverse()"
          :key="idx"
          class="history-item"
          @click="loadFromHistory(item)"
        >
          <span class="history-agent">{{ item.agentEmoji }} {{ item.agentName }}</span>
          <span class="history-command">{{ truncate(item.command, 50) }}</span>
          <span class="history-time">{{ formatTime(item.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

interface CommandHistoryItem {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  command: string;
  response: string;
  timestamp: Date;
}

interface ExecutionStatus {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

// Props
interface Props {
  agents?: Agent[];
  maxHistorySize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  agents: () => [
    { id: 'sudal', name: '수달 의장', emoji: '🦦', role: '최고 의사결정자' },
    { id: 'lando', name: '란도', emoji: '🚀', role: '실행 담당자' },
    { id: 'openclaude', name: 'OpenClaude', emoji: '🤖', role: '분석 담당자' }
  ],
  maxHistorySize: () => 50
});

// State
const selectedAgent = ref<string>('');
const commandText = ref<string>('');
const isExecuting = ref<boolean>(false);
const commandHistory = ref<CommandHistoryItem[]>([]);
const lastResponse = ref<{ agentName: string; content: string; timestamp: Date } | null>(null);
const executionStatus = ref<ExecutionStatus | null>(null);

const options = ref({
  priority: false,
  saveToHistory: true,
  notifyOnComplete: false
});

// Computed
const agents = computed(() => props.agents);
const selectedAgentName = computed(() => {
  const agent = agents.value.find(a => a.id === selectedAgent.value);
  return agent?.name || '';
});

// Methods
const executeCommand = async () => {
  if (!selectedAgent.value || !commandText.value.trim()) return;

  isExecuting.value = true;
  executionStatus.value = {
    type: 'info',
    message: `${selectedAgentName.value}에게 명령을 보내는 중...`,
  };

  try {
    // 지연 시뮬레이션 (실제 IPC 호출로 대체)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 모의 응답 생성
    const mockResponse = `✅ 명령 완료: "${commandText.value.substring(0, 30)}..."`;

    lastResponse.value = {
      agentName: selectedAgentName.value,
      content: mockResponse,
      timestamp: new Date()
    };

    executionStatus.value = {
      type: 'success',
      message: '명령이 성공적으로 실행되었습니다.',
    };

    // 히스토리 저장
    if (options.value.saveToHistory) {
      const agent = agents.value.find(a => a.id === selectedAgent.value);
      commandHistory.value.push({
        id: `cmd-${Date.now()}`,
        agentId: selectedAgent.value,
        agentName: agent?.name || selectedAgent.value,
        agentEmoji: agent?.emoji || '🤖',
        command: commandText.value,
        response: mockResponse,
        timestamp: new Date()
      });

      // 히스토리 크기 제한
      if (commandHistory.value.length > props.maxHistorySize) {
        commandHistory.value.shift();
      }
    }

    commandText.value = '';
  } catch (error) {
    executionStatus.value = {
      type: 'error',
      message: '명령 실행 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  } finally {
    isExecuting.value = false;
  }
};

const clearInput = () => {
  selectedAgent.value = '';
  commandText.value = '';
  executionStatus.value = null;
};

const clearHistory = () => {
  commandHistory.value = [];
};

const loadFromHistory = (item: CommandHistoryItem) => {
  selectedAgent.value = item.agentId;
  commandText.value = item.command;
};

const truncate = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};
</script>

<style scoped>
.agent-command-panel {
  width: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  border: 1px solid #334155;
  color: #e0e6ed;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #475569;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.agent-count {
  font-size: 12px;
  color: #94a3b8;
  background: #0f172a;
  padding: 4px 8px;
  border-radius: 4px;
}

.agent-selector,
.command-input-section,
.options-section {
  margin-bottom: 16px;
}

.agent-selector label,
.command-input-section label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
}

.agent-dropdown {
  width: 100%;
  padding: 8px 12px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e0e6ed;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.agent-dropdown:hover {
  border-color: #64748b;
}

.agent-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.command-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e0e6ed;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.command-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.command-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.options-section {
  display: flex;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  cursor: pointer;
  accent-color: #3b82f6;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-execute {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-execute:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-execute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  background: #475569;
  color: #e0e6ed;
}

.btn-clear:hover:not(:disabled) {
  background: #64748b;
}

.btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-clear-history {
  background: #64748b;
  color: #e0e6ed;
}

.btn-clear-history:hover {
  background: #475569;
}

.status-display {
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 6px;
  border-left: 4px solid;
}

.status-success {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.status-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.status-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
}

.status-info {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.status-message {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.status-details {
  font-size: 12px;
  color: #94a3b8;
}

.response-panel {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #334155;
  background: #1e293b;
}

.response-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.response-time {
  font-size: 11px;
  color: #64748b;
}

.response-body {
  padding: 12px;
  font-size: 13px;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-word;
}

.history-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #334155;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.history-item:hover {
  background: #334155;
  border-color: #475569;
}

.history-agent {
  min-width: 60px;
  font-weight: 500;
  color: #60a5fa;
}

.history-command {
  flex: 1;
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  color: #64748b;
  min-width: 50px;
  text-align: right;
}
</style>

<!-- 시각(時刻)에 존재하고, 시간(時間) 에 소멸한다. -->
<!-- Exists in the Moment, Vanishes in Time. -->
