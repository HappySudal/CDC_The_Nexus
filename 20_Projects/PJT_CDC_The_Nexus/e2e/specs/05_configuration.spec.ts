import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #05 — Configuration Flow
 * 사이드바 "⚙️ 시스템 설정" 탭 → 테마 변경 → 저장 흐름
 */
test.describe('Configuration Flow', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    ({ app, window } = await launchNexus());
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('사이드바 "⚙️ 시스템 설정" 메뉴를 클릭하면 ConfigurationPanel이 보여야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '시스템 설정' });
    await menu.click();
    const panel = window.locator('.configuration-panel');
    await expect(panel).toBeVisible({ timeout: 10_000 });
  });

  test('초기 상태에서 저장 버튼이 비활성화되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '시스템 설정' });
    await menu.click();
    const saveBtn = window.locator('.btn-save');
    await expect(saveBtn).toBeDisabled();
  });

  test('테마 변경 시 저장 버튼이 활성화되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '시스템 설정' });
    await menu.click();

    const themeSelect = window.locator('.configuration-panel select').first();
    await themeSelect.selectOption('light');

    const saveBtn = window.locator('.btn-save');
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
