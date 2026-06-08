/**
 * Mining Orchestrator
 * 모든 마이너를 조율하고 관리합니다
 */

import { IMiner, MiningResult } from './types/mining.types';
import { GeminiMiner } from './miners/gemini-miner';
import { DiscordMiner } from './miners/discord-miner';

export class MiningOrchestrator {
  private miners: IMiner[] = [];
  private results: MiningResult[] = [];

  constructor() {
    this.initMiners();
  }

  /**
   * 마이너 초기화
   */
  private initMiners(): void {
    console.log('🔧 마이너 초기화 중...');

    this.miners = [
      new GeminiMiner(),
      new DiscordMiner(),
      // TODO: 추가 마이너들
      // new CalendarMiner(),
      // new FileMiner(),
      // new YouTubeMiner(),
      // new SystemLogMiner(),
    ];

    console.log(`✅ ${this.miners.length}개 마이너 준비 완료`);
  }

  /**
   * 모든 마이너 유효성 검증
   */
  async validateAll(): Promise<boolean> {
    console.log('🔍 마이너 유효성 검증 중...');

    let allValid = true;
    for (const miner of this.miners) {
      try {
        const isValid = await miner.validate();
        const status = isValid ? '✅' : '❌';
        console.log(`${status} ${miner.name}: ${miner.description}`);
        if (!isValid) allValid = false;
      } catch (err) {
        console.error(`❌ ${miner.name} 검증 실패:`, err);
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * 모든 마이너 실행
   */
  async executeAll(): Promise<MiningResult[]> {
    console.log('\n🚀 전체 마이닝 시작\n');
    this.results = [];

    const startTime = Date.now();

    for (const miner of this.miners) {
      console.log(`\n▶ ${miner.name} 실행 중...`);
      try {
        const result = await miner.execute();
        this.results.push(result);

        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${miner.name}:`);
        console.log(`   - 처리: ${result.records_processed}개`);
        console.log(`   - 저장: ${result.records_saved}개`);
        console.log(`   - 시간: ${result.execution_time_seconds.toFixed(2)}초`);

        if (result.error) {
          console.log(`   - 오류: ${result.error}`);
        }
      } catch (err) {
        console.error(`❌ ${miner.name} 실행 중 오류:`, err);
        this.results.push({
          success: false,
          miner_name: miner.name,
          records_processed: 0,
          records_saved: 0,
          error: err instanceof Error ? err.message : String(err),
          execution_time_seconds: (Date.now() - startTime) / 1000,
          timestamp: new Date(),
        });
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    // 최종 보고
    this.printSummary(totalTime);

    return this.results;
  }

  /**
   * 특정 마이너만 실행
   */
  async execute(minerName: string): Promise<MiningResult | null> {
    const miner = this.miners.find(m => m.name === minerName);
    if (!miner) {
      console.error(`❌ 마이너 "${minerName}" 을 찾을 수 없습니다`);
      return null;
    }

    console.log(`\n▶ ${miner.name} 실행 중...`);
    try {
      const result = await miner.execute();
      this.results.push(result);
      return result;
    } catch (err) {
      console.error(`❌ 실행 실패:`, err);
      return null;
    }
  }

  /**
   * 마이닝 결과 요약 출력
   */
  private printSummary(totalTime: number): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 마이닝 완료 보고서');
    console.log('='.repeat(70));

    const totalProcessed = this.results.reduce((sum, r) => sum + r.records_processed, 0);
    const totalSaved = this.results.reduce((sum, r) => sum + r.records_saved, 0);
    const successful = this.results.filter(r => r.success).length;

    console.log(`\n📈 통계:`);
    console.log(`  - 총 실행: ${this.results.length}개 마이너`);
    console.log(`  - 성공: ${successful}개`);
    console.log(`  - 실패: ${this.results.length - successful}개`);
    console.log(`  - 총 처리: ${totalProcessed}개`);
    console.log(`  - 총 저장: ${totalSaved}개`);
    console.log(`  - 총 소요시간: ${totalTime.toFixed(2)}초`);

    console.log(`\n📋 상세:`);
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.miner_name}`);
      console.log(`     처리: ${result.records_processed} → 저장: ${result.records_saved}`);
      console.log(`     시간: ${result.execution_time_seconds.toFixed(2)}초`);
    }

    console.log('\n' + '='.repeat(70));
  }

  /**
   * 마이너 목록 조회
   */
  listMiners(): void {
    console.log('\n📋 사용 가능한 마이너:');
    for (const miner of this.miners) {
      console.log(`  - ${miner.name}: ${miner.description}`);
    }
  }

  /**
   * 결과 조회
   */
  getResults(): MiningResult[] {
    return this.results;
  }
}

// CLI 엔트리 포인트
if (import.meta.main) {
  (async () => {
    const orchestrator = new MiningOrchestrator();

    // 모든 마이너 검증
    const isValid = await orchestrator.validateAll();
    if (!isValid) {
      console.error('⚠️ 일부 마이너가 검증 실패했습니다');
    }

    // 모든 마이너 실행
    await orchestrator.executeAll();

    // 마이너 목록 출력
    orchestrator.listMiners();
  })().catch(console.error);
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
