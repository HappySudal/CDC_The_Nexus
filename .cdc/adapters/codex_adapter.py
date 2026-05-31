"""
Codex CLI Adapter — Generates AGENTS.md from CONSTITUTION.yaml
===============================================================

Output: AGENTS.md at repo root (OpenAI Codex CLI convention)
Format: Markdown

Note: Codex has no memory and no hooks. Rule compliance depends entirely
on in-context rules + OS-level enforcement.

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _base import (  # noqa: E402
    REPO_ROOT,
    load_constitution,
    render_authority_matrix,
    render_fatal_errors,
    render_footer,
    render_header,
    render_project_workflow,
    render_session_startup,
    render_sovereign_protocol,
    render_tier_0_warning,
    write_output,
)


OUTPUT_PATH = REPO_ROOT / "AGENTS.md"


def render_codex_specific(constitution: dict) -> str:
    """Codex-specific guidance (OpenAI Codex CLI)."""
    lines = [
        "## Codex CLI-Specific Guidance",
        "",
        "Codex has **no persistent memory** and **no hook system**.",
        "Each session is fresh — rules must be re-loaded from this file.",
        "",
        "### Enforcement Reality",
        "",
        "Codex cannot self-enforce. Compliance depends on:",
        "- OS-level ACL on Tier 0 paths",
        "- Git pre-commit hook (blocks bad commits)",
        "- cdc-exec wrapper (intercepts python/node/git calls)",
        "",
        "If a command is blocked, do NOT retry. Report to Chairman.",
    ]
    return "\n".join(lines)


def main() -> int:
    constitution = load_constitution()
    sections = [
        render_header("Codex CLI (OpenAI)", constitution),
        render_tier_0_warning(constitution),
        "",
        render_sovereign_protocol(constitution),
        render_fatal_errors(constitution),
        "",
        render_session_startup(constitution),
        "",
        render_authority_matrix(constitution),
        "",
        render_project_workflow(constitution),
        "",
        render_codex_specific(constitution),
        render_footer(),
    ]
    write_output(OUTPUT_PATH, "\n".join(sections))
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
