"""
Regenerate All Agent Rule Files
================================

Runs all adapters in sequence to regenerate agent-specific rule files
from .cdc/CONSTITUTION.yaml.

Usage:
    python .cdc/adapters/regenerate_all.py

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


ADAPTERS_DIR = Path(__file__).parent
ADAPTER_NAMES = [
    "claude_adapter",
    "antigravity_adapter",
    "codex_adapter",
    "cursor_adapter",
    "aider_adapter",
]


def run_adapter(name: str) -> int:
    """Run a single adapter by module name."""
    adapter_path = ADAPTERS_DIR / f"{name}.py"
    if not adapter_path.exists():
        print(f"[SKIP] {name}: file not found")
        return 0

    spec = importlib.util.spec_from_file_location(name, adapter_path)
    if spec is None or spec.loader is None:
        print(f"[ERROR] Cannot load {name}")
        return 1

    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)

    if hasattr(module, "main"):
        return int(module.main() or 0)
    return 0


def main() -> int:
    print("=" * 60)
    print("CDC Universal Constitution — Regenerate All Adapters")
    print("=" * 60)

    failures = 0
    for name in ADAPTER_NAMES:
        print(f"\n[RUN] {name}")
        try:
            rc = run_adapter(name)
            if rc != 0:
                failures += 1
                print(f"[FAIL] {name} returned {rc}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            print(f"[ERROR] {name}: {e}")

    print("\n" + "=" * 60)
    if failures == 0:
        print(f"[SUCCESS] All {len(ADAPTER_NAMES)} adapters completed")
    else:
        print(f"[PARTIAL] {failures}/{len(ADAPTER_NAMES)} adapters failed")
    print("=" * 60)

    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
