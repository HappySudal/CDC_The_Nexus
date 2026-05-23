"""
CDC Universal Constitution — Adapter Base Module
=================================================
Shared utilities for all agent adapters. Each adapter reads
CONSTITUTION.yaml and generates an agent-specific rule file.

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Any

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML not installed. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parents[2]
CONSTITUTION_PATH = REPO_ROOT / ".cdc" / "CONSTITUTION.yaml"

SLOGAN_KO = "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
SLOGAN_EN = "Exists in the Moment, Vanishes in Time."


def load_constitution() -> dict[str, Any]:
    """Load the universal constitution from CONSTITUTION.yaml."""
    if not CONSTITUTION_PATH.exists():
        print(f"[ERROR] Constitution not found at {CONSTITUTION_PATH}", file=sys.stderr)
        sys.exit(1)
    with CONSTITUTION_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def render_tier_0_warning(constitution: dict[str, Any]) -> str:
    """Render Tier 0 sacred space warnings."""
    lines = ["## Tier 0 — Sacred Spaces (Chairman Only)", ""]
    for entry in constitution["governance"]["tier_0_paths"]:
        lines.append(f"- `{entry['path']}/` — {entry['reason']}")
    lines.append("")
    lines.append("**Access without explicit Chairman approval is forbidden.**")
    return "\n".join(lines)


def render_fatal_errors(constitution: dict[str, Any]) -> str:
    """Render 13 fatal errors as a numbered list."""
    lines = ["## 13 Fatal Errors (Prohibited Behaviors)", ""]
    for err in constitution["fatal_errors"]:
        lines.append(f"{err['id']}. **{err['name']}** — {err['description']}")
    return "\n".join(lines)


def render_sovereign_protocol(constitution: dict[str, Any]) -> str:
    """Render SOVEREIGN PROTOCOL 5 steps."""
    lines = ["## SOVEREIGN PROTOCOL (5-Step Mandatory Workflow)", ""]
    for key in ["step_1", "step_2", "step_3", "step_4", "step_5"]:
        step = constitution["sovereign_protocol"][key]
        n = key.split("_")[1]
        lines.append(f"**STEP {n}: {step['name']}**")
        lines.append(f"- {step['description']}")
        lines.append("")
    return "\n".join(lines)


def render_slogan_md() -> str:
    """Render bilingual slogan in Markdown format."""
    return f'**"{SLOGAN_KO}"**  \n**"{SLOGAN_EN}"**'


def render_authority_matrix(constitution: dict[str, Any]) -> str:
    """Render authority matrix as a section."""
    lines = ["## Authority Matrix (Permission Boundaries)", ""]
    default = constitution["authority_matrix"]["default"]

    lines.append("### Allowed (Read)")
    for path in default["can_read"]:
        lines.append(f"- `{path}`")
    lines.append("")

    lines.append("### Allowed (Write)")
    for path in default["can_write"]:
        lines.append(f"- `{path}`")
    lines.append("")

    lines.append("### FORBIDDEN (Access)")
    for path in default["cannot_access"]:
        lines.append(f"- `{path}` (Tier 0)")
    lines.append("")

    lines.append("### FORBIDDEN (Modify)")
    for path in default["cannot_modify"]:
        lines.append(f"- `{path}`")
    lines.append("")

    lines.append("### Requires Chairman Approval")
    for path in default["requires_approval"]:
        lines.append(f"- `{path}`")

    return "\n".join(lines)


def render_header(agent_name: str, constitution: dict[str, Any]) -> str:
    """Render a standardized header."""
    meta = constitution["metadata"]
    return (
        f"<!-- AUTO-GENERATED from .cdc/CONSTITUTION.yaml — DO NOT EDIT DIRECTLY -->\n"
        f"<!-- Re-run .cdc/adapters/*_adapter.py to regenerate -->\n\n"
        f"# {agent_name} Operating Rules (CDC Constitution v{meta['version']})\n\n"
        f"**Authority**: {meta['authority']}  \n"
        f"**Last Updated**: {meta['last_updated']}  \n"
        f"**Enforcement**: {meta['enforcement_level']}  \n"
        f"**Framework**: {meta['framework']}\n\n"
        f"---\n"
    )


def render_project_workflow(constitution: dict[str, Any]) -> str:
    """Render the 7-stage project buildup workflow with loop.

    Authority: Chairman Sudal direct directive (2026-05-23).
    Applies to ALL projects under 20_Projects/.
    """
    wf = constitution.get("project_buildup_workflow")
    if not wf:
        return ""

    lines = [
        "## Project Buildup Workflow (7-Stage with Loop)",
        "",
        f"**Authority**: {wf.get('authority', '-')}  ",
        f"**Applies to**: {wf.get('applies_to', '-')}  ",
        f"**Loop Scope**: {wf.get('loop_scope', '-')}  ",
        f"**Loop Exit Gate**: {wf.get('loop_exit_gate', '-')}",
        "",
        "### Stages",
        "",
        "| # | Stage (KR) | Stage (EN) | Owner | Type | Loop |",
        "|:---:|:---|:---|:---|:---|:---:|",
    ]
    for s in wf.get("stages", []):
        in_loop = "🔄" if s.get("loop_member") else "—"
        gate = "🅒" if s.get("type", "").startswith("chairman") else "🅐"
        lines.append(
            f"| {s['idx']} | {s['name_kr']} | {s['name_en']} | {s['owner']} | {gate} {s['type']} | {in_loop} |"
        )

    lines.extend([
        "",
        "**Legend**: 🅒 = Chairman gate (2% sovereignty) | 🅐 = AI auto (98% automation) | 🔄 = Loop member",
        "",
        "### Loop Logic",
        "",
    ])
    loop = wf.get("loop_logic", {})
    for k, v in loop.items():
        lines.append(f"- **{k}**: {v}")

    lines.extend([
        "",
        "### Agent Directives (MUST FOLLOW)",
        "",
    ])
    directives = wf.get("agent_directives", {})
    if "all_agents_must" in directives:
        lines.append("**MUST**:")
        for item in directives["all_agents_must"]:
            lines.append(f"- {item}")
        lines.append("")
    if "forbidden" in directives:
        lines.append("**FORBIDDEN**:")
        for item in directives["forbidden"]:
            lines.append(f"- ❌ {item}")
        lines.append("")

    lines.extend([
        "### Per-Cycle Output Artifacts",
        "",
        "Each cycle (N=1,2,3...) MUST produce these artifacts under `01_Proposal_Presentation/Workflow/cycles/cycle_{N}/`:",
        "",
        "- `CYCLE_{N}_PLAN.md` (STEP 2 출력)",
        "- `CYCLE_{N}_DEV_REPORT.md` (STEP 3 출력)",
        "- `FEEDBACK_CYCLE_{N}.md` (STEP 4 출력)",
        "- `CYCLE_{N}_FIX_REPORT.md` (STEP 5 출력)",
        "- `VERIFICATION_CYCLE_{N}.md` (STEP 6 출력)",
        "",
        "Goal document (`PROJECT_GOALS.md`) is immutable after STEP 1 — never modify in subsequent cycles.",
        "",
    ])

    return "\n".join(lines)


def render_footer() -> str:
    """Render a standardized footer with slogan."""
    return (
        f"\n---\n\n"
        f"**Generated**: {datetime.now().isoformat(timespec='seconds')}  \n"
        f"**Source**: `.cdc/CONSTITUTION.yaml`\n\n"
        f"{render_slogan_md()}\n"
    )


def write_output(output_path: Path, content: str) -> None:
    """Write generated content to the target file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    print(f"[OK] Generated: {output_path.relative_to(REPO_ROOT)}")


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
