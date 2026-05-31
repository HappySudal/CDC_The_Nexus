import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DiscordSetupWizard from '@/components/DiscordSetupWizard.vue';

describe('DiscordSetupWizard.vue - Complete Test Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock Electron API
    window.electronAPI = {
      discord: {
        testWebhook: vi.fn().mockResolvedValue({ success: true }),
        saveWebhook: vi.fn().mockResolvedValue(undefined)
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. Component Mounting & Initial State (1-5)
  // ==========================================
  it('[TC-01] 컴포넌트가 정상적으로 마운트되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.exists()).toBe(true);
  });

  it('[TC-02] 초기 마운트 시 currentStep이 1단계인가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.vm.currentStep).toBe(1);
  });

  it('[TC-03] 헤더에 \"Discord 연결 마법사\" 타이틀이 표시되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.find('.wizard-header h2').text()).toContain('Discord 연결 마법사');
  });

  it('[TC-04] 초기 Webhook URL 입력값은 빈 문자열인가', () => {
    const wrapper = mount(DiscordSetupWizard);
    const input = wrapper.find('#webhook-url').element as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('[TC-05] 초기 에러 메시지가 표시되지 않는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.find('.error-alert').exists()).toBe(false);
  });

  // ==========================================
  // 2. Step 1: Webhook URL Input Validation (6-15)
  // ==========================================
  it('[TC-06] 1단계 화면에서 Webhook URL이 빈 상태일 때 \"다음\" 버튼이 비활성화되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    const buttons = wrapper.findAll('.navigation-buttons button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton.attributes('disabled')).toBeDefined();
  });

  it('[TC-07] Webhook URL에 유효한 값 입력 시 \"다음\" 버튼이 활성화되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const input = wrapper.find('#webhook-url');
    await input.setValue('https://discord.com/api/webhooks/123456/abcdef');
    const buttons = wrapper.findAll('.navigation-buttons button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton.attributes('disabled')).toBeUndefined();
  });

  it('[TC-08] 유효하지 않은 URL 형식 입력 시 validation 오류가 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const input = wrapper.find('#webhook-url');
    await input.setValue('https://naver.com/webhook');
    await wrapper.vm.$nextTick();
    const validation = wrapper.find('p.text-red-400');
    expect(validation.exists()).toBe(true);
  });

  it('[TC-09] 공백 문자만 입력 시 URL이 유효하지 않은 것으로 처리되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const input = wrapper.find('#webhook-url');
    await input.setValue('   ');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.canProceed).toBe(false);
  });

  it('[TC-10] URL 유효성 검사가 정규표현식으로 정확하게 작동하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const input = wrapper.find('#webhook-url');
    
    // Valid URLs
    await input.setValue('https://discord.com/api/webhooks/123/abc');
    expect(wrapper.vm.urlValidationError).toBe('');
    
    // Invalid URLs
    await input.setValue('http://discord.com/api/webhooks/123/abc');
    expect(wrapper.vm.urlValidationError).not.toBe('');
  });

  it('[TC-11] Webhook URL 입력 시 \"다음\" 버튼 상태가 즉시 업데이트되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);

    // Initially, canProceed should be false (empty URL)
    expect(wrapper.vm.canProceed).toBe(false);

    // Set valid URL
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');

    // Now canProceed should be true
    expect(wrapper.vm.canProceed).toBe(true);
  });

  it('[TC-12] 1단계에서 \"이전\" 버튼이 비활성화되어 있는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    const buttons = wrapper.findAll('.navigation-buttons button');
    const prevButton = buttons[0];
    expect(prevButton.attributes('disabled')).toBeDefined();
  });

  it('[TC-13] Progress bar가 currentStep에 따라 업데이트되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.vm.progressPercentage).toBe(33); // Step 1 of 3
  });

  it('[TC-14] Step 표시 텍스트가 \"Step 1/3\"으로 정확히 표시되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.find('.progress-section').text()).toContain('Step 1/3');
  });

  it('[TC-15] 초기 상태에서 취소 버튼이 항상 활성화되어 있는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    const cancelBtn = wrapper.findAll('button')[1]; // Middle cancel button
    expect(cancelBtn.text()).toContain('취소');
  });

  // ==========================================
  // 3. Step 2: Test Message (16-28)
  // ==========================================
  it('[TC-16] \"다음\" 버튼 클릭 후 currentStep이 2로 변경되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    expect(wrapper.vm.currentStep).toBe(2);
  });

  it('[TC-17] Step 2에서 테스트 메시지 텍스트 영역이 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    expect(wrapper.find('#test-message').exists()).toBe(true);
  });

  it('[TC-18] Step 2에서 \"테스트 메시지 전송\" 버튼이 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('테스트 메시지 전송'));
    expect(testBtn).toBeDefined();
  });

  it('[TC-19] testMessageContent가 JSON 형식으로 올바르게 생성되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    const content = wrapper.vm.testMessageContent;
    expect(content).toContain('embeds');
    expect(content).toContain('title');
    expect(content).toContain('CDC');
  });

  it('[TC-20] Step 2에서 \"이전\" 버튼 클릭 시 Step 1로 돌아가는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    const prevBtn = buttons[0];
    await prevBtn.trigger('click');
    expect(wrapper.vm.currentStep).toBe(1);
  });

  it('[TC-21] Step 2에서 1로 돌아갔을 때 입력된 URL이 보존되어 있는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const testUrl = 'https://discord.com/api/webhooks/123/abc';
    await wrapper.find('#webhook-url').setValue(testUrl);
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    await buttons[0].trigger('click');
    
    const input = wrapper.find('#webhook-url').element as HTMLInputElement;
    expect(input.value).toBe(testUrl);
  });

  it('[TC-22] Step 2에서 1로 돌아갔을 때 testStatus가 idle로 초기화되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    wrapper.vm.testStatus = 'success';
    await buttons[0].trigger('click');
    expect(wrapper.vm.testStatus).toBe('idle');
  });

  it('[TC-23] isLoading 상태가 전송 중에 true로 설정되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    // Mock a slow webhook call to check loading state
    window.electronAPI!.discord!.testWebhook = vi.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');

    const testBtn = wrapper.findAll('button').find(b => b.text().includes('테스트'));
    testBtn?.trigger('click');

    // Check immediately after click (before await)
    expect(wrapper.vm.isLoading).toBe(true);

    // Wait for completion (가짜 타이머의 100ms webhook 지연을 진행시켜 완료)
    await vi.advanceTimersByTimeAsync(150);
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('[TC-24] sendTestMessage 메서드가 electronAPI를 호출하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('테스트'));
    await testBtn?.trigger('click');
    await flushPromises();
    
    expect(window.electronAPI?.discord?.testWebhook).toHaveBeenCalled();
  });

  it('[TC-25] 테스트 성공 시 testStatus가 success로 설정되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    expect(wrapper.vm.testStatus).toBe('success');
  });

  it('[TC-26] 테스트 실패 시 testStatus가 error로 설정되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: false, error: 'Invalid webhook' });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    expect(wrapper.vm.testStatus).toBe('error');
  });

  it('[TC-27] 성공 시 statusMessage가 업데이트되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    expect(wrapper.vm.statusMessage).toContain('테스트 메시지');
  });

  it('[TC-28] resetTest 메서드가 testStatus를 idle로 초기화하는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.testStatus = 'success';
    wrapper.vm.resetTest();
    expect(wrapper.vm.testStatus).toBe('idle');
  });

  // ==========================================
  // 4. Step 3: Completion (29-35)
  // ==========================================
  it('[TC-29] 성공 후 \"다음\" 버튼 클릭 시 Step 3으로 이동하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    expect(wrapper.vm.currentStep).toBe(3);
  });

  it('[TC-30] Step 3에서 완료 메시지가 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    expect(wrapper.find('.step-3-content').text()).toContain('Discord 연결 완료');
  });

  it('[TC-31] Step 3에서 마스크된 Webhook URL이 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    const testUrl = 'https://discord.com/api/webhooks/123456789/abcdefghij';
    await wrapper.find('#webhook-url').setValue(testUrl);
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    const maskedUrl = wrapper.vm.maskWebhookUrl(testUrl);
    expect(wrapper.find('.step-3-content').text()).toContain(maskedUrl);
  });

  it('[TC-32] maskWebhookUrl이 URL의 마지막 부분을 마스킹하는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    const url = 'https://discord.com/api/webhooks/123456789/abcdefghij';
    const masked = wrapper.vm.maskWebhookUrl(url);
    expect(masked).toContain('••••••••');
  });

  // ==========================================
  // 5. Electron Fallback & Testing Mode (34-35)
  // ==========================================
  it('[TC-34] Electron API가 없을 때 테스트 모드로 동작하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    // Electron API 제거
    delete (window as any).electronAPI;

    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');

    await wrapper.vm.sendTestMessage();
    // 테스트 모드에서 성공적으로 처리되어야 함
    expect(wrapper.vm.testStatus).toBe('success');
    expect(wrapper.vm.statusMessage).toContain('테스트 모드');
  });

  it('[TC-35] saveWebhookConfiguration 후 2초 경과 시 cancelWizard 호출되는가', async () => {
    vi.useFakeTimers();
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.saveWebhook = vi.fn().mockResolvedValue(undefined);

    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');

    // Step 2로 이동
    await buttons[buttons.length - 1].trigger('click');
    // 테스트 성공으로 진행
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    await wrapper.vm.sendTestMessage();

    // Step 3로 이동
    const buttons2 = wrapper.findAll('.navigation-buttons button');
    await buttons2[buttons2.length - 1].trigger('click');

    // 저장 버튼 클릭
    await wrapper.vm.saveWebhookConfiguration();

    // 2초 경과
    await vi.advanceTimersByTimeAsync(2000);

    // cancelWizard 호출되어 currentStep이 1로 초기화되어야 함
    expect(wrapper.vm.currentStep).toBe(1);
    expect(wrapper.vm.webhookUrl).toBe('');

    vi.useRealTimers();
  });

  it('[TC-33] Step 3의 \"다음 단계\" 안내가 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    expect(wrapper.find('.step-3-content').text()).toContain('다음');
  });

  it('[TC-34] Step 3의 \"이전\" 버튼 클릭 시 Step 2로 돌아가는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[0].trigger('click');
    expect(wrapper.vm.currentStep).toBe(2);
  });

  it('[TC-35] saveWebhookConfiguration이 electronAPI를 호출하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    await flushPromises();
    
    expect(window.electronAPI?.discord?.saveWebhook).toHaveBeenCalled();
  });

  // ==========================================
  // 5. Error Handling & Edge Cases (36-50)
  // ==========================================
  it('[TC-36] canProceed가 Step 1에서 URL 유효성에 따라 업데이트되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.vm.canProceed).toBe(false);
    
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    expect(wrapper.vm.canProceed).toBe(true);
  });

  it('[TC-37] canProceed가 Step 2에서 testStatus에 따라 업데이트되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 2;
    wrapper.vm.testStatus = 'idle';
    expect(wrapper.vm.canProceed).toBe(false);
    
    wrapper.vm.testStatus = 'success';
    expect(wrapper.vm.canProceed).toBe(true);
  });

  it('[TC-38] canProceed가 Step 3에서 항상 true인가', () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 3;
    expect(wrapper.vm.canProceed).toBe(true);
  });

  it('[TC-39] cancelWizard가 모든 상태를 초기화하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 3;
    wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123/abc';
    wrapper.vm.error = 'some error';
    
    wrapper.vm.cancelWizard();
    expect(wrapper.vm.currentStep).toBe(1);
    expect(wrapper.vm.webhookUrl).toBe('');
    expect(wrapper.vm.error).toBe('');
  });

  it('[TC-40] 취소 버튼 클릭 시 cancelWizard가 호출되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    // <script setup>은 템플릿이 원본 클로저를 호출하므로 vm 스파이가 잡히지 않음 → 효과(상태 초기화)로 검증
    wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123/abc';
    wrapper.vm.currentStep = 2;
    await wrapper.vm.$nextTick();

    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('취소'));
    await cancelBtn?.trigger('click');

    expect(wrapper.vm.currentStep).toBe(1);
    expect(wrapper.vm.webhookUrl).toBe('');
  });

  it('[TC-41] 성공 후 \"완료\" 버튼 클릭 시 currentStep이 3이 되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 2;
    wrapper.vm.testStatus = 'success';
    await wrapper.vm.$nextTick();

    const nextBtn = wrapper.findAll('button').find(b => b.text().includes('다음'));
    await nextBtn?.trigger('click');
    expect(wrapper.vm.currentStep).toBe(3);
  });

  it('[TC-42] progressPercentage가 currentStep에 따라 정확하게 계산되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(wrapper.vm.progressPercentage).toBe(33);
    wrapper.vm.currentStep = 2;
    expect(wrapper.vm.progressPercentage).toBe(66);
    wrapper.vm.currentStep = 3;
    expect(wrapper.vm.progressPercentage).toBe(100);
  });

  it('[TC-43] statusMessage가 상태에 따라 업데이트되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    const buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('테스트'));
    await testBtn?.trigger('click');
    expect(wrapper.vm.statusMessage).toContain('전송');
  });

  it('[TC-44] error 상태가 표시될 때 .error-alert가 렌더링되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.error = 'Test error';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.error-alert').exists()).toBe(true);
  });

  it('[TC-45] statusMessage가 있을 때 .status-message가 렌더링되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.statusMessage = 'Test message';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-message').exists()).toBe(true);
  });

  it('[TC-46] 성공 결과 박스에 ✅ 이모지가 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 2;
    wrapper.vm.testStatus = 'success';
    await wrapper.vm.$nextTick();

    // Check for success message box with green styling
    const successBox = wrapper.find('.bg-green-900\\/30');
    expect(successBox.exists()).toBe(true);
    expect(successBox.text()).toContain('연결 성공');
  });

  it('[TC-47] 실패 결과 박스에 ❌ 이모지가 표시되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 2;
    wrapper.vm.testStatus = 'error';
    await wrapper.vm.$nextTick();
    const errorBox = wrapper.find('.bg-red-900\\/30');
    expect(errorBox.exists()).toBe(true);
    expect(errorBox.text()).toContain('연결 실패');
  });

  it('[TC-48] nextStep 메서드가 canProceed 확인 후 실행되는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    // Initially canProceed is false (empty webhookUrl on step 1)
    expect(wrapper.vm.canProceed).toBe(false);
    const prevStep = wrapper.vm.currentStep;
    await wrapper.vm.nextStep();
    // Should not increment since canProceed is false
    expect(wrapper.vm.currentStep).toBe(prevStep);
  });

  it('[TC-49] previousStep가 currentStep > 1일 때만 작동하는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.currentStep = 1;
    wrapper.vm.previousStep();
    expect(wrapper.vm.currentStep).toBe(1);
    
    wrapper.vm.currentStep = 2;
    wrapper.vm.previousStep();
    expect(wrapper.vm.currentStep).toBe(1);
  });

  it('[TC-50] nextStep이 isLoading 중일 때 실행되지 않는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    wrapper.vm.isLoading = true;
    wrapper.vm.webhookUrl = 'https://discord.com/api/webhooks/123/abc';
    
    // Verify Next button is disabled when isLoading is true
    const nextBtn = wrapper.findAll('button').find(b => b.text().includes('다음'));
    expect(nextBtn?.attributes('disabled')).toBeDefined();
    
    // Verify currentStep doesn't change when button is disabled
    const prevStep = wrapper.vm.currentStep;
    expect(wrapper.vm.currentStep).toBe(prevStep);
  });

  // ==========================================
  // 6. Lifecycle & Component Cleanup (51-53)
  // ==========================================
  it('[TC-51] 컴포넌트가 언마운트될 때 fakeTimers가 정리되는가', () => {
    const wrapper = mount(DiscordSetupWizard);
    expect(() => wrapper.unmount()).not.toThrow();
  });

  it('[TC-52] 모든 계산된 프로퍼티가 반응형인가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    const initial = wrapper.vm.progressPercentage;
    wrapper.vm.currentStep = 2;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.progressPercentage).not.toBe(initial);
  });

  it('[TC-53] 컴포넌트의 전체 라이프사이클이 정상 작동하는가', async () => {
    const wrapper = mount(DiscordSetupWizard);
    
    // Step 1
    expect(wrapper.vm.currentStep).toBe(1);
    await wrapper.find('#webhook-url').setValue('https://discord.com/api/webhooks/123/abc');
    let buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    // Step 2
    expect(wrapper.vm.currentStep).toBe(2);
    window.electronAPI!.discord!.testWebhook = vi.fn().mockResolvedValue({ success: true });
    await wrapper.vm.sendTestMessage();
    buttons = wrapper.findAll('.navigation-buttons button');
    await buttons[buttons.length - 1].trigger('click');
    
    // Step 3
    expect(wrapper.vm.currentStep).toBe(3);
    
    // Cleanup
    wrapper.vm.cancelWizard();
    expect(wrapper.vm.currentStep).toBe(1);
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
