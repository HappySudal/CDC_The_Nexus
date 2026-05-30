/**
 * Electron IPC Channels Definition
 *
 * Project Nexus Phase 2: Real-time data synchronization, task management, system monitoring
 *
 * IPC Channel Categories:
 * - Constitution Management (읽기/쓰기/실시간 감시)
 * - Search & Filtering (전문 검색 기능)
 * - Agent Monitoring (에이전트 상태 모니터링)
 * - Task Management (작업 생성/할당/추적)
 * - System Monitoring (Ollama, Morning, TwinBrain, Nexus 상태)
 * - Real-time Updates (WebSocket 유사 푸시)
 * - Settings & Configuration (앱 설정)
 */

export const IpcChannels = {
  // =====================================================
  // 1. CONSTITUTION MANAGEMENT
  // =====================================================
  CONSTITUTION: {
    // Renderer → Main: 헌법 파일 로드 요청
    GET_CONSTITUTION: 'constitution:get',
    // Main → Renderer: 헌법 로드 완료
    CONSTITUTION_LOADED: 'constitution:loaded',
    // Renderer → Main: 헌법 파일 업데이트
    UPDATE_CONSTITUTION: 'constitution:update',
    // Main → Renderer: 헌법이 외부에서 변경됨 (파일 감시)
    CONSTITUTION_CHANGED: 'constitution:changed',
    // Renderer → Main: 특정 섹션 검색
    SEARCH_CONSTITUTION: 'constitution:search',
  },

  // =====================================================
  // 2. SEARCH & FILTERING
  // =====================================================
  SEARCH: {
    // Renderer → Main: 문서 검색 (전사 검색)
    SEARCH_DOCUMENTS: 'search:documents',
    // Main → Renderer: 검색 결과 반환
    SEARCH_RESULTS: 'search:results',
    // Renderer → Main: 필터 적용
    APPLY_FILTERS: 'search:apply-filters',
    // Main → Renderer: 필터된 결과
    FILTERED_RESULTS: 'search:filtered-results',
    // Renderer → Main: 검색 인덱스 업데이트
    REBUILD_INDEX: 'search:rebuild-index',
  },

  // =====================================================
  // 3. AGENT MONITORING & MANAGEMENT
  // =====================================================
  AGENT: {
    // Main → Renderer: 에이전트 상태 업데이트 (실시간)
    AGENT_STATUS_UPDATED: 'agent:status-updated',
    // Renderer → Main: 에이전트 목록 요청
    GET_AGENTS: 'agent:get-list',
    // Main → Renderer: 에이전트 상세 정보
    AGENT_DETAILS: 'agent:details',
    // Renderer → Main: 에이전트에 명령 전송
    EXECUTE_COMMAND: 'agent:execute-command',
    // Main → Renderer: 명령 실행 결과
    COMMAND_RESULT: 'agent:command-result',
    // Renderer → Main: 에이전트 성능 메트릭 요청
    GET_METRICS: 'agent:get-metrics',
    // Main → Renderer: 에이전트 성능 메트릭 (주기적)
    METRICS_UPDATE: 'agent:metrics-update',
  },

  // =====================================================
  // 4. TASK MANAGEMENT & CONTROL
  // =====================================================
  TASK: {
    // Renderer → Main: 새 작업 생성
    CREATE_TASK: 'task:create',
    // Main → Renderer: 작업 생성 결과
    TASK_CREATED: 'task:created',
    // Renderer → Main: 작업 목록 조회
    GET_TASKS: 'task:get-list',
    // Main → Renderer: 작업 목록 반환
    TASKS_LIST: 'task:list',
    // Renderer → Main: 작업 상태 업데이트
    UPDATE_TASK_STATUS: 'task:update-status',
    // Main → Renderer: 작업 상태 변경됨
    TASK_STATUS_CHANGED: 'task:status-changed',
    // Renderer → Main: 작업 할당
    ASSIGN_TASK: 'task:assign',
    // Main → Renderer: 작업 할당 완료
    TASK_ASSIGNED: 'task:assigned',
    // Renderer → Main: 작업 취소
    CANCEL_TASK: 'task:cancel',
    // Renderer → Main: 작업 상세 정보
    GET_TASK_DETAILS: 'task:get-details',
    // Main → Renderer: 작업 상세 정보 반환
    TASK_DETAILS: 'task:details',
    // Renderer → Main: 작업 진행률 추적
    GET_PROGRESS: 'task:get-progress',
    // Main → Renderer: 작업 진행률 업데이트
    PROGRESS_UPDATE: 'task:progress-update',
  },

  // =====================================================
  // 5. SYSTEM MONITORING (4가지 핵심 시스템)
  // =====================================================
  SYSTEM: {
    // OLLAMA
    OLLAMA_STATUS: 'system:ollama-status',
    OLLAMA_METRICS: 'system:ollama-metrics',
    OLLAMA_MODELS: 'system:ollama-models',

    // MORNING PROTOCOL
    MORNING_STATUS: 'system:morning-status',
    MORNING_METRICS: 'system:morning-metrics',
    MORNING_PROTOCOL_TRIGGER: 'system:morning-trigger',

    // TWINBRAIN
    TWINBRAIN_STATUS: 'system:twinbrain-status',
    TWINBRAIN_SYNC_STATUS: 'system:twinbrain-sync',
    TWINBRAIN_VAULT_INFO: 'system:twinbrain-vault',
    TWINBRAIN_RAW_INFO: 'system:twinbrain-raw',

    // NEXUS APP
    NEXUS_STATUS: 'system:nexus-status',
    NEXUS_METRICS: 'system:nexus-metrics',
    NEXUS_WINDOW_INFO: 'system:nexus-window-info',

    // UNIFIED SYSTEM METRICS
    GET_SYSTEM_METRICS: 'system:get-all-metrics',
    SYSTEM_METRICS_UPDATED: 'system:metrics-updated',
    SYSTEM_HEALTH_REPORT: 'system:health-report',
  },

  // =====================================================
  // 6. REAL-TIME UPDATES (이벤트 기반 푸시)
  // =====================================================
  REALTIME: {
    // Main → Renderer: 시스템 메트릭 (5초마다)
    METRICS_PUSH: 'realtime:metrics',
    // Main → Renderer: 활동 로그 (즉시)
    ACTIVITY_LOG: 'realtime:activity-log',
    // Main → Renderer: 알림 (즉시)
    ALERT: 'realtime:alert',
    // Main → Renderer: 경고 (즉시)
    WARNING: 'realtime:warning',
    // Main → Renderer: 에러 (즉시)
    ERROR: 'realtime:error',
    // Main → Renderer: 성공 알림 (즉시)
    SUCCESS: 'realtime:success',
    // Renderer → Main: 실시간 업데이트 구독
    SUBSCRIBE: 'realtime:subscribe',
    // Renderer → Main: 실시간 업데이트 구독 해제
    UNSUBSCRIBE: 'realtime:unsubscribe',
  },

  // =====================================================
  // 7. FILE OPERATIONS
  // =====================================================
  FILE: {
    // Renderer → Main: 파일 저장 (주로 Constitution 업데이트)
    SAVE_FILE: 'file:save',
    // Main → Renderer: 파일 저장 완료
    FILE_SAVED: 'file:saved',
    // Renderer → Main: 파일 읽기
    READ_FILE: 'file:read',
    // Main → Renderer: 파일 내용 반환
    FILE_CONTENT: 'file:content',
    // Renderer → Main: 폴더 읽기 (파일 리스트)
    READ_DIRECTORY: 'file:read-directory',
    // Main → Renderer: 폴더 내용 반환
    DIRECTORY_CONTENT: 'file:directory-content',
    // Main → Renderer: 파일 감시 (변경 감지)
    FILE_WATCH: 'file:watch',
  },

  // =====================================================
  // 8. SETTINGS & CONFIGURATION
  // =====================================================
  SETTINGS: {
    // Renderer → Main: 설정 저장
    SAVE_SETTINGS: 'settings:save',
    // Renderer → Main: 설정 로드
    GET_SETTINGS: 'settings:get',
    // Main → Renderer: 설정 반환
    SETTINGS_DATA: 'settings:data',
    // Main → Renderer: 설정 변경됨
    SETTINGS_CHANGED: 'settings:changed',
    // 설정 카테고리
    GENERAL: 'settings:general',
    APPEARANCE: 'settings:appearance',
    NOTIFICATIONS: 'settings:notifications',
    PERFORMANCE: 'settings:performance',
    SECURITY: 'settings:security',
    INTEGRATIONS: 'settings:integrations',
  },

  // =====================================================
  // 9. REPORTING & EXPORT
  // =====================================================
  REPORT: {
    // Renderer → Main: 리포트 생성 요청
    GENERATE_REPORT: 'report:generate',
    // Main → Renderer: 리포트 생성 완료
    REPORT_READY: 'report:ready',
    // Renderer → Main: 리포트 내보내기
    EXPORT_REPORT: 'report:export',
    // Renderer → Main: 일일 리포트 생성
    GENERATE_DAILY_REPORT: 'report:generate-daily',
    // Renderer → Main: 성능 리포트
    GENERATE_PERFORMANCE_REPORT: 'report:generate-performance',
  },

  // =====================================================
  // 10. SYSTEM ADMINISTRATION
  // =====================================================
  ADMIN: {
    // Renderer → Main: 시스템 감시 시작
    START_MONITORING: 'admin:start-monitoring',
    // Renderer → Main: 시스템 감시 중지
    STOP_MONITORING: 'admin:stop-monitoring',
    // Renderer → Main: 자동 복구 트리거
    TRIGGER_RECOVERY: 'admin:trigger-recovery',
    // Renderer → Main: 자동 백업 트리거
    TRIGGER_BACKUP: 'admin:trigger-backup',
    // Renderer → Main: 자동 동기화 트리거
    TRIGGER_SYNC: 'admin:trigger-sync',
    // Renderer → Main: 성능 최적화 실행
    OPTIMIZE_PERFORMANCE: 'admin:optimize-performance',
  },

  // =====================================================
  // 11. APOSTLE ROUTING (Phase D3 — 의장-Nexus Live IPC)
  // =====================================================
  // 13사도(+의장) 라우팅. 토큰 게이트(ApprovalGate)를 통한 인가 후 명령 위임.
  // 사도 ID: sudal, lando, anti, seogi, taesoon, marco, leo, guardian,
  //         amadeus, openclaude, gemini, grok, perplexity, ollama (목록은 운영 시 확장)
  APOSTLE: {
    // Renderer → Main: 사도 명단 조회
    GET_ROSTER: 'apostle:get-roster',
    // Main → Renderer: 사도 명단 응답
    ROSTER: 'apostle:roster',
    // Renderer → Main: 개별 사도 상태 조회
    GET_STATUS: 'apostle:get-status',
    // Main → Renderer: 사도 상태 응답 (실시간 푸시 가능)
    STATUS_UPDATED: 'apostle:status-updated',
    // Renderer → Main: 사도 명령 위임 (토큰 필수)
    EXECUTE: 'apostle:execute',
    // Main → Renderer: 명령 결과
    RESULT: 'apostle:result',
    // Main → Renderer: 명령 진행 스트리밍 (chunk 단위)
    STREAM_CHUNK: 'apostle:stream-chunk',
    // Renderer → Main: 사도 메트릭 조회
    GET_METRICS: 'apostle:get-metrics',
    // Main → Renderer: 메트릭 응답
    METRICS: 'apostle:metrics',
    // Renderer → Main: 사도 위임 접근 요청 (토큰 발급 게이트)
    REQUEST_TOKEN: 'apostle:request-token',
    // Renderer → Main: 의장 명시 승인 (대기 중 requestId)
    APPROVE_TOKEN: 'apostle:approve-token',
    // Renderer → Main: 토큰 폐기
    REVOKE_TOKEN: 'apostle:revoke-token',
    // Main → Renderer: 사도 측 에러
    ERROR: 'apostle:error',
  }
};

