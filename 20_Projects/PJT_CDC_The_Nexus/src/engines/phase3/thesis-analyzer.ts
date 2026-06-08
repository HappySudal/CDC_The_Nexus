/**
 * Thesis Analyzer
 * Phase 3-2: Thesis 심화 분석
 * - 의장님 말투 분석
 * - 의도 심층 파악
 * - 암묵적 가정 추출
 * - 맥락 기반 해석
 */

export interface AnalyzedThesis {
  originalText: string;
  surface: string; // 표면적 의미
  latent: string; // 잠재적 의도
  assumptions: string[]; // 암묵적 가정
  emotionalTone: 'urgent' | 'thoughtful' | 'curious' | 'directive' | 'neutral';
  confidence: number;
  relatedTopics: string[];
  implications: string[];
  requiredResponse: 'action' | 'insight' | 'clarification' | 'validation';
}

export class ThesisAnalyzer {
  name = 'ThesisAnalyzer';
  description = 'Thesis 심화 분석: 표면+잠재 의도, 가정, 맥락';

  private conversationHistory: string[] = [];
  private thesisDatabase: Map<string, AnalyzedThesis> = new Map();

  /**
   * Thesis 심화 분석
   */
  analyze(userMessage: string, previousContext?: string[]): AnalyzedThesis {
    const analysisId = `analysis-${Date.now()}`;

    // 1. 표면적 의미 추출
    const surface = this.extractSurface(userMessage);
    console.log(`  📍 표면: "${surface}"`);

    // 2. 잠재적 의도 파악
    const latent = this.extractLatentIntent(userMessage);
    console.log(`  💭 잠재 의도: "${latent}"`);

    // 3. 암묵적 가정 추출
    const assumptions = this.extractAssumptions(userMessage, previousContext);
    console.log(`  🎯 가정: ${assumptions.join(', ')}`);

    // 4. 감정적 톤 분석
    const emotionalTone = this.analyzeEmotionalTone(userMessage);
    console.log(`  ❤️  톤: ${emotionalTone}`);

    // 5. 관련 토픽 추출
    const relatedTopics = this.extractRelatedTopics(userMessage);
    console.log(`  🏷️  토픽: ${relatedTopics.join(', ')}`);

    // 6. 함의 도출
    const implications = this.deriveImplications(surface, latent, assumptions);
    console.log(`  💡 함의: ${implications.slice(0, 2).join(', ')}`);

    // 7. 필요한 응답 유형
    const requiredResponse = this.determineRequiredResponse(surface, emotionalTone);
    console.log(`  📤 응답: ${requiredResponse}`);

    const analyzed: AnalyzedThesis = {
      originalText: userMessage,
      surface,
      latent,
      assumptions,
      emotionalTone,
      confidence: 0.85,
      relatedTopics,
      implications,
      requiredResponse,
    };

    this.thesisDatabase.set(analysisId, analyzed);
    this.conversationHistory.push(userMessage);

    return analyzed;
  }

  /**
   * 표면적 의미 추출
   */
  private extractSurface(message: string): string {
    // 문장의 주요 명사/동사 추출
    const mainClauses = message.split('하고|하면|하지만');
    return mainClauses[0].trim();
  }

  /**
   * 잠재적 의도 파악
   */
  private extractLatentIntent(message: string): string {
    // 표현 방식에서 숨은 의도 파악
    const intentPatterns: { [key: string]: string } = {
      '시간이 없어': '신속한 처리 필요',
      '어떻게 생각해': '의견 수렴',
      '해보자': '실험적 시도 제안',
      '왜 이렇게': '근본 원인 추구',
      '다시 한번': '정확성 강조',
    };

    for (const [pattern, intent] of Object.entries(intentPatterns)) {
      if (message.includes(pattern)) {
        return intent;
      }
    }

    // 기본 잠재 의도
    if (message.includes('?')) {
      return '정보 수집 또는 확인';
    } else if (message.includes('해줘') || message.includes('부탁')) {
      return '구체적 행동 요청';
    } else {
      return '관찰 또는 주장';
    }
  }

  /**
   * 암묵적 가정 추출
   */
  private extractAssumptions(message: string, context?: string[]): string[] {
    const assumptions: string[] = [];

    // 1. 시간 가정
    if (message.includes('지금') || message.includes('당장')) {
      assumptions.push('즉시 처리 필요');
    }

    // 2. 능력 가정
    if (message.includes('가능한') || message.includes('할 수 있는')) {
      assumptions.push('가능성에 대한 확신');
    }

    // 3. 가치 가정
    if (message.includes('중요') || message.includes('우선')) {
      assumptions.push('우선순위 인식');
    }

    // 4. 맥락 기반 가정
    if (context && context.length > 0) {
      const lastContext = context[context.length - 1];
      if (lastContext.includes('코드')) {
        assumptions.push('기술적 배경 공유');
      }
    }

    return assumptions.length > 0 ? assumptions : ['특정 가정 없음'];
  }

