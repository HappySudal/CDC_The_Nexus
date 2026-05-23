#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STEP 4 Feedback Parser
=======================
의장님이 STEP 3에서 작성한 FEEDBACK_STEP3.md를 자동 파싱하여
AI Agents가 자동으로 수정 작업에 착수하도록 분류한다.

입력: FEEDBACK_STEP3.md (Critical / High / Medium / Low 분류)
출력:
  - feedback_tasks.json (자동 수정 작업 큐)
  - STEP_4_PLAN.md (의장님 가시성 리포트)
"""

from __future__ import annotations

import io
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


PROJECT_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Workflow"
DOCUMENTS_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Documents"


PRIORITY_PATTERN = re.compile(
    r"###\s+(Critical|High|Medium|Low)\b.*?\n(.*?)(?=###|\Z)",
    re.DOTALL | re.IGNORECASE,
)
ITEM_PATTERN = re.compile(r"^\s*\d+\.\s+(.+?)$", re.MULTILINE)


def parse_feedback(feedback_path: Path) -> dict:
    """피드백 마크다운을 우선순위별 작업 큐로 변환."""
    if not feedback_path.exists():
        return {
            "result": "no_feedback",
            "message": f"{feedback_path.name} 파일이 없습니다. 의장님 피드백 대기 중.",
            "tasks": [],
        }

    content = feedback_path.read_text(encoding="utf-8")
    tasks_by_priority = {"critical": [], "high": [], "medium": [], "low": []}

    for match in PRIORITY_PATTERN.finditer(content):
        priority = match.group(1).lower()
        block = match.group(2)
        for item in ITEM_PATTERN.finditer(block):
            text = item.group(1).strip()
            if text and not text.startswith("[구체적 요구사항]"):
                tasks_by_priority[priority].append({
                    "priority": priority,
                    "description": text,
                    "status": "pending",
                    "created_at": datetime.now().isoformat(timespec="seconds"),
                })

    total = sum(len(v) for v in tasks_by_priority.values())

    overall_match = re.search(r"##\s*종합\s*판정\s*\n(.*?)(?=##|\Z)", content, re.DOTALL)
    verdict = "unknown"
    if overall_match:
        block = overall_match.group(1)
        if "[x] 전체 승인" in block or "[X] 전체 승인" in block:
            verdict = "full_approve"
        elif "[x] 조건부" in block or "[X] 조건부" in block:
            verdict = "conditional"
        elif "[x] 재작업" in block or "[X] 재작업" in block:
            verdict = "rework"

    return {
        "result": "parsed",
        "verdict": verdict,
        "task_count": total,
        "tasks_by_priority": tasks_by_priority,
        "parsed_at": datetime.now().isoformat(timespec="seconds"),
    }


def save_task_queue(parsed: dict) -> Path:
    queue_path = WORKFLOW_DIR / "feedback_tasks.json"
    queue_path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    return queue_path


def generate_step4_plan(parsed: dict) -> Path:
    plan_path = DOCUMENTS_DIR / "STEP_4_PLAN.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    lines = [
        "# STEP 4 자동 수정 실행 계획",
        f"> 생성: {now} | 자동 생성 by feedback_parser.py",
        "",
        f"## 의장님 종합 판정: **{parsed.get('verdict', 'unknown').upper()}**",
        f"## 수정 대상 총: {parsed.get('task_count', 0)}건",
        "",
        "| 우선순위 | 건수 | 처리 방식 |",
        "|:---:|:---:|:---|",
    ]

    plan_map = {
        "critical": "즉시 수정 + 회귀 테스트 즉시 실행",
        "high": "이번 사이클 내 수정 + 단위 테스트",
        "medium": "수정 후 통합 테스트 결과 보고",
        "low": "백로그 기록 후 의장님 확인 시 처리",
    }

    for pri in ("critical", "high", "medium", "low"):
        tasks = parsed.get("tasks_by_priority", {}).get(pri, [])
        lines.append(f"| {pri.upper()} | {len(tasks)} | {plan_map[pri]} |")

    lines += ["", "## 상세 작업 목록", ""]
    for pri in ("critical", "high", "medium", "low"):
        tasks = parsed.get("tasks_by_priority", {}).get(pri, [])
        if not tasks:
            continue
        lines.append(f"### {pri.upper()}")
        for i, t in enumerate(tasks, 1):
            lines.append(f"{i}. {t['description']}")
        lines.append("")

    lines += [
        "---",
        "",
        "**\"시각(時刻)에 존재하고, 시간(時間)에 소멸한다.\"**",
        "**\"Exists in the Moment, Vanishes in Time.\"**",
        "",
    ]

    plan_path.write_text("\n".join(lines), encoding="utf-8")
    return plan_path


def process_feedback(feedback_path: Optional[Path] = None) -> dict:
    feedback_path = feedback_path or (DOCUMENTS_DIR / "FEEDBACK_STEP3.md")
    parsed = parse_feedback(Path(feedback_path))
    if parsed.get("result") == "no_feedback":
        return parsed
    queue_path = save_task_queue(parsed)
    plan_path = generate_step4_plan(parsed)
    parsed["queue_path"] = str(queue_path)
    parsed["plan_path"] = str(plan_path)
    return parsed


def main(argv: list[str]) -> int:
    feedback_path = Path(argv[1]) if len(argv) > 1 else DOCUMENTS_DIR / "FEEDBACK_STEP3.md"
    result = process_feedback(feedback_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("result") in ("parsed", "no_feedback") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
