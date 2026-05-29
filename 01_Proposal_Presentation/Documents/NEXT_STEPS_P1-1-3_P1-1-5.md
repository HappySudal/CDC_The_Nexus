# P1-1-3부터 P1-1-5까지 병렬 개발 계획

**작성일**: 2026-05-20  
**의장님**: 수달대표  
**상태**: P1-1-2 ✅ 완료 → P1-1-3~5 준비 단계

---

## 📋 P1-1-2 완료 상태 (의장님 최종 검증 대기)

| 항목 | 상태 | 완료도 |
|:---|:---|:---:|
| **KnowledgeGraphVisualizer.vue** | ✅ 완료 | 100% |
| **테스트 (22 시나리오)** | ✅ 완료 | 100% (69/69 전체 통과) |
| **App.vue 통합** | ✅ 완료 | 100% |
| **npm 환경** | ⚠️ 재설정 중 | 99% (마지막 확인 필요) |
| **브라우저 검증** | ⏳ 예정 | 85% |

**최종 완료도**: 85-95% (브라우저 검증 완료 시 100%)

---

## 🚀 P1-1-3 ~ P1-1-5 개발 로드맵

### 일정 계획

```
2026-05-20 (오늘)
├─ P1-1-2 브라우저 검증 완료 (오후)
├─ P1-1-3 ~ 5 아키텍처 설계 시작
└─ STEP 5 최종 보고서 작성

2026-05-21 (내일)
├─ P1-1-3 개발 시작 (AgentCommandPanel)
├─ P1-1-4 프로토타입 준비
└─ P1-1-5 초안 작성

2026-05-22 ~ 23
├─ P1-1-3 테스트 & 통합
├─ P1-1-4 개발 진행
└─ P1-1-5 개발 진행

2026-05-24 (금요일)
└─ STEP 6 (전체 통합) 시작
```

---

## 🔧 P1-1-3: AgentCommandPanel.vue

**목표**: AI 에이전트 명령어 입력/전송 UI 구현

### 아키텍처

```vue
<!-- AgentCommandPanel.vue -->
<template>
  <div class="agent-command-panel">
    <!-- 명령 입력 영역 -->
    <div class="command-input-section">
      <input 
        v-model="commandInput" 
        type="text" 
        placeholder="에이전트 명령 입력..."
        @keyup.enter="sendCommand"
      />
      <button @click="sendCommand">전송</button>
    </div>

    <!-- 명령 히스토리 리스트 -->
    <div class="command-history">
      <div v-for="cmd in commandHistory" :key="cmd.id" class="command-item">
        <span class="timestamp">{{ cmd.timestamp }}</span>
        <span class="command-text">{{ cmd.text }}</span>
        <span class="status" :class="cmd.status">{{ cmd.status }}</span>
      </div>
    </div>

    <!-- 응답 패널 -->
    <div v-if="lastResponse" class="response-panel">
      <h4>응답</h4>
      <p>{{ lastResponse }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface CommandHistory {
  id: string;
  text: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'error';
}

const commandInput = ref('');
const commandHistory = ref<CommandHistory[]>([]);
const lastResponse = ref('');

const sendCommand = async () => {
  if (!commandInput.value.trim()) return;

  const command: CommandHistory = {
    id: Date.now().toString(),
    text: commandInput.value,
    timestamp: new Date().toLocaleTimeString(),
    status: 'pending'
  };

  commandHistory.value.unshift(command);
  
  try {
    // IPC를 통해 Electron 백엔드로 전송
    lastResponse.value = await window.electronAPI.executeCommand(commandInput.value);
    command.status = 'completed';
  } catch (error) {
    command.status = 'error';
    lastResponse.value = `오류: ${error.message}`;
  }

  commandInput.value = '';
};
</script>

<style scoped>
.agent-command-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.command-input-section {
  display: flex;
  gap: 8px;
}

.command-input-section input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.command-input-section button {
  padding: 8px 16px;
  background: #61affe;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.command-history {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
}

.command-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.timestamp {
  color: #999;
  min-width: 60px;
}

.status {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.error {
  background: #f8d7da;
  color: #721c24;
}

.response-panel {
  padding: 12px;
  background: #f9fafb;
  border-left: 3px solid #61affe;
  border-radius: 4px;
}

.response-panel h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.response-panel p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
```

