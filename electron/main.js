import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeIpcHandlers, setupPreloadBridge } from './ipc-handlers.js';
import { ollamaManager } from './ollama-manager.js';
import { agentManager } from './llm-agent.js';
import { knowledgeGraph } from './knowledge-graph.js';
import { discordBridge } from './discord-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let ipcResources = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.userAgent = 'The-Nexus/0.1.0 (CDC Intelligence Platform)';

  return mainWindow;
}

function setupIpcHandlers(mainWindow, agents) {
  const { handler, eventBatcher, setupRealtimeUpdates } = initializeIpcHandlers(agents, knowledgeGraph, discordBridge);

  // Initialize real-time updates
  const { metricsInterval } = setupRealtimeUpdates(mainWindow);

  // Store intervals for cleanup on window close
  ipcResources.metricsInterval = metricsInterval;
  ipcResources.handler = handler;
  ipcResources.eventBatcher = eventBatcher;

  console.log('[NEXUS] IPC handlers initialized with real-time updates, LLM agents, knowledge graph, and Discord');
}

function setupApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: '의장님 (Chairman)',
      submenu: [
        {
          label: '헌법 열기',
          click: () => mainWindow.webContents.send('open-constitution')
        },
        {
          label: '리포트 새로고침',
          click: () => mainWindow.webContents.send('refresh-reports')
        },
        { type: 'separator' },
        {
          label: '에이전트 상태',
          click: () => mainWindow.webContents.send('show-agents')
        },
        {
          label: '시스템 메트릭',
          click: () => mainWindow.webContents.send('show-metrics')
        },
        { type: 'separator' },
        {
          label: '개발자 도구',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', async () => {
  mainWindow = createWindow();
  setupApplicationMenu();

  console.log('[NEXUS] Starting Ollama integration...');
  const success = await ollamaManager.start();

  if (!success) {
    console.warn('[NEXUS] Ollama not available - agent features disabled');
  } else {
    console.log('[NEXUS] Ollama ready');
  }

  // Initialize knowledge graph
  const graphStats = knowledgeGraph.getStats();
  console.log(`[NEXUS] Knowledge Graph loaded: ${graphStats.nodeCount} nodes, ${graphStats.edgeCount} edges`);

  // Initialize Discord bridge (no error if not configured)
  try {
    const discordReady = await discordBridge.connect();
    if (discordReady) {
      console.log('[NEXUS] Discord Bridge connected');
      await discordBridge.flushQueue();
    }
  } catch (error) {
    console.warn('[NEXUS] Discord Bridge not configured:', error.message);
  }

  // Initialize agents
  const agents = agentManager(ollamaManager);
  setupIpcHandlers(mainWindow, agents);

  console.log('[NEXUS] Application ready — CDC Intelligence Platform v0.1.0 with LLM agents, knowledge graph, and Discord');
});

app.on('window-all-closed', () => {
  // Cleanup resources
  if (ipcResources.metricsInterval) {
    clearInterval(ipcResources.metricsInterval);
  }

  // Stop Ollama (optional - user may want to keep it running)
  // ollamaManager.stop();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
    const agents = agentManager(ollamaManager);
    setupIpcHandlers(mainWindow, agents);
  }
});

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('[NEXUS] Uncaught Exception:', error);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('realtime:error', {
      type: 'critical',
      title: 'Application Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('[NEXUS] Electron main process module loaded');

// "시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."
// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." 🫡

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
