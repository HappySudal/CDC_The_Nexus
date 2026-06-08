/**
 * Antithesis Detector (Phase 2-5)
 * AI의 대립점(질문/우려) 감지
 * - AI 응답에서 반대 의견 추출
 * - 위험 요인 식별
 * - 대안 제시 감지
 * - 신뢰도 점수 계산
 */

export interface AntithesisPattern {
  text: string;
  type: 'question' | 'concern' | 'alternative' | 'limitation' | 'risk';
  confidence: number;
  keywords: string[];
  opposes?: string; // 반대하는 주장
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export class AntithesisDetector {
  name = 'AntithesisDetector';
  description = '대립점(질문/우려) 감지기';

  private questionMarkers: string[] = [];
  private concernKeywords: string[] = [];
  private alternativeMarkers: string[] = [];
  private isInitialized = false;

  /**
   * Antithesis 감지기 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('❓ Antithesis Detector 초기화 중...');

      // 1. 질문 표지 학습
      this.initializeQuestionMarkers();

      // 2. 우려 키워드 학습
      this.initializeConcernKeywords();

      // 3. 대안 표지 학습
      this.initializeAlternativeMarkers();

      this.isInitialized = true;
      console.log('✅ Antithesis Detector 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Antithesis Detector 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 질문 표지 초기화
   */
  private initializeQuestionMarkers(): void {
    this.questionMarkers = [
      '혹시',
      '혹은',
      '만약',
      '어떻게',
      '왜',
      '무엇',
      '어느',
      '누가',
      '정말',
      '그런데',
      '그렇다면',
      '있을까',
      '할까',
      '될까',
      '가능할까',
    ];
  }

  /**
   * 우려 키워드 초기화
   */
  private initializeConcernKeywords(): void {
    this.concernKeywords = [
      '위험',
      '문제',
      '오류',
      '실패',
      '제약',
      '한계',
      '어려움',
      '복잡',
      '부작용',
      '주의',
      '확인',
      '검토',
      '개선',
      '변경',
      '보완',
      '우려',
      '염려',
      '리스크',
      '취약점',
      '불가능',
    ];
  }

  /**
   * 대안 표지 초기화
   */
  private initializeAlternativeMarkers(): void {
    this.alternativeMarkers = [
      '대신',
      '다른',
      '또는',
      '또한',
      '방법',
      '대체',
      '옵션',
      '선택지',
      '한편',
      '다만',
      '그러나',
      '반면',
      '차라리',
      '오히려',
      '더',
      '더 나은',
    ];
  }

  /**
   * 대립점(Antithesis) 감지
   */
  async detect(text: string, thesis?: string): Promise<AntithesisPattern | null> {
    try {
      if (!text || text.trim().length === 0) {
        return null;
      }

      // 1. 유형 감지
      const type = this.detectType(text);

      // 2. 키워드 추출
      const keywords = this.extractKeywords(text);

      // 3. 신뢰도 계산
      const confidence = this.calculateConfidence(text, type, keywords);

      // 4. 심각도 결정
      const severity = this.determineSeverity(keywords, type);

      const antithesis: AntithesisPattern = {
        text: text.trim(),
        type,
        confidence,
        keywords,
        opposes: thesis,
        severity,
      };

      console.log(
        `❓ Antithesis 감지: "${antithesis.text.substring(0, 50)}..." (유형: ${type}, 심각도: ${severity})`
      );
      return antithesis;
    } catch (err) {
      console.error('❌ Antithesis 감지 실패:', err);
      return null;
    }
  }

  /**
   * 대립점 유형 감지
   */
  private detectType(text: string): 'question' | 'concern' | 'alternative' | 'limitation' | 'risk' {
    const lowerText = text.toLowerCase();

    // 질문 유형
    if (this.questionMarkers.some(marker => lowerText.includes(marker)) || text.includes('?')) {
      return 'question';
    }

    // 우려 유형
    if (this.concernKeywords.some(keyword => lowerText.includes(keyword))) {
      const concernCount = this.concernKeywords.filter(kw => lowerText.includes(kw)).length;
      if (concernCount >= 2) {
        return 'concern';
      }
    }

    // 대안 유형
    if (this.alternativeMarkers.some(marker => lowerText.includes(marker))) {
      return 'alternative';
    }

    // 제약 유형
    if (lowerText.includes('불가능') || lowerText.includes('한계') || lowerText.includes('제약')) {
      return 'limitation';
    }

    // 위험 유형
    if (lowerText.includes('위험') || lowerText.includes('리스크') || lowerText.includes('실패')) {
      return 'risk';
    }

    // 기본: question
    return 'question';
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    const words = text.split(/[\s,\.;:\-()]+/).filter(w => w.length > 2);
    const keywords: string[] = [];

    // 우려 키워드
    for (const word of words) {
      if (this.concernKeywords.some(kw => word.toLowerCase().includes(kw.toLowerCase()))) {
        keywords.push(word);
      }
    }

    // 질문 표지
    for (const word of words) {
      if (this.questionMarkers.some(marker => word.toLowerCase().includes(marker.toLowerCase()))) {
        keywords.push(word);
      }
    }

    // 대안 표지
    for (const word of words) {
      if (this.alternativeMarkers.some(marker => word.toLowerCase().includes(marker.toLowerCase()))) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * 신뢰도 점수 계산
   */
  private calculateConfidence(text: string, type: string, keywords: string[]): number {
    let score = 0.5;

    // 길이 평가
    if (text.length >= 10 && text.length <= 500) {
      score += 0.15;
    }

    // 구두점 평가
    if (text.includes('?') || text.includes('!')) {
      score += 0.1;
    }

    // 키워드 개수
    if (keywords.length >= 2) {
      score += 0.15;
    } else if (keywords.length === 1) {
      score += 0.08;
    }

    // 유형별 신뢰도
    if (type === 'concern' || type === 'risk') {
      score += 0.1;
    }

    return Math.min(score, 0.99);
  }

  /**
   * 심각도 결정
   */
  private determineSeverity(keywords: string[], type: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalKeywords = ['실패', '불가능', '위험', '심각', '긴급', '치명적'];
    const highKeywords = ['문제', '오류', '위험', '리스크', '제약'];

    const criticalCount = keywords.filter(kw =>
      criticalKeywords.some(ck => kw.toLowerCase().includes(ck.toLowerCase()))
    ).length;

    const highCount = keywords.filter(kw => highKeywords.some(hk => kw.toLowerCase().includes(hk.toLowerCase()))).length;

    if (criticalCount > 0 || type === 'risk') {
      return 'critical';
    } else if (highCount > 0 || type === 'concern') {
      return 'high';
    } else if (keywords.length >= 2 || type === 'limitation') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.questionMarkers = [];
    this.concernKeywords = [];
    this.alternativeMarkers = [];
    this.isInitialized = false;
    console.log('✅ Antithesis Detector 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
