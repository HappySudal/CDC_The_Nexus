/**
 * Discord Bridge for The Nexus
 * Enables bidirectional communication between agents and Discord
 * Supports command execution, status updates, and notifications
 */

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
      if (this.config.webhookUrl) {
        await this.validateWebhook();
      } else if (this.config.botToken) {
        await this.validateBotToken();
      }

      this.config.isConnected = true;
      console.log('[Discord] Connected and ready');
      return true;
    } catch (error) {
      console.error('[Discord] Connection failed:', error.message);
      return false;
    }
  }

  async validateWebhook() {
    const response = await fetch(this.config.webhookUrl, { method: 'GET' });
    if (!response.ok) throw new Error('Webhook validation failed');
  }

  async validateBotToken() {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${this.config.botToken}` }
    });
    if (!response.ok) throw new Error('Bot token validation failed');
  }

  // Message sending
  async sendMessage(content, options = {}) {
    if (!this.config.isConnected) {
      this.messageQueue.push({ content, options, timestamp: new Date() });
      return null;
    }

    try {
      const payload = this.formatMessage(content, options);

      if (this.config.webhookUrl) {
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

  // Process queued messages when connection restored
  async flushQueue() {
    if (!this.config.isConnected) return;

    const queue = this.messageQueue.splice(0);
    for (const msg of queue) {
      await this.sendMessage(msg.content, msg.options);
    }
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

export const discordBridge = new DiscordBridge();

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
