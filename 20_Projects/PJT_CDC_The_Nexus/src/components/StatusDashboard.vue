<template>
  <div class="status-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h2 class="text-xl font-bold text-gray-100">📊 시스템 상태</h2>
      <div class="flex gap-2 items-center">
        <button
          @click="refreshStatus"
          :disabled="isLoading"
          class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded text-sm transition-all duration-300 disabled:opacity-50"
          title="지금 새로고침"
        >
          🔄 {{ isLoading ? '로딩 중...' : '새로고침' }}
        </button>
        <span class="text-xs text-gray-400">자동 갱신: {{ autoRefreshInterval }}초</span>
      </div>
    </div>

    <!-- Status Grid -->
    <div class="status-grid mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Ollama Status Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-100">🤖 Ollama 서버</h3>
          <div
            :class="[
              'w-3 h-3 rounded-full',
              ollamaStatus === 'online'
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
            ]"
            :title="ollamaStatus === 'online' ? '온라인' : '오프라인'"
          ></div>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">상태:</span>
            <span
              :class="[
                'font-semibold',
                ollamaStatus === 'online' ? 'text-green-400' : 'text-red-400'
              ]"
            >
              {{ ollamaStatus === 'online' ? '🟢 온라인' : '🔴 오프라인' }}
            </span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">버전:</span>
            <span class="text-gray-200">{{ ollamaVersion || 'N/A' }}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">포트:</span>
            <span class="text-gray-200">{{ ollamaPort }}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">마지막 확인:</span>
            <span class="text-gray-300 text-xs">{{ lastCheckTime }}</span>
          </div>
        </div>

        <div v-if="ollamaStatus === 'offline'" class="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
          ⚠️ Ollama 서버가 오프라인입니다. 설정을 확인하세요.
        </div>
      </div>

      <!-- Statistics Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 class="font-semibold text-gray-100 mb-3">📈 통계</h3>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">평균 응답 시간:</span>
            <span class="text-cyan-400 font-semibold">{{ averageResponseTime }}ms</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">최근 응답 시간:</span>
            <span class="text-gray-200">{{ lastResponseTime }}ms</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">총 요청 수:</span>
            <span class="text-gray-200">{{ totalRequests }}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-400">성공률:</span>
            <span :class="['font-semibold', successRate >= 95 ? 'text-green-400' : 'text-yellow-400']">
              {{ successRate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Memory & Resources Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 class="font-semibold text-gray-100 mb-3">💾 리소스</h3>
        
        <div class="space-y-3">
          <div>
            <div class="flex justify-between mb-1 text-sm">
              <span class="text-gray-400">메모리 사용률</span>
              <span class="text-cyan-400 font-semibold">{{ memoryUsage }}%</span>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                :style="{ width: `${memoryUsage}%` }"
              ></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between mb-1 text-sm">
              <span class="text-gray-400">CPU 사용률</span>
              <span class="text-purple-400 font-semibold">{{ cpuUsage }}%</span>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                :style="{ width: `${cpuUsage}%` }"
              ></div>
            </div>
          </div>

          <div class="text-xs text-gray-400 mt-2">
            📊 업타임: {{ uptime }} 시간
          </div>
        </div>
      </div>

      <!-- Models Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 class="font-semibold text-gray-100 mb-3">🧠 로드된 모델</h3>
        
        <div v-if="loadedModels.length > 0" class="space-y-2">
          <div
            v-for="model in loadedModels"
            :key="model.name"
            class="flex items-center justify-between p-2 bg-gray-900 rounded border border-gray-700"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-100 truncate">{{ model.name }}</p>
              <p class="text-xs text-gray-400">{{ model.size }}</p>
            </div>
            <div class="text-xs text-cyan-400 font-semibold ml-2">{{ model.status }}</div>
          </div>
        </div>
        
        <div v-else class="text-sm text-gray-400">
          🔕 로드된 모델이 없습니다
        </div>

        <div class="mt-3 text-xs text-gray-400">
          💾 메모리 노드: {{ memoryNodes }}개
        </div>
      </div>

      <!-- Agent Status Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4 md:col-span-2">
        <h3 class="font-semibold text-gray-100 mb-3">🤖 에이전트 상태 (15개 사도)</h3>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div
            v-for="(agent, index) in agents"
            :key="index"
            class="flex flex-col items-center p-2 bg-gray-900 rounded border border-gray-700 text-center"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1',
                agent.status === 'active'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-gray-700 text-gray-400'
              ]"
            >
              {{ agent.icon }}
            </div>
            <p class="text-xs font-semibold text-gray-200 truncate">{{ agent.name }}</p>
            <p
              :class="[
                'text-xs font-medium',
                agent.status === 'active' ? 'text-green-400' : 'text-gray-500'
              ]"
            >
              {{ agent.status === 'active' ? '활성' : '대기' }}
            </p>
          </div>
        </div>
      </div>

      <!-- System Health Card -->
      <div class="status-card bg-gray-800 border border-gray-700 rounded-lg p-4 md:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-100">🏥 시스템 상태</h3>
          <div
            :class="[
              'px-2 py-1 rounded text-xs font-semibold',
              systemHealth === 'excellent'
                ? 'bg-green-900 text-green-300'
                : systemHealth === 'good'
                ? 'bg-blue-900 text-blue-300'
                : systemHealth === 'warning'
                ? 'bg-yellow-900 text-yellow-300'
                : 'bg-red-900 text-red-300'
            ]"
          >
            {{ systemHealthLabel }}
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                ollamaStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-gray-400">Ollama:</span>
            <span
              :class="[
                ollamaStatus === 'online' ? 'text-green-400' : 'text-red-400'
              ]"
            >
              {{ ollamaStatus === 'online' ? '정상' : '오류' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                memoryUsage < 80 ? 'bg-green-500' : 'bg-yellow-500'
              ]"
            ></div>
            <span class="text-gray-400">메모리:</span>
            <span
              :class="[
                memoryUsage < 80 ? 'text-green-400' : 'text-yellow-400'
              ]"
            >
              {{ memoryUsage < 80 ? '정상' : '주의' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                successRate >= 95 ? 'bg-green-500' : 'bg-yellow-500'
              ]"
            ></div>
            <span class="text-gray-400">성공률:</span>
            <span
              :class="[
                successRate >= 95 ? 'text-green-400' : 'text-yellow-400'
              ]"
            >
              {{ successRate >= 95 ? '정상' : '주의' }}
            </span>
          </div>
        </div>

        <div v-if="systemHealth !== 'excellent'" class="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300">
          💡 팁: 시스템 설정을 확인하세요
        </div>
      </div>
    </div>

    <!-- Auto-refresh Info -->
    <div class="mt-6 text-xs text-gray-500 text-center">
      ⏱️ {{ autoRefreshInterval }}초마다 자동 갱신 중
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';

