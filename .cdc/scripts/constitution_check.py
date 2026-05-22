"""
CDC Constitution Check — Pre-Commit Validator
==============================================

Reads .cdc/CONSTITUTION.yaml and validates staged git changes against:
1. Tier 0 sacred space modification attempts
2. Constitution file modification attempts (without approval)
3. Forbidden words (13 fatal errors)
4. Slogan presence (for .md/.py/.ps1/.ts/.vue/.tsx files)
5. Mermaid diagram usage (forbidden)

Exit Codes:
    0 = PASS (no violations)
    1 = BLOCK (constitutional violation — commit rejected)

Bypass (Chairman only, emergency use):
    CDC_BYPASS=1 git commit ...

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML not installed. Run: py -m pip install pyyaml", file=sys.stderr)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parents[2]
CONSTITUTION_PATH = REPO_ROOT / ".cdc" / "CONSTITUTION.yaml"
VIOLATION_LOG = REPO_ROOT / ".cdc" / "logs" / "violations.jsonl"

# Files that require slogan footer
SLOGAN_REQUIRED_EXTENSIONS = {".md", ".py", ".ps1", ".ts", ".tsx", ".vue", ".js"}

# Files exempt from forbidden_words check
# (these files exist to DEFINE or REFERENCE the forbidden words themselves)
FORBIDDEN_WORDS_EXEMPT_FILES = {
    ".cdc/CONSTITUTION.yaml",       # The constitution itself defines forbidden_words
    "AGENTS.md",                    # Codex adapter output (renders constitution)
    "CONVENTIONS.md",               # Aider adapter output
    "CLAUDE.md.generated",          # Claude adapter output
    ".cursorrules",                 # Cursor adapter output (legacy)
    ".cursor/rules/cdc.mdc",        # Cursor adapter output (MDC)
    ".antigravity/rules.md",        # Antigravity adapter output
    ".claude/rules/_LEGACY_NOTICE.md",  # Legacy migration notice
}

# Directories whose contents are exempt from forbidden_words check
FORBIDDEN_WORDS_EXEMPT_PATTERNS = (
    ".cdc/adapters/",       # Adapter scripts reference forbidden words in templates
    ".cdc/scripts/constitution_check.py",  # This file itself
    "05_Reports/Report_CDC/",  # CDC reports often quote forbidden words for analysis
    ".claude/rules/",       # Legacy rules retained for human reference
    "01_Control_Tower/",    # Master constitution and audit files
)


class Violation:
    def __init__(self, rule: str, file: str, detail: str, severity: str = "BLOCK"):
        self.rule = rule
        self.file = file
        self.detail = detail
        self.severity = severity

    def __str__(self) -> str:
        return f"[{self.severity}] {self.rule} | {self.file}: {self.detail}"

    def to_dict(self) -> dict[str, Any]:
        return {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "rule": self.rule,
            "file": self.file,
            "detail": self.detail,
            "severity": self.severity,
        }


def load_constitution() -> dict[str, Any]:
    if not CONSTITUTION_PATH.exists():
        print(f"[WARN] Constitution not found at {CONSTITUTION_PATH}", file=sys.stderr)
        print("[WARN] Skipping constitution check.", file=sys.stderr)
        sys.exit(0)
    with CONSTITUTION_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_staged_files() -> list[str]:
    """Get list of files staged for commit."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            capture_output=True,
            text=True,
            check=True,
            cwd=REPO_ROOT,
        )
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] git diff failed: {e}", file=sys.stderr)
        return []


