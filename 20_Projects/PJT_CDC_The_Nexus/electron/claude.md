# CLAUDE.md — electron/ (Electron 개발)

> **Electron 메인 프로세스 개발 규범**
> 데스크톱 앱 생명주기 관리 및 IPC 통신

---

## 📁 폴더 구조

```
electron/
├── main.js              (Electron 진입점)
├── preload.js           (Renderer 안전 브릿지, 있으면)
├── ipcHandlers.js       (IPC 핸들러)
├── windowManager.js     (윈도우 관리)
└── [기타 유틸]
```

---

## 🎯 핵심 규칙

### 1️⃣ Main Process 역할

**Electron main.js는 다음만 담당**:
- 앱 생명주기 (app.on('ready'), 'quit' 등)
- 윈도우 생성/관리
- 시스템 메뉴 & 단축키
- 파일 시스템 접근 (보안 정책 준수)

**Renderer와 분리**:
```js
// ✅ main.js
const { app, BrowserWindow, ipcMain } = require('electron');

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // IPC 안전 브릿지
      contextIsolation: true,  // 보안 필수
      enableRemoteModule: false,
    },
  });
  mainWindow.loadFile('index.html');
});

// IPC 핸들러 분리
ipcMain.on('agent:execute', (event, cmd) => {
  // 처리
  event.reply('agent:result', result);
});
```

### 2️⃣ 보안 정책 (Context Isolation)

```js
// ✅ 권장: preload.js를 통한 안전 IPC
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  on: (channel, handler) => ipcRenderer.on(channel, handler),
});
```

**renderer 코드**:
```js
// ✅ 안전
window.api.invoke('agent:execute', command);

// ❌ 금지: require('electron')
const { ipcRenderer } = require('electron');
```

### 3️⃣ IPC 통신 규칙

**네이밍 규칙** (kebab-case):
```js
// main → renderer
ipcMain.on('agent:status-changed', handler);

// renderer → main
ipcRenderer.invoke('agent:execute');
```

**요청-응답 패턴**:
```js
// main.js
ipcMain.handle('agent:execute', async (event, cmd) => {
  try {
    const result = await executeCommand(cmd);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// renderer (vue)
const result = await window.api.invoke('agent:execute', 'list agents');
```

---

## 🔄 앱 생명주기

```js
const { app } = require('electron');

// 1. 앱 시작
app.on('ready', () => {
  createWindow();
});

// 2. 마지막 윈도우 닫힘
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {  // macOS가 아니면
    app.quit();
  }
});

// 3. 앱 활성화 (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 4. 앱 종료 전 정리
app.on('quit', () => {
  // 정리 작업
});
```

---

## 🪟 윈도우 관리

### 단일 윈도우

```js
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('dist/index.html');  // Vite 빌드 결과
  
  // DevTools (개발 모드만)
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};
```

### 다중 윈도우

```js
const windows = new Map();

const createWindow = (id, options = {}) => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    ...options,
  });
  
  windows.set(id, window);
  
  window.on('closed', () => {
    windows.delete(id);
  });
};
```

---

## 📦 빌드 & 배포

### electron-builder 설정

```json
{
  "build": {
    "appId": "com.cdc.nexus",
    "productName": "The Nexus",
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": ["portable", "nsis"],
      "certificateFile": "cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### 빌드 명령어

```bash
npm run build        # Vite 빌드 + Electron 패킹
npm run pack         # 디렉토리만 (설치 불가)
npm run dist         # 완전한 배포판 생성
```

---

## 🔧 개발 모드

### npm run dev

```bash
npm run dev
# 실행되는 명령어:
# concurrently "vite" "wait-on http://localhost:5173 && electron ."
```

**동작**:
1. Vite 개발 서버 시작 (포트 5173)
2. Electron 프로세스 시작 (Vite가 준비될 때까지 대기)
3. Hot Reload 자동 적용

### Hot Reload 설정

```js
// main.js (개발 모드)
if (isDev) {
  const viteUrl = 'http://localhost:5173';
  mainWindow.loadURL(viteUrl);
  mainWindow.webContents.openDevTools();
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

---

## ⚠️ 주의사항

| 사항 | 설명 |
|:---|:---|
| ❌ require('electron') in renderer | preload.js 사용 필수 |
| ❌ Remote 모듈 | enableRemoteModule: false |
| ❌ eval() 사용 | CSP 위반 |
| ❌ 파일 경로 | `path.join(__dirname, '...')` 사용 |
| ❌ 동기 IPC | `invoke` (비동기) 사용 |

---

## 📊 성능 최적화

### 메모리 관리

```js
// ✅ 윈도우 참조 정리
window.on('closed', () => {
  window = null;
});

// ❌ 메모리 누수
window = new BrowserWindow();  // 닫혀도 참조 유지
```

### 시작 시간 단축

```js
// Lazy loading
let agentAPI;
ipcMain.handle('agent:init', () => {
  if (!agentAPI) {
    agentAPI = require('./agentAPI');
  }
  return agentAPI.init();
});
```

---

## 📞 참조

- **Electron 공식 문서**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **부모 Claude.md**: `../claude.md`

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
