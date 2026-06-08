/**
 * File System Miner
 * 의장님의 로컬 파일 시스템 변경사항을 마이닝합니다
 */

import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { IMiner, MiningResult, FileModification } from '../types/mining.types';

export class FileMiner implements IMiner {
  name = 'FileMiner';
  description = '의장님의 파일 시스템 변경사항 마이닝';

  private db: Database.Database | null = null;
  private rootPath: string;
  private startTime: number = 0;

  constructor() {
    this.rootPath = process.env.WORKSPACE_ROOT || 'C:\\99_Develop\\SynologyDrive\\20_Projects\\PJT_CDC_The_Nexus';
  }

  /**
   * 마이너 유효성 검증
   */
  async validate(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.rootPath)) {
        console.error(`❌ 작업 경로 없음: ${this.rootPath}`);
        return false;
      }

      console.log('✅ File Miner 검증 완료');
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

      console.log('🚀 File Miner 실행 시작...');

      // Step 1: 파일 시스템 스캔
      const files = await this.scanFileSystem();
      recordsProcessed = files.length;

      console.log(`📊 스캔된 파일: ${recordsProcessed}개`);

      // Step 2: 데이터베이스에 저장
      recordsSaved = this.saveFiles(files);

      console.log(`✅ 저장된 파일: ${recordsSaved}개`);

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
      console.error('❌ File Miner 실행 실패:', error);

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
   * 파일 시스템 스캔
   */
  private async scanFileSystem(): Promise<FileModification[]> {
    const files: FileModification[] = [];
    const trackedExtensions = ['.md', '.ts', '.tsx', '.json', '.sql', '.js'];
    const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.next', '.cache'];

    try {
      const walkDir = (dir: string) => {
        try {
          const items = fs.readdirSync(dir);

          for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.relative(this.rootPath, fullPath);

            // 무시 패턴 체크
            if (ignorePatterns.some(pattern => relPath.includes(pattern))) {
              continue;
            }

            try {
              const stat = fs.statSync(fullPath);

              if (stat.isDirectory()) {
                walkDir(fullPath);
              } else {
                // 파일 확장자 체크
                const ext = path.extname(fullPath);
                if (trackedExtensions.includes(ext)) {
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  const hash = crypto
                    .createHash('sha256')
                    .update(content)
                    .digest('hex');

                  files.push({
                    id: 0,
                    file_path: relPath,
                    file_type: ext,
                    action: 'modified',
                    modified_time: stat.mtime,
                    file_size: stat.size,
                    content_hash: hash,
                    category: this.categorizeFile(ext),
                    created_at: new Date(),
                  });
                }
              }
            } catch (err) {
              console.warn(`⚠️ 파일 처리 실패: ${fullPath}`, err);
            }
          }
        } catch (err) {
          console.warn(`⚠️ 디렉토리 읽기 실패: ${dir}`, err);
        }
      };

      walkDir(this.rootPath);
      console.log(`📝 파일 스캔 완료: ${files.length}개`);
      return files;
    } catch (err) {
      console.error('❌ 스캔 중 오류:', err);
      return files;
    }
  }

  /**
   * 파일 분류
   */
  private categorizeFile(ext: string): string {
    const categories: Record<string, string> = {
      '.md': 'documentation',
      '.ts': 'source_code',
      '.tsx': 'source_code',
      '.js': 'source_code',
      '.json': 'configuration',
      '.sql': 'database',
    };

    return categories[ext] || 'other';
  }

  /**
   * 파일을 데이터베이스에 저장
   */
  private saveFiles(files: FileModification[]): number {
    if (!this.db) return 0;

    let saved = 0;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO file_modifications
        (file_path, file_type, action, modified_time, file_size, content_hash, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of files) {
        try {
          const result = stmt.run(
            file.file_path,
            file.file_type,
            file.action,
            file.modified_time.toISOString(),
            file.file_size,
            file.content_hash,
            file.category
          );

          if ((result as any).changes > 0) {
            saved++;
          }
        } catch (err) {
          console.warn(`⚠️ 파일 저장 실패: ${file.file_path}`, err);
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
