<template>
  <div class="configuration-panel">
    <div class="panel-header">
      <h2>System Configuration</h2>
      <button @click="saveConfiguration" class="btn-save" :disabled="!isModified">
        Save Changes
      </button>
    </div>

    <div class="panel-content">
      <div class="config-section">
        <h3>General Settings</h3>
        <div class="setting-group">
          <label>Application Theme</label>
          <select v-model="config.theme" @change="onConfigChanged">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Language</label>
          <select v-model="config.language" @change="onConfigChanged">
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Auto-save Interval (seconds)</label>
          <input
            v-model.number="config.autoSaveInterval"
            type="number"
            min="10"
            max="3600"
            @change="onConfigChanged"
          />
        </div>
      </div>

      <div class="config-section">
        <h3>Performance Settings</h3>
        <div class="setting-group">
          <label>Max Log Entries</label>
          <input
            v-model.number="config.maxLogEntries"
            type="number"
            min="100"
            max="10000"
            @change="onConfigChanged"
          />
        </div>

        <div class="setting-group">
          <label>Cache Size (MB)</label>
          <input
            v-model.number="config.cacheSize"
            type="number"
            min="10"
            max="1000"
            @change="onConfigChanged"
          />
        </div>

        <div class="setting-group">
          <label>API Timeout (milliseconds)</label>
          <input
            v-model.number="config.apiTimeout"
            type="number"
            min="1000"
            max="60000"
            @change="onConfigChanged"
          />
        </div>
      </div>

      <div class="config-section">
        <h3>Network Settings</h3>
        <div class="setting-group">
          <label>API Endpoint</label>
          <input
            v-model="config.apiEndpoint"
            type="text"
            placeholder="https://api.example.com"
            @change="onConfigChanged"
          />
        </div>

        <div class="setting-group">
          <label>Proxy Server</label>
          <input
            v-model="config.proxyServer"
            type="text"
            placeholder="proxy.example.com:8080"
            @change="onConfigChanged"
          />
        </div>

        <div class="setting-group checkbox">
          <input
            v-model="config.enableProxy"
            type="checkbox"
            @change="onConfigChanged"
          />
          <label>Enable Proxy</label>
        </div>
      </div>

      <div class="config-section">
        <h3>Security Settings</h3>
        <div class="setting-group checkbox">
          <input
            v-model="config.enableSSL"
            type="checkbox"
            @change="onConfigChanged"
          />
          <label>Enable SSL/TLS</label>
        </div>

        <div class="setting-group checkbox">
          <input
            v-model="config.enableTwoFactor"
            type="checkbox"
            @change="onConfigChanged"
          />
          <label>Enable 2FA</label>
        </div>

        <div class="setting-group">
          <label>Session Timeout (minutes)</label>
          <input
            v-model.number="config.sessionTimeout"
            type="number"
            min="5"
            max="480"
            @change="onConfigChanged"
          />
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button @click="resetToDefaults" class="btn-secondary">Reset to Defaults</button>
      <button @click="exportConfiguration" class="btn-secondary">Export Config</button>
      <span v-if="saveStatus" :class="['save-status', saveStatus.type]">
        {{ saveStatus.message }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

interface Config {
  theme: string;
  language: string;
  autoSaveInterval: number;
  maxLogEntries: number;
  cacheSize: number;
  apiTimeout: number;
  apiEndpoint: string;
  proxyServer: string;
  enableProxy: boolean;
  enableSSL: boolean;
  enableTwoFactor: boolean;
  sessionTimeout: number;
}

const defaultConfig: Config = {
  theme: 'dark',
  language: 'ko',
  autoSaveInterval: 60,
  maxLogEntries: 1000,
  cacheSize: 100,
  apiTimeout: 30000,
  apiEndpoint: 'https://api.example.com',
  proxyServer: '',
  enableProxy: false,
  enableSSL: true,
  enableTwoFactor: false,
  sessionTimeout: 30
};

const config = reactive<Config>({ ...defaultConfig });
const originalConfig = reactive<Config>({ ...defaultConfig });
const saveStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const isModified = computed(() => {
  return JSON.stringify(config) !== JSON.stringify(originalConfig);
});

const onConfigChanged = () => {
  saveStatus.value = null;
};

const saveConfiguration = async () => {
  try {
    // Simulate API call to save configuration
    await new Promise(resolve => setTimeout(resolve, 500));

    Object.assign(originalConfig, config);
    saveStatus.value = {
      type: 'success',
      message: 'Configuration saved successfully'
    };

    setTimeout(() => {
      saveStatus.value = null;
    }, 3000);
  } catch (err) {
    saveStatus.value = {
      type: 'error',
      message: `Failed to save configuration: ${err}`
    };
  }
};

const resetToDefaults = () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    Object.assign(config, defaultConfig);
    Object.assign(originalConfig, defaultConfig);
    saveStatus.value = {
      type: 'success',
      message: 'Settings reset to defaults'
    };

    setTimeout(() => {
      saveStatus.value = null;
    }, 2000);
  }
};

const exportConfiguration = () => {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `config_${Date.now()}.json`;
  a.click();
};

defineExpose({ config, saveConfiguration });
</script>

<style scoped>
.configuration-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-primary);
}

.btn-save {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #059669;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.config-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.config-section:last-of-type {
  border-bottom: none;
}

.config-section h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.setting-group label {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.setting-group input,
.setting-group select {
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: inherit;
  transition: border 0.2s;
}

.setting-group input:focus,
.setting-group select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.setting-group.checkbox {
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
}

.setting-group.checkbox input {
  width: auto;
  margin-right: 10px;
  cursor: pointer;
}

.setting-group.checkbox label {
  margin-bottom: 0;
  cursor: pointer;
}

.panel-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
}

.btn-secondary {
  padding: 8px 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--color-border);
}

.save-status {
  font-size: 13px;
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 4px;
  animation: slideIn 0.3s;
}

.save-status.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.save-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>

<!-- Exists in the Moment, Vanishes in Time. -->