### 테스트 시나리오 (15개 예정)

1. ✏️ 명령 입력 필드 렌더링
2. 📤 명령 전송 버튼
3. 🔤 Enter 키로 명령 전송
4. 📊 명령 히스토리 추가
5. ⏱️ 타임스탬프 기록
6. 🔄 상태 업데이트 (pending → completed)
7. ❌ 에러 상태 처리
8. 📝 응답 텍스트 표시
9. 🧹 빈 입력 방지
10. 🔌 IPC 통신
11. 💾 히스토리 최대 개수 제한
12. 🎨 상태별 스타일 다름
13. 🖥️ 반응형 레이아웃
14. ⌨️ 포커스 관리
15. 🧪 에러 메시지 표시

---

## 🔧 P1-1-4: DiscordSetupWizard.vue

**목표**: Discord Webhook 설정 마법사 UI

### 아키텍처

```vue
<!-- DiscordSetupWizard.vue -->
<template>
  <div class="discord-setup-wizard">
    <!-- Step 1: Webhook URL 입력 -->
    <div v-if="currentStep === 1" class="step">
      <h3>Step 1: Discord Webhook URL</h3>
      <input 
        v-model="webhookUrl" 
        type="text" 
        placeholder="https://discordapp.com/api/webhooks/..."
      />
      <button @click="validateWebhook">검증</button>
      <p v-if="webhookStatus" :class="webhookStatus">
        {{ webhookStatusText }}
      </p>
    </div>

    <!-- Step 2: 채널 선택 -->
    <div v-if="currentStep === 2" class="step">
      <h3>Step 2: 알림 채널 선택</h3>
      <div class="channel-list">
        <label v-for="channel in availableChannels" :key="channel.id">
          <input 
            v-model="selectedChannels" 
            type="checkbox" 
            :value="channel.id"
          />
          {{ channel.name }}
        </label>
      </div>
    </div>

    <!-- Step 3: 메시지 템플릿 -->
    <div v-if="currentStep === 3" class="step">
      <h3>Step 3: 메시지 템플릿</h3>
      <textarea 
        v-model="messageTemplate" 
        placeholder="메시지 템플릿..."
      ></textarea>
    </div>

    <!-- 네비게이션 -->
    <div class="navigation">
      <button @click="previousStep" :disabled="currentStep === 1">이전</button>
      <button v-if="currentStep < 3" @click="nextStep">다음</button>
      <button v-else @click="saveConfig">저장</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const currentStep = ref(1);
const webhookUrl = ref('');
const webhookStatus = ref('');
const selectedChannels = ref<string[]>([]);
const availableChannels = ref([
  { id: 'alerts', name: '🔔 알림' },
  { id: 'logs', name: '📝 로그' },
  { id: 'status', name: '✅ 상태' }
]);
const messageTemplate = ref('');

const webhookStatusText = computed(() => {
  const status: Record<string, string> = {
    valid: '✅ 유효한 Webhook입니다',
    invalid: '❌ 유효하지 않은 URL입니다',
    testing: '⏳ 검증 중...'
  };
  return status[webhookStatus.value] || '';
});

const validateWebhook = async () => {
  webhookStatus.value = 'testing';
  try {
    // IPC를 통해 검증
    await window.electronAPI.validateDiscordWebhook(webhookUrl.value);
    webhookStatus.value = 'valid';
  } catch {
    webhookStatus.value = 'invalid';
  }
};

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++;
};

const previousStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const saveConfig = async () => {
  const config = {
    webhookUrl: webhookUrl.value,
    channels: selectedChannels.value,
    template: messageTemplate.value
  };
  
  await window.electronAPI.saveDiscordConfig(config);
};
</script>

<style scoped>
.discord-setup-wizard {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.step {
  margin-bottom: 24px;
}

.step h3 {
  margin-top: 0;
  color: #5865F2;
}

.step input[type="text"],
.step textarea {
  width: 100%;
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
}

.step textarea {
  min-height: 100px;
  resize: vertical;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}

.channel-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.navigation {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

button {
  padding: 8px 16px;
  background: #5865F2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.valid {
  color: #22a47d;
}

.invalid {
  color: #d84040;
}

.testing {
  color: #f26522;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
```

