"""
CDC External Validation API Server
====================================

A lightweight HTTP server (Python stdlib only) that any AI agent can
call to validate actions against the Universal Constitution.

Endpoints
---------
GET  /status                — Health + constitution metadata
GET  /constitution          — Full constitution as JSON
POST /validate/path         — Check if a path access is allowed
POST /validate/command      — Check if a command can be executed
POST /validate/action       — Generic action validation
POST /report/violation      — Record a violation event
GET  /violations            — Recent violations (last 100)

Usage
-----
    py .cdc/scripts/validation_api.py           # Start on default port 8888
    py .cdc/scripts/validation_api.py --port 9000

Agent-side example (any language with HTTP support):
    curl -X POST http://localhost:8888/validate/path \\
         -H "Content-Type: application/json" \\
         -d '{"path": "00_philosophy/secret.md", "agent": "claude_code", "intent": "read"}'

Response: {"allowed": false, "reason": "Tier 0 sacred space", "rule": "TIER_0_VIOLATION"}

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
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
DEFAULT_PORT = 8888

# Lazy memory backend import (optional dependency on memory_backend.py)
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from memory_backend import Memory  # type: ignore
    _MEMORY_AVAILABLE = True
except ImportError:
    Memory = None  # type: ignore
    _MEMORY_AVAILABLE = False


# Dashboard HTML (inlined to avoid extra file)
DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>CDC Chairman Dashboard</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 24px;
         background: #0f1117; color: #e3e6eb; }
  h1 { color: #6cb6ff; border-bottom: 2px solid #2d3340; padding-bottom: 8px; }
  h2 { color: #f0c674; margin-top: 32px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px; margin: 24px 0; }
  .card { background: #1c2030; border: 1px solid #2d3340; border-radius: 8px;
          padding: 16px; }
  .card .label { color: #8a93a8; font-size: 12px; text-transform: uppercase; }
  .card .value { font-size: 36px; font-weight: bold; color: #6cb6ff; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #2d3340; }
  th { background: #1c2030; color: #8a93a8; font-weight: normal; }
  tr:hover { background: #161927; }
  .rule { font-family: 'Cascadia Code', monospace; color: #e57373; }
  .agent { color: #81c784; }
  .timestamp { color: #8a93a8; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px;
           font-size: 11px; font-weight: bold; }
  .badge-block { background: #c62828; color: white; }
  .badge-warn { background: #f9a825; color: black; }
  .footer { margin-top: 48px; color: #8a93a8; font-size: 12px; text-align: center; }
  .refresh { float: right; color: #6cb6ff; cursor: pointer; font-size: 12px; }
</style>
</head>
<body>
<h1>CDC Chairman Dashboard <span class="refresh" onclick="loadAll()">↻ Refresh</span></h1>

<h2>System Status</h2>
<div class="grid" id="stats-grid">Loading...</div>

<h2>Violations by Agent (Donut)</h2>
<div id="donut-chart" style="text-align:center; padding:16px;">Loading...</div>

<h2>Violation Trend (Last 14 Days)</h2>
<div id="trend-chart" style="background:#1c2030; border:1px solid #2d3340; border-radius:8px; padding:16px;">Loading...</div>

<h2>Recent Violations</h2>
<table id="violations-table"><thead><tr>
  <th>#</th><th>Time</th><th>Agent</th><th>Rule</th><th>Target</th><th>Status</th>
</tr></thead><tbody></tbody></table>

<h2>Violation Summary (by Rule)</h2>
<table id="summary-table"><thead><tr>
  <th>Rule</th><th>Count</th>
</tr></thead><tbody></tbody></table>

<h2>Recent Lessons Learned</h2>
<table id="lessons-table"><thead><tr>
  <th>#</th><th>Time</th><th>Agent</th><th>Category</th><th>Lesson</th>
</tr></thead><tbody></tbody></table>

<div class="footer">
  &quot;시각(時刻)에 존재하고, 시간(時間)에 소멸한다.&quot; / &quot;Exists in the Moment, Vanishes in Time.&quot;
</div>

<script>
async function fetchJSON(url) {
  const r = await fetch(url);
  return await r.json();
}

function renderStats(stats, status) {
  const cards = [
    { label: 'Constitution v', value: status.version },
    { label: 'Tier 0 Paths', value: status.tier_0_count },
    { label: 'Agents Supported', value: status.agents_supported.length },
    { label: 'Lessons Learned', value: stats.lessons || 0 },
    { label: 'Violations Recorded', value: stats.violations || 0 },
    { label: 'Actions Logged', value: stats.actions || 0 },
  ];
  document.getElementById('stats-grid').innerHTML = cards.map(c =>
    `<div class="card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`
  ).join('');
}

function renderViolations(rows) {
  const tbody = document.querySelector('#violations-table tbody');
  tbody.innerHTML = rows.map(r => {
    const badge = r.blocked
      ? '<span class="badge badge-block">BLOCK</span>'
      : '<span class="badge badge-warn">WARN</span>';
    const target = (r.target || r.path || r.action || '').substring(0, 60);
    return `<tr>
      <td>${r.id || '-'}</td>
      <td class="timestamp">${r.timestamp}</td>
      <td class="agent">${r.agent}</td>
      <td class="rule">${r.rule}</td>
      <td>${target}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('');
}

function renderSummary(rows) {
  const tbody = document.querySelector('#summary-table tbody');
  tbody.innerHTML = rows.map(r =>
    `<tr><td class="rule">${r.rule}</td><td>${r.count}</td></tr>`
  ).join('');
}

function renderLessons(rows) {
  const tbody = document.querySelector('#lessons-table tbody');
  tbody.innerHTML = rows.map(r => `<tr>
    <td>${r.id}</td>
    <td class="timestamp">${r.timestamp}</td>
    <td class="agent">${r.agent}</td>
    <td>${r.category || '-'}</td>
    <td>${r.lesson}</td>
  </tr>`).join('');
}

// ----- SVG Chart Helpers -----
function renderDonutChart(byAgent) {
  const total = byAgent.reduce((s, a) => s + a.count, 0);
  if (total === 0) {
    document.getElementById('donut-chart').innerHTML =
      '<div style="color:#8a93a8;">No violations recorded yet.</div>';
    return;
  }
  const colors = ['#e57373', '#f9a825', '#6cb6ff', '#81c784', '#ba68c8', '#4fc3f7', '#ff8a65'];
  let cumulative = 0;
  const radius = 80, cx = 120, cy = 120, stroke = 30;
  const slices = byAgent.map((a, i) => {
    const frac = a.count / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += frac;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    return `<path d="${path}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="${stroke}" />`;
  }).join('');
  const legend = byAgent.map((a, i) => {
    const pct = ((a.count / total) * 100).toFixed(1);
    return `<div style="display:inline-block; margin:0 12px; font-size:13px;">
      <span style="display:inline-block; width:12px; height:12px; background:${colors[i % colors.length]}; vertical-align:middle; margin-right:6px;"></span>
      ${a.agent}: ${a.count} (${pct}%)
    </div>`;
  }).join('');
  document.getElementById('donut-chart').innerHTML = `
    <svg width="240" height="240" viewBox="0 0 240 240">
      ${slices}
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#e3e6eb" font-size="32" font-weight="bold">${total}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="#8a93a8" font-size="12">Total Violations</text>
    </svg>
    <div style="margin-top:12px;">${legend}</div>
  `;
}

function renderTrendChart(trend) {
  const days = trend.days || [];
  const counts = trend.counts || [];
  if (days.length === 0) {
    document.getElementById('trend-chart').innerHTML =
      '<div style="color:#8a93a8;">No trend data.</div>';
    return;
  }
  const w = 800, h = 220, pad = 36;
  const maxC = Math.max(1, ...counts);
  const xStep = (w - 2 * pad) / Math.max(1, days.length - 1);
  const points = counts.map((c, i) => {
    const x = pad + i * xStep;
    const y = h - pad - (c / maxC) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  const bars = counts.map((c, i) => {
    const x = pad + i * xStep - 8;
    const barH = (c / maxC) * (h - 2 * pad);
    const y = h - pad - barH;
    return `<rect x="${x}" y="${y}" width="16" height="${barH}" fill="#6cb6ff" opacity="0.4"/>`
         + `<text x="${pad + i * xStep}" y="${h - pad + 14}" text-anchor="middle" fill="#8a93a8" font-size="10">${days[i].substring(5)}</text>`
         + (c > 0 ? `<text x="${pad + i * xStep}" y="${y - 4}" text-anchor="middle" fill="#e3e6eb" font-size="11">${c}</text>` : '');
  }).join('');
  document.getElementById('trend-chart').innerHTML = `
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#2d3340"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#2d3340"/>
      ${bars}
      <polyline points="${points}" fill="none" stroke="#f0c674" stroke-width="2"/>
    </svg>
  `;
}

async function loadAll() {
  try {
    const [status, stats, violations, summary, lessons, byAgent, trend] = await Promise.all([
      fetchJSON('/status'),
      fetchJSON('/api/stats'),
      fetchJSON('/api/violations?limit=15'),
      fetchJSON('/api/violations/summary'),
      fetchJSON('/api/lessons?limit=10'),
      fetchJSON('/api/violations/by_agent'),
      fetchJSON('/api/violations/trend?days=14'),
    ]);
    renderStats(stats, status);
    renderViolations(violations.rows || []);
    renderSummary(summary.rows || []);
    renderLessons(lessons.rows || []);
    renderDonutChart(byAgent.rows || []);
    renderTrendChart(trend);
  } catch (e) {
    document.getElementById('stats-grid').innerText = 'Error loading: ' + e.message;
  }
}

loadAll();
setInterval(loadAll, 10000);  // Auto-refresh every 10s
</script>
</body>
</html>
"""

