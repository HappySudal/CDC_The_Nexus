/**
 * Voice Context Manager
 * Phase 3-3: 음성-텍스트 변환 및 문맥 관리
 * - STT (Whisper) 통합
 * - TTS (Piper) 통합
 * - 음성 신뢰도 추적
 * - 발음 최적화
 */

export interface VoiceInput {
  id: string;
  audioBuffer: ArrayBuffer;
  duration: number; // ms
  sampleRate: number;
  confidence: number; // 0-100
  detectedLanguage: string;
  transcribedText: string;
  timestamp: Date;
}

export interface VoiceOutput {
  id: string;
  text: string;
  audioBuffer: ArrayBuffer;
  duration: number; // ms
  voiceProfile: 'neutral' | 'thoughtful' | 'urgent' | 'encouraging';
  playbackSpeed: number;
  timestamp: Date;
}

export interface VoiceSession {
  sessionId: string;
  startedAt: Date;
  inputs: VoiceInput[];
  outputs: VoiceOutput[];
  totalDuration: number;
  recognitionAccuracy: number;
  synthesisQuality: number;
}

export class VoiceContextManager {
  name = 'VoiceContextManager';
  description = '음성-텍스트 문맥 관리: STT + TTS + 신뢰도';

  private sessions: Map<string, VoiceSession> = new Map();
  private currentSessionId: string | null = null;

  // STT (Speech-to-Text) 설정
  private sttConfig = {
    engine: 'whisper', // 로컬 Whisper
    language: 'ko-KR',
    confidenceThreshold: 0.7,
  };

  // TTS (Text-to-Speech) 설정
  private ttsConfig = {
    engine: 'piper', // 로컬 Piper
    voice: 'ko_KR-google_noto-medium', // 한국어 음성
    rate: 1.0,
    pitch: 1.0,
  };

