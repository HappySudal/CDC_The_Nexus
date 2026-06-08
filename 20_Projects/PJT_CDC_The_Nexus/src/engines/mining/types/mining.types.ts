/**
 * Mining Engine Types
 * 의장님의 개인정보 마이닝 데이터 타입 정의
 */

// ============================================================================
// Gemini 대화
// ============================================================================
export interface GeminiConversation {
  id: number;
  conversation_id: string;
  user_message: string;
  ai_response: string;
  timestamp: Date;
  context_tags?: string;
  sentiment?: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  topic?: string;
  created_at: Date;
}

// ============================================================================
// Discord 메시지
// ============================================================================
export interface DiscordMessage {
  id: number;
  message_id: string;
  content: string;
  channel_id: string;
  guild_id: string;
  author_id: string;
  timestamp: Date;
  attachments?: string[];
  reactions?: Record<string, number>;
  mentions?: string[];
  created_at: Date;
}

// ============================================================================
// Google Calendar 일정
// ============================================================================
export interface CalendarEvent {
  id: number;
  event_id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time?: Date;
  location?: string;
  attendees?: string[];
  is_all_day: boolean;
  category?: string;
  created_at: Date;
}

// ============================================================================
// 파일 시스템
// ============================================================================
export interface FileModification {
  id: number;
  file_path: string;
  file_type?: string;
  action: 'created' | 'modified' | 'deleted' | 'accessed';
  modified_time: Date;
  file_size?: number;
  content_hash?: string;
  category?: string;
  created_at: Date;
}

// ============================================================================
// YouTube 활동
// ============================================================================
export interface YouTubeActivity {
  id: number;
  activity_id: string;
  activity_type: 'watch' | 'like' | 'subscribe' | 'comment';
  video_id?: string;
  video_title?: string;
  channel_id?: string;
  channel_name?: string;
  timestamp: Date;
  duration_watched?: number;
  watch_percentage?: number;
  created_at: Date;
}

// ============================================================================
// 시스템 로그
// ============================================================================
export interface SystemActivity {
  id: number;
  activity_id: string;
  event_type: 'application_start' | 'application_close' | 'file_access' | 'network_activity';
  process_name?: string;
  action: string;
  timestamp: Date;
  details?: string;
  duration_seconds?: number;
  created_at: Date;
}

// ============================================================================
// 변증법 대화 (Thesis-Antithesis-Synthesis)
// ============================================================================
export interface DialecticalConversation {
  id: number;
  conversation_id: string;
  thesis: string;
  antithesis?: string;
  synthesis?: string;
  confidence: number;
  source: 'gemini' | 'discord' | 'manual' | 'auto';
  timestamp: Date;
  created_at: Date;
}

// ============================================================================
// 사용자 패턴
// ============================================================================
export interface UserPattern {
  id: number;
  pattern_type: 'interest' | 'habit' | 'priority' | 'decision_style' | 'language_style';
  pattern_value: string;
  frequency: number;
  confidence: number;
  last_observed: Date;
  created_at: Date;
}

// ============================================================================
// 마이닝 로그
// ============================================================================
export interface MiningLog {
  id: number;
  miner_name: string;
  status: 'success' | 'failure' | 'partial';
  records_processed: number;
  records_saved: number;
  error_message?: string;
  execution_time_seconds: number;
  started_at: Date;
  completed_at?: Date;
}

// ============================================================================
// 마이너 인터페이스
// ============================================================================
export interface IMiner {
  name: string;
  description: string;
  execute(): Promise<MiningResult>;
  validate(): Promise<boolean>;
}

export interface MiningResult {
  success: boolean;
  miner_name: string;
  records_processed: number;
  records_saved: number;
  error?: string;
  execution_time_seconds: number;
  timestamp: Date;
}

// ============================================================================
// 마이닝 설정
// ============================================================================
export interface MiningConfig {
  enabled: boolean;
  auto_run: boolean;
  interval_minutes: number;
  max_records_per_run: number;
  data_retention_days: number;
  encrypt_sensitive_data: boolean;
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
