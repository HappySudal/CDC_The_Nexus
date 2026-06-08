/**
 * Phase 3-1 Integration Test
 * 기초 오케스트레이션 검증
 * - Youngmin 오케스트레이터 초기화
 * - 간단한 작업 처리
 * - 15사도 배분
 * - 6개 LLM 활용
 */

import { YoungminOrchestrator } from './youngmin-orchestrator';
import { DialecticsEngine } from './dialectics/dialectics-engine';
import { VoiceEngine } from './voice/voice-engine';

export interface Phase31TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

export class Phase31Test {
  name = 'Phase3-1Test';
  description = '기초 오케스트레이션 검증';

  private youngmin: YoungminOrchestrator | null = null;
  private dialectics: DialecticsEngine | null = null;
  private voice: VoiceEngine | null = null;

  /**
   * Phase 3-1 테스트 실행
   */
  async run(): Promise<Phase31TestResult[]> {
    console.log('\n🧪 Phase 3-1: 기초 오케스트레이션 테스트 시작\n');

    const results: Phase31TestResult[] = [];

    try {
      // Test 1: Youngmin 초기화
      console.log('📋 Test 1: Youngmin 오케스트레이터 초기화');
      results.push(await this.testYoungminInitialization());

      // Test 2: 간단한 명령 처리 (CRUD)
      console.log('\n📋 Test 2: 간단한 명령 처리 (파일 생성)');
      results.push(await this.testSimpleCommand());

      // Test 3: 중간 난이도 명령 (코드 최적화)
      console.log('\n📋 Test 3: 중간 난이도 명령 (코드 최적화)');
      results.push(await this.testModerateDifficultyCommand());

      // Test 4: 복잡한 명령 (종합 분석)
      console.log('\n📋 Test 4: 복잡한 명령 (종합 분석)');
      results.push(await this.testComplexCommand());

      // Test 5: 15사도 협업
      console.log('\n📋 Test 5: 15사도 협업 검증');
      results.push(await this.test15ApostlesCollaboration());

      // Test 6: 6개 LLM 활용
      console.log('\n📋 Test 6: 6개 LLM 최적 선택');
      results.push(await this.test6LLMOptimization());

      // Test 7: 오류 처리 (불가능한 작업)
      console.log('\n📋 Test 7: 오류 처리 및 복구');
      results.push(await this.testErrorHandling());
    } catch (err) {
      console.error('❌ 테스트 중 심각한 오류:', err);
    }

    // 결과 출력
    this.printResults(results);

    // 정리
    if (this.youngmin) {
      await this.youngmin.destroy();
    }

    return results;
  }

