"""
Antigravity Adapter — Generates .antigravity/rules.md from CONSTITUTION.yaml
============================================================================

Output: .antigravity/rules.md
Format: Markdown (Antigravity reads rule files from .antigravity/ directory)

Note: Antigravity has limited hook support, so this adapter emphasizes
in-context rule reminders over enforcement hooks.

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
    render_sovereign_protocol,
    render_tier_0_warning,
    write_output,
)


OUTPUT_PATH = REPO_ROOT / ".antigravity" / "rules.md"


def render_antigravity_specific(constitution: dict) -> str:
    """Antigravity-specific guidance (Google Gemini-based agent)."""
    lines = [
        "## Antigravity-Specific Guidance",
        "",
        "Antigravity uses Gemini Function Calling and Browser Use tools.",
        "Without hook support, rule compliance depends on context awareness.",
        "",
        "### Critical Reminders Before Every Action",
        "",
        "- Check Tier 0 path list before any file operation",
        "- Verify SOVEREIGN PROTOCOL step before execution",
        "- Use 5-column reporting format for all status updates",
        "- Bilingual slogan required at file footer",
        "",
        "### Enforcement Backstop",
        "",
        "Since Antigravity lacks hooks, OS-level enforcement is critical:",
        "- Tier 0 protected by Windows ACL (icacls)",
        "- Commits validated by git pre-commit hook",
        "- Process calls intercepted by cdc-exec wrapper",
    ]
    return "\n".join(lines)


def main() -> int:
    constitution = load_constitution()
    sections = [
        render_header("Antigravity (Google)", constitution),
        render_tier_0_warning(constitution),
        "",
        render_sovereign_protocol(constitution),
        render_fatal_errors(constitution),
        "",
        render_authority_matrix(constitution),
        "",
        render_project_workflow(constitution),
        "",
        render_antigravity_specific(constitution),
        render_footer(),
    ]
    write_output(OUTPUT_PATH, "\n".join(sections))
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
