/**
 * Whisper STT (Phase 2-4)
 * 음성을 텍스트로 변환 (Speech-to-Text)
 * - OpenAI Whisper API (온라인)
 * - Whisper.cpp (로컬)
 * - 언어 자동 감지
 */

export interface WhisperConfig {
  apiKey?: string;
  model: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  endpoint?: string; // 로컬 서버 주소
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language: string;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export class WhisperSTT {
  name = 'WhisperSTT';
  description = '음성→텍스트 변환 (Whisper)';

  private config: WhisperConfig;
  private isInitialized = false;

  constructor(config?: Partial<WhisperConfig>) {
    this.config = {
      model: config?.model || 'base',
      language: config?.language || 'ko',
      endpoint: config?.endpoint || 'http://localhost:8000',
      apiKey: config?.apiKey,
    };
  }

  /**
   * Whisper STT 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎙️ Whisper STT 초기화 중...');

      // 1. 로컬 서버 연결 확인
      const isLocalAvailable = await this.checkLocalServer();
      if (isLocalAvailable) {
        console.log('✅ 로컬 Whisper 서버 감지');
      } else {
        console.log('⚠️ 로컬 서버 없음, OpenAI API 사용');
      }

      this.isInitialized = true;
      console.log('✅ Whisper STT 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Whisper STT 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 로컬 Whisper 서버 확인
   */
  private async checkLocalServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 음성 파일 문자화 (로컬)
   */
  async transcribeLocal(audioBuffer: ArrayBuffer): Promise<TranscriptionResult | null> {
    try {
      console.log('🎙️ 로컬 Whisper로 음성 인식 중...');

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', this.config.model);
      formData.append('language', this.config.language || '');

      const response = await fetch(`${this.config.endpoint}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = (await response.json()) as any;

      return {
        text: result.text,
        confidence: result.confidence || 0.95,
        duration: result.duration || 0,
        language: result.language || this.config.language || 'ko',
        segments: result.segments,
      };
    } catch (err) {
      console.error('❌ 로컬 음성 인식 실패:', err);
      return null;
    }
  }

  /**
   * 음성 파일 문자화 (OpenAI API)
   */
  async transcribeOpenAI(audioBuffer: ArrayBuffer): Promise<TranscriptionResult | null> {
    try {
      console.log('🎙️ OpenAI Whisper로 음성 인식 중...');

      if (!this.config.apiKey) {
        throw new Error('OpenAI API Key not provided');
      }

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', this.config.language || 'ko');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.statusText}`);
      }

      const result = (await response.json()) as any;

      return {
        text: result.text,
        confidence: 0.9, // OpenAI API는 confidence를 반환하지 않음
        duration: 0,
        language: this.config.language || 'ko',
      };
    } catch (err) {
      console.error('❌ OpenAI 음성 인식 실패:', err);
      return null;
    }
  }

  /**
   * 음성 문자화 (자동 선택)
   */
  async transcribe(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      // 1. 로컬 서버 시도
      if (await this.checkLocalServer()) {
        const result = await this.transcribeLocal(audioBuffer);
        if (result) {
          console.log(`✅ 음성 인식 완료: "${result.text}"`);
          return result.text;
        }
      }

      // 2. OpenAI API 시도
      if (this.config.apiKey) {
        const result = await this.transcribeOpenAI(audioBuffer);
        if (result) {
          console.log(`✅ 음성 인식 완료: "${result.text}"`);
          return result.text;
        }
      }

      throw new Error('No transcription service available');
    } catch (err) {
      console.error('❌ 음성 인식 실패:', err);
      return '';
    }
  }

  /**
   * 언어 감지
   */
  async detectLanguage(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      console.log('🌐 언어 감지 중...');

      // Whisper는 문자화 과정에서 언어를 감지
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', this.config.model);

      const response = await fetch(`${this.config.endpoint}/detect-language`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return 'ko'; // 기본값
      }

      const result = (await response.json()) as any;
      console.log(`✅ 감지된 언어: ${result.language}`);
      return result.language || 'ko';
    } catch (err) {
      console.error('❌ 언어 감지 실패:', err);
      return 'ko';
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.isInitialized = false;
    console.log('✅ Whisper STT 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
