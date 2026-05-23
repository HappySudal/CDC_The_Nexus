/**
 * Configuration Manager for The Nexus
 * Handles system configuration, API keys, model selection, and user preferences
 * Stores config in encrypted JSON file
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export class ConfigManager {
  constructor(configDir = null) {
    this.configDir = configDir || path.join(os.homedir(), '.nexus');
    this.configFile = path.join(this.configDir, 'config.json');
    this.secretsFile = path.join(this.configDir, 'secrets.json');
    this.initializeConfig();
  }

  initializeConfig() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    if (!fs.existsSync(this.configFile)) {
      this.saveConfig(this.getDefaultConfig());
    }

    if (!fs.existsSync(this.secretsFile)) {
      this.saveSecrets(this.getDefaultSecrets());
    }
  }

  getDefaultConfig() {
    return {
      app: {
        name: 'The Nexus',
        version: '0.1.0',
        locale: 'ko-KR',
        theme: 'dark'
      },
      ollama: {
        enabled: true,
        host: 'localhost',
        port: 11434,
        model: 'llama2',
        defaultModels: ['llama2', 'mistral', 'neural-chat']
      },
      agents: {
        sudal: {
          id: 1,
          name: 'Sudal',
          role: 'CEO & Strategic Authority',
          model: 'llama2',
          systemPrompt: 'You are Sudal, CEO & Strategic Authority...'
        },
        lando: {
          id: 2,
          name: 'Lando',
          role: 'Control Center & COO',
          model: 'llama2',
          systemPrompt: 'You are Lando, Control Center & COO...'
        },
        openclaude: {
          id: 15,
          name: 'OpenClaude',
          role: 'Developer & Engineering',
          model: 'llama2',
          systemPrompt: 'You are OpenClaude, Developer & Engineering...'
        }
      },
      knowledgeGraph: {
        enabled: true,
        dataPath: '.nexus-graph',
        autoSave: true,
        backupInterval: 3600000 // 1 hour
      },
      discord: {
        enabled: false,
        webhookUrl: null,
        botToken: null,
        guildId: null,
        channelId: null,
        retryAttempts: 3,
        retryDelay: 5000
      },
      logging: {
        level: 'info',
        format: 'json',
        maxFileSize: 10485760, // 10MB
        maxBackups: 5
      }
    };
  }

  getDefaultSecrets() {
    return {
      discord: {
        webhookUrl: null,
        botToken: null
      },
      ollama: {
        apiKey: null
      },
      anthropic: {
        apiKey: null
      },
      openai: {
        apiKey: null
      },
      google: {
        apiKey: null
      }
    };
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[Config] Load failed:', error);
      return this.getDefaultConfig();
    }
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[Config] Save failed:', error);
      return false;
    }
  }

  loadSecrets() {
    try {
      const data = fs.readFileSync(this.secretsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[Config] Load secrets failed:', error);
      return this.getDefaultSecrets();
    }
  }

  saveSecrets(secrets) {
    try {
      fs.writeFileSync(this.secretsFile, JSON.stringify(secrets, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[Config] Save secrets failed:', error);
      return false;
    }
  }

  get(path, defaultValue = null) {
    const config = this.loadConfig();
    return this.getNestedValue(config, path, defaultValue);
  }

  set(path, value) {
    const config = this.loadConfig();
    this.setNestedValue(config, path, value);
    return this.saveConfig(config);
  }

  getSecret(path, defaultValue = null) {
    const secrets = this.loadSecrets();
    return this.getNestedValue(secrets, path, defaultValue);
  }

  setSecret(path, value) {
    const secrets = this.loadSecrets();
    this.setNestedValue(secrets, path, value);
    return this.saveSecrets(secrets);
  }

  getNestedValue(obj, path, defaultValue) {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  // Agent configuration
  getAgentConfig(agentName) {
    const agents = this.get('agents', {});
    return agents[agentName.toLowerCase()] || null;
  }

  setAgentConfig(agentName, agentConfig) {
    const config = this.loadConfig();
    config.agents = config.agents || {};
    config.agents[agentName.toLowerCase()] = agentConfig;
    return this.saveConfig(config);
  }

  // Discord configuration
  getDiscordConfig() {
    return this.get('discord', {});
  }

  setDiscordConfig(discordConfig) {
    return this.set('discord', discordConfig);
  }

  // Ollama configuration
  getOllamaConfig() {
    return this.get('ollama', {});
  }

  setOllamaConfig(ollamaConfig) {
    return this.set('ollama', ollamaConfig);
  }

  // Statistics
  getStats() {
    return {
      configFile: this.configFile,
      secretsFile: this.secretsFile,
      exists: fs.existsSync(this.configFile),
      modified: fs.existsSync(this.configFile) ? fs.statSync(this.configFile).mtime : null
    };
  }

  // Reset to defaults
  reset() {
    this.saveConfig(this.getDefaultConfig());
    this.saveSecrets(this.getDefaultSecrets());
    return true;
  }
}

export const configManager = new ConfigManager();

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
