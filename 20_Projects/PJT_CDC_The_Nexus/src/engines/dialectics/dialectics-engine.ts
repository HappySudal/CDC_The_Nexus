/**
 * Dialectics Engine (Phase 2-5)
 * 변증법적 대화 학습 시스템
 * - Thesis 감지: 의장님의 가설/주장
 * - Antithesis 감지: 대립점/질문
 * - Synthesis: 종합점/결론 도출
 */

import Database from 'better-sqlite3';
import { ThesisDetector } from './utils/thesis-detector';
import { AntithesisDetector } from './utils/antithesis-detector';
import { SynthesisAnalyzer } from './utils/synthesis-analyzer';

export interface DialecticalConversation {
  id: string;
  thesis: string;
  antithesis?: string;
  synthesis?: string;
  confidence: number;
  source: 'gemini' | 'discord' | 'voice' | 'manual';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class DialecticsEngine {
  name = 'DialecticsEngine';
  description = '변증법적 대화 학습 엔진 (Thesis-Antithesis-Synthesis)';

  private db: Database.Database | null = null;
  private thesisDetector: ThesisDetector;
  private antithesisDetector: AntithesisDetector;
  private synthesisAnalyzer: SynthesisAnalyzer;

  constructor() {
    this.thesisDetector = new ThesisDetector();
    this.antithesisDetector = new AntithesisDetector();
    this.synthesisAnalyzer = new SynthesisAnalyzer();
  }

  /**
   * 변증법 엔진 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Dialectics Engine 초기화 중...');

      // 1. 데이터베이스 초기화
      this.initDatabase();
      console.log('✅ 데이터베이스 초기화');

      // 2. Thesis 감지기 초기화
      await this.thesisDetector.initialize();
      console.log('✅ Thesis 감지기 초기화');

      // 3. Antithesis 감지기 초기화
      await this.antithesisDetector.initialize();
      console.log('✅ Antithesis 감지기 초기화');

      // 4. Synthesis 분석기 초기화
      await this.synthesisAnalyzer.initialize();
      console.log('✅ Synthesis 분석기 초기화');

      console.log('✅ 변증법 엔진 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ 변증법 엔진 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 대화에서 변증법적 구조 추출
   */
  async analyzeConversation(userMessage: string, aiResponse: string): Promise<DialecticalConversation | null> {
    try {
      console.log('🔍 변증법적 구조 분석 중...');

      // Step 1: Thesis 감지
      const thesis = await this.thesisDetector.detect(userMessage);
      if (!thesis) {
        console.log('⚠️ Thesis를 감지하지 못함');
        return null;
      }

      console.log(`📌 Thesis: ${thesis.text}`);

      // Step 2: Antithesis 감지
      const antithesis = await this.antithesisDetector.detect(aiResponse, thesis);
      console.log(`❓ Antithesis: ${antithesis?.text || '없음'}`);

      // Step 3: Synthesis 도출
      const synthesis = antithesis
        ? await this.synthesisAnalyzer.analyze(thesis, antithesis)
        : null;

      console.log(`✨ Synthesis: ${synthesis?.text || '진행 중'}`);

      // Step 4: 데이터베이스 저장
      const record: DialecticalConversation = {
        id: `dial-${Date.now()}`,
        thesis: thesis.text,
        antithesis: antithesis?.text,
        synthesis: synthesis?.text,
        confidence: Math.max(thesis.confidence, antithesis?.confidence || 0),
        source: 'manual',
        timestamp: new Date(),
        metadata: {
          thesisType: thesis.type,
          antithesisType: antithesis?.type,
        },
      };

      this.saveConversation(record);
      return record;
    } catch (err) {
      console.error('❌ 변증법적 구조 분석 실패:', err);
      return null;
    }
  }

  /**
   * 변증법 대화 저장
   */
  private saveConversation(conversation: DialecticalConversation): void {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO dialectical_conversations
        (conversation_id, thesis, antithesis, synthesis, confidence, source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        conversation.id,
        conversation.thesis,
        conversation.antithesis || null,
        conversation.synthesis || null,
        conversation.confidence,
        conversation.source,
        conversation.timestamp.toISOString()
      );

      console.log('✅ 변증법 대화 저장 완료');
    } catch (err) {
      console.error('❌ 저장 실패:', err);
    }
  }

  /**
   * 변증법 대화 기록 조회
   */
  async getDialecticalHistory(limit: number = 100): Promise<DialecticalConversation[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dialectical_conversations
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      const rows = stmt.all(limit) as any[];
      return rows.map(row => ({
        id: row.conversation_id,
        thesis: row.thesis,
        antithesis: row.antithesis,
        synthesis: row.synthesis,
        confidence: row.confidence,
        source: row.source,
        timestamp: new Date(row.timestamp),
      }));
    } catch (err) {
      console.error('❌ 조회 실패:', err);
      return [];
    }
  }

  /**
   * 의장님의 패턴 학습
   */
  async learnPatterns(): Promise<Record<string, any>> {
    try {
      const history = await this.getDialecticalHistory(1000);

      // 패턴 분석
      const patterns = {
        totalConversations: history.length,
        thesesByType: this.groupBy(history, h => h.synthesis ? 'resolved' : 'ongoing'),
        averageConfidence: history.reduce((sum, h) => sum + h.confidence, 0) / history.length,
        learningTrend: this.calculateTrend(history),
      };

      console.log('🧠 의장님의 패턴 학습 완료');
      return patterns;
    } catch (err) {
      console.error('❌ 패턴 학습 실패:', err);
      return {};
    }
  }

  /**
   * 유틸리티: 그룹화
   */
  private groupBy(items: any[], fn: (item: any) => string): Record<string, any[]> {
    return items.reduce((acc, item) => {
      const key = fn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  /**
   * 유틸리티: 학습 추세 계산
   */
  private calculateTrend(history: DialecticalConversation[]): string {
    const recent = history.slice(0, 100);
    const avgConfidence = recent.reduce((sum, h) => sum + h.confidence, 0) / recent.length;
    return avgConfidence > 0.7 ? 'improving' : avgConfidence > 0.5 ? 'stable' : 'needs-work';
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    try {
      const dbPath = 'data/mining.db';
      this.db = new Database(dbPath);

      const schema = `
        CREATE TABLE IF NOT EXISTS dialectical_conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          thesis TEXT NOT NULL,
          antithesis TEXT,
          synthesis TEXT,
          confidence REAL DEFAULT 0.5,
          source TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.exec(schema);
      console.log('✅ 데이터베이스 초기화 완료');
    } catch (err) {
      console.error('❌ 데이터베이스 초기화 실패:', err);
      throw err;
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
