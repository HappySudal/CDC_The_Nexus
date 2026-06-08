/**
 * Google Calendar Miner
 * 의장님의 Google Calendar 일정을 마이닝합니다
 */

import Database from 'better-sqlite3';
import { google } from 'googleapis';
import { IMiner, MiningResult, CalendarEvent } from '../types/mining.types';

export class CalendarMiner implements IMiner {
  name = 'CalendarMiner';
  description = '의장님의 Google Calendar 일정 마이닝';

  private db: Database.Database | null = null;
  private calendar: any = null;
  private startTime: number = 0;

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      const credentialsPath = process.env.GOOGLE_CALENDAR_CREDENTIALS || '';

      if (!credentialsPath) {
        console.error('❌ GOOGLE_CALENDAR_CREDENTIALS 환경변수 미설정');
        return false;
      }

      console.log('✅ Calendar Miner 검증 완료');
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
      // 데이터베이스 초기화
      this.initDatabase();

      console.log('🚀 Calendar Miner 실행 시작...');

      // Step 1: Google Calendar API 인증
      await this.authenticateGoogleCalendar();

      // Step 2: 일정 수집
      const events = await this.collectCalendarEvents();
      recordsProcessed = events.length;

      console.log(`📊 수집된 일정: ${recordsProcessed}개`);

      // Step 3: 데이터베이스에 저장
      recordsSaved = this.saveEvents(events);

      console.log(`✅ 저장된 일정: ${recordsSaved}개`);

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
      console.error('❌ Calendar Miner 실행 실패:', error);

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
   * Google Calendar API 인증
   */
  private async authenticateGoogleCalendar(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CALENDAR_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });

      const authClient = await auth.getClient();
      this.calendar = google.calendar({ version: 'v3', auth: authClient });

      console.log('✅ Google Calendar API 인증 완료');
    } catch (err) {
      console.error('❌ Google Calendar 인증 실패:', err);
      throw err;
    }
  }

  /**
   * Google Calendar에서 일정 수집
   */
  private async collectCalendarEvents(): Promise<CalendarEvent[]> {
    if (!this.calendar) return [];

    const events: CalendarEvent[] = [];

    try {
      // 지난 1년의 일정 수집
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: oneYearAgo.toISOString(),
        timeMax: now.toISOString(),
        maxResults: 2500,
        orderBy: 'startTime',
        singleEvents: true,
      });

      const items = response.data.items || [];

      for (const item of items) {
        const event: CalendarEvent = {
          id: 0,
          event_id: item.id || '',
          title: item.summary || '(제목 없음)',
          description: item.description,
          start_time: new Date(item.start?.dateTime || item.start?.date || ''),
          end_time: item.end?.dateTime ? new Date(item.end.dateTime) : undefined,
          location: item.location,
          attendees: item.attendees?.map(att => att.email) || [],
          is_all_day: !item.start?.dateTime,
          category: item.eventType || 'event',
          created_at: new Date(),
        };

        events.push(event);
      }

      console.log(`📝 일정 수집 완료: ${events.length}개`);
      return events;
    } catch (err) {
      console.error('❌ 일정 수집 중 오류:', err);
      return events;
    }
  }

  /**
   * 일정을 데이터베이스에 저장
   */
  private saveEvents(events: CalendarEvent[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO calendar_events
        (event_id, title, description, start_time, end_time, location, attendees, is_all_day, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const event of events) {
        try {
          const result = stmt.run(
            event.event_id,
            event.title,
            event.description || '',
            event.start_time.toISOString(),
            event.end_time?.toISOString() || null,
            event.location || '',
            JSON.stringify(event.attendees || []),
            event.is_all_day ? 1 : 0,
            event.category || 'event'
          );

          if ((result as any).changes > 0) {
            saved++;
          }
        } catch (err) {
          console.warn(`⚠️ 일정 저장 실패: ${event.event_id}`, err);
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
