/**
 * Ollama Manager for The Nexus
 * Handles local LLM lifecycle: detection, startup, model management
 */

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OLLAMA_PORT = 11434;
const OLLAMA_BASE_URL = `http://localhost:${OLLAMA_PORT}`;
const DEFAULT_MODELS = ['llama2', 'mistral', 'neural-chat']; // Lightweight models

export class OllamaManager {
  constructor() {
    this.isRunning = false;
    this.process = null;
    this.ollamaPath = this.detectOllama();
  }

  detectOllama() {
    // Common Ollama installation paths
    const paths = [
      'ollama',
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Ollama', 'ollama.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
      '/Applications/Ollama.app/Contents/MacOS/ollama', // macOS
      '/usr/bin/ollama', // Linux
      '/usr/local/bin/ollama'
    ];

    for (const p of paths) {
      try {
        if (fs.existsSync(p)) {
          return p;
        }
        // Try to find in PATH
        const result = require('child_process').execSync(`where "${p}" 2>nul || which "${p}" 2>/dev/null`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        if (result) return result;
      } catch (e) {
        // Continue to next path
      }
    }

    return null;
  }

  async isOllamaRunning() {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('[Ollama] Already running');
      return true;
    }

    if (!this.ollamaPath) {
      console.error('[Ollama] Ollama not found. Please install from https://ollama.ai');
      return false;
    }

    try {
      // Check if already running via network
      if (await this.isOllamaRunning()) {
        this.isRunning = true;
        console.log('[Ollama] Running at', OLLAMA_BASE_URL);
        return true;
      }

      // Start Ollama process
      console.log('[Ollama] Starting...', this.ollamaPath);
      this.process = spawn(this.ollamaPath, ['serve'], {
        detached: true,
        stdio: 'ignore'
      });

      this.process.unref();
      this.isRunning = true;

      // Wait for Ollama to be ready
      await this.waitForReady(30000);
      console.log('[Ollama] Started successfully');
      return true;
    } catch (error) {
      console.error('[Ollama] Start failed:', error.message);
      this.isRunning = false;
      return false;
    }
  }

  async waitForReady(timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await this.isOllamaRunning()) {
          return true;
        }
      } catch (e) {
        // Continue polling
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Ollama startup timeout');
  }

  async listModels() {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to list models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('[Ollama] List models failed:', error.message);
      return [];
    }
  }

  async pullModel(modelName) {
    try {
      console.log(`[Ollama] Pulling model: ${modelName}`);
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) throw new Error(`Pull failed for ${modelName}`);

      // Stream the response
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        // Parse JSONL stream
        chunk.split('\n').filter(Boolean).forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              console.log(`[Ollama] ${modelName}: ${data.status}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        });
      }

      console.log(`[Ollama] Model pulled: ${modelName}`);
      return true;
    } catch (error) {
      console.error('[Ollama] Pull model failed:', error.message);
      return false;
    }
  }

  async ensureModel(modelName) {
    const models = await this.listModels();
    if (models.some(m => m.name === modelName || m.name.startsWith(modelName + ':'))) {
      return true;
    }
    return await this.pullModel(modelName);
  }

  async generate(modelName, prompt, options = {}) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          stream: false,
          ...options
        })
      });

      if (!response.ok) throw new Error('Generate request failed');
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('[Ollama] Generate failed:', error.message);
      throw error;
    }
  }

  async generateStream(modelName, prompt, onChunk, options = {}) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          stream: true,
          ...options
        })
      });

      if (!response.ok) throw new Error('Generate request failed');

      const reader = response.body.getReader();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        chunk.split('\n').filter(Boolean).forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response);
            }
          } catch (e) {
            // Ignore parse errors
          }
        });
      }

      return fullResponse;
    } catch (error) {
      console.error('[Ollama] Generate stream failed:', error.message);
      throw error;
    }
  }

  stop() {
    if (this.process) {
      try {
        this.process.kill();
      } catch (e) {
        // Process may already be terminated
      }
    }
    this.isRunning = false;
    console.log('[Ollama] Stopped');
  }
}

export const ollamaManager = new OllamaManager();

// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
