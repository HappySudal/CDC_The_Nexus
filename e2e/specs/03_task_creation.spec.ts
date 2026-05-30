import { test, expect } from '@playwright/test';
import { launchNexus, closeNexus } from '../fixtures/electron';
import type { ElectronApplication, Page } from 'playwright';

/**
 * E2E #03 — Task Creation Flow (App.vue 인라인 form 대상)
 * 사이드바 "✅ 작업 관리" 탭 → 필수 필드 입력 → 작업 생성
 * 주의: TaskCreationForm.vue 컴포넌트는 App.vue가 사용하지 않음 (단위 테스트 전용).
 *      실제 UI는 App.vue 내장 `.task-section .task-form` 사용.
 */
test.describe('Task Creation Flow (inline)', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    ({ app, window } = await launchNexus());
  });

  test.afterAll(async () => {
    await closeNexus(app);
  });

  test('사이드바 "✅ 작업 관리" 메뉴를 클릭하면 task-form이 보여야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '작업 관리' });
    await menu.click();
    const form = window.locator('.task-section .task-form');
    await expect(form).toBeVisible({ timeout: 10_000 });
  });

  test('새 작업 form 헤딩이 표시되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '작업 관리' });
    await menu.click();
    const heading = window.locator('.task-form h3', { hasText: '새로운 작업 생성' });
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });

  test('제목과 설명 입력 후 form 상태가 유지되어야 한다', async () => {
    const menu = window.locator('.nav-menu li', { hasText: '작업 관리' });
    await menu.click();

    const titleInput = window.locator('.task-form input[type="text"]').first();
    await titleInput.fill('E2E 작업');
    await expect(titleInput).toHaveValue('E2E 작업');

    const descArea = window.locator('.task-form textarea').first();
    await descArea.fill('E2E 검증 작업');
    await expect(descArea).toHaveValue('E2E 검증 작업');
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
