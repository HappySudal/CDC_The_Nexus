"""
MCP Server Test Harness
========================

Spawns the MCP server as a subprocess and sends a sequence of JSON-RPC
requests over stdio to verify protocol conformance.

Usage: py mcp_test.py
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


SERVER = Path(__file__).parent / "mcp_server.py"


def send(proc: subprocess.Popen, req: dict) -> dict | None:
    proc.stdin.write(json.dumps(req) + "\n")
    proc.stdin.flush()
    if req.get("id") is None:
        return None
    line = proc.stdout.readline()
    return json.loads(line) if line else None


def run_tests() -> int:
    proc = subprocess.Popen(
        ["py", str(SERVER)],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", bufsize=1,
    )

    tests = [
        ("initialize",
         {"jsonrpc": "2.0", "id": 1, "method": "initialize",
          "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "0"}}}),
        ("notifications/initialized",
         {"jsonrpc": "2.0", "method": "notifications/initialized"}),
        ("tools/list",
         {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}),
        ("tools/call validate_path (Tier 0)",
         {"jsonrpc": "2.0", "id": 3, "method": "tools/call",
          "params": {"name": "validate_path",
                     "arguments": {"path": "00_philosophy/x.md", "intent": "write", "agent": "mcp_test"}}}),
        ("tools/call validate_path (Normal)",
         {"jsonrpc": "2.0", "id": 4, "method": "tools/call",
          "params": {"name": "validate_path",
                     "arguments": {"path": "20_Projects/x.ts", "intent": "write", "agent": "mcp_test"}}}),
        ("tools/call query_memory (stats)",
         {"jsonrpc": "2.0", "id": 5, "method": "tools/call",
          "params": {"name": "query_memory", "arguments": {"table": "stats"}}}),
        ("resources/list",
         {"jsonrpc": "2.0", "id": 6, "method": "resources/list"}),
        ("resources/read cdc://stats",
         {"jsonrpc": "2.0", "id": 7, "method": "resources/read", "params": {"uri": "cdc://stats"}}),
    ]

    passed = 0
    failed = 0
    for label, req in tests:
        resp = send(proc, req)
        if req.get("id") is None:
            print(f"[NOTIF] {label}")
            continue
        if resp is None:
            print(f"[FAIL]  {label}: no response")
            failed += 1
            continue
        if "error" in resp:
            print(f"[FAIL]  {label}: {resp['error']}")
            failed += 1
        else:
            preview = json.dumps(resp.get("result"), ensure_ascii=False)[:120]
            print(f"[PASS]  {label}: {preview}...")
            passed += 1

    proc.stdin.close()
    proc.wait(timeout=5)

    print()
    print(f"RESULT: {passed} passed / {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
