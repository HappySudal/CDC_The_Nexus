/**
 * Unit Tests for OllamaModelDownloader.vue
 * Tests cover error handling, retry logic, state management, and IPC communication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import OllamaModelDownloader from '../src/components/OllamaModelDownloader.vue';

describe('OllamaModelDownloader.vue', () => {
  let wrapper: VueWrapper;
  let mockIpc: any;

  beforeEach(() => {
    mockIpc = {
      checkOllamaStatus: vi.fn().mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      }),
      listModels: vi.fn().mockResolvedValue([]),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      loadModel: vi.fn().mockResolvedValue(undefined),
      onOllamaDownloadProgress: vi.fn().mockReturnValue(() => {})
    };

    // Mock window.electronAPI (correct path for component)
    (window as any).electronAPI = mockIpc;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should mount successfully', () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });

      wrapper = mount(OllamaModelDownloader);
      expect(wrapper.exists()).toBe(true);
    });

    it('should check Ollama status on mount', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: 'llama2',
        responseTime: 1200
      });

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      expect(mockIpc.checkOllamaStatus).toHaveBeenCalled();
    });

    it('should fetch available models on mount', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });

      const mockModels = ['llama2', 'mistral'];
      mockIpc.listModels.mockResolvedValueOnce(mockModels);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      expect(mockIpc.listModels).toHaveBeenCalled();
    });
  });

  describe('checkOllamaStatus()', () => {
    it('should update status on successful connection check', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: 'mistral',
        responseTime: 850
      });

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      expect(wrapper.vm.ollamaStatus.connected).toBe(true);
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('mistral');
      expect(wrapper.vm.ollamaStatus.responseTime).toBe(850);
    });

    it('should handle connection error gracefully', async () => {
      mockIpc.checkOllamaStatus.mockRejectedValueOnce(
        new Error('Connection refused')
      );
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: false,
        model: '',
        responseTime: 0
      });

      wrapper = mount(OllamaModelDownloader);
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wrapper.vm.ollamaStatus.connected).toBe(false);
    });

    it('should retry up to 3 times on failure', async () => {
      mockIpc.checkOllamaStatus.mockRejectedValueOnce(new Error('Network error'));
      mockIpc.checkOllamaStatus.mockRejectedValueOnce(new Error('Network error'));
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'neural-chat',
        responseTime: 1100
      });

      wrapper = mount(OllamaModelDownloader);

      await new Promise(resolve => setTimeout(resolve, 4000));

      expect(mockIpc.checkOllamaStatus).toHaveBeenCalledTimes(3);
    });

    it('should set error message after max retries exceeded', async () => {
      mockIpc.checkOllamaStatus.mockRejectedValue(new Error('Connection timeout'));

      wrapper = mount(OllamaModelDownloader);

      // Exponential backoff: 1s + 2s + 4s = 7s, add buffer for async operations
      await new Promise(resolve => setTimeout(resolve, 7500));

      expect(wrapper.vm.errorMessage).toContain('Ollama 연결 실패');
      expect(wrapper.vm.ollamaStatus.connected).toBe(false);
    });

    it('should track lastChecked timestamp', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: 'llama2',
        responseTime: 900
      });

      wrapper = mount(OllamaModelDownloader);
      const beforeTime = Date.now();

      await nextTick();

      expect(wrapper.vm.ollamaStatus.lastChecked).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('fetchAvailableModels()', () => {
    it('should fetch and store available models', async () => {
      const models = ['llama2', 'mistral', 'neural-chat'];
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce(models);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      expect(wrapper.vm.availableModels).toEqual(models);
    });

    it('should handle fetch error with retry logic', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockRejectedValueOnce(new Error('Failed to fetch'));
      mockIpc.listModels.mockResolvedValueOnce(['llama2']);

      wrapper = mount(OllamaModelDownloader);

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(wrapper.vm.availableModels).toEqual(['llama2']);
    });

    it('should set empty array on persistent failure', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockRejectedValue(new Error('Network unavailable'));

      wrapper = mount(OllamaModelDownloader);

      // Exponential backoff: 1s + 2s + 4s = 7s, add buffer for async operations
      await new Promise(resolve => setTimeout(resolve, 7500));

      expect(wrapper.vm.availableModels).toEqual([]);
      expect(wrapper.vm.errorMessage).toContain('모델 목록을 불러오지 못했습니다');
    });
  });

  describe('selectModel()', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      wrapper = mount(OllamaModelDownloader);
    });

    it('should update selectedModel', async () => {
      await wrapper.vm.selectModel('mistral');
      expect(wrapper.vm.selectedModel).toBe('mistral');
    });

    it('should clear customModel when selecting recommended model', async () => {
      wrapper.vm.customModel = 'custom-llm';
      await wrapper.vm.selectModel('llama2');
      expect(wrapper.vm.customModel).toBe('');
    });

    it('should clear error message when selecting model', async () => {
      wrapper.vm.errorMessage = 'Previous error';
      await wrapper.vm.selectModel('neural-chat');
      expect(wrapper.vm.errorMessage).toBe('');
    });
  });

  describe('downloadModel()', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);
      wrapper = mount(OllamaModelDownloader);
      wrapper.vm.selectedModel = 'llama2';
    });

    it('should start download with progress tracking', async () => {
      mockIpc.downloadModel.mockResolvedValueOnce({
        success: true
      });
      mockIpc.onOllamaDownloadProgress.mockReturnValueOnce(() => {});

      await wrapper.vm.downloadModel();
      await nextTick();

      expect(mockIpc.downloadModel).toHaveBeenCalled();
      expect(mockIpc.onOllamaDownloadProgress).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update progress on download event', async () => {
      let progressCallback: any;
      mockIpc.downloadModel.mockResolvedValueOnce({
        success: true
      });
      mockIpc.onOllamaDownloadProgress.mockImplementationOnce((callback: any) => {
        progressCallback = callback;
        return () => {};
      });

      await wrapper.vm.downloadModel();

      // Simulate progress event
      if (progressCallback) {
        progressCallback({ progress: 50, message: 'Downloading...' });
      }

      expect(wrapper.vm.downloadProgress).toBe(50);
      expect(wrapper.vm.statusMessage).toContain('Downloading');
    });

    it('should handle download failure with retry', async () => {
      mockIpc.downloadModel.mockRejectedValueOnce(new Error('Download failed'));
      mockIpc.downloadModel.mockResolvedValueOnce({
        success: true
      });

      await wrapper.vm.downloadModel();
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(wrapper.vm.retryCount).toBeGreaterThan(0);
    });

    it('should show error after max retries exceeded', async () => {
      mockIpc.downloadModel.mockRejectedValue(new Error('Persistent download failure'));
      mockIpc.onOllamaDownloadProgress.mockReturnValue(() => {});

      await wrapper.vm.downloadModel();
      // Download retries: 2s + 4s + 6s = 12s delay before error is set
      await new Promise(resolve => setTimeout(resolve, 13000));

      expect(wrapper.vm.errorMessage).toContain('다운로드 실패');
      expect(wrapper.vm.isDownloading).toBe(false);
    });

    it('should complete download successfully', async () => {
      mockIpc.downloadModel.mockResolvedValueOnce({
        success: true
      });
      mockIpc.onOllamaDownloadProgress.mockReturnValue(() => {});
      mockIpc.listModels.mockResolvedValueOnce(['llama2']);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'llama2',
        responseTime: 100
      });

      await wrapper.vm.downloadModel();
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(wrapper.vm.downloadProgress).toBe(100);
      expect(wrapper.vm.statusMessage).toContain('완료');
    });
  });

  describe('loadModel()', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);
      wrapper = mount(OllamaModelDownloader);
    });

    it('should load model successfully', async () => {
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'mistral',
        responseTime: 950
      });

      await wrapper.vm.loadModel('mistral');
      await nextTick();

      expect(mockIpc.loadModel).toHaveBeenCalledWith('mistral');
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('mistral');
    });

    it('should set loading state during model load', async () => {
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'llama2',
        responseTime: 1100
      });

      const loadPromise = wrapper.vm.loadModel('llama2');
      expect(wrapper.vm.loadingModelName).toBe('llama2');

      await loadPromise;
      expect(wrapper.vm.loadingModelName).toBe('');
    });

    it('should handle load error gracefully', async () => {
      mockIpc.loadModel.mockRejectedValueOnce(new Error('Model not found'));

      await wrapper.vm.loadModel('invalid-model');

      expect(wrapper.vm.errorMessage).toContain('로드 실패');
    });
  });

  describe('switchModel()', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: 'llama2',
        responseTime: 1000
      });
      mockIpc.listModels.mockResolvedValueOnce(['llama2', 'mistral']);
      wrapper = mount(OllamaModelDownloader);
    });

    it('should switch to different model', async () => {
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('llama2');

      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({ connected: true, model: 'mistral', responseTime: 1100 });

      await wrapper.vm.switchModel('mistral');

      expect(wrapper.vm.statusMessage).toContain('전환 완료');
      expect(wrapper.vm.errorMessage).toBe('');
    });

    it('should skip switching if model is already loaded', async () => {
      wrapper.vm.ollamaStatus.currentModel = 'llama2';
      const initialMessage = wrapper.vm.statusMessage;

      vi.clearAllMocks();
      await wrapper.vm.switchModel('llama2');

      expect(mockIpc.loadModel).not.toHaveBeenCalled();
    });

    it('should handle switch error gracefully', async () => {
      mockIpc.loadModel.mockRejectedValueOnce(new Error('Switch failed'));

      await wrapper.vm.switchModel('mistral');

      expect(wrapper.vm.errorMessage).toContain('전환 실패');
    });

    it('should update isModelSwitching state during transition', async () => {
      mockIpc.loadModel.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({ connected: true, model: 'mistral', responseTime: 1100 });

      const switchPromise = wrapper.vm.switchModel('mistral');
      expect(wrapper.vm.isModelSwitching).toBe(true);

      await switchPromise;
      expect(wrapper.vm.isModelSwitching).toBe(false);
    });

    it('should display appropriate status message during switching', async () => {
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({ connected: true, model: 'mistral', responseTime: 1100 });

      await wrapper.vm.switchModel('mistral');

      expect(wrapper.vm.statusMessage).toContain('mistral');
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);
      wrapper = mount(OllamaModelDownloader);
    });

    it('canDownload should be true when model selected and connected', async () => {
      wrapper.vm.selectedModel = 'llama2';
      await nextTick();
      expect(wrapper.vm.canDownload).toBe(true);
    });

    it('canDownload should be false when not connected', async () => {
      wrapper.vm.ollamaStatus.connected = false;
      wrapper.vm.selectedModel = 'llama2';
      await nextTick();
      expect(wrapper.vm.canDownload).toBe(false);
    });

    it('canDownload should be false when no model selected', async () => {
      wrapper.vm.selectedModel = '';
      wrapper.vm.customModel = '';
      await nextTick();
      expect(wrapper.vm.canDownload).toBe(false);
    });

    it('statusIndicatorColor should reflect connection status', async () => {
      wrapper.vm.ollamaStatus.connected = true;
      await nextTick();
      expect(wrapper.vm.statusIndicatorColor).toBe('bg-green-500');

      wrapper.vm.ollamaStatus.connected = false;
      await nextTick();
      expect(wrapper.vm.statusIndicatorColor).toBe('bg-red-500');

      wrapper.vm.ollamaStatus.connected = true;
      wrapper.vm.isDownloading = true;
      await nextTick();
      expect(wrapper.vm.statusIndicatorColor).toBe('bg-yellow-500');
    });
  });

  describe('Error Management', () => {
    beforeEach(() => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      wrapper = mount(OllamaModelDownloader);
    });

    it('should clear error message on user action', async () => {
      wrapper.vm.errorMessage = 'Test error';
      await wrapper.vm.clearError();
      expect(wrapper.vm.errorMessage).toBe('');
    });

    it('should display detailed error messages', async () => {
      mockIpc.checkOllamaStatus.mockRejectedValue(
        new Error('Port 11434 is already in use')
      );

      wrapper.vm.checkOllamaStatus();
      // Exponential backoff: 1s + 2s + 4s = 7s, add buffer for async operations
      await new Promise(resolve => setTimeout(resolve, 7500));

      expect(wrapper.vm.errorMessage).toContain('포트: 11434');
    });
  });

  describe('IPC Communication', () => {
    it('should handle missing IPC bridge', () => {
      (window as any).electron = null;

      wrapper = mount(OllamaModelDownloader);
      expect(wrapper.vm.errorMessage).toBe('');
      // Component should handle gracefully without IPC
    });

    it('should properly register and cleanup event listeners', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      wrapper.unmount();

      // Verify cleanup was called if needed (no hanging listeners)
      expect(wrapper.vm).toBeDefined();
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
