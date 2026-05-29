import { expect, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Global Vitest Setup — Constitution YAML 로드 및 테스트 환경 초기화
 * 모든 테스트 파일이 전역적으로 Constitution 규칙에 접근할 수 있도록 구성
 */

// Constitution YAML 전역 로드
let GLOBAL_CONSTITUTION: any = null;

try {
  const constitutionPath = path.resolve(
    __dirname,
    '../../../.cdc/CONSTITUTION.yaml'
  );

  if (fs.existsSync(constitutionPath)) {
    const constitutionContent = fs.readFileSync(constitutionPath, 'utf-8');
    GLOBAL_CONSTITUTION = yaml.load(constitutionContent);

    // 전역 변수로 노출 (모든 테스트에서 접근 가능)
    (globalThis as any).CONSTITUTION = GLOBAL_CONSTITUTION;

    console.log('✓ Constitution YAML loaded successfully');
  } else {
    console.warn(`⚠ Constitution YAML not found at ${constitutionPath}`);
    (globalThis as any).CONSTITUTION = null;
  }
} catch (error) {
  console.error('✗ Failed to load Constitution YAML:', error);
  (globalThis as any).CONSTITUTION = null;
}

// Mock electronAPI 전역 설정 (jsdom window 보존)
if (typeof window !== 'undefined') {
  Object.assign(window, {
    electronAPI: {
      getConstitution: vi.fn().mockResolvedValue(GLOBAL_CONSTITUTION),
      ollama: {
        getStatus: vi.fn().mockResolvedValue({
          online: true,
          version: '0.1.0',
          port: 11434,
          avgResponseTime: 0,
          lastResponseTime: 0,
          totalRequests: 0,
          successRate: 100,
          memoryUsage: 0,
          cpuUsage: 0,
          uptime: 0,
          memoryNodes: 0,
        }),
        listModels: vi.fn().mockResolvedValue([]),
      },
      graph: {
        getNodes: vi.fn().mockResolvedValue([]),
        getEdges: vi.fn().mockResolvedValue([]),
      },
    },
  });
  // navigator.onLine 속성 설정 (jsdom에서 getter-only일 수 있어 defineProperty로 안전하게 설정)
  if (window.navigator) {
    try {
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        configurable: true,
        writable: true,
      });
    } catch {
      // 일부 jsdom 버전에서는 onLine이 재정의 불가 — 무시
    }
  }
}

// 테스트 전역 설정
beforeEach(() => {
  // 각 테스트 시작 시 상태 초기화
  vi.clearAllMocks();
});

afterEach(() => {
  // 각 테스트 종료 시 정리
  vi.clearAllMocks();
});

// 테스트에서 Constitution 검증을 위한 헬퍼 함수
export function getConstitution() {
  return (globalThis as any).CONSTITUTION;
}

export function assertConstitutionLoaded() {
  const constitution = getConstitution();
  expect(constitution).toBeDefined();
  expect(constitution).not.toBeNull();
  return constitution;
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
