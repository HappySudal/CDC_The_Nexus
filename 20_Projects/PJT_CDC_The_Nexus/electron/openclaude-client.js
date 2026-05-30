/**
 * OpenClaude Client — Phase D3.3
 *
 * 의장-Nexus Live IPC에서 사도 'openclaude' 라우팅의 실제 호출 백엔드.
 * 환경변수 OPENCLAUDE_API_KEY가 설정되어 있어야 호출 가능.
 *
 * 설계:
 * - 순수 fetch 기반 (axios 의존 제거 — 추가 패키지 회피)
 * - Rate limit: 분당 60건 (in-memory bucket)
 * - 캐시: SHA-256(prompt) → 응답 (TTL 5분)
 * - fetch 주입 가능 (단위 테스트용)
 */

import crypto from 'crypto';

export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_RATE_LIMIT_PER_MIN = 60;

export class OpenClaudeClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.apiKey]   API 키 (env에서 주입)
   * @param {string} [opts.baseUrl]  엔드포인트 (default: localhost:4000)
   * @param {Function} [opts.fetch]  fetch 구현 (테스트 주입)
   * @param {() => number} [opts.now]
   * @param {number} [opts.cacheTtlMs]
   * @param {number} [opts.rateLimitPerMin]
   */
  constructor({
    apiKey = process.env.OPENCLAUDE_API_KEY,
    baseUrl = process.env.OPENCLAUDE_BASE_URL || 'http://localhost:4000',
    fetch = globalThis.fetch,
    now = () => Date.now(),
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    rateLimitPerMin = DEFAULT_RATE_LIMIT_PER_MIN,
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetch = fetch;
    this.now = now;
    this.cacheTtlMs = cacheTtlMs;
    this.rateLimitPerMin = rateLimitPerMin;
    this.cache = new Map(); // hash -> { value, expiresAt }
    this.invocations = []; // timestamp[]  (recent only)
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  _hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  _pruneInvocations() {
    const cutoff = this.now() - 60_000;
    this.invocations = this.invocations.filter(t => t >= cutoff);
  }

  _checkRateLimit() {
    this._pruneInvocations();
    if (this.invocations.length >= this.rateLimitPerMin) {
      const oldest = this.invocations[0];
      const retryAfterMs = 60_000 - (this.now() - oldest);
      const err = new Error(`Rate limit exceeded (${this.rateLimitPerMin}/min)`);
      err.code = 'RATE_LIMITED';
      err.retryAfterMs = Math.max(0, retryAfterMs);
      throw err;
    }
  }

  _getCached(hash) {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    if (this.now() >= entry.expiresAt) {
      this.cache.delete(hash);
      return null;
    }
    return entry.value;
  }

  _setCached(hash, value) {
    this.cache.set(hash, { value, expiresAt: this.now() + this.cacheTtlMs });
  }

  /**
   * Prompt 전송.
   * @param {string} prompt
   * @param {object} [opts]
   * @param {boolean} [opts.useCache=true]
   * @returns {Promise<{response: string, cached: boolean, latencyMs: number}>}
   */
  async invoke(prompt, { useCache = true } = {}) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt must be a non-empty string');
    }
    if (!this.isConfigured()) {
      const err = new Error('OpenClaude API key not configured (set OPENCLAUDE_API_KEY)');
      err.code = 'NOT_CONFIGURED';
      throw err;
    }

    const hash = this._hashPrompt(prompt);
    if (useCache) {
      const cached = this._getCached(hash);
      if (cached !== null) {
        return { response: cached, cached: true, latencyMs: 0 };
      }
    }

    this._checkRateLimit();
    this.invocations.push(this.now());

    const startedAt = this.now();
    const res = await this.fetch(`${this.baseUrl}/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`OpenClaude HTTP ${res.status}: ${text || res.statusText}`);
      err.code = 'HTTP_ERROR';
      err.status = res.status;
      throw err;
    }

    const payload = await res.json();
    const response = payload?.response ?? payload?.content ?? '';
    const latencyMs = this.now() - startedAt;

    if (useCache) this._setCached(hash, response);
    return { response, cached: false, latencyMs };
  }

  clearCache() {
    this.cache.clear();
  }

  getMetrics() {
    this._pruneInvocations();
    return {
      invocationsLastMinute: this.invocations.length,
      cacheSize: this.cache.size,
      configured: this.isConfigured(),
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
