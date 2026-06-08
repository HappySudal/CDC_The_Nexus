-- ============================================================================
-- The Nexus Mining Database Schema
-- Purpose: 의장님의 개인정보 통합 저장소
-- Created: 2026-06-09
-- ============================================================================

-- Gemini 대화 기록
CREATE TABLE IF NOT EXISTS gemini_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    context_tags TEXT,
    sentiment TEXT,
    topic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sentiment) REFERENCES sentiment_lookup(id)
);

-- Discord 메시지
CREATE TABLE IF NOT EXISTS discord_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    attachments TEXT,
    reactions TEXT,
    mentions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Google Calendar 일정
CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    location TEXT,
    attendees TEXT,
    is_all_day INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 파일 시스템 변경 기록
CREATE TABLE IF NOT EXISTS file_modifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE NOT NULL,
    file_type TEXT,
    action TEXT,
    modified_time DATETIME NOT NULL,
    file_size INTEGER,
    content_hash TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- YouTube 활동
CREATE TABLE IF NOT EXISTS youtube_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT UNIQUE NOT NULL,
    activity_type TEXT,
    video_id TEXT,
    video_title TEXT,
    channel_id TEXT,
    channel_name TEXT,
    timestamp DATETIME NOT NULL,
    duration_watched INTEGER,
    watch_percentage INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 로그
CREATE TABLE IF NOT EXISTS system_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT UNIQUE NOT NULL,
    event_type TEXT,
    process_name TEXT,
    action TEXT,
    timestamp DATETIME NOT NULL,
    details TEXT,
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 변증법 대화 기록 (Thesis-Antithesis-Synthesis)
CREATE TABLE IF NOT EXISTS dialectical_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT UNIQUE NOT NULL,
    thesis TEXT NOT NULL,
    antithesis TEXT,
    synthesis TEXT,
    confidence REAL DEFAULT 0.5,
    source TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 감정 분석 룩업
CREATE TABLE IF NOT EXISTS sentiment_lookup (
    id INTEGER PRIMARY KEY,
    sentiment_type TEXT UNIQUE NOT NULL,
    score REAL
);

INSERT OR IGNORE INTO sentiment_lookup (id, sentiment_type, score) VALUES
    (1, 'very_positive', 1.0),
    (2, 'positive', 0.75),
    (3, 'neutral', 0.5),
    (4, 'negative', 0.25),
    (5, 'very_negative', 0.0);

-- 의장님의 패턴 분석 결과
CREATE TABLE IF NOT EXISTS user_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL,
    pattern_value TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    confidence REAL DEFAULT 0.5,
    last_observed DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 마이닝 실행 로그
CREATE TABLE IF NOT EXISTS mining_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miner_name TEXT NOT NULL,
    status TEXT,
    records_processed INTEGER,
    records_saved INTEGER,
    error_message TEXT,
    execution_time_seconds REAL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_gemini_timestamp ON gemini_conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_gemini_topic ON gemini_conversations(topic);
CREATE INDEX IF NOT EXISTS idx_discord_timestamp ON discord_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_discord_channel ON discord_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_calendar_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_file_path ON file_modifications(file_path);
CREATE INDEX IF NOT EXISTS idx_youtube_timestamp ON youtube_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_timestamp ON system_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_dialectical_timestamp ON dialectical_conversations(timestamp);

-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
-- "Exists in the Moment, Vanishes in Time."
