<template>
  <div class="discord-setup-wizard">
    <!-- Header -->
    <div class="wizard-header">
      <h2 class="text-xl font-bold text-gray-100">🔗 Discord 연결 마법사</h2>
      <p class="text-sm text-gray-400 mt-2">3단계로 Discord Webhook을 설정하세요</p>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section mt-6">
      <div class="flex justify-between mb-3">
        <span class="text-xs font-semibold text-gray-300">진행률</span>
        <span class="text-xs font-semibold text-cyan-400">{{ progressPercentage }}%</span>
      </div>
      <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <div class="flex justify-between mt-2">
        <span class="text-xs text-gray-400">Step {{ currentStep }}/3</span>
      </div>
    </div>

    <!-- Step Indicators -->
    <div class="step-indicators mt-6 flex gap-4">
      <div
        v-for="step in 3"
        :key="step"
        class="flex-1 flex items-center justify-center"
      >
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300',
            step < currentStep
              ? 'bg-green-600 text-white'
              : step === currentStep
              ? 'bg-cyan-500 text-white scale-110'
              : 'bg-gray-700 text-gray-400'
          ]"
        >
          {{ step < currentStep ? '✓' : step }}
        </div>
        <div
          v-if="step < 3"
          :class="[
            'h-1 flex-1 mx-2 rounded-full transition-all duration-300',
            step < currentStep ? 'bg-green-600' : 'bg-gray-700'
          ]"
        ></div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <!-- Step 1: Webhook URL Input -->
      <div v-if="currentStep === 1" class="step-1-content">
        <h3 class="text-lg font-semibold text-gray-100 mb-4">Step 1: Webhook URL 입력</h3>
        <p class="text-sm text-gray-400 mb-4">
          Discord 서버의 Webhook URL을 입력하세요. 
          <a href="https://discord.com/developers/docs/resources/webhook" target="_blank" class="text-cyan-400 hover:text-cyan-300">
            Webhook 만드는 방법 →
          </a>
        </p>
        
        <div class="form-group mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
          <input
            id="webhook-url"
            v-model="webhookUrl"
            type="text"
            placeholder="https://discordapp.com/api/webhooks/..."
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            :disabled="isLoading"
          />
          <p v-if="urlValidationError" class="text-xs text-red-400 mt-2">⚠️ {{ urlValidationError }}</p>
          <p v-else-if="webhookUrl" class="text-xs text-green-400 mt-2">✓ URL 형식이 올바릅니다</p>
        </div>

        <div class="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
          <p class="text-xs text-gray-400">
            <strong>팁:</strong> Discord 서버 설정 → 웹훅 → 새로운 웹훅 만들기 → URL 복사
          </p>
        </div>
      </div>

      <!-- Step 2: Test Message Send -->
      <div v-else-if="currentStep === 2" class="step-2-content">
        <h3 class="text-lg font-semibold text-gray-100 mb-4">Step 2: 테스트 메시지 전송</h3>
        <p class="text-sm text-gray-400 mb-4">
          Webhook 연결을 테스트하기 위해 메시지를 보냅니다
        </p>

        <div v-if="testStatus === 'idle'" class="flex flex-col gap-4">
          <div class="bg-gray-900 p-4 rounded border border-gray-700">
            <p class="text-sm text-gray-300 mb-3">📝 보낼 테스트 메시지:</p>
            <textarea
              id="test-message"
              v-model="testMessageContent"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              rows="4"
              :disabled="isLoading"
            ></textarea>
          </div>

          <button
            @click="sendTestMessage"
            :disabled="isLoading"
            class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {{ isLoading ? '전송 중...' : '테스트 메시지 전송' }}
          </button>
        </div>

        <!-- Test Success -->
        <div v-else-if="testStatus === 'success'" class="flex flex-col gap-4">
          <div class="bg-green-900/30 border border-green-600 p-4 rounded flex gap-3">
            <span class="text-2xl">✅</span>
            <div>
              <p class="font-semibold text-green-400">연결 성공!</p>
              <p class="text-sm text-green-300 mt-1">Discord Webhook이 정상적으로 작동합니다</p>
            </div>
          </div>
        </div>

        <!-- Test Error -->
        <div v-else-if="testStatus === 'error'" class="flex flex-col gap-4">
          <div class="bg-red-900/30 border border-red-600 p-4 rounded flex gap-3">
            <span class="text-2xl">❌</span>
            <div>
              <p class="font-semibold text-red-400">연결 실패</p>
              <p class="text-sm text-red-300 mt-1">{{ testErrorMessage }}</p>
            </div>
          </div>
          <button
            @click="resetTest"
            class="px-4 py-2 bg-gray-700 text-gray-100 rounded font-semibold hover:bg-gray-600 transition-all duration-300"
          >
            ← 돌아가기
          </button>
        </div>
      </div>

      <!-- Step 3: Completion -->
      <div v-else-if="currentStep === 3" class="step-3-content">
        <h3 class="text-lg font-semibold text-gray-100 mb-4">Step 3: 완료</h3>
        
        <div class="flex flex-col gap-4">
          <div class="bg-cyan-900/30 border border-cyan-600 p-6 rounded text-center">
            <p class="text-4xl mb-3">🎉</p>
            <p class="font-semibold text-cyan-400 text-lg">Discord 연결 완료!</p>
            <p class="text-sm text-cyan-300 mt-2">
              이제 시스템 메시지가 Discord로 전송됩니다
            </p>
          </div>

          <div class="bg-gray-900 p-4 rounded border border-gray-700">
            <p class="text-sm text-gray-300 mb-2"><strong>✓ 연결된 Webhook:</strong></p>
            <p class="text-xs text-gray-400 font-mono break-all">{{ maskWebhookUrl(webhookUrl) }}</p>
          </div>

          <div class="bg-gray-900 p-4 rounded border border-gray-700">
            <p class="text-sm text-gray-300 mb-2">📋 다음 단계:</p>
            <ul class="text-xs text-gray-400 space-y-1">
              <li>• 시스템이 정상 작동하는지 확인해주세요</li>
              <li>• Discord 채널에서 테스트 메시지를 받는지 확인하세요</li>
              <li>• 문제가 있으면 다시 설정할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="navigation-buttons mt-8 flex gap-3 justify-between">
      <button
        @click="previousStep"
        :disabled="currentStep === 1 || isLoading"
        class="px-4 py-2 bg-gray-700 text-gray-100 rounded font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        ← 이전
      </button>

      <div class="flex gap-3">
        <button
          @click="cancelWizard"
          class="px-4 py-2 bg-gray-700 text-gray-100 rounded font-semibold hover:bg-gray-600 transition-all duration-300"
        >
          취소
        </button>

        <button
          @click="nextStep"
          :disabled="!canProceed || isLoading"
          class="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {{ currentStep === 3 ? '완료' : '다음 →' }}
        </button>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="statusMessage" class="status-message mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded text-sm text-blue-300">
      ℹ️ {{ statusMessage }}
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-alert mt-4 p-3 bg-red-900/30 border border-red-600 rounded text-sm text-red-300">
      ⚠️ {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// State
const currentStep = ref(1);
const webhookUrl = ref('');
const isLoading = ref(false);
const error = ref('');
const statusMessage = ref('');
const testStatus = ref<'idle' | 'success' | 'error'>('idle');
const testErrorMessage = ref('');

// Computed Properties
const progressPercentage = computed(() => {
  return Math.floor((currentStep.value / 3) * 100);
});

const urlValidationError = computed(() => {
  if (!webhookUrl.value) return '';
  
  const webhookPattern = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+$/;
  if (!webhookPattern.test(webhookUrl.value)) {
    return 'Discord Webhook URL 형식이 올바르지 않습니다';
  }
  return '';
});

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return !!webhookUrl.value && !urlValidationError.value;
  }
  if (currentStep.value === 2) {
    return testStatus.value === 'success';
  }
  return true;
});

