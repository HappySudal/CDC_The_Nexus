import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import OllamaModelDownloader from './OllamaModelDownloader.vue';

// Mock Electron API
const mockElectronAPI = {
  checkOllamaStatus: vi.fn().mockResolvedValue({
    connected: true,
    model: 'llama2',
    responseTime: 100
  }),
  listModels: vi.fn().mockResolvedValue(['llama2', 'mistral', 'neural-chat']),
  downloadModel: vi.fn().mockResolvedValue({ success: true }),
  onOllamaDownloadProgress: vi.fn((callback) => {
    // Simulate progress
    callback({ progress: 50, message: 'Downloading...' });
    return () => {}; // Return unsubscribe function
  }),
  loadModel: vi.fn().mockResolvedValue({ success: true })
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Mock setInterval/clearInterval
vi.useFakeTimers();

describe('OllamaModelDownloader Component', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllTimers();
  });

  describe('Component Mounting & Lifecycle (5 tests)', () => {
    it('should mount successfully', async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.exists()).toBe(true);
    });

    it('should have initial state', async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.selectedModel).toBe('llama2');
      expect(wrapper.vm.customModel).toBe('');
      expect(wrapper.vm.isDownloading).toBe(false);
      expect(wrapper.vm.downloadProgress).toBe(0);
    });

    it('should call checkOllamaStatus on mount', async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      await flushPromises();
      expect(mockElectronAPI.checkOllamaStatus).toHaveBeenCalled();
    });

    it('should fetch available models on mount', async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      await flushPromises();
      expect(mockElectronAPI.listModels).toHaveBeenCalled();
    });

    it('should set up status check interval', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
  });

  describe('State & Data Structure (5 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should initialize ollamaStatus as reactive object', () => {
      expect(wrapper.vm.ollamaStatus).toBeDefined();
      expect(wrapper.vm.ollamaStatus.connected).toBeDefined();
      expect(wrapper.vm.ollamaStatus.currentModel).toBeDefined();
      expect(wrapper.vm.ollamaStatus.responseTime).toBeDefined();
    });

    it('should have modelMetadata structure', () => {
      expect(wrapper.vm.modelMetadata).toBeDefined();
      expect(wrapper.vm.modelMetadata['llama2']).toBeDefined();
      expect(wrapper.vm.modelMetadata['llama2'].size).toBe('7B');
    });

    it('should have recommended models list', () => {
      expect(wrapper.vm.recommendedModels).toEqual(['llama2', 'mistral', 'neural-chat']);
    });

    it('should initialize availableModels as empty array', () => {
      expect(Array.isArray(wrapper.vm.availableModels)).toBe(true);
    });

    it('should have proper initial values for all state variables', () => {
      expect(wrapper.vm.isLoadingStatus).toBe(false);
      expect(wrapper.vm.isFetchingModels).toBe(false);
      expect(wrapper.vm.isModelSwitching).toBe(false);
      expect(wrapper.vm.retryCount).toBe(0);
      expect(wrapper.vm.maxRetries).toBe(3);
    });
  });

  describe('Status Checking (6 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should successfully check Ollama status', async () => {
      wrapper.vm.errorMessage = '';
      await wrapper.vm.checkOllamaStatus();
      await flushPromises();

      expect(wrapper.vm.ollamaStatus.connected).toBe(true);
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('llama2');
      expect(wrapper.vm.ollamaStatus.responseTime).toBe(100);
    });

    it('should set isLoadingStatus during check', async () => {
      mockElectronAPI.checkOllamaStatus.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ connected: true }), 100))
      );

      const checkPromise = wrapper.vm.checkOllamaStatus();
      expect(wrapper.vm.isLoadingStatus).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      await checkPromise;
      await flushPromises();
      expect(wrapper.vm.isLoadingStatus).toBe(false);
    });

    it('should handle status check failure with retry', async () => {
      mockElectronAPI.checkOllamaStatus.mockRejectedValueOnce(new Error('Connection failed'));
      wrapper.vm.errorMessage = '';

      await wrapper.vm.checkOllamaStatus(0);
      await flushPromises();

      // After first failure, should retry
      expect(mockElectronAPI.checkOllamaStatus).toHaveBeenCalled();
    });

    it('should reach max retries and set error', async () => {
      mockElectronAPI.checkOllamaStatus.mockRejectedValue(new Error('Connection failed'));

      await wrapper.vm.checkOllamaStatus(3); // maxRetries = 3
      await flushPromises();

      expect(wrapper.vm.errorMessage).toContain('Ollama 연결 실패');
      expect(wrapper.vm.ollamaStatus.connected).toBe(false);
    });

    it('should reset retryCount on successful check', async () => {
      mockElectronAPI.checkOllamaStatus.mockResolvedValueOnce({ connected: true, model: 'llama2', responseTime: 100 });
      wrapper.vm.retryCount = 2;
      await wrapper.vm.checkOllamaStatus();
      await flushPromises();

      expect(wrapper.vm.retryCount).toBe(0);
    });

    it('should update lastChecked timestamp', async () => {
      mockElectronAPI.checkOllamaStatus.mockResolvedValueOnce({ connected: true, model: 'llama2', responseTime: 100 });
      const beforeCheck = Date.now();
      await wrapper.vm.checkOllamaStatus();
      await flushPromises();

      expect(wrapper.vm.ollamaStatus.lastChecked).toBeGreaterThanOrEqual(beforeCheck);
    });
  });

  describe('Model Listing & Fetching (6 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should fetch available models successfully', async () => {
      wrapper.vm.availableModels = [];
      await wrapper.vm.fetchAvailableModels();
      await flushPromises();

      expect(wrapper.vm.availableModels).toEqual(['llama2', 'mistral', 'neural-chat']);
    });

    it('should set isFetchingModels state', async () => {
      mockElectronAPI.listModels.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve(['llama2']), 100))
      );

      const fetchPromise = wrapper.vm.fetchAvailableModels();
      expect(wrapper.vm.isFetchingModels).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      await fetchPromise;
      await flushPromises();
      expect(wrapper.vm.isFetchingModels).toBe(false);
    });

    it('should handle fetch failure with retry', async () => {
      mockElectronAPI.listModels.mockRejectedValueOnce(new Error('Network error'));

      await wrapper.vm.fetchAvailableModels(0);
      await flushPromises();

      expect(mockElectronAPI.listModels).toHaveBeenCalled();
    });

    it('should set error on max retries', async () => {
      mockElectronAPI.listModels.mockRejectedValue(new Error('Network error'));

      await wrapper.vm.fetchAvailableModels(3);
      await flushPromises();

      expect(wrapper.vm.errorMessage).toContain('모델 목록을 불러오지 못했습니다');
      expect(wrapper.vm.availableModels).toEqual([]);
    });

    it('should clear error on successful fetch', async () => {
      wrapper.vm.errorMessage = 'Previous error';
      await wrapper.vm.fetchAvailableModels();
      await flushPromises();

      expect(wrapper.vm.errorMessage).toBe('');
    });

    it('should handle array response format', async () => {
      mockElectronAPI.listModels.mockResolvedValueOnce({
        data: ['model1', 'model2']
      });

      await wrapper.vm.fetchAvailableModels();
      await flushPromises();

      expect(wrapper.vm.availableModels).toEqual(['model1', 'model2']);
    });
  });

  describe('Model Selection (4 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should select recommended model', async () => {
      wrapper.vm.selectModel('mistral');
      expect(wrapper.vm.selectedModel).toBe('mistral');
    });

    it('should clear custom model when selecting recommended', async () => {
      wrapper.vm.customModel = 'custom-model';
      wrapper.vm.selectModel('llama2');
      expect(wrapper.vm.customModel).toBe('');
    });

    it('should clear error on selection', async () => {
      wrapper.vm.errorMessage = 'Previous error';
      wrapper.vm.selectModel('mistral');
      expect(wrapper.vm.errorMessage).toBe('');
    });

    it('should not allow download without model selection', async () => {
      wrapper.vm.selectedModel = '';
      wrapper.vm.customModel = '';
      expect(wrapper.vm.canDownload).toBe(false);
    });
  });

  describe('Download Functionality (7 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.ollamaStatus.connected = true;
      await flushPromises();
    });

    it('should start download with selected model', async () => {
      wrapper.vm.selectedModel = 'llama2';
      await wrapper.vm.downloadModel();
      await flushPromises();

      expect(mockElectronAPI.downloadModel).toHaveBeenCalledWith('llama2');
    });

    it('should use custom model if provided', async () => {
      wrapper.vm.selectedModel = '';
      wrapper.vm.customModel = 'custom-llama';
      await wrapper.vm.downloadModel();
      await flushPromises();

      expect(mockElectronAPI.downloadModel).toHaveBeenCalledWith('custom-llama');
    });

    it('should track download progress', async () => {
      wrapper.vm.selectedModel = 'llama2';
      await wrapper.vm.downloadModel();
      await flushPromises();

      expect(wrapper.vm.downloadProgress).toBeGreaterThan(0);
      expect(wrapper.vm.statusMessage).toBeTruthy();
    });

    it('should set isDownloading state', async () => {
      wrapper.vm.selectedModel = 'llama2';
      const downloadPromise = wrapper.vm.downloadModel();

      expect(wrapper.vm.isDownloading).toBe(true);

      await downloadPromise;
      await flushPromises();
      // After completion, should be set to false in setTimeout
    });

    it('should retry download on failure', async () => {
      mockElectronAPI.downloadModel.mockRejectedValueOnce(new Error('Download failed'));
      mockElectronAPI.downloadModel.mockResolvedValueOnce({ success: true });

      wrapper.vm.selectedModel = 'llama2';
      await wrapper.vm.downloadModel();
      await flushPromises();

      expect(wrapper.vm.retryCount).toBeGreaterThan(0);
    });

    it('should show error on max retries', async () => {
      // 마운트 시 예약된 fetch 재시도/5초 인터벌 타이머 제거 (간섭 방지)
      vi.clearAllTimers();
      // 연결 상태를 컴포넌트 경로로 확립 (이전 테스트 mock 누수에 견고하도록 영구 resolve)
      mockElectronAPI.checkOllamaStatus.mockReset();
      mockElectronAPI.checkOllamaStatus.mockResolvedValue({ connected: true, model: 'llama2', responseTime: 100 });
      await wrapper.vm.checkOllamaStatus();
      await wrapper.vm.$nextTick();

      // 이전 테스트의 mockResolvedValueOnce 누수 방지: once 큐까지 초기화 후 reject 설정
      mockElectronAPI.downloadModel.mockReset();
      mockElectronAPI.downloadModel.mockRejectedValue(new Error('Download failed'));
      wrapper.vm.selectedModel = 'llama2';
      await wrapper.vm.downloadModel();      // 1차 시도 실패 → 2s 후 재시도 예약
      // 각 재시도 지연을 단계적으로 진행 (2s→4s→6s). 5초 자동상태체크의 errorMessage 초기화(15s) 이전 누적 ~12s
      await vi.advanceTimersByTimeAsync(2100);
      await vi.advanceTimersByTimeAsync(4100);
      await vi.advanceTimersByTimeAsync(6100);
      await flushPromises();

      expect(wrapper.vm.errorMessage).toContain('다운로드 실패');
    });

    it('should fetch models after download', async () => {
      wrapper.vm.selectedModel = 'llama2';
      mockElectronAPI.downloadModel.mockResolvedValueOnce({ success: true });
      mockElectronAPI.listModels.mockResolvedValueOnce(['llama2', 'new-model']);

      await wrapper.vm.downloadModel();
      await flushPromises();

      // After download, should fetch models and check status
      vi.advanceTimersByTime(1000);
      await flushPromises();

      expect(mockElectronAPI.listModels).toHaveBeenCalled();
    });
  });

  describe('Model Loading & Switching (4 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should load specific model', async () => {
      await wrapper.vm.loadModel('llama2');
      await flushPromises();

      expect(mockElectronAPI.loadModel).toHaveBeenCalledWith('llama2');
    });

    it('should switch to different model', async () => {
      wrapper.vm.ollamaStatus.currentModel = 'mistral';
      await wrapper.vm.switchModel('llama2');
      await flushPromises();

      expect(mockElectronAPI.loadModel).toHaveBeenCalledWith('llama2');
    });

    it('should set isModelSwitching state', async () => {
      wrapper.vm.ollamaStatus.currentModel = 'mistral';
      const switchPromise = wrapper.vm.switchModel('llama2');

      expect(wrapper.vm.isModelSwitching).toBe(true);

      await switchPromise;
      await flushPromises();
      expect(wrapper.vm.isModelSwitching).toBe(false);
    });

    it('should skip switch if already loaded', async () => {
      wrapper.vm.ollamaStatus.currentModel = 'llama2';
      await wrapper.vm.switchModel('llama2');

      // Should return early without calling loadModel
      expect(mockElectronAPI.loadModel).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling (3 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should clear error message', async () => {
      wrapper.vm.errorMessage = 'Some error';
      wrapper.vm.clearError();
      expect(wrapper.vm.errorMessage).toBe('');
    });

    it('should handle missing IPC bridge', async () => {
      const tempAPI = window.electronAPI;
      window.electronAPI = undefined;
      const testWrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);

      await testWrapper.vm.checkOllamaStatus();
      await flushPromises();

      expect(testWrapper.vm.errorMessage).toContain('IPC bridge not available');

      window.electronAPI = tempAPI;
      testWrapper.unmount();
    });

    it('should show descriptive error messages', async () => {
      mockElectronAPI.checkOllamaStatus.mockRejectedValueOnce(
        new Error('Connection refused')
      );

      await wrapper.vm.checkOllamaStatus(3);
      await flushPromises();

      expect(wrapper.vm.errorMessage).toContain('Connection refused');
    });
  });

  describe('Computed Properties (2 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should compute canDownload correctly', async () => {
      wrapper.vm.ollamaStatus.connected = true;
      wrapper.vm.selectedModel = 'llama2';
      wrapper.vm.isDownloading = false;

      expect(wrapper.vm.canDownload).toBe(true);

      wrapper.vm.ollamaStatus.connected = false;
      expect(wrapper.vm.canDownload).toBe(false);

      wrapper.vm.ollamaStatus.connected = true;
      wrapper.vm.isDownloading = true;
      expect(wrapper.vm.canDownload).toBe(false);
    });

    it('should compute statusIndicatorColor correctly', async () => {
      wrapper.vm.ollamaStatus.connected = false;
      expect(wrapper.vm.statusIndicatorColor).toContain('red');

      wrapper.vm.ollamaStatus.connected = true;
      wrapper.vm.isDownloading = true;
      expect(wrapper.vm.statusIndicatorColor).toContain('yellow');

      wrapper.vm.isDownloading = false;
      expect(wrapper.vm.statusIndicatorColor).toContain('green');
    });
  });

  describe('UI Elements & Display (3 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
      await flushPromises();
    });

    it('should render status indicator', async () => {
      const indicator = wrapper.find('.w-10.h-10');
      expect(indicator.exists()).toBe(true);
    });

    it('should display available models when connected', async () => {
      wrapper.vm.availableModels = ['llama2', 'mistral'];
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('llama2');
      expect(wrapper.text()).toContain('mistral');
    });

    it('should show model metadata when available', async () => {
      wrapper.vm.availableModels = ['llama2'];
      await wrapper.vm.$nextTick();

      const metadata = wrapper.vm.modelMetadata['llama2'];
      expect(metadata.size).toBe('7B');
      expect(metadata.memory).toBe('~4GB');
    });
  });

  describe('Edge Cases (3 tests)', () => {
    beforeEach(async () => {
      wrapper = mount(OllamaModelDownloader);
      await vi.advanceTimersByTimeAsync(50);
    });

    it('should handle rapid model selection changes', async () => {
      wrapper.vm.selectModel('llama2');
      wrapper.vm.selectModel('mistral');
      wrapper.vm.selectModel('neural-chat');

      expect(wrapper.vm.selectedModel).toBe('neural-chat');
      expect(wrapper.vm.customModel).toBe('');
    });

    it('should handle download progress updates', async () => {
      const progressCallback = vi.fn();
      mockElectronAPI.onOllamaDownloadProgress.mockImplementationOnce((cb) => {
        cb({ progress: 25 });
        cb({ progress: 50 });
        cb({ progress: 75 });
        cb({ progress: 100 });
        return () => {};
      });

      wrapper.vm.selectedModel = 'llama2';
      wrapper.vm.ollamaStatus.connected = true;
      await wrapper.vm.downloadModel();
      await flushPromises();

      // Progress should be tracked
      expect(wrapper.vm.downloadProgress).toBeGreaterThan(0);
    });

    it('should cleanup interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const instance = wrapper.vm;

      // Manually trigger cleanup
      vi.advanceTimersByTime(5000);

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();

      // Interval should be cleared during unmount
    });
  });
});

/**
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
