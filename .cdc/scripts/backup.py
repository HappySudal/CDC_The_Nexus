"""
CDC Backup / Restore Automation
================================

Snapshots critical state on-demand or on schedule:
  - .cdc/CONSTITUTION.yaml   (hash-keyed when changed)
  - .cdc/memory.db           (daily rotating)

Backup layout
-------------
.cdc/backups/
├── constitution/
│   └── CONSTITUTION_<sha256[:12]>_<timestamp>.yaml   (only when hash changes)
└── memory/
    └── memory_<YYYYMMDD>.db                           (daily, keep last 30)

Usage
-----
    py backup.py snapshot          # Take snapshot now
    py backup.py restore --kind memory --file memory_20260523.db
    py backup.py list              # Show available snapshots
    py backup.py prune             # Apply retention (keep last 30 daily)
    py backup.py status            # Show retention + free disk + last snapshot

Author: Claude Opus 4.7
Date: 2026-05-23
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
CDC_ROOT = REPO_ROOT / ".cdc"
BACKUP_ROOT = CDC_ROOT / "backups"
CONSTITUTION = CDC_ROOT / "CONSTITUTION.yaml"
MEMORY_DB = CDC_ROOT / "memory.db"

MEMORY_RETENTION_DAYS = 30


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def snapshot_constitution() -> dict:
    if not CONSTITUTION.exists():
        return {"status": "skipped", "reason": "CONSTITUTION.yaml not found"}

    backup_dir = BACKUP_ROOT / "constitution"
    backup_dir.mkdir(parents=True, exist_ok=True)
    current_hash = sha256_file(CONSTITUTION)
    short = current_hash[:12]

    # Check whether this hash already has a backup
    existing = list(backup_dir.glob(f"CONSTITUTION_{short}_*.yaml"))
    if existing:
        return {
            "status": "unchanged",
            "hash": current_hash,
            "existing": str(existing[0].name),
        }

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = backup_dir / f"CONSTITUTION_{short}_{ts}.yaml"
    shutil.copy2(CONSTITUTION, dest)
    return {"status": "snapshotted", "hash": current_hash, "file": str(dest.name)}


def snapshot_memory() -> dict:
    if not MEMORY_DB.exists():
        return {"status": "skipped", "reason": "memory.db not found"}

    backup_dir = BACKUP_ROOT / "memory"
    backup_dir.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y%m%d")
    dest = backup_dir / f"memory_{today}.db"

    if dest.exists():
        # Already snapshotted today — overwrite (idempotent)
        action = "overwritten"
    else:
        action = "created"

    shutil.copy2(MEMORY_DB, dest)
    return {"status": "snapshotted", "action": action, "file": str(dest.name), "size": dest.stat().st_size}


def prune_memory() -> dict:
    backup_dir = BACKUP_ROOT / "memory"
    if not backup_dir.exists():
        return {"status": "skipped", "reason": "no memory backups"}

    cutoff = datetime.now() - timedelta(days=MEMORY_RETENTION_DAYS)
    removed = []
    for f in backup_dir.glob("memory_*.db"):
        stamp = f.stem.replace("memory_", "")
        try:
            file_date = datetime.strptime(stamp, "%Y%m%d")
        except ValueError:
            continue
        if file_date < cutoff:
            f.unlink()
            removed.append(f.name)
    return {"status": "pruned", "removed_count": len(removed), "removed": removed}


def list_snapshots() -> dict:
    result: dict = {"constitution": [], "memory": []}
    c_dir = BACKUP_ROOT / "constitution"
    m_dir = BACKUP_ROOT / "memory"
    if c_dir.exists():
        for f in sorted(c_dir.glob("CONSTITUTION_*.yaml"), reverse=True):
            result["constitution"].append({
                "file": f.name,
                "size": f.stat().st_size,
                "mtime": datetime.fromtimestamp(f.stat().st_mtime).isoformat(timespec="seconds"),
            })
    if m_dir.exists():
        for f in sorted(m_dir.glob("memory_*.db"), reverse=True):
            result["memory"].append({
                "file": f.name,
                "size": f.stat().st_size,
                "mtime": datetime.fromtimestamp(f.stat().st_mtime).isoformat(timespec="seconds"),
            })
    return result


def restore(kind: str, filename: str) -> dict:
    """Restore CONSTITUTION.yaml or memory.db from a backup file."""
    if kind == "constitution":
        src = BACKUP_ROOT / "constitution" / filename
        dest = CONSTITUTION
    elif kind == "memory":
        src = BACKUP_ROOT / "memory" / filename
        dest = MEMORY_DB
    else:
        return {"status": "error", "reason": f"Unknown kind: {kind}"}

    if not src.exists():
        return {"status": "error", "reason": f"Backup not found: {src}"}

    # Pre-restore safety: snapshot current state first
    pre = snapshot_memory() if kind == "memory" else snapshot_constitution()
    shutil.copy2(src, dest)
    return {"status": "restored", "from": str(src.name), "to": str(dest.name), "pre_restore_snapshot": pre}


def status() -> dict:
    snaps = list_snapshots()
    free_gb = round(shutil.disk_usage(str(REPO_ROOT)).free / 1024**3, 2)
    return {
        "constitution_snapshots": len(snaps["constitution"]),
        "memory_snapshots": len(snaps["memory"]),
        "latest_constitution": snaps["constitution"][0] if snaps["constitution"] else None,
        "latest_memory": snaps["memory"][0] if snaps["memory"] else None,
        "retention_days_memory": MEMORY_RETENTION_DAYS,
        "free_disk_gb": free_gb,
    }


# ============================================================================
# CLI
# ============================================================================

def cmd_snapshot(_args: argparse.Namespace) -> int:
    print("=" * 60)
    print("CDC Snapshot")
    print("=" * 60)
    c = snapshot_constitution()
    m = snapshot_memory()
    print(f"Constitution: {json.dumps(c, ensure_ascii=False)}")
    print(f"Memory:       {json.dumps(m, ensure_ascii=False)}")
    return 0


def cmd_restore(args: argparse.Namespace) -> int:
    result = restore(args.kind, args.file)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("status") == "restored" else 1


def cmd_list(_args: argparse.Namespace) -> int:
    snaps = list_snapshots()
    print("=" * 60)
    print("Available Snapshots")
    print("=" * 60)
    print(f"\nConstitution ({len(snaps['constitution'])}):")
    for s in snaps["constitution"][:10]:
        print(f"  {s['mtime']}  {s['size']:>10,}  {s['file']}")
    print(f"\nMemory ({len(snaps['memory'])}):")
    for s in snaps["memory"][:10]:
        print(f"  {s['mtime']}  {s['size']:>10,}  {s['file']}")
    return 0


def cmd_prune(_args: argparse.Namespace) -> int:
    result = prune_memory()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def cmd_status(_args: argparse.Namespace) -> int:
    print(json.dumps(status(), ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="CDC Backup / Restore")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("snapshot").set_defaults(func=cmd_snapshot)
    r = sub.add_parser("restore")
    r.add_argument("--kind", required=True, choices=["constitution", "memory"])
    r.add_argument("--file", required=True)
    r.set_defaults(func=cmd_restore)
    sub.add_parser("list").set_defaults(func=cmd_list)
    sub.add_parser("prune").set_defaults(func=cmd_prune)
    sub.add_parser("status").set_defaults(func=cmd_status)
    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())


# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
