#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
The Nexus - 7-Stage Project Buildup Workflow Engine
=====================================================
의장님이 정의한 7단계 + 루프 워크플로우 자동화 엔진.

7단계:
  1. 기획 (Planning)             : Chairman + AI (변증법적 질의응답)
  2. 공정관리계획표 작성 (Plan)  : AI                              <-- LOOP ENTRY
  3. 개발 (Development)          : AI
  4. 검토 (Review)               : Chairman
  5. 수정/개선 (Improvement)     : AI
  6. 검수 (Verification)         : Chairman                        <-- LOOP EXIT GATE
  7. 배포 (Deployment)           : AI

루프: STEP 2-6 → 목적/목표 달성 시까지 반복
탈출: STEP 6에서 의장님 '달성' 판정 시 STEP 7 진입

권한:
  - Chairman 게이트: STEP 1, 4, 6 (2% sovereignty)
  - AI 자동: STEP 2, 3, 5, 7 (98% automation)

"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
"Exists in the Moment, Vanishes in Time."
"""

from __future__ import annotations

import io
import json
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Workflow"
DOCUMENTS_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Documents"
CYCLES_DIR = WORKFLOW_DIR / "cycles"
STATE_FILE = WORKFLOW_DIR / "workflow_state.json"


class Stage(Enum):
    PLANNING = (1, "기획", "Chairman+AI", "변증법적 질의응답", False, False)
    PROCESS_PLAN = (2, "공정관리계획표", "AI", "갭 분석 + 작업 정의", True, False)
    DEVELOPMENT = (3, "개발", "AI", "코드 구현 + 테스트", True, False)
    REVIEW = (4, "검토", "Chairman", "산출물 검토 + 피드백", True, False)
    IMPROVEMENT = (5, "수정/개선", "AI", "피드백 반영", True, False)
    VERIFICATION = (6, "검수", "Chairman", "목적/목표 달성 판정", True, True)
    DEPLOYMENT = (7, "배포", "AI", "Release 패키징", False, False)

    def __init__(self, idx, name_kr, owner, action, loop_member, loop_exit):
        self.idx = idx
        self.name_kr = name_kr
        self.owner = owner
        self.action = action
        self.loop_member = loop_member
        self.loop_exit = loop_exit

    @property
    def is_chairman_gate(self):
        return "Chairman" in self.owner

    @property
    def is_auto(self):
        return self.owner == "AI"

    @classmethod
    def by_idx(cls, idx):
        for s in cls:
            if s.idx == idx:
                return s
        raise ValueError(f"No stage with idx={idx}")


class Status(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_CHAIRMAN = "awaiting_chairman"
    COMPLETED = "completed"
    LOOPED_BACK = "looped_back"


@dataclass
class CycleRecord:
    cycle_num: int
    started_at: str
    completed_at: Optional[str] = None
    exit_decision: Optional[str] = None
    stages_completed: list[int] = field(default_factory=list)


@dataclass
class WorkflowState:
    project: str = "PJT_CDC_The_Nexus"
    version: str = "0.3.0"
    current_stage: int = 4
    current_cycle: int = 1
    cycles: list[CycleRecord] = field(default_factory=list)
    last_updated: str = ""

    def to_dict(self):
        return {
            "project": self.project,
            "version": self.version,
            "current_stage": self.current_stage,
            "current_cycle": self.current_cycle,
            "cycles": [asdict(c) for c in self.cycles],
            "last_updated": self.last_updated,
        }

    @classmethod
    def from_dict(cls, data):
        state = cls(
            project=data.get("project", "PJT_CDC_The_Nexus"),
            version=data.get("version", "0.3.0"),
            current_stage=data.get("current_stage", 1),
            current_cycle=data.get("current_cycle", 1),
            last_updated=data.get("last_updated", ""),
        )
        state.cycles = [CycleRecord(**c) for c in data.get("cycles", [])]
        return state


class WorkflowEngine:
    """7-Stage + Loop 워크플로우 오케스트레이터."""

    def __init__(self):
        self.state = self._load_or_init()

    def _load_or_init(self):
        if STATE_FILE.exists():
            with STATE_FILE.open("r", encoding="utf-8") as f:
                return WorkflowState.from_dict(json.load(f))
        return self._init_default()

    def _init_default(self):
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        state = WorkflowState(last_updated=now)
        state.cycles = [
            CycleRecord(
                cycle_num=1,
                started_at=now,
                stages_completed=[1, 2, 3],
            )
        ]
        return state

    def save(self):
        self.state.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with STATE_FILE.open("w", encoding="utf-8") as f:
            json.dump(self.state.to_dict(), f, ensure_ascii=False, indent=2)

    def current_cycle_record(self):
        return self.state.cycles[-1] if self.state.cycles else None

    def advance(self, decision=None):
        """현재 단계 종료 + 다음 단계 진입.

        Chairman 게이트는 decision 필수:
          - 'approve' : 다음 단계로
          - 'reject'  : 이전 단계로 (드물게 사용)
          - 'achieved': STEP 6에서만 → STEP 7로 (루프 탈출)
          - 'not_achieved': STEP 6에서만 → STEP 2로 (다음 사이클)
        """
        current_idx = self.state.current_stage
        stage = Stage.by_idx(current_idx)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cycle = self.current_cycle_record()

        if stage.is_chairman_gate and decision is None:
            return {
                "result": "awaiting_decision",
                "stage": current_idx,
                "stage_name": stage.name_kr,
                "owner": stage.owner,
                "message": f"STEP {current_idx} ({stage.name_kr})는 의장님 결정 필요.",
                "valid_decisions": self._valid_decisions_for(stage),
            }

        if cycle is not None and current_idx not in cycle.stages_completed:
            cycle.stages_completed.append(current_idx)

        # STEP 6 검수 — 루프 탈출 결정
        if stage.loop_exit:
            if decision == "achieved":
                self._close_cycle(cycle, "achieved", now)
                self.state.current_stage = 7
                self.save()
                return {
                    "result": "loop_exit",
                    "stage": 7,
                    "message": f"Cycle #{cycle.cycle_num} 목표 달성. STEP 7 배포 진입.",
                }
            if decision == "not_achieved":
                self._close_cycle(cycle, "not_achieved", now)
                new_cycle = CycleRecord(
                    cycle_num=cycle.cycle_num + 1,
                    started_at=now,
                    stages_completed=[],
                )
                self.state.cycles.append(new_cycle)
                self.state.current_cycle = new_cycle.cycle_num
                self.state.current_stage = 2
                self.save()
                return {
                    "result": "loop_continue",
                    "stage": 2,
                    "cycle": new_cycle.cycle_num,
                    "message": f"미달성 판정. Cycle #{new_cycle.cycle_num} 진입 (STEP 2 공정관리계획표).",
                }

        # STEP 7 완료 — 워크플로우 종료
        if current_idx == 7:
            self.save()
            return {
                "result": "workflow_complete",
                "stage": 7,
                "message": "STEP 7 배포 완료. 프로젝트 워크플로우 종료.",
            }

        # 일반 진행
        self.state.current_stage += 1
        self.save()
        next_stage = Stage.by_idx(self.state.current_stage)
        return {
            "result": "advanced",
            "stage": next_stage.idx,
            "stage_name": next_stage.name_kr,
            "owner": next_stage.owner,
            "auto": next_stage.is_auto,
            "message": f"STEP {next_stage.idx} ({next_stage.name_kr}) 진입. 담당: {next_stage.owner}",
        }

    def _valid_decisions_for(self, stage):
        if stage.loop_exit:
            return ["achieved", "not_achieved", "reject"]
        return ["approve", "reject"]

    def _close_cycle(self, cycle, decision, now):
        if cycle:
            cycle.completed_at = now
            cycle.exit_decision = decision

    def status_report(self):
        cycle = self.current_cycle_record()
        cycle_label = f"Cycle #{cycle.cycle_num}" if cycle else "Cycle #?"
        loop_arrow = "🔄"
        gate_c = "🅒"
        gate_a = "🅐"

        lines = [
            f"# 워크플로우 상태 — {self.state.project} v{self.state.version}",
            f"갱신: {self.state.last_updated}",
            f"현재 사이클: **{cycle_label}**",
            "",
            "| STEP | 단계 | 담당 | 게이트 | 루프 | 현재 |",
            "|:---:|:---|:---|:---:|:---:|:---:|",
        ]
        for s in Stage:
            here = "◀ HERE" if s.idx == self.state.current_stage else ""
            gate = gate_c if s.is_chairman_gate else gate_a
            loop = loop_arrow if s.loop_member else "—"
            lines.append(f"| {s.idx} | {s.name_kr} | {s.owner} | {gate} | {loop} | {here} |")

        if cycle:
            lines.extend([
                "",
                f"## 사이클 진행 상황 (Cycle #{cycle.cycle_num})",
                "",
                f"- 시작: {cycle.started_at}",
                f"- 완료된 STEP: {', '.join(map(str, cycle.stages_completed)) or '(없음)'}",
            ])

        lines.extend([
            "",
            "## 명령어",
            "- `py workflow_engine.py status` — 현재 상태",
            "- `py workflow_engine.py advance approve` — Chairman 게이트 승인",
            "- `py workflow_engine.py advance achieved` — STEP 6 달성 → STEP 7",
            "- `py workflow_engine.py advance not_achieved` — STEP 6 미달성 → 다음 사이클",
            "- `py workflow_engine.py execute` — 현재 AI 자동 단계 실행",
        ])
        return "\n".join(lines)

    def execute_ai_stage(self, stage_idx=None):
        """AI 자동 단계 실행 디스패처."""
        idx = stage_idx or self.state.current_stage
        stage = Stage.by_idx(idx)
        if not stage.is_auto:
            return {"result": "error", "message": f"STEP {idx}는 Chairman 게이트입니다."}

        cycle_num = self.state.current_cycle

        if idx == 2:
            return {
                "result": "manual_trigger",
                "message": f"STEP 2 공정관리계획표 작성: cycles/cycle_{cycle_num:02d}/CYCLE_{cycle_num:02d}_PLAN.md 직접 생성 필요.",
            }
        if idx == 3:
            return {"result": "manual_trigger", "message": "STEP 3 개발: 개발 작업 진행 + DEV_REPORT 생성."}
        if idx == 5:
            try:
                from feedback_parser import process_feedback
                feedback_path = CYCLES_DIR / f"cycle_{cycle_num:02d}" / f"FEEDBACK_CYCLE_{cycle_num:02d}.md"
                return process_feedback(feedback_path)
            except ImportError as e:
                return {"result": "error", "message": str(e)}
        if idx == 7:
            try:
                from deployment_orchestrator import deploy_release
                return deploy_release(version="1.0.0")
            except ImportError as e:
                return {"result": "error", "message": str(e)}
        return {"result": "skipped"}


def main(argv):
    engine = WorkflowEngine()
    if len(argv) < 2 or argv[1] == "status":
        print(engine.status_report())
        return 0
    cmd = argv[1].lower()
    if cmd == "advance":
        decision = argv[2] if len(argv) > 2 else None
        result = engine.advance(decision=decision)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if cmd == "execute":
        stage_idx = int(argv[2]) if len(argv) > 2 else None
        result = engine.execute_ai_stage(stage_idx)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    if cmd == "init":
        STATE_FILE.unlink(missing_ok=True)
        engine = WorkflowEngine()
        engine.save()
        print(engine.status_report())
        return 0
    print(f"Unknown command: {cmd}")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
