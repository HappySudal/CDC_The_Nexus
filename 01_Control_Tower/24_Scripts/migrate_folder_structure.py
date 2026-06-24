#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Project Folder Structure Migration Tool (6-Folder → 7-Folder)

Purpose: Automate migration from old 6-folder structure to new 7-folder structure
         with independent QA validation system.

Changes:
  - 03_Knowledge → 05_[ProjectName]_Knowledge
  - 04_Agents_Registry → 03_Agents_Registry_[ProjectName]
  - Report → 06_Report
  - NEW: 04_QA_Validation_[ProjectName]

Author: Claude (Validator Agent)
Date: 2026-06-24
Status: Phase 1 (Script Creation)
"""

import os
import shutil
import re
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

class FolderMigration:
    def __init__(self, project_path: str, dry_run: bool = True):
        self.project_path = Path(project_path).resolve()
        self.project_name = self.project_path.name
        self.dry_run = dry_run
        self.migration_log = []
        self.errors = []

        # Folder mapping: old_name → new_name
        self.folder_mapping = {
            "03_Knowledge": "05_{}_Knowledge".format(self.project_name),
            "04_Agents_Registry": "03_Agents_Registry_{}".format(self.project_name),
            "Report": "06_Report",
        }

        self.new_folders = [
            "04_QA_Validation_{}".format(self.project_name),
        ]

        # File patterns to update (regex)
        self.file_patterns_to_update = [
            (r"03_Knowledge", "05_{}_Knowledge".format(self.project_name)),
            (r"04_Agents_Registry", "03_Agents_Registry_{}".format(self.project_name)),
            (r"Report", "06_Report"),
        ]

    def log(self, message: str, level: str = "INFO"):
        """Log migration progress"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.migration_log.append(log_entry)

        if level == "ERROR":
            self.errors.append(message)

        print(log_entry)

    def phase_1_backup_check(self) -> bool:
        """Phase 1: Verify project exists and is safe to migrate"""
        self.log(f"Phase 1: Backup & Verification - {self.project_name}")

        if not self.project_path.exists():
            self.log(f"Project path not found: {self.project_path}", "ERROR")
            return False

        self.log(f"✓ Project path verified: {self.project_path}")

        # Check for git repo
        git_path = self.project_path / ".git"
        if not git_path.exists():
            self.log(f"⚠ Git repository not found. Create git repo first.", "WARN")
        else:
            self.log(f"✓ Git repository found")

        # Check for existing new folders (abort if found)
        for new_folder in self.new_folders:
            new_folder_path = self.project_path / new_folder
            if new_folder_path.exists():
                self.log(f"⚠ New folder already exists: {new_folder}", "WARN")

        return True

    def phase_2_find_old_folders(self) -> Dict[str, Path]:
        """Phase 2: Find all old folders that need migration"""
        self.log("Phase 2: Locating old folder structure")

        old_folders = {}
        for old_name, new_name in self.folder_mapping.items():
            old_path = self.project_path / old_name
            if old_path.exists():
                old_folders[old_name] = old_path
                self.log(f"  Found: {old_name} → {new_name}")

        if not old_folders:
            self.log(f"No old folders found. Project may already be migrated.", "WARN")
            return {}

        self.log(f"Found {len(old_folders)} old folders to migrate")
        return old_folders

    def phase_3_update_file_references(self, old_folders: Dict[str, Path]) -> int:
        """Phase 3: Update file path references in .md, .json, .yaml, .py files"""
        self.log("Phase 3: Updating file path references")

        files_updated = 0
        reference_patterns = [
            ("**/*.md", "Markdown"),
            ("**/*.json", "JSON"),
            ("**/*.yaml", "YAML"),
            ("**/*.yml", "YAML"),
            ("**/*.py", "Python"),
            ("**/*.js", "JavaScript"),
            ("**/*.ts", "TypeScript"),
        ]

        for pattern, file_type in reference_patterns:
            matching_files = list(self.project_path.glob(pattern))

            for file_path in matching_files:
                # Skip git, node_modules, dist
                if any(skip in str(file_path) for skip in [".git", "node_modules", "dist", ".next", "__pycache__"]):
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    original_content = content

                    # Update references
                    for old_path, new_path in self.file_patterns_to_update:
                        content = re.sub(
                            rf"(?<!['\"]){re.escape(old_path)}(?!['\"])",
                            new_path,
                            content
                        )

                    # Write back if changed
                    if content != original_content:
                        if not self.dry_run:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)

                        self.log(f"  Updated: {file_path.relative_to(self.project_path)}")
                        files_updated += 1

                except Exception as e:
                    self.log(f"  Error processing {file_path}: {e}", "ERROR")

        self.log(f"Updated references in {files_updated} files")
        return files_updated

    def phase_4_move_folders(self, old_folders: Dict[str, Path]) -> int:
        """Phase 4: Move old folders to new locations"""
        self.log("Phase 4: Moving folders to new structure")

        folders_moved = 0
        for old_name, old_path in old_folders.items():
            new_name = self.folder_mapping[old_name]
            new_path = self.project_path / new_name

            if new_path.exists():
                self.log(f"  ⚠ Target already exists: {new_name}", "WARN")
                continue

            try:
                if not self.dry_run:
                    shutil.move(str(old_path), str(new_path))

                self.log(f"  Moved: {old_name} → {new_name}")
                folders_moved += 1

            except Exception as e:
                self.log(f"  Error moving {old_name}: {e}", "ERROR")

        self.log(f"Moved {folders_moved} folders")
        return folders_moved

    def phase_5_create_new_folders(self) -> int:
        """Phase 5: Create new QA validation folder structure"""
        self.log("Phase 5: Creating new folder structure")

        folders_created = 0

        for new_folder_base in self.new_folders:
            new_folder_path = self.project_path / new_folder_base

            if new_folder_path.exists():
                self.log(f"  Folder already exists: {new_folder_base}", "WARN")
                continue

            # Create base folder
            if not self.dry_run:
                new_folder_path.mkdir(parents=True, exist_ok=True)

            self.log(f"  Created: {new_folder_base}")
            folders_created += 1

            # Create subfolders
            subfolders = [
                "CHECKLIST_TEMPLATES",
                "QA_REPORTS",
                "PENDING",
            ]

            for subfolder in subfolders:
                subfolder_path = new_folder_path / subfolder
                if not self.dry_run:
                    subfolder_path.mkdir(parents=True, exist_ok=True)

                self.log(f"    ├─ {subfolder}")

        self.log(f"Created {folders_created} new base folders with structure")
        return folders_created

    def phase_6_create_template_files(self) -> int:
        """Phase 6: Create template files in new structure"""
        self.log("Phase 6: Creating template files")

        files_created = 0
        qa_folder = self.project_path / f"04_QA_Validation_{self.project_name}"

        # Template files to create
        templates = {
            "CLAUDE.md": self._get_claude_md_template(),
            "VALIDATION_PROTOCOLS.md": self._get_validation_protocols_template(),
            "FINDINGS_LOG.md": self._get_findings_log_template(),
        }

        for filename, content in templates.items():
            file_path = qa_folder / filename
            if not file_path.exists():
                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                self.log(f"  Created: {filename}")
                files_created += 1

        self.log(f"Created {files_created} template files")
        return files_created

    def phase_7_git_commit(self) -> bool:
        """Phase 7: Create git commit for migration"""
        self.log("Phase 7: Git commit")

        if self.dry_run:
            self.log("  [DRY RUN] Git commit skipped")
            return True

        try:
            os.chdir(self.project_path)
            os.system("git add -A")

            commit_message = f"refactor: [{self.project_name}] Migrate folder structure 6-folder → 7-folder + Validator QA system"
            os.system(f'git commit -m "{commit_message}"')

            self.log(f"  Git commit completed")
            return True

        except Exception as e:
            self.log(f"  Error during git commit: {e}", "ERROR")
            return False

    def run(self) -> bool:
        """Execute full migration"""
        self.log("=" * 60)
        self.log(f"Starting migration: {self.project_name}")
        self.log("=" * 60)

        if self.dry_run:
            self.log("[DRY RUN MODE] No actual changes will be made")

        # Execute phases
        if not self.phase_1_backup_check():
            return False

        old_folders = self.phase_2_find_old_folders()
        if not old_folders:
            self.log("No migration needed", "WARN")
            return True

        self.phase_3_update_file_references(old_folders)
        self.phase_4_move_folders(old_folders)
        self.phase_5_create_new_folders()
        self.phase_6_create_template_files()
        self.phase_7_git_commit()

        self.log("=" * 60)
        self.log(f"Migration completed: {self.project_name}")
        self.log("=" * 60)

        return len(self.errors) == 0

    def get_report(self) -> str:
        """Generate migration report"""
        report = "\n".join(self.migration_log)

        if self.errors:
            report += f"\n\n⚠ ERRORS ({len(self.errors)}):\n"
            for error in self.errors:
                report += f"  - {error}\n"

        return report

    def _get_claude_md_template(self) -> str:
        return f"""# 🏛️ 04_QA_Validation_{self.project_name} (Validator 전담 폴더)

> **발효일**: 2026-06-24
> **권한**: Validator 에이전트
> **상태**: Phase 1 (초기화)

## 📋 개요

본 폴더는 **Validator 에이전트**가 독립적으로 검증을 수행하는 전담 폴더입니다.

- ✅ Executor의 개발 결과를 독립적으로 평가
- ✅ 7가지 체크리스트 병렬 실행
- ✅ 100점 기준 객관적 점수 산정
- ✅ Loop/Pass/Fail 판정

## 🔐 접근 권한

| 역할 | 읽기 | 쓰기 |
|:---:|:---:|:---:|
| **Executor** | ✓ | ✗ |
| **Validator** | ✓ | ✓ |
| **Chairman** | ✓ | ✓ |

## 📁 구조

```
04_QA_Validation_{self.project_name}/
├── CLAUDE.md                          ← 본 파일
├── VALIDATION_PROTOCOLS.md            ← 검증 절차 (STEP 1-6)
├── FINDINGS_LOG.md                    ← 검증 이력
├── CHECKLIST_TEMPLATES/               ← 7가지 체크리스트
│   ├── Phase4_Logic_Proof.md
│   ├── Cross_System_Audit.md
│   ├── Constitution_Compliance.md
│   ├── Code_Quality_Checklist.md
│   ├── Integration_Validation.md
│   ├── Performance_Validation.md
│   └── Security_Validation.md
├── QA_REPORTS/                        ← 검증 결과 (자동 생성)
│   └── QA_Report_[Project]_[Date]_Validator.md
└── PENDING/                           ← Loop 중 임시 파일
```

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
"""

    def _get_validation_protocols_template(self) -> str:
        return """# ✅ VALIDATION_PROTOCOLS

> **발효일**: 2026-06-24
> **참조**: project_folder_constitution.md (STEP 3.5-5)

## STEP 1-6 검증 절차

### STEP 1: Intake (입수)
Executor의 Phase 3 완료 신호 수신 → 파일 및 로직 증명표 확인

### STEP 2: Initial Scan (초기 검사)
폴더 구조 + 필수 파일 + Critical 오류 사전 검토

### STEP 3: Parallel Validation (병렬 검증)
7가지 체크리스트 동시 실행 (약 2시간)

### STEP 4: Scoring (점수 산정)
각 체크별 감점 계산 → 최종 점수 → 판정

### STEP 5: QA_Report 생성
점수 + 판정 + 근거 + 개선 권고사항 기록

### STEP 6: Final Notification (최종 통보)
- PASS → STEP 5 (최종 보고) 진행
- Loop → Executor 재개발
- Fail → 프로젝트 보류

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
"""

    def _get_findings_log_template(self) -> str:
        return """# 📋 FINDINGS_LOG

## 검증 이력

모든 검증 결과는 루프별로 기록됩니다.

### Loop 1
- **일자**: YYYY-MM-DD
- **담당**: Validator
- **점수**: XX/100
- **판정**: Pass/Conditional/Loop/Fail
- **발견사항**: (기록)

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate_folder_structure.py <project_path> [--execute]")
        print("  project_path: Full path to project folder")
        print("  --execute: Perform actual migration (default: dry run)")
        sys.exit(1)

    project_path = sys.argv[1]
    dry_run = "--execute" not in sys.argv

    migration = FolderMigration(project_path, dry_run=dry_run)
    success = migration.run()

    print("\n" + migration.get_report())

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

# "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
# "Exists in the Moment, Vanishes in Time."
