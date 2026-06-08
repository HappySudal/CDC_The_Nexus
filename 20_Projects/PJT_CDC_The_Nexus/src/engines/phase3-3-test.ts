/**
 * Phase 3-3 Integration Test
 * 음성 통신 활성화 검증
 * - STT/TTS 실시간 처리
 * - 음성 문맥 유지
 * - 긴급 상황 감지
 * - 완전한 음성 대화 흐름
 */

import { VoiceEngine } from './voice/voice-engine';
import { VoiceContextManager } from './phase3/voice-context-manager';
import { EmergencyDetector } from './phase3/emergency-detector';

export interface Phase33TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

export class Phase33Test {
  name = 'Phase3-3Test';
  description = '음성 통신 활성화 검증';

  private voice: VoiceEngine | null = null;
  private contextManager: VoiceContextManager | null = null;
  private emergencyDetector: EmergencyDetector | null = null;

  /**
   * Phase 3-3 테스트 실행
   */
  async run(): Promise<Phase33TestResult[]> {
    console.log('\n🧪 Phase 3-3: 음성 통신 활성화 테스트 시작\n');

    const results: Phase33TestResult[] = [];

    try {
      // Setup
      this.voice = new VoiceEngine();
      this.contextManager = new VoiceContextManager();
      this.emergencyDetector = new EmergencyDetector();

      const voiceOk = await this.voice.initialize();
      if (!voiceOk) {
        throw new Error('음성 엔진 초기화 실패');
      }

      // Test 1: 음성 세션 시작
      console.log('📋 Test 1: 음성 세션 시작');
      results.push(await this.testVoiceSessionStart());

      // Test 2: STT (음성-텍스트)
      console.log('\n📋 Test 2: STT (음성-텍스트) 변환');
      results.push(await this.testSpeechToText());

      // Test 3: TTS (텍스트-음성)
      console.log('\n📋 Test 3: TTS (텍스트-음성) 합성');
      results.push(await this.testTextToSpeech());

      // Test 4: 음성 신뢰도 추적
      console.log('\n📋 Test 4: 음성 신뢰도 추적');
      results.push(await this.testConfidenceTracking());

      // Test 5: 긴급 상황 감지 (키워드)
      console.log('\n📋 Test 5: 긴급 상황 감지');
      results.push(await this.testEmergencyDetection());

      // Test 6: 음성 문맥 유지
      console.log('\n📋 Test 6: 음성 문맥 유지');
      results.push(await this.testVoiceContextMaintenance());

      // Test 7: 완전한 음성 대화 흐름
      console.log('\n📋 Test 7: 완전한 음성 대화 흐름');
      results.push(await this.testFullVoiceConversation());
    } catch (err) {
      console.error('❌ 테스트 중 심각한 오류:', err);
    }

    // 결과 출력
    this.printResults(results);

    return results;
  }

  /**
   * Test 1: 음성 세션 시작
   */
  private async testVoiceSessionStart(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager) {
        throw new Error('컨텍스트 매니저 초기화 필요');
      }

      const sessionId = this.contextManager.startVoiceSession();

      if (!sessionId) {
        throw new Error('세션 생성 실패');
      }

      console.log('  ✅ 음성 세션 시작 완료');

