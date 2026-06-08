/**
 * Piper TTS (Phase 2-4)
 * 텍스트를 음성으로 변환 (Text-to-Speech)
 * - Piper 로컬 TTS (완전 로컬)
 * - 한국어 음성 지원
 * - 스트리밍 오디오 출력
 */

export interface PiperConfig {
  voice: string; // 음성 모델 (ko_KR-kss-medium, ko_KR-nanh-medium 등)
  endpoint?: string; // 로컬 Piper 서버
  speakerId?: number; // 다중 스피커 모델용
  sampleRate?: number; // 기본 22050 또는 48000
  noiseScale?: number; // 0.0 ~ 1.0
  noiseW?: number; // 0.0 ~ 1.0
  lengthScale?: number; // 음성 길이 조절 (0.5 ~ 2.0)
}

export interface SynthesisResult {
  audio: ArrayBuffer;
  mimeType: string;
  duration: number;
  sampleRate: number;
}

export class PiperTTS {
  name = 'PiperTTS';
  description = '텍스트→음성 변환 (Piper)';

  private config: PiperConfig;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor(config?: Partial<PiperConfig>) {
    this.config = {
      voice: config?.voice || 'ko_KR-kss-medium',
      endpoint: config?.endpoint || 'http://localhost:8001',
      speakerId: config?.speakerId || 0,
      sampleRate: config?.sampleRate || 22050,
      noiseScale: config?.noiseScale || 0.667,
      noiseW: config?.noiseW || 0.8,
      lengthScale: config?.lengthScale || 1.0,
    };
  }

  /**
   * Piper TTS 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔊 Piper TTS 초기화 중...');

      // 1. Audio Context 생성
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Audio Context 생성');

      // 2. Piper 서버 연결 확인
      const isServerAvailable = await this.checkPiperServer();
      if (isServerAvailable) {
        console.log('✅ Piper 로컬 서버 감지');
      } else {
        console.warn('⚠️ Piper 서버 없음, fallback 준비 필요');
      }

      this.isInitialized = true;
      console.log('✅ Piper TTS 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Piper TTS 초기화 실패:', err);
      return false;
    }
  }

  /**
   * Piper 서버 연결 확인
   */
  private async checkPiperServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/voices`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 텍스트 음성화
   */
  async synthesize(text: string): Promise<ArrayBuffer> {
    try {
      console.log(`🔊 음성 합성 중: "${text}"`);

      // 1. Piper 로컬 서버로 요청
      const result = await this.synthesizeWithPiper(text);

      if (result) {
        console.log(
          `✅ 음성 합성 완료 (${(result.audio.byteLength / 1024).toFixed(2)}KB, ${result.duration.toFixed(2)}초)`
        );
        return result.audio;
      }

      throw new Error('Synthesis failed');
    } catch (err) {
      console.error('❌ 음성 합성 실패:', err);
      return new ArrayBuffer(0);
    }
  }

  /**
   * Piper로 합성
   */
  private async synthesizeWithPiper(text: string): Promise<SynthesisResult | null> {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('voice', this.config.voice);
      formData.append('speaker_id', this.config.speakerId?.toString() || '0');
      formData.append('noise_scale', this.config.noiseScale?.toString() || '0.667');
      formData.append('noise_w', this.config.noiseW?.toString() || '0.8');
      formData.append('length_scale', this.config.lengthScale?.toString() || '1.0');

      const response = await fetch(`${this.config.endpoint}/api/synthesize`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Piper API failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();

      // 응답 헤더에서 음성 길이 정보 추출
      const duration = parseFloat(response.headers.get('X-Audio-Duration') || '0');

      return {
        audio: arrayBuffer,
        mimeType: audioBlob.type || 'audio/wav',
        duration,
        sampleRate: this.config.sampleRate || 22050,
      };
    } catch (err) {
      console.error('❌ Piper 음성 합성 실패:', err);
      return null;
    }
  }

  /**
   * 음성 재생
   */
  async play(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio Context not initialized');
      }

      const audioData = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(this.audioContext.destination);
      source.start(0);

      console.log(`🔊 음성 재생 시작 (${audioData.duration.toFixed(2)}초)`);
    } catch (err) {
      console.error('❌ 음성 재생 실패:', err);
      throw err;
    }
  }

  /**
   * 사용 가능한 음성 목록 조회
   */
  async getAvailableVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/voices`, {
        method: 'GET',
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as any;
      return data.voices || [];
    } catch (err) {
      console.error('❌ 음성 목록 조회 실패:', err);
      return [];
    }
  }

  /**
   * 음성 설정 변경
   */
  setVoice(voice: string, speakerId?: number): void {
    this.config.voice = voice;
    if (speakerId !== undefined) {
      this.config.speakerId = speakerId;
    }
    console.log(`✅ 음성 변경: ${voice} (Speaker ${this.config.speakerId})`);
  }

  /**
   * 라이프사이클: 종료
   */
  async destroy(): Promise<void> {
    try {
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
      }
      this.audioContext = null;
      this.isInitialized = false;
      console.log('✅ Piper TTS 종료');
    } catch (err) {
      console.error('❌ Piper TTS 종료 실패:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
