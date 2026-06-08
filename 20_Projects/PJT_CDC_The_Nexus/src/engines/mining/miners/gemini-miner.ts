/**
 * Gemini Conversation Miner
 * 의장님과 Gemini의 모든 대화 기록을 마이닝합니다
 */

import Database from 'better-sqlite3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IMiner, MiningResult, GeminiConversation } from '../types/mining.types';

export class GeminiMiner implements IMiner {
  name = 'GeminiMiner';
  description = '의장님과 Gemini의 대화 기록 마이닝';

  private db: Database.Database | null = null;
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  private startTime: number = 0;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('❌ GOOGLE_API_KEY 환경변수가 설정되지 않음');
        return false;
      }

      console.log('✅ Gemini Miner 검증 완료');
      return true;
    } catch (err) {
      console.error('❌ 검증 실패:', err);
      return false;
    }
  }

  /**
   * 마이닝 실행
   */
  async execute(): Promise<MiningResult> {
    this.startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSaved = 0;
    let error: string | undefined;

    try {
      // 데이터베이스 초기화
      this.initDatabase();

      console.log('🚀 Gemini Miner 실행 시작...');

      // Step 1: 로컬 저장된 Gemini 대화 수집
      const conversations = await this.collectLocalConversations();
      recordsProcessed = conversations.length;

      console.log(`📊 수집된 대화: ${recordsProcessed}개`);

      // Step 2: 데이터베이스에 저장
      recordsSaved = this.saveConversations(conversations);

      console.log(`✅ 저장된 대화: ${recordsSaved}개`);

      // Step 3: 로깅
      await this.logMiningActivity('success', recordsProcessed, recordsSaved);

      return {
        success: true,
        miner_name: this.name,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        execution_time_seconds: (Date.now() - this.startTime) / 1000,
        timestamp: new Date(),
      };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('❌ Gemini Miner 실행 실패:', error);

      await this.logMiningActivity('failure', recordsProcessed, recordsSaved, error);

      return {
        success: false,
        miner_name: this.name,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        error,
        execution_time_seconds: (Date.now() - this.startTime) / 1000,
        timestamp: new Date(),
      };
    } finally {
      this.closeDatabase();
    }
  }

  /**
   * 로컬 Gemini 대화 수집
   * NOTE: 실제 구현에서는 Gemini API History, 로컬 파일, 또는 캐시에서 수집
   */
  private async collectLocalConversations(): Promise<GeminiConversation[]> {
    // TODO: 실제 구현
    // - Gemini API의 conversation history 수집
    // - 또는 로컬 파일에서 대화 기록 읽기
    // - 또는 메모리 캐시에서 대화 수집

    const conversations: GeminiConversation[] = [];

    try {
      // 예시: 로컬 파일에서 대화 수집 (향후 구현)
      // const conversationDir = path.join(process.cwd(), '.cache/gemini');
      // if (fs.existsSync(conversationDir)) {
      //   const files = fs.readdirSync(conversationDir);
      //   for (const file of files) {
      //     const data = JSON.parse(fs.readFileSync(path.join(conversationDir, file), 'utf-8'));
      //     conversations.push(data);
      //   }
      // }

      console.log(`📝 로컬 대화 수집 완료: ${conversations.length}개`);
      return conversations;
    } catch (err) {
      console.error('⚠️ 대화 수집 중 오류:', err);
      return [];
    }
  }

  /**
   * 대화를 데이터베이스에 저장
   */
  private saveConversations(conversations: GeminiConversation[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO gemini_conversations
        (conversation_id, user_message, ai_response, timestamp, context_tags, topic)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const conv of conversations) {
        try {
          const result = stmt.run(
            conv.conversation_id,
            conv.user_message,
            conv.ai_response,
            conv.timestamp.toISOString(),
            conv.context_tags || '',
            conv.topic || ''
          );

          if ((result as any).changes > 0) {
            saved++;
          }
        } catch (err) {
          console.warn(`⚠️ 대화 저장 실패: ${conv.conversation_id}`, err);
        }
      }

      return saved;
    } catch (err) {
      console.error('❌ 저장 중 오류:', err);
      return saved;
    }
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    try {
      const dbPath = 'data/mining.db';
      this.db = new Database(dbPath);

      // 스키마 초기화
      const schema = `
        CREATE TABLE IF NOT EXISTS gemini_conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          user_message TEXT NOT NULL,
          ai_response TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          context_tags TEXT,
          sentiment TEXT,
          topic TEXT,
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

  /**
   * 데이터베이스 종료
   */
  private closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 마이닝 활동 로깅
   */
  private async logMiningActivity(
    status: 'success' | 'failure',
    processed: number,
    saved: number,
    error?: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO mining_logs
        (miner_name, status, records_processed, records_saved, error_message, execution_time_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        this.name,
        status,
        processed,
        saved,
        error || null,
        (Date.now() - this.startTime) / 1000
      );
    } catch (err) {
      console.warn('⚠️ 로깅 중 오류:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
