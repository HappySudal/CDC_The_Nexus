/**
 * Voice Engine (Phase 2-4)
 * 음성-음성 실시간 대화 시스템
 * - WebRTC 오디오 캡처 및 스트리밍
 * - Whisper STT (음성 → 텍스트)
 * - Piper TTS (텍스트 → 음성)
 * - 변증법_db 자동 저장
 */

import { WebRTCHandler } from './utils/webrtc-handler';
import { WhisperSTT } from './utils/whisper-stt';
import { PiperTTS } from './utils/piper-tts';

export interface VoiceMessage {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: Date;
  confidence?: number;
}

export class VoiceEngine {
  name = 'VoiceEngine';
  description = '실시간 음성-음성 대화 엔진';

  private webrtc: WebRTCHandler;
  private stt: WhisperSTT;
  private tts: PiperTTS;
  private conversationHistory: VoiceMessage[] = [];

  constructor() {
    this.webrtc = new WebRTCHandler();
    this.stt = new WhisperSTT();
    this.tts = new PiperTTS();
  }

  /**
   * 음성 엔진 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎙️ Voice Engine 초기화 중...');

      // 1. WebRTC 초기화
      await this.webrtc.initialize();
      console.log('✅ WebRTC 초기화 완료');

      // 2. STT 초기화
      await this.stt.initialize();
      console.log('✅ Whisper STT 초기화 완료');

      // 3. TTS 초기화
      await this.tts.initialize();
      console.log('✅ Piper TTS 초기화 완료');

      console.log('✅ 음성 엔진 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ 음성 엔진 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 오디오 캡처 시작
   */
  async startAudioCapture(): Promise<void> {
    try {
      await this.webrtc.startCapture();
      console.log('🎤 오디오 캡처 시작');
    } catch (err) {
      console.error('❌ 오디오 캡처 시작 실패:', err);
    }
  }

  /**
   * 오디오 캡처 중지
   */
  async stopAudioCapture(): Promise<void> {
    try {
      await this.webrtc.stopCapture();
      console.log('🎤 오디오 캡처 중지');
    } catch (err) {
      console.error('❌ 오디오 캡처 중지 실패:', err);
    }
  }

  /**
   * 음성 입력 처리
   */
  async processAudioInput(audioData: ArrayBuffer): Promise<string> {
    try {
      // Step 1: STT (음성 → 텍스트)
      const text = await this.stt.transcribe(audioData);
      console.log(`🗣️ 인식된 텍스트: ${text}`);

      // Step 2: 대화 히스토리 저장
      const message: VoiceMessage = {
        id: `msg-${Date.now()}`,
        speaker: 'user',
        text,
        timestamp: new Date(),
      };
      this.conversationHistory.push(message);

      return text;
    } catch (err) {
      console.error('❌ 음성 입력 처리 실패:', err);
      return '';
    }
  }

  /**
   * AI 응답 음성화
   */
  async synthesizeResponse(text: string): Promise<ArrayBuffer> {
    try {
      // Step 1: TTS (텍스트 → 음성)
      const audioBuffer = await this.tts.synthesize(text);
      console.log('🔊 음성 합성 완료');

      // Step 2: 대화 히스토리 저장
      const message: VoiceMessage = {
        id: `msg-${Date.now()}`,
        speaker: 'assistant',
        text,
        timestamp: new Date(),
      };
      this.conversationHistory.push(message);

      // Step 3: WebRTC로 전송
      await this.webrtc.sendAudio(audioBuffer);

      return audioBuffer;
    } catch (err) {
      console.error('❌ 음성 합성 실패:', err);
      return new ArrayBuffer(0);
    }
  }

  /**
   * 대화 히스토리 조회
   */
  getConversationHistory(): VoiceMessage[] {
    return this.conversationHistory;
  }

  /**
   * 대화 초기화
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('🗑️ 대화 히스토리 초기화');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
