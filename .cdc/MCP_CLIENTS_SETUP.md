# MCP Clients Setup Guide

> **For**: Connecting Claude Code, Cursor, Continue, and other MCP-aware
> clients to the CDC Constitutional MCP Server.

---

## 📡 What This Connects

Once configured, your AI tool gains 5 CDC tools and 4 resources:

**Tools**
- `validate_path` — Check if a path is allowed before touching it
- `check_authority` — Authority matrix gating
- `query_memory` — Search lessons / violations / actions / stats
- `report_violation` — Self-report a constitutional breach
- `trigger_heal` — Invoke the self-healing pipeline

**Resources** (read-only URIs)
- `cdc://constitution` — Full CONSTITUTION.yaml as JSON
- `cdc://violations/recent` — Last 50 violations
- `cdc://lessons/recent` — Last 50 lessons
- `cdc://stats` — Memory backend stats

---

## 🎯 Server Command

All clients invoke the same command:

```
py C:\99_Develop\SynologyDrive\.cdc\scripts\mcp_server.py
```

The server speaks JSON-RPC 2.0 over stdio (no network port).

---

## 1️⃣ Claude Code

Add to your Claude Code MCP configuration. Two common locations:

### Project-scoped (recommended for this repo)
Create or edit `.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "cdc": {
      "command": "py",
      "args": [
        "C:\\99_Develop\\SynologyDrive\\.cdc\\scripts\\mcp_server.py"
      ],
      "env": {
        "PYTHONIOENCODING": "utf-8"
      }
    }
  }
}
```

### User-scoped (all projects)
Same JSON but in `%APPDATA%\Claude\mcp_servers.json` (or wherever your
Claude Code installation reads global MCP config).

### Verification
Restart Claude Code, then run a CDC tool:
```
@cdc validate_path path="00_philosophy/test" intent="write"
```
Expected: `{"allowed": false, "reason": "Tier 0 sacred space: 00_philosophy", "rule": "TIER_0_VIOLATION"}`

---

## 2️⃣ Cursor

Cursor 0.42+ supports MCP. Add to `.cursor/mcp.json` (project) or
`~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "cdc": {
      "command": "py",
      "args": ["C:\\99_Develop\\SynologyDrive\\.cdc\\scripts\\mcp_server.py"],
      "env": { "PYTHONIOENCODING": "utf-8" }
    }
  }
}
```

After saving, open **Settings → MCP** and toggle `cdc` to enabled.

---

## 3️⃣ Continue (VSCode/JetBrains extension)

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "py",
          "args": ["C:\\99_Develop\\SynologyDrive\\.cdc\\scripts\\mcp_server.py"]
        }
      }
    ]
  }
}
```

---

## 4️⃣ Cline / Roo (VSCode extensions)

Edit the extension's MCP settings JSON. Typical path:
`~/.config/Code/User/globalStorage/<ext-id>/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "cdc": {
      "command": "py",
      "args": ["C:\\99_Develop\\SynologyDrive\\.cdc\\scripts\\mcp_server.py"],
      "disabled": false,
      "autoApprove": ["validate_path", "check_authority", "query_memory"]
    }
  }
}
```

`autoApprove` lets the client call those tools without per-invocation
permission prompts — safe because they are read-only.

---

## 5️⃣ Custom Client (curl + JSON-RPC)

Any process that can spawn a subprocess + read/write stdio can talk to it:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}}}' | py mcp_server.py
```

See `.cdc/scripts/mcp_test.py` for a complete reference harness with 7
example calls covering initialize / tools/list / tools/call / resources.

---

## 🔍 Troubleshooting

| Symptom | Cause | Fix |
|:---|:---|:---|
| Client shows `cdc` server "stopped" | Python not on PATH | Set `command` to full path: `C:\Users\<user>\AppData\Local\...\py.exe` |
| Tools list empty | Server crashed at init | Check stderr (most clients show it). Usually missing `PyYAML` — run `py -m pip install pyyaml` |
| Korean text mangled in responses | stdio not UTF-8 | Set `env.PYTHONIOENCODING=utf-8` (already in templates above) |
| `Method not found` error | Wrong protocol version | This server speaks `2024-11-05`. Client must be MCP-compliant |
| Tools work but resources don't | Client doesn't request `resources/list` | Re-check the client's MCP support documentation |

---

## 🔐 Security Notes

The MCP server runs **with the same OS permissions** as the user that
launched the client (typically your interactive session). It does NOT
require admin/root.

**Read-only by default** for the resources. Tools that write to memory
(`report_violation`) do not touch the constitution itself or the filesystem
— they only append to `memory.db`.

Tier 0 protection still applies through `validate_path`: even if a client
calls `validate_path` for a Tier 0 path, the server returns `allowed=false`.
The MCP server does NOT bypass the constitution.

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
