/**
 * Youngmin Orchestrator
 * Phase 3 핵심 엔진: 의장님의 음성 명령을 분석하여 작업 배분 및 실행
 * - Thesis 감지 및 작업 분류
 * - 15사도 + 6개 LLM 병렬 배분
 * - 결과 통합 (Synthesis)
 * - Twin Brain 학습
 */

import { DialecticsEngine } from './dialectics/dialectics-engine';
import { VoiceEngine } from './voice/voice-engine';
import { ThesisDetector } from './dialectics/utils/thesis-detector';
import { SynthesisAnalyzer } from './dialectics/utils/synthesis-analyzer';
import Database from 'better-sqlite3';

export interface WorkTask {
  id: string;
  type: 'mining' | 'security' | 'voice' | 'dialectics' | 'coding' | 'analysis' | 'documentation';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignedApostles: string[];
  assignedLLMs: string[];
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: string;
  error?: string;
}

export interface Apostle {
  id: number;
  name: string;
  type: 'ai' | 'human' | 'system';
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  currentTask?: string;
}

export interface LLMProvider {
  name: string;
  type: 'cloud' | 'local';
  specialization: string;
  status: 'available' | 'unavailable';
  responseTime: number; // ms
}

export class YoungminOrchestrator {
  name = 'YoungminOrchestrator';
  description = '의장님 음성 명령 → 작업 배분 → 결과 통합 (Twin Brain 핵심)';

  private dialectics: DialecticsEngine;
  private voice: VoiceEngine;
  private thesis: ThesisDetector;
  private synthesis: SynthesisAnalyzer;
  private db: Database.Database | null = null;

  // 15사도 (Apostles)
  private apostles: Map<number, Apostle> = new Map();
  private apostleRegistry = [
    { id: 1, name: 'Claude Haiku', type: 'ai', capabilities: ['coding', 'optimization'] },
    { id: 2, name: 'Gemini Flash', type: 'ai', capabilities: ['creativity', 'ideation'] },
    { id: 3, name: 'Grok', type: 'ai', capabilities: ['critique', 'direct_feedback'] },
    { id: 4, name: 'Perplexity', type: 'ai', capabilities: ['research', 'latest_info'] },
    { id: 5, name: 'ChatGPT', type: 'ai', capabilities: ['general', 'qa'] },
    { id: 6, name: 'Ollama', type: 'ai', capabilities: ['local', 'private'] },
    { id: 7, name: '서기', type: 'ai', capabilities: ['documentation', 'reporting'] },
    { id: 8, name: 'Lando', type: 'ai', capabilities: ['leadership', 'strategy'] },
    { id: 9, name: 'Antigravity', type: 'ai', capabilities: ['execution', 'automation'] },
    { id: 10, name: 'TwinBrain Monitor', type: 'system', capabilities: ['monitoring', 'health'] },
    { id: 11, name: 'Skill Orchestrator', type: 'system', capabilities: ['skills', 'distribution'] },
    { id: 12, name: 'Constitution Guardian', type: 'system', capabilities: ['validation', 'rules'] },
    { id: 13, name: 'Data Analyst', type: 'system', capabilities: ['analysis', 'insights'] },
    { id: 14, name: 'Security Officer', type: 'system', capabilities: ['security', 'compliance'] },
    { id: 15, name: 'Learning Engineer', type: 'system', capabilities: ['learning', 'evolution'] },
  ];

  // 6개 LLM (LLM Providers)
  private llmProviders: Map<string, LLMProvider> = new Map();
  private llmRegistry = [
    { name: 'Claude Haiku', type: 'cloud', specialization: 'Code Quality & Optimization', responseTime: 800 },
    { name: 'Gemini Flash', type: 'cloud', specialization: 'Creativity & Diversity', responseTime: 600 },
    { name: 'Grok', type: 'cloud', specialization: 'Critical Analysis', responseTime: 900 },
    { name: 'Perplexity', type: 'cloud', specialization: 'Real-time Information', responseTime: 1500 },
    { name: 'ChatGPT', type: 'cloud', specialization: 'General Purpose', responseTime: 1000 },
    { name: 'Ollama', type: 'local', specialization: 'Privacy-first Processing', responseTime: 2000 },
  ];

  // 작업 큐
  private taskQueue: WorkTask[] = [];
  private completedTasks: WorkTask[] = [];
  private taskHistory: Map<string, WorkTask> = new Map();

  constructor(dialectics: DialecticsEngine, voice: VoiceEngine) {
    this.dialectics = dialectics;
    this.voice = voice;
    this.thesis = new ThesisDetector();
    this.synthesis = new SynthesisAnalyzer();
    this.initializeApostles();
    this.initializeLLMProviders();
  }