# Singleton cache for constitution (reloaded on file change)
_constitution_cache: dict[str, Any] | None = None
_constitution_mtime: float = 0.0
_cache_lock = threading.Lock()


def load_constitution() -> dict[str, Any]:
    """Load constitution with mtime-based cache invalidation."""
    global _constitution_cache, _constitution_mtime
    with _cache_lock:
        mtime = CONSTITUTION_PATH.stat().st_mtime
        if _constitution_cache is None or mtime != _constitution_mtime:
            with CONSTITUTION_PATH.open("r", encoding="utf-8") as f:
                _constitution_cache = yaml.safe_load(f)
            _constitution_mtime = mtime
        return _constitution_cache


def normalize_path(path: str) -> str:
    """Normalize path for comparison (forward slashes, no trailing slash)."""
    return path.replace("\\", "/").strip().rstrip("/")


def check_tier_0(constitution: dict, path: str) -> dict[str, Any] | None:
    """Return violation dict if path touches Tier 0, else None."""
    normalized = normalize_path(path).lower()
    for entry in constitution["governance"]["tier_0_paths"]:
        tier_0 = normalize_path(entry["path"]).lower()
        if tier_0 in normalized:
            return {
                "rule": "TIER_0_VIOLATION",
                "reason": f"Tier 0 sacred space: {entry['path']} ({entry['reason']})",
                "blocked": True,
                "severity": "BLOCK",
            }
    return None


