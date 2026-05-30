import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * The Nexus Electron 앱 부팅 헬퍼
 * - 메인 프로세스 진입점: electron/main.js
 * - dev 서버를 띄우지 않고 vite build 산출물을 사용한다고 가정
 *   (E2E는 빌드 산출물 검증이 목적)
 */
export async function launchNexus(): Promise<{
  app: ElectronApplication;
  window: Page;
}> {
  const projectRoot = path.resolve(__dirname, '../..');
  const electronMain = path.resolve(projectRoot, 'electron/main.js');

  const app = await electron.launch({
    args: [electronMain],
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      NEXUS_E2E: '1',
    },
    timeout: 20_000,
  });

  const window = await app.firstWindow({ timeout: 15_000 });
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

export async function closeNexus(app: ElectronApplication): Promise<void> {
  if (app) {
    await app.close().catch(() => {});
  }
}

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