  /**
   * 음성 세션 시작
   */
  startVoiceSession(): string {
    const sessionId = `voice-session-${Date.now()}`;

    const session: VoiceSession = {
      sessionId,
      startedAt: new Date(),
      inputs: [],
      outputs: [],
      totalDuration: 0,
      recognitionAccuracy: 0,
      synthesisQuality: 0,
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    console.log(`\n🎤 음성 세션 시작: ${sessionId}`);
    console.log(`  STT 엔진: ${this.sttConfig.engine} (${this.sttConfig.language})`);
    console.log(`  TTS 엔진: ${this.ttsConfig.engine}`);

    return sessionId;
  }

  /**
   * STT: 음성-텍스트 변환
   */
  async speechToText(audioBuffer: ArrayBuffer, sampleRate: number = 16000): Promise<VoiceInput> {
    const sessionId = this.currentSessionId;
    if (!sessionId) {
      throw new Error('활성 음성 세션 없음');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('세션을 찾을 수 없음');
    }

    console.log(`  🎙️  STT 변환 중... (${(audioBuffer.byteLength / 1024).toFixed(1)}KB)`);

    // 시뮬레이션: 실제로는 Whisper 모델 실행
    const transcribedText = '이것은 STT 변환 결과입니다';
    const confidence = 0.85 + Math.random() * 0.15; // 85-100%
    const duration = (audioBuffer.byteLength / sampleRate / 2) * 1000; // ms

    const input: VoiceInput = {
      id: `input-${Date.now()}`,
      audioBuffer,
      duration,
      sampleRate,
      confidence: confidence * 100,
      detectedLanguage: 'ko-KR',
      transcribedText,
      timestamp: new Date(),
    };

    session.inputs.push(input);
    session.recognitionAccuracy = (session.recognitionAccuracy * (session.inputs.length - 1) + input.confidence) / session.inputs.length;

    console.log(`    ✅ STT 완료: "${transcribedText}" (${input.confidence.toFixed(0)}%)`);

    return input;
  }

  /**
   * TTS: 텍스트-음성 변환
   */
  async textToSpeech(text: string, voiceProfile: 'neutral' | 'thoughtful' | 'urgent' | 'encouraging' = 'neutral'): Promise<VoiceOutput> {
    const sessionId = this.currentSessionId;
    if (!sessionId) {
      throw new Error('활성 음성 세션 없음');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('세션을 찾을 수 없음');
    }

    console.log(`  🔊 TTS 합성 중... ("${text.substring(0, 50)}...")`);

    // 음성 프로필별 속도/톤 조정
    const profileSettings: { [key: string]: { rate: number; pitch: number } } = {
      neutral: { rate: 1.0, pitch: 1.0 },
      thoughtful: { rate: 0.9, pitch: 0.95 },
      urgent: { rate: 1.2, pitch: 1.1 },
      encouraging: { rate: 0.95, pitch: 1.05 },
    };

    const settings = profileSettings[voiceProfile];
    const playbackSpeed = settings.rate;

    // 시뮬레이션: 실제로는 Piper 모델 실행
    const estimatedDuration = (text.length / 10) * 1000 * (1 / playbackSpeed); // ms
    const audioBuffer = new ArrayBuffer(estimatedDuration * 32); // 32-bit PCM 추정

    const output: VoiceOutput = {
      id: `output-${Date.now()}`,
      text,
      audioBuffer,
      duration: estimatedDuration,
      voiceProfile,
      playbackSpeed,
      timestamp: new Date(),
    };

    session.outputs.push(output);
    session.synthesisQuality = Math.min(100, 85 + Math.random() * 15); // 85-100%

    console.log(`    ✅ TTS 완료 (${output.duration.toFixed(0)}ms, ${voiceProfile})`);

    return output;
  }

  /**
   * 신뢰도 기반 재확인
   */
  shouldConfirm(voiceInput: VoiceInput): boolean {
    return voiceInput.confidence < this.sttConfig.confidenceThreshold * 100;
  }

  /**
   * 음성 감정 분류 (톤 분석)
   */
  analyzeVoiceTone(text: string): 'urgent' | 'thoughtful' | 'curious' | 'directive' | 'neutral' {
    if (text.includes('!') || text.includes('빨리') || text.includes('즉시')) {
      return 'urgent';
    } else if (text.includes('?') || text.includes('어떻게')) {
      return 'curious';
    } else if (text.includes('생각') || text.includes('아이디어')) {
      return 'thoughtful';
    } else if (text.includes('해줘') || text.includes('부탁')) {
      return 'directive';
    } else {
      return 'neutral';
    }
  }

  /**
   * 세션 요약
   */
  getSessionSummary(sessionId?: string): {
    totalInputs: number;
    totalOutputs: number;
    totalDuration: number;
    recognitionAccuracy: number;
    synthesisQuality: number;
  } {
    const id = sessionId || this.currentSessionId;
    if (!id) {
      return { totalInputs: 0, totalOutputs: 0, totalDuration: 0, recognitionAccuracy: 0, synthesisQuality: 0 };
    }

    const session = this.sessions.get(id);
    if (!session) {
      return { totalInputs: 0, totalOutputs: 0, totalDuration: 0, recognitionAccuracy: 0, synthesisQuality: 0 };
    }

    const totalDuration = session.inputs.reduce((sum, i) => sum + i.duration, 0) +
                        session.outputs.reduce((sum, o) => sum + o.duration, 0);

    return {
      totalInputs: session.inputs.length,
      totalOutputs: session.outputs.length,
      totalDuration,
      recognitionAccuracy: session.recognitionAccuracy,
      synthesisQuality: session.synthesisQuality,
    };
  }

  /**
   * 음성 세션 종료
   */
  endVoiceSession(sessionId?: string): VoiceSession | null {
    const id = sessionId || this.currentSessionId;
    if (!id) {
      return null;
    }

    const session = this.sessions.get(id);
    if (session) {
      console.log(`\n✅ 음성 세션 종료: ${id}`);
      console.log(`  입력: ${session.inputs.length}회 (정확도: ${session.recognitionAccuracy.toFixed(0)}%)`);
      console.log(`  출력: ${session.outputs.length}회 (품질: ${session.synthesisQuality.toFixed(0)}%)`);
    }

    if (this.currentSessionId === id) {
      this.currentSessionId = null;
    }

    return session || null;
  }

  /**
   * 음성 설정 조회
   */
  getConfig(): { stt: typeof this.sttConfig; tts: typeof this.ttsConfig } {
    return {
      stt: { ...this.sttConfig },
      tts: { ...this.ttsConfig },
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
