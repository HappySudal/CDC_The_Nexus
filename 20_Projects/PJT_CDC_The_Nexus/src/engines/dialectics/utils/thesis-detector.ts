/**
 * Thesis Detector (Phase 2-5)
 * 의장님의 주장(가설) 감지
 * - 문장 분석
 * - 핵심 주장 추출
 * - 신뢰도 점수 계산
 * - 패턴 분류 (경영, 기술, 철학)
 */

export interface ThesisPattern {
  text: string;
  type: 'statement' | 'question' | 'command' | 'observation';
  confidence: number;
  keywords: string[];
  category: 'management' | 'technology' | 'philosophy' | 'other';
  priority: 'high' | 'medium' | 'low';
}

export class ThesisDetector {
  name = 'ThesisDetector';
  description = '의장님의 주장(가설) 감지기';

  private patterns: Map<string, RegExp> = new Map();
  private keywords: Map<string, string[]> = new Map();
  private isInitialized = false;

  /**
   * Thesis 감지기 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎯 Thesis Detector 초기화 중...');

      // 1. 패턴 학습
      this.initializePatterns();

      // 2. 키워드 학습
      this.initializeKeywords();

      this.isInitialized = true;
      console.log('✅ Thesis Detector 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Thesis Detector 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 패턴 초기화
   */
  private initializePatterns(): void {
    // Statement patterns (주장)
    this.patterns.set('statement_strong', /^(반드시|꼭|절대|무조건|필수적으로)\s+(.+?)$/i);
    this.patterns.set('statement_should', /^(.+?)\s+(해야|되어야|필요|중요|개선)\s*$/i);
    this.patterns.set('statement_is', /^(.+?)\s+(이다|이다\.|\.|는|다|습니다)\s*$/i);

    // Question patterns (질문)
    this.patterns.set('question', /^(.+?)\s*\?|^(왜|어떻게|무엇|어느|누가)\s+(.+?)$/i);

    // Command patterns (명령)
    this.patterns.set('command', /^(진행|실행|구현|해봐|해줄까|할까)\s+(.+?)$/i);

    // Observation patterns (관찰)
    this.patterns.set('observation', /^(보면|보니|느껴|생각해|보|보는데)\s+(.+?)$/i);
  }

  /**
   * 키워드 초기화
   */
  private initializeKeywords(): void {
    // 경영 키워드
    this.keywords.set('management', [
      '효율',
      '최적화',
      '자동화',
      '프로세스',
      '시스템',
      '구조',
      '조직',
      '전략',
      '비용',
      '성과',
    ]);

    // 기술 키워드
    this.keywords.set('technology', [
      'AI',
      'API',
      'database',
      '알고리즘',
      '성능',
      '확장성',
      '아키텍처',
      '클라우드',
      '자동화',
      '통합',
    ]);

    // 철학 키워드
    this.keywords.set('philosophy', [
      '의미',
      '가치',
      '원칙',
      '방향성',
      '비전',
      '철학',
      '진실',
      '지혜',
      '존재',
      '시간',
    ]);
  }

  /**
   * 주장(Thesis) 감지
   */
  async detect(text: string): Promise<ThesisPattern | null> {
    try {
      if (!text || text.trim().length === 0) {
        return null;
      }

      // 1. 패턴 매칭
      const type = this.detectType(text);

      // 2. 키워드 추출
      const keywords = this.extractKeywords(text);

      // 3. 카테고리 분류
      const category = this.classifyCategory(keywords);

      // 4. 신뢰도 점수
      const confidence = this.calculateConfidence(text, type, category);

      // 5. 우선순위
      const priority = this.determinePriority(confidence, keywords);

      const thesis: ThesisPattern = {
        text: text.trim(),
        type,
        confidence,
        keywords,
        category,
        priority,
      };

      console.log(`📌 Thesis 감지: "${thesis.text.substring(0, 50)}..." (신뢰도: ${confidence.toFixed(2)})`);
      return thesis;
    } catch (err) {
      console.error('❌ Thesis 감지 실패:', err);
      return null;
    }
  }

  /**
   * 문장 유형 감지
   */
  private detectType(text: string): 'statement' | 'question' | 'command' | 'observation' {
    // 질문 패턴
    if (this.patterns.get('question')?.test(text)) {
      return 'question';
    }

    // 명령 패턴
    if (this.patterns.get('command')?.test(text)) {
      return 'command';
    }

    // 관찰 패턴
    if (this.patterns.get('observation')?.test(text)) {
      return 'observation';
    }

    // 기본: statement
    return 'statement';
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    const words = text.split(/[\s,\.;:\-()]+/).filter(w => w.length > 2);
    const keywords: string[] = [];

    for (const [category, categoryKeywords] of this.keywords) {
      for (const word of words) {
        if (categoryKeywords.some(kw => word.toLowerCase().includes(kw.toLowerCase()))) {
          keywords.push(word);
        }
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * 카테고리 분류
   */
  private classifyCategory(keywords: string[]): 'management' | 'technology' | 'philosophy' | 'other' {
    const scores = {
      management: 0,
      technology: 0,
      philosophy: 0,
    };

    for (const keyword of keywords) {
      for (const [category, categoryKeywords] of this.keywords) {
        if (categoryKeywords.some(kw => keyword.toLowerCase().includes(kw.toLowerCase()))) {
          scores[category as keyof typeof scores]++;
        }
      }
    }

    const maxCategory = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return (maxCategory?.[0] as 'management' | 'technology' | 'philosophy') || 'other';
  }

  /**
   * 신뢰도 점수 계산
   */
  private calculateConfidence(text: string, type: string, category: string): number {
    let score = 0.5;

    // 길이 (너무 짧거나 길면 감소)
    if (text.length >= 10 && text.length <= 500) {
      score += 0.15;
    }

    // 문장 끝 마침표
    if (text.endsWith('?') || text.endsWith('!') || text.endsWith('.')) {
      score += 0.1;
    }

    // 타입에 따른 가중치
    if (type === 'statement' || type === 'observation') {
      score += 0.1;
    }

    // 카테고리 (알려진 카테고리일수록 신뢰도 증가)
    if (category !== 'other') {
      score += 0.15;
    }

    return Math.min(score, 0.99);
  }

  /**
   * 우선순위 결정
   */
  private determinePriority(confidence: number, keywords: string[]): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8 && keywords.length >= 2) {
      return 'high';
    } else if (confidence >= 0.6 || keywords.length >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.patterns.clear();
    this.keywords.clear();
    this.isInitialized = false;
    console.log('✅ Thesis Detector 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