      return {
        testName: '음성 세션 시작',
        passed: true,
        duration: Date.now() - start,
        details: `세션 ID: ${sessionId}`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: '음성 세션 시작',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 2: STT (음성-텍스트)
   */
  private async testSpeechToText(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager) {
        throw new Error('컨텍스트 매니저 초기화 필요');
      }

      // 시뮬레이션 오디오 버퍼
      const audioBuffer = new ArrayBuffer(16000 * 2 * 3); // 3초, 16kHz, 16-bit

      const voiceInput = await this.contextManager.speechToText(audioBuffer, 16000);

      if (!voiceInput || !voiceInput.transcribedText) {
        throw new Error('STT 변환 실패');
      }

      console.log('  ✅ STT 변환 완료');

      return {
        testName: 'STT (음성-텍스트)',
        passed: true,
        duration: Date.now() - start,
        details: `텍스트: "${voiceInput.transcribedText}" (신뢰도: ${voiceInput.confidence.toFixed(0)}%)`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: 'STT (음성-텍스트)',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 3: TTS (텍스트-음성)
   */
  private async testTextToSpeech(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager) {
        throw new Error('컨텍스트 매니저 초기화 필요');
      }

      const responseText = '의장님의 지시를 처리하겠습니다';

      const voiceOutput = await this.contextManager.textToSpeech(responseText, 'neutral');

      if (!voiceOutput || voiceOutput.duration <= 0) {
        throw new Error('TTS 합성 실패');
      }

      console.log('  ✅ TTS 합성 완료');

      return {
        testName: 'TTS (텍스트-음성)',
        passed: true,
        duration: Date.now() - start,
        details: `음성 길이: ${voiceOutput.duration.toFixed(0)}ms, 프로필: ${voiceOutput.voiceProfile}`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: 'TTS (텍스트-음성)',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 4: 음성 신뢰도 추적
   */
  private async testConfidenceTracking(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager) {
        throw new Error('컨텍스트 매니저 초기화 필요');
      }

      const summary = this.contextManager.getSessionSummary();

      if (summary.totalInputs === 0) {
        throw new Error('입력 없음');
      }

      if (summary.recognitionAccuracy < 0 || summary.recognitionAccuracy > 100) {
        throw new Error('신뢰도 범위 초과');
      }

      console.log('  ✅ 신뢰도 추적 완료');

      return {
        testName: '음성 신뢰도 추적',
        passed: true,
        duration: Date.now() - start,
        details: `정확도: ${summary.recognitionAccuracy.toFixed(0)}% | 품질: ${summary.synthesisQuality.toFixed(0)}%`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: '음성 신뢰도 추적',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 5: 긴급 상황 감지
   */
  private async testEmergencyDetection(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.emergencyDetector) {
        throw new Error('긴급 감지기 초기화 필요');
      }

      const testMessages = [
        '시스템이 다운되었습니다. 긴급 복구가 필요합니다!',
        '새로운 기능을 추가해줄 수 있을까요?',
        '침해 공격이 감지되었습니다. 즉시 대응하세요!',
      ];

      let emergencyCount = 0;
      for (const message of testMessages) {
        const alert = this.emergencyDetector.analyze(message);
        if (alert) {
          emergencyCount += 1;
        }
      }

      if (emergencyCount === 0) {
        throw new Error('긴급 상황 감지 실패');
      }

      console.log('  ✅ 긴급 상황 감지 완료');

      return {
        testName: '긴급 상황 감지',
        passed: true,
        duration: Date.now() - start,
        details: `${emergencyCount}/${testMessages.length}개 긴급 상황 감지`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: '긴급 상황 감지',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 6: 음성 문맥 유지
   */
  private async testVoiceContextMaintenance(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager) {
        throw new Error('컨텍스트 매니저 초기화 필요');
      }

      const summary = this.contextManager.getSessionSummary();

      if (summary.totalInputs === 0 || summary.totalOutputs === 0) {
        throw new Error('문맥 정보 부족');
      }

      console.log('  ✅ 음성 문맥 유지 확인');

      return {
        testName: '음성 문맥 유지',
        passed: true,
        duration: Date.now() - start,
        details: `입력: ${summary.totalInputs} | 출력: ${summary.totalOutputs} | 총 시간: ${(summary.totalDuration / 1000).toFixed(1)}s`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: '음성 문맥 유지',
        passed: false,
        duration: Date.now() - start,
        details: '',
        error: String(err),
      };
    }
  }

  /**
   * Test 7: 완전한 음성 대화 흐름
   */
  private async testFullVoiceConversation(): Promise<Phase33TestResult> {
    const start = Date.now();
    try {
      if (!this.contextManager || !this.emergencyDetector) {
        throw new Error('엔진 초기화 필요');
      }

      // 음성 입력
      const audioBuffer = new ArrayBuffer(16000 * 2 * 2);
      const input = await this.contextManager.speechToText(audioBuffer);

      // 응답 생성
      const responseText = '당신의 요청을 처리했습니다';
      const output = await this.contextManager.textToSpeech(responseText);

      // 긴급 여부 확인
      const alert = this.emergencyDetector.analyze(input.transcribedText);

      if (!input || !output) {
        throw new Error('흐름 처리 실패');
      }

      console.log('  ✅ 완전한 음성 대화 흐름 완료');

      return {
        testName: '완전한 음성 대화 흐름',
        passed: true,
        duration: Date.now() - start,
        details: `입력→처리→응답→긴급감지 완성`,
      };
    } catch (err) {
      console.log(`  ❌ 실패: ${err}`);
      return {
        testName: '완전한 음성 대화 흐름',
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
  private printResults(results: Phase33TestResult[]): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 Phase 3-3 테스트 결과');
    console.log('='.repeat(70));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.duration}ms`);
      if (result.details) {
        console.log(`   └─ ${result.details}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ 통과: ${passed}/${total}`);
    console.log(`❌ 실패: ${total - passed}/${total}`);
    console.log(`📈 성공률: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
  }
}

// CLI 실행
if (require.main === module) {
  (async () => {
    const test = new Phase33Test();
    const results = await test.run();
    process.exit(results.every(r => r.passed) ? 0 : 1);
  })().catch(console.error);
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
