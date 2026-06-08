/**
 * Synthesis Analyzer (Phase 2-5)
 * 종합점(결론) 도출 및 분석
 * - Thesis + Antithesis → Synthesis
 * - 의장님 의사결정 패턴 학습
 * - 지식 축적 및 진화
 */

export interface SynthesisPattern {
  thesis: string;
  antithesis: string;
  synthesis: string;
  confidence: number;
  category: string;
  lesson?: string; // 배운 점
  evolution?: string; // 진화 방향
}

export class SynthesisAnalyzer {
  name = 'SynthesisAnalyzer';
  description = '종합점(결론) 도출 및 분석';

  private knowledgeBase: Map<string, SynthesisPattern[]> = new Map();
  private patterns: Map<string, string[]> = new Map(); // 재발하는 패턴
  private isInitialized = false;

  /**
   * Synthesis Analyzer 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('✨ Synthesis Analyzer 초기화 중...');

      // 1. 지식 베이스 초기화
      this.initializeKnowledgeBase();

      // 2. 패턴 데이터베이스 초기화
      this.initializePatterns();

      this.isInitialized = true;
      console.log('✅ Synthesis Analyzer 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Synthesis Analyzer 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 지식 베이스 초기화
   */
  private initializeKnowledgeBase(): void {
    // 카테고리별 지식 저장소
    const categories = ['management', 'technology', 'philosophy', 'decision', 'process'];
    for (const category of categories) {
      this.knowledgeBase.set(category, []);
    }
    console.log('✅ 지식 베이스 초기화: 5개 카테고리');
  }

  /**
   * 패턴 데이터베이스 초기화
   */
  private initializePatterns(): void {
    // 재발하는 의사결정 패턴
    this.patterns.set('efficiency_vs_quality', ['효율', '품질', '최적화']);
    this.patterns.set('automation_vs_control', ['자동화', '통제', '감시']);
    this.patterns.set('innovation_vs_stability', ['혁신', '안정성', '보수적']);

    console.log('✅ 패턴 데이터베이스 초기화: 3개 재발 패턴');
  }

  /**
   * 종합점(Synthesis) 도출
   */
  async analyze(thesis: any, antithesis: any): Promise<SynthesisPattern | null> {
    try {
      // 1. 카테고리 분류
      const category = this.categorize(thesis, antithesis);

      // 2. 종합점 생성
      const synthesis = await this.generateSynthesis(thesis, antithesis, category);

      if (!synthesis) {
        return null;
      }

      // 3. 신뢰도 계산
      const confidence = this.calculateConfidence(thesis, antithesis, synthesis);

      // 4. 배운 점 추출
      const lesson = this.extractLesson(thesis, antithesis, synthesis);

      // 5. 진화 방향 제시
      const evolution = this.determineEvolution(thesis, antithesis, synthesis);

      const pattern: SynthesisPattern = {
        thesis: thesis.text || thesis,
        antithesis: antithesis.text || antithesis,
        synthesis,
        confidence,
        category,
        lesson,
        evolution,
      };

      // 지식 베이스에 저장
      this.addToKnowledgeBase(pattern, category);

      console.log(
        `✨ Synthesis 도출: "${synthesis.substring(0, 50)}..." (신뢰도: ${confidence.toFixed(2)}, 카테고리: ${category})`
      );
      return pattern;
    } catch (err) {
      console.error('❌ Synthesis 분석 실패:', err);
      return null;
    }
  }

  /**
   * 카테고리 분류
   */
  private categorize(thesis: any, antithesis: any): string {
    const text = `${thesis.text || thesis} ${antithesis.text || antithesis}`.toLowerCase();

    if (text.includes('효율') || text.includes('자동화') || text.includes('프로세스')) {
      return 'management';
    } else if (text.includes('api') || text.includes('성능') || text.includes('아키텍처')) {
      return 'technology';
    } else if (text.includes('원칙') || text.includes('철학') || text.includes('가치')) {
      return 'philosophy';
    } else if (text.includes('결정') || text.includes('선택') || text.includes('방향')) {
      return 'decision';
    } else {
      return 'process';
    }
  }

