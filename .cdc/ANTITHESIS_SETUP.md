# Antithesis Protocol — API Key Setup Guide

> **For**: Chairman Sudal
> **Effect**: Once any key is configured, the Antithesis protocol activates
> automatically — no code changes required.

---

## 🎯 What This Does

The Antithesis protocol (Rule 2-1) submits AI analysis to **3 external
models** for adversarial critique, then synthesizes a consensus verdict:

| Model | Provider | Role |
|:---|:---|:---|
| **Gemini 1.5 Pro** | Google | Broad-context critique (1M tokens) |
| **Grok** | xAI | Blunt critique + bias detection |
| **Perplexity** | Perplexity AI | Factuality + currency check |

With **all 3 keys configured**: 95% consensus confidence achievable.
With **0 keys**: Theses are recorded in `memory.db` for later verification.

---

## 📋 Setup Options

### Option A — `.env` File at Repo Root (RECOMMENDED)

1. Create `C:\99_Develop\SynologyDrive\.env` (this file is NOT committed; the path is excluded by Git automatically because it sits outside `.cdc/.gitignore` scope; if needed, add `.env` to root `.gitignore`)

2. Contents:
   ```
   # Antithesis Protocol API Keys
   GEMINI_API_KEY=AIza...your_key_here
   GROK_API_KEY=xai-...your_key_here
   PERPLEXITY_API_KEY=pplx-...your_key_here
   ```

3. The Antithesis script can load this file via `--load-env`.

### Option B — Windows User Environment Variables (PERSISTENT)

PowerShell (run as the user account, **not** as admin):

```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY",     "AIza...",  "User")
[Environment]::SetEnvironmentVariable("GROK_API_KEY",       "xai-...",  "User")
[Environment]::SetEnvironmentVariable("PERPLEXITY_API_KEY", "pplx-...", "User")
```

Restart your shell. Variables now visible to all processes (including the
Validation API Scheduled Task at next logon).

### Option C — Session-Only (Quick Test)

```powershell
$env:GEMINI_API_KEY = "AIza..."
$env:GROK_API_KEY = "xai-..."
$env:PERPLEXITY_API_KEY = "pplx-..."
py .cdc\scripts\antithesis.py verify --thesis "test"
```

---

## 🔍 Verification Workflow

After setting keys, verify they work:

```powershell
# Check which keys are present (no API calls)
py .cdc\scripts\verify_antithesis_keys.py

# Probe each configured API with a minimal ping
py .cdc\scripts\verify_antithesis_keys.py --probe

# If using .env file, load it first
py .cdc\scripts\verify_antithesis_keys.py --load-env --probe
```

Expected output when all 3 are configured and alive:

```
Antithesis API Key Status
  [OK] gemini       (GEMINI_API_KEY)
        Probe: [ALIVE] status=200
  [OK] grok         (GROK_API_KEY)
        Probe: [ALIVE] status=200
  [OK] perplexity   (PERPLEXITY_API_KEY)
        Probe: [ALIVE] status=200

3/3 keys configured.
```

---

## 🚀 Running a Real Antithesis Verification

```powershell
py .cdc\scripts\antithesis.py verify `
    --thesis "Tier 0 paths should never be modified by AI agents" `
    --agent chairman
```

Output (with 3 keys configured):

```
Antithesis Verification Result
Thesis:    Tier 0 paths should never be modified by AI agents
Model Responses:
  gemini       → agree
  grok         → agree
  perplexity   → agree
Consensus:       unanimous_agree
Confidence:      95%
Recommendation:  Proceed with high confidence.
```

The verdict + responses are auto-recorded in `memory.db` under
`agent_actions` (action_type = `antithesis_verify`).

---

## 🔐 Security Notes

1. **Never commit API keys** — `.env` file should be in `.gitignore`
2. **Keep keys per-machine** — do not share across environments
3. **Rotate periodically** — providers usually have an audit/usage page
4. **Revoke immediately** if a key leaks (each provider has a revoke API)

---

## 📊 Cost Considerations (rough estimates, 2026)

| Provider | Cost per Antithesis call (3-model verify) | Monthly budget at 10/day |
|:---|:---|:---|
| Gemini 1.5 Pro | ~$0.001 | ~$0.30 |
| Grok | ~$0.005 | ~$1.50 |
| Perplexity | ~$0.002 | ~$0.60 |
| **Total** | **~$0.008/call** | **~$2.40/month** |

For high-stakes decisions only. For routine work, Antithesis is overkill.

---

## 🔄 Recovery: Re-Verify Pending Theses

Theses recorded while keys were missing (`pending_external_verification`)
can be re-run once keys are set:

```powershell
# List pending theses
py .cdc\scripts\antithesis.py history --limit 50

# Re-run a specific thesis (copy the target text from history)
py .cdc\scripts\antithesis.py verify --thesis "<paste here>"
```

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