  /**
   * 감정적 톤 분석
   */
  private analyzeEmotionalTone(
    message: string
  ): 'urgent' | 'thoughtful' | 'curious' | 'directive' | 'neutral' {
    if (message.includes('!') || message.includes('긴급') || message.includes('즉시')) {
      return 'urgent';
    } else if (message.includes('?') || message.includes('어떻게')) {
      return 'curious';
    } else if (message.includes('해줘') || message.includes('해보자')) {
      return 'directive';
    } else if (message.includes('생각') || message.includes('아이디어')) {
      return 'thoughtful';
    } else {
      return 'neutral';
    }
  }

  /**
   * 관련 토픽 추출
   */
  private extractRelatedTopics(message: string): string[] {
    const topics: string[] = [];

    // 도메인별 키워드
    const domainPatterns: { [key: string]: string[] } = {
      '기술': ['코드', '개발', '구현', '버그', '최적화'],
      '보안': ['보안', '암호', '접근', '검증'],
      '데이터': ['분석', '데이터', '통계', '리포트'],
      '관리': ['계획', '일정', '우선순위', '관리'],
      '철학': ['생각', '원칙', '신념', '가치'],
    };

    for (const [domain, keywords] of Object.entries(domainPatterns)) {
      if (keywords.some(kw => message.includes(kw))) {
        topics.push(domain);
      }
    }

    return topics.length > 0 ? topics : ['일반'];
  }

  /**
   * 함의 도출
   */
  private deriveImplications(surface: string, latent: string, assumptions: string[]): string[] {
    const implications: string[] = [];

    // 표면 + 잠재 의도 결합
    implications.push(`구체적 작업: ${surface}`);
    implications.push(`숨은 목적: ${latent}`);

    // 가정 기반 함의
    if (assumptions.includes('즉시 처리 필요')) {
      implications.push('다른 작업 미연기 가능성');
    }

    return implications;
  }

  /**
   * 필요한 응답 유형 결정
   */
  private determineRequiredResponse(
    surface: string,
    tone: 'urgent' | 'thoughtful' | 'curious' | 'directive' | 'neutral'
  ): 'action' | 'insight' | 'clarification' | 'validation' {
    if (tone === 'directive') {
      return 'action';
    } else if (tone === 'curious') {
      return 'insight';
    } else if (tone === 'thoughtful') {
      return 'validation';
    } else {
      return 'action';
    }
  }

  /**
   * 분석 히스토리 조회
   */
  getAnalysisHistory(): AnalyzedThesis[] {
    return Array.from(this.thesisDatabase.values());
  }

  /**
   * 패턴 분석 (여러 대화에서의 공통점)
   */
  analyzePatterns(): {
    frequentTones: string[];
    commonAssumptions: string[];
    preferredResponseTypes: string[];
  } {
    const allAnalyses = Array.from(this.thesisDatabase.values());

    const toneFreq = new Map<string, number>();
    const assumptionFreq = new Map<string, number>();
    const responseFreq = new Map<string, number>();

    for (const analysis of allAnalyses) {
      // 톤 카운트
      toneFreq.set(analysis.emotionalTone, (toneFreq.get(analysis.emotionalTone) || 0) + 1);

      // 가정 카운트
      for (const assumption of analysis.assumptions) {
        assumptionFreq.set(assumption, (assumptionFreq.get(assumption) || 0) + 1);
      }

      // 응답 유형 카운트
      responseFreq.set(analysis.requiredResponse, (responseFreq.get(analysis.requiredResponse) || 0) + 1);
    }

    const frequentTones = Array.from(toneFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tone]) => tone);

    const commonAssumptions = Array.from(assumptionFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([assumption]) => assumption);

    const preferredResponseTypes = Array.from(responseFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    return {
      frequentTones,
      commonAssumptions,
      preferredResponseTypes,
    };
  }

  /**
   * 명확화 필요 여부 판단
   */
  needsClarification(analysis: AnalyzedThesis): boolean {
    // 신뢰도 낮음, 가정 많음, 모호함 등
    return analysis.confidence < 0.7 || analysis.assumptions.length > 3;
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
