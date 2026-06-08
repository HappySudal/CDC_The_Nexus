/**
 * Task Dispatcher
 * Phase 3: 작업 배분 엔진
 * - 작업 우선순위 큐 관리
 * - 15사도에 작업 할당
 * - 병렬 실행 조정
 * - 데드라인 추적
 */

export interface DispatchedTask {
  taskId: string;
  apostleId: number;
  apostleName: string;
  workType: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignedAt: Date;
  expectedCompletionTime: number; // ms
  status: 'assigned' | 'executing' | 'completed' | 'failed' | 'timeout';
  result?: string;
  error?: string;
}

export class TaskDispatcher {
  name = 'TaskDispatcher';
  description = '작업 배분 엔진: 우선순위 기반 작업 할당';

  private taskQueue: Array<{
    taskId: string;
    priority: string;
    workType: string;
    createdAt: Date;
  }> = [];

  private dispatchedTasks: DispatchedTask[] = [];
  private apostleWorkloads: Map<number, number> = new Map(); // apostleId -> taskCount

  /**
   * 작업 큐에 추가
   */
  enqueueTask(taskId: string, workType: string, priority: 'P0' | 'P1' | 'P2' | 'P3'): void {
    this.taskQueue.push({
      taskId,
      workType,
      priority,
      createdAt: new Date(),
    });

    // 우선순위 순으로 정렬
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] -
             priorityOrder[b.priority as keyof typeof priorityOrder];
    });

    console.log(`✅ 작업 큐에 추가: ${taskId} (${priority})`);
  }

  /**
   * 사도 선택 (최소 부하)
   */
  selectApostleForTask(
    workType: string,
    availableApostles: Array<{ id: number; name: string; capabilities: string[] }>
  ): { id: number; name: string } | null {
    // 작업 유형에 맞는 사도 필터링
    const qualified = availableApostles.filter(apostle =>
      apostle.capabilities.some(cap => cap.includes(workType.toLowerCase()) || workType === 'general')
    );

    if (qualified.length === 0) {
      return availableApostles[0] || null;
    }

    // 최소 부하 사도 선택
    let minWorkload = Infinity;
    let selectedApostle = qualified[0];

    for (const apostle of qualified) {
      const workload = this.apostleWorkloads.get(apostle.id) || 0;
      if (workload < minWorkload) {
        minWorkload = workload;
        selectedApostle = apostle;
      }
    }

    return { id: selectedApostle.id, name: selectedApostle.name };
  }

  /**
   * 작업 배분
   */
  dispatchTask(
    taskId: string,
    workType: string,
    priority: 'P0' | 'P1' | 'P2' | 'P3',
    apostleId: number,
    apostleName: string
  ): DispatchedTask {
    const expectedTime = this.calculateExpectedCompletionTime(priority);

    const dispatchedTask: DispatchedTask = {
      taskId,
      apostleId,
      apostleName,
      workType,
      priority,
      assignedAt: new Date(),
      expectedCompletionTime: expectedTime,
      status: 'assigned',
    };

    this.dispatchedTasks.push(dispatchedTask);

    // 사도 작업 부하 증가
    this.apostleWorkloads.set(apostleId, (this.apostleWorkloads.get(apostleId) || 0) + 1);

    console.log(`  🚀 배분: ${apostleName} ← ${workType} (${priority}, ${expectedTime}ms)`);

    return dispatchedTask;
  }

  /**
   * 예상 완료 시간 계산
   */
  private calculateExpectedCompletionTime(priority: 'P0' | 'P1' | 'P2' | 'P3'): number {
    const baseTime = 3000; // 기본 3초
    const priorityMultiplier = { P0: 0.5, P1: 0.75, P2: 1, P3: 1.5 };
    return baseTime * (priorityMultiplier[priority] || 1);
  }

  /**
   * 작업 완료
   */
  completeTask(taskId: string, result: string): DispatchedTask | null {
    const task = this.dispatchedTasks.find(t => t.taskId === taskId);
    if (!task) {
      return null;
    }

    task.status = 'completed';
    task.result = result;

    // 사도 작업 부하 감소
    this.apostleWorkloads.set(task.apostleId, Math.max(0, (this.apostleWorkloads.get(task.apostleId) || 1) - 1));

    console.log(`  ✅ 완료: ${task.apostleName} → ${taskId}`);

    return task;
  }

  /**
   * 작업 실패
   */
  failTask(taskId: string, error: string): DispatchedTask | null {
    const task = this.dispatchedTasks.find(t => t.taskId === taskId);
    if (!task) {
      return null;
    }

    task.status = 'failed';
    task.error = error;

    // 사도 작업 부하 감소
    this.apostleWorkloads.set(task.apostleId, Math.max(0, (this.apostleWorkloads.get(task.apostleId) || 1) - 1));

    console.log(`  ❌ 실패: ${task.apostleName} ← ${error}`);

    return task;
  }

  /**
   * 대기 중인 작업 조회
   */
  getPendingTasks(): Array<{ taskId: string; workType: string; priority: string }> {
    return this.taskQueue;
  }

  /**
   * 사도 작업 부하 조회
   */
  getApostleWorkload(apostleId: number): number {
    return this.apostleWorkloads.get(apostleId) || 0;
  }

  /**
   * 배분된 작업 통계
   */
  getDispatchStatistics(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  } {
    return {
      total: this.dispatchedTasks.length,
      completed: this.dispatchedTasks.filter(t => t.status === 'completed').length,
      failed: this.dispatchedTasks.filter(t => t.status === 'failed').length,
      pending: this.taskQueue.length,
    };
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
