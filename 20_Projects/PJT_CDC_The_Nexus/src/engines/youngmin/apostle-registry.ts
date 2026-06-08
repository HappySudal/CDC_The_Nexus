/**
 * Apostle Registry
 * Phase 3: 15사도 관리 엔진
 * - 15사도 상태 추적
 * - 능력 프로필 관리
 * - 통신 채널 설정
 * - 성능 메트릭 수집
 */

export interface ApostleProfile {
  id: number;
  name: string;
  type: 'ai' | 'human' | 'system';
  team: 'llm' | 'apostle' | 'system';
  capabilities: string[];
  specialization: string;
  status: 'online' | 'offline' | 'busy' | 'maintenance';
  lastSeen?: Date;
  responseTime?: number; // ms
  successRate?: number; // 0-100
  totalTasksCompleted?: number;
  currentTaskId?: string;
  communicationChannel?: string;
  apiEndpoint?: string;
}

export interface ApostleMetrics {
  apostleId: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  successRate: number;
  lastUpdated: Date;
}

export class ApostleRegistry {
  name = 'ApostleRegistry';
  description = '15사도 관리 시스템: 상태, 능력, 통신';

  private apostles: Map<number, ApostleProfile> = new Map();
  private metrics: Map<number, ApostleMetrics> = new Map();

