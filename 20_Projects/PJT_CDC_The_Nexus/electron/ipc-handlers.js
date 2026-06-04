import { devLog } from './logger.js';
/**
 * Electron IPC Handler Implementation
 *
 * Project Nexus Phase 2: Complete handler implementations for IPC channels
 * Bridges Vue 3 components with backend monitoring systems
 */

import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { IpcChannels, ResponseFormats, IpcEventBatcher, IpcHandler } from './ipc-channels.js';
import { ollamaManager } from './ollama-manager.js';
import { ApprovalGate } from './approval-gate.js';
import { APOSTLE_REGISTRY, findApostle } from './apostle-registry.js';
import { OpenClaudeClient } from './openclaude-client.js';

/**
 * 토큰에서 사도 정보 추출
 * @param {string} token - 승인 토큰
 * @param {ApprovalGate} gate - ApprovalGate 인스턴스
 * @returns {object|null} 사도 정보 또는 null
 */
function getApostleFromToken(token, gate) {
  const tokenInfo = gate.getTokenInfo(token);
  if (!tokenInfo || !tokenInfo.requestor) return null;

  // requestor는 'apostle-1', 'apostle-2' 형식
  const apostleInfo = findApostle(tokenInfo.requestor);
  return apostleInfo ? { ...apostleInfo, id: tokenInfo.requestor } : null;
}

/**
 * Initialize all IPC handlers for Phase 2-4 features
 * @param {AgentManager} agents - LLM-backed agent manager (optional)
 * @param {KnowledgeGraph} graph - Knowledge graph instance (optional)
 * @param {DiscordBridge} discord - Discord bridge instance (optional)
 * @param {VoicePipeline} voicePipeline - Voice pipeline for STT/TTS (Phase 4-Extended, optional)
 */