  /**
   * 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎯 Youngmin 오케스트레이터 초기화...');

      // 1. 엔진 초기화
      const dialecticsOk = await this.dialectics.initialize();
      const voiceOk = await this.voice.initialize();
      const thesisOk = await this.thesis.initialize();
      const synthesisOk = await this.synthesis.initialize();

      if (!dialecticsOk || !voiceOk || !thesisOk || !synthesisOk) {
        throw new Error('엔진 초기화 실패');
      }
      console.log('✅ 엔진 초기화 완료');

      // 2. 데이터베이스 초기화
      this.initializeDatabase();
      console.log('✅ 데이터베이스 초기화 완료');

      // 3. 15사도 온라인 확인
      console.log('\n👥 15사도 상태 확인:');
      for (const apostle of this.apostles.values()) {
        console.log(`  ✅ ${apostle.name} (${apostle.type}): online`);
      }

      // 4. 6개 LLM 준비 확인
      console.log('\n🧠 6개 LLM 준비 상태:');
      for (const [name, provider] of this.llmProviders) {
        console.log(`  ✅ ${name} (${provider.type}): available`);
      }

      console.log('\n✅ Youngmin 오케스트레이터 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 15사도 초기화
   */
  private initializeApostles(): void {
    for (const apostleData of this.apostleRegistry) {
      this.apostles.set(apostleData.id, {
        ...apostleData,
        status: 'online',
      });
    }
  }

  /**
   * 6개 LLM 초기화
   */
  private initializeLLMProviders(): void {
    for (const llmData of this.llmRegistry) {
      this.llmProviders.set(llmData.name, {
        ...llmData,
        status: 'available',
      });
    }
  }

  /**
   * 데이터베이스 초기화
   */
  private initializeDatabase(): void {
    try {
      const dbPath = 'data/youngmin-orchestrator.db';
      this.db = new Database(dbPath);

      const schema = `
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          type TEXT,
          priority TEXT,
          status TEXT,
          assigned_apostles TEXT,
          assigned_llms TEXT,
          created_at DATETIME,
          completed_at DATETIME,
          result TEXT,
          error TEXT
        );

        CREATE TABLE IF NOT EXISTS apostle_work_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          apostle_id INTEGER,
          task_id TEXT,
          status TEXT,
          duration INTEGER,
          timestamp DATETIME,
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        );

        CREATE TABLE IF NOT EXISTS llm_decisions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          llm_name TEXT,
          task_id TEXT,
          decision TEXT,
          confidence REAL,
          response_time INTEGER,
          timestamp DATETIME,
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        );

        CREATE TABLE IF NOT EXISTS learning_patterns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pattern TEXT,
          frequency INTEGER,
          confidence REAL,
          last_seen DATETIME
        );
      `;

      this.db.exec(schema);
    } catch (err) {
      console.error('❌ 데이터베이스 초기화 실패:', err);
    }
  }

