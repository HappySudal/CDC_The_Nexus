import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DiscordSetupWizard from './DiscordSetupWizard.vue';

describe('DiscordSetupWizard.vue', () => {
  let wrapper: any;
  let mockElectronAPI: any;

  beforeEach(async () => {
    // Mock Electron IPC
    mockElectronAPI = {
      discord: {
        testWebhook: vi.fn(),
        saveWebhook: vi.fn(),
      },
    };
    window.electronAPI = mockElectronAPI;

    wrapper = mount(DiscordSetupWizard);
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(() => {
    wrapper.unmount();
    vi.clearAllMocks();
    delete (window as any).electronAPI;
  });

  // ===== Step Navigation Tests =====
  describe('Step Navigation', () => {
    it('should start at step 1', async () => {
      expect(wrapper.vm.currentStep).toBe(1);
    });

    it('should not go to next step if URL is empty', async () => {
      wrapper.vm.webhookUrl = '';
      await wrapper.vm.$nextTick();

      const canProceed = wrapper.vm.canProceed;
      expect(canProceed).toBe(false);
    });

    it('should enable next button with valid URL', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      const canProceed = wrapper.vm.canProceed;
      expect(canProceed).toBe(true);
    });

    it('should move to step 2 when next is clicked with valid URL', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      await wrapper.vm.nextStep();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentStep).toBe(2);
    });

    it('should move back to step 1 when previous is clicked', async () => {
      wrapper.vm.currentStep = 2;
      await wrapper.vm.$nextTick();
      
      await wrapper.vm.previousStep();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentStep).toBe(1);
    });

    it('should not go below step 1', async () => {
      wrapper.vm.currentStep = 1;
      await wrapper.vm.previousStep();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentStep).toBe(1);
    });

    it('should progress through all 3 steps', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.nextStep(); // Step 1 → 2
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentStep).toBe(2);

      wrapper.vm.testStatus = 'success';
      await wrapper.vm.$nextTick();
      await wrapper.vm.nextStep(); // Step 2 → 3
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentStep).toBe(3);
    });
  });

  // ===== URL Validation Tests =====
  describe('URL Validation', () => {
    it('should reject non-Discord URLs', async () => {
      wrapper.vm.webhookUrl = 'https://example.com/webhook';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.urlValidationError).toBeTruthy();
    });

    it('should accept valid Discord webhook URLs', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.urlValidationError).toBe('');
    });

    it('should accept discordapp.com URLs', async () => {
      wrapper.vm.webhookUrl = 'https://discordapp.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.urlValidationError).toBe('');
    });

    it('should reject URLs without numeric ID', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/abc/def';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.urlValidationError).toBeTruthy();
    });

    it('should reject incomplete URLs', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.urlValidationError).toBeTruthy();
    });

    it('should show validation error message in template', async () => {
      wrapper.vm.webhookUrl = 'invalid-url';
      await wrapper.vm.$nextTick();
      
      const errorMsg = wrapper.find('p.text-red-400');
      expect(errorMsg.exists()).toBe(true);
      expect(errorMsg.text()).toContain('올바르지 않습니다');
    });

    it('should show success message for valid URL', async () => {
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      const successMsg = wrapper.find('p.text-green-400');
      expect(successMsg.exists()).toBe(true);
      expect(successMsg.text()).toContain('올바릅니다');
    });
  });

  // ===== Test Message Sending =====
  describe('Test Message Sending', () => {
    beforeEach(async () => {
      wrapper.vm.currentStep = 2;
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should send test message when button clicked', async () => {
      mockElectronAPI.discord.testWebhook.mockResolvedValue({ success: true });
      
      await wrapper.vm.sendTestMessage();
      await wrapper.vm.$nextTick();
      
      expect(mockElectronAPI.discord.testWebhook).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/123456789/abc-def-ghi'
      );
    });

    it('should set testStatus to success on successful message send', async () => {
      mockElectronAPI.discord.testWebhook.mockResolvedValue({ success: true });
      
      await wrapper.vm.sendTestMessage();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.testStatus).toBe('success');
    });

    it('should set testStatus to error on failed message send', async () => {
      mockElectronAPI.discord.testWebhook.mockResolvedValue({
        success: false,
        error: 'Invalid webhook URL',
      });
      
      await wrapper.vm.sendTestMessage();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.testStatus).toBe('error');
      expect(wrapper.vm.testErrorMessage).toBe('Invalid webhook URL');
    });

    it('should set loading state while sending message', async () => {
      mockElectronAPI.discord.testWebhook.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      const promise = wrapper.vm.sendTestMessage();
      expect(wrapper.vm.isLoading).toBe(true);
      
      await promise;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockElectronAPI.discord.testWebhook.mockRejectedValue(
        new Error('Network timeout')
      );
      
      await wrapper.vm.sendTestMessage();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.testStatus).toBe('error');
      expect(wrapper.vm.testErrorMessage).toContain('Network');
    });

    it('should display test message content', async () => {
      const content = wrapper.vm.testMessageContent;
      expect(content).toContain('CDC');
      expect(content).toContain('embeds');
    });
  });

  // ===== Configuration Saving =====
  describe('Configuration Saving', () => {
    beforeEach(async () => {
      wrapper.vm.currentStep = 3;
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should save webhook configuration', async () => {
      mockElectronAPI.discord.saveWebhook.mockResolvedValue(undefined);
      
      await wrapper.vm.saveWebhookConfiguration();
      await wrapper.vm.$nextTick();
      
      expect(mockElectronAPI.discord.saveWebhook).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/123456789/abc-def-ghi'
      );
    });

    it('should handle save errors', async () => {
      mockElectronAPI.discord.saveWebhook.mockRejectedValue(
        new Error('Storage error')
      );
      
      await wrapper.vm.saveWebhookConfiguration();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.error).toContain('Storage');
    });

    it('should show status message while saving', async () => {
      mockElectronAPI.discord.saveWebhook.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 50))
      );
      
      const promise = wrapper.vm.saveWebhookConfiguration();
      expect(wrapper.vm.statusMessage).toBe('설정을 저장 중...');
      
      await promise;
      await wrapper.vm.$nextTick();
    });
  });

  // ===== Progress Bar =====
  describe('Progress Bar', () => {
    it('should show 33% progress on step 1', async () => {
      wrapper.vm.currentStep = 1;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.progressPercentage).toBe(33);
    });

    it('should show 66% progress on step 2', async () => {
      wrapper.vm.currentStep = 2;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.progressPercentage).toBe(66);
    });

    it('should show 100% progress on step 3', async () => {
      wrapper.vm.currentStep = 3;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.progressPercentage).toBe(100);
    });

    it('should display progress bar in template', async () => {
      const progressBar = wrapper.find('div.bg-gradient-to-r');
      expect(progressBar.exists()).toBe(true);
    });
  });

  // ===== Wizard Cancel =====
  describe('Wizard Cancel', () => {
    it('should reset all state on cancel', async () => {
      wrapper.vm.currentStep = 2;
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      wrapper.vm.error = 'Some error';
      
      await wrapper.vm.cancelWizard();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.currentStep).toBe(1);
      expect(wrapper.vm.webhookUrl).toBe('');
      expect(wrapper.vm.error).toBe('');
    });

    it('should reset test status on cancel', async () => {
      wrapper.vm.testStatus = 'success';
      
      await wrapper.vm.cancelWizard();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.testStatus).toBe('idle');
    });

    it('should reset test error message on cancel', async () => {
      wrapper.vm.testErrorMessage = 'Some error';
      
      await wrapper.vm.cancelWizard();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.testErrorMessage).toBe('');
    });
  });

  // ===== URL Masking =====
  describe('URL Masking', () => {
    it('should mask webhook URL for display', async () => {
      const url = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      const masked = wrapper.vm.maskWebhookUrl(url);
      
      expect(masked).toContain('••••••••');
      expect(masked).not.toContain('abc-def-ghi');
    });

    it('should handle empty URL', async () => {
      const masked = wrapper.vm.maskWebhookUrl('');
      expect(masked).toBe('');
    });

    it('should handle invalid URL format', async () => {
      const url = 'invalid';
      const masked = wrapper.vm.maskWebhookUrl(url);
      expect(masked).toBe(url);
    });
  });

  // ===== UI Rendering =====
  describe('UI Rendering', () => {
    it('should render step 1 content', async () => {
      wrapper.vm.currentStep = 1;
      await wrapper.vm.$nextTick();
      
      const content = wrapper.find('.step-1-content');
      expect(content.exists()).toBe(true);
    });

    it('should render step 2 content', async () => {
      wrapper.vm.currentStep = 2;
      await wrapper.vm.$nextTick();
      
      const content = wrapper.find('.step-2-content');
      expect(content.exists()).toBe(true);
    });

    it('should render step 3 content', async () => {
      wrapper.vm.currentStep = 3;
      await wrapper.vm.$nextTick();
      
      const content = wrapper.find('.step-3-content');
      expect(content.exists()).toBe(true);
    });

    it('should render navigation buttons', async () => {
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render progress indicators', async () => {
      const indicators = wrapper.findAll('.step-indicators > div > div');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should display correct step count in header', async () => {
      wrapper.vm.currentStep = 2;
      await wrapper.vm.$nextTick();
      
      const header = wrapper.text();
      expect(header).toContain('Step 2/3');
    });
  });

  // ===== Error Handling =====
  describe('Error Handling', () => {
    it('should display error message when set', async () => {
      wrapper.vm.error = 'Test error message';
      await wrapper.vm.$nextTick();
      
      const errorAlert = wrapper.find('.error-alert');
      expect(errorAlert.exists()).toBe(true);
      expect(errorAlert.text()).toContain('Test error');
    });

    it('should display status message when set', async () => {
      wrapper.vm.statusMessage = 'Test status';
      await wrapper.vm.$nextTick();
      
      const statusMsg = wrapper.find('.status-message');
      expect(statusMsg.exists()).toBe(true);
      expect(statusMsg.text()).toContain('Test status');
    });

    it('should clear error on new action', async () => {
      wrapper.vm.error = 'Previous error';
      await wrapper.vm.$nextTick();
      
      mockElectronAPI.discord.testWebhook.mockResolvedValue({ success: true });
      await wrapper.vm.sendTestMessage();
      await wrapper.vm.$nextTick();
      
      // Error should be cleared at start of sendTestMessage
      expect(wrapper.vm.error).toBe('');
    });
  });

  // ===== Step 2 Reset =====
  describe('Test Reset on Previous', () => {
    it('should reset test status when going back from step 2', async () => {
      wrapper.vm.currentStep = 2;
      wrapper.vm.testStatus = 'success';
      await wrapper.vm.$nextTick();
      
      await wrapper.vm.previousStep();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.testStatus).toBe('idle');
    });

    it('should reset test error message when going back', async () => {
      wrapper.vm.currentStep = 2;
      wrapper.vm.testErrorMessage = 'Error message';
      await wrapper.vm.$nextTick();
      
      await wrapper.vm.previousStep();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.testErrorMessage).toBe('');
    });
  });

  // ===== Completion Flow =====
  describe('Completion Flow', () => {
    it('should complete wizard on last step confirmation', async () => {
      wrapper.vm.currentStep = 3;
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      mockElectronAPI.discord.saveWebhook.mockResolvedValue(undefined);
      
      await wrapper.vm.nextStep();
      await wrapper.vm.$nextTick();
      
      expect(mockElectronAPI.discord.saveWebhook).toHaveBeenCalled();
    });

    it('should show completion message in step 3', async () => {
      wrapper.vm.currentStep = 3;
      await wrapper.vm.$nextTick();
      
      const completionText = wrapper.text();
      expect(completionText).toContain('완료');
    });

    it('should display masked URL on completion', async () => {
      wrapper.vm.currentStep = 3;
      wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123456789/abc-def-ghi';
      await wrapper.vm.$nextTick();
      
      const content = wrapper.text();
      expect(content).toContain('••••••••');
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