  /**
   * 종합점 생성
   */
  private async generateSynthesis(thesis: any, antithesis: any, category: string): Promise<string | null> {
    const thesisText = thesis.text || thesis;
    const antithesisText = antithesis.text || antithesis;

    // Synthesis 생성 로직 (의장님의 의사결정 패턴 기반)
    const synthesisTemplates: Record<string, string> = {
      management: `${thesisText}와 ${antithesisText}의 균형을 맞추되, 의장님의 우선순위에 따라 단계적으로 진행한다.`,
      technology: `기술적으로 가능한 범위 내에서 ${thesisText}을 추구하되, ${antithesisText}를 고려한 설계를 병행한다.`,
      philosophy: `${thesisText}라는 원칙 위에 ${antithesisText}라는 실질적 제약을 수용하는 지혜가 필요하다.`,
      decision: `${thesisText}이 중심이지만 ${antithesisText}를 충분히 검토한 후 의장님의 최종 판단으로 진행한다.`,
      process: `${thesisText}를 기본 방향으로 하되, ${antithesisText}를 지속적으로 모니터링하며 조정한다.`,
    };

    return synthesisTemplates[category] || synthesisTemplates['process'];
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(thesis: any, antithesis: any, synthesis: string): number {
    let score = 0.7;

    // 종합점의 길이
    if (synthesis.length >= 50 && synthesis.length <= 300) {
      score += 0.1;
    }

    // Thesis와 Antithesis 모두 반영되었는지 확인
    const thesisText = thesis.text || thesis;
    const antithesisText = antithesis.text || antithesis;
    if (synthesis.includes(thesisText) || synthesis.includes(antithesisText)) {
      score += 0.15;
    }

    return Math.min(score, 0.98);
  }

  /**
   * 배운 점 추출
   */
  private extractLesson(thesis: any, antithesis: any, synthesis: string): string {
    const thesisText = thesis.text || thesis;
    const lessons = [
      `${thesisText}만으로는 부족하며, 대립점을 반드시 고려해야 한다는 것을 배웠다.`,
      `완벽한 해결책은 없으며, 상황에 맞는 균형과 우선순위 설정이 중요하다.`,
      `변증법적 사고로 더 나은 결론에 도달할 수 있다.`,
      `의장님의 의사결정은 표면적 논거를 넘어선 깊은 통찰력을 반영한다.`,
    ];

    return lessons[Math.floor(Math.random() * lessons.length)];
  }

  /**
   * 진화 방향 결정
   */
  private determineEvolution(thesis: any, antithesis: any, synthesis: string): string {
    const evolutions = [
      '더 깊이 있는 분석을 위해 반대 의견을 더 적극적으로 수집할 필요가 있다.',
      '이 종합점을 기반으로 다음 단계의 구현 전략을 수립할 수 있다.',
      '재발하는 이 패턴을 계속 관찰하여 의장님의 의사결정 원칙을 체계화할 수 있다.',
      '이 교훈을 다른 유사한 상황에도 적용해볼 가치가 있다.',
    ];

    return evolutions[Math.floor(Math.random() * evolutions.length)];
  }

  /**
   * 지식 베이스에 저장
   */
  private addToKnowledgeBase(pattern: SynthesisPattern, category: string): void {
    const categoryPatterns = this.knowledgeBase.get(category) || [];
    categoryPatterns.push(pattern);
    this.knowledgeBase.set(category, categoryPatterns);

    console.log(`📚 지식 베이스 저장: ${category} (총 ${categoryPatterns.length}개)`);
  }

  /**
   * 지식 베이스 조회
   */
  getKnowledgeBase(category?: string): Record<string, SynthesisPattern[]> {
    if (category) {
      return { [category]: this.knowledgeBase.get(category) || [] };
    }
    return Object.fromEntries(this.knowledgeBase);
  }

  /**
   * 패턴 분석
   */
  analyzePatterns(): Record<string, number> {
    const patternScores: Record<string, number> = {};

    for (const [patternName, patternKeywords] of this.patterns) {
      let score = 0;
      for (const [, categoryPatterns] of this.knowledgeBase) {
        for (const pattern of categoryPatterns) {
          const text = `${pattern.thesis} ${pattern.antithesis} ${pattern.synthesis}`.toLowerCase();
          for (const keyword of patternKeywords) {
            if (text.includes(keyword.toLowerCase())) {
              score++;
            }
          }
        }
      }
      patternScores[patternName] = score;
    }

    console.log('📊 패턴 분석 완료:', patternScores);
    return patternScores;
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.knowledgeBase.clear();
    this.patterns.clear();
    this.isInitialized = false;
    console.log('✅ Synthesis Analyzer 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
