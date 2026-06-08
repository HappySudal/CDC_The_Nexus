/**
 * LLM Router
 * Phase 3: 6개 LLM 라우팅 엔진
 * - 작업 유형별 최적 LLM 선택
 * - 로드 밸런싱
 * - 응답 시간 모니터링
 * - 피드백 통합
 */

export interface LLMRequest {
  id: string;
  prompt: string;
  workType: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  requestId: string;
  llmName: string;
  response: string;
  tokensUsed?: number;
  responseTime: number;
  confidence?: number;
  feedback?: {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    reasoning?: string;
  };
}

export interface LLMProfile {
  name: string;
  type: 'cloud' | 'local';
  specialization: string;
  workTypeAffinities: { [key: string]: number }; // 0-100
  averageResponseTime: number;
  successRate: number;
  costPerRequest?: number;
  requestsProcessed: number;
  currentLoad: number;
  status: 'available' | 'unavailable' | 'degraded';
  rateLimit?: number; // requests per minute
}

export class LLMRouter {
  name = 'LLMRouter';
  description = '6개 LLM 라우팅: 최적 선택 & 로드 밸런싱';

  private llmProfiles: Map<string, LLMProfile> = new Map();
  private requestQueue: LLMRequest[] = [];
  private responseHistory: LLMResponse[] = [];
  private routingRules: Map<string, string[]> = new Map(); // workType -> preferred LLMs

  constructor() {
    this.initializeLLMProfiles();
    this.initializeRoutingRules();
  }

  /**
   * LLM 프로필 초기화
   */
  private initializeLLMProfiles(): void {
    const profiles: LLMProfile[] = [
      {
        name: 'Claude Haiku',
        type: 'cloud',
        specialization: '코드 최적화 & 품질',
        workTypeAffinities: {
          coding: 98,
          security: 85,
          analysis: 75,
          documentation: 80,
          general: 70,
        },
        averageResponseTime: 800,
        successRate: 98,
        costPerRequest: 0.001,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 300,
      },
      {
        name: 'Gemini Flash',
        type: 'cloud',
        specialization: '창의성 & 다양성',
        workTypeAffinities: {
          creativity: 95,
          analysis: 88,
          synthesis: 90,
          ideation: 92,
          general: 85,
        },
        averageResponseTime: 600,
        successRate: 96,
        costPerRequest: 0.0005,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 500,
      },
      {
        name: 'Grok',
        type: 'cloud',
        specialization: '직설적 비판',
        workTypeAffinities: {
          critique: 99,
          antithesis: 95,
          analysis: 90,
          validation: 92,
          general: 75,
        },
        averageResponseTime: 900,
        successRate: 95,
        costPerRequest: 0.001,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 250,
      },
      {
        name: 'Perplexity',
        type: 'cloud',
        specialization: '최신 정보 & 리서치',
        workTypeAffinities: {
          research: 98,
          current_info: 99,
          analysis: 85,
          documentation: 80,
          general: 88,
        },
        averageResponseTime: 1500,
        successRate: 94,
        costPerRequest: 0.002,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 100,
      },
      {
        name: 'ChatGPT',
        type: 'cloud',
        specialization: '일반 질의응답',
        workTypeAffinities: {
          general: 95,
          qa: 92,
          conversation: 90,
          writing: 88,
          analysis: 82,
        },
        averageResponseTime: 1000,
        successRate: 92,
        costPerRequest: 0.0015,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 400,
      },
      {
        name: 'Ollama',
        type: 'local',
        specialization: '로컬 LLM & 자주권',
        workTypeAffinities: {
          local: 100,
          private: 100,
          autonomous: 95,
          coding: 85,
          analysis: 80,
        },
        averageResponseTime: 2000,
        successRate: 90,
        costPerRequest: 0,
        requestsProcessed: 0,
        currentLoad: 0,
        status: 'available',
        rateLimit: 50,
      },
    ];

    for (const profile of profiles) {
      this.llmProfiles.set(profile.name, profile);
    }
  }

  /**
   * 라우팅 규칙 초기화
   */
  private initializeRoutingRules(): void {
    this.routingRules.set('coding', ['Claude Haiku', 'Ollama', 'ChatGPT']);
    this.routingRules.set('creativity', ['Gemini Flash', 'ChatGPT', 'Perplexity']);
    this.routingRules.set('critique', ['Grok', 'Gemini Flash', 'Claude Haiku']);
    this.routingRules.set('research', ['Perplexity', 'Gemini Flash', 'ChatGPT']);
    this.routingRules.set('analysis', ['Gemini Flash', 'Grok', 'ChatGPT']);
    this.routingRules.set('general', ['ChatGPT', 'Gemini Flash', 'Claude Haiku']);
  }

