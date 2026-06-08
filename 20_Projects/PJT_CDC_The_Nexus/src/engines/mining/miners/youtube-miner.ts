/**
 * YouTube Activity Miner
 * 의장님의 YouTube 활동을 마이닝합니다
 */

import Database from 'better-sqlite3';
import { google } from 'googleapis';
import { IMiner, MiningResult, YouTubeActivity } from '../types/mining.types';

export class YouTubeMiner implements IMiner {
  name = 'YouTubeMiner';
  description = '의장님의 YouTube 활동 마이닝';

  private db: Database.Database | null = null;
  private youtube: any = null;
  private startTime: number = 0;

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY || '';

      if (!apiKey) {
        console.error('❌ YOUTUBE_API_KEY 환경변수 미설정');
        return false;
      }

      console.log('✅ YouTube Miner 검증 완료');
      return true;
    } catch (err) {
      console.error('❌ 검증 실패:', err);
      return false;
    }
  }

  /**
   * 마이닝 실행
   */
  async execute(): Promise<MiningResult> {
    this.startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSaved = 0;
    let error: string | undefined;

    try {
      this.initDatabase();

      console.log('🚀 YouTube Miner 실행 시작...');

      // Step 1: YouTube API 초기화
      this.initializeYouTubeAPI();

      // Step 2: YouTube 활동 수집
      const activities = await this.collectYouTubeActivity();
      recordsProcessed = activities.length;

      console.log(`📊 수집된 활동: ${recordsProcessed}개`);

      // Step 3: 데이터베이스에 저장
      recordsSaved = this.saveActivities(activities);

      console.log(`✅ 저장된 활동: ${recordsSaved}개`);

      // Step 4: 로깅
      await this.logMiningActivity('success', recordsProcessed, recordsSaved);

      return {
        success: true,
        miner_name: this.name,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        execution_time_seconds: (Date.now() - this.startTime) / 1000,
        timestamp: new Date(),
      };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('❌ YouTube Miner 실행 실패:', error);

      await this.logMiningActivity('failure', recordsProcessed, recordsSaved, error);

      return {
        success: false,
        miner_name: this.name,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        error,
        execution_time_seconds: (Date.now() - this.startTime) / 1000,
        timestamp: new Date(),
      };
    } finally {
      this.closeDatabase();
    }
  }

  /**
   * YouTube API 초기화
   */
  private initializeYouTubeAPI(): void {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      this.youtube = google.youtube({
        version: 'v3',
        auth: apiKey,
      });

      console.log('✅ YouTube API 초기화 완료');
    } catch (err) {
      console.error('❌ YouTube API 초기화 실패:', err);
      throw err;
    }
  }

  /**
   * YouTube 활동 수집
   */
  private async collectYouTubeActivity(): Promise<YouTubeActivity[]> {
    if (!this.youtube) return [];

    const activities: YouTubeActivity[] = [];

    try {
      // 시청 기록 수집 (watch history)
      const watchHistory = await this.getWatchHistory();
      activities.push(...watchHistory);

      // 구독 채널 수집
      const subscriptions = await this.getSubscriptions();
      activities.push(...subscriptions);

      // 좋아요 표시 영상 수집
      const likes = await this.getLikedVideos();
      activities.push(...likes);

      console.log(`📝 YouTube 활동 수집 완료: ${activities.length}개`);
      return activities;
    } catch (err) {
      console.error('❌ 활동 수집 중 오류:', err);
      return activities;
    }
  }

  /**
   * 시청 기록 조회
   */
  private async getWatchHistory(): Promise<YouTubeActivity[]> {
    const activities: YouTubeActivity[] = [];

    try {
      const response = await this.youtube.activities.list({
        part: 'snippet,contentDetails',
        home: true,
        maxResults: 500,
      });

      const items = response.data.items || [];

      for (const item of items) {
        if (item.snippet?.type === 'watch') {
          activities.push({
            id: 0,
            activity_id: item.id,
            activity_type: 'watch',
            video_id: item.contentDetails?.watch?.videoId,
            video_title: item.snippet.title,
            channel_id: item.snippet.channelId,
            channel_name: item.snippet.channelTitle,
            timestamp: new Date(item.snippet.publishedAt),
            duration_watched: undefined,
            watch_percentage: undefined,
            created_at: new Date(),
          });
        }
      }

      return activities;
    } catch (err) {
      console.warn('⚠️ 시청 기록 조회 실패:', err);
      return activities;
    }
  }

  /**
   * 구독 채널 조회
   */
  private async getSubscriptions(): Promise<YouTubeActivity[]> {
    const activities: YouTubeActivity[] = [];

    try {
      const response = await this.youtube.subscriptions.list({
        part: 'snippet',
        mine: true,
        maxResults: 500,
      });

      const items = response.data.items || [];

      for (const item of items) {
        activities.push({
          id: 0,
          activity_id: item.id,
          activity_type: 'subscribe',
          channel_id: item.snippet.resourceId?.channelId,
          channel_name: item.snippet.title,
          timestamp: new Date(item.snippet.publishedAt),
          created_at: new Date(),
        });
      }

      return activities;
    } catch (err) {
      console.warn('⚠️ 구독 채널 조회 실패:', err);
      return activities;
    }
  }

  /**
   * 좋아요 표시 영상 조회
   */
  private async getLikedVideos(): Promise<YouTubeActivity[]> {
    const activities: YouTubeActivity[] = [];

    try {
      const response = await this.youtube.playlists.list({
        part: 'id',
        mine: true,
      });

      const playlists = response.data.items || [];
      const likedPlaylist = playlists.find((p: any) => p.id === 'LL');

      if (!likedPlaylist) return activities;

      const videosResponse = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: likedPlaylist.id,
        maxResults: 500,
      });

      const items = videosResponse.data.items || [];

      for (const item of items) {
        activities.push({
          id: 0,
          activity_id: item.id,
          activity_type: 'like',
          video_id: item.snippet.resourceId?.videoId,
          video_title: item.snippet.title,
          channel_id: item.snippet.channelId,
          channel_name: item.snippet.videoOwnerChannelTitle,
          timestamp: new Date(item.snippet.publishedAt),
          created_at: new Date(),
        });
      }

      return activities;
    } catch (err) {
      console.warn('⚠️ 좋아요 영상 조회 실패:', err);
      return activities;
    }
  }

  /**
   * 활동을 데이터베이스에 저장
   */
  private saveActivities(activities: YouTubeActivity[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO youtube_activity
        (activity_id, activity_type, video_id, video_title, channel_id, channel_name, timestamp, duration_watched, watch_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const activity of activities) {
        try {
          const result = stmt.run(
            activity.activity_id,
            activity.activity_type,
            activity.video_id || null,
            activity.video_title || null,
            activity.channel_id || null,
            activity.channel_name || null,
            activity.timestamp.toISOString(),
            activity.duration_watched || null,
            activity.watch_percentage || null
          );

          if ((result as any).changes > 0) {
            saved++;
          }
        } catch (err) {
          console.warn(`⚠️ 활동 저장 실패: ${activity.activity_id}`, err);
        }
      }

      return saved;
    } catch (err) {
      console.error('❌ 저장 중 오류:', err);
      return saved;
    }
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    try {
      const dbPath = 'data/mining.db';
      this.db = new Database(dbPath);

      const schema = `
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
        )
      `;

      this.db.exec(schema);
      console.log('✅ 데이터베이스 초기화 완료');
    } catch (err) {
      console.error('❌ 데이터베이스 초기화 실패:', err);
      throw err;
    }
  }

  /**
   * 데이터베이스 종료
   */
  private closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 마이닝 활동 로깅
   */
  private async logMiningActivity(
    status: 'success' | 'failure',
    processed: number,
    saved: number,
    error?: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO mining_logs
        (miner_name, status, records_processed, records_saved, error_message, execution_time_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        this.name,
        status,
        processed,
        saved,
        error || null,
        (Date.now() - this.startTime) / 1000
      );
    } catch (err) {
      console.warn('⚠️ 로깅 중 오류:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
