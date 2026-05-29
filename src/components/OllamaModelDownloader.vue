<template>
  <div class="ollama-model-downloader p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-lg border border-slate-700">
    <!-- Error Alert -->
    <div v-if="errorMessage" class="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg flex items-start gap-3">
      <svg class="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div class="flex-1">
        <p class="text-red-200 text-sm">{{ errorMessage }}</p>
      </div>
      <button @click="clearError" class="text-red-300 hover:text-red-100">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center transition-colors', statusIndicatorColor]">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m0 0h6"/>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Ollama Model Manager</h2>
          <p class="text-sm text-slate-400">로컬 AI 뇌 설치 & 관리</p>
        </div>
      </div>
      <div class="text-right flex items-center gap-3">
        <div v-if="isLoadingStatus" class="animate-spin">
          <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p class="text-2xl font-bold" :class="ollamaStatus.connected ? 'text-green-400' : 'text-red-400'">
          {{ ollamaStatus.connected ? '✅ 켜짐' : '❌ 꺼짐' }}
        </p>
      </div>
    </div>

    <!-- Status Section -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-700 p-4 rounded-lg">
        <p class="text-slate-400 text-sm">현재 모델</p>
        <p class="text-white font-semibold">{{ ollamaStatus.currentModel || '없음' }}</p>
      </div>
      <div class="bg-slate-700 p-4 rounded-lg">
        <p class="text-slate-400 text-sm">설치된 모델</p>
        <p class="text-white font-semibold">{{ availableModels.length }}개</p>
      </div>
      <div class="bg-slate-700 p-4 rounded-lg">
        <p class="text-slate-400 text-sm">응답 시간</p>
        <p class="text-white font-semibold">{{ ollamaStatus.responseTime || '-' }}ms</p>
      </div>
    </div>

    <!-- Active Model Switcher (드롭다운) -->
    <div v-if="availableModels.length > 0 && !isDownloading" class="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-slate-300">활성 모델 전환</label>
        <span v-if="isModelSwitching" class="text-xs text-blue-400 animate-pulse">전환 중...</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="model in availableModels"
          :key="model"
          @click="switchModel(model)"
          :disabled="isModelSwitching || ollamaStatus.currentModel === model"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between',
            ollamaStatus.currentModel === model
              ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-500'
              : 'bg-slate-600 text-slate-300 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed'
          ]"
        >
          <span>{{ model }}</span>
          <span v-if="ollamaStatus.currentModel === model" class="text-green-200">✓</span>
        </button>
      </div>
    </div>

    <!-- Model Selection -->
    <div v-if="!isDownloading" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">다운로드할 모델 선택</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="model in recommendedModels"
            :key="model"
            @click="selectModel(model)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedModel === model
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            ]"
          >
            {{ model }}
          </button>
        </div>
      </div>

      <!-- Custom Model Input -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">또는 다른 모델</label>
        <input
          v-model="customModel"
          type="text"
          placeholder="예: mistral, neural-chat, etc"
          class="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <!-- Download Button -->
      <button
        @click="downloadModel"
        :disabled="!canDownload"
        class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <span v-if="!ollamaStatus.connected">Ollama 연결 필요</span>
        <span v-else-if="!selectedModel && !customModel">모델을 선택하세요</span>
        <span v-else>모델 다운로드 시작</span>
      </button>
    </div>

    <!-- Download Progress -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-slate-300 font-medium">{{ selectedModel || customModel }} 다운로드 중...</p>
        <p class="text-slate-400 text-sm">{{ downloadProgress }}%</p>
      </div>
      <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
          :style="{ width: downloadProgress + '%' }"
        />
      </div>
      <p class="text-slate-400 text-sm text-center">{{ statusMessage }}</p>
    </div>

    <!-- Available Models List -->
    <div class="mt-6 pt-6 border-t border-slate-700">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-slate-300">설치된 모델 목록</h3>
        <div v-if="isFetchingModels" class="animate-spin">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
      <div v-if="isFetchingModels" class="text-slate-400 text-sm py-4 text-center">모델 목록 로딩 중...</div>
      <div v-else-if="availableModels.length > 0" class="space-y-2">
        <div
          v-for="model in availableModels"
          :key="model"
          :class="[
            'bg-slate-700 p-3 rounded-lg border transition-colors',
            ollamaStatus.currentModel === model ? 'border-green-500 bg-slate-700' : 'border-slate-600'
          ]"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-white font-medium">{{ model }}</span>
              <span v-if="ollamaStatus.currentModel === model" class="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                활성
              </span>
            </div>
            <button
              @click="switchModel(model)"
              :disabled="isModelSwitching || ollamaStatus.currentModel === model"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2',
                ollamaStatus.currentModel === model
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
            >
              <span v-if="isModelSwitching && loadingModelName === model" class="animate-spin">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              <span>{{ ollamaStatus.currentModel === model ? '활성' : '전환' }}</span>
            </button>
          </div>
          <!-- 모델 메타데이터 표시 -->
          <div v-if="modelMetadata[model]" class="text-xs text-slate-400 space-y-1">
            <div class="flex justify-between">
              <span>파라미터: {{ modelMetadata[model].size }}</span>
              <span>메모리: {{ modelMetadata[model].memory }}</span>
            </div>
            <div>설명: {{ modelMetadata[model].description }}</div>
          </div>
        </div>
      </div>
      <p v-else class="text-slate-400 text-sm">설치된 모델이 없습니다. 위에서 다운로드해주세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';

