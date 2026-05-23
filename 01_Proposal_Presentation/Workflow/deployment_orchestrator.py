#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STEP 6 Deployment Orchestrator
================================
의장님 최종 검수(STEP 5) 완료 후 자동 배포.

수행 작업:
  1. dist/win-unpacked/ 무결성 검증 (Hash)
  2. 배포용 ZIP 생성 (TheNexus_v{version}_win64.zip)
  3. Release Note 자동 생성
  4. CHANGELOG.md 갱신
  5. README.md 버전 동기화
  6. 06_Releases/ 폴더에 산출물 보관
  7. 배포 리포트 자동 생성
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DIST_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Application" / "win-unpacked"
RELEASES_DIR = PROJECT_ROOT / "06_Releases"
DOCUMENTS_DIR = PROJECT_ROOT / "01_Proposal_Presentation" / "Documents"
REPORT_DIR = PROJECT_ROOT / "Report"


def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_build() -> dict:
    """배포 산출물 무결성 검증."""
    exe_path = DIST_DIR / "The Nexus.exe"
    if not exe_path.exists():
        return {"result": "error", "message": "The Nexus.exe 없음. STEP 2 빌드 필요."}
    size_mb = exe_path.stat().st_size / (1024 * 1024)
    return {
        "result": "verified",
        "exe_path": str(exe_path),
        "size_mb": round(size_mb, 2),
        "sha256": compute_sha256(exe_path),
        "mtime": datetime.fromtimestamp(exe_path.stat().st_mtime).isoformat(timespec="seconds"),
    }


def package_release(version: str) -> dict:
    """배포 ZIP 패키징."""
    RELEASES_DIR.mkdir(parents=True, exist_ok=True)
    zip_name = f"TheNexus_v{version}_win64.zip"
    zip_path = RELEASES_DIR / zip_name

    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for item in DIST_DIR.rglob("*"):
            if item.is_file():
                arcname = item.relative_to(DIST_DIR.parent)
                zf.write(item, arcname)

    return {
        "result": "packaged",
        "zip_path": str(zip_path),
        "size_mb": round(zip_path.stat().st_size / (1024 * 1024), 2),
        "sha256": compute_sha256(zip_path),
    }


def generate_release_note(version: str, build_info: dict, package_info: dict) -> Path:
    note_path = RELEASES_DIR / f"RELEASE_NOTE_v{version}.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    content = f"""# The Nexus v{version} — Release Note

> 배포 일자: {now}
> 자동 생성 by deployment_orchestrator.py

---

## 빌드 정보

| 항목 | 값 |
|:---|:---|
| **버전** | v{version} |
| **빌드 일자** | {build_info.get('mtime', '-')} |
| **실행 파일 크기** | {build_info.get('size_mb', '-')} MB |
| **EXE SHA-256** | `{build_info.get('sha256', '-')}` |
| **배포 ZIP** | `{Path(package_info.get('zip_path', '')).name}` |
| **ZIP 크기** | {package_info.get('size_mb', '-')} MB |
| **ZIP SHA-256** | `{package_info.get('sha256', '-')}` |

---

## 핵심 기능

### 5대 물리 제어망
1. **로컬 엣지 AI** — Ollama 자율 기동 + 모델 스트리밍 다운로드
2. **자율형 에이전트** — ReAct (Reasoning+Action) 5회 루프
3. **파일 시스템 지배** — sandboxed read/write/list/search
4. **지식 그래프** — Knowledge Graph + TwinBrain 연동
5. **헌법 실시간 감시** — fs.watch + Discord Bridge

### 15개 Vue 컴포넌트
AgentCommandPanel, AgentDashboard, AnalyticsDashboard, ConfigurationPanel,
ConstitutionViewer, DiscordSetupWizard, KnowledgeGraphVisualizer, LogViewer,
NotificationCenter, OllamaModelDownloader, RealTimeDashboard, SearchInterface,
StatusDashboard, SystemHealthMonitor, TaskCreationForm

