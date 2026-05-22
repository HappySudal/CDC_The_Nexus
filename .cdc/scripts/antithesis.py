"""
CDC Antithesis Protocol — 3-Model Verification (Rule 2-1)
==========================================================

Submits an analysis (Thesis) to multiple AI models for adversarial critique
and synthesizes a Verdict based on consensus.

Models (configurable via env vars):
    GEMINI_API_KEY      — Google Gemini (broad context critique)
    GROK_API_KEY        — xAI Grok (blunt critique + bias detection)
    PERPLEXITY_API_KEY  — Perplexity (factuality + currency check)

If no API keys are present, the script runs in "skeleton mode": records
the thesis to memory.db with status PENDING_EXTERNAL_VERIFICATION so a
later run (when keys are configured) can resume.

CLI
---
    py antithesis.py verify --thesis "Tier 0 paths should remain immutable"
    py antithesis.py history --limit 20

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))
from memory_backend import Memory  # noqa: E402


CACHE_TTL_SECONDS = 86400  # 24 hours


# ============================================================================
# Model Configuration
# ============================================================================

MODELS = {
    "gemini": {
        "env_key":   "GEMINI_API_KEY",
        "role":      "broad-context critique (1M token)",
        "endpoint":  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
        "prompt_template": (
            "Critique this analysis for logical holes, missed perspectives, "
            "or assumptions that may not hold:\n\n{thesis}\n\n"
            "Respond with: VERDICT (agree/disagree/partial), KEY_CRITIQUES (bullet list)."
        ),
    },
    "grok": {
        "env_key":   "GROK_API_KEY",
        "role":      "blunt critique + bias detection",
        "endpoint":  "https://api.x.ai/v1/chat/completions",
        "prompt_template": (
            "Be blunt and direct. What is dangerous, biased, or wrong about this analysis?\n\n"
            "{thesis}\n\nRespond with: VERDICT, BIAS_DETECTED, DANGEROUS_ASSUMPTIONS."
        ),
    },
    "perplexity": {
        "env_key":   "PERPLEXITY_API_KEY",
        "role":      "factuality + currency check",
        "endpoint":  "https://api.perplexity.ai/chat/completions",
        "prompt_template": (
            "Verify the factual claims and currency (2026) of this analysis:\n\n"
            "{thesis}\n\nRespond with: VERDICT, OUTDATED_FACTS, BETTER_ALTERNATIVES."
        ),
    },
}


# ============================================================================
# Consensus Algorithm
# ============================================================================

@dataclass
class ModelResponse:
    model: str
    verdict: str          # agree / disagree / partial / unknown / unavailable
    raw_text: str = ""
    error: str | None = None


@dataclass
class AntithesisResult:
    thesis: str
    responses: list[ModelResponse] = field(default_factory=list)
    consensus: str = "unknown"
    confidence: int = 0
    recommendation: str = ""
    timestamp: str = ""


def parse_verdict(raw: str) -> str:
    """Cheap heuristic: extract verdict keyword from raw response."""
    low = raw.lower()
    for word in ("agree", "disagree", "partial"):
        if word in low:
            return word
    return "unknown"


def call_model(model_key: str, thesis: str) -> ModelResponse:
    """Call a single model. Returns ModelResponse (with error if unavailable)."""
    cfg = MODELS[model_key]
    api_key = os.environ.get(cfg["env_key"])
    if not api_key:
        return ModelResponse(model=model_key, verdict="unavailable", error=f"{cfg['env_key']} not set")

    prompt = cfg["prompt_template"].format(thesis=thesis)
    payload: dict[str, Any]
    headers = {"Content-Type": "application/json"}

    # Each provider has its own API shape; here we use representative skeletons.
    # On schema mismatch the call simply fails and we return unavailable.
    if model_key == "gemini":
        url = f"{cfg['endpoint']}?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
    else:
        url = cfg["endpoint"]
        headers["Authorization"] = f"Bearer {api_key}"
        model_name = "grok-beta" if model_key == "grok" else "llama-3.1-sonar-large-128k-online"
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
        }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            return ModelResponse(model=model_key, verdict=parse_verdict(text), raw_text=text)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        return ModelResponse(model=model_key, verdict="unavailable", error=str(e))
    except Exception as e:  # noqa: BLE001
        return ModelResponse(model=model_key, verdict="unavailable", error=f"{type(e).__name__}: {e}")


def synthesize(responses: list[ModelResponse]) -> tuple[str, int, str]:
    """
    Apply Rule 2-1 consensus rules to model responses.

    Returns: (consensus, confidence_percent, recommendation)
    """
    available = [r for r in responses if r.verdict not in ("unavailable", "unknown")]
    n = len(available)

    if n == 0:
        return ("pending_external_verification", 0,
                "No external models reachable. Thesis recorded for later verification when API keys are configured.")

    agree = sum(1 for r in available if r.verdict == "agree")
    disagree = sum(1 for r in available if r.verdict == "disagree")
    partial = sum(1 for r in available if r.verdict == "partial")

    if agree == n:
        return ("unanimous_agree", 95, "Proceed with high confidence.")
    if disagree == n:
        return ("unanimous_disagree", 95, "Halt. Revise thesis before proceeding.")
    if agree == n - 1:
        return ("majority_agree", 70, "Proceed but address the dissenting critique.")
    if disagree == n - 1:
        return ("majority_disagree", 70, "Halt. Address majority critiques.")
    if partial > 0 and disagree == 0:
        return ("partial_agree", 60, "Proceed with caveats noted.")
    return ("split", 50, "Escalate to Chairman (2% sovereign space).")


def _hash_thesis(thesis: str) -> str:
    return hashlib.sha256(thesis.encode("utf-8")).hexdigest()


def verify(thesis: str, agent: str = "system", use_cache: bool = True) -> AntithesisResult:
    """
    Run full Antithesis verification on a thesis.

    If use_cache=True and a cached verdict exists (within 24h TTL), reuse it
    instead of calling external APIs. Cache misses always trigger live calls
    and write the result back to the cache.
    """
    mem = Memory()
    thesis_hash = _hash_thesis(thesis)
    now_iso = datetime.now().isoformat(timespec="seconds")

    # ---- Cache hit path ----
    if use_cache:
        cached = mem.antithesis_get(thesis_hash, ttl_seconds=CACHE_TTL_SECONDS)
        if cached:
            result = AntithesisResult(thesis=thesis, timestamp=now_iso)
            result.consensus = cached["consensus"]
            result.confidence = int(cached["confidence"])
            result.recommendation = cached["recommendation"] or ""
            for r in json.loads(cached.get("responses_json") or "[]"):
                result.responses.append(ModelResponse(
                    model=r.get("model", "?"),
                    verdict=r.get("verdict", "unknown"),
                    error=r.get("error"),
                ))
            mem.log_action(
                agent=agent, action_type="antithesis_verify",
                target=thesis[:200], outcome=f"{result.consensus} (cache)",
                metadata={"confidence": result.confidence, "cache_hit": True},
            )
            return result

    # ---- Cache miss path ----
    result = AntithesisResult(thesis=thesis, timestamp=now_iso)
    for model_key in MODELS.keys():
        result.responses.append(call_model(model_key, thesis))

    consensus, confidence, recommendation = synthesize(result.responses)
    result.consensus = consensus
    result.confidence = confidence
    result.recommendation = recommendation

    # Persist to cache (only when at least one model was reachable)
    available = [r for r in result.responses if r.verdict not in ("unavailable", "unknown")]
    if use_cache and available:
        mem.antithesis_put(
            thesis_hash, thesis, consensus, confidence, recommendation,
            [{"model": r.model, "verdict": r.verdict, "error": r.error}
             for r in result.responses],
        )

    mem.log_action(
        agent=agent, action_type="antithesis_verify",
        target=thesis[:200], outcome=consensus,
        metadata={
            "confidence": confidence,
            "recommendation": recommendation,
            "cache_hit": False,
            "responses": [
                {"model": r.model, "verdict": r.verdict, "error": r.error}
                for r in result.responses
            ],
        },
    )
    return result


# ============================================================================
# CLI
# ============================================================================

def cmd_verify(args: argparse.Namespace) -> int:
    result = verify(args.thesis, agent=args.agent)
    print("=" * 60)
    print("Antithesis Verification Result")
    print("=" * 60)
    print(f"Thesis:    {result.thesis}")
    print(f"Timestamp: {result.timestamp}")
    print("\nModel Responses:")
    for r in result.responses:
        status = r.verdict
        suffix = f" — {r.error}" if r.error else ""
        print(f"  {r.model:12s} → {status}{suffix}")
    print(f"\nConsensus:       {result.consensus}")
    print(f"Confidence:      {result.confidence}%")
    print(f"Recommendation:  {result.recommendation}")
    return 0


def cmd_history(args: argparse.Namespace) -> int:
    mem = Memory()
    actions = [a for a in mem.recent_actions(limit=args.limit) if a["action_type"] == "antithesis_verify"]
    print("=" * 60)
    print(f"Antithesis History (last {len(actions)} of {args.limit} examined)")
    print("=" * 60)
    for a in actions:
        meta = json.loads(a["metadata"]) if a["metadata"] else {}
        print(f"#{a['id']} [{a['timestamp']}] {a['outcome']:30s} conf={meta.get('confidence', '?')}%  "
              f"thesis: {a['target'][:80]}...")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="CDC Antithesis Protocol")
    sub = p.add_subparsers(dest="cmd", required=True)

    v = sub.add_parser("verify", help="Verify a thesis with 3 models")
    v.add_argument("--thesis", required=True)
    v.add_argument("--agent", default="system")
    v.set_defaults(func=cmd_verify)

    h = sub.add_parser("history", help="Show verification history")
    h.add_argument("--limit", type=int, default=20)
    h.set_defaults(func=cmd_history)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
