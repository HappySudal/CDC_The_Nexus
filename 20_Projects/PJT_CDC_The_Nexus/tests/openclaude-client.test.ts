import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenClaudeClient } from '@/../electron/openclaude-client.js';

const okResponse = (data: any, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    json: async () => data,
    text: async () => JSON.stringify(data),
  });

describe('OpenClaudeClient (D3.3)', () => {
  let nowVal = 1_000_000;
  const now = () => nowVal;

  beforeEach(() => {
    nowVal = 1_000_000;
  });

  it('미설정 상태에서 invoke는 NOT_CONFIGURED를 던진다', async () => {
    const c = new OpenClaudeClient({ apiKey: undefined, fetch: vi.fn(), now });
    await expect(c.invoke('hi')).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  });

  it('빈 prompt는 거부된다', async () => {
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: vi.fn(), now });
    await expect(c.invoke('')).rejects.toThrow(/non-empty/);
  });

  it('정상 호출 시 fetch가 Bearer 토큰과 함께 baseUrl/v1/complete로 가야 한다', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'hello there' }));
    const c = new OpenClaudeClient({
      apiKey: 'secret',
      baseUrl: 'http://x:9',
      fetch: fetchMock as any,
      now,
    });
    const r = await c.invoke('say hi');
    expect(r.response).toBe('hello there');
    expect(r.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://x:9/v1/complete',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      }),
    );
  });

  it('동일 prompt 재호출 시 캐시 hit (fetch 1회만)', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'cached-yes' }));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    const r1 = await c.invoke('Q');
    const r2 = await c.invoke('Q');
    expect(r1.cached).toBe(false);
    expect(r2.cached).toBe(true);
    expect(r2.response).toBe('cached-yes');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('캐시 TTL 만료 후 재호출 시 fetch 재실행', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({
      apiKey: 'k', fetch: fetchMock as any, now, cacheTtlMs: 1_000,
    });
    await c.invoke('Q');
    nowVal += 2_000;
    await c.invoke('Q');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('useCache=false면 캐시 우회', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    await c.invoke('Q');
    await c.invoke('Q', { useCache: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rate limit 초과 시 RATE_LIMITED 에러', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({
      apiKey: 'k', fetch: fetchMock as any, now, rateLimitPerMin: 2,
    });
    // 캐시 우회로 3번 시도 (3번째에서 차단)
    await c.invoke('Q1', { useCache: false });
    await c.invoke('Q2', { useCache: false });
    await expect(c.invoke('Q3', { useCache: false })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('1분 경과 후 rate limit 복원', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({
      apiKey: 'k', fetch: fetchMock as any, now, rateLimitPerMin: 1,
    });
    await c.invoke('Q1', { useCache: false });
    await expect(c.invoke('Q2', { useCache: false })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    nowVal += 61_000;
    await expect(c.invoke('Q3', { useCache: false })).resolves.toBeDefined();
  });

  it('HTTP 500 응답은 HTTP_ERROR로 매핑', async () => {
    const fetchMock = vi.fn(() => okResponse({ msg: 'boom' }, 500));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    await expect(c.invoke('Q')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 500,
    });
  });

  it('getMetrics는 invocation/cache/configured 상태 반환', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    await c.invoke('Q1');
    await c.invoke('Q2');
    const m = c.getMetrics();
    expect(m.invocationsLastMinute).toBe(2);
    expect(m.cacheSize).toBe(2);
    expect(m.configured).toBe(true);
  });

  it('clearCache는 캐시 비우기', async () => {
    const fetchMock = vi.fn(() => okResponse({ response: 'v' }));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    await c.invoke('Q');
    c.clearCache();
    expect(c.getMetrics().cacheSize).toBe(0);
  });

  it('payload.content fallback (response 없으면 content)', async () => {
    const fetchMock = vi.fn(() => okResponse({ content: 'fallback-text' }));
    const c = new OpenClaudeClient({ apiKey: 'k', fetch: fetchMock as any, now });
    const r = await c.invoke('Q');
    expect(r.response).toBe('fallback-text');
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
