/**
 * ApprovalGate — 민감 IPC 자원(헌법 등)에 대한 토큰 기반 승인 게이트
 *
 * 설계 (Phase C P2-M2):
 * - 화이트리스트(사전 승인) 요청자는 즉시 토큰 발급
 * - 미승인 요청자는 pending 대기열 → 의장 승인 후 토큰 발급
 * - 토큰은 TTL(기본 5분) 경과 시 만료
 * - constitution:get 등 실제 자원 핸들러는 유효 토큰만 허용
 *
 * 순수 로직으로 분리하여 단위 테스트 가능 (now 주입으로 만료 검증).
 */

import crypto from 'crypto';

export const DEFAULT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5분

export class ApprovalGate {
  /**
   * @param {object} [opts]
   * @param {number} [opts.ttlMs] 토큰 유효시간(ms)
   * @param {string[]} [opts.whitelist] 사전 승인 요청자 목록
   * @param {() => number} [opts.now] 현재시각 공급자 (테스트 주입용)
   */
  constructor({ ttlMs = DEFAULT_TOKEN_TTL_MS, whitelist = [], now = () => Date.now() } = {}) {
    this.ttlMs = ttlMs;
    this.whitelist = new Set(whitelist);
    this.now = now;
    this.tokens = new Map(); // token -> { requestor, issuedAt, expiresAt }
    this.pending = new Map(); // requestId -> { requestor, timestamp, approved }
  }

  isWhitelisted(requestor) {
    return this.whitelist.has(requestor);
  }

  /**
   * 접근 요청. 화이트리스트는 즉시 토큰, 그 외는 pending requestId 반환.
   * @returns {{approved: true, token: string} | {approved: false, requestId: string}}
   */
  requestAccess(requestor) {
    if (!requestor) throw new Error('requestor is required');
    if (this.isWhitelisted(requestor)) {
      return { approved: true, token: this._issueToken(requestor) };
    }
    const requestId = crypto.randomUUID();
    this.pending.set(requestId, { requestor, timestamp: this.now(), approved: false });
    return { approved: false, requestId };
  }

  /**
   * pending 요청 승인 (의장/UI 승인 후 호출). 토큰 발급.
   */
  approve(requestId) {
    const entry = this.pending.get(requestId);
    if (!entry) throw new Error('Unknown or already-resolved requestId');
    entry.approved = true;
    this.pending.delete(requestId);
    return this._issueToken(entry.requestor);
  }

  /**
   * pending 요청 거부.
   */
  deny(requestId) {
    return this.pending.delete(requestId);
  }

  _issueToken(requestor) {
    const token = crypto.randomBytes(32).toString('hex');
    const issuedAt = this.now();
    this.tokens.set(token, { requestor, issuedAt, expiresAt: issuedAt + this.ttlMs });
    return token;
  }

  isExpired(token) {
    const entry = this.tokens.get(token);
    if (!entry) return true;
    return this.now() >= entry.expiresAt;
  }

  /**
   * 토큰 검증: 존재하며 만료되지 않아야 함. 만료 토큰은 자동 폐기.
   */
  verify(token) {
    const entry = this.tokens.get(token);
    if (!entry) return false;
    if (this.now() >= entry.expiresAt) {
      this.tokens.delete(token);
      return false;
    }
    return true;
  }

  revoke(token) {
    return this.tokens.delete(token);
  }

  /**
   * 만료 토큰 일괄 정리.
   */
  prune() {
    const t = this.now();
    let removed = 0;
    for (const [token, entry] of this.tokens) {
      if (t >= entry.expiresAt) {
        this.tokens.delete(token);
        removed += 1;
      }
    }
    return removed;
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
