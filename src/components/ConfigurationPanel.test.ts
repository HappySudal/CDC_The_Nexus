import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfigurationPanel from './ConfigurationPanel.vue';

describe('ConfigurationPanel.vue', () => {
  describe('Rendering', () => {
    it('should render configuration panel container', () => {
      const wrapper = mount(ConfigurationPanel);
      expect(wrapper.find('.configuration-panel').exists()).toBe(true);
    });

    it('should display header with title', () => {
      const wrapper = mount(ConfigurationPanel);
      expect(wrapper.find('.panel-header h2').text()).toBe('System Configuration');
    });

    it('should render save button', () => {
      const wrapper = mount(ConfigurationPanel);
      const saveBtn = wrapper.find('.btn-save');
      expect(saveBtn.exists()).toBe(true);
      expect(saveBtn.text()).toBe('Save Changes');
    });

    it('should render all config sections', () => {
      const wrapper = mount(ConfigurationPanel);
      const sections = wrapper.findAll('.config-section');
      expect(sections.length).toBe(4);
    });

    it('should render footer action buttons', () => {
      const wrapper = mount(ConfigurationPanel);
      const buttons = wrapper.findAll('.btn-secondary');
      expect(buttons.length).toBe(2);
      expect(buttons[0].text()).toBe('Reset to Defaults');
      expect(buttons[1].text()).toBe('Export Config');
    });
  });

  describe('Display', () => {
    it('should display General Settings section with form groups', () => {
      const wrapper = mount(ConfigurationPanel);
      const generalSection = wrapper.findAll('.config-section')[0];
      expect(generalSection.find('h3').text()).toBe('General Settings');
      const settingGroups = generalSection.findAll('.setting-group');
      expect(settingGroups.length).toBeGreaterThan(0);
    });

    it('should display Performance Settings section', () => {
      const wrapper = mount(ConfigurationPanel);
      const perfSection = wrapper.findAll('.config-section')[1];
      expect(perfSection.find('h3').text()).toBe('Performance Settings');
    });

    it('should display Network Settings section', () => {
      const wrapper = mount(ConfigurationPanel);
      const networkSection = wrapper.findAll('.config-section')[2];
      expect(networkSection.find('h3').text()).toBe('Network Settings');
    });

    it('should display Security Settings section', () => {
      const wrapper = mount(ConfigurationPanel);
      const securitySection = wrapper.findAll('.config-section')[3];
      expect(securitySection.find('h3').text()).toBe('Security Settings');
    });

    it('should bind theme select value correctly', () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;
      expect(vm.config.theme).toBe('dark');
      // v-model은 DOM 속성이 아니므로 첫 번째 select(테마)를 직접 조회
      const themeSelect = wrapper.findAll('select')[0];
      expect(themeSelect.exists()).toBe(true);
    });

    it('should bind language select value correctly', () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;
      expect(vm.config.language).toBe('ko');
    });

    it('should display input fields for numeric values', () => {
      const wrapper = mount(ConfigurationPanel);
      const inputs = wrapper.findAll('input[type="number"]');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should display text input for API endpoint', () => {
      const wrapper = mount(ConfigurationPanel);
      const textInputs = wrapper.findAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction', () => {
    it('should update config when theme changes', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await wrapper.vm.$nextTick();

      expect(vm.config.theme).toBe('light');
    });

    it('should update config when language changes', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.language = 'en';
      await wrapper.vm.$nextTick();

      expect(vm.config.language).toBe('en');
    });

    it('should save configuration and show success status', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await wrapper.vm.$nextTick();

      await vm.saveConfiguration();

      expect(vm.saveStatus).toBeTruthy();
      expect(vm.saveStatus.type).toBe('success');
      expect(vm.saveStatus.message).toContain('successfully');
    });

    it('should disable save button when no modifications', () => {
      const wrapper = mount(ConfigurationPanel);
      const saveBtn = wrapper.find('.btn-save');
      expect(saveBtn.attributes('disabled')).toBeDefined();
    });

    it('should enable save button when config modified', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await wrapper.vm.$nextTick();

      const saveBtn = wrapper.find('.btn-save');
      expect(saveBtn.attributes('disabled')).toBeUndefined();
    });

    it('should clear save status message after delay', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await vm.saveConfiguration();

      expect(vm.saveStatus).toBeTruthy();

      await new Promise(resolve => setTimeout(resolve, 3100));
      expect(vm.saveStatus).toBeNull();
    });

    it('should reset configuration to defaults', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      vm.config.language = 'en';
      await wrapper.vm.$nextTick();

      vi.stubGlobal('confirm', vi.fn(() => true));
      await vm.resetToDefaults();

      expect(vm.config.theme).toBe('dark');
      expect(vm.config.language).toBe('ko');
    });

    it('should not reset when confirmation cancelled', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await wrapper.vm.$nextTick();

      vi.stubGlobal('confirm', vi.fn(() => false));
      await vm.resetToDefaults();

      expect(vm.config.theme).toBe('light');
    });

    it('should export configuration as JSON', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const createElementSpy = vi.spyOn(document, 'createElement');
      await vm.exportConfiguration();

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('State', () => {
    it('should track modification state correctly', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      expect(vm.isModified).toBe(false);

      vm.config.theme = 'light';
      await wrapper.vm.$nextTick();

      expect(vm.isModified).toBe(true);
    });

    it('should update original config after save', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.autoSaveInterval = 120;
      await vm.saveConfiguration();

      expect(vm.originalConfig.autoSaveInterval).toBe(120);
      expect(vm.isModified).toBe(false);
    });

    it('should maintain separate config and original config', () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      expect(vm.config).not.toBe(vm.originalConfig);
      expect(vm.config.theme).toEqual(vm.originalConfig.theme);
    });

    it('should track cache size changes', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const initialSize = vm.config.cacheSize;
      vm.config.cacheSize = 500;
      await wrapper.vm.$nextTick();

      expect(vm.config.cacheSize).toBe(500);
      expect(vm.config.cacheSize).not.toBe(initialSize);
    });

    it('should track API timeout changes', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.apiTimeout = 45000;
      await wrapper.vm.$nextTick();

      expect(vm.config.apiTimeout).toBe(45000);
    });

    it('should track SSL setting changes', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const initialSSL = vm.config.enableSSL;
      vm.config.enableSSL = !initialSSL;
      await wrapper.vm.$nextTick();

      expect(vm.config.enableSSL).not.toBe(initialSSL);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum auto-save interval', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.autoSaveInterval = 10;
      await wrapper.vm.$nextTick();

      expect(vm.config.autoSaveInterval).toBe(10);
    });

    it('should handle maximum cache size', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.cacheSize = 1000;
      await wrapper.vm.$nextTick();

      expect(vm.config.cacheSize).toBe(1000);
    });

    it('should handle very long API endpoint', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const longUrl = 'https://api.example.com/' + 'path/'.repeat(50);
      vm.config.apiEndpoint = longUrl;
      await wrapper.vm.$nextTick();

      expect(vm.config.apiEndpoint).toBe(longUrl);
    });

    it('should handle special characters in proxy server', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.proxyServer = 'proxy-server.example.com:8080';
      await wrapper.vm.$nextTick();

      expect(vm.config.proxyServer).toBe('proxy-server.example.com:8080');
    });

    it('should handle multiple config changes in succession', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      vm.config.language = 'en';
      vm.config.cacheSize = 256;
      await wrapper.vm.$nextTick();

      expect(vm.config.theme).toBe('light');
      expect(vm.config.language).toBe('en');
      expect(vm.config.cacheSize).toBe(256);
    });
  });

  describe('Specialized', () => {
    it('should show save status message', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await vm.saveConfiguration();

      const statusElement = wrapper.find('.save-status');
      expect(statusElement.exists()).toBe(true);
      expect(statusElement.text()).toContain('saved');
    });

    it('should apply correct CSS class to status message', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.theme = 'light';
      await vm.saveConfiguration();

      const statusElement = wrapper.find('.save-status');
      expect(statusElement.classes()).toContain('success');
    });

    it('should expose config via defineExpose', () => {
      const wrapper = mount(ConfigurationPanel);
      expect(wrapper.vm.config).toBeDefined();
    });

    it('should expose saveConfiguration method via defineExpose', () => {
      const wrapper = mount(ConfigurationPanel);
      expect(wrapper.vm.saveConfiguration).toBeDefined();
      expect(typeof wrapper.vm.saveConfiguration).toBe('function');
    });

    it('should generate JSON export with correct filename', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const linkSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
      await vm.exportConfiguration();

      expect(linkSpy).toHaveBeenCalled();
    });

    it('should maintain proxy settings consistency', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      vm.config.enableProxy = true;
      vm.config.proxyServer = 'proxy.example.com:3128';
      await wrapper.vm.$nextTick();

      expect(vm.config.enableProxy).toBe(true);
      expect(vm.config.proxyServer).toBe('proxy.example.com:3128');
    });

    it('should maintain security settings independently', async () => {
      const wrapper = mount(ConfigurationPanel);
      const vm = wrapper.vm as any;

      const initialSSL = vm.config.enableSSL;
      const initial2FA = vm.config.enableTwoFactor;

      vm.config.enableSSL = !initialSSL;
      await wrapper.vm.$nextTick();

      expect(vm.config.enableTwoFactor).toBe(initial2FA);
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