def check_protected_modification(constitution: dict, path: str, intent: str) -> dict[str, Any] | None:
    """Block writes to constitution files."""
    if intent not in {"write", "modify", "delete"}:
        return None
    normalized = normalize_path(path)
    protected = [
        ".cdc/CONSTITUTION.yaml",
        "01_Control_Tower/01_MASTER_CONSTITUTION.md",
    ]
    for prot in protected:
        if normalized.endswith(prot):
            return {
                "rule": "CONSTITUTION_MODIFICATION",
                "reason": f"Constitution file modification requires Chairman approval: {prot}",
                "blocked": True,
                "severity": "BLOCK",
            }
    return None


def check_authority_matrix(constitution: dict, path: str, intent: str, agent: str) -> dict[str, Any] | None:
    """Check authority_matrix for write permissions."""
    if intent not in {"write", "modify", "delete"}:
        return None
    default = constitution["authority_matrix"]["default"]
    normalized = normalize_path(path)

    # Cannot access (Tier 0) — already covered, defensive duplicate
    for pattern in default.get("cannot_access", []):
        prefix = normalize_path(pattern.replace("**", "").rstrip("/"))
        if prefix and normalized.startswith(prefix):
            return {
                "rule": "AUTHORITY_DENIED",
                "reason": f"Path is in cannot_access: {pattern}",
                "blocked": True,
                "severity": "BLOCK",
            }

    # Requires approval — warn but allow (agent must coordinate with Chairman)
    for pattern in default.get("requires_approval", []):
        prefix = normalize_path(pattern.replace("**", "").rstrip("/"))
        if prefix and normalized.startswith(prefix):
            return {
                "rule": "APPROVAL_REQUIRED",
                "reason": f"Path requires Chairman approval: {pattern}",
                "blocked": False,
                "severity": "WARN",
            }
    return None


def log_violation(entry: dict[str, Any]) -> None:
    """Append violation entry to JSONL log."""
    VIOLATION_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry["timestamp"] = datetime.now().isoformat(timespec="seconds")
    with VIOLATION_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def read_recent_violations(limit: int = 100) -> list[dict[str, Any]]:
    """Read last N violations from JSONL log."""
    if not VIOLATION_LOG.exists():
        return []
    lines = VIOLATION_LOG.read_text(encoding="utf-8").splitlines()
    recent = lines[-limit:]
    result = []
    for line in recent:
        line = line.strip()
        if not line:
            continue
        try:
            result.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return result