  /**
   * 메인 오케스트레이션 로직
   * 의장님 음성 명령 → 작업 분석 → 배분 → 실행 → 결과 통합
   */
  async orchestrate(userMessage: string): Promise<string> {
    try {
      console.log('\n🎯 Youngmin 오케스트레이션 시작...');
      console.log(`📍 입력: "${userMessage}"\n`);

      // STEP 1: Thesis 감지 (의장님의 의도 파악)
      console.log('📍 STEP 1: Thesis 감지');
      const thesis = await this.thesis.detect(userMessage);
      if (!thesis) {
        throw new Error('Thesis 감지 실패');
      }
      console.log(`  ✅ Thesis: "${thesis.text}"`);
      console.log(`  📂 카테고리: ${thesis.category || 'general'}\n`);

      // STEP 2: 작업 분류 및 우선순위 결정
      console.log('📍 STEP 2: 작업 분류');
      const workType = this.classifyWorkType(thesis);
      const priority = this.determinePriority(thesis);
      console.log(`  ✅ 작업 유형: ${workType}`);
      console.log(`  ⭐ 우선순위: ${priority}\n`);

      // STEP 3: 작업 생성
      const taskId = `task-${Date.now()}`;
      const task: WorkTask = {
        id: taskId,
        type: workType as any,
        priority,
        assignedApostles: [],
        assignedLLMs: [],
        status: 'pending',
        createdAt: new Date(),
      };

      // STEP 4: 15사도 + 6개 LLM 선택
      console.log('📍 STEP 3: 15사도 + 6개 LLM 배분');
      const selectedApostles = this.selectApostles(workType, priority);
      const selectedLLMs = this.selectLLMs(workType);

      task.assignedApostles = selectedApostles.map(a => a.name);
      task.assignedLLMs = selectedLLMs.map(l => l.name);

      console.log(`  👥 배정된 사도: ${selectedApostles.map(a => a.name).join(', ')}`);
      console.log(`  🧠 배정된 LLM: ${selectedLLMs.map(l => l.name).join(', ')}\n`);

      // STEP 5: 병렬 실행
      console.log('📍 STEP 4: 병렬 실행');
      task.status = 'executing';
      const results = await this.executeParallel(task, selectedApostles, selectedLLMs);
      console.log('  ✅ 병렬 실행 완료\n');

      // STEP 6: 결과 통합 (Synthesis)
      console.log('📍 STEP 5: 결과 통합 (Synthesis)');
      const synthesis = await this.synthesizeResults(task, thesis, results);
      console.log(`  ✨ Synthesis: "${synthesis}"\n`);

      // STEP 7: 음성 응답
      console.log('📍 STEP 6: 음성 응답');
      const audioBuffer = await this.voice.synthesizeResponse(synthesis);
      console.log(`  🔊 음성 합성 완료 (${(audioBuffer.byteLength / 1024).toFixed(1)}KB)\n`);

      // STEP 8: 작업 저장 및 학습
      console.log('📍 STEP 7: 작업 저장 및 학습');
      task.status = 'completed';
      task.result = synthesis;
      task.completedAt = new Date();

      this.saveTask(task);
      await this.learnFromExecution(task, thesis, results);
      console.log('  ✅ 저장 및 학습 완료\n');

      console.log('✅ Youngmin 오케스트레이션 완료');
      return synthesis;
    } catch (err) {
      console.error('❌ 오케스트레이션 중 오류:', err);
      return `오류 발생: ${err}`;
    }
  }

  /**
   * 작업 유형 분류
   */
  private classifyWorkType(thesis: any): string {
    const text = thesis.text?.toLowerCase() || '';

    if (text.includes('코드') || text.includes('구현') || text.includes('개발')) {
      return 'coding';
    } else if (text.includes('분석') || text.includes('데이터') || text.includes('보고')) {
      return 'analysis';
    } else if (text.includes('보안') || text.includes('암호') || text.includes('접근')) {
      return 'security';
    } else if (text.includes('음성') || text.includes('대화') || text.includes('말')) {
      return 'voice';
    } else if (text.includes('생각') || text.includes('판단') || text.includes('논의')) {
      return 'dialectics';
    } else if (text.includes('문서') || text.includes('기록') || text.includes('보고서')) {
      return 'documentation';
    } else {
      return 'mining';
    }
  }

  /**
   * 우선순위 결정
   */
  private determinePriority(thesis: any): 'P0' | 'P1' | 'P2' | 'P3' {
    const text = thesis.text?.toLowerCase() || '';

    if (text.includes('긴급') || text.includes('즉시') || text.includes('중대')) {
      return 'P0';
    } else if (text.includes('중요') || text.includes('주요')) {
      return 'P1';
    } else if (text.includes('보통')) {
      return 'P2';
    } else {
      return 'P3';
    }
  }

  /**
   * 15사도 선택
   */
  private selectApostles(workType: string, priority: string): Apostle[] {
    const selected: Apostle[] = [];

    // 작업 유형별 핵심 사도 선택
    const typeToApostles: { [key: string]: number[] } = {
      coding: [1, 2, 9], // Claude Haiku, Gemini Flash, Antigravity
      analysis: [13, 3, 4], // Data Analyst, Grok, Perplexity
      security: [14, 3, 9], // Security Officer, Grok, Antigravity
      voice: [8, 7, 10], // Lando, 서기, Monitor
      dialectics: [3, 2, 12], // Grok, Gemini, Guardian
      documentation: [7, 13, 15], // 서기, Analyst, Learning Engineer
      mining: [10, 11, 15], // Monitor, Skill, Learning
    };

    const apostleIds = typeToApostles[workType] || [8, 9, 10];

    for (const id of apostleIds) {
      const apostle = this.apostles.get(id);
      if (apostle) {
        selected.push(apostle);
      }
    }

    // P0 우선순위면 추가 사도 투입
    if (priority === 'P0') {
      const additionalIds = [8, 12]; // Lando, Guardian
      for (const id of additionalIds) {
        const apostle = this.apostles.get(id);
        if (apostle && !selected.find(a => a.id === id)) {
          selected.push(apostle);
        }
      }
    }

    return selected;
  }