const testMessageContent = computed(() => {
  const timestamp = new Date().toLocaleString('ko-KR');
  return `{
  "embeds": [{
    "title": "🧪 CDC 테스트 메시지",
    "description": "Discord Webhook 연결이 정상적으로 작동합니다",
    "color": 51200,
    "timestamp": "${new Date().toISOString()}",
    "footer": { "text": "CDC - Creative Destruction Council" }
  }]
}`;
});

// Methods
const nextStep = async () => {
  if (!canProceed.value) return;
  
  if (currentStep.value < 3) {
    currentStep.value++;
    error.value = '';
  } else {
    // Complete wizard
    saveWebhookConfiguration();
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    testStatus.value = 'idle';
    error.value = '';
    testErrorMessage.value = '';
  }
};

const sendTestMessage = async () => {
  isLoading.value = true;
  error.value = '';
  statusMessage.value = '메시지 전송 중...';

  try {
    // Call Electron IPC to send test message
    if (window.electronAPI?.discord?.testWebhook) {
      const result = await window.electronAPI.discord.testWebhook(webhookUrl.value);
      
      if (result.success) {
        testStatus.value = 'success';
        statusMessage.value = '✓ 테스트 메시지가 전송되었습니다';
      } else {
        testStatus.value = 'error';
        testErrorMessage.value = result.error || '알 수 없는 오류가 발생했습니다';
      }
    } else {
      // Fallback for testing without Electron
      testStatus.value = 'success';
      statusMessage.value = '✓ 테스트 모드: 시뮬레이션 성공';
    }
  } catch (err) {
    testStatus.value = 'error';
    testErrorMessage.value = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다';
    error.value = testErrorMessage.value;
  } finally {
    isLoading.value = false;
  }
};

