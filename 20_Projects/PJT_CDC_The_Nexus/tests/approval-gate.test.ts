import { describe, it, expect, beforeEach } from 'vitest';
// @ts-ignore - plain JS module
import { ApprovalGate, DEFAULT_TOKEN_TTL_MS } from '../electron/approval-gate.js';

describe('ApprovalGate (P2-M2 IPC 승인 게이트)', () => {
  describe('화이트리스트 (사전 승인)', () => {
    it('화이트리스트 요청자는 즉시 토큰을 받는다', () => {
      const gate = new ApprovalGate({ whitelist: ['nexus-renderer'] });
      const res = gate.requestAccess('nexus-renderer');
      expect(res.approved).toBe(true);
      expect(typeof res.token).toBe('string');
      expect(gate.verify(res.token)).toBe(true);
    });

    it('미승인 요청자는 토큰 없이 pending requestId를 받는다', () => {
      const gate = new ApprovalGate({ whitelist: ['nexus-renderer'] });
      const res = gate.requestAccess('discord-bot');
      expect(res.approved).toBe(false);
      expect(res.token).toBeUndefined();
      expect(typeof res.requestId).toBe('string');
    });

    it('requestor 누락 시 오류', () => {
      const gate = new ApprovalGate();
      expect(() => gate.requestAccess('')).toThrow();
    });
  });

  describe('승인 흐름', () => {
    it('pending 요청을 승인하면 유효 토큰이 발급된다', () => {
      const gate = new ApprovalGate();
      const { requestId } = gate.requestAccess('discord-bot');
      const token = gate.approve(requestId);
      expect(gate.verify(token)).toBe(true);
    });

    it('승인된 requestId는 재사용 불가', () => {
      const gate = new ApprovalGate();
      const { requestId } = gate.requestAccess('discord-bot');
      gate.approve(requestId);
      expect(() => gate.approve(requestId)).toThrow();
    });

    it('알 수 없는 requestId 승인 시 오류', () => {
      const gate = new ApprovalGate();
      expect(() => gate.approve('nonexistent')).toThrow();
    });

    it('거부된 요청은 승인 불가', () => {
      const gate = new ApprovalGate();
      const { requestId } = gate.requestAccess('discord-bot');
      expect(gate.deny(requestId)).toBe(true);
      expect(() => gate.approve(requestId)).toThrow();
    });
  });

  describe('토큰 검증 및 만료', () => {
    it('알 수 없는 토큰은 검증 실패', () => {
      const gate = new ApprovalGate();
      expect(gate.verify('deadbeef')).toBe(false);
      expect(gate.isExpired('deadbeef')).toBe(true);
    });

    it('TTL 경과 후 토큰은 만료된다', () => {
      let clock = 1_000_000;
      const gate = new ApprovalGate({ ttlMs: 1000, whitelist: ['x'], now: () => clock });
      const { token } = gate.requestAccess('x');
      expect(gate.verify(token)).toBe(true);
      clock += 999;
      expect(gate.verify(token)).toBe(true); // 아직 유효
      clock += 1; // 정확히 TTL 도달
      expect(gate.verify(token)).toBe(false);
      expect(gate.isExpired(token)).toBe(true);
    });

    it('만료 토큰은 verify 시 자동 폐기된다', () => {
      let clock = 0;
      const gate = new ApprovalGate({ ttlMs: 10, whitelist: ['x'], now: () => clock });
      const { token } = gate.requestAccess('x');
      clock = 100;
      expect(gate.verify(token)).toBe(false);
      expect(gate.tokens.has(token)).toBe(false);
    });

    it('revoke된 토큰은 검증 실패', () => {
      const gate = new ApprovalGate({ whitelist: ['x'] });
      const { token } = gate.requestAccess('x');
      expect(gate.revoke(token)).toBe(true);
      expect(gate.verify(token)).toBe(false);
    });

    it('기본 TTL은 5분', () => {
      expect(DEFAULT_TOKEN_TTL_MS).toBe(5 * 60 * 1000);
    });
  });

  describe('동시 요청', () => {
    it('동시 다발 요청은 서로 다른 토큰을 발급한다', () => {
      const gate = new ApprovalGate({ whitelist: ['x'] });
      const tokens = new Set();
      for (let i = 0; i < 50; i++) {
        tokens.add(gate.requestAccess('x').token);
      }
      expect(tokens.size).toBe(50);
    });

    it('prune는 만료 토큰만 제거한다', () => {
      let clock = 0;
      const gate = new ApprovalGate({ ttlMs: 100, whitelist: ['x'], now: () => clock });
      const a = gate.requestAccess('x').token;
      clock = 50;
      const b = gate.requestAccess('x').token; // expires at 150
      clock = 120; // a 만료(100), b 유효(150)
      expect(gate.prune()).toBe(1);
      expect(gate.verify(a)).toBe(false);
      expect(gate.verify(b)).toBe(true);
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
