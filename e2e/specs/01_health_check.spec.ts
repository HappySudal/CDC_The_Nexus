import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #01 — Health Check
 * The Nexus 앱이 부팅되고 메인 윈도우가 렌더링되는지 검증.
 * 다른 spec의 전제 조건.
 */
test.describe('Health Check', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    const launched = await launchNexus();
    app = launched.app;
    window = launched.window;
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('Electron 앱이 부팅되어야 한다', async () => {
    expect(app).toBeDefined();
    expect(window).toBeDefined();
  });

  test('메인 윈도우 타이틀이 The Nexus여야 한다', async () => {
    const title = await window.title();
    expect(title).toMatch(/Nexus/i);
  });

  test('루트 컨테이너 #app이 렌더링되어야 한다', async () => {
    // Vue가 #app에 마운트되고 App.vue 내부에도 id="app"이 있어 2개 매치 — 첫 번째(Vue 마운트 컨테이너) 사용
    const root = window.locator('#app').first();
    await expect(root).toBeVisible({ timeout: 10_000 });
  });

  test('App.vue 내부 nexus-container가 마운트되어야 한다', async () => {
    const container = window.locator('.nexus-container');
    await expect(container).toBeVisible({ timeout: 10_000 });
  });

  test('Vue 앱 마운트 후 오류 콘솔이 비어 있어야 한다', async () => {
    const errors: string[] = [];
    window.on('pageerror', (e) => errors.push(e.message));
    await window.waitForTimeout(1000);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
