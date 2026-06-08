/**
 * Discord Message Miner
 * 의장님이 보낸 Discord 메시지를 마이닝합니다
 */

import Database from 'better-sqlite3';
import { Client, GatewayIntentBits, Message, ChannelType } from 'discord.js';
import { IMiner, MiningResult, DiscordMessage } from '../types/mining.types';

export class DiscordMiner implements IMiner {
  name = 'DiscordMiner';
  description = '의장님의 Discord 메시지 마이닝';

  private db: Database.Database | null = null;
  private client: Client | null = null;
  private token: string;
  private userId: string;
  private startTime: number = 0;

  constructor() {
    this.token = process.env.DISCORD_TOKEN || '';
    this.userId = process.env.DISCORD_USER_ID || '';
  }

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      if (!this.token) {
        console.error('❌ DISCORD_TOKEN 환경변수가 설정되지 않음');
        return false;
      }

      if (!this.userId) {
        console.error('❌ DISCORD_USER_ID 환경변수가 설정되지 않음');
        return false;
      }

      console.log('✅ Discord Miner 검증 완료');
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

      console.log('🚀 Discord Miner 실행 시작...');

      // Step 1: Discord 봇 연결
      await this.connectBot();

      // Step 2: 의장님의 메시지 수집
      const messages = await this.collectUserMessages();
      recordsProcessed = messages.length;

      console.log(`📊 수집된 메시지: ${recordsProcessed}개`);

      // Step 3: 데이터베이스에 저장
      recordsSaved = this.saveMessages(messages);

      console.log(`✅ 저장된 메시지: ${recordsSaved}개`);

      // Step 4: 로깅
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
      console.error('❌ Discord Miner 실행 실패:', error);

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
      await this.disconnectBot();
      this.closeDatabase();
    }
  }

  /**
   * Discord 봇 연결
   */
  private async connectBot(): Promise<void> {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      await this.client.login(this.token);
      console.log(`✅ Discord 봇 연결 완료: ${this.client.user?.tag}`);
    } catch (err) {
      console.error('❌ Discord 봇 연결 실패:', err);
      throw err;
    }
  }

  /**
   * 의장님의 메시지 수집
   */
  private async collectUserMessages(): Promise<DiscordMessage[]> {
    if (!this.client) return [];

    const messages: DiscordMessage[] = [];

    try {
      // 모든 길드의 채널을 순회
      for (const guild of this.client.guilds.cache.values()) {
        for (const channel of guild.channels.cache.values()) {
          if (channel.type !== ChannelType.GuildText) continue;

          try {
            // 최근 100개 메시지 수집 (페이지네이션 가능)
            const fetchedMessages = await channel.messages.fetch({ limit: 100 });

            for (const msg of fetchedMessages.values()) {
              // 의장님이 보낸 메시지만 수집
              if (msg.author.id === this.userId) {
                messages.push({
                  id: 0,
                  message_id: msg.id,
                  content: msg.content,
                  channel_id: channel.id,
                  guild_id: guild.id,
                  author_id: msg.author.id,
                  timestamp: msg.createdAt,
                  attachments: msg.attachments.map(att => att.url),
                  reactions: Object.fromEntries(
                    msg.reactions.cache.map(r => [r.emoji.name || r.emoji.id, r.count])
                  ),
                  mentions: msg.mentions.users.map(u => u.id),
                  created_at: new Date(),
                });
              }
            }
          } catch (err) {
            console.warn(`⚠️ 채널 ${channel.id} 메시지 수집 실패:`, err);
          }
        }
      }

      console.log(`📝 메시지 수집 완료: ${messages.length}개`);
      return messages;
    } catch (err) {
      console.error('❌ 메시지 수집 중 오류:', err);
      return messages;
    }
  }

  /**
   * 메시지를 데이터베이스에 저장
   */
  private saveMessages(messages: DiscordMessage[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO discord_messages
        (message_id, content, channel_id, guild_id, author_id, timestamp, attachments, reactions, mentions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const msg of messages) {
        try {
          const result = stmt.run(
            msg.message_id,
            msg.content,
            msg.channel_id,
            msg.guild_id,
            msg.author_id,
            msg.timestamp.toISOString(),
            JSON.stringify(msg.attachments || []),
            JSON.stringify(msg.reactions || {}),
            JSON.stringify(msg.mentions || [])
          );

          if ((result as any).changes > 0) {
            saved++;
          }
        } catch (err) {
          console.warn(`⚠️ 메시지 저장 실패: ${msg.message_id}`, err);
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

      const schema = `
        CREATE TABLE IF NOT EXISTS discord_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          author_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          attachments TEXT,
          reactions TEXT,
          mentions TEXT,
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
   * Discord 봇 연결 해제
   */
  private async disconnectBot(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      console.log('✅ Discord 봇 연결 해제');
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