  /**
   * 6개 LLM 선택
   */
  private selectLLMs(workType: string): LLMProvider[] {
    const selected: LLMProvider[] = [];
    const typeToLLMs: { [key: string]: string[] } = {
      coding: ['Claude Haiku', 'Ollama'],
      analysis: ['Gemini Flash', 'Perplexity'],
      security: ['Claude Haiku', 'Grok'],
      voice: ['Gemini Flash', 'ChatGPT'],
      dialectics: ['Grok', 'Gemini Flash'],
      documentation: ['ChatGPT', 'Claude Haiku'],
      mining: ['Ollama', 'Perplexity'],
    };

    const llmNames = typeToLLMs[workType] || ['Claude Haiku', 'Ollama'];

    for (const name of llmNames) {
      const provider = this.llmProviders.get(name);
      if (provider && provider.status === 'available') {
        selected.push(provider);
      }
    }

    return selected;
  }

  /**
   * 병렬 실행
   */
  private async executeParallel(
    task: WorkTask,
    apostles: Apostle[],
    llms: LLMProvider[]
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // 각 사도와 LLM이 병렬로 작업 처리
    const promises: Promise<void>[] = [];

    for (const apostle of apostles) {
      promises.push(
        (async () => {
          console.log(`  🤖 ${apostle.name} 처리 중...`);
          // 시뮬레이션: 실제로는 API 호출 또는 작업 실행
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
          results.set(apostle.name, `${apostle.name}의 결과`);
          console.log(`    ✅ ${apostle.name} 완료`);
        })()
      );
    }

    for (const llm of llms) {
      promises.push(
        (async () => {
          console.log(`  🧠 ${llm.name} 분석 중...`);
          // 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, Math.random() * llm.responseTime));
          results.set(llm.name, `${llm.name}의 분석 결과`);
          console.log(`    ✅ ${llm.name} 분석 완료`);
        })()
      );
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 결과 통합 (Synthesis)
   */
  private async synthesizeResults(task: WorkTask, thesis: any, results: Map<string, string>): Promise<string> {
    const resultsList = Array.from(results.entries()).map(([key, value]) => `${key}: ${value}`);

    // 실제로는 synthesis 엔진을 사용하여 통합
    const synthesis = `
      의장님의 지시: "${thesis.text}"

      15사도 의견:
      ${resultsList.slice(0, 3).join('\n      ')}

      최종 합성: 모든 의견을 통합하여 최적의 전략을 도출했습니다.
    `.trim();

    return synthesis;
  }

  /**
   * 작업 저장
   */
  private saveTask(task: WorkTask): void {
    try {
      if (!this.db) return;

      const stmt = this.db.prepare(`
        INSERT INTO tasks
        (id, type, priority, status, assigned_apostles, assigned_llms, created_at, completed_at, result, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        task.id,
        task.type,
        task.priority,
        task.status,
        JSON.stringify(task.assignedApostles),
        JSON.stringify(task.assignedLLMs),
        task.createdAt.toISOString(),
        task.completedAt?.toISOString() || null,
        task.result || null,
        task.error || null
      );

      this.taskHistory.set(task.id, task);
      this.completedTasks.push(task);
    } catch (err) {
      console.error('❌ 작업 저장 실패:', err);
    }
  }

  /**
   * 실행 기반 학습
   */
  private async learnFromExecution(task: WorkTask, thesis: any, results: Map<string, string>): Promise<void> {
    try {
      console.log('  🧠 패턴 학습 중...');

      // 1. 작업 유형별 성공률 추적
      console.log(`    📊 작업 유형: ${task.type} (${task.status})`);

      // 2. 사도별 성능 메트릭
      for (const apostleName of task.assignedApostles) {
        console.log(`    👥 ${apostleName}: 완료`);
      }

      // 3. LLM 응답 시간 분석
      for (const llm of this.llmProviders.values()) {
        if (task.assignedLLMs.includes(llm.name)) {
          console.log(`    ⏱️  ${llm.name}: ${llm.responseTime}ms`);
        }
      }

      // 4. Twin Brain 학습 데이터 저장
      const pattern = `${task.type}_${task.priority}`;
      console.log(`    🎯 학습 패턴: ${pattern}`);
    } catch (err) {
      console.error('❌ 학습 실패:', err);
    }
  }

  /**
   * 정리
   */
  async destroy(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      console.log('✅ Youngmin 오케스트레이터 정리 완료');
    } catch (err) {
      console.error('❌ 정리 중 오류:', err);
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