# ============================================================================
# HTTP Handler
# ============================================================================

class ValidationHandler(BaseHTTPRequestHandler):
    """HTTP handler for CDC Validation API."""

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def log_message(self, format: str, *args: Any) -> None:
        # Quieter access log
        msg = format % args
        print(f"[API] {self.address_string()} {msg}")

    def _send_html(self, status: int, html: str) -> None:
        body = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _query_param(self, key: str, default: str = "") -> str:
        if "?" not in self.path:
            return default
        _, query = self.path.split("?", 1)
        for pair in query.split("&"):
            if pair.startswith(f"{key}="):
                return pair.split("=", 1)[1]
        return default

    # --- GET routes ---------------------------------------------------------
    def do_GET(self) -> None:
        constitution = load_constitution()

        # Dashboard UI
        if self.path == "/dashboard" or self.path == "/":
            self._send_html(200, DASHBOARD_HTML)
            return

        if self.path == "/status":
            self._send_json(200, {
                "status": "ok",
                "version": constitution["metadata"]["version"],
                "last_updated": constitution["metadata"]["last_updated"],
                "tier_0_count": len(constitution["governance"]["tier_0_paths"]),
                "agents_supported": list(constitution["agents"].keys()),
                "uptime_check": datetime.now().isoformat(timespec="seconds"),
            })
            return

        if self.path == "/constitution":
            self._send_json(200, constitution)
            return

        # /api/stats — memory backend stats
        if self.path == "/api/stats":
            if _MEMORY_AVAILABLE:
                self._send_json(200, Memory().stats())
            else:
                self._send_json(200, {"lessons": 0, "violations": 0, "actions": 0, "sessions": 0})
            return

        # /api/violations/summary — by rule
        if self.path.startswith("/api/violations/summary"):
            if _MEMORY_AVAILABLE:
                self._send_json(200, {"rows": Memory().violation_counts_by_rule()})
            else:
                self._send_json(200, {"rows": []})
            return

        # /api/violations/by_agent — donut chart data
        if self.path.startswith("/api/violations/by_agent"):
            if _MEMORY_AVAILABLE:
                rows = Memory().recent_violations(limit=10000)
                counter: dict[str, int] = {}
                for r in rows:
                    counter[r["agent"]] = counter.get(r["agent"], 0) + 1
                self._send_json(200, {
                    "rows": [{"agent": k, "count": v}
                             for k, v in sorted(counter.items(), key=lambda kv: kv[1], reverse=True)]
                })
            else:
                self._send_json(200, {"rows": []})
            return

        # /api/violations/trend — last N days bar/line chart data
        if self.path.startswith("/api/violations/trend"):
            try:
                days = int(self._query_param("days", "14"))
            except ValueError:
                days = 14
            if _MEMORY_AVAILABLE:
                from datetime import timedelta
                today = datetime.now().date()
                buckets = {(today - timedelta(days=i)).isoformat(): 0 for i in range(days - 1, -1, -1)}
                for r in Memory().recent_violations(limit=10000):
                    ts = r.get("timestamp", "")
                    day_key = ts[:10] if len(ts) >= 10 else ""
                    if day_key in buckets:
                        buckets[day_key] += 1
                ordered = sorted(buckets.items())
                self._send_json(200, {
                    "days":   [d for d, _ in ordered],
                    "counts": [c for _, c in ordered],
                })
            else:
                self._send_json(200, {"days": [], "counts": []})
            return

        if self.path.startswith("/api/violations"):
            try:
                limit = int(self._query_param("limit", "20"))
            except ValueError:
                limit = 20
            if _MEMORY_AVAILABLE:
                self._send_json(200, {"rows": Memory().recent_violations(limit)})
            else:
                self._send_json(200, {"rows": read_recent_violations(limit)})
            return

        # /api/lessons — recent lessons
        if self.path.startswith("/api/lessons"):
            try:
                limit = int(self._query_param("limit", "20"))
            except ValueError:
                limit = 20
            if _MEMORY_AVAILABLE:
                self._send_json(200, {"rows": Memory().recent_lessons(limit)})
            else:
                self._send_json(200, {"rows": []})
            return

        # Legacy /violations (JSONL-backed)
        if self.path.startswith("/violations"):
            limit = 100
            if "?" in self.path:
                _, query = self.path.split("?", 1)
                for pair in query.split("&"):
                    if pair.startswith("limit="):
                        try:
                            limit = int(pair.split("=", 1)[1])
                        except ValueError:
                            pass
            self._send_json(200, {"violations": read_recent_violations(limit)})
            return

        self._send_json(404, {"error": "Not found", "path": self.path})

    # --- POST routes --------------------------------------------------------
    def do_POST(self) -> None:
        constitution = load_constitution()
        body = self._read_json()

        if self.path == "/validate/path":
            path = body.get("path", "")
            intent = body.get("intent", "read")
            agent = body.get("agent", "unknown")
            if not path:
                self._send_json(400, {"error": "Missing 'path' field"})
                return

            checks = [
                check_tier_0(constitution, path),
                check_protected_modification(constitution, path, intent),
                check_authority_matrix(constitution, path, intent, agent),
            ]
            for result in checks:
                if result is not None:
                    if result["blocked"]:
                        log_violation({
                            "agent": agent,
                            "rule": result["rule"],
                            "path": path,
                            "intent": intent,
                            "action": "validate_path",
                            "blocked": True,
                            "reason": result["reason"],
                        })
                    self._send_json(200, {
                        "allowed": not result["blocked"],
                        "reason": result["reason"],
                        "rule": result["rule"],
                        "severity": result["severity"],
                    })
                    return

            self._send_json(200, {"allowed": True, "reason": "No constitutional violation detected"})
            return

        if self.path == "/validate/command":
            command = body.get("command", "")
            args = body.get("args", [])
            agent = body.get("agent", "unknown")

            # Check any arg for Tier 0 touch
            for arg in args:
                if not isinstance(arg, str):
                    continue
                violation = check_tier_0(constitution, arg)
                if violation:
                    log_violation({
                        "agent": agent,
                        "rule": violation["rule"],
                        "command": command,
                        "args": args,
                        "action": "validate_command",
                        "blocked": True,
                        "reason": violation["reason"],
                    })
                    self._send_json(200, {
                        "allowed": False,
                        "reason": violation["reason"],
                        "rule": violation["rule"],
                    })
                    return

            self._send_json(200, {"allowed": True, "reason": "Command passed checks"})
            return

        if self.path == "/validate/action":
            # Generic action: agent declares (path, intent, action_type)
            path = body.get("path", "")
            intent = body.get("intent", "read")
            action_type = body.get("action_type", "generic")
            agent = body.get("agent", "unknown")

            violation = check_tier_0(constitution, path) if path else None
            if violation:
                log_violation({
                    "agent": agent,
                    "rule": violation["rule"],
                    "action_type": action_type,
                    "path": path,
                    "intent": intent,
                    "blocked": True,
                    "reason": violation["reason"],
                })
                self._send_json(200, {
                    "allowed": False,
                    "reason": violation["reason"],
                    "rule": violation["rule"],
                })
                return

            self._send_json(200, {"allowed": True, "reason": "Action permitted"})
            return

        if self.path == "/report/violation":
            agent = body.get("agent", "unknown")
            rule = body.get("rule", "UNSPECIFIED")
            detail = body.get("detail", "")
            log_violation({
                "agent": agent,
                "rule": rule,
                "detail": detail,
                "source": "self_reported",
            })
            self._send_json(200, {"recorded": True})
            return

        self._send_json(404, {"error": "Not found", "path": self.path})


# ============================================================================
# Main
# ============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="CDC External Validation API")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()

    # Validate constitution can load
    try:
        constitution = load_constitution()
        print(f"[API] Constitution loaded: v{constitution['metadata']['version']}")
    except Exception as e:
        print(f"[API] FATAL: Cannot load constitution: {e}", file=sys.stderr)
        return 1

    server = ThreadingHTTPServer((args.bind, args.port), ValidationHandler)
    print(f"[API] CDC Validation API listening on http://{args.bind}:{args.port}")
    print(f"[API] Dashboard: http://{args.bind}:{args.port}/dashboard")
    print(f"[API] Endpoints: /status, /constitution, /validate/path, /validate/command,")
    print(f"[API]            /validate/action, /report/violation, /violations,")
    print(f"[API]            /api/stats, /api/violations, /api/violations/summary, /api/lessons")
    print(f"[API] Memory backend: {'AVAILABLE' if _MEMORY_AVAILABLE else 'unavailable (memory_backend.py not found)'}")
    print(f"[API] Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[API] Shutting down...")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
