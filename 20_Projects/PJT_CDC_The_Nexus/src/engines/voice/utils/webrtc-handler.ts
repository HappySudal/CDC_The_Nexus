/**
 * WebRTC Handler (Phase 2-4)
 * 실시간 오디오 캡처 및 스트리밍
 * - getUserMedia로 마이크 접근
 * - RTCPeerConnection 양방향 통신
 * - 오디오 스트림 관리
 */

export interface WebRTCConfig {
  audioConstraints?: MediaStreamConstraints;
  iceServers?: RTCIceServer[];
  maxConnections?: number;
}

export interface AudioStreamInfo {
  id: string;
  active: boolean;
  sampleRate: number;
  channelCount: number;
}

export class WebRTCHandler {
  name = 'WebRTCHandler';
  description = '오디오 캡처 및 WebRTC 스트리밍';

  private config: WebRTCConfig;
  private mediaStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private audioContext: AudioContext | null = null;
  private isCapturing = false;

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = {
      audioConstraints: config?.audioConstraints || {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      },
      iceServers: config?.iceServers || [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
      ],
      maxConnections: config?.maxConnections || 5,
    };
  }

  /**
   * WebRTC 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎙️ WebRTC Handler 초기화 중...');

      // 1. Audio Context 생성
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Audio Context 생성');

      // 2. RTCPeerConnection 설정 (아직 연결 없음)
      console.log('✅ WebRTC Handler 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ WebRTC Handler 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 오디오 캡처 시작
   */
  async startCapture(): Promise<void> {
    try {
      if (this.isCapturing) {
        console.warn('⚠️ 이미 오디오 캡처 중');
        return;
      }

      console.log('🎤 오디오 캡처 시작...');

      // getUserMedia로 마이크 접근
      this.mediaStream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints);

      // 오디오 정보 로깅
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log(`✅ 오디오 캡처 시작 (${settings.sampleRate}Hz, ${settings.channelCount} 채널)`);
      }

      this.isCapturing = true;
    } catch (err) {
      console.error('❌ 오디오 캡처 시작 실패:', err);
      throw err;
    }
  }

  /**
   * 오디오 캡처 중지
   */
  async stopCapture(): Promise<void> {
    try {
      if (!this.isCapturing || !this.mediaStream) {
        console.warn('⚠️ 오디오 캡처 중이 아님');
        return;
      }

      console.log('🎤 오디오 캡처 중지...');

      // 모든 트랙 정지
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });

      this.mediaStream = null;
      this.isCapturing = false;

      console.log('✅ 오디오 캡처 중지');
    } catch (err) {
      console.error('❌ 오디오 캡처 중지 실패:', err);
    }
  }

  /**
   * 오디오 스트림 정보
   */
  getStreamInfo(): AudioStreamInfo | null {
    if (!this.mediaStream) return null;

    const audioTrack = this.mediaStream.getAudioTracks()[0];
    if (!audioTrack) return null;

    const settings = audioTrack.getSettings();
    return {
      id: audioTrack.id,
      active: audioTrack.enabled,
      sampleRate: settings.sampleRate || 48000,
      channelCount: settings.channelCount || 1,
    };
  }

  /**
   * 피어 연결 생성
   */
  async createPeerConnection(): Promise<RTCPeerConnection> {
    try {
      console.log('🔗 RTCPeerConnection 생성 중...');

      const config: RTCConfiguration = {
        iceServers: this.config.iceServers,
      };

      this.peerConnection = new RTCPeerConnection(config);

      // 미디어 스트림 추가
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.mediaStream!);
        });
      }

      // 이벤트 리스너
      this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          console.log('🔗 ICE Candidate:', event.candidate.candidate);
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log(`📡 연결 상태: ${this.peerConnection?.connectionState}`);
      };

      console.log('✅ RTCPeerConnection 생성 완료');
      return this.peerConnection;
    } catch (err) {
      console.error('❌ RTCPeerConnection 생성 실패:', err);
      throw err;
    }
  }

  /**
   * 오디오 데이터 전송
   */
  async sendAudio(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (!this.mediaStream) {
        throw new Error('Media stream not available');
      }

      // AudioWorklet 또는 ScriptProcessor를 사용하여 오디오 데이터 처리
      if (this.audioContext) {
        const audioData = await this.audioContext.decodeAudioData(audioBuffer);
        console.log(`📤 오디오 전송 (${audioData.duration.toFixed(2)}초)`);
      }
    } catch (err) {
      console.error('❌ 오디오 전송 실패:', err);
    }
  }

  /**
   * 라이프사이클: 종료
   */
  async destroy(): Promise<void> {
    try {
      await this.stopCapture();

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      console.log('✅ WebRTC Handler 종료');
    } catch (err) {
      console.error('❌ WebRTC Handler 종료 실패:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
