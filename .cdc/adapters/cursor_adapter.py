"""
Cursor Adapter — Generates .cursorrules from CONSTITUTION.yaml
================================================================

Output: .cursorrules at repo root (legacy) AND .cursor/rules/cdc.mdc (new)
Format: Plain text (.cursorrules) + MDC (.cursor/rules/)

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _base import (  # noqa: E402
    REPO_ROOT,
    SLOGAN_EN,
    SLOGAN_KO,
    load_constitution,
    render_authority_matrix,
    render_fatal_errors,
    render_sovereign_protocol,
    render_tier_0_warning,
    write_output,
)


LEGACY_OUTPUT = REPO_ROOT / ".cursorrules"
MDC_OUTPUT = REPO_ROOT / ".cursor" / "rules" / "cdc.mdc"


def render_cursor_specific(constitution: dict) -> str:
    """Cursor-specific guidance (Agent Mode + MCP support)."""
    lines = [
        "## Cursor-Specific Guidance",
        "",
        "Cursor supports Agent Mode and MCP. Use MCP servers for tool gateway.",
        "",
        "### Agent Mode Rules",
        "",
        "- Always check Tier 0 path list before file operations",
        "- Use 5-column reporting format",
        "- Verify SOVEREIGN PROTOCOL step before execution",
        "- Reference `.cdc/CONSTITUTION.yaml` as single source of truth",
    ]
    return "\n".join(lines)


def render_mdc_frontmatter() -> str:
    """Render MDC (Markdown Components) frontmatter for new Cursor format."""
    return (
        "---\n"
        "description: CDC Universal Constitution\n"
        "alwaysApply: true\n"
        "---\n\n"
    )


def main() -> int:
    constitution = load_constitution()
    meta = constitution["metadata"]

    header = (
        f"# Cursor Operating Rules (CDC Constitution v{meta['version']})\n\n"
        f"**Authority**: {meta['authority']}  \n"
        f"**Last Updated**: {meta['last_updated']}  \n"
        f"**Enforcement**: {meta['enforcement_level']}\n\n"
        f"---\n"
    )

    sections = [
        header,
        render_tier_0_warning(constitution),
        "",
        render_sovereign_protocol(constitution),
        render_fatal_errors(constitution),
        "",
        render_authority_matrix(constitution),
        "",
        render_cursor_specific(constitution),
        "\n---\n",
        f'**"{SLOGAN_KO}"**  ',
        f'**"{SLOGAN_EN}"**',
    ]

    plain_content = "\n".join(sections)
    write_output(LEGACY_OUTPUT, plain_content)

    mdc_content = render_mdc_frontmatter() + plain_content
    write_output(MDC_OUTPUT, mdc_content)

    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
