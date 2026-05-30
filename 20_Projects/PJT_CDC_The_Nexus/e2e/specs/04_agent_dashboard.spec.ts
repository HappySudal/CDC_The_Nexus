import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #04 — Agent Dashboard Flow (App.vue 인라인 그리드 대상)
 * 사이드바 "🤖 15사도" 탭 → 카드 클릭 → 상세 패널 → 닫기
 * 주의: AgentDashboard.vue 컴포넌트는 App.vue가 사용하지 않음 (단위 테스트 전용).
 *      실제 UI는 App.vue 내장 `.agents-section .agents-grid .agent-card` 사용.
 */
test.describe('Agent Dashboard Flow (inline)', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    ({ app, window } = await launchNexus());
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('사이드바 "🤖 15사도" 메뉴 클릭 시 agents-section이 보여야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '15사도' });
    await menu.click();
    const section = window.locator('.agents-section');
    await expect(section).toBeVisible({ timeout: 10_000 });
  });

  test('에이전트 카드가 1개 이상 렌더링되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '15사도' });
    await menu.click();
    const cards = window.locator('.agents-grid .agent-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('카드 클릭 시 상세 패널이 열리고 닫기로 사라져야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '15사도' });
    await menu.click();

    const firstCard = window.locator('.agents-grid .agent-card').first();
    await firstCard.click();

    const detail = window.locator('.agent-detail-panel');
    await expect(detail).toBeVisible({ timeout: 5_000 });

    const closeBtn = window.locator('.agent-detail-panel button', { hasText: '닫기' });
    await closeBtn.click();
    await expect(detail).toBeHidden({ timeout: 5_000 });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
