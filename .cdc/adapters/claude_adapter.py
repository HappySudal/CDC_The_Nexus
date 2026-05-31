"""
Claude Code Adapter — Generates CLAUDE.md from CONSTITUTION.yaml
================================================================

Output: CLAUDE.md at repo root
Format: Markdown with Claude Code-specific conventions

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


OUTPUT_PATH = REPO_ROOT / "CLAUDE.md.generated"  # Avoid overwriting existing CLAUDE.md without backup


def render_claude_specific(constitution: dict) -> str:
    """Claude Code-specific section: hooks, MCP, memory."""
    lines = [
        "## Claude Code-Specific Capabilities",
        "",
        "- **Hooks**: Use `.claude/hooks/` for pre-execution validation",
        "- **MCP Servers**: Configured in `.claude/mcp_servers.json`",
        "- **Memory**: Persistent at `~/.claude/projects/<workspace>/memory/`",
        "- **Skills**: Loaded from `.claude/skills/`",
    ]
    return "\n".join(lines)


def main() -> int:
    constitution = load_constitution()
    sections = [
        render_header("Claude Code", constitution),
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
        render_claude_specific(constitution),
        render_footer(),
    ]
    write_output(OUTPUT_PATH, "\n".join(sections))
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
