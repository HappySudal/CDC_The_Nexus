/**
 * Discord WebSocket Bridge for Electron IPC
 *
 * Enables Discord bot (Node.js) to control Electron app via WebSocket
 * - Sends commands from Discord to Electron IPC handlers
 * - Receives real-time updates back to Discord
 * - Maintains connection pooling and reconnection logic
 */

import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

export class DiscordWSBridge extends EventEmitter {
  constructor(options = {}) {
    super();

    this.port = options.port || 9000;
    this.host = options.host || 'localhost';
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.pendingCommands = new Map(); // commandId -> Promise
    this.commandCounter = 0;

    this.config = {
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      commandTimeout: 30000,
      ...options.config
    };
  }

  /**
   * Start WebSocket server on Electron main process
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port, host: this.host });

        this.wss.on('connection', (ws, req) => {
          const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const clientInfo = {
            id: clientId,
            ip: req.socket.remoteAddress,
            connectedAt: new Date(),
            lastHeartbeat: Date.now(),
          };

          this.clients.set(clientId, { ws, info: clientInfo });
          console.log(`[DiscordWSBridge] Client connected: ${clientId}`);

          ws.on('message', (data) => this._handleMessage(clientId, data));
          ws.on('close', () => this._handleDisconnect(clientId));
          ws.on('error', (error) => {
            console.error(`[DiscordWSBridge] Client error (${clientId}):`, error.message);
            ws.close();
          });

          // Send welcome message
          ws.send(JSON.stringify({
            type: 'connected',
            clientId,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }));

          // Setup heartbeat
          const heartbeat = setInterval(() => {
            if (ws.readyState === 1) { // OPEN
              ws.ping();
              clientInfo.lastHeartbeat = Date.now();
            } else {
              clearInterval(heartbeat);
            }
          }, 30000);

          ws.on('close', () => clearInterval(heartbeat));
        });

        this.wss.on('error', (error) => {
          console.error('[DiscordWSBridge] Server error:', error);
          reject(error);
        });

        this.wss.on('listening', () => {
          console.log(`[DiscordWSBridge] Server started on ws://${this.host}:${this.port}`);
          resolve(this.wss);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message from Discord bot
   */
  async _handleMessage(clientId, rawData) {
    try {
      const message = JSON.parse(rawData.toString());
      const { clientInfo } = this.clients.get(clientId);

      switch (message.type) {
        case 'execute-npm-script':
          this._handleNpmScript(clientId, message);
          break;

        case 'execute-agent-command':
          this._handleAgentCommand(clientId, message);
          break;

        case 'query-project-registry':
          this._handleProjectQuery(clientId, message);
          break;

        case 'get-status':
          this._handleStatusRequest(clientId, message);
          break;

        case 'pong': // Heartbeat response
          clientInfo.lastHeartbeat = Date.now();
          break;

        default:
          console.warn(`[DiscordWSBridge] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[DiscordWSBridge] Message parsing error:', error);
    }
  }

  /**
   * Handle npm script execution request
   */
  async _handleNpmScript(clientId, message) {
    const { projectName, script, userId, guildId, commandId } = message;
    const responseId = commandId || this._generateCommandId();

    try {
      // Store promise handler for response
      const responsePromise = new Promise((resolve) => {
        this.pendingCommands.set(responseId, resolve);
      });

      // Emit to Electron main process (will be handled by IPC)
      this.emit('npm-script-request', {
        projectName,
        script,
        userId,
        guildId,
        responseId,
        clientId,
        timestamp: new Date().toISOString()
      });

      // Wait for response with timeout
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(responseId);
        this._sendToClient(clientId, {
          type: 'npm-script-response',
          commandId: responseId,
          success: false,
          error: 'Command timeout',
          timestamp: new Date().toISOString()
        });
      }, this.config.commandTimeout);

      const result = await responsePromise;
      clearTimeout(timeout);

      // Send result back to client
      this._sendToClient(clientId, {
        type: 'npm-script-response',
        commandId: responseId,
        ...result
      });
    } catch (error) {
      console.error(`[DiscordWSBridge] npm-script error: ${error.message}`);
      this._sendToClient(clientId, {
        type: 'npm-script-response',
        commandId: responseId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle agent command execution request
   */
  async _handleAgentCommand(clientId, message) {
    const { agentId, command, userId, guildId, commandId } = message;
    const responseId = commandId || this._generateCommandId();

    try {
      const responsePromise = new Promise((resolve) => {
        this.pendingCommands.set(responseId, resolve);
      });

      this.emit('agent-command-request', {
        agentId,
        command,
        userId,
        guildId,
        responseId,
        clientId,
        timestamp: new Date().toISOString()
      });

      const timeout = setTimeout(() => {
        this.pendingCommands.delete(responseId);
        this._sendToClient(clientId, {
          type: 'agent-command-response',
          commandId: responseId,
          success: false,
          error: 'Command timeout',
          timestamp: new Date().toISOString()
        });
      }, this.config.commandTimeout);

      const result = await responsePromise;
      clearTimeout(timeout);

      this._sendToClient(clientId, {
        type: 'agent-command-response',
        commandId: responseId,
        ...result
      });
    } catch (error) {
      console.error(`[DiscordWSBridge] agent-command error: ${error.message}`);
      this._sendToClient(clientId, {
        type: 'agent-command-response',
        commandId: responseId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle project registry query
   */
  async _handleProjectQuery(clientId, message) {
    const { commandId } = message;
    const responseId = commandId || this._generateCommandId();

    try {
      const responsePromise = new Promise((resolve) => {
        this.pendingCommands.set(responseId, resolve);
      });

      this.emit('project-registry-request', {
        responseId,
        clientId,
        timestamp: new Date().toISOString()
      });

      const timeout = setTimeout(() => {
        this.pendingCommands.delete(responseId);
        this._sendToClient(clientId, {
          type: 'project-registry-response',
          commandId: responseId,
          success: false,
          error: 'Query timeout',
          projects: [],
          timestamp: new Date().toISOString()
        });
      }, 5000);

      const result = await responsePromise;
      clearTimeout(timeout);

      this._sendToClient(clientId, {
        type: 'project-registry-response',
        commandId: responseId,
        ...result
      });
    } catch (error) {
      this._sendToClient(clientId, {
        type: 'project-registry-response',
        commandId: responseId,
        success: false,
        error: error.message,
        projects: [],
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle status request
   */
  async _handleStatusRequest(clientId, message) {
    const { commandId } = message;
    const responseId = commandId || this._generateCommandId();

    this._sendToClient(clientId, {
      type: 'status-response',
      commandId: responseId,
      serverStatus: 'operational',
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send response back to Discord bot
   */
  resolveCommand(responseId, result) {
    const resolver = this.pendingCommands.get(responseId);
    if (resolver) {
      resolver(result);
      this.pendingCommands.delete(responseId);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message) {
    const data = JSON.stringify(message);
    let sent = 0;

    this.clients.forEach(({ ws }) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(data);
        sent++;
      }
    });

    return sent;
  }

  /**
   * Send message to specific client
   */
  _sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Handle client disconnect
   */
  _handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`[DiscordWSBridge] Client disconnected: ${clientId} (connected for ${Math.round((Date.now() - client.info.connectedAt) / 1000)}s)`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Generate unique command ID
   */
  _generateCommandId() {
    return `cmd_${++this.commandCounter}_${Date.now()}`;
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      serverStatus: 'operational',
      connectedClients: this.clients.size,
      port: this.port,
      uptime: process.uptime(),
      pendingCommands: this.pendingCommands.size,
      url: `ws://${this.host}:${this.port}`
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.clients.forEach((ws) => {
          ws.close(1000, 'Server shutting down');
        });

        this.wss.close(() => {
          console.log('[DiscordWSBridge] Server shut down gracefully');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default DiscordWSBridge;

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
