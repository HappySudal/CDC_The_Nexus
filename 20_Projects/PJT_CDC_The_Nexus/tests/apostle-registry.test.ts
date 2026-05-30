import { describe, it, expect } from 'vitest';
import {
  APOSTLE_REGISTRY,
  findApostle,
  filterApostlesByTier,
} from '@/../electron/apostle-registry.js';

describe('APOSTLE_REGISTRY (D3.1)', () => {
  it('의장 + 13사도 총 14명을 포함해야 한다', () => {
    expect(APOSTLE_REGISTRY).toHaveLength(14);
  });

  it('id는 모두 고유해야 한다', () => {
    const ids = APOSTLE_REGISTRY.map(a => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('각 항목은 id/name/role/tier를 포함해야 한다', () => {
    for (const a of APOSTLE_REGISTRY) {
      expect(a).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        role: expect.any(String),
        tier: expect.any(Number),
      });
    }
  });

  it('tier 0은 정확히 1명(의장 sudal)이어야 한다', () => {
    const t0 = filterApostlesByTier(0);
    expect(t0).toHaveLength(1);
    expect(t0[0].id).toBe('sudal');
  });

  it('tier 1(내부 사도)은 8명이어야 한다', () => {
    expect(filterApostlesByTier(1)).toHaveLength(8);
  });

  it('tier 2(외부 AI)는 5명이어야 한다', () => {
    expect(filterApostlesByTier(2)).toHaveLength(5);
  });

  it('레지스트리는 동결되어야 한다 (의도치 않은 변경 차단)', () => {
    expect(Object.isFrozen(APOSTLE_REGISTRY)).toBe(true);
  });

  it('findApostle은 id 매칭 시 항목을 반환한다', () => {
    const seogi = findApostle('seogi');
    expect(seogi).not.toBeNull();
    expect(seogi?.name).toBe('서기');
  });

  it('findApostle은 미등록 id에 null을 반환한다', () => {
    expect(findApostle('unknown')).toBeNull();
  });

  it('의장(sudal)은 tier 0이며 Sovereign 역할이어야 한다', () => {
    const sudal = findApostle('sudal');
    expect(sudal?.tier).toBe(0);
    expect(sudal?.role).toMatch(/Sovereign/);
  });

  it('OpenClaude/Gemini/Grok/Perplexity/Ollama는 tier 2여야 한다', () => {
    const t2Ids = filterApostlesByTier(2).map(a => a.id).sort();
    expect(t2Ids).toEqual(['gemini', 'grok', 'ollama', 'openclaude', 'perplexity']);
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