const resetTest = () => {
  testStatus.value = 'idle';
  testErrorMessage.value = '';
  statusMessage.value = '';
};

const cancelWizard = () => {
  // Reset all state
  currentStep.value = 1;
  webhookUrl.value = '';
  testStatus.value = 'idle';
  error.value = '';
  statusMessage.value = '';
  testErrorMessage.value = '';

  // Emit cancel event if parent needs it
  console.log('Discord Setup Wizard cancelled');
};

const saveWebhookConfiguration = async () => {
  isLoading.value = true;
  statusMessage.value = '설정을 저장 중...';

  try {
    if (window.electronAPI?.discord?.saveWebhook) {
      await window.electronAPI.discord.saveWebhook(webhookUrl.value);
      statusMessage.value = '✓ Discord 설정이 저장되었습니다';
    }
    
    // Reset after short delay
    setTimeout(() => {
      cancelWizard();
    }, 2000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '설정 저장 중 오류가 발생했습니다';
  } finally {
    isLoading.value = false;
  }
};

const maskWebhookUrl = (url: string): string => {
  if (!url) return '';
  const parts = url.split('/');
  if (parts.length < 2) return url;
  return `${parts.slice(0, -1).join('/')}/••••••••`;
};

// Expose for template
declare global {
  interface Window {
    electronAPI?: {
      discord?: {
        testWebhook: (url: string) => Promise<{ success: boolean; error?: string }>;
        saveWebhook: (url: string) => Promise<void>;
      };
    };
  }
}
</script>

<style scoped>
.discord-setup-wizard {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.wizard-header {
  border-bottom: 1px solid rgba(107, 114, 128, 0.3);
  padding-bottom: 1rem;
}

.progress-section {
  background: rgba(17, 24, 39, 0.5);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.step-indicators {
  animation: fadeIn 0.3s ease-in;
}

.content-area {
  animation: fadeIn 0.3s ease-in;
  min-height: 300px;
}

.form-group {
  animation: slideDown 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

input:focus {
  background-color: rgba(55, 65, 81, 1);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<!-- 
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
-->
