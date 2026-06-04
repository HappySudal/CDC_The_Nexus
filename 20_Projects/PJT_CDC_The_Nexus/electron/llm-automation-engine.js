/**
 * LLM Automation Engine (Playwright 기반)
 *
 * 5개 LLM (Claude, ChatGPT, Gemini, Perplexity, Grok)을 자동 제어하는 엔진
 * CDC 대시보드 server.py의 Python FastAPI 로직을 Node.js + Playwright로 포팅
 *
 * 기능:
 * - 병렬 브라우저 인스턴스 관리 (3+2 적응형 로딩)
 * - 입력 필드 자동 감지 (Shadow DOM, React Event)
 * - 응답 텍스트 자동 추출
 * - 사용자 프로필 저장 (로그인 상태 유지)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

class LLMAutomationEngine {
  constructor() {
    this.playwright = null;
    this.contexts = {}; // { llmId: BrowserContext }
    this.pages = {}; // { llmId: Page }
    this.profiles = {}; // { llmId: profilePath }

    // LLM 설정 (CDC 대시보드에서 이식)
    this.llmConfigs = {
      claude: {
        name: 'Claude',
        url: 'https://claude.ai/new',
        color: '#cc785c',
        inputSelectors: [
          'div.ProseMirror[contenteditable="true"]',
          'div[contenteditable="true"]',
        ],
        responseSelectors: [
          '.font-claude-message',
          '[data-is-streaming]',
          '.prose',
        ],
        stopSelectors: ['button[aria-label="Stop"]', 'button:has-text("Stop")'],
      },
      chatgpt: {
        name: 'ChatGPT',
        url: 'https://chatgpt.com/',
        color: '#10a37f',
        inputSelectors: [
          '#prompt-textarea',
          'textarea[placeholder]',
        ],
        responseSelectors: [
          '[data-message-author-role="assistant"] .markdown',
          '[data-message-author-role="assistant"]',
          '.markdown.prose',
        ],
        stopSelectors: ['button[aria-label="Stop streaming"]', 'button[data-testid="stop-button"]'],
      },
      gemini: {
        name: 'Gemini',
        url: 'https://gemini.google.com/',
        color: '#4285f4',
        inputSelectors: [
          '.ql-editor',
          'rich-textarea .ql-editor',
          'div[contenteditable="true"]',
        ],
        responseSelectors: [
          'model-response .response-content',
          '.response-content',
          'message-content',
        ],
        stopSelectors: ['button.stop-button', 'mat-icon:has-text("stop")'],
      },
      perplexity: {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/',
        color: '#20b2aa',
        inputSelectors: [
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Search"]',
          'textarea[placeholder]',
          'textarea',
          '[contenteditable="true"]',
        ],
        responseSelectors: [
          '.prose',
          '.answer-text',
          "[data-testid='answer']",
          '.whitespace-pre-wrap',
          "[class*='answer']",
          "[class*='response']",
        ],
        stopSelectors: [
          'button[aria-label="Stop"]',
          'button[aria-label="중단"]',
          'button:has-text("Stop")',
        ],
      },
      grok: {
        name: 'Grok',
        url: 'https://grok.com/',
        color: '#e7e7e7',
        inputSelectors: [
          'textarea[placeholder*="Ask"]',
          'textarea',
          'div[contenteditable="true"]',
        ],
        responseSelectors: [
          '.message-bubble',
          '.response-text',
          "[data-testid='message']",
        ],
        stopSelectors: ['button[aria-label="Stop"]'],
      },
    };
  }

  /**
   * 엔진 초기화 및 브라우저 스핀업
   * 3+2 적응형 로딩: 즉시 3개 + 2초 후 나머지 2개
   */
  async initialize() {
    console.log('[LLMAutomationEngine] 초기화 시작...');

    try {
      this.playwright = await chromium.launchPersistentContext(
        await this.getProfileDir('root'),
        {
          headless: false,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--window-size=900,700',
          ],
          viewport: { width: 900, height: 700 },
        }
      );

      // Phase 1: 즉시 3개 LLM 로드
      const priorityLLMs = ['claude', 'chatgpt', 'gemini'];
      for (const llmId of priorityLLMs) {
        await this.activateBrowser(llmId);
      }
      console.log('[LLMAutomationEngine] Phase 1 완료: 3개 LLM 활성화');

      // Phase 2: 2초 후 나머지 2개 백그라운드 로드
      setTimeout(async () => {
        const delayedLLMs = ['perplexity', 'grok'];
        for (const llmId of delayedLLMs) {
          await this.activateBrowser(llmId);
        }
        console.log('[LLMAutomationEngine] Phase 2 완료: 2개 LLM 백그라운드 활성화');
      }, 2000);

      return { success: true, message: '엔진 초기화 완료' };
    } catch (error) {
      console.error('[LLMAutomationEngine] 초기화 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 특정 LLM 브라우저 활성화
   */
  async activateBrowser(llmId) {
    if (!this.llmConfigs[llmId]) {
      throw new Error(`Unknown LLM: ${llmId}`);
    }

    try {
      const config = this.llmConfigs[llmId];
      const profileDir = await this.getProfileDir(llmId);

      // 지속성 컨텍스트 생성 (로그인 상태 유지)
      const context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--window-size=900,700',
        ],
        viewport: { width: 900, height: 700 },
      });

      const page = context.pages[0] || (await context.newPage());

      // Automation 감지 우회
      await page.addInitScript("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})");

      // LLM URL로 네비게이트
      try {
        await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (error) {
        console.warn(`[${llmId}] 네비게이션 실패 (기존 세션 사용):`, error.message);
      }

      this.contexts[llmId] = context;
      this.pages[llmId] = page;
      this.profiles[llmId] = profileDir;

      console.log(`[${config.name}] 활성화 완료`);
      return { success: true, llmId, message: `${config.name} 활성화 완료` };
    } catch (error) {
      console.error(`[${llmId}] 활성화 실패:`, error);
      return { success: false, llmId, error: error.message };
    }
  }

  /**
   * 특정 LLM 브라우저 비활성화
   */
  async deactivateBrowser(llmId) {
    try {
      if (this.contexts[llmId]) {
        await this.contexts[llmId].close();
        delete this.contexts[llmId];
        delete this.pages[llmId];
      }

      console.log(`[${llmId}] 비활성화 완료`);
      return { success: true, llmId };
    } catch (error) {
      console.error(`[${llmId}] 비활성화 실패:`, error);
      return { success: false, llmId, error: error.message };
    }
  }

  /**
   * Phase 3: 오류 복구 로직을 포함한 메시지 전송
   */
  async sendMessage(llmId, text) {
    if (!this.pages[llmId]) {
      return { success: false, error: `${llmId} 브라우저가 활성화되지 않음` };
    }

    try {
      const page = this.pages[llmId];
      const config = this.llmConfigs[llmId];

      // Step 0: 사전 검사 - 로그인 만료 감지
      const isLoggedIn = await this._checkLoginStatus(page, llmId);
      if (!isLoggedIn) {
        return { success: false, error: '로그인 만료 (재로그인 필요)' };
      }

      // Step 1: 입력 필드 찾기 및 텍스트 입력
      const inputSuccess = await this._typeIntoField(page, config, text);
      if (!inputSuccess) {
        // 복구 시도: 페이지 새로고침 후 재시도
        console.warn(`[${llmId}] 입력 필드 실패, 페이지 새로고침 시도`);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const retrySuccess = await this._typeIntoField(page, config, text);
        if (!retrySuccess) {
          return { success: false, error: '입력 필드를 찾을 수 없음 (재시도 실패)' };
        }
      }

      // Step 2: 엔터 키 또는 전송 버튼 클릭
      await this._submitInput(page, config);

      // Step 3: 응답 대기 (최대 60초)
      const response = await this._waitForResponse(page, config);

      return {
        success: true,
        llmId,
        text: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[${llmId}] 메시지 전송 실패:`, error);

      // 네트워크 오류 복구 시도
      if (error.message.includes('timeout') || error.message.includes('net::')) {
        try {
          console.warn(`[${llmId}] 네트워크 오류 감지, 재연결 시도`);
          await this.pages[llmId].goto(this.llmConfigs[llmId].url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          return { success: false, error: '네트워크 오류 (재연결 후 재시도 필요)' };
        } catch (reconnectError) {
          return { success: false, error: `네트워크 오류 (재연결 실패: ${reconnectError.message})` };
        }
      }

      return { success: false, llmId, error: error.message };
    }
  }

  /**
   * Phase 3: 로그인 상태 확인
   */
  async _checkLoginStatus(page, llmId) {
    try {
      const isLoggedIn = await page.evaluate(() => {
        // 일반적인 로그인 확인 선택자
        const logoutButton = document.querySelector('[aria-label*="Log out"], [aria-label*="Sign out"], button:has-text("Logout"), button:has-text("Sign out")');
        const loginButton = document.querySelector('[aria-label*="Log in"], [aria-label*="Sign in"], button:has-text("Login"), button:has-text("Sign in")');

        return logoutButton !== null || !loginButton?.offsetParent;
      });

      if (!isLoggedIn) {
        console.warn(`[${llmId}] 로그인 상태 확인 실패`);
      }

      return isLoggedIn;
    } catch (error) {
      console.warn(`[${llmId}] 로그인 상태 확인 오류:`, error.message);
      return true; // 확실하지 않으면 계속 진행
    }
  }

  /**
   * Phase 3: 고급 입력 필드 감지 (내포된 iframe, 깊은 Shadow DOM 탐색)
   */
  async _typeIntoField(page, config, text) {
    try {
      // Step 1: 기본 입력 필드 찾기
      let success = await page.evaluate((selectors, inputText) => {
        function findInputInShadowDom(root, depth = 0, maxDepth = 5) {
          if (depth > maxDepth) return null;

          const sels = [
            'textarea[placeholder]',
            'textarea',
            'input[type="text"]',
            '[contenteditable="true"]',
          ];

          // 직접 자식 탐색
          for (const sel of sels) {
            const el = root.querySelector(sel);
            if (el && el.getBoundingClientRect().height > 0) return el;
          }

          // 깊은 Shadow DOM 탐색
          for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
              const found = findInputInShadowDom(el.shadowRoot, depth + 1, maxDepth);
              if (found) return found;
            }
          }

          return null;
        }

        const el = findInputInShadowDom(document);
        if (!el) return false;

        // Step 2: 포커스 및 클릭
        el.focus();
        el.click();

        // Step 3: React/Vue synthetic event 지원
        const proto = el.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value');

        if (setter && setter.set) {
          setter.set.call(el, inputText);
        } else {
          el.value = inputText;
        }

        // Step 4: 모든 가능한 이벤트 디스패치
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));

        return true;
      }, config.inputSelectors, text);

      if (!success) {
        // Fallback: Playwright의 기본 fill 메서드 사용
        const selector = config.inputSelectors[0];
        try {
          await page.fill(selector, text);
          success = true;
        } catch (e) {
          console.warn(`Fallback fill 실패 (${selector}):`, e.message);
        }
      }

      return success;
    } catch (error) {
      console.error('입력 필드 타입 실패:', error);
      return false;
    }
  }

  /**
   * 입력 제출 (엔터 또는 버튼 클릭)
   */
  async _submitInput(page, config) {
    try {
      // 엔터 키 또는 버튼 클릭으로 전송
      const submitSuccess = await page.evaluate(() => {
        const buttons = [
          document.querySelector('button[aria-label*="Send"]'),
          document.querySelector('button[aria-label*="submit"]'),
          document.querySelector('button:has-text("Send")'),
          document.querySelector('button:has-text("Submit")'),
        ];

        for (const btn of buttons) {
          if (btn) {
            btn.click();
            return true;
          }
        }

        // 버튼이 없으면 엔터 키
        const el = document.querySelector('[contenteditable], textarea, input');
        if (el) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
          return true;
        }

        return false;
      });

      if (!submitSuccess) {
        await page.press('textarea, input[type="text"], [contenteditable]', 'Enter');
      }
    } catch (error) {
      console.warn('전송 실패:', error.message);
    }
  }

  /**
   * Phase 3: 응답 스트리밍 감지 (최대 60초, 실시간 텍스트 수집)
   */
  async _waitForResponse(page, config, timeout = 60000) {
    const startTime = Date.now();
    let lastResponse = '';
    let noChangeCount = 0;

    while (Date.now() - startTime < timeout) {
      try {
        // Step 1: 응답 텍스트 추출 (깊은 탐색)
        const response = await page.evaluate((selectors) => {
          function extractText(root, depth = 0, maxDepth = 3) {
            if (depth > maxDepth) return '';

            for (const selector of selectors) {
              const el = root.querySelector(selector);
              if (el) {
                const text = el.textContent?.trim();
                if (text && text.length > 0) return text;
              }
            }

            // Shadow DOM에서도 탐색
            for (const el of root.querySelectorAll('*')) {
              if (el.shadowRoot) {
                const text = extractText(el.shadowRoot, depth + 1, maxDepth);
                if (text) return text;
              }
            }

            return '';
          }

          return extractText(document);
        }, config.responseSelectors);

        // Step 2: 응답 변화 감지
        if (response && response.length > 0) {
          if (response !== lastResponse) {
            lastResponse = response;
            noChangeCount = 0;
            console.log(`[응답 수집] ${response.substring(0, 50)}...`);
          } else {
            noChangeCount++;

            // 5초 이상 변화 없으면 완료로 간주
            if (noChangeCount >= 50) {
              return response;
            }
          }
        }

        // Step 3: 100ms 대기 후 재시도
        await page.waitForTimeout(100);
      } catch (error) {
        console.warn('[응답 수집] 오류:', error.message);
        await page.waitForTimeout(100);
      }
    }

    // 타임아웃 시에도 지금까지 수집한 응답 반환
    if (lastResponse) {
      console.warn('[응답 수집] 타임아웃 (부분 응답 반환)');
      return lastResponse;
    }

    throw new Error('응답 타임아웃 (응답 없음)');
  }

  /**
   * 프로필 디렉토리 경로 반환 (Synology Drive 또는 로컬)
   */
  async getProfileDir(llmId) {
    // TODO: Phase 4에서 Synology Drive 동기화 구현
    // 현재는 로컬 AppData 사용
    const appDataDir = path.join(os.homedir(), 'AppData', 'Local', 'CDC_LLM_Profiles');
    const profileDir = path.join(appDataDir, llmId);

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    return profileDir;
  }

  /**
   * 엔진 종료
   */
  async shutdown() {
    console.log('[LLMAutomationEngine] 종료 중...');

    try {
      for (const llmId of Object.keys(this.contexts)) {
        await this.contexts[llmId].close();
      }

      if (this.playwright) {
        await this.playwright.close();
      }

      console.log('[LLMAutomationEngine] 종료 완료');
      return { success: true };
    } catch (error) {
      console.error('[LLMAutomationEngine] 종료 실패:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 메모리 사용량 조회
   */
  getMemoryUsage() {
    return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  }

  /**
   * 현재 활성 브라우저 목록
   */
  getActiveBrowsers() {
    return Object.keys(this.contexts).map((llmId) => ({
      llmId,
      name: this.llmConfigs[llmId].name,
      isActive: true,
    }));
  }
}

module.exports = LLMAutomationEngine;
export default LLMAutomationEngine;

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
