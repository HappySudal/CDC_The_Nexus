# 🚀 PATH A: Day 1 환경 설정 및 Gemini 자동화 프로토타입

**날짜**: Week 2, Day 1  
**목표**: Playwright 환경 설정 + Gemini 웹 자동화 기본 구현  
**예상 소요**: 8시간

---

## 📦 설치 체크리스트

### Node.js 패키지 설치

```bash
npm install --save-dev playwright @playwright/test
npm install --save axios dotenv winston
```

### Python 패키지 설치 (llama.cpp 준비)

```bash
pip install playwright~=1.40 pyaml selenium
pip install PyYAML pydantic loguru
```

### Playwright 브라우저 설치

```bash
npx playwright install chromium firefox webkit
```

---

## 🏗️ 프로젝트 구조

```
electron/
├── llm-provider-engine.js (기본 프레임워크)
├── playwright-config.js (NEW)
├── gemini-automation.js (NEW - Day 1)
├── automation-base.js (NEW - 공통 기반)
└── test/
    └── playwright-gemini.spec.js (NEW)
```

---

## 🎯 Day 1 작업

### Task 1: Playwright 설정 (2시간)

**파일**: `playwright-config.js`

```javascript
// Playwright 설정
export const playwrightConfig = {
  use: {
    headless: false, // 개발 중 브라우저 창 표시
    slowMo: 1000,    // 1초 딜레이 (자동화 추적 용이)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timeout: 30000
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true
  }
};
```

### Task 2: Automation Base Class (2시간)

**파일**: `automation-base.js`

공통 기능:
- 페이지 오픈/로그인
- 요소 대기 및 클릭
- 텍스트 입력/수집
- 오류 처리 및 재시도

```javascript
export class AutomationBase {
  constructor(browser, page) {
    this.browser = browser;
    this.page = page;
    this.logger = new Logger('Automation');
  }

  async waitAndClick(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
  }

  async fillInput(selector, text) {
    await this.page.fill(selector, text);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async withRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(2000);
      }
    }
  }
}
```

### Task 3: Gemini 자동화 프로토타입 (3시간)

**파일**: `gemini-automation.js`

```javascript
export class GeminiAutomation extends AutomationBase {
  async initialize() {
    // Gemini 웹사이트 오픈
    await this.page.goto('https://gemini.google.com');
    
    // 로그인 (이미 로그인된 경우 스킵)
    if (await this.page.locator('[aria-label="Sign in"]').isVisible()) {
      await this.login();
    }
    
    this.logger.info('✅ Gemini initialized');
  }

  async login() {
    // Google 계정 로그인 처리
    await this.page.click('[aria-label="Sign in"]');
    await this.page.fill('input[type="email"]', process.env.GOOGLE_EMAIL);
    await this.page.click('button[type="submit"]');
    
    // 비밀번호 입력
    await this.page.waitForTimeout(2000);
    await this.page.fill('input[type="password"]', process.env.GOOGLE_PASSWORD);
    await this.page.click('button[type="submit"]');
  }

  async sendPrompt(prompt) {
    // 메시지 입력 필드 찾기
    const inputSelector = '[contenteditable="true"], textarea[placeholder*="Ask"]';
    
    await this.withRetry(async () => {
      await this.page.fill(inputSelector, prompt);
      await this.page.press(inputSelector, 'Enter');
    });
    
    this.logger.info(`📤 Prompt sent: ${prompt.substring(0, 50)}...`);
  }

  async getResponse(timeout = 60000) {
    // 응답 수집 대기 (spinner 사라질 때까지)
    await this.page.waitForSelector('[class*="response"]', { timeout });
    
    // 응답 텍스트 추출
    const responseText = await this.page.evaluate(() => {
      const element = document.querySelector('[class*="response"]');
      return element ? element.textContent : null;
    });
    
    this.logger.info(`📥 Response received: ${responseText.substring(0, 100)}...`);
    return responseText;
  }

  async complete() {
    await this.browser.close();
  }
}
```

### Task 4: E2E 테스트 작성 (1시간)

**파일**: `test/playwright-gemini.spec.js`

```javascript
import { test, expect } from '@playwright/test';
import { GeminiAutomation } from '../gemini-automation.js';

test.describe('Gemini Automation', () => {
  let automation;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    automation = new GeminiAutomation(browser, page);
    await automation.initialize();
  });

  test('should send prompt and receive response', async () => {
    const prompt = 'What is 2+2?';
    await automation.sendPrompt(prompt);
    
    const response = await automation.getResponse();
    expect(response).toContain('4');
  });

  test('should handle multiple prompts', async () => {
    const prompts = [
      'Say hello',
      'What is AI?',
      'Explain machine learning'
    ];

    for (const prompt of prompts) {
      await automation.sendPrompt(prompt);
      const response = await automation.getResponse();
      expect(response.length).toBeGreaterThan(0);
    }
  });
});
```

---

## 🧪 테스트 실행

```bash
# Playwright 테스트 실행
npx playwright test test/playwright-gemini.spec.js

# UI 모드로 실행 (디버깅)
npx playwright test --ui
```

---

## ✅ Day 1 완료 기준

- [ ] Playwright 설정 완료 (playwright-config.js)
- [ ] AutomationBase 클래스 구현 (공통 기능)
- [ ] GeminiAutomation 프로토타입 완성 (로그인, 프롬프트, 응답)
- [ ] E2E 테스트 4개 이상 작성
- [ ] Gemini 자동화 테스트 통과 (✓ 4/4 시나리오)

---

## 🎯 Day 1 산출물

| 산출물 | 파일 | 라인 |
|:---|:---|:---:|
| Playwright 설정 | playwright-config.js | 20 |
| Automation 기반 | automation-base.js | 45 |
| Gemini 자동화 | gemini-automation.js | 80 |
| E2E 테스트 | test/playwright-gemini.spec.js | 50 |
| **합계** | - | **195** |

---

## 📋 다음 단계 (Day 2)

- Claude.ai 웹 자동화 (로그인 → 프롬프트 → 결과 파싱)
- ClaudeAutomation 클래스 구현
- Gemini vs Claude 응답 비교 테스트

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**  
**"Exists in the Moment, Vanishes in Time."**
