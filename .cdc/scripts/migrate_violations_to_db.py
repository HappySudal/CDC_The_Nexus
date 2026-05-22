"""
Migrate violations.jsonl → memory.db (one-shot migration).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from memory_backend import Memory  # noqa: E402


JSONL_PATH = Path(__file__).resolve().parents[1] / "logs" / "violations.jsonl"


def main() -> int:
    if not JSONL_PATH.exists():
        print(f"[SKIP] No violations.jsonl at {JSONL_PATH}")
        return 0

    mem = Memory()
    migrated = 0
    for line in JSONL_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        mem.record_violation(
            agent=entry.get("agent", "unknown") or "unknown",
            rule=entry.get("rule", "UNKNOWN"),
            target=entry.get("path") or entry.get("target") or "",
            action=entry.get("action", ""),
            blocked=bool(entry.get("blocked", True)),
            reason=entry.get("reason", ""),
            raw=entry,
        )
        migrated += 1

    print(f"[OK] Migrated {migrated} violation(s) to memory.db")
    print(f"[OK] Stats: {json.dumps(mem.stats())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