/**
 * IPC Response Formats
 */
export const ResponseFormats = {
  SUCCESS: (data) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  ERROR: (error, code = 'UNKNOWN_ERROR') => ({
    success: false,
    error: error instanceof Error ? error.message : error,
    code,
    timestamp: new Date().toISOString(),
  }),

  METRICS: (metrics) => ({
    type: 'metrics',
    ollama: metrics.ollama || {},
    morning: metrics.morning || {},
    twinbrain: metrics.twinbrain || {},
    nexus: metrics.nexus || {},
    timestamp: new Date().toISOString(),
  }),

  ALERT: (level, title, message) => ({
    type: 'alert',
    level, // 'info', 'warning', 'critical'
    title,
    message,
    timestamp: new Date().toISOString(),
  }),

  TASK: (task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    assignee: task.assignee,
    priority: task.priority,
    progress: task.progress || 0,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt || new Date().toISOString(),
  }),

  AGENT: (agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    activeTasksCount: agent.activeTasksCount || 0,
    responseTime: agent.responseTime || 0,
    uptime: agent.uptime || 100,
    lastActivity: agent.lastActivity,
  }),
};

/**
 * Event Queue Management (for batching real-time updates)
 */
export class IpcEventBatcher {
  constructor(maxBatchSize = 10, maxWaitTime = 1000) {
    this.queue = [];
    this.maxBatchSize = maxBatchSize;
    this.maxWaitTime = maxWaitTime;
    this.timeout = null;
  }

  add(event) {
    this.queue.push(event);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }

  flush() {
    if (this.queue.length === 0) return;

    const batch = {
      type: 'batch',
      events: this.queue,
      count: this.queue.length,
      timestamp: new Date().toISOString(),
    };

    this.queue = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    return batch;
  }
}

/**
 * Request/Response Handler with Timeouts
 */
export class IpcHandler {
  constructor(ipcMain, timeout = 5000) {
    this.ipcMain = ipcMain;
    this.timeout = timeout;
    this.handlers = {};
  }

  handle(channel, handler) {
    this.ipcMain.handle(channel, async (event, args) => {
      try {
        const promise = Promise.resolve(handler(event, args));
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`IPC timeout on ${channel}`)), this.timeout)
        );

        const result = await Promise.race([promise, timeoutPromise]);
        return ResponseFormats.SUCCESS(result);
      } catch (error) {
        console.error(`IPC handler error on ${channel}:`, error);
        return ResponseFormats.ERROR(error);
      }
    });
  }

  on(channel, handler) {
    this.ipcMain.on(channel, (event, args) => {
      try {
        handler(event, args);
      } catch (error) {
        console.error(`IPC on error on ${channel}:`, error);
      }
    });
  }
}


// "시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."
// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." 🫡

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
