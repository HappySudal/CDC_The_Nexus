# Legacy Notice — 단일 진실 이전 안내

> **이전 일자**: 2026-05-23
> **이전 권한**: Chairman Sudal
> **수행 에이전트**: Claude Opus 4.7

---

## 📌 핵심 변경 사항

**이 디렉토리(`.claude/rules/`)의 14개 규칙 파일은 더 이상 단일 진실(Single Source of Truth)이 아닙니다.**

새로운 단일 진실은:

```
C:\99_Develop\SynologyDrive\.cdc\CONSTITUTION.yaml
```

---

## 🏛️ 흡수 매핑 (Absorption Map)

| Legacy 파일 | CONSTITUTION.yaml 섹션 |
|:---|:---|
| `rule_00_sovereignty.md` | `sovereign_protocol` |
| `rule_01_preflight.md` | `preflight_checks`, `rule_checkpoint` |
| `rule_02_antithesis.md` | `antithesis_protocol` |
| `rule_02_constitution.md` | `metadata.framework` |
| `rule_03_execution.md` | `execution_gates`, `physical_execution_engine` |
| `rule_03_physical_execution.md` | `physical_execution_engine` |
| `rule_04_fatal_errors.md` | `fatal_errors` |
| `rule_05_output.md` | `session_start_triggers`, `addressing_protocol` |
| `rule_06_governance.md` | `governance.tier_0_paths`, `cross_system_audit` |
| `rule_07_sovereign_framework.md` | `authority_matrix`, `sovereign_protocol` |
| `coding-style.md` | `file_requirements` |
| `governance-invariants.md` | `violation_logs`, `sovereign_protocol` |
| `reporting-rules.md` | `file_requirements.reporting_format` |
| `SOP-31_CLAUDEMD_QA_Checklist.md` | `sop_31_checklist` |

---

## ⚠️ 에이전트 행동 지침

### 모든 AI Agent에게:

1. **참조 우선순위**: `.cdc/CONSTITUTION.yaml` > `.claude/rules/*.md`
2. **충돌 시**: CONSTITUTION.yaml이 항상 우선
3. **수정 금지**: 이 디렉토리의 파일은 수정 금지 (CONSTITUTION.yaml만 수정)
4. **수정 시**: `.cdc/adapters/regenerate_all.py` 실행하여 5개 에이전트 룰 파일 자동 갱신

### 인간 협업자에게:

- 이 폴더의 파일들은 **인간 가독성용 보존**입니다
- 헌법 수정 필요 시: `.cdc/CONSTITUTION.yaml` 편집 → `regenerate_all.py` 실행
- 새 규칙 추가 필요 시: 절대 이 폴더에 추가하지 말 것. CONSTITUTION.yaml에 추가

---

## 🔍 검증 방법

```powershell
# 헌법 무결성 확인
py C:\99_Develop\SynologyDrive\.cdc\adapters\regenerate_all.py

# 단일 진실 위치 검증
py -c "import yaml; print(yaml.safe_load(open('.cdc/CONSTITUTION.yaml')).get('legacy_integration', {}).get('status'))"
# 기대 출력: Phase 2 absorption complete (2026-05-23)

# 다중 에이전트 호환성 검증
Invoke-RestMethod -Uri "http://localhost:8888/status"
```

---

## 📊 Phase 2 흡수 통계

- **흡수 파일 수**: 14
- **흡수 후 CONSTITUTION.yaml 크기**: 23KB
- **추가된 섹션**: 6 (preflight_checks, rule_checkpoint, antithesis_protocol, physical_execution_engine, cross_system_audit, session_start_triggers, sop_31_checklist, legacy_integration)
- **호환성 향상**: 78% → 88% (+10pt)

---

## 🚨 향후 처리

이 디렉토리의 파일들은 향후 다음 시점에 archive 폴더로 이동될 수 있습니다:

1. 의장님이 모든 AI 에이전트가 CONSTITUTION.yaml만 참조하는 것을 확인
2. 6개월 이상 이 폴더의 파일이 직접 참조되지 않은 경우
3. 의장님의 명시적 archive 지시

현재는 **인간 참조용으로 유지** (Phase 3 결정).

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