def get_staged_content(file_path: str) -> str:
    """Get staged content of a file (after add, before commit)."""
    try:
        result = subprocess.run(
            ["git", "show", f":{file_path}"],
            capture_output=True,
            text=True,
            check=True,
            cwd=REPO_ROOT,
            encoding="utf-8",
            errors="replace",
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return ""


def check_tier_0(constitution: dict, staged_files: list[str]) -> list[Violation]:
    """Block any modification to Tier 0 sacred paths."""
    violations: list[Violation] = []
    tier_0_paths = [
        entry["path"].replace("\\", "/").rstrip("/")
        for entry in constitution["governance"]["tier_0_paths"]
    ]
    for file in staged_files:
        normalized = file.replace("\\", "/")
        for tier_0 in tier_0_paths:
            if normalized.startswith(f"{tier_0}/") or normalized == tier_0:
                violations.append(
                    Violation(
                        rule="TIER_0_VIOLATION",
                        file=file,
                        detail=f"Sacred space '{tier_0}' modification attempted",
                    )
                )
    return violations


def check_constitution_modification(staged_files: list[str]) -> list[Violation]:
    """Warn (not block) on constitution file modifications."""
    violations: list[Violation] = []
    protected = [
        "01_Control_Tower/01_MASTER_CONSTITUTION.md",
        ".cdc/CONSTITUTION.yaml",
    ]
    for file in staged_files:
        normalized = file.replace("\\", "/")
        for protected_path in protected:
            if normalized == protected_path:
                violations.append(
                    Violation(
                        rule="CONSTITUTION_MODIFICATION",
                        file=file,
                        detail="Constitution file modification requires Chairman approval",
                        severity="WARN",
                    )
                )
    return violations


def is_exempt_from_forbidden_words(file_path: str) -> bool:
    """Return True if this file should skip forbidden_words check."""
    normalized = file_path.replace("\\", "/")
    if normalized in FORBIDDEN_WORDS_EXEMPT_FILES:
        return True
    for pattern in FORBIDDEN_WORDS_EXEMPT_PATTERNS:
        if normalized.startswith(pattern):
            return True
    return False


def check_forbidden_words(constitution: dict, staged_files: list[str]) -> list[Violation]:
    """Check for forbidden words from 13 fatal errors (with exemptions)."""
    violations: list[Violation] = []
    forbidden_words: set[str] = set()
    for err in constitution["fatal_errors"]:
        for word in err.get("forbidden_words", []):
            forbidden_words.add(word.lower())

    text_extensions = {".md", ".py", ".ps1", ".ts", ".tsx", ".vue", ".js", ".yaml", ".yml", ".txt"}

    for file in staged_files:
        ext = Path(file).suffix.lower()
        if ext not in text_extensions:
            continue
        if is_exempt_from_forbidden_words(file):
            continue  # Constitution-defining and adapter-output files are exempt
        content = get_staged_content(file).lower()
        if not content:
            continue
        for word in forbidden_words:
            if word in content:
                violations.append(
                    Violation(
                        rule="FORBIDDEN_WORD",
                        file=file,
                        detail=f"Forbidden word detected: '{word}'",
                        severity="WARN",
                    )
                )
    return violations


def check_mermaid_diagram(staged_files: list[str]) -> list[Violation]:
    """Block Mermaid diagram usage (ASCII only allowed)."""
    violations: list[Violation] = []
    for file in staged_files:
        if not file.endswith(".md"):
            continue
        content = get_staged_content(file)
        if "```mermaid" in content.lower():
            violations.append(
                Violation(
                    rule="MERMAID_FORBIDDEN",
                    file=file,
                    detail="Mermaid diagrams forbidden — use ASCII/Box-drawing",
                )
            )
    return violations


def check_slogan(constitution: dict, staged_files: list[str]) -> list[Violation]:
    """Warn if bilingual slogan is missing from required file types."""
    violations: list[Violation] = []
    slogan_ko = constitution["file_requirements"]["slogan"]["korean"]
    slogan_en = constitution["file_requirements"]["slogan"]["english"]

    for file in staged_files:
        ext = Path(file).suffix.lower()
        if ext not in SLOGAN_REQUIRED_EXTENSIONS:
            continue
        # Skip generated/vendor files
        if any(seg in file for seg in ["node_modules", ".next", "dist", "build", ".generated"]):
            continue
        content = get_staged_content(file)
        if not content.strip():
            continue
        if slogan_ko not in content or slogan_en not in content:
            violations.append(
                Violation(
                    rule="SLOGAN_MISSING",
                    file=file,
                    detail="Bilingual slogan footer missing",
                    severity="WARN",
                )
            )
    return violations


def log_violations(violations: list[Violation]) -> None:
    """Append violations to JSONL log."""
    if not violations:
        return
    VIOLATION_LOG.parent.mkdir(parents=True, exist_ok=True)
    with VIOLATION_LOG.open("a", encoding="utf-8") as f:
        for v in violations:
            f.write(json.dumps(v.to_dict(), ensure_ascii=False) + "\n")


def main() -> int:
    if os.environ.get("CDC_BYPASS") == "1":
        print("[CDC] Bypass enabled (CDC_BYPASS=1). Skipping checks.")
        return 0

    constitution = load_constitution()
    staged_files = get_staged_files()
    if not staged_files:
        return 0

    all_violations: list[Violation] = []
    all_violations.extend(check_tier_0(constitution, staged_files))
    all_violations.extend(check_constitution_modification(staged_files))
    all_violations.extend(check_forbidden_words(constitution, staged_files))
    all_violations.extend(check_mermaid_diagram(staged_files))
    all_violations.extend(check_slogan(constitution, staged_files))

    log_violations(all_violations)

    blocking = [v for v in all_violations if v.severity == "BLOCK"]
    warnings = [v for v in all_violations if v.severity == "WARN"]

    print("=" * 60)
    print(f"CDC Constitution Check — {len(staged_files)} staged files")
    print("=" * 60)

    if warnings:
        print(f"\n[{len(warnings)} WARNINGS]")
        for v in warnings:
            print(f"  {v}")

    if blocking:
        print(f"\n[{len(blocking)} BLOCKING VIOLATIONS]")
        for v in blocking:
            print(f"  {v}")
        print("\n" + "=" * 60)
        print("COMMIT BLOCKED by CDC Constitution.")
        print("To bypass (Chairman emergency only): CDC_BYPASS=1 git commit ...")
        print("=" * 60)
        return 1

    if not all_violations:
        print("[PASS] All checks passed.")

    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
