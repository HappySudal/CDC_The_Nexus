"""
CDC Shared Memory Backend (SQLite)
====================================

Cross-session, cross-agent shared memory. Solves Context Amnesia (Fatal #3)
by giving every agent access to:

1. lessons_learned    — Validated facts each agent should remember
2. violations_history — Persistent record of constitutional violations
3. agent_actions      — Action audit trail
4. session_continuity — Last known state per agent

Usage (CLI)
-----------
    py memory_backend.py init
    py memory_backend.py lesson add "Tier 0 paths must never be touched"
    py memory_backend.py lesson list
    py memory_backend.py violations recent --limit 10
    py memory_backend.py action log --agent claude --action "edit CLAUDE.md"

Usage (Library)
---------------
    from memory_backend import Memory
    mem = Memory()
    mem.record_lesson("Tier 0 paths must never be touched", agent="claude")
    lessons = mem.recent_lessons(limit=20)

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator


REPO_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = REPO_ROOT / ".cdc" / "memory.db"


SCHEMA = """
CREATE TABLE IF NOT EXISTS lessons_learned (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    agent       TEXT    NOT NULL,
    category    TEXT,
    lesson      TEXT    NOT NULL,
    context     TEXT,
    confidence  INTEGER DEFAULT 80,
    validated   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lessons_agent ON lessons_learned(agent);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons_learned(category);

CREATE TABLE IF NOT EXISTS violations_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    agent       TEXT    NOT NULL,
    rule        TEXT    NOT NULL,
    action      TEXT,
    target      TEXT,
    blocked     INTEGER NOT NULL,
    reason      TEXT,
    raw_json    TEXT
);

CREATE INDEX IF NOT EXISTS idx_violations_agent ON violations_history(agent);
CREATE INDEX IF NOT EXISTS idx_violations_rule ON violations_history(rule);
CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations_history(timestamp);

CREATE TABLE IF NOT EXISTS agent_actions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    agent       TEXT    NOT NULL,
    session_id  TEXT,
    action_type TEXT    NOT NULL,
    target      TEXT,
    outcome     TEXT,
    metadata    TEXT
);

CREATE INDEX IF NOT EXISTS idx_actions_agent ON agent_actions(agent);
CREATE INDEX IF NOT EXISTS idx_actions_session ON agent_actions(session_id);

