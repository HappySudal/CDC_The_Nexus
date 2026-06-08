/**
 * Emergency Detector
 * Phase 3-3: 긴급 상황 감지 엔진
 * - 키워드 기반 긴급 감지
 * - 톤 기반 긴급도 평가
 * - 우선순위 자동 상향
 * - 알림 및 에스컬레이션
 */

export interface EmergencyAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectionTime: Date;
  detectedKeywords: string[];
  toneAnalysis: {
    urgency: number; // 0-100
    stress: number; // 0-100
    confusion: number; // 0-100
  };
  message: string;
  suggestedAction: string;
  escalated: boolean;
}

export class EmergencyDetector {
  name = 'EmergencyDetector';
  description = '긴급 상황 감지: 키워드, 톤, 우선순위 자동 상향';

  // 긴급 키워드 데이터베이스
  private emergencyKeywords: { [key: string]: string[] } = {
    critical: ['긴급', '즉시', '중대', '위험', '침해', '장애', '다운', '실패'],
    high: ['빨리', '서둘러', '급함', '중요', '심각', '문제', '오류', '버그'],
    medium: ['확인', '검토', '확장', '개선', '최적화'],
    low: ['시간', '있을때', '나중에', '고려'],
  };

  // 톤 분석 키워드
  private urgencyIndicators = ['!', '???', '지금', '당장', '어떻게', '안 돼'];
  private stressIndicators = ['힘들어', '어렵다', '불가능', '안 되', '못'];
  private confusionIndicators = ['왜', '무엇', '어디', '어떤', '뭔가'];

  private alerts: EmergencyAlert[] = [];

  /**
   * 메시지 분석 (긴급 상황 감지)
   */
  analyze(message: string): EmergencyAlert | null {
    console.log(`  🚨 긴급 상황 분석 중...`);

    // 1. 키워드 기반 감지
    const detectedKeywords = this.detectKeywords(message);
    const keywordSeverity = this.determineSeverityFromKeywords(detectedKeywords);

    // 2. 톤 분석
    const toneAnalysis = this.analyzeTone(message);
    const toneSeverity = this.determineSeverityFromTone(toneAnalysis);

    // 3. 최종 심각도 결정
    const severity = this.combineSeverities(keywordSeverity, toneSeverity);

    // 긴급 상황이 아니면 null 반환
    if (severity === 'low') {
      console.log(`    ℹ️  일반 메시지 (긴급 상황 아님)`);
      return null;
    }

    // 4. 긴급 알림 생성
    const alert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      severity,
      detectionTime: new Date(),
      detectedKeywords,
      toneAnalysis,
      message,
      suggestedAction: this.suggestAction(severity, detectedKeywords),
      escalated: severity === 'critical',
    };

    this.alerts.push(alert);

    console.log(`    🚨 긴급도: ${severity}`);
    console.log(`    📌 키워드: ${detectedKeywords.join(', ')}`);
    console.log(`    💬 긴장도: ${toneAnalysis.urgency.toFixed(0)}/100`);

    // 에스컬레이션
    if (alert.escalated) {
      this.escalate(alert);
    }

    return alert;
  }

  /**
   * 키워드 감지
   */
  private detectKeywords(message: string): string[] {
    const detected: string[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [severity, keywords] of Object.entries(this.emergencyKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          detected.push(keyword);
        }
      }
    }

    return detected;
  }

  /**
   * 키워드 기반 심각도 결정
   */
  private determineSeverityFromKeywords(
    keywords: string[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (keywords.length === 0) {
      return 'low';
    }

    // 중대 키워드 확인
    const criticalKeywords = this.emergencyKeywords.critical || [];
    if (keywords.some(k => criticalKeywords.includes(k))) {
      return 'critical';
    }

    // 높음 키워드 확인
    const highKeywords = this.emergencyKeywords.high || [];
    if (keywords.some(k => highKeywords.includes(k))) {
      return 'high';
    }

    // 중간 키워드 확인
    const mediumKeywords = this.emergencyKeywords.medium || [];
    if (keywords.some(k => mediumKeywords.includes(k))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 톤 분석
   */
  private analyzeTone(message: string): {
    urgency: number;
    stress: number;
    confusion: number;
  } {
    let urgency = 0;
    let stress = 0;
    let confusion = 0;

    // 긴장도 계산 (0-100)
    const urgencyMatches = this.urgencyIndicators.filter(ind =>
      message.includes(ind)
    ).length;
    urgency = Math.min(100, urgencyMatches * 20);

    // 스트레스 계산 (0-100)
    const stressMatches = this.stressIndicators.filter(ind =>
      message.includes(ind)
    ).length;
    stress = Math.min(100, stressMatches * 25);

    // 혼란 계산 (0-100)
    const confusionMatches = this.confusionIndicators.filter(ind =>
      message.includes(ind)
    ).length;
    confusion = Math.min(100, confusionMatches * 15);

    return { urgency, stress, confusion };
  }

  /**
   * 톤 기반 심각도 결정
   */
  private determineSeverityFromTone(toneAnalysis: {
    urgency: number;
    stress: number;
    confusion: number;
  }): 'critical' | 'high' | 'medium' | 'low' {
    const average = (toneAnalysis.urgency + toneAnalysis.stress + toneAnalysis.confusion) / 3;

    if (average > 75) {
      return 'critical';
    } else if (average > 50) {
      return 'high';
    } else if (average > 25) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 심각도 합치기
   */
  private combineSeverities(
    keywordSeverity: 'critical' | 'high' | 'medium' | 'low',
    toneSeverity: 'critical' | 'high' | 'medium' | 'low'
  ): 'critical' | 'high' | 'medium' | 'low' {
    const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
    const maxSeverity = Math.max(severityRank[keywordSeverity], severityRank[toneSeverity]);

    for (const [severity, rank] of Object.entries(severityRank)) {
      if (rank === maxSeverity) {
        return severity as 'critical' | 'high' | 'medium' | 'low';
      }
    }

    return 'low';
  }

  /**
   * 추천 조치
   */
  private suggestAction(severity: 'critical' | 'high' | 'medium' | 'low', keywords: string[]): string {
    const actionMap: { [key: string]: string } = {
      critical: '최고 우선순위로 즉시 대응. 의장님께 보고.',
      high: '높은 우선순위로 처리. 상황 모니터링.',
      medium: '정상 우선순위. 일정 내 처리.',
      low: '낮은 우선순위. 여유 있을 때 처리.',
    };

    return actionMap[severity];
  }

  /**
   * 에스컬레이션 (중대 상황)
   */
  private escalate(alert: EmergencyAlert): void {
    console.log('\n⚠️  긴급 에스컬레이션!');
    console.log(`  심각도: ${alert.severity}`);
    console.log(`  조치: ${alert.suggestedAction}`);
    console.log(`  → 의장님께 즉시 보고`);
    console.log(`  → 15사도 중 Lando + Antigravity 동원`);
    console.log(`  → 최고 우선순위 작업 배분`);
  }

  /**
   * 알림 히스토리
   */
  getAlertHistory(): EmergencyAlert[] {
    return [...this.alerts];
  }

  /**
   * 최근 긴급 상황
   */
  getLatestAlert(): EmergencyAlert | null {
    return this.alerts.length > 0 ? this.alerts[this.alerts.length - 1] : null;
  }

  /**
   * 심각도별 알림 통계
   */
  getStatistics(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
  } {
    return {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.severity === 'critical').length,
      high: this.alerts.filter(a => a.severity === 'high').length,
      medium: this.alerts.filter(a => a.severity === 'medium').length,
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