### 테스트 시나리오 (14개 예정)

1. Step 1 렌더링
2. Webhook URL 입력
3. URL 검증 로직
4. Step 2로 진행
5. 채널 선택 (다중)
6. Step 3로 진행
7. 메시지 템플릿 입력
8. 설정 저장
9. 이전 버튼 기능
10. 다음 버튼 기능
11. 에러 처리
12. 로딩 상태
13. 입력 유효성 검사
14. IPC 통신

---

## 🔧 P1-1-5: StatusDashboard.vue

**목표**: 시스템 상태 대시보드

### 아키텍처

```vue
<!-- StatusDashboard.vue -->
<template>
  <div class="status-dashboard">
    <!-- 헤더 -->
    <div class="dashboard-header">
      <h2>시스템 상태</h2>
      <button @click="refreshStatus">🔄 새로고침</button>
    </div>

    <!-- 상태 카드들 -->
    <div class="status-grid">
      <!-- Ollama 상태 -->
      <div class="status-card" :class="ollamaStatus">
        <h3>🤖 Ollama</h3>
        <p class="status-text">{{ ollamaStatusText }}</p>
        <p class="detail">{{ ollamaDetail }}</p>
      </div>

      <!-- CDC 플랫폼 상태 -->
      <div class="status-card" :class="cdcStatus">
        <h3>🛰️ CDC Platform</h3>
        <p class="status-text">{{ cdcStatusText }}</p>
        <p class="detail">{{ cdcDetail }}</p>
      </div>

      <!-- Discord 연결 상태 -->
      <div class="status-card" :class="discordStatus">
        <h3>💬 Discord</h3>
        <p class="status-text">{{ discordStatusText }}</p>
        <p class="detail">{{ discordDetail }}</p>
      </div>

      <!-- 데이터베이스 상태 -->
      <div class="status-card" :class="dbStatus">
        <h3>📊 Database</h3>
        <p class="status-text">{{ dbStatusText }}</p>
        <p class="detail">{{ dbDetail }}</p>
      </div>
    </div>

    <!-- 상세 정보 -->
    <div class="details-section">
      <h3>상세 정보</h3>
      <ul>
        <li>CPU 사용률: {{ cpuUsage }}%</li>
        <li>메모리 사용률: {{ memoryUsage }}%</li>
        <li>실행 시간: {{ uptime }}</li>
        <li>마지막 업데이트: {{ lastUpdate }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 상태 정의
type StatusType = 'online' | 'offline' | 'error';

const ollamaStatus = ref<StatusType>('offline');
const cdcStatus = ref<StatusType>('offline');
const discordStatus = ref<StatusType>('offline');
const dbStatus = ref<StatusType>('offline');

const cpuUsage = ref(0);
const memoryUsage = ref(0);
const uptime = ref('');
const lastUpdate = ref('');

// 상태 메시지
const statusMessages: Record<StatusType, string> = {
  online: '🟢 온라인',
  offline: '🔴 오프라인',
  error: '🟠 오류'
};

const ollamaStatusText = computed(() => statusMessages[ollamaStatus.value]);
const cdcStatusText = computed(() => statusMessages[cdcStatus.value]);
const discordStatusText = computed(() => statusMessages[discordStatus.value]);
const dbStatusText = computed(() => statusMessages[dbStatus.value]);

// 상세 정보 (실제로는 IPC에서 가져옴)
const ollamaDetail = ref('');
const cdcDetail = ref('');
const discordDetail = ref('');
const dbDetail = ref('');

// 상태 갱신
const refreshStatus = async () => {
  try {
    const status = await window.electronAPI.getSystemStatus();
    
    ollamaStatus.value = status.ollama;
    cdcStatus.value = status.cdc;
    discordStatus.value = status.discord;
    dbStatus.value = status.database;
    
    cpuUsage.value = status.cpu;
    memoryUsage.value = status.memory;
    uptime.value = formatUptime(status.uptime);
    lastUpdate.value = new Date().toLocaleTimeString();
    
    // 상세 정보
    ollamaDetail.value = status.ollamaDetail || '';
    cdcDetail.value = status.cdcDetail || '';
    discordDetail.value = status.discordDetail || '';
    dbDetail.value = status.dbDetail || '';
  } catch (error) {
    console.error('Failed to refresh status:', error);
  }
};

const formatUptime = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

// 자동 갱신
let refreshInterval: NodeJS.Timeout;
onMounted(() => {
  refreshStatus();
  refreshInterval = setInterval(refreshStatus, 30000); // 30초마다
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped>
.status-dashboard {
  padding: 24px;
  max-width: 1200px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.status-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
  background: white;
}

.status-card.online {
  border-left-color: #22a47d;
  background: #f0fdf4;
}

.status-card.offline {
  border-left-color: #d84040;
  background: #fef2f2;
}

.status-card.error {
  border-left-color: #f26522;
  background: #fff7ed;
}

.status-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.status-text {
  margin: 0 0 4px 0;
  font-weight: bold;
}

.detail {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.details-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.details-section h3 {
  margin-top: 0;
}

.details-section ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.details-section li {
  padding: 4px 0;
  font-size: 13px;
  color: #666;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
```

