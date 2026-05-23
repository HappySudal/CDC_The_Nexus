/**
 * Electron Preload Script — Context Bridge
 * Bridges renderer process with secure IPC API (context isolation enabled)
 *
 * Security Model:
 * - Node Integration: DISABLED
 * - Context Isolation: ENABLED (maximal security)
 * - Sandbox: ENABLED
 * - IPC: Event-based, no direct function calls
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // =====================================================
  // 1. CONSTITUTION MANAGEMENT
  // =====================================================
  getConstitution: () => ipcRenderer.invoke('constitution:get'),
  onConstitutionUpdate: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('constitution:changed', listener);
    return () => ipcRenderer.off('constitution:changed', listener);
  },

  // =====================================================
  // 2. SEARCH & FILTERING
  // =====================================================
  searchDocuments: (query, filters) =>
    ipcRenderer.invoke('search:documents', { query, filters }),
  onSearchResults: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('search:results', listener);
    return () => ipcRenderer.off('search:results', listener);
  },

  // =====================================================
  // 3. AGENT MONITORING & MANAGEMENT
  // =====================================================
  getAgents: () => ipcRenderer.invoke('agent:get-list'),
  executeCommand: (agentId, command) =>
    ipcRenderer.invoke('agent:execute-command', { agentId, command }),
  onAgentStatus: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('agent:status-updated', listener);
    return () => ipcRenderer.off('agent:status-updated', listener);
  },

  // =====================================================
  // 4. TASK MANAGEMENT & CONTROL
  // =====================================================
  createTask: (taskData) => ipcRenderer.invoke('task:create', taskData),
  getTasks: (filter) => ipcRenderer.invoke('task:get-list', { filter }),
  updateTaskStatus: (taskId, status, progress) =>
    ipcRenderer.invoke('task:update-status', { taskId, status, progress }),
  onTaskStatusChange: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('task:status-changed', listener);
    return () => ipcRenderer.off('task:status-changed', listener);
  },

  // =====================================================
  // 5. SYSTEM MONITORING
  // =====================================================
  getSystemMetrics: () => ipcRenderer.invoke('system:get-all-metrics'),
  onSystemMetrics: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:metrics', listener);
    return () => ipcRenderer.off('realtime:metrics', listener);
  },

  // =====================================================
  // 6. FILE OPERATIONS
  // =====================================================
  readFile: (filePath) => ipcRenderer.invoke('file:read', { filePath }),
  readDirectory: (dirPath) => ipcRenderer.invoke('file:read-directory', { dirPath }),

  // =====================================================
  // 7. SETTINGS & CONFIGURATION
  // =====================================================
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', { settings }),
  onSettingsChange: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.off('settings:changed', listener);
  },

  // =====================================================
  // 8. REPORTING & EXPORT
  // =====================================================
  generateReport: (reportType) =>
    ipcRenderer.invoke('report:generate', { reportType }),
  onReportReady: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('report:ready', listener);
    return () => ipcRenderer.off('report:ready', listener);
  },

  // =====================================================
  // 9. ADMIN FUNCTIONS
  // =====================================================
  startMonitoring: () => ipcRenderer.invoke('admin:start-monitoring'),
  triggerBackup: () => ipcRenderer.invoke('admin:trigger-backup'),
  triggerSync: () => ipcRenderer.invoke('admin:trigger-sync'),

  // =====================================================
  // 10. OLLAMA MODEL MANAGER
  // =====================================================
  checkOllamaStatus: () => ipcRenderer.invoke('ollama:check-status'),
  listModels: () => ipcRenderer.invoke('ollama:list-models'),
  downloadModel: (model) => ipcRenderer.invoke('ollama:download-model', { model }),
  loadModel: (model) => ipcRenderer.invoke('ollama:load-model', { model }),
  onOllamaDownloadProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('ollama:download-progress', listener);
    return () => ipcRenderer.off('ollama:download-progress', listener);
  },

  // =====================================================
  // 11. REAL-TIME SUBSCRIPTIONS
  // =====================================================
  onActivityLog: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:activity-log', listener);
    return () => ipcRenderer.off('realtime:activity-log', listener);
  },

  onAlert: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:alert', listener);
    return () => ipcRenderer.off('realtime:alert', listener);
  },

  onWarning: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:warning', listener);
    return () => ipcRenderer.off('realtime:warning', listener);
  },

  onError: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:error', listener);
    return () => ipcRenderer.off('realtime:error', listener);
  },

  onSuccess: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('realtime:success', listener);
    return () => ipcRenderer.off('realtime:success', listener);
  },

  // =====================================================
  // UTILITY METHODS
  // =====================================================
  getPlatform: () => process.platform,
  getNodeVersion: () => process.version,
  log: (message) => console.log('[Preload]', message),
});

// Disable dangerous global APIs
Object.defineProperty(window, 'eval', {
  value: undefined,
  writable: false,
  configurable: false,
});

console.log('[Preload] Context bridge initialized with security isolation');

// "시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."
// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." 🫡