// 추천 모델 목록
const recommendedModels = ['llama2', 'mistral', 'neural-chat'];

// 모델 메타데이터 (파라미터 크기, 메모리 요구사항)
const modelMetadata: Record<string, { size: string; memory: string; description: string }> = {
  'llama2': { size: '7B', memory: '~4GB', description: '일반적 추론용' },
  'llama2:13b': { size: '13B', memory: '~8GB', description: '고성능 추론용' },
  'mistral': { size: '7B', memory: '~4GB', description: '빠른 응답' },
  'neural-chat': { size: '7B', memory: '~4GB', description: '대화 최적화' },
  'phi': { size: '3B', memory: '~2GB', description: '경량 모델' },
};

// State
const selectedModel = ref('llama2');
const customModel = ref('');
const isDownloading = ref(false);
const downloadProgress = ref(0);
const statusMessage = ref('');
const availableModels = ref<string[]>([]);
const errorMessage = ref('');
const isLoadingStatus = ref(false);
const isFetchingModels = ref(false);
const loadingModelName = ref('');
const isModelSwitching = ref(false);
const retryCount = ref(0);
const maxRetries = 3;

const ollamaStatus = reactive({
  connected: false,
  currentModel: '',
  responseTime: 0,
  lastChecked: 0
});

// IPC 브릿지 (window.electronAPI에서 접근)
const electronAPI = (window as any).electronAPI;

// 연산 속성
const canDownload = computed(() => {
  return !isDownloading.value && !!(selectedModel.value || customModel.value) && ollamaStatus.connected;
});

const statusIndicatorColor = computed(() => {
  if (!ollamaStatus.connected) return 'bg-red-500';
  if (isDownloading.value) return 'bg-yellow-500';
  return 'bg-green-500';
});

// 상태 확인 (재시도 로직 포함)
const checkOllamaStatus = async (retryIndex = 0) => {
  if (!electronAPI?.checkOllamaStatus) {
    errorMessage.value = 'IPC bridge not available';
    return;
  }

  isLoadingStatus.value = true;
  errorMessage.value = '';

  try {
    const response = await electronAPI.checkOllamaStatus();
    const status = response.data || response;
    ollamaStatus.connected = status.connected;
    ollamaStatus.currentModel = status.model || '';
    ollamaStatus.responseTime = status.responseTime || 0;
    ollamaStatus.lastChecked = Date.now();
    retryCount.value = 0;
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[OllamaModelDownloader] Status check failed:', error);

    if (retryIndex < maxRetries) {
      const delay = 1000 * Math.pow(2, retryIndex);
      setTimeout(() => {
        checkOllamaStatus(retryIndex + 1);
      }, delay);
      statusMessage.value = `Retrying... (${retryIndex + 1}/${maxRetries})`;
    } else {
      errorMessage.value = `Ollama 연결 실패: ${errorMsg}. 로컬에서 Ollama가 실행 중인지 확인하세요. (포트: 11434)`;
      ollamaStatus.connected = false;
    }
  } finally {
    isLoadingStatus.value = false;
  }
};

