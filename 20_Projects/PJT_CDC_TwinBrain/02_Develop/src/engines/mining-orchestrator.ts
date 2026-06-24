/**
 * Mining Orchestrator
 * 13가지 데이터 소스의 마이너를 조율하는 통합 엔진
 */

import { NotebookLMMiner } from './miners/notebooklm-miner';
import { YouTubeMiner } from './miners/youtube-miner';
import { DiscordMiner } from './miners/discord-miner';
import { GeminiMiner } from './miners/gemini-miner';
import sqlite3 from 'better-sqlite3';
import { EventEmitter } from 'events';

export class MiningOrchestrator extends EventEmitter {
  private db: sqlite3.Database;
  private miners: Map<string, any> = new Map();
  private syncSchedule: NodeJS.Timer | null = null;
  private syncIntervalMs: number = 3600000; // 1시간

  constructor(dbPath: string = 'mining.db') {
    super();
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  /**
   * 모든 마이너 초기화
   */
  initializMiners(config: any): void {
    try {
      console.log('[MiningOrchestrator] 마이너 초기화 시작...');

      // NotebookLM 마이너
      if (config.notebookLM?.enabled) {
        this.miners.set('notebooklm', new NotebookLMMiner(config.notebookLM.apiKey));
      }

      // YouTube 마이너
      if (config.youtube?.enabled) {
        this.miners.set('youtube', new YouTubeMiner(config.youtube.apiKey, config.youtube.channelIds));
      }

      // Discord 마이너
      if (config.discord?.enabled) {
        this.miners.set('discord', new DiscordMiner(config.discord.client, config.discord.channelIds));
      }

      // Gemini 마이너
      if (config.gemini?.enabled) {
        this.miners.set('gemini', new GeminiMiner(config.gemini.apiKey));
      }

      console.log(`✅ ${this.miners.size}개 마이너 초기화 완료`);
      this.emit('miners_initialized', this.miners.size);
    } catch (error) {
      console.error('[MiningOrchestrator] 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 마이너 동기화 (병렬 실행)
   */
  async syncAllMiners(): Promise<void> {
    try {
      console.log('[MiningOrchestrator] 전체 동기화 시작...');
      this.emit('sync_started');

      const syncPromises = Array.from(this.miners.entries()).map(([name, miner]) =>
        miner.syncNotes?.() || miner.syncVideos?.() || miner.syncMessages?.() || miner.syncConversations?.()
      );

      const results = await Promise.allSettled(syncPromises);

      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          console.log(`  ✅ 마이너 ${index + 1} 동기화 완료`);
        } else {
          console.error(`  ⚠️ 마이너 ${index + 1} 동기화 실패:`, result.reason);
        }
      });

      console.log(`✅ ${successCount}/${this.miners.size} 마이너 동기화 완료`);
      this.emit('sync_completed', { success: successCount, total: this.miners.size });
    } catch (error) {
      console.error('[MiningOrchestrator] 동기화 실패:', error);
      this.emit('sync_error', error);
      throw error;
    }
  }

  /**
   * 정기 동기화 스케줄 시작
   */
  startScheduledSync(): void {
    if (this.syncSchedule) {
      console.warn('[MiningOrchestrator] 이미 스케줄이 실행 중입니다.');
      return;
    }

    console.log(`[MiningOrchestrator] 정기 동기화 시작 (간격: ${this.syncIntervalMs / 1000}초)`);
    this.syncSchedule = setInterval(() => this.syncAllMiners(), this.syncIntervalMs);
    this.emit('schedule_started');
  }

  /**
   * 정기 동기화 스케줄 중지
   */
  stopScheduledSync(): void {
    if (this.syncSchedule) {
      clearInterval(this.syncSchedule);
      this.syncSchedule = null;
      console.log('[MiningOrchestrator] 정기 동기화 중지됨');
      this.emit('schedule_stopped');
    }
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mining_jobs (
        job_id TEXT PRIMARY KEY,
        miner_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        started_at DATETIME,
        completed_at DATETIME,
        record_count INTEGER,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_mining_jobs_status ON mining_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_mining_jobs_miner ON mining_jobs(miner_name);
    `);
  }

  getMiners(): Map<string, any> {
    return this.miners;
  }

  setAutoSyncInterval(intervalMs: number): void {
    this.syncIntervalMs = intervalMs;
  }
}

/**
 * "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
 * "Exists in the Moment, Vanishes in Time."
 */
