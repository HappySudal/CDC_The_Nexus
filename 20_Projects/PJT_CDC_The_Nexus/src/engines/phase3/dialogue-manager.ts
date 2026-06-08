/**
 * Dialogue Manager
 * Phase 3-2: 대화 상태 관리 및 문맥 추적
 * - 대화 히스토리 관리
 * - Thesis-Antithesis-Synthesis 추적
 * - 문맥 유지
 * - 대화 세션 관리
 */

export interface DialogueEntry {
  id: string;
  turn: number;
  role: 'user' | 'ai' | 'system';
  message: string;
  timestamp: Date;
  thesis?: {
    text: string;
    category: string;
    confidence: number;
  };
  antithesis?: {
    text: string;
    severity: number;
  };
  synthesis?: {
    text: string;
    confidence: number;
  };
  metadata?: {
    priority?: string;
    emotions?: string[];
    keyTerms?: string[];
  };
}

export interface DialogueContext {
  sessionId: string;
  startedAt: Date;
  lastUpdated: Date;
  turnCount: number;
  theme?: string;
  mainTopic?: string;
  discussionHistory: DialogueEntry[];
  currentThesis?: string;
  dialecticalProgress: {
    thesesDetected: number;
    antithesesGenerated: number;
    synthesisAchieved: number;
  };
}

export class DialogueManager {
  name = 'DialogueManager';
  description = '대화 상태 관리: 문맥, 히스토리, Thesis-Antithesis-Synthesis';

  private sessions: Map<string, DialogueContext> = new Map();
  private currentSessionId: string | null = null;

  /**
   * 새 대화 세션 시작
   */
  startSession(theme?: string, mainTopic?: string): string {
    const sessionId = `session-${Date.now()}`;

    const context: DialogueContext = {
      sessionId,
      startedAt: new Date(),
      lastUpdated: new Date(),
      turnCount: 0,
      theme,
      mainTopic,
      discussionHistory: [],
      dialecticalProgress: {
        thesesDetected: 0,
        antithesesGenerated: 0,
        synthesisAchieved: 0,
      },
    };

    this.sessions.set(sessionId, context);
    this.currentSessionId = sessionId;

    console.log(`\n📍 새 대화 세션 시작: ${sessionId}`);
    console.log(`  주제: ${theme || '일반'}`);
    console.log(`  메인 토픽: ${mainTopic || '미정'}`);

    return sessionId;
  }

  /**
   * 대화 항목 추가
   */
  addEntry(
    message: string,
    role: 'user' | 'ai' | 'system' = 'user',
    thesis?: any,
    antithesis?: any,
    synthesis?: any
  ): DialogueEntry {
    const sessionId = this.currentSessionId;
    if (!sessionId) {
      throw new Error('활성 세션 없음');
    }

    const context = this.sessions.get(sessionId);
    if (!context) {
      throw new Error('세션을 찾을 수 없음');
    }

    context.turnCount += 1;

    const entry: DialogueEntry = {
      id: `entry-${context.turnCount}`,
      turn: context.turnCount,
      role,
      message,
      timestamp: new Date(),
      thesis,
      antithesis,
      synthesis,
    };

    context.discussionHistory.push(entry);
    context.lastUpdated = new Date();

    // 변증법 진행 추적
    if (thesis) {
      context.dialecticalProgress.thesesDetected += 1;
      context.currentThesis = thesis.text;
    }
    if (antithesis) {
      context.dialecticalProgress.antithesesGenerated += 1;
    }
    if (synthesis) {
      context.dialecticalProgress.synthesisAchieved += 1;
    }

    return entry;
  }

  /**
   * 현재 문맥 조회
   */
  getContext(sessionId?: string): DialogueContext | null {
    const id = sessionId || this.currentSessionId;
    if (!id) {
      return null;
    }
    return this.sessions.get(id) || null;
  }

  /**
   * 대화 히스토리 조회
   */
  getHistory(sessionId?: string, limit?: number): DialogueEntry[] {
    const context = this.getContext(sessionId);
    if (!context) {
      return [];
    }

    const history = context.discussionHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 현재 Thesis 조회
   */
  getCurrentThesis(sessionId?: string): string | null {
    const context = this.getContext(sessionId);
    return context?.currentThesis || null;
  }

  /**
   * 최근 대화 요약
   */
  getSummary(sessionId?: string, entries: number = 5): string {
    const history = this.getHistory(sessionId, entries);

    if (history.length === 0) {
      return '대화 없음';
    }

    const summary = history
      .map(
        entry =>
          `[${entry.role}] ${entry.message.substring(0, 100)}${
            entry.message.length > 100 ? '...' : ''
          }`
      )
      .join('\n');

    return summary;
  }

  /**
   * 변증법 진행 상황 조회
   */
  getDialecticalProgress(sessionId?: string): {
    thesesDetected: number;
    antithesesGenerated: number;
    synthesisAchieved: number;
    progressPercentage: number;
  } {
    const context = this.getContext(sessionId);
    if (!context) {
      return { thesesDetected: 0, antithesesGenerated: 0, synthesisAchieved: 0, progressPercentage: 0 };
    }

    const progress = context.dialecticalProgress;
    const totalSteps = progress.thesesDetected + progress.antithesesGenerated + progress.synthesisAchieved;
    const progressPercentage = totalSteps > 0 ? (progress.synthesisAchieved / progress.thesesDetected) * 100 : 0;

    return {
      ...progress,
      progressPercentage: Math.min(100, progressPercentage),
    };
  }

  /**
   * 세션 종료
   */
  endSession(sessionId?: string): DialogueContext | null {
    const id = sessionId || this.currentSessionId;
    if (!id) {
      return null;
    }

    const context = this.sessions.get(id);
    if (context) {
      console.log(`\n✅ 세션 종료: ${id}`);
      console.log(`  총 턴: ${context.turnCount}`);
      console.log(`  변증법: ${context.dialecticalProgress.thesesDetected}/${context.dialecticalProgress.synthesisAchieved}`);
    }

    if (this.currentSessionId === id) {
      this.currentSessionId = null;
    }

    return context || null;
  }

  /**
   * 메모리 최적화 (오래된 세션 삭제)
   */
  cleanup(maxAgeMins: number = 60): void {
    const now = new Date();
    const maxAge = maxAgeMins * 60 * 1000;

    for (const [sessionId, context] of this.sessions.entries()) {
      const age = now.getTime() - context.lastUpdated.getTime();
      if (age > maxAge) {
        this.sessions.delete(sessionId);
        console.log(`  🗑️  오래된 세션 삭제: ${sessionId}`);
      }
    }
  }

  /**
   * 세션 통계
   */
  getStats(): {
    activeSessions: number;
    totalEntries: number;
    thesesCount: number;
    averageTurnsPerSession: number;
  } {
    let totalEntries = 0;
    let thesesCount = 0;

    for (const context of this.sessions.values()) {
      totalEntries += context.discussionHistory.length;
      thesesCount += context.dialecticalProgress.thesesDetected;
    }

    return {
      activeSessions: this.sessions.size,
      totalEntries,
      thesesCount,
      averageTurnsPerSession: this.sessions.size > 0 ? totalEntries / this.sessions.size : 0,
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