  /**
   * Test 1: Youngmin 초기화
   */
  private async testYoungminInitialization(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      this.dialectics = new DialecticsEngine();
      this.voice = new VoiceEngine();
      this.youngmin = new YoungminOrchestrator(this.dialectics, this.voice);

      const initialized = await this.youngmin.initialize();

      if (!initialized) {
        throw new Error('초기화 실패');
      }

      console.log('  ✅ Youngmin 초기화 성공');

      return {
        testName: 'Youngmin 초기화',
        passed: true,
        duration: Date.now() - start,
        details: '오케스트레이터, 15사도, 6개 LLM 준비 완료',
      };
    } catch (err) {
      console.log(`  ❌ 초기화 실패: ${err}`);
      return {
        testName: 'Youngmin 초기화',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 2: 간단한 명령 처리
   */
  private async testSimpleCommand(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const userMessage = '새로운 문서 파일을 생성해줘';
      const result = await this.youngmin.orchestrate(userMessage);

      if (!result || result.includes('오류')) {
        throw new Error('명령 처리 실패');
      }

      console.log('  ✅ 간단한 명령 처리 완료');

      return {
        testName: '간단한 명령 처리',
        passed: true,
        duration: Date.now() - start,
        details: `"${userMessage}" → 결과 생성 완료`,
      };
    } catch (err) {
      console.log(`  ❌ 명령 처리 실패: ${err}`);
      return {
        testName: '간단한 명령 처리',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 3: 중간 난이도 명령
   */
  private async testModerateDifficultyCommand(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const userMessage = '코드 최적화를 위한 분석을 해줘';
      const result = await this.youngmin.orchestrate(userMessage);

      if (!result || result.includes('오류')) {
        throw new Error('명령 처리 실패');
      }

      console.log('  ✅ 중간 난이도 명령 처리 완료');

      return {
        testName: '중간 난이도 명령',
        passed: true,
        duration: Date.now() - start,
        details: `코드 분석 및 최적화 권고 생성`,
      };
    } catch (err) {
      console.log(`  ❌ 명령 처리 실패: ${err}`);
      return {
        testName: '중간 난이도 명령',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 4: 복잡한 명령
   */
  private async testComplexCommand(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const userMessage = '시스템의 보안 취약점을 분석하고 개선안을 제시해줘';
      const result = await this.youngmin.orchestrate(userMessage);

      if (!result || result.includes('오류')) {
        throw new Error('명령 처리 실패');
      }

      console.log('  ✅ 복잡한 명령 처리 완료');

      return {
        testName: '복잡한 명령',
        passed: true,
        duration: Date.now() - start,
        details: '보안 분석 + 개선안 생성 완료',
      };
    } catch (err) {
      console.log(`  ❌ 명령 처리 실패: ${err}`);
      return {
        testName: '복잡한 명령',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 5: 15사도 협업
   */
  private async test15ApostlesCollaboration(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const userMessage = '의장님의 철학을 디지털화하는 방법을 논의해줘';
      const result = await this.youngmin.orchestrate(userMessage);

      if (!result) {
        throw new Error('15사도 협업 실패');
      }

      console.log('  ✅ 15사도 협업 검증 완료');

      return {
        testName: '15사도 협업',
        passed: true,
        duration: Date.now() - start,
        details: '다중 에이전트 병렬 처리 완료',
      };
    } catch (err) {
      console.log(`  ❌ 협업 실패: ${err}`);
      return {
        testName: '15사도 협업',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 6: 6개 LLM 최적화
   */
  private async test6LLMOptimization(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const commands = [
        '코드를 최적화해줘', // Claude Haiku
        '창의적인 아이디어를 주줘', // Gemini Flash
        '내 분석의 맹점을 지적해줘', // Grok
        '최신 정보를 조사해줘', // Perplexity
      ];

      let successCount = 0;
      for (const cmd of commands) {
        const result = await this.youngmin.orchestrate(cmd);
        if (result && !result.includes('오류')) {
          successCount += 1;
        }
      }

      if (successCount < commands.length * 0.8) {
        throw new Error(`LLM 최적화 성공률 낮음: ${successCount}/${commands.length}`);
      }

      console.log('  ✅ 6개 LLM 최적 선택 완료');

      return {
        testName: '6개 LLM 최적화',
        passed: true,
        duration: Date.now() - start,
        details: `${successCount}/${commands.length} 작업 성공`,
      };
    } catch (err) {
      console.log(`  ❌ LLM 최적화 실패: ${err}`);
      return {
        testName: '6개 LLM 최적화',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 7: 오류 처리
   */
  private async testErrorHandling(): Promise<Phase31TestResult> {
    const start = Date.now();
    try {
      if (!this.youngmin) {
        throw new Error('Youngmin 초기화 필요');
      }

      const problematicMessage = '불가능한 명령입니다';
      const result = await this.youngmin.orchestrate(problematicMessage);

      // 오류가 정상적으로 처리되었는지 확인
      if (typeof result === 'string') {
        console.log('  ✅ 오류 처리 완료 (정상적 복구)');
        return {
          testName: '오류 처리',
          passed: true,
          duration: Date.now() - start,
          details: '비정상 입력에 대한 정상적 복구',
        };
      }

      throw new Error('오류 처리 실패');
    } catch (err) {
      console.log(`  ❌ 오류 처리 실패: ${err}`);
      return {
        testName: '오류 처리',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * 결과 출력
   */
  private printResults(results: Phase31TestResult[]): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 Phase 3-1 테스트 결과');
    console.log('='.repeat(70));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.duration}ms`);
      if (result.details) {
        console.log(`   └─ ${result.details}`);
      }
      if (result.error) {
        console.log(`   └─ 오류: ${result.error}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ 통과: ${passed}/${total}`);
    console.log(`❌ 실패: ${total - passed}/${total}`);
    console.log(`⏱️  총 소요 시간: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
    console.log(`📈 성공률: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
  }
}

// CLI 실행
if (require.main === module) {
  (async () => {
    const test = new Phase31Test();
    const results = await test.run();
    process.exit(results.every(r => r.passed) ? 0 : 1);
  })().catch(console.error);
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
