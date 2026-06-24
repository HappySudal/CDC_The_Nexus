/**
 * Discord Miner
 * 의장님의 Discord 지휘소에서 실시간 메시지 및 스레드 수집
 */

interface DiscordMessage {
  messageId: string;
  content: string;
  author: string;
  channelId: string;
  channelName: string;
  timestamp: Date;
  reactions: string[];
  threadId?: string;
}

export class DiscordMiner {
  private client: any; // discord.js Client
  private targetChannels: string[] = [];
  private syncedMessages: Map<string, DiscordMessage> = new Map();

  constructor(client: any, targetChannels: string[] = []) {
    this.client = client;
    this.targetChannels = targetChannels;
  }

  /**
   * Discord 채널에서 메시지 수집
   */
  async syncMessages(limit: number = 100): Promise<DiscordMessage[]> {
    try {
      console.log('[Discord] 메시지 동기화 시작...');

      // TODO: discord.js client.channels.cache로 채널 순회 및 메시지 수집
      // 현재는 mock 구현
      const mockMessages: DiscordMessage[] = [
        {
          messageId: 'dm_001',
          content: 'Twin Brain 프로젝트의 Phase 2 시작. 지식 광산 엔진 구현 예정',
          author: '의장님',
          channelId: 'ch_001',
          channelName: 'nexus-fcc',
          timestamp: new Date('2026-06-24'),
          reactions: ['✅', '🚀'],
        },
      ];

      for (const msg of mockMessages) {
        this.syncedMessages.set(msg.messageId, msg);
      }

      console.log(`✅ ${mockMessages.length}개 메시지 동기화 완료`);
      return mockMessages;
    } catch (error) {
      console.error('[Discord] 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 메시지에서 지시사항 추출
   */
  async extractDirectives(message: DiscordMessage): Promise<any> {
    try {
      const keywords = ['해라', '진행해', '점검', '확인'];
      const isDirective = keywords.some(kw => message.content.includes(kw));

      return {
        messageId: message.messageId,
        isDirective,
        content: message.content.substring(0, 100),
        timestamp: message.timestamp,
      };
    } catch (error) {
      console.error(`[Discord] 지시사항 추출 실패 (${message.messageId}):`, error);
      return null;
    }
  }

  getAllMessages(): DiscordMessage[] {
    return Array.from(this.syncedMessages.values());
  }
}

/**
 * "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
 * "Exists in the Moment, Vanishes in Time."
 */
