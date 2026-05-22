"""
CDC MCP Server (Model Context Protocol)
========================================

Exposes the CDC constitutional system over the Anthropic MCP protocol so
any MCP-aware client (Claude Code, Cursor, Continue, ...) can call it.

Transport: stdio (JSON-RPC 2.0)
Spec:      https://modelcontextprotocol.io

Tools exposed
-------------
  validate_path        — Check if an agent may touch a path
  check_authority      — Authority matrix gating
  query_memory         — Search lessons/violations/actions
  report_violation     — Record a violation from a client agent
  trigger_heal         — Invoke self-healing pipeline (synthetic)

Resources exposed
-----------------
  cdc://constitution           — Full CONSTITUTION.yaml as JSON
  cdc://violations/recent      — Recent 50 violations
  cdc://lessons/recent         — Recent 50 lessons
  cdc://stats                  — Memory backend stats

Client config example (Claude Code)
-----------------------------------
Add to your MCP settings:
{
  "mcpServers": {
    "cdc": {
      "command": "py",
      "args": ["C:\\\\99_Develop\\\\SynologyDrive\\\\.cdc\\\\scripts\\\\mcp_server.py"]
    }
  }
}

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))
from memory_backend import Memory  # noqa: E402

try:
    import yaml
except ImportError:
    print(json.dumps({"jsonrpc": "2.0", "error": {"code": -32000, "message": "PyYAML not installed"}}), flush=True)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parents[2]
CONSTITUTION_PATH = REPO_ROOT / ".cdc" / "CONSTITUTION.yaml"

SERVER_NAME = "cdc-constitutional-server"
SERVER_VERSION = "1.0.0"
PROTOCOL_VERSION = "2024-11-05"


# ============================================================================
# Constitution Loading
# ============================================================================

def load_constitution() -> dict[str, Any]:
    with CONSTITUTION_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def normalize_path(p: str) -> str:
    return p.replace("\\", "/").strip().rstrip("/")


# ============================================================================
# Tool Implementations
# ============================================================================

def tool_validate_path(args: dict) -> dict:
    constitution = load_constitution()
    path = args.get("path", "")
    intent = args.get("intent", "read")
    agent = args.get("agent", "mcp_client")

    normalized = normalize_path(path).lower()

    for entry in constitution["governance"]["tier_0_paths"]:
        t0 = normalize_path(entry["path"]).lower()
        if t0 in normalized:
            return {
                "allowed": False,
                "reason": f"Tier 0 sacred space: {entry['path']}",
                "rule": "TIER_0_VIOLATION",
            }

    if intent in {"write", "modify", "delete"}:
        for prot in [".cdc/constitution.yaml", "01_control_tower/01_master_constitution.md"]:
            if normalized.endswith(prot):
                return {
                    "allowed": False,
                    "reason": f"Constitution file modification requires Chairman approval",
                    "rule": "CONSTITUTION_MODIFICATION",
                }
        default = constitution["authority_matrix"]["default"]
        for pattern in default.get("requires_approval", []):
            prefix = normalize_path(pattern.replace("**", "").rstrip("/")).lower()
            if prefix and normalized.startswith(prefix):
                return {
                    "allowed": True,
                    "reason": f"Requires Chairman approval: {pattern}",
                    "rule": "APPROVAL_REQUIRED",
                    "severity": "WARN",
                }

    return {"allowed": True, "reason": "No violation detected"}


def tool_check_authority(args: dict) -> dict:
    return tool_validate_path(args)  # Same logic


def tool_query_memory(args: dict) -> dict:
    table = args.get("table", "lessons")
    limit = int(args.get("limit", 20))
    agent = args.get("agent")
    mem = Memory()

    if table == "lessons":
        return {"rows": mem.recent_lessons(limit=limit, agent=agent)}
    if table == "violations":
        return {"rows": mem.recent_violations(limit=limit)}
    if table == "actions":
        return {"rows": mem.recent_actions(limit=limit, agent=agent)}
    if table == "stats":
        return mem.stats()
    return {"error": f"Unknown table: {table}"}


def tool_report_violation(args: dict) -> dict:
    mem = Memory()
    vid = mem.record_violation(
        agent=args.get("agent", "mcp_client"),
        rule=args.get("rule", "UNSPECIFIED"),
        target=args.get("target", ""),
        action=args.get("action", ""),
        blocked=bool(args.get("blocked", False)),
        reason=args.get("reason", ""),
        raw=args,
    )
    return {"recorded": True, "violation_id": vid}


def tool_trigger_heal(args: dict) -> dict:
    """Invoke self_healing.heal on a no-op (interface demo)."""
    try:
        from self_healing import heal  # local import to avoid circular at module load
    except ImportError as e:
        return {"error": f"self_healing not importable: {e}"}

    def _noop() -> str:
        return "noop"

    outcome = heal(
        _noop,
        agent=args.get("agent", "mcp_client"),
        action_name=args.get("action_name", "interface_demo"),
        target=args.get("target"),
    )
    return {
        "success": outcome.success,
        "attempts": outcome.attempts,
        "recovery_level_used": outcome.recovery_level_used,
        "result": outcome.result,
    }


TOOLS = {
    "validate_path": {
        "description": "Check if an agent may access/modify a path under CDC constitution.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path":   {"type": "string", "description": "Path relative to repo root"},
                "intent": {"type": "string", "enum": ["read", "write", "modify", "delete"]},
                "agent":  {"type": "string", "description": "Agent identifier"},
            },
            "required": ["path"],
        },
        "handler": tool_validate_path,
    },
    "check_authority": {
        "description": "Authority matrix gating check (same logic as validate_path).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path":   {"type": "string"},
                "intent": {"type": "string"},
                "agent":  {"type": "string"},
            },
            "required": ["path"],
        },
        "handler": tool_check_authority,
    },
    "query_memory": {
        "description": "Query CDC shared memory (lessons / violations / actions / stats).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table": {"type": "string", "enum": ["lessons", "violations", "actions", "stats"]},
                "limit": {"type": "integer", "default": 20},
                "agent": {"type": "string"},
            },
            "required": ["table"],
        },
        "handler": tool_query_memory,
    },
    "report_violation": {
        "description": "Self-report a constitutional violation to the CDC memory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent":  {"type": "string"},
                "rule":   {"type": "string"},
                "target": {"type": "string"},
                "action": {"type": "string"},
                "reason": {"type": "string"},
                "blocked": {"type": "boolean"},
            },
            "required": ["rule"],
        },
        "handler": tool_report_violation,
    },
    "trigger_heal": {
        "description": "Trigger the self-healing pipeline (interface/demo).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent":       {"type": "string"},
                "action_name": {"type": "string"},
                "target":      {"type": "string"},
            },
        },
        "handler": tool_trigger_heal,
    },
}


# ============================================================================
# Resource Implementations
# ============================================================================

RESOURCES = [
    {
        "uri": "cdc://constitution",
        "name": "CDC Constitution",
        "description": "Full CONSTITUTION.yaml as JSON",
        "mimeType": "application/json",
    },
    {
        "uri": "cdc://violations/recent",
        "name": "Recent Violations",
        "description": "Last 50 constitutional violations",
        "mimeType": "application/json",
    },
    {
        "uri": "cdc://lessons/recent",
        "name": "Recent Lessons",
        "description": "Last 50 lessons learned",
        "mimeType": "application/json",
    },
    {
        "uri": "cdc://stats",
        "name": "Memory Stats",
        "description": "Memory backend stats",
        "mimeType": "application/json",
    },
]


def read_resource(uri: str) -> dict:
    mem = Memory()
    if uri == "cdc://constitution":
        return {"contents": [{"uri": uri, "mimeType": "application/json",
                              "text": json.dumps(load_constitution(), ensure_ascii=False, indent=2)}]}
    if uri == "cdc://violations/recent":
        return {"contents": [{"uri": uri, "mimeType": "application/json",
                              "text": json.dumps(mem.recent_violations(50), ensure_ascii=False, indent=2)}]}
    if uri == "cdc://lessons/recent":
        return {"contents": [{"uri": uri, "mimeType": "application/json",
                              "text": json.dumps(mem.recent_lessons(50), ensure_ascii=False, indent=2)}]}
    if uri == "cdc://stats":
        return {"contents": [{"uri": uri, "mimeType": "application/json",
                              "text": json.dumps(mem.stats(), ensure_ascii=False, indent=2)}]}
    raise ValueError(f"Unknown resource: {uri}")


# ============================================================================
# JSON-RPC 2.0 Dispatch
# ============================================================================

def make_response(req_id, result=None, error=None) -> dict:
    resp: dict = {"jsonrpc": "2.0", "id": req_id}
    if error is not None:
        resp["error"] = error
    else:
        resp["result"] = result
    return resp


def dispatch(request: dict) -> dict | None:
    method = request.get("method")
    req_id = request.get("id")
    params = request.get("params", {})

    # Notifications (no id) — return None to not send a response
    if req_id is None and method not in ("notifications/initialized",):
        # Some notifications we can safely ignore
        return None

    try:
        if method == "initialize":
            return make_response(req_id, {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {
                    "tools":     {"listChanged": False},
                    "resources": {"listChanged": False, "subscribe": False},
                },
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            })

        if method == "notifications/initialized":
            return None  # Notification — no response

        if method == "tools/list":
            tool_list = []
            for name, t in TOOLS.items():
                tool_list.append({
                    "name": name,
                    "description": t["description"],
                    "inputSchema": t["inputSchema"],
                })
            return make_response(req_id, {"tools": tool_list})

        if method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            if tool_name not in TOOLS:
                return make_response(req_id, error={"code": -32601, "message": f"Tool not found: {tool_name}"})
            result = TOOLS[tool_name]["handler"](tool_args)
            return make_response(req_id, {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}],
                "isError": False,
            })

        if method == "resources/list":
            return make_response(req_id, {"resources": RESOURCES})

        if method == "resources/read":
            uri = params.get("uri")
            return make_response(req_id, read_resource(uri))

        if method == "ping":
            return make_response(req_id, {})

        return make_response(req_id, error={"code": -32601, "message": f"Method not found: {method}"})

    except Exception as e:  # noqa: BLE001
        return make_response(req_id, error={"code": -32603, "message": f"Internal error: {type(e).__name__}: {e}"})


# ============================================================================
# stdio Loop
# ============================================================================

def main() -> int:
    # Force UTF-8 on both streams
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError as e:
            err = {"jsonrpc": "2.0", "id": None,
                   "error": {"code": -32700, "message": f"Parse error: {e}"}}
            print(json.dumps(err), flush=True)
            continue

        resp = dispatch(req)
        if resp is not None:
            print(json.dumps(resp, ensure_ascii=False), flush=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