// State
const isLoading = ref(false);
const ollamaStatus = ref<'online' | 'offline'>('offline');
const ollamaVersion = ref('');
const ollamaPort = ref(11434);
const lastCheckTime = ref('');
const averageResponseTime = ref(0);
const lastResponseTime = ref(0);
const totalRequests = ref(0);
const successRate = ref(100);
const memoryUsage = ref(0);
const cpuUsage = ref(0);
const uptime = ref(0);
const loadedModels = ref<Array<{ name: string; size: string; status: string }>>([]);
const memoryNodes = ref(0);
const autoRefreshInterval = ref(5);
let refreshInterval: NodeJS.Timeout | null = null;

// Agent roster (15 apostles)
const agents = ref([
  { name: '1. 중원', icon: '🔴', status: 'active' },
  { name: '2. 러도', icon: '🟠', status: 'active' },
  { name: '3. 서기', icon: '🟡', status: 'active' },
  { name: '4. 안티', icon: '🟢', status: 'active' },
  { name: '5. 태순', icon: '🔵', status: 'active' },
  { name: '6. 클로드', icon: '🟣', status: 'active' },
  { name: '7. 사도1', icon: '🤖', status: 'idle' },
  { name: '8. 사도2', icon: '🤖', status: 'idle' },
  { name: '9. 사도3', icon: '🤖', status: 'idle' },
  { name: '10. 사도4', icon: '🤖', status: 'idle' },
  { name: '11. 사도5', icon: '🤖', status: 'idle' },
  { name: '12. 사도6', icon: '🤖', status: 'idle' },
  { name: '13. 사도7', icon: '🤖', status: 'idle' },
  { name: '14. 사도8', icon: '🤖', status: 'idle' },
  { name: '15. 사도9', icon: '🤖', status: 'idle' },
]);

