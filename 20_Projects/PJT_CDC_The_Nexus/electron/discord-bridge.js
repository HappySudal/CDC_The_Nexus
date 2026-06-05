/**
 * Discord Bridge for The Nexus
 * Enables bidirectional communication between agents and Discord
 * Supports command execution, status updates, and notifications
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { knowledgeGraph } from './knowledge-graph.js';

export class DiscordBridge {
  constructor(config = {}) {
    this.config = {
      webhookUrl: config.webhookUrl,
      botToken: config.botToken,
      guildId: config.guildId,
      channelId: config.channelId,
      isConnected: false,
      ...config
    };

    this.messageQueue = [];
    this.commandHandlers = new Map();
    this.client = null;
    this.registerDefaultHandlers();
  }

  registerDefaultHandlers() {
    this.on('agent-status', (agentId, status) => this.broadcastStatus(agentId, status));
    this.on('task-complete', (taskId, result) => this.broadcastTaskComplete(taskId, result));
    this.on('graph-update', (nodeId, action) => this.broadcastGraphUpdate(nodeId, action));
  }

  on(eventType, handler) {
    if (!this.commandHandlers.has(eventType)) {
      this.commandHandlers.set(eventType, []);
    }
    this.commandHandlers.get(eventType).push(handler);
  }

  async emit(eventType, ...args) {
    const handlers = this.commandHandlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(...args));
      } catch (error) {
        console.error(`[Discord] Handler error for ${eventType}:`, error);
      }
    }
  }

  // Connection & Setup
  async connect() {
    if (!this.config.webhookUrl && !this.config.botToken) {
      console.warn('[Discord] No webhook or bot token configured');
      return false;
    }

    try {
      // Bot 토큰이 있으면 Discord.js Client 사용
      if (this.config.botToken) {
        return await this.connectWithBot();
      } else if (this.config.webhookUrl) {
        await this.validateWebhook();
        this.config.isConnected = true;
        console.log('[Discord] Webhook connected');
        return true;
      }
    } catch (error) {
      console.error('[Discord] Connection failed:', error.message);
      return false;
    }
  }

  async connectWithBot() {
    return new Promise((resolve) => {
      try {
        this.client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
          ]
        });

        this.client.on('ready', () => {
          console.log(`[Discord Bridge] ✅ Discord 봇 온라인: ${this.client.user.tag}`);
          this.config.isConnected = true;
          this.flushQueue();
          resolve(true);
        });

        this.client.on('messageCreate', (message) => {
          console.log(`[Discord Bridge] 📨 원본 메시지 감지 (${message.author?.tag}): "${message.content}"`);
          this.handleMessage(message);
        });

        this.client.on('error', (error) => {
          console.error('[Discord Bridge] 봇 오류:', error);
        });

        this.client.on('warn', (info) => {
          console.warn('[Discord Bridge] 경고:', info);
        });

        this.client.login(this.config.botToken);
      } catch (error) {
        console.error('[Discord Bridge] 봇 연결 실패:', error);
        resolve(false);
      }
    });
  }

  handleMessage(message) {
    // 봇 자신의 메시지 필터링
    if (message.author.id === this.client.user?.id) return;

    console.log(`[Discord Bridge] 📩 메시지 수신 (${message.author.tag}): ${message.content}`);

    // 명령어 처리
    if (message.content.startsWith('!')) {
      this.handleCommand(message);
    }
  }

  async handleCommand(message) {
    try {
      const args = message.content.slice(1).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      console.log(`[Discord Bridge] ⚡ 명령어: ${command}, 인자: ${args.join(' ')}`);

      let response = '';

      switch (command) {
        case 'help':
          response = '**The Nexus 봇 명령어**\n' +
            '`!help` - 도움말\n' +
            '`!status` - 봇 상태\n' +
            '`!ask <질문>` - LLM에 질문\n' +
            '`!nexus <메시지>` - Nexus 메시지 전송';
          break;
        case 'status':
          response = `✅ 봇이 온라인입니다. (${new Date().toLocaleTimeString()})`;
          break;
        case 'ask':
          if (args.length === 0) {
            response = '질문을 입력해주세요: `!ask <질문>`';
          } else {
            const question = args.join(' ');
            response = `🤔 질문: ${question}\n⏳ 응답 대기 중...`;
            // LLM 호출은 나중에 IPC로 구현
          }
          break;
        case 'nexus':
          response = `✅ 메시지를 Nexus로 전달했습니다: ${args.join(' ')}`;
          break;
        default:
          response = `❓ 알 수 없는 명령어: ${command}\n\`!help\`로 도움말을 확인하세요.`;
      }

      console.log(`[Discord Bridge] 📤 응답 준비: ${response.substring(0, 50)}...`);
      await message.reply(response);
      console.log(`[Discord Bridge] ✅ 응답 전송 완료`);
    } catch (error) {
      console.error(`[Discord Bridge] 명령어 처리 오류:`, error);
      try {
        await message.reply(`⚠️ 오류가 발생했습니다: ${error.message}`);
      } catch (replyError) {
        console.error(`[Discord Bridge] 오류 응답 전송 실패:`, replyError);
      }
    }
  }

  async validateWebhook() {
    const response = await fetch(this.config.webhookUrl, { method: 'GET' });
    if (!response.ok) throw new Error('Webhook validation failed');
  }

  // Message sending
  async sendMessage(content, options = {}) {
    if (!this.config.isConnected) {
      this.messageQueue.push({ content, options, timestamp: new Date() });
      return null;
    }

    try {
      const payload = this.formatMessage(content, options);

      if (this.client && this.config.botToken) {
        return await this.sendViaBotClient(payload);
      } else if (this.config.webhookUrl) {
        return await this.sendViaWebhook(payload);
      } else if (this.config.botToken) {
        return await this.sendViaBotAPI(payload);
      }
    } catch (error) {
      console.error('[Discord] Send failed:', error);
      this.messageQueue.push({ content, options, timestamp: new Date() });
      return null;
    }
  }

  async sendViaBotClient(payload) {
    try {
      const channel = await this.client.channels.fetch(this.config.channelId);
      if (!channel) throw new Error('Channel not found');
      return await channel.send(payload);
    } catch (error) {
      console.error('[Discord] Bot client send failed:', error);
      throw error;
    }
  }

  async flushQueue() {
    console.log(`[Discord Bridge] 큐 비우는 중 (${this.messageQueue.length}개 메시지)...`);
    while (this.messageQueue.length > 0) {
      const { content, options } = this.messageQueue.shift();
      try {
        await this.sendMessage(content, options);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit protection
      } catch (error) {
        console.error('[Discord] Failed to flush queue item:', error);
        break;
      }
    }
  }

  formatMessage(content, options = {}) {
    if (typeof content === 'string') {
      return {
        content,
        username: options.username || 'Nexus Agent',
        ...options
      };
    }

    return {
      embeds: [{
        title: options.title || 'Nexus Update',
        description: content.description || '',
        fields: content.fields || [],
        color: options.color || 0x0099ff,
        timestamp: new Date().toISOString(),
        ...content
      }],
      username: options.username || 'Nexus Agent',
      ...options
    };
  }

  async sendViaWebhook(payload) {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Webhook send failed');
    return response.status === 204 || response.status === 200;
  }

  async sendViaBotAPI(payload) {
    const url = `https://discord.com/api/v10/channels/${this.config.channelId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${this.config.botToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Bot API send failed');
    return response.json();
  }

  // Broadcast events
  async broadcastStatus(agentId, status) {
    const embed = {
      description: `Agent #${agentId} status update`,
      fields: [
        { name: 'Status', value: status.status || 'active', inline: true },
        { name: 'Tasks', value: String(status.activeTasksCount || 0), inline: true },
        { name: 'Last Activity', value: status.lastActivity || 'Just now', inline: false }
      ],
      color: status.status === 'error' ? 0xff0000 : 0x00ff00
    };

    await this.sendMessage(embed, { title: `Agent Status: #${agentId}` });
  }

  async broadcastTaskComplete(taskId, result) {
    const embed = {
      description: `Task ${taskId} completed successfully`,
      fields: [
        { name: 'Status', value: 'Completed ✅', inline: true },
        { name: 'Result', value: result.summary || 'Task finished', inline: false },
        { name: 'Time', value: new Date().toLocaleTimeString(), inline: true }
      ],
      color: 0x00ff00
    };

    await this.sendMessage(embed, { title: `Task Complete: ${taskId}` });
  }

  async broadcastGraphUpdate(nodeId, action) {
    const node = knowledgeGraph.getNode(nodeId);
    if (!node) return;

    const embed = {
      description: `Knowledge graph updated`,
      fields: [
        { name: 'Node', value: `${node.label} (${nodeId})`, inline: true },
        { name: 'Action', value: action || 'updated', inline: true },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false }
      ],
      color: 0x9900ff
    };

    await this.sendMessage(embed, { title: 'Graph Update' });
  }

  // Statistics
  getStats() {
    return {
      connected: this.config.isConnected,
      queuedMessages: this.messageQueue.length,
      handlers: this.commandHandlers.size,
      lastActivity: new Date().toISOString()
    };
  }
}

// 환경 변수에서 설정 읽기
const config = {
  botToken: process.env.DISCORD_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  channelId: process.env.DISCORD_CHANNEL_ID
};

export const discordBridge = new DiscordBridge(config);

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