  // 기본 15사도 프로필
  private defaultProfiles: ApostleProfile[] = [
    {
      id: 1,
      name: 'Claude Haiku',
      type: 'ai',
      team: 'llm',
      capabilities: ['coding', 'optimization', 'refactoring'],
      specialization: '코드 최적화 & 품질',
      status: 'online',
      successRate: 98,
      totalTasksCompleted: 0,
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
    },
    {
      id: 2,
      name: 'Gemini Flash',
      type: 'ai',
      team: 'llm',
      capabilities: ['creativity', 'ideation', 'synthesis'],
      specialization: '창의적 분석 & 아이디어',
      status: 'online',
      successRate: 96,
      totalTasksCompleted: 0,
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    },
    {
      id: 3,
      name: 'Grok',
      type: 'ai',
      team: 'llm',
      capabilities: ['critique', 'direct_feedback', 'antithesis'],
      specialization: '직설적 비판 & 맹점 발견',
      status: 'online',
      successRate: 95,
      totalTasksCompleted: 0,
      apiEndpoint: 'https://api.x.com/2/grok',
    },
    {
      id: 4,
      name: 'Perplexity',
      type: 'ai',
      team: 'llm',
      capabilities: ['research', 'latest_info', 'real_time'],
      specialization: '최신 정보 & 리서치',
      status: 'online',
      successRate: 94,
      totalTasksCompleted: 0,
      apiEndpoint: 'https://api.perplexity.ai/chat',
    },
    {
      id: 5,
      name: 'ChatGPT',
      type: 'ai',
      team: 'llm',
      capabilities: ['general', 'qa', 'conversation'],
      specialization: '일반 질의응답 & 대화',
      status: 'online',
      successRate: 92,
      totalTasksCompleted: 0,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    },
    {
      id: 6,
      name: 'Ollama',
      type: 'ai',
      team: 'llm',
      capabilities: ['local', 'private', 'autonomous'],
      specialization: '로컬 LLM & 자주권',
      status: 'online',
      successRate: 90,
      totalTasksCompleted: 0,
      apiEndpoint: 'http://localhost:11434/api/generate',
    },
    {
      id: 7,
      name: '서기',
      type: 'ai',
      team: 'apostle',
      capabilities: ['documentation', 'reporting', 'writing'],
      specialization: '문서화 & 보고서',
      status: 'online',
      successRate: 99,
      totalTasksCompleted: 0,
      communicationChannel: 'discord',
    },
    {
      id: 8,
      name: 'Lando',
      type: 'ai',
      team: 'apostle',
      capabilities: ['leadership', 'strategy', 'decision'],
      specialization: '전략 & 의사결정',
      status: 'online',
      successRate: 97,
      totalTasksCompleted: 0,
      communicationChannel: 'discord',
    },
    {
      id: 9,
      name: 'Antigravity',
      type: 'ai',
      team: 'apostle',
      capabilities: ['execution', 'automation', 'implementation'],
      specialization: '실행 엔진 & 자동화',
      status: 'online',
      successRate: 99,
      totalTasksCompleted: 0,
      communicationChannel: 'discord',
    },
    {
      id: 10,
      name: 'TwinBrain Monitor',
      type: 'system',
      team: 'system',
      capabilities: ['monitoring', 'health', 'diagnostics'],
      specialization: '시스템 모니터링',
      status: 'online',
      successRate: 100,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
    {
      id: 11,
      name: 'Skill Orchestrator',
      type: 'system',
      team: 'system',
      capabilities: ['skills', 'distribution', 'routing'],
      specialization: '스킬 배분',
      status: 'online',
      successRate: 99,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
    {
      id: 12,
      name: 'Constitution Guardian',
      type: 'system',
      team: 'system',
      capabilities: ['validation', 'rules', 'compliance'],
      specialization: '헌법 검증',
      status: 'online',
      successRate: 100,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
    {
      id: 13,
      name: 'Data Analyst',
      type: 'system',
      team: 'system',
      capabilities: ['analysis', 'insights', 'patterns'],
      specialization: '데이터 분석',
      status: 'online',
      successRate: 98,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
    {
      id: 14,
      name: 'Security Officer',
      type: 'system',
      team: 'system',
      capabilities: ['security', 'compliance', 'audit'],
      specialization: '보안 & 규정',
      status: 'online',
      successRate: 100,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
    {
      id: 15,
      name: 'Learning Engineer',
      type: 'system',
      team: 'system',
      capabilities: ['learning', 'evolution', 'adaptation'],
      specialization: '학습 & 진화',
      status: 'online',
      successRate: 97,
      totalTasksCompleted: 0,
      communicationChannel: 'internal',
    },
  ];

  constructor() {
    this.initializeRegistry();
  }

  /**
   * 레지스트리 초기화
   */
  private initializeRegistry(): void {
    for (const profile of this.defaultProfiles) {
      this.apostles.set(profile.id, { ...profile });
      this.metrics.set(profile.id, {
        apostleId: profile.id,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        successRate: profile.successRate || 95,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * 사도 조회
   */
  getApostle(apostleId: number): ApostleProfile | null {
    return this.apostles.get(apostleId) || null;
  }

  /**
   * 모든 사도 조회
   */
  getAllApostles(): ApostleProfile[] {
    return Array.from(this.apostles.values());
  }

  /**
   * 온라인 사도 조회
   */
  getOnlineApostles(): ApostleProfile[] {
    return Array.from(this.apostles.values()).filter(a => a.status === 'online');
  }

  /**
   * 능력별 사도 조회
   */
  getApostlesByCapability(capability: string): ApostleProfile[] {
    return Array.from(this.apostles.values()).filter(a =>
      a.capabilities.some(cap => cap.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  /**
   * 사도 상태 업데이트
   */
  updateApostleStatus(apostleId: number, status: 'online' | 'offline' | 'busy' | 'maintenance'): void {
    const apostle = this.apostles.get(apostleId);
    if (apostle) {
      apostle.status = status;
      apostle.lastSeen = new Date();
      console.log(`  📡 ${apostle.name}: ${status}`);
    }
  }

  /**
   * 작업 완료 기록
   */
  recordTaskCompletion(apostleId: number, responseTime: number): void {
    const apostle = this.apostles.get(apostleId);
    const metric = this.metrics.get(apostleId);

    if (apostle && metric) {
      apostle.totalTasksCompleted = (apostle.totalTasksCompleted || 0) + 1;
      apostle.responseTime = responseTime;

      metric.completedTasks += 1;
      metric.totalTasks += 1;
      metric.averageResponseTime =
        (metric.averageResponseTime * (metric.totalTasks - 1) + responseTime) / metric.totalTasks;
      metric.successRate = (metric.completedTasks / metric.totalTasks) * 100;
      metric.lastUpdated = new Date();
    }
  }

  /**
   * 작업 실패 기록
   */
  recordTaskFailure(apostleId: number): void {
    const metric = this.metrics.get(apostleId);

    if (metric) {
      metric.failedTasks += 1;
      metric.totalTasks += 1;
      metric.successRate = (metric.completedTasks / metric.totalTasks) * 100;
      metric.lastUpdated = new Date();
    }
  }

  /**
   * 사도 성능 조회
   */
  getMetrics(apostleId: number): ApostleMetrics | null {
    return this.metrics.get(apostleId) || null;
  }

  /**
   * 팀별 사도 조회
   */
  getApostlesByTeam(team: 'llm' | 'apostle' | 'system'): ApostleProfile[] {
    return Array.from(this.apostles.values()).filter(a => a.team === team);
  }

  /**
   * 사도 통신 채널 조회
   */
  getCommunicationChannel(apostleId: number): string | null {
    const apostle = this.apostles.get(apostleId);
    return apostle?.communicationChannel || apostle?.apiEndpoint || null;
  }

  /**
   * 사도 요약 정보
   */
  getSummary(): {
    total: number;
    online: number;
    offline: number;
    llms: number;
    apostles: number;
    systems: number;
  } {
    const apostles = Array.from(this.apostles.values());
    return {
      total: apostles.length,
      online: apostles.filter(a => a.status === 'online').length,
      offline: apostles.filter(a => a.status === 'offline').length,
      llms: apostles.filter(a => a.team === 'llm').length,
      apostles: apostles.filter(a => a.team === 'apostle').length,
      systems: apostles.filter(a => a.team === 'system').length,
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