### 테스트 시나리오 (16개 예정)

1. 대시보드 렌더링
2. 4개 상태 카드 표시
3. 상태별 색상 다름
4. 상태 메시지 정확성
5. 새로고침 버튼 동작
6. 자동 갱신 (30초)
7. CPU 사용률 표시
8. 메모리 사용률 표시
9. 실행 시간 포맷팅
10. 마지막 업데이트 시간
11. IPC 통신
12. 에러 처리
13. 로딩 상태
14. 반응형 그리드
15. 상세 정보 표시
16. 언마운트 시 자동 갱신 중지

---

## 📊 병렬 개발 체크리스트

### P1-1-3 (AgentCommandPanel)
- [ ] 컴포넌트 아키텍처 정의
- [ ] UI 구현 (입력, 버튼, 히스토리)
- [ ] IPC 통신 연동
- [ ] 15개 테스트 시나리오 작성
- [ ] 통합 테스트
- [ ] App.vue 탭 추가

### P1-1-4 (DiscordSetupWizard)
- [ ] 3단계 마법사 구현
- [ ] Webhook 검증 로직
- [ ] 채널 선택 UI
- [ ] 메시지 템플릿 에디터
- [ ] 14개 테스트 시나리오
- [ ] 설정 저장/로드

### P1-1-5 (StatusDashboard)
- [ ] 4개 상태 카드 구현
- [ ] 상태 갱신 로직
- [ ] 자동 갱신 (30초)
- [ ] CPU/메모리 모니터링
- [ ] 16개 테스트 시나리오
- [ ] 실시간 업데이트

---

## 🎯 Success Criteria

**P1-1-3**: 명령 입력/전송/히스토리 표시 완료  
**P1-1-4**: 3단계 설정 마법사 완료  
**P1-1-5**: 실시간 상태 모니터링 완료

**모든 컴포넌트**:
- ✅ TypeScript 타입 안정성 100%
- ✅ ESLint 무위반
- ✅ 테스트 커버리지 100%
- ✅ 반응형 디자인
- ✅ 슬로건 포함

---

**"시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**