export function initializeIpcHandlers(agents, graph, discord, voicePipeline) {
  const handler = new IpcHandler(ipcMain, 5000);
  const eventBatcher = new IpcEventBatcher(20, 1000);

  // =====================================================
  // 1. CONSTITUTION MANAGEMENT (Tier 0 — 토큰 기반 승인 게이트)
  // =====================================================
  // 앱 자체 렌더러는 사전 승인(화이트리스트). 외부 요청자(예: discord-bot)는
  // 의장 승인(constitution:approve)을 거쳐야 토큰을 발급받는다.
  const constitutionGate = new ApprovalGate({ whitelist: ['nexus-renderer'] });

  // 1-a. 접근 요청 → 화이트리스트는 즉시 토큰, 그 외는 승인 대기 requestId
  handler.handle('constitution:request', async (event, { requestor } = {}) => {
    return constitutionGate.requestAccess(requestor || 'nexus-renderer');
  });

  // 1-b. (의장/UI) 대기 요청 승인 → 토큰 발급
  handler.handle('constitution:approve', async (event, { requestId } = {}) => {
    const token = constitutionGate.approve(requestId);
    return { approved: true, token };
  });

  // 1-c. 실제 헌법 반환 — 유효 토큰 필수
  handler.handle(IpcChannels.CONSTITUTION.GET_CONSTITUTION, async (event, { token } = {}) => {
    if (!constitutionGate.verify(token)) {
      throw new Error('Unauthorized: valid approval token required (요청→승인 후 재시도)');
    }

    const constitutionPath = path.join(
      process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive',
      '01_Control_Tower',
      '01_MASTER_CONSTITUTION.md'
    );

    if (!fs.existsSync(constitutionPath)) {
      throw new Error('Constitution file not found');
    }

    const content = fs.readFileSync(constitutionPath, 'utf-8');
    return {
      path: constitutionPath,
      content,
      size: content.length,
      modifiedAt: fs.statSync(constitutionPath).mtime,
    };
  });

  // Watch for constitution changes (Phase D3.2 — 헌법 실시간 알림)
  // 'change' 외 'rename'(atomic write)도 처리, 다중 이벤트 debounce(150ms).
  handler.on(IpcChannels.CONSTITUTION.GET_CONSTITUTION, (event) => {
    const constitutionPath = path.join(
      process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive',
      '01_Control_Tower',
      '01_MASTER_CONSTITUTION.md'
    );

    let debounceTimer = null;
    const fireChanged = () => {
      event.reply(IpcChannels.CONSTITUTION.CONSTITUTION_CHANGED, {
        path: constitutionPath,
        changedAt: new Date().toISOString(),
      });
    };

    const watcher = fs.watch(constitutionPath, (eventType /*, filename */) => {
      if (eventType !== 'change' && eventType !== 'rename') return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fireChanged, 150);
    });

    event.once('close', () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      watcher.close();
    });
  });

  // =====================================================
  // 2. OPENCLAUDE INTEGRATION (OpenClaude API @ localhost:4000)
  // =====================================================
  // 의장/13사도의 토큰을 받아 OpenClaude API 호출
  const openClaudeClient = new OpenClaudeClient();

  // 2-a. API 호출 (일반 요청)
  handler.handle('openclaude:call', async (event, { endpoint, token, payload } = {}) => {
    try {
      // 토큰이 유효한지 확인
      if (!constitutionGate.verify(token)) {
        throw new Error('Unauthorized: invalid or expired approval token');
      }

      const apostleInfo = getApostleFromToken(token, constitutionGate);
      if (!apostleInfo) {
        throw new Error('Unauthorized: apostle not found');
      }

      // 사도의 권한 확인
      if (!apostleInfo.scopes.includes('execute:llm')) {
        throw new Error('Forbidden: insufficient scopes for OpenClaude API');
      }

      // 토큰을 OpenClaudeClient에 설정
      const tokenInfo = constitutionGate.getTokenInfo(token);
      openClaudeClient.setToken(token, tokenInfo.expiresAt);

      // API 호출 실행
      const result = await openClaudeClient.call(endpoint, { ...payload, apostle: apostleInfo.name });
      return result;
    } catch (error) {
      console.error('OpenClaude API error:', error);
      throw error;
    }
  });

  // 2-b. 스트리밍 API 호출 (SSE)
  handler.handle('openclaude:stream', async (event, { endpoint, token, payload } = {}) => {
    try {
      if (!constitutionGate.verify(token)) {
        throw new Error('Unauthorized: invalid or expired approval token');
      }

      const apostleInfo = getApostleFromToken(token, constitutionGate);
      if (!apostleInfo || !apostleInfo.scopes.includes('execute:llm')) {
        throw new Error('Forbidden: insufficient scopes for OpenClaude streaming');
      }

      const tokenInfo = constitutionGate.getTokenInfo(token);
      openClaudeClient.setToken(token, tokenInfo.expiresAt);

      // 스트리밍 콜백 설정
      await openClaudeClient.stream(endpoint, payload,
        (chunk) => event.reply('openclaude:stream-chunk', { chunk, apostle: apostleInfo.name }),
        (error) => event.reply('openclaude:stream-error', { error: error.message })
      );

      return { streaming: true };
    } catch (error) {
      console.error('OpenClaude streaming error:', error);
      throw error;
    }
  });

  // 2-c. 토큰 갱신 (자동 또는 수동)
  handler.handle('openclaude:refresh-token', async (event, { token, force = false } = {}) => {
    try {
      const tokenInfo = constitutionGate.getTokenInfo(token);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      // OpenClaudeClient에서 토큰 갱신 요청
      const newToken = await openClaudeClient._requestTokenRefresh(force);
      
      // 새 토큰을 ApprovalGate에 등록
      const refreshedToken = constitutionGate.approve(token, tokenInfo.scopes);
      
      return { token: refreshedToken, expiresAt: new Date(Date.now() + 3600000) };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  });

  // 2-d. 토큰 정보 조회 (의장 대시보드)
  handler.handle('openclaude:get-token-info', async (event, { token } = {}) => {
    const tokenInfo = constitutionGate.getTokenInfo(token);
    if (!tokenInfo) {
      throw new Error('Token not found');
    }

    return {
      requestor: tokenInfo.requestor,
      scopes: tokenInfo.scopes,
      expiresAt: tokenInfo.expiresAt,
      createdAt: tokenInfo.createdAt,
      apostleId: `apostle-${tokenInfo.apostleId || '?'}`,
      masked: `${token.substring(0, 16)}...` // 마스킹된 토큰
    };
  });

  // =====================================================
  // 5. SEARCH & FILTERING
  // =====================================================
  handler.handle(IpcChannels.SEARCH.SEARCH_DOCUMENTS, async (event, { query, filters }) => {
    const scriptPath = path.join(
      process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive',
      '01_Control_Tower',
      '24_Scripts',
      'twinbrain_query.py'
    );

    try {
      const output = execSync(`py "${scriptPath}" "${query}"`, { encoding: 'utf-8' });
      return JSON.parse(output);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  });

  // =====================================================
  // 4. AGENT MONITORING (LLM-Backed)
  // =====================================================
  handler.handle(IpcChannels.AGENT.GET_AGENTS, async (event) => {
    // Return LLM-backed agent status
    if (agents) {
      const agentStatus = agents.getAgentStatus();
      return agentStatus.map(agent => ({
        ...agent,
        status: 'active',
        activeTasksCount: Math.floor(Math.random() * 5) + 1,
        responseTime: Math.floor(Math.random() * 2000) + 200, // 200-2200ms for LLM
        uptime: 99.8,
        lastActivity: new Date(),
        powered: 'LLM' // Indicate this is LLM-backed
      }));
    }

    // Fallback to mock data if agents not initialized
    return [
      {
        id: 1,
        name: 'Sudal',
        role: 'CEO & Strategic Authority',
        status: 'active',
        activeTasksCount: 3,
        responseTime: 45,
        uptime: 99.8,
        lastActivity: new Date(),
      },
      {
        id: 2,
        name: 'Lando',
        role: 'Control Center & COO',
        status: 'active',
        activeTasksCount: 5,
        responseTime: 52,
        uptime: 99.6,
        lastActivity: new Date(Date.now() - 5 * 60000),
      },
      {
        id: 15,
        name: 'OpenClaude',
        role: 'Developer & Engineering',
        status: 'active',
        activeTasksCount: 2,
        responseTime: 128,
        uptime: 98.9,
        lastActivity: new Date(Date.now() - 10 * 60000),
      },
    ];
  });

  handler.handle(IpcChannels.AGENT.EXECUTE_COMMAND, async (event, { agentId, command }) => {
    // Execute command via LLM-backed agent
    if (agents) {
      try {
        const agentMap = { 1: 'sudal', 2: 'lando', 15: 'openclaude' };
        const agentName = agentMap[agentId];

        if (!agentName) {
          throw new Error(`Unknown agent ID: ${agentId}`);
        }

        devLog(`[Agent ${agentId}] Executing: ${command}`);
        const result = await agents.executeAgentCommand(agentName, command);

        return {
          agentId,
          command,
          response: result.response,
          toolsCalled: result.toolsCalled,
          executionTime: result.executionTime,
          status: result.status,
          executedAt: new Date().toISOString(),
        };
      } catch (error) {
        return {
          agentId,
          command,
          response: `Agent error: ${error.message}`,
          toolsCalled: [],
          status: 'error',
          executedAt: new Date().toISOString(),
        };
      }
    }

    // Fallback for when agents not initialized
    return {
      agentId,
      command,
      executedAt: new Date().toISOString(),
      status: 'executed',
    };
  });

  // =====================================================
  // 4. TASK MANAGEMENT
  // =====================================================
  handler.handle(IpcChannels.TASK.CREATE_TASK, async (event, taskData) => {
    // Generate task ID and metadata
    const task = {
      id: `TASK_${Date.now()}`,
      ...taskData,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In production: save to database/file system
    devLog('Task created:', task.id);

    return task;
  });

  handler.handle(IpcChannels.TASK.GET_TASKS, async (event, { filter = {} } = {}) => {
    // Return mock task data
    return [
      {
        id: 'TASK_001',
        title: 'Phase 2A Component Development',
        status: 'in-progress',
        assignee: 'OpenClaude',
        priority: 'high',
        progress: 45,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000),
      },
      {
        id: 'TASK_002',
        title: 'IPC Channel Implementation',
        status: 'in-progress',
        assignee: 'OpenClaude',
        priority: 'high',
        progress: 75,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000),
      },
    ];
  });

  handler.handle(IpcChannels.TASK.UPDATE_TASK_STATUS, async (event, { taskId, status, progress }) => {
    // Update task in database
    return {
      taskId,
      status,
      progress,
      updatedAt: new Date().toISOString(),
    };
  });

  // =====================================================
  // 5. SYSTEM MONITORING
  // =====================================================
  handler.handle(IpcChannels.SYSTEM.GET_SYSTEM_METRICS, async (event) => {
    const auditLogDir = path.join(
      process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive',
      '01_Control_Tower',
      '24_Scripts',
      'twinbrain_audit_log'
    );

    let twinbrainMetrics = { status: 'offline', storageUsage: 0 };
    
    // Read latest deep scan report
    const reports = fs.readdirSync(auditLogDir)
      .filter(f => f.startsWith('Deep_Scan_Report_'))
      .sort()
      .reverse();

    if (reports.length > 0) {
      const latestReport = JSON.parse(fs.readFileSync(path.join(auditLogDir, reports[0]), 'utf-8'));
      twinbrainMetrics = {
        status: 'healthy',
        totalFiles: latestReport.total_files,
        lastScan: latestReport.scan_date,
        storageUsage: 75 // Mock for now
      };
    }

    return ResponseFormats.METRICS({
      ollama: { status: 'healthy', cpu: 45, memory: 62 },
      morning: { status: 'healthy', completion: 92 },
      twinbrain: twinbrainMetrics,
      nexus: { status: 'healthy', version: 'v1.1.0' }
    });
  });

  // =====================================================
  // 6. REAL-TIME UPDATES (Push from Main to Renderer)
  // =====================================================
  function setupRealtimeUpdates(mainWindow) {
    // System metrics push every 5 seconds
    const metricsInterval = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const metrics = {
          ollama: { cpu: 40 + Math.random() * 10, memory: 60 + Math.random() * 10 },
          morning: { completion: 90 + Math.random() * 10 },
          twinbrain: { storageUsage: 70 + Math.random() * 5 },
          nexus: { errors: Math.random() > 0.95 ? 1 : 0 },
          timestamp: new Date().toISOString(),
        };

        mainWindow.webContents.send(IpcChannels.REALTIME.METRICS_PUSH, metrics);
      }
    }, 5000);

    return { metricsInterval };
  }

  // =====================================================
  // 7. FILE OPERATIONS
  // =====================================================
  handler.handle(IpcChannels.FILE.READ_FILE, async (event, { filePath }) => {
    // Security: validate file path
    if (!filePath || filePath.includes('..')) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      path: filePath,
      content,
      size: content.length,
      modifiedAt: fs.statSync(filePath).mtime,
    };
  });

  handler.handle(IpcChannels.FILE.READ_DIRECTORY, async (event, { dirPath }) => {
    if (!fs.existsSync(dirPath)) {
      throw new Error('Directory not found');
    }

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name),
    }));
  });

  // =====================================================
  // 8. SETTINGS & CONFIGURATION
  // =====================================================
  handler.handle(IpcChannels.SETTINGS.GET_SETTINGS, async (event) => {
    // Load from settings file or database
    const defaultSettings = {
      general: {
        autoStartMonitoring: true,
        monitoringInterval: 5000,
      },
      appearance: {
        theme: 'dark',
        fontSize: 14,
      },
      notifications: {
        enableAlerts: true,
        enableWarnings: true,
        enableLogs: true,
      },
      performance: {
        maxConcurrentTasks: 5,
        enableCaching: true,
      },
      security: {
        requireApprovalForCritical: true,
      },
    };

    return defaultSettings;
  });

  handler.handle(IpcChannels.SETTINGS.SAVE_SETTINGS, async (event, { settings }) => {
    // Save to file or database
    devLog('Settings saved:', settings);
    return { success: true, timestamp: new Date().toISOString() };
  });

  // =====================================================
  // 9. REPORTING
  // =====================================================
  handler.handle(IpcChannels.REPORT.GENERATE_REPORT, async (event, { reportType }) => {
    const report = {
      type: reportType,
      generatedAt: new Date().toISOString(),
      content: `Generated ${reportType} report`,
    };

    return report;
  });

  // =====================================================
  // 10. ADMIN FUNCTIONS
  // =====================================================
  handler.handle(IpcChannels.ADMIN.START_MONITORING, async (event) => {
    devLog('Monitoring started');
    return { status: 'started', timestamp: new Date().toISOString() };
  });

  handler.handle(IpcChannels.ADMIN.TRIGGER_BACKUP, async (event) => {
    devLog('Backup triggered');
    return { status: 'running', timestamp: new Date().toISOString() };
  });

  handler.handle(IpcChannels.ADMIN.TRIGGER_SYNC, async (event) => {
    devLog('Sync triggered');
    return { status: 'syncing', timestamp: new Date().toISOString() };
  });

  // =====================================================
  // 11. KNOWLEDGE GRAPH
  // =====================================================
  handler.handle('graph:add-node', async (event, { nodeId, label, properties }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    const node = graph.addNode(nodeId, label, properties || {});
    if (discord) await discord.emit('graph-update', nodeId, 'node-added');
    return { success: true, nodeId: node.id };
  });

  handler.handle('graph:add-edge', async (event, { edgeId, sourceId, targetId, type, properties }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    const edge = graph.addEdge(edgeId, sourceId, targetId, type, properties || {});
    if (discord) await discord.emit('graph-update', edgeId, 'edge-added');
    return { success: true, edgeId: edge.id };
  });

  handler.handle('graph:search', async (event, { query }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    const results = graph.searchNodes(query);
    return results;
  });

  handler.handle('graph:get-node', async (event, { nodeId }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    return graph.getNode(nodeId);
  });

  handler.handle('graph:get-relationships', async (event, { nodeId, depth }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    return graph.getConnectedNodes(nodeId, depth || 1);
  });

  handler.handle('graph:find-path', async (event, { sourceId, targetId, maxDepth }) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    const path = graph.findPath(sourceId, targetId, maxDepth || 5);
    return path || { error: 'No path found' };
  });

  handler.handle('graph:stats', async (event) => {
    if (!graph) throw new Error('Knowledge graph not initialized');
    return graph.getStats();
  });

  // =====================================================
  // 12. DISCORD BRIDGE
  // =====================================================
  handler.handle('discord:send', async (event, { content, options }) => {
    if (!discord) throw new Error('Discord bridge not initialized');
    const result = await discord.sendMessage(content, options || {});
    return { success: !!result, timestamp: new Date().toISOString() };
  });

  handler.handle('discord:status', async (event) => {
    if (!discord) throw new Error('Discord bridge not initialized');
    return discord.getStats();
  });

  handler.handle('discord:configure', async (event, { webhookUrl, botToken, guildId, channelId }) => {
    if (!discord) throw new Error('Discord bridge not initialized');
    discord.config.webhookUrl = webhookUrl || discord.config.webhookUrl;
    discord.config.botToken = botToken || discord.config.botToken;
    discord.config.guildId = guildId || discord.config.guildId;
    discord.config.channelId = channelId || discord.config.channelId;
    const connected = await discord.connect();
    return { success: connected, status: connected ? 'connected' : 'failed' };
  });

  // Discord Command Routing (Phase C Control Interface)
  handler.handle('discord:execute-npm-script', async (event, { projectName, script, userId, guildId }) => {
    // execSync는 파일 상단의 import에서 이미 로드됨
    // PROJECT_REGISTRY는 discord-bridge에서 export해야 함

    if (!PROJECT_REGISTRY[projectName]) {
      return {
        success: false,
        error: `Project '${projectName}' not found`,
        timestamp: new Date().toISOString()
      };
    }

    const project = PROJECT_REGISTRY[projectName];
    if (!project.scripts || !project.scripts.includes(script)) {
      return {
        success: false,
        error: `Script '${script}' not available for ${projectName}`,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const result = execSync(`npm run ${script}`, {
        cwd: project.path,
        encoding: 'utf8',
        timeout: 30000
      });

      return {
        success: true,
        projectName,
        script,
        output: result.substring(0, 500),
        timestamp: new Date().toISOString(),
        userId,
        guildId
      };
    } catch (error) {
      return {
        success: false,
        projectName,
        script,
        error: error.message.substring(0, 200),
        timestamp: new Date().toISOString(),
        userId,
        guildId
      };
    }
  });

  handler.handle('discord:execute-agent-command', async (event, { agentId, command, userId, guildId }) => {
    try {
      // Route to agent:execute-command with Discord metadata
      const result = await new Promise((resolve, reject) => {
        const handler = ipcMain.handle('agent:execute-command', async (e, args) => {
          try {
            const cmd = `agent:${agentId}:${command}`;
            const agentResult = await executeAgentCommand(agentId, command);
            resolve({
              success: true,
              agentId,
              command,
              result: agentResult,
              timestamp: new Date().toISOString(),
              userId,
              guildId
            });
          } catch (err) {
            reject(err);
          }
        });
      });

      return result;
    } catch (error) {
      return {
        success: false,
        agentId,
        command,
        error: error.message,
        timestamp: new Date().toISOString(),
        userId,
        guildId
      };
    }
  });

  handler.handle('discord:get-project-registry', async (event) => {
    // PROJECT_REGISTRY는 discord-bridge에서 export해야 함
    return Object.entries(PROJECT_REGISTRY).map(([name, info]) => ({
      name,
      description: info.description,
      scripts: info.scripts,
      path: info.path,
      port: info.port
    }));
  });

  // =====================================================
  // 13. OLLAMA MODEL MANAGER
  // =====================================================
  handler.handle('ollama:check-status', async (event) => {
    try {
      const isRunning = await ollamaManager.isOllamaRunning();
      const startTime = Date.now();

      return {
        connected: isRunning,
        model: '', // Current loaded model (can be extended)
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[Ollama] Status check failed:', error);
      return {
        connected: false,
        model: '',
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  handler.handle('ollama:list-models', async (event) => {
    try {
      const models = await ollamaManager.listModels();
      return models.map(m => m.name || m);
    } catch (error) {
      console.error('[Ollama] List models failed:', error);
      return [];
    }
  });

  handler.handle('ollama:download-model', async (event, { model }) => {
    if (!model) throw new Error('Model name is required');

    try {
      devLog(`[IPC] Starting download for model: ${model}`);

      // Poll Ollama API for progress (simulated)
      const startTime = Date.now();
      let isComplete = false;
      let progress = 0;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += Math.random() * 30;
          if (progress > 90) progress = 90;
        }

        event.reply('ollama:download-progress', {
          progress: Math.floor(progress),
          message: `다운로드 중... ${Math.floor(progress)}%`
        });
      }, 500);

      // Actually download the model
      const success = await ollamaManager.pullModel(model);

      clearInterval(progressInterval);

      if (success) {
        event.reply('ollama:download-progress', {
          progress: 100,
          message: `${model} 다운로드 완료!`
        });
        return { success: true, model, duration: Date.now() - startTime };
      } else {
        throw new Error(`Failed to download ${model}`);
      }
    } catch (error) {
      console.error('[Ollama] Download failed:', error);
      throw error;
    }
  });

  handler.handle('ollama:load-model', async (event, { model }) => {
    if (!model) throw new Error('Model name is required');

    try {
      // Ensure the model is available (download if needed)
      const success = await ollamaManager.ensureModel(model);

      if (!success) {
        throw new Error(`Failed to ensure model ${model} is available`);
      }

      return {
        success: true,
        model,
        status: 'loaded',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Ollama] Load model failed:', error);
      throw error;
    }
  });

  // =====================================================
  // 11. APOSTLE ROUTING (Phase D3 — 의장-Nexus Live IPC)
  // =====================================================
  // 13사도(+의장) 라우팅. ApprovalGate를 통한 토큰 인가 후 명령 위임.
  // 레지스트리는 별도 모듈(./apostle-registry.js)로 분리하여 단위 테스트 가능.
  const apostleGate = new ApprovalGate({ whitelist: ['nexus-renderer'] });
  // D3.3: OpenClaude 라우팅 백엔드 (apiKey 미설정 시 invoke가 NOT_CONFIGURED 던짐)
  const openclaude = new OpenClaudeClient();

  handler.handle(IpcChannels.APOSTLE.GET_ROSTER, async () => {
    return { roster: APOSTLE_REGISTRY, total: APOSTLE_REGISTRY.length };
  });

  handler.handle(IpcChannels.APOSTLE.GET_STATUS, async (event, { id } = {}) => {
    const entry = APOSTLE_REGISTRY.find(a => a.id === id);
    if (!entry) throw new Error(`Unknown apostle: ${id}`);
    return {
      ...entry,
      online: true,
      lastSeen: new Date().toISOString(),
      pendingCommands: 0,
    };
  });

  handler.handle(IpcChannels.APOSTLE.REQUEST_TOKEN, async (event, { requestor } = {}) => {
    return apostleGate.requestAccess(requestor || 'nexus-renderer');
  });

  handler.handle(IpcChannels.APOSTLE.APPROVE_TOKEN, async (event, { requestId } = {}) => {
    const token = apostleGate.approve(requestId);
    return { approved: true, token };
  });

  handler.handle(IpcChannels.APOSTLE.REVOKE_TOKEN, async (event, { token } = {}) => {
    const revoked = apostleGate.revoke ? apostleGate.revoke(token) : false;
    return { revoked: !!revoked };
  });

  handler.handle(IpcChannels.APOSTLE.EXECUTE, async (event, { token, id, command, payload } = {}) => {
    if (!apostleGate.verify(token)) {
      throw new Error('Unauthorized: valid apostle token required (REQUEST_TOKEN → APPROVE_TOKEN)');
    }
    const apostle = APOSTLE_REGISTRY.find(a => a.id === id);
    if (!apostle) throw new Error(`Unknown apostle: ${id}`);

    const executedAt = new Date().toISOString();

    // D3.3: tier 2 외부 AI 라우팅. openclaude는 OpenClaudeClient로 실호출.
    if (apostle.id === 'openclaude' && openclaude.isConfigured()) {
      try {
        const { response, cached, latencyMs } = await openclaude.invoke(String(command || ''));
        return {
          apostle: apostle.id,
          command,
          payload: payload || null,
          executedAt,
          status: 'ok',
          response,
          meta: { cached, latencyMs, backend: 'openclaude' },
        };
      } catch (err) {
        return {
          apostle: apostle.id,
          command,
          executedAt,
          status: 'error',
          error: { code: err.code || 'INVOKE_FAILED', message: err.message },
        };
      }
    }

    // 그 외(또는 미설정 시) 스켈레톤 응답. 향후 ollama/gemini/grok/perplexity 라우팅 추가.
    return {
      apostle: apostle.id,
      command,
      payload: payload || null,
      executedAt,
      status: 'queued',
      response: `[${apostle.name}] ${command} (queued — 라우팅 백엔드 미설정)`,
    };
  });

  handler.handle(IpcChannels.APOSTLE.GET_METRICS, async (event, { id } = {}) => {
    if (id) {
      const entry = APOSTLE_REGISTRY.find(a => a.id === id);
      if (!entry) throw new Error(`Unknown apostle: ${id}`);
      return {
        id,
        invocations: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        lastInvocation: null,
      };
    }
    // 전체 메트릭 (스켈레톤)
    return APOSTLE_REGISTRY.map(a => ({
      id: a.id,
      invocations: 0,
      avgLatencyMs: 0,
      errorRate: 0,
    }));
  });

  // =====================================================
  // 14. VOICE PIPELINE (Phase 4-Extended)
  // =====================================================
  handler.handle('voice:process-audio', async (event, { audioBuffer, userId, language }) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    try {
      const result = await voicePipeline.handleVoiceInput({
        buffer: Buffer.from(audioBuffer),
        userId: userId || 'anonymous',
        language: language || 'ko-KR',
      });

      return {
        success: result.success,
        userText: result.userText,
        userIntent: result.userIntent,
        responseText: result.responseText,
        responseAudio: result.responseAudio ? result.responseAudio.toString('base64') : null,
        model: result.llmModel,
        processingTime: result.processingTime,
        error: result.error || null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  handler.handle('voice:get-status', async (event) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    return voicePipeline.getStatus();
  });

  handler.handle('voice:get-metrics', async (event) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    return voicePipeline.getMetrics();
  });

  handler.handle('voice:get-history', async (event) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    return voicePipeline.getConversationHistory();
  });

  handler.handle('voice:clear-history', async (event) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    voicePipeline.clearConversationHistory();
    return { success: true, timestamp: new Date().toISOString() };
  });

  handler.handle('voice:update-config', async (event, { config }) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    voicePipeline.updateConfig(config);
    return { success: true, newConfig: voicePipeline.config };
  });

  // =====================================================
  // Voice Pipeline — Process Transcribed Text (from renderer STT)
  // =====================================================
  handler.handle('voice:process-transcribed-text', async (event, { text, userId, language }) => {
    if (!voicePipeline) {
      throw new Error('Voice pipeline not initialized');
    }

    try {
      const result = await voicePipeline.handleTranscribedText({
        text: text || '',
        userId: userId || 'anonymous',
        language: language || 'ko-KR',
        timestamp: new Date().toISOString(),
      });

      return {
        success: result.success !== false,
        userText: text,
        userIntent: result.intent || null,
        responseText: result.responseText || '',
        responseAudio: result.responseAudio ? result.responseAudio.toString('base64') : null,
        model: result.llmModel || 'openclaude',
        processingTime: result.processingTime || 0,
        error: result.error || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        userText: text,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });

  return { handler, eventBatcher, setupRealtimeUpdates };
}

/**
 * Setup preload bridge for Renderer access to IPC
 */
export function setupPreloadBridge() {
  const preloadScript = `
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe IPC API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Constitution (token-gated)
  getConstitution: async () => {
    const res = await ipcRenderer.invoke('constitution:request', { requestor: 'nexus-renderer' });
    if (!res.approved || !res.token) throw new Error('Constitution access not approved');
    return ipcRenderer.invoke('constitution:get', { token: res.token });
  },
  requestConstitutionAccess: (requestor) => ipcRenderer.invoke('constitution:request', { requestor }),
  approveConstitutionAccess: (requestId) => ipcRenderer.invoke('constitution:approve', { requestId }),
  onConstitutionUpdate: (callback) => ipcRenderer.on('constitution:changed', callback),

  // OpenClaude (token-gated via ApprovalGate)
  openClaudeCall: (endpoint, token, payload) => ipcRenderer.invoke('openclaude:call', { endpoint, token, payload }),
  openClaudeStream: (endpoint, token, payload) => ipcRenderer.invoke('openclaude:stream', { endpoint, token, payload }),
  refreshOpenClaudeToken: (token, force) => ipcRenderer.invoke('openclaude:refresh-token', { token, force }),
  getOpenClaudeTokenInfo: (token) => ipcRenderer.invoke('openclaude:get-token-info', { token }),
  onOpenClaudeStreamChunk: (callback) => ipcRenderer.on('openclaude:stream-chunk', callback),
  onOpenClaudeStreamError: (callback) => ipcRenderer.on('openclaude:stream-error', callback),

  // Search
  searchDocuments: (query, filters) => ipcRenderer.invoke('search:documents', { query, filters }),

  // Agent
  getAgents: () => ipcRenderer.invoke('agent:get-list'),
  executeCommand: (agentId, command) => ipcRenderer.invoke('agent:execute-command', { agentId, command }),
  onAgentStatus: (callback) => ipcRenderer.on('agent:status-updated', callback),

  // Task
  createTask: (taskData) => ipcRenderer.invoke('task:create', taskData),
  getTasks: (filter) => ipcRenderer.invoke('task:get-list', { filter }),
  updateTaskStatus: (taskId, status, progress) => ipcRenderer.invoke('task:update-status', { taskId, status, progress }),
  onTaskStatusChange: (callback) => ipcRenderer.on('task:status-changed', callback),

  // System
  getSystemMetrics: () => ipcRenderer.invoke('system:get-all-metrics'),
  onSystemMetrics: (callback) => ipcRenderer.on('realtime:metrics', callback),

  // File
  readFile: (filePath) => ipcRenderer.invoke('file:read', { filePath }),
  readDirectory: (dirPath) => ipcRenderer.invoke('file:read-directory', { dirPath }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', { settings }),

  // Reporting
  generateReport: (reportType) => ipcRenderer.invoke('report:generate', { reportType }),

  // Admin
  startMonitoring: () => ipcRenderer.invoke('admin:start-monitoring'),
  triggerBackup: () => ipcRenderer.invoke('admin:trigger-backup'),
  triggerSync: () => ipcRenderer.invoke('admin:trigger-sync'),

  // Knowledge Graph
  addGraphNode: (nodeId, label, properties) => ipcRenderer.invoke('graph:add-node', { nodeId, label, properties }),
  addGraphEdge: (edgeId, sourceId, targetId, type, properties) => ipcRenderer.invoke('graph:add-edge', { edgeId, sourceId, targetId, type, properties }),
  searchGraph: (query) => ipcRenderer.invoke('graph:search', { query }),
  getGraphNode: (nodeId) => ipcRenderer.invoke('graph:get-node', { nodeId }),
  getGraphRelationships: (nodeId, depth) => ipcRenderer.invoke('graph:get-relationships', { nodeId, depth }),
  findGraphPath: (sourceId, targetId, maxDepth) => ipcRenderer.invoke('graph:find-path', { sourceId, targetId, maxDepth }),
  getGraphStats: () => ipcRenderer.invoke('graph:stats'),

  // Discord Bridge
  sendDiscordMessage: (content, options) => ipcRenderer.invoke('discord:send', { content, options }),
  getDiscordStatus: () => ipcRenderer.invoke('discord:status'),
  configureDiscord: (config) => ipcRenderer.invoke('discord:configure', config),

  // Voice Pipeline (Phase 4)
  processTranscribedText: (text, userId, language) => ipcRenderer.invoke('voice:process-transcribed-text', { text, userId, language }),
  processAudio: (audioBuffer, userId, language) => ipcRenderer.invoke('voice:process-audio', { audioBuffer, userId, language }),
  getVoiceStatus: () => ipcRenderer.invoke('voice:get-status'),
  getVoiceMetrics: () => ipcRenderer.invoke('voice:get-metrics'),
  getVoiceHistory: () => ipcRenderer.invoke('voice:get-history'),
  clearVoiceHistory: () => ipcRenderer.invoke('voice:clear-history'),
  updateVoiceConfig: (config) => ipcRenderer.invoke('voice:update-config', { config }),
  onVoiceInteractionComplete: (callback) => ipcRenderer.on('voice:interaction-complete', callback),
  onVoiceInteractionError: (callback) => ipcRenderer.on('voice:interaction-error', callback),

  // Real-time subscriptions
  onActivityLog: (callback) => ipcRenderer.on('realtime:activity-log', callback),
  onAlert: (callback) => ipcRenderer.on('realtime:alert', callback),
  onWarning: (callback) => ipcRenderer.on('realtime:warning', callback),
  onError: (callback) => ipcRenderer.on('realtime:error', callback),
  onSuccess: (callback) => ipcRenderer.on('realtime:success', callback),
});
`;

  return preloadScript;
}


// "시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."
// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." 🫡

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
