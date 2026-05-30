import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #06 — Constitution Viewer Flow
 * 사이드바 "📜 헌법" 탭 → 헌법 로드 버튼 → 컨텐츠 표시 확인
 */
test.describe('Constitution Viewer Flow', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    ({ app, window } = await launchNexus());
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('사이드바 "📜 헌법" 메뉴 클릭 시 헌법 탭이 활성화되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '헌법' }).first();
    await menu.click();
    const heading = window.locator('h2', { hasText: '사령부 헌법' });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('헌법 로드 버튼이 표시되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '헌법' }).first();
    await menu.click();
    const loadBtn = window.locator('button.btn-primary', { hasText: '헌법 로드' });
    await expect(loadBtn).toBeVisible({ timeout: 5_000 });
  });

  test('로드 전 placeholder가 표시되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '헌법' }).first();
    await menu.click();
    const placeholder = window.locator('.constitution-viewer .placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5_000 });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
