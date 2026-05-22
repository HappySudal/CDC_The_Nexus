"""
Antithesis API Key Verifier
============================

Reads .env file at repo root (optional) plus current process environment.
Reports which of the 3 Antithesis models have keys configured and (with
--probe) attempts a minimal ping to validate the key works.

Usage
-----
    py verify_antithesis_keys.py                # status check
    py verify_antithesis_keys.py --probe        # also call each API once
    py verify_antithesis_keys.py --load-env     # load .env first

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


REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / ".env"

KEYS = {
    "gemini":     "GEMINI_API_KEY",
    "grok":       "GROK_API_KEY",
    "perplexity": "PERPLEXITY_API_KEY",
}


def load_dotenv(path: Path) -> int:
    """Minimal .env loader (KEY=VALUE per line, # comments). Returns # loaded."""
    if not path.exists():
        return 0
    loaded = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and val and key not in os.environ:
            os.environ[key] = val
            loaded += 1
    return loaded


def probe(model: str, key_value: str) -> dict:
    """Send a minimal request to each provider; return ok/error summary."""
    try:
        if model == "gemini":
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models"
                f"/gemini-1.5-flash:generateContent?key={key_value}"
            )
            payload = {"contents": [{"parts": [{"text": "ping"}]}]}
            req = urllib.request.Request(
                url, data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}, method="POST",
            )
        elif model == "grok":
            url = "https://api.x.ai/v1/chat/completions"
            payload = {"model": "grok-beta", "messages": [{"role": "user", "content": "ping"}]}
            req = urllib.request.Request(
                url, data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key_value}",
                },
                method="POST",
            )
        elif model == "perplexity":
            url = "https://api.perplexity.ai/chat/completions"
            payload = {
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": [{"role": "user", "content": "ping"}],
            }
            req = urllib.request.Request(
                url, data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key_value}",
                },
                method="POST",
            )
        else:
            return {"ok": False, "error": "unknown model"}

        with urllib.request.urlopen(req, timeout=15) as resp:
            return {"ok": True, "status": resp.status}
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": f"HTTP {e.code}", "body": e.read().decode("utf-8", errors="replace")[:200]}
    except urllib.error.URLError as e:
        return {"ok": False, "error": f"URL error: {e.reason}"}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}


def main() -> int:
    p = argparse.ArgumentParser(description="Verify Antithesis API keys")
    p.add_argument("--probe", action="store_true", help="Send a test request to each configured API")
    p.add_argument("--load-env", action="store_true", help=f"Load {ENV_FILE} before checking")
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    if args.load_env:
        n = load_dotenv(ENV_FILE)
        print(f"[INFO] Loaded {n} entries from {ENV_FILE.name}")

    report = {}
    for model, env_key in KEYS.items():
        val = os.environ.get(env_key, "")
        present = bool(val)
        result = {"key_present": present, "env_var": env_key}
        if present and args.probe:
            result["probe"] = probe(model, val)
        report[model] = result

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("=" * 60)
        print("Antithesis API Key Status")
        print("=" * 60)
        for model, r in report.items():
            mark = "OK" if r["key_present"] else "--"
            print(f"  [{mark}] {model:12s} ({r['env_var']})")
            if "probe" in r:
                pr = r["probe"]
                pmark = "ALIVE" if pr.get("ok") else "FAIL"
                print(f"        Probe: [{pmark}] {pr.get('error') or 'status=' + str(pr.get('status'))}")

    have = sum(1 for r in report.values() if r["key_present"])
    print(f"\n{have}/3 keys configured.")
    return 0


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
