import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #02 — Agent Command Flow
 * 사이드바 "🎯 도우미 명령" 탭 → 도우미 선택 → 명령어 입력 → 실행 → 응답 확인
 */
test.describe('Agent Command Flow', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    ({ app, window } = await launchNexus());
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('사이드바 "🎯 도우미 명령" 메뉴를 클릭하면 AgentCommandPanel이 보여야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '도우미 명령' });
    await menu.click();
    const panel = window.locator('.agent-command-panel');
    await expect(panel).toBeVisible({ timeout: 10_000 });
  });

  test('도우미를 선택하고 명령어를 입력하면 실행 버튼이 활성화되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '도우미 명령' });
    await menu.click();

    const select = window.locator('select#agent-select');
    await select.selectOption({ index: 1 });

    const textarea = window.locator('textarea#command-input');
    await textarea.fill('헬스 체크 명령');

    const executeBtn = window.locator('button.btn-execute');
    await expect(executeBtn).toBeEnabled();
  });

  test('초기화 버튼을 누르면 입력이 비워져야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '도우미 명령' });
    await menu.click();

    const textarea = window.locator('textarea#command-input');
    await textarea.fill('test input');
    await window.locator('button.btn-clear').click();

    await expect(textarea).toHaveValue('');
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
