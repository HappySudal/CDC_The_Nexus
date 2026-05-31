"""
Aider Adapter — Generates CONVENTIONS.md from CONSTITUTION.yaml
=================================================================

Output: CONVENTIONS.md at repo root (Aider convention)
Format: Markdown

Note: Aider has no hooks and uses git history as memory. Rule compliance
depends on conventions file being loaded into context.

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


OUTPUT_PATH = REPO_ROOT / "CONVENTIONS.md"


def render_aider_specific(constitution: dict) -> str:
    """Aider-specific guidance (git-native, no hooks)."""
    lines = [
        "## Aider-Specific Guidance",
        "",
        "Aider uses git history as its memory and has no hook system.",
        "Compliance depends on conventions being loaded via `--read CONVENTIONS.md`.",
        "",
        "### Usage",
        "",
        "```bash",
        "aider --read CONVENTIONS.md  # Always load this file",
        "```",
        "",
        "### Enforcement Reality",
        "",
        "- Tier 0 paths protected by Windows ACL",
        "- Commits validated by .git/hooks/pre-commit (Aider commits go through git)",
        "- 5-column reporting format required in commit messages",
        "- Bilingual slogan required at file footer",
    ]
    return "\n".join(lines)


def main() -> int:
    constitution = load_constitution()
    sections = [
        render_header("Aider", constitution),
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
        render_aider_specific(constitution),
        render_footer(),
    ]
    write_output(OUTPUT_PATH, "\n".join(sections))
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
