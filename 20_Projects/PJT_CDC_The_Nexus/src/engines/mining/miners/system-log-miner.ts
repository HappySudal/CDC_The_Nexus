/**
 * System Log Miner
 * Windows 시스템 로그와 애플리케이션 활동을 마이닝합니다
 */

import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import { IMiner, MiningResult, SystemActivity } from '../types/mining.types';

export class SystemLogMiner implements IMiner {
  name = 'SystemLogMiner';
  description = 'Windows 시스템 로그 및 활동 마이닝';

  private db: Database.Database | null = null;
  private startTime: number = 0;

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      // Windows PowerShell 확인
      try {
        execSync('powershell -Command "$PSVersionTable.PSVersion"', {
          stdio: 'ignore',
        });
        console.log('✅ System Log Miner 검증 완료');
        return true;
      } catch {
        console.error('❌ PowerShell을 찾을 수 없음');
        return false;
      }
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

      console.log('🚀 System Log Miner 실행 시작...');

      // Step 1: 시스템 로그 수집
      const activities = await this.collectSystemLogs();
      recordsProcessed = activities.length;

      console.log(`📊 수집된 활동: ${recordsProcessed}개`);

      // Step 2: 데이터베이스에 저장
      recordsSaved = this.saveActivities(activities);

      console.log(`✅ 저장된 활동: ${recordsSaved}개`);

      // Step 3: 로깅
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
      console.error('❌ System Log Miner 실행 실패:', error);

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
   * 시스템 로그 수집
   */
  private async collectSystemLogs(): Promise<SystemActivity[]> {
    const activities: SystemActivity[] = [];

    try {
      // 지난 24시간의 이벤트 로그 수집
      const powershellScript = `
        Get-EventLog -LogName System -After (Get-Date).AddDays(-1) |
        Select-Object -Property TimeGenerated, Source, EventID, Message |
        ConvertTo-Json
      `;

      try {
        const output = execSync(`powershell -Command "${powershellScript}"`, {
          encoding: 'utf-8',
          timeout: 30000,
        });

        const logs = JSON.parse(output);
        const logsArray = Array.isArray(logs) ? logs : [logs];

        for (const log of logsArray) {
          activities.push({
            id: 0,
            activity_id: `${log.TimeGenerated}-${log.EventID}`,
            event_type: this.categorizeEventType(log.Source),
            process_name: log.Source,
            action: `Event ${log.EventID}`,
            timestamp: new Date(log.TimeGenerated),
            details: log.Message?.substring(0, 500) || '',
            duration_seconds: undefined,
            created_at: new Date(),
          });
        }
      } catch (err) {
        console.warn('⚠️ System Event Log 조회 실패:', err);
      }

      // 프로세스 시작/종료 로그
      try {
        const processScript = `
          Get-EventLog -LogName Security -InstanceId 4688 -After (Get-Date).AddDays(-1) |
          Select-Object -Property TimeGenerated, Message |
          ConvertTo-Json
        `;

        const processOutput = execSync(`powershell -Command "${processScript}"`, {
          encoding: 'utf-8',
          timeout: 30000,
        });

        const processLogs = JSON.parse(processOutput);
        const processArray = Array.isArray(processLogs) ? processLogs : [processLogs];

        for (const log of processArray) {
          const processMatch = log.Message?.match(/New Process Name:.*\\([^\r]+)/);
          const processName = processMatch ? processMatch[0].split('\\').pop() : 'unknown';

          activities.push({
            id: 0,
            activity_id: `process-${log.TimeGenerated}`,
            event_type: 'application_start',
            process_name: processName,
            action: 'started',
            timestamp: new Date(log.TimeGenerated),
            details: log.Message?.substring(0, 500) || '',
            duration_seconds: undefined,
            created_at: new Date(),
          });
        }
      } catch (err) {
        console.warn('⚠️ Process Log 조회 실패:', err);
      }

      console.log(`📝 로그 수집 완료: ${activities.length}개`);
      return activities;
    } catch (err) {
      console.error('❌ 로그 수집 중 오류:', err);
      return activities;
    }
  }

  /**
   * 이벤트 타입 분류
   */
  private categorizeEventType(source: string): string {
    const appStarts = ['Application', 'Program'];
    const networkEvents = ['Network', 'TCP', 'UDP'];
    const systemEvents = ['System', 'Kernel', 'Power'];

    if (appStarts.some(s => source.includes(s))) return 'application_start';
    if (networkEvents.some(s => source.includes(s))) return 'network_activity';
    if (systemEvents.some(s => source.includes(s))) return 'file_access';

    return 'file_access';
  }

  /**
   * 활동을 데이터베이스에 저장
   */
  private saveActivities(activities: SystemActivity[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO system_activity
        (activity_id, event_type, process_name, action, timestamp, details, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const activity of activities) {
        try {
          const result = stmt.run(
            activity.activity_id,
            activity.event_type,
            activity.process_name || null,
            activity.action,
            activity.timestamp.toISOString(),
            activity.details || null,
            activity.duration_seconds || null
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