---

## 설치 방법

1. `TheNexus_v{version}_win64.zip` 압축 해제
2. `win-unpacked/The Nexus.exe` 실행
3. 첫 실행 시 Ollama 자동 감지

---

## 인증

- **수권자**: 수달의장 (Chairman Sudal)
- **워크플로우**: 6-Stage Build-up (기획→개발→검토→수정→검수→배포)
- **프레임워크**: SOVEREIGN PROTOCOL (98% 자동 + 2% 의장님 주권)

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
"""
    note_path.write_text(content, encoding="utf-8")
    return note_path


def update_changelog(version: str) -> Path:
    changelog = PROJECT_ROOT / "CHANGELOG.md"
    today = datetime.now().strftime("%Y-%m-%d")
    new_entry = (
        f"## [v{version}] - {today}\n\n"
        "### Released\n"
        "- 6-Stage 워크플로우 자동화 완료\n"
        "- The Nexus.exe 정식 배포\n"
        "- Workflow Engine 도입 (workflow_engine.py)\n\n"
    )

    if changelog.exists():
        existing = changelog.read_text(encoding="utf-8")
        if f"[v{version}]" not in existing:
            content = f"# CHANGELOG\n\n{new_entry}{existing.replace('# CHANGELOG', '').lstrip()}"
            changelog.write_text(content, encoding="utf-8")
    else:
        content = f"# CHANGELOG\n\n{new_entry}"
        changelog.write_text(content, encoding="utf-8")

    return changelog


def sync_readme_version(version: str) -> dict:
    readme = PROJECT_ROOT / "README.md"
    if not readme.exists():
        return {"result": "skipped", "reason": "README.md 없음"}
    content = readme.read_text(encoding="utf-8")
    new_content = re.sub(
        r"\*\*버전\*\*:\s*\d+\.\d+\.\d+.*",
        f"**버전**: {version} (Release)",
        content,
    )
    new_content = re.sub(
        r"\*\*최종 수정\*\*:\s*\d{4}-\d{2}-\d{2}",
        f"**최종 수정**: {datetime.now().strftime('%Y-%m-%d')}",
        new_content,
    )
    readme.write_text(new_content, encoding="utf-8")
    return {"result": "synced", "version": version}


def deploy_release(version: str = "1.0.0") -> dict:
    """STEP 6 전체 자동 배포 파이프라인."""
    log: list[dict] = []

    build_info = verify_build()
    log.append({"step": "verify_build", **build_info})
    if build_info.get("result") != "verified":
        return {"result": "failed", "log": log}

    package_info = package_release(version)
    log.append({"step": "package_release", **package_info})

    note_path = generate_release_note(version, build_info, package_info)
    log.append({"step": "release_note", "path": str(note_path)})

    changelog_path = update_changelog(version)
    log.append({"step": "changelog", "path": str(changelog_path)})

    readme_sync = sync_readme_version(version)
    log.append({"step": "readme_sync", **readme_sync})

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / f"PJT_Report_NEXUS_{datetime.now().strftime('%Y%m%d')}_v{version}_Deployment.md"
    report_path.write_text(
        f"# Deployment Report — v{version}\n\n"
        f"배포 완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        f"```json\n{json.dumps(log, ensure_ascii=False, indent=2)}\n```\n\n"
        "**\"시각(時刻)에 존재하고, 시간(時間)에 소멸한다.\"**\n",
        encoding="utf-8",
    )

    return {
        "result": "deployed",
        "version": version,
        "artifacts": [str(p) for p in (note_path, changelog_path, report_path) if p],
        "zip": package_info.get("zip_path"),
        "log": log,
    }


def main(argv: list[str]) -> int:
    version = argv[1] if len(argv) > 1 else "1.0.0"
    result = deploy_release(version)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("result") == "deployed" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