CREATE TABLE IF NOT EXISTS session_continuity (
    agent       TEXT    PRIMARY KEY,
    last_seen   TEXT    NOT NULL,
    session_id  TEXT,
    last_action TEXT,
    state_json  TEXT
);
"""


class Memory:
    """SQLite-backed shared memory for all agents."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _init_schema(self) -> None:
        with self._conn() as c:
            c.executescript(SCHEMA)

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Lessons
    # ------------------------------------------------------------------
    def record_lesson(
        self,
        lesson: str,
        agent: str = "system",
        category: str | None = None,
        context: str | None = None,
        confidence: int = 80,
    ) -> int:
        with self._conn() as c:
            cur = c.execute(
                """INSERT INTO lessons_learned
                   (timestamp, agent, category, lesson, context, confidence)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (datetime.now().isoformat(timespec="seconds"), agent, category, lesson, context, confidence),
            )
            return int(cur.lastrowid)

    def recent_lessons(self, limit: int = 50, agent: str | None = None) -> list[dict[str, Any]]:
        with self._conn() as c:
            if agent:
                rows = c.execute(
                    "SELECT * FROM lessons_learned WHERE agent=? ORDER BY id DESC LIMIT ?",
                    (agent, limit),
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT * FROM lessons_learned ORDER BY id DESC LIMIT ?",
                    (limit,),
                ).fetchall()
            return [dict(r) for r in rows]

    def validate_lesson(self, lesson_id: int) -> None:
        with self._conn() as c:
            c.execute("UPDATE lessons_learned SET validated=1 WHERE id=?", (lesson_id,))

    # ------------------------------------------------------------------
    # Violations
    # ------------------------------------------------------------------
    def record_violation(
        self,
        agent: str,
        rule: str,
        target: str = "",
        action: str = "",
        blocked: bool = True,
        reason: str = "",
        raw: dict[str, Any] | None = None,
    ) -> int:
        with self._conn() as c:
            cur = c.execute(
                """INSERT INTO violations_history
                   (timestamp, agent, rule, action, target, blocked, reason, raw_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    datetime.now().isoformat(timespec="seconds"),
                    agent,
                    rule,
                    action,
                    target,
                    1 if blocked else 0,
                    reason,
                    json.dumps(raw, ensure_ascii=False) if raw else None,
                ),
            )
            return int(cur.lastrowid)

    def recent_violations(self, limit: int = 100) -> list[dict[str, Any]]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM violations_history ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    def violation_counts_by_rule(self) -> list[dict[str, Any]]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT rule, COUNT(*) as count FROM violations_history GROUP BY rule ORDER BY count DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------
    def log_action(
        self,
        agent: str,
        action_type: str,
        target: str = "",
        outcome: str = "",
        session_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        with self._conn() as c:
            cur = c.execute(
                """INSERT INTO agent_actions
                   (timestamp, agent, session_id, action_type, target, outcome, metadata)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    datetime.now().isoformat(timespec="seconds"),
                    agent,
                    session_id,
                    action_type,
                    target,
                    outcome,
                    json.dumps(metadata, ensure_ascii=False) if metadata else None,
                ),
            )
            return int(cur.lastrowid)

    def recent_actions(self, agent: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        with self._conn() as c:
            if agent:
                rows = c.execute(
                    "SELECT * FROM agent_actions WHERE agent=? ORDER BY id DESC LIMIT ?",
                    (agent, limit),
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT * FROM agent_actions ORDER BY id DESC LIMIT ?",
                    (limit,),
                ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Session continuity
    # ------------------------------------------------------------------
    def checkpoint_session(
        self,
        agent: str,
        session_id: str,
        last_action: str = "",
        state: dict[str, Any] | None = None,
    ) -> None:
        with self._conn() as c:
            c.execute(
                """INSERT INTO session_continuity (agent, last_seen, session_id, last_action, state_json)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(agent) DO UPDATE SET
                     last_seen=excluded.last_seen,
                     session_id=excluded.session_id,
                     last_action=excluded.last_action,
                     state_json=excluded.state_json""",
                (
                    agent,
                    datetime.now().isoformat(timespec="seconds"),
                    session_id,
                    last_action,
                    json.dumps(state, ensure_ascii=False) if state else None,
                ),
            )

    def get_session(self, agent: str) -> dict[str, Any] | None:
        with self._conn() as c:
            row = c.execute(
                "SELECT * FROM session_continuity WHERE agent=?", (agent,)
            ).fetchone()
            return dict(row) if row else None

    def stats(self) -> dict[str, int]:
        with self._conn() as c:
            return {
                "lessons": c.execute("SELECT COUNT(*) FROM lessons_learned").fetchone()[0],
                "violations": c.execute("SELECT COUNT(*) FROM violations_history").fetchone()[0],
                "actions": c.execute("SELECT COUNT(*) FROM agent_actions").fetchone()[0],
                "sessions": c.execute("SELECT COUNT(*) FROM session_continuity").fetchone()[0],
            }


# ============================================================================
# CLI
# ============================================================================

def cmd_init(args: argparse.Namespace) -> int:
    mem = Memory()
    print(f"[OK] Memory DB initialized: {mem.db_path}")
    print(f"[OK] Stats: {json.dumps(mem.stats())}")
    return 0


def cmd_lesson_add(args: argparse.Namespace) -> int:
    mem = Memory()
    lid = mem.record_lesson(args.lesson, agent=args.agent, category=args.category)
    print(f"[OK] Lesson #{lid} recorded.")
    return 0


def cmd_lesson_list(args: argparse.Namespace) -> int:
    mem = Memory()
    for row in mem.recent_lessons(limit=args.limit, agent=args.agent):
        print(f"#{row['id']} [{row['timestamp']}] ({row['agent']}/{row['category'] or '-'}) {row['lesson']}")
    return 0


def cmd_violations(args: argparse.Namespace) -> int:
    mem = Memory()
    if args.summary:
        for row in mem.violation_counts_by_rule():
            print(f"  {row['rule']:30s} {row['count']:5d}")
    else:
        for row in mem.recent_violations(limit=args.limit):
            blocked = "BLOCK" if row["blocked"] else "WARN"
            print(f"#{row['id']} [{row['timestamp']}] {blocked} {row['agent']:15s} {row['rule']:25s} {row['target'] or row['action']}")
    return 0


def cmd_action_log(args: argparse.Namespace) -> int:
    mem = Memory()
    aid = mem.log_action(
        agent=args.agent, action_type=args.action, target=args.target or "",
        outcome=args.outcome or "", session_id=args.session,
    )
    print(f"[OK] Action #{aid} logged.")
    return 0


def cmd_stats(args: argparse.Namespace) -> int:
    mem = Memory()
    print(json.dumps(mem.stats(), indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="CDC Shared Memory Backend")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="Initialize the database").set_defaults(func=cmd_init)
    sub.add_parser("stats", help="Show database stats").set_defaults(func=cmd_stats)

    lesson = sub.add_parser("lesson", help="Manage lessons")
    lesson_sub = lesson.add_subparsers(dest="lesson_cmd", required=True)
    la = lesson_sub.add_parser("add", help="Add a lesson")
    la.add_argument("lesson")
    la.add_argument("--agent", default="system")
    la.add_argument("--category", default=None)
    la.set_defaults(func=cmd_lesson_add)
    ll = lesson_sub.add_parser("list", help="List recent lessons")
    ll.add_argument("--limit", type=int, default=20)
    ll.add_argument("--agent", default=None)
    ll.set_defaults(func=cmd_lesson_list)

    v = sub.add_parser("violations", help="View violations")
    v.add_argument("--limit", type=int, default=20)
    v.add_argument("--summary", action="store_true", help="Show counts by rule")
    v.set_defaults(func=cmd_violations)

    a = sub.add_parser("action", help="Log an action")
    a_sub = a.add_subparsers(dest="action_cmd", required=True)
    al = a_sub.add_parser("log", help="Log an action")
    al.add_argument("--agent", required=True)
    al.add_argument("--action", required=True)
    al.add_argument("--target", default=None)
    al.add_argument("--outcome", default=None)
    al.add_argument("--session", default=None)
    al.set_defaults(func=cmd_action_log)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
