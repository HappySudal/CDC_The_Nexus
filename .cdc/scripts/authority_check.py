"""
CDC Authority Matrix Checker (CLI + Library)
=============================================

Dual-mode utility:
1. CLI: py authority_check.py --path <path> --intent <read|write|delete> --agent <name>
        Exit 0 = ALLOWED, Exit 1 = BLOCKED, Exit 2 = APPROVAL_REQUIRED

2. Library: from authority_check import check_authority
            result = check_authority(path, intent, agent)

3. API-backed: Set CDC_API_URL=http://localhost:8888 to delegate to running API.
               Falls back to local check if API unreachable.

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML not installed. Run: py -m pip install pyyaml", file=sys.stderr)
    sys.exit(3)


REPO_ROOT = Path(__file__).resolve().parents[2]
CONSTITUTION_PATH = REPO_ROOT / ".cdc" / "CONSTITUTION.yaml"
API_URL_ENV = "CDC_API_URL"
DEFAULT_API_URL = "http://localhost:8888"
API_TIMEOUT = 2.0  # seconds

EXIT_ALLOWED = 0
EXIT_BLOCKED = 1
EXIT_APPROVAL_REQUIRED = 2


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip().rstrip("/")


def load_constitution() -> dict[str, Any]:
    if not CONSTITUTION_PATH.exists():
        raise FileNotFoundError(f"Constitution not found: {CONSTITUTION_PATH}")
    with CONSTITUTION_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def check_via_api(path: str, intent: str, agent: str) -> dict[str, Any] | None:
    """Try API first; return None on any failure."""
    url = os.environ.get(API_URL_ENV, DEFAULT_API_URL).rstrip("/")
    payload = json.dumps({"path": path, "intent": intent, "agent": agent}).encode("utf-8")
    req = urllib.request.Request(
        f"{url}/validate/path",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError):
        return None


def check_locally(path: str, intent: str, agent: str) -> dict[str, Any]:
    """Local check (fallback when API is down)."""
    constitution = load_constitution()
    normalized = normalize_path(path).lower()

    # Tier 0
    for entry in constitution["governance"]["tier_0_paths"]:
        tier_0 = normalize_path(entry["path"]).lower()
        if tier_0 in normalized:
            return {
                "allowed": False,
                "reason": f"Tier 0 sacred space: {entry['path']}",
                "rule": "TIER_0_VIOLATION",
                "severity": "BLOCK",
            }

    # Constitution modification
    if intent in {"write", "modify", "delete"}:
        protected = [".cdc/constitution.yaml", "01_control_tower/01_master_constitution.md"]
        for prot in protected:
            if normalized.endswith(prot):
                return {
                    "allowed": False,
                    "reason": f"Constitution file modification requires Chairman approval: {prot}",
                    "rule": "CONSTITUTION_MODIFICATION",
                    "severity": "BLOCK",
                }

    # Authority matrix — requires_approval
    if intent in {"write", "modify", "delete"}:
        default = constitution["authority_matrix"]["default"]
        for pattern in default.get("requires_approval", []):
            prefix = normalize_path(pattern.replace("**", "").rstrip("/")).lower()
            if prefix and normalized.startswith(prefix):
                return {
                    "allowed": True,
                    "reason": f"Path requires Chairman approval: {pattern}",
                    "rule": "APPROVAL_REQUIRED",
                    "severity": "WARN",
                }

    return {"allowed": True, "reason": "No constitutional violation detected", "rule": None, "severity": None}


def check_authority(path: str, intent: str = "read", agent: str = "unknown", prefer_api: bool = True) -> dict[str, Any]:
    """Main public API. Returns dict with allowed/reason/rule/severity/source."""
    if prefer_api:
        api_result = check_via_api(path, intent, agent)
        if api_result is not None:
            api_result["source"] = "api"
            return api_result

    local_result = check_locally(path, intent, agent)
    local_result["source"] = "local"
    return local_result


def main() -> int:
    parser = argparse.ArgumentParser(description="CDC Authority Matrix Checker")
    parser.add_argument("--path", required=True, help="Path to check (relative to repo root)")
    parser.add_argument("--intent", default="read", choices=["read", "write", "modify", "delete"])
    parser.add_argument("--agent", default="cli", help="Calling agent identifier")
    parser.add_argument("--no-api", action="store_true", help="Skip API and use local check only")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    args = parser.parse_args()

    result = check_authority(args.path, args.intent, args.agent, prefer_api=not args.no_api)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        status_symbol = "[ALLOWED]" if result["allowed"] else "[BLOCKED]"
        severity = result.get("severity")
        if severity == "WARN":
            status_symbol = "[WARN]"
        print(f"{status_symbol} {result['reason']}")
        if result.get("rule"):
            print(f"  Rule: {result['rule']}")
        print(f"  Source: {result.get('source', 'unknown')}")

    if not result["allowed"]:
        return EXIT_BLOCKED
    if result.get("severity") == "WARN":
        return EXIT_APPROVAL_REQUIRED
    return EXIT_ALLOWED


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