// 설치된 모델 목록 조회 (재시도 로직 포함)
const fetchAvailableModels = async (retryIndex = 0) => {
  if (!electronAPI?.listModels) {
    errorMessage.value = 'IPC bridge not available';
    return;
  }

  isFetchingModels.value = true;
  errorMessage.value = '';

  try {
    const response = await electronAPI.listModels();
    const models = response.data || response;
    availableModels.value = Array.isArray(models) ? models : [];
  } catch (error) {
    console.error('[OllamaModelDownloader] Failed to fetch models:', error);

    if (retryIndex < maxRetries) {
      const delay = 1000 * Math.pow(2, retryIndex);
      setTimeout(() => {
        fetchAvailableModels(retryIndex + 1);
      }, delay);
    } else {
      errorMessage.value = '모델 목록을 불러오지 못했습니다. 네트워크 연결을 확인하세요.';
      availableModels.value = [];
    }
  } finally {
    isFetchingModels.value = false;
  }
};

// 모델 선택
const selectModel = (model: string) => {
  selectedModel.value = model;
  customModel.value = '';
  errorMessage.value = '';
};

// 모델 다운로드 (재시도 로직 포함)
const downloadModel = async () => {
  const modelName = selectedModel.value || customModel.value;
  if (!modelName || !electronAPI?.downloadModel || !ollamaStatus.connected) return;

  isDownloading.value = true;
  downloadProgress.value = 0;
  statusMessage.value = `${modelName} 다운로드 시작...`;
  errorMessage.value = '';
  retryCount.value = 0;

  const performDownload = async () => {
    try {
      let unsubscribe: any = null;

      // 진행률 리스너 설정
      unsubscribe = electronAPI.onOllamaDownloadProgress((data: any) => {
        downloadProgress.value = data.progress || 0;
        statusMessage.value = data.message || '다운로드 중...';
      });

      // 다운로드 시작
      const result = await electronAPI.downloadModel(modelName);

      // 리스너 정리
      if (unsubscribe) {
        unsubscribe();
      }

      statusMessage.value = `${modelName} 다운로드 완료! ✅`;
      downloadProgress.value = 100;

      // 1초 후 모델 목록 갱신
      setTimeout(() => {
        fetchAvailableModels();
        checkOllamaStatus();
        isDownloading.value = false;
      }, 1000);
    } catch (error) {
      const errorMsg = (error as Error).message;

      if (retryCount.value < maxRetries) {
        retryCount.value++;
        const delay = 2000 * retryCount.value;
        statusMessage.value = `다운로드 실패. ${delay / 1000}초 후 재시도... (${retryCount.value}/${maxRetries})`;

        setTimeout(() => {
          performDownload();
        }, delay);
      } else {
        errorMessage.value = `다운로드 실패: ${errorMsg}. 디스크 공간과 네트워크 연결을 확인하세요.`;
        statusMessage.value = `${modelName} 다운로드 실패`;
        isDownloading.value = false;
      }
    }
  };

  await performDownload();
};

// 모델 로드
const loadModel = async (model: string) => {
  if (!electronAPI?.loadModel) {
    errorMessage.value = 'IPC bridge not available';
    return;
  }

  loadingModelName.value = model;
  errorMessage.value = '';

  try {
    await electronAPI.loadModel(model);
    await checkOllamaStatus();
    statusMessage.value = `${model} 로드 완료`;
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[OllamaModelDownloader] Failed to load model:', error);
    errorMessage.value = `${model} 로드 실패: ${errorMsg}`;
  } finally {
    loadingModelName.value = '';
  }
};

// 모델 전환 (로드 + 상태 확인 통합)
const switchModel = async (model: string) => {
  if (!electronAPI?.loadModel) {
    errorMessage.value = 'IPC bridge not available';
    return;
  }

  if (model === ollamaStatus.currentModel) {
    return; // 이미 로드된 모델이면 스킵
  }

  isModelSwitching.value = true;
  errorMessage.value = '';

  try {
    statusMessage.value = `${model}로 전환 중...`;
    await electronAPI.loadModel(model);
    await checkOllamaStatus();
    statusMessage.value = `${model}로 전환 완료 ✅`;
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[OllamaModelDownloader] Failed to switch model:', error);
    errorMessage.value = `${model} 전환 실패: ${errorMsg}`;
  } finally {
    isModelSwitching.value = false;
  }
};

// 에러 메시지 클리어
const clearError = () => {
  errorMessage.value = '';
};

// 초기화
onMounted(() => {
  checkOllamaStatus();
  fetchAvailableModels();

  // 5초마다 상태 체크
  const statusCheckInterval = setInterval(() => {
    if (!isDownloading.value) {
      checkOllamaStatus();
    }
  }, 5000);

  // 컴포넌트 언마운트 시 정리
  return () => {
    clearInterval(statusCheckInterval);
  };
});
</script>

<style scoped>
.ollama-model-downloader {
  min-height: 400px;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
