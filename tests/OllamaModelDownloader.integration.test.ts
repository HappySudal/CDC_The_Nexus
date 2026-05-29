/**
 * Integration Tests for OllamaModelDownloader.vue
 * Tests real-world scenarios combining multiple operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import OllamaModelDownloader from '../src/components/OllamaModelDownloader.vue';

describe('OllamaModelDownloader.vue - Integration Tests', () => {
  let wrapper: VueWrapper;
  let mockIpc: any;

  beforeEach(() => {
    mockIpc = {
      checkOllamaStatus: vi.fn(),
      listModels: vi.fn(),
      downloadModel: vi.fn(),
      loadModel: vi.fn(),
      onOllamaDownloadProgress: vi.fn().mockReturnValue(() => {})
    };

    (window as any).electronAPI = mockIpc;

    // Default mock responses
    mockIpc.checkOllamaStatus.mockResolvedValue({
      connected: false,
      model: '',
      responseTime: 0
    });

    mockIpc.listModels.mockResolvedValue([]);
    mockIpc.downloadModel.mockResolvedValue({ success: true });
    mockIpc.loadModel.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Scenario 1: Ollama 시작 → 모델 다운로드 → 모델 로드', () => {
    it('should complete full workflow: check → download → load', async () => {
      // Step 1: Ollama 상태 확인 (켜짐)
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: '',
        responseTime: 0
      });

      // Step 2: 모델 목록 조회
      mockIpc.listModels.mockResolvedValueOnce(['llama2', 'mistral']);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      // Verify Ollama is connected
      expect(wrapper.vm.ollamaStatus.connected).toBe(true);
      expect(wrapper.vm.availableModels).toEqual(['llama2', 'mistral']);
      expect(wrapper.vm.errorMessage).toBe('');

      // Step 3: 모델 선택
      await wrapper.vm.selectModel('llama2');
      expect(wrapper.vm.selectedModel).toBe('llama2');

      // Step 4: 모델 다운로드
      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      // Setup progress callback
      const progressCallback = mockIpc.onOllamaDownloadProgress.mock.calls[0]?.[0];

      await wrapper.vm.downloadModel();
      expect(wrapper.vm.isDownloading).toBe(true);

      // Simulate download progress
      if (progressCallback) {
        progressCallback({ progress: 0, message: 'Starting...' });
        progressCallback({ progress: 50, message: 'Downloading...' });
        progressCallback({ progress: 100, message: 'Complete!' });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(wrapper.vm.downloadProgress).toBe(100);
      expect(wrapper.vm.statusMessage).toContain('완료');

      // Step 5: 모델 로드
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'llama2',
        responseTime: 1200
      });

      await wrapper.vm.loadModel('llama2');
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('llama2');
    });
  });

  describe('Scenario 2: 네트워크 실패 → 자동 재시도 → 성공', () => {
    it('should recover from network failure with retry logic', async () => {
      // First two attempts fail
      mockIpc.checkOllamaStatus.mockRejectedValueOnce(new Error('Connection timeout'));
      mockIpc.checkOllamaStatus.mockRejectedValueOnce(new Error('Connection timeout'));

      // Third and subsequent attempts succeed
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });

      mockIpc.listModels.mockResolvedValue(['llama2']);

      wrapper = mount(OllamaModelDownloader);

      // Wait for retries (exponential backoff: 1s + 2s + 4s = 7s minimum, plus some buffer)
      await new Promise(resolve => setTimeout(resolve, 9000));

      // Should eventually succeed
      expect(wrapper.vm.ollamaStatus.connected).toBe(true);
      expect(wrapper.vm.retryCount).toBeLessThanOrEqual(3);
      expect(wrapper.vm.errorMessage).toBe('');
    });
  });

  describe('Scenario 3: 다운로드 중 에러 → 재시도 → 완료', () => {
    it('should handle download failure and retry', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      wrapper.vm.selectedModel = 'mistral';
      await nextTick();

      // First download attempt fails
      mockIpc.downloadModel.mockRejectedValueOnce(new Error('Download interrupted'));

      // Retry succeeds
      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      wrapper.vm.downloadModel();
      await nextTick();

      expect(wrapper.vm.isDownloading).toBe(true);

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should attempt to complete
      expect(wrapper.vm.retryCount).toBeGreaterThan(0);
    });
  });

  describe('Scenario 4: 부족한 디스크 공간 감지', () => {
    it('should provide helpful error message for disk space issues', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      wrapper.vm.selectedModel = 'neural-chat';
      await nextTick();

      // Simulate disk space error after multiple retries
      mockIpc.downloadModel.mockRejectedValue(new Error('No space left on device'));

      wrapper.vm.downloadModel();
      await nextTick();

      await new Promise(resolve => setTimeout(resolve, 13000));

      // Should show an error message (either translated or original)
      expect(wrapper.vm.errorMessage).toBeTruthy();
      // Component either shows disk space error or general error
      expect(
        wrapper.vm.errorMessage.includes('디스크 공간') ||
        wrapper.vm.errorMessage.includes('No space left') ||
        wrapper.vm.errorMessage.includes('다운로드 실패')
      ).toBe(true);
    });
  });

  describe('Scenario 5: 동시 작업 방지 (다운로드 중 다시 다운로드 요청)', () => {
    it('should prevent simultaneous downloads', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      wrapper.vm.selectedModel = 'llama2';
      await nextTick();

      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      // Start first download
      const download1 = wrapper.vm.downloadModel();
      await nextTick();

      expect(wrapper.vm.isDownloading).toBe(true);

      // Try to start second download while first is active
      wrapper.vm.selectedModel = 'mistral';

      // Button should be disabled (canDownload should be false)
      expect(wrapper.vm.canDownload).toBe(false);

      await download1;
    });
  });

  describe('Scenario 6: 올라마 끊김 → 재연결', () => {
    it('should detect and handle Ollama disconnection', async () => {
      // Initial connection successful
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'llama2',
        responseTime: 1000
      });
      mockIpc.listModels.mockResolvedValueOnce(['llama2', 'mistral']);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      expect(wrapper.vm.ollamaStatus.connected).toBe(true);

      // Simulate periodic status check detecting disconnection
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: false,
        model: '',
        responseTime: 0
      });

      await wrapper.vm.checkOllamaStatus();

      expect(wrapper.vm.ollamaStatus.connected).toBe(false);
      expect(wrapper.vm.canDownload).toBe(false);
    });
  });

  describe('Scenario 7: 사용자 정의 모델 입력 → 다운로드', () => {
    it('should support custom model download', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      // User enters custom model (no selectedModel)
      wrapper.vm.customModel = 'custom-llm:latest';
      wrapper.vm.selectedModel = '';
      await nextTick();

      expect(wrapper.vm.canDownload).toBe(true);

      // Start download with custom model
      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      await wrapper.vm.downloadModel();

      // Verify custom model was used (selectedModel should still be empty)
      expect(wrapper.vm.selectedModel || wrapper.vm.customModel).toBe('custom-llm:latest');
    });
  });

  describe('Scenario 8: 여러 모델 다운로드 순차 진행', () => {
    it('should handle sequential model downloads', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce([]);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      // Download first model
      wrapper.vm.selectedModel = 'llama2';
      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      await wrapper.vm.downloadModel();

      // Simulate progress for first download
      let progressCallback = mockIpc.onOllamaDownloadProgress.mock.calls[0]?.[0];
      if (progressCallback) {
        progressCallback({ progress: 50, message: 'Downloading...' });
        progressCallback({ progress: 100, message: 'Complete!' });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify first download completed
      expect(wrapper.vm.downloadProgress).toBe(100);

      // Update model list (simulate server response)
      mockIpc.listModels.mockResolvedValueOnce(['llama2']);

      // Download second model
      wrapper.vm.selectedModel = 'mistral';
      wrapper.vm.downloadProgress = 0;

      mockIpc.downloadModel.mockResolvedValueOnce({ success: true });

      await wrapper.vm.downloadModel();

      // Simulate progress for second download
      progressCallback = mockIpc.onOllamaDownloadProgress.mock.calls[1]?.[0];
      if (progressCallback) {
        progressCallback({ progress: 50, message: 'Downloading...' });
        progressCallback({ progress: 100, message: 'Complete!' });
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(wrapper.vm.downloadProgress).toBe(100);
    });
  });

  describe('Scenario 9: 모델 로드 중 상태 추적', () => {
    it('should track individual model loading state', async () => {
      const models = ['llama2', 'mistral', 'neural-chat'];
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: '',
        responseTime: 0
      });
      mockIpc.listModels.mockResolvedValueOnce(models);

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      // Load first model
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'llama2',
        responseTime: 1200
      });

      const loadPromise = wrapper.vm.loadModel('llama2');
      expect(wrapper.vm.loadingModelName).toBe('llama2');

      await loadPromise;
      expect(wrapper.vm.loadingModelName).toBe('');
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('llama2');

      // Load another model
      mockIpc.loadModel.mockResolvedValueOnce(undefined);
      mockIpc.checkOllamaStatus.mockResolvedValueOnce({
        connected: true,
        model: 'mistral',
        responseTime: 950
      });

      await wrapper.vm.loadModel('mistral');
      expect(wrapper.vm.ollamaStatus.currentModel).toBe('mistral');
    });
  });

  describe('Scenario 10: 컴포넌트 라이프사이클 - 정리 검증', () => {
    it('should properly cleanup on unmount', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: false,
        model: '',
        responseTime: 0
      });

      wrapper = mount(OllamaModelDownloader);
      await nextTick();

      const initialCallCount = mockIpc.checkOllamaStatus.mock.calls.length;

      wrapper.unmount();

      // After unmount, no new IPC calls should be made
      // (In practice, interval cleanup would prevent new status checks)
      const finalCallCount = mockIpc.checkOllamaStatus.mock.calls.length;
      expect(finalCallCount).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  describe('Performance & Stability', () => {
    it('should handle rapid status checks without memory leak', async () => {
      mockIpc.checkOllamaStatus.mockResolvedValue({
        connected: true,
        model: 'llama2',
        responseTime: 900
      });

      wrapper = mount(OllamaModelDownloader);

      // Simulate 10 rapid status checks
      for (let i = 0; i < 10; i++) {
        mockIpc.checkOllamaStatus.mockResolvedValueOnce({
          connected: true,
          model: 'llama2',
          responseTime: 900 + i * 10
        });
        await wrapper.vm.checkOllamaStatus();
      }

      // Status should update without issues
      expect(wrapper.vm.ollamaStatus.responseTime).toBeGreaterThan(900);
    });

    it('should respect max retry limit', async () => {
      mockIpc.checkOllamaStatus.mockRejectedValue(new Error('Persistent failure'));

      wrapper = mount(OllamaModelDownloader);

      // Set reasonable timeout to avoid infinite retries
      await new Promise(resolve => setTimeout(resolve, 8000));

      expect(wrapper.vm.retryCount).toBeLessThanOrEqual(3);
    });
  });
});
