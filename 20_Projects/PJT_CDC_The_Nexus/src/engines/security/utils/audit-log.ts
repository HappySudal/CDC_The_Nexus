/**
 * Audit Log (Phase 2-2, Layer 5)
 * 감시 로그 및 접근 기록
 * - 모든 접근 기록
 * - 실패 기록
 * - 변경 추적
 * - 감시 분석
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  id?: number;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resource?: string;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogStatistics {
  totalEvents: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  uniqueActions: string[];
  suspiciousActivities: AuditLogEntry[];
}

export class AuditLog {
  name = 'AuditLog';
  description = 'Layer 5: 감시 로그 및 접근 기록';

  private db: Database.Database | null = null;
  private isInitialized = false;

  /**
   * 감시 로그 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('📊 Audit Log 초기화 중...');

      // 1. 데이터베이스 초기화
      this.initDatabase();

      // 2. 테이블 생성
      this.createSchema();

      this.isInitialized = true;
      console.log('✅ Audit Log 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Audit Log 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    try {
      const dbPath = 'data/audit.db';
      const dir = path.dirname(dbPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(dbPath);
      console.log('✅ 감시 로그 데이터베이스 초기화');
    } catch (err) {
      console.error('❌ 데이터베이스 초기화 실패:', err);
      throw err;
    }
  }

  /**
   * 테이블 생성
   */
  private createSchema(): void {
    if (!this.db) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_status (status)
      );

      CREATE TABLE IF NOT EXISTS suspicious_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_log_id INTEGER NOT NULL,
        detection_reason TEXT NOT NULL,
        severity TEXT NOT NULL,
        investigated BOOLEAN DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (audit_log_id) REFERENCES audit_log(id)
      );
    `;

    try {
      this.db.exec(schema);
      console.log('✅ 감시 로그 스키마 생성');
    } catch (err) {
      console.error('❌ 스키마 생성 실패:', err);
      throw err;
    }
  }

  /**
   * 감시 로그 기록
   */
  async log(entry: AuditLogEntry): Promise<number | null> {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_log
        (timestamp, user_id, action, resource, status, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        entry.timestamp.toISOString(),
        entry.userId,
        entry.action,
        entry.resource,
        entry.status,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress || null,
        entry.userAgent || null
      ) as any;

      return result.lastInsertRowid as number;
    } catch (err) {
      console.error('❌ 로그 기록 실패:', err);
      return null;
    }
  }

  /**
   * 감시 로그 조회
   */
  async getLogs(filter?: AuditLogFilter, limit: number = 1000): Promise<AuditLogEntry[]> {
    if (!this.db) return [];

    try {
      let query = 'SELECT * FROM audit_log WHERE 1=1';
      const params: any[] = [];

      if (filter?.userId) {
        query += ' AND user_id = ?';
        params.push(filter.userId);
      }
      if (filter?.action) {
        query += ' AND action = ?';
        params.push(filter.action);
      }
      if (filter?.resource) {
        query += ' AND resource = ?';
        params.push(filter.resource);
      }
      if (filter?.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }
      if (filter?.startDate) {
        query += ' AND timestamp >= ?';
        params.push(filter.startDate.toISOString());
      }
      if (filter?.endDate) {
        query += ' AND timestamp <= ?';
        params.push(filter.endDate.toISOString());
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map(row => ({
        id: row.id,
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        action: row.action,
        resource: row.resource,
        status: row.status,
        details: row.details ? JSON.parse(row.details) : undefined,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
      }));
    } catch (err) {
      console.error('❌ 로그 조회 실패:', err);
      return [];
    }
  }

  /**
   * 통계 계산
   */
  async getStatistics(): Promise<AuditLogStatistics> {
    if (!this.db) {
      return {
        totalEvents: 0,
        successfulActions: 0,
        failedActions: 0,
        uniqueUsers: 0,
        uniqueActions: [],
        suspiciousActivities: [],
      };
    }

    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM audit_log');
      const total = (totalStmt.get() as any).count;

      const successStmt = this.db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE status = 'success'");
      const successful = (successStmt.get() as any).count;

      const failureStmt = this.db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE status = 'failure'");
      const failed = (failureStmt.get() as any).count;

      const usersStmt = this.db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM audit_log');
      const uniqueUsers = (usersStmt.get() as any).count;

      const actionsStmt = this.db.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action');
      const actions = (actionsStmt.all() as any[]).map(row => row.action);

      const suspiciousStmt = this.db.prepare(`
        SELECT al.* FROM audit_log al
        WHERE al.status = 'failure' OR al.action = 'delete'
        ORDER BY al.timestamp DESC
        LIMIT 100
      `);
      const suspicious = suspiciousStmt.all() as any[];

      return {
        totalEvents: total,
        successfulActions: successful,
        failedActions: failed,
        uniqueUsers,
        uniqueActions: actions,
        suspiciousActivities: suspicious.map(row => ({
          id: row.id,
          timestamp: new Date(row.timestamp),
          userId: row.user_id,
          action: row.action,
          resource: row.resource,
          status: row.status,
        })),
      };
    } catch (err) {
      console.error('❌ 통계 계산 실패:', err);
      return {
        totalEvents: 0,
        successfulActions: 0,
        failedActions: 0,
        uniqueUsers: 0,
        uniqueActions: [],
        suspiciousActivities: [],
      };
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('✅ Audit Log 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