// Computed Properties
const systemHealth = computed(() => {
  if (
    ollamaStatus.value === 'online' &&
    memoryUsage.value < 80 &&
    successRate.value >= 99
  ) {
    return 'excellent';
  } else if (
    ollamaStatus.value === 'online' &&
    memoryUsage.value < 90 &&
    successRate.value >= 95
  ) {
    return 'good';
  } else if (
    ollamaStatus.value === 'online' &&
    memoryUsage.value < 95 &&
    successRate.value >= 90
  ) {
    return 'warning';
  }
  return 'critical';
});

const systemHealthLabel = computed(() => {
  const labels = {
    excellent: '🟢 최적',
    good: '🔵 정상',
    warning: '🟡 주의',
    critical: '🔴 위험',
  };
  return labels[systemHealth.value] || '🔴 알 수 없음';
});

// Methods
const refreshStatus = async () => {
  isLoading.value = true;
  try {
    if (window.electronAPI?.ollama?.getStatus) {
      const status = await window.electronAPI.ollama.getStatus();
      if (!status) {
        ollamaStatus.value = 'offline';
        return;
      }

      ollamaStatus.value = status.online ? 'online' : 'offline';
      ollamaVersion.value = status.version || '';
      ollamaPort.value = status.port || 11434;
      averageResponseTime.value = status.avgResponseTime || 0;
      lastResponseTime.value = status.lastResponseTime || 0;
      totalRequests.value = status.totalRequests || 0;
      successRate.value = status.successRate || 100;
      memoryUsage.value = status.memoryUsage || 0;
      cpuUsage.value = status.cpuUsage || 0;
      uptime.value = status.uptime || 0;
      memoryNodes.value = status.memoryNodes || 0;
      
      if (status.models && Array.isArray(status.models)) {
        loadedModels.value = status.models.map((m: any) => ({
          name: m.name || 'Unknown',
          size: m.size || 'N/A',
          status: m.loaded ? '로드됨' : '대기',
        }));
      }
    } else {
      // Fallback mock data for testing
      ollamaStatus.value = 'online';
      ollamaVersion.value = '0.1.28';
      memoryUsage.value = Math.floor(Math.random() * 70) + 20;
      cpuUsage.value = Math.floor(Math.random() * 50) + 10;
      averageResponseTime.value = Math.floor(Math.random() * 500) + 100;
      lastResponseTime.value = Math.floor(Math.random() * 600) + 100;
      totalRequests.value = Math.floor(Math.random() * 10000) + 1000;
      successRate.value = Math.floor(Math.random() * 5) + 95;
      uptime.value = Math.floor(Math.random() * 200) + 24;
      memoryNodes.value = Math.floor(Math.random() * 150) + 50;
      
      loadedModels.value = [
        { name: 'llama2', size: '3.8GB', status: '로드됨' },
        { name: 'mistral', size: '7.4GB', status: '로드됨' },
        { name: 'neural-chat', size: '4.1GB', status: '대기' },
      ];
    }
    
    lastCheckTime.value = new Date().toLocaleTimeString('ko-KR');
  } catch (err) {
    console.error('Status refresh error:', err);
    ollamaStatus.value = 'offline';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  refreshStatus();
  
  // Set up auto-refresh
  refreshInterval = setInterval(() => {
    refreshStatus();
  }, autoRefreshInterval.value * 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.status-dashboard {
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(107, 114, 128, 0.3);
}

.status-grid {
  animation: fadeIn 0.3s ease-in;
}

.status-card {
  animation: slideUp 0.3s ease-out;
  transition: border-color 0.3s ease;
}

.status-card:hover {
  border-color: rgba(6, 182, 212, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

<!-- 
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
-->

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
