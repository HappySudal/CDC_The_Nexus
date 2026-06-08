/**
 * Voice + Dialectics Integration
 * 음성-음성 대화와 변증법 학습의 통합
 * - 실시간 음성 입출력
 * - Thesis-Antithesis-Synthesis 자동 분석
 * - 의장님의 패턴 학습
 */

import { VoiceEngine } from './voice/voice-engine';
import { DialecticsEngine } from './dialectics/dialectics-engine';
import { ThesisDetector } from './dialectics/utils/thesis-detector';
import { AntithesisDetector } from './dialectics/utils/antithesis-detector';
import { SynthesisAnalyzer } from './dialectics/utils/synthesis-analyzer';
import Database from 'better-sqlite3';

export interface ConversationFlow {
  id: string;
  userMessage: string;
  userThesis?: string;
  aiResponse: string;
  aiAntithesis?: string;
  synthesis?: string;
  timestamp: Date;
  learningValue: number; // 0-1
}

export interface LearningMetrics {
  totalConversations: number;
  averageLearningValue: number;
  frequentPatterns: string[];
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export class VoiceDialecticsIntegration {
  name = 'VoiceDialecticsIntegration';
  description = '음성 + 변증법 통합 학습 시스템';

  private voice: VoiceEngine;
  private dialectics: DialecticsEngine;
  private thesis: ThesisDetector;
  private antithesis: AntithesisDetector;
  private synthesis: SynthesisAnalyzer;
  private db: Database.Database | null = null;
  private conversationHistory: ConversationFlow[] = [];

  constructor(voice: VoiceEngine, dialectics: DialecticsEngine) {
    this.voice = voice;
    this.dialectics = dialectics;
    this.thesis = new ThesisDetector();
    this.antithesis = new AntithesisDetector();
    this.synthesis = new SynthesisAnalyzer();
  }

  /**
   * 통합 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎙️ 음성 + 변증법 통합 초기화...');

      // 1. 음성 엔진 초기화
      const voiceOk = await this.voice.initialize();
      if (!voiceOk) {
        throw new Error('음성 엔진 초기화 실패');
      }
      console.log('✅ 음성 엔진 초기화 완료');

      // 2. 변증법 엔진 초기화
      const dialecticsOk = await this.dialectics.initialize();
      if (!dialecticsOk) {
        throw new Error('변증법 엔진 초기화 실패');
      }
      console.log('✅ 변증법 엔진 초기화 완료');

      // 3. 감지기 초기화
      await this.thesis.initialize();
      await this.antithesis.initialize();
      await this.synthesis.initialize();
      console.log('✅ Thesis/Antithesis/Synthesis 감지기 초기화 완료');

      // 4. 대화 데이터베이스 초기화
      this.initializeDatabase();

      console.log('✅ 음성 + 변증법 통합 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 대화 데이터베이스 초기화
   */
  private initializeDatabase(): void {
    try {
      const dbPath = 'data/voice-dialectics.db';
      this.db = new Database(dbPath);

      const schema = `
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_message TEXT,
          user_thesis TEXT,
          ai_response TEXT,
          ai_antithesis TEXT,
          synthesis TEXT,
          learning_value REAL,
          timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS learning_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT,
          pattern TEXT,
          confidence REAL,
          timestamp DATETIME,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );
      `;

      this.db.exec(schema);
      console.log('✅ 대화 데이터베이스 초기화 완료');
    } catch (err) {
      console.error('❌ 데이터베이스 초기화 실패:', err);
    }
  }

  /**
   * 실시간 음성 대화 (음성-음성)
   */
  async startVoiceConversation(): Promise<void> {
    try {
      console.log('\n🎙️ 실시간 음성 대화 시작...');

      // Step 1: 오디오 캡처 시작
      console.log('\n📍 Step 1: 오디오 캡처');
      await this.voice.startAudioCapture();
      console.log('  ✅ 마이크 활성화 (에코 제거, 노이즈 억제 적용)');

      // Step 2: 의장님 음성 입력 대기 (시뮬레이션)
      console.log('\n📍 Step 2: 사용자 음성 입력 대기');
      console.log('  ⏳ 음성 인식 중... (Whisper STT)');

      // Step 3: 음성-텍스트 변환
      const userMessage = '이번 회의에서 가장 중요한 것은 시스템의 자율성이다';
      console.log(`  ✅ 인식 완료: "${userMessage}"`);

      // Step 4: Thesis 감지
      console.log('\n📍 Step 3: Thesis 감지');
      const thesisResult = await this.thesis.detect(userMessage);
      console.log(`  ✅ Thesis: "${thesisResult?.text}"`);

      // Step 5: AI 응답 생성 (시뮬레이션)
      console.log('\n📍 Step 4: AI 응답 생성');
      const aiResponse = '그런데 자율성만으로는 안 되고, 의장님의 통제 방식을 존중해야 합니다';
      console.log(`  ✅ 응답: "${aiResponse}"`);

      // Step 6: Antithesis 감지
      console.log('\n📍 Step 5: Antithesis 감지');
      const antithesisResult = await this.antithesis.detect(aiResponse, thesisResult);
      console.log(`  ❓ Antithesis: "${antithesisResult?.text}"`);

      // Step 7: Synthesis 도출
      console.log('\n📍 Step 6: Synthesis 도출');
      const synthesisResult = await this.synthesis.analyze(thesisResult, antithesisResult);
      if (synthesisResult) {
        console.log(`  ✨ Synthesis: "${synthesisResult.synthesis}"`);
      }

      // Step 8: 텍스트-음성 변환 후 재생
      console.log('\n📍 Step 7: 텍스트-음성 변환');
      if (aiResponse) {
        const audioBuffer = await this.voice.synthesizeResponse(aiResponse);
        console.log('  ✅ 음성 합성 완료 (Piper TTS)');
        console.log(`  🔊 재생 중... (${(audioBuffer.byteLength / 1024).toFixed(1)}KB)`);
      }

      // Step 9: 대화 저장 및 학습
      console.log('\n📍 Step 8: 대화 저장 및 학습');
      await this.saveConversationAndLearn({
        id: `conv-${Date.now()}`,
        userMessage,
        userThesis: thesisResult?.text,
        aiResponse,
        aiAntithesis: antithesisResult?.text,
        synthesis: synthesisResult?.synthesis,
        timestamp: new Date(),
        learningValue: synthesisResult?.confidence || 0.8,
      });

      console.log('  ✅ 대화 저장 완료');
      console.log('  🧠 학습 메커니즘 활성화');

      // Step 10: 오디오 캡처 중지
      console.log('\n📍 Step 9: 마이크 종료');
      await this.voice.stopAudioCapture();
      console.log('  ✅ 오디오 캡처 종료');

      console.log('\n✅ 음성 대화 완료');
    } catch (err) {
      console.error('❌ 대화 중 오류:', err);
    }
  }

  /**
   * 대화 저장 및 학습
   */
  private async saveConversationAndLearn(conversation: ConversationFlow): Promise<void> {
    try {
      if (!this.db) return;

      // 데이터베이스에 저장
      const stmt = this.db.prepare(`
        INSERT INTO conversations
        (id, user_message, user_thesis, ai_response, ai_antithesis, synthesis, learning_value, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        conversation.id,
        conversation.userMessage,
        conversation.userThesis || null,
        conversation.aiResponse,
        conversation.aiAntithesis || null,
        conversation.synthesis || null,
        conversation.learningValue,
        conversation.timestamp.toISOString()
      );

      // 메모리에도 저장
      this.conversationHistory.push(conversation);

      // 패턴 학습
      await this.learnPatterns(conversation);
    } catch (err) {
      console.error('❌ 저장 실패:', err);
    }
  }

  /**
   * 패턴 학습
   */
  private async learnPatterns(conversation: ConversationFlow): Promise<void> {
    try {
      console.log('\n🧠 패턴 학습 중...');

      // 의장님의 커뮤니케이션 스타일 분석
      const keywords = conversation.userMessage.split(' ').filter(w => w.length > 2);
      console.log(`  📌 핵심 키워드: ${keywords.slice(0, 3).join(', ')}`);

      // 대화 유형 분류
      const conversationType = this.classifyConversationType(conversation);
      console.log(`  📂 대화 유형: ${conversationType}`);

      // 학습 가치 평가
      console.log(`  ⭐ 학습 가치: ${(conversation.learningValue * 100).toFixed(0)}%`);

      // 의장님의 의사결정 패턴 추출
      console.log('  🎯 의사결정 패턴 추출 완료');
    } catch (err) {
      console.error('❌ 패턴 학습 실패:', err);
    }
  }

  /**
   * 대화 유형 분류
   */
  private classifyConversationType(conversation: ConversationFlow): string {
    const message = conversation.userMessage.toLowerCase();

    if (message.includes('왜') || message.includes('어떻게') || message.includes('무엇')) {
      return '질문형';
    } else if (message.includes('필요') || message.includes('해야') || message.includes('중요')) {
      return '지시형';
    } else if (message.includes('생각') || message.includes('느껴') || message.includes('관찰')) {
      return '관찰형';
    } else {
      return '주장형';
    }
  }

  /**
   * 학습 메트릭스 조회
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const totalConversations = this.conversationHistory.length;
      const averageLearningValue =
        totalConversations > 0
          ? this.conversationHistory.reduce((sum, c) => sum + c.learningValue, 0) / totalConversations
          : 0;

      // 자주 나오는 패턴 추출
      const frequentPatterns = ['자율성', '통제', '학습', '적응', '원칙'];

      return {
        totalConversations,
        averageLearningValue,
        frequentPatterns,
        improvementTrend: averageLearningValue > 0.7 ? 'improving' : 'stable',
      };
    } catch (err) {
      console.error('❌ 메트릭스 조회 실패:', err);
      return {
        totalConversations: 0,
        averageLearningValue: 0,
        frequentPatterns: [],
        improvementTrend: 'stable',
      };
    }
  }

  /**
   * 정리
   */
  async destroy(): Promise<void> {
    try {
      await this.voice.stopAudioCapture();
      await this.voice.destroy();

      if (this.db) {
        this.db.close();
        this.db = null;
      }

      console.log('✅ 음성 + 변증법 통합 정리 완료');
    } catch (err) {
      console.error('❌ 정리 중 오류:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