  /**
   * 최적 LLM 선택
   */
  selectBestLLM(workType: string, priority: 'P0' | 'P1' | 'P2' | 'P3'): LLMProfile | null {
    const preferredLLMs = this.routingRules.get(workType) || this.routingRules.get('general') || [];

    let bestLLM: LLMProfile | null = null;
    let bestScore = -1;

    for (const llmName of preferredLLMs) {
      const profile = this.llmProfiles.get(llmName);
      if (!profile || profile.status === 'unavailable') {
        continue;
      }

      // 스코어 계산: 선호도 + 부하 + 응답 시간
      const affinity = profile.workTypeAffinities[workType] || 50;
      const loadPenalty = profile.currentLoad * 5;
      const responsePenalty = profile.averageResponseTime / 1000;
      const priorityBoost = priority === 'P0' ? 20 : priority === 'P1' ? 10 : 0;

      const score = affinity - loadPenalty - responsePenalty + priorityBoost;

      if (score > bestScore) {
        bestScore = score;
        bestLLM = profile;
      }
    }

    return bestLLM;
  }

  /**
   * LLM에 요청 전송
   */
  async sendRequest(request: LLMRequest, llmProfile: LLMProfile): Promise<LLMResponse> {
    try {
      console.log(`  📤 ${llmProfile.name}에 요청 전송: ${request.workType}`);

      // 부하 증가
      llmProfile.currentLoad += 1;

      // 시뮬레이션: 실제로는 API 호출
      const startTime = Date.now();
      await new Promise(resolve =>
        setTimeout(resolve, Math.random() * (llmProfile.averageResponseTime - 200) + 200)
      );
      const responseTime = Date.now() - startTime;

      // 응답 생성
      const response: LLMResponse = {
        requestId: request.id,
        llmName: llmProfile.name,
        response: `${llmProfile.name}의 응답: ${request.prompt.substring(0, 50)}...`,
        responseTime,
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
      };

      // 응답 기록
      this.responseHistory.push(response);

      // 프로필 업데이트
      llmProfile.requestsProcessed += 1;
      llmProfile.averageResponseTime =
        (llmProfile.averageResponseTime * (llmProfile.requestsProcessed - 1) + responseTime) /
        llmProfile.requestsProcessed;

      // 부하 감소
      llmProfile.currentLoad = Math.max(0, llmProfile.currentLoad - 1);

      console.log(`    ✅ 응답 수신 (${responseTime}ms)`);

      return response;
    } catch (err) {
      // 부하 감소
      llmProfile.currentLoad = Math.max(0, llmProfile.currentLoad - 1);
      throw err;
    }
  }

  /**
   * 응답 피드백 수집
   */
  recordFeedback(
    requestId: string,
    quality: 'excellent' | 'good' | 'fair' | 'poor',
    reasoning?: string
  ): void {
    const response = this.responseHistory.find(r => r.requestId === requestId);
    if (response) {
      response.feedback = { quality, reasoning };

      // LLM 성공률 업데이트
      const profile = this.llmProfiles.get(response.llmName);
      if (profile) {
        const qualityScore = { excellent: 1, good: 0.8, fair: 0.5, poor: 0 };
        const newSuccessRate =
          (profile.successRate * (profile.requestsProcessed - 1) + qualityScore[quality] * 100) /
          profile.requestsProcessed;
        profile.successRate = newSuccessRate;
      }

      console.log(`  📊 피드백 기록: ${response.llmName} → ${quality}`);
    }
  }

  /**
   * LLM 상태 업데이트
   */
  updateLLMStatus(llmName: string, status: 'available' | 'unavailable' | 'degraded'): void {
    const profile = this.llmProfiles.get(llmName);
    if (profile) {
      profile.status = status;
      console.log(`  🔴 ${llmName}: ${status}`);
    }
  }

  /**
   * LLM 통계
   */
  getStatistics(): {
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    costEstimate: number;
  } {
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalCost = 0;
    let successCount = 0;

    for (const profile of this.llmProfiles.values()) {
      totalRequests += profile.requestsProcessed;
      totalResponseTime += profile.averageResponseTime * profile.requestsProcessed;
      totalCost += (profile.costPerRequest || 0) * profile.requestsProcessed;
    }

    for (const response of this.responseHistory) {
      if (response.feedback?.quality !== 'poor') {
        successCount += 1;
      }
    }

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      successRate: this.responseHistory.length > 0 ? (successCount / this.responseHistory.length) * 100 : 0,
      costEstimate: totalCost,
    };
  }

  /**
   * 모든 LLM 상태 조회
   */
  getAllLLMProfiles(): LLMProfile[] {
    return Array.from(this.llmProfiles.values());
  }

  /**
   * 특정 LLM 상태 조회
   */
  getLLMProfile(llmName: string): LLMProfile | null {
    return this.llmProfiles.get(llmName) || null;
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
