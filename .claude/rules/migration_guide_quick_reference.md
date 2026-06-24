# 📚 마이그레이션 빠른 참조 (Quick Reference)

> **대상**: 신규 프로젝트 또는 기존 프로젝트 마이그레이션
> **시간**: 30분 (수동) 또는 5분 (자동화 스크립트)
> **난이도**: ⭐⭐ (중간)

---

## 한눈에 보기: 폴더 구조 변환

### BEFORE (6-폴더 구조)
```
PJT_[프로젝트명]/
├── 01_Proposal_Presentation/
├── 02_Develop/
├── 03_Knowledge/              ← 변경됨
├── 04_Agents_Registry/        ← 변경됨
├── Report/                    ← 변경됨
└── CLAUDE.md
```

### AFTER (7-폴더 구조)
```
PJT_[프로젝트명]/
├── 00_Control_Tower_[프로젝트명]/    ← NEW
├── 01_Proposal_Presentation/
├── 02_Develop/
├── 03_Agents_Registry_[프로젝트명]/   ← 이동 (04→03)
├── 04_QA_Validation_[프로젝트명]/     ← NEW (Validator 전담)
├── 05_[프로젝트명]_Knowledge/        ← 이동 (03→05) + 리네임
├── 06_Report/                       ← 이동 + 리네임
└── CLAUDE.md
```

---

## 🔄 마이그레이션 절차 (3가지 방식)

### 방식 1️⃣: 자동화 스크립트 (권장 ⭐⭐⭐)

```bash
# 1. 스크립트 실행 (dry-run 모드)
python 01_Control_Tower\24_Scripts\migrate_folder_structure.py "C:\99_Develop\20_Projects\PJT_[프로젝트명]"

# 2. 검증 후 실제 실행
python 01_Control_Tower\24_Scripts\migrate_folder_structure.py "C:\99_Develop\20_Projects\PJT_[프로젝트명]" --execute

# 결과: ✅ 모든 폴더 이동 + 파일 참조 업데이트 + Git 커밋
```

**소요 시간**: 5분  
**정확도**: 99.9%  
**권장**: 진행도 <30% 프로젝트

---

### 방식 2️⃣: 수동 마이그레이션 (단계별)

#### Step 1: 폴더 이동
```
03_Knowledge → 05_[프로젝트명]_Knowledge
04_Agents_Registry → 03_Agents_Registry_[프로젝트명]
Report → 06_Report
```

#### Step 2: 파일 경로 참조 업데이트
```bash
# .md, .json, .yaml 파일에서 다음 문자열 교체:
"03_Knowledge"               →  "05_[프로젝트명]_Knowledge"
"04_Agents_Registry"         →  "03_Agents_Registry_[프로젝트명]"
"Report"                     →  "06_Report"
```

#### Step 3: 신규 폴더 생성
```
mkdir 00_Control_Tower_[프로젝트명]
mkdir 04_QA_Validation_[프로젝트명]
  ├─ CHECKLIST_TEMPLATES/
  ├─ QA_REPORTS/
  └─ PENDING/
```

#### Step 4: 템플릿 파일 생성
```
04_QA_Validation_[프로젝트명]/
  ├─ CLAUDE.md (권한 정의)
  ├─ VALIDATION_PROTOCOLS.md (절차)
  └─ FINDINGS_LOG.md (기록)
```

#### Step 5: Git 커밋
```bash
git add -A
git commit -m "refactor: [프로젝트명] 폴더 구조 6-폴더 → 7-폴더 + Validator QA"
git push
```

**소요 시간**: 30분  
**정확도**: 90% (수동 실수 가능)  
**권장**: 진행도 30-70% 프로젝트, 병렬 작업 중단 필요

---

### 방식 3️⃣: 점진적 마이그레이션 (완료 후)

**진행도 >70%인 프로젝트**: 완료 후 마이그레이션

```
1. 프로젝트 100% 완료
2. 최종 테스트/QA 통과
3. v1.0.0 태그 생성
4. 신규 폴더 구조 적용
5. Validator QA 시스템 초기화
```

**소요 시간**: 1-2시간  
**정확도**: 95%+  
**위험도**: 낮음 (변경 범위 최소)

---

## ⚠️ 주의사항

| 상황 | ⚠️ 주의 | ✅ 해결책 |
|:---|:---|:---|
| **작업 중 마이그레이션** | 진행 중 파일 손실 위험 | 백업 후 또는 완료 후 마이그레이션 |
| **Git 충돌** | 병합 중 충돌 가능 | `--ours` 또는 수동 병합 |
| **경로 참조 누락** | 빌드 실패 유발 | Grep 재검사 필수 |
| **CLAUDE.md 미갱신** | 에이전트 혼동 | 각 폴더별 CLAUDE.md 업데이트 필수 |

---

## 📊 프로젝트별 권장 방식

| 프로젝트 | 진행도 | 권장 방식 | 시기 |
|:---|:---:|:---|:---|
| **신규 프로젝트** | 0% | 자동화 (생성 시) | 즉시 |
| **TwinBrain** | 72% | 자동화 | 즉시 (이미 완료) |
| **The Nexus** | 85% | 자동화 | 다음주 |
| **CAL_Company** | 60% | 자동화 | 이번주 |
| **기존 프로젝트들** | <30% | 자동화 | 순차적 |

---

## 🚀 빠른 시작 (Copy-Paste)

### 자동화 스크립트 한줄 명령
```powershell
python "C:\99_Develop\SynologyDrive\01_Control_Tower\24_Scripts\migrate_folder_structure.py" "C:\99_Develop\20_Projects\PJT_[프로젝트명]" --execute
```

### 여러 프로젝트 일괄 마이그레이션
```powershell
$projects = "PJT_CDC_TwinBrain", "PJT_CAL_Company_20260427", "PJT_LLM_Ollama"

foreach ($proj in $projects) {
    $path = "C:\99_Develop\20_Projects\$proj"
    Write-Host "Migrating: $proj"
    python "C:\99_Develop\SynologyDrive\01_Control_Tower\24_Scripts\migrate_folder_structure.py" $path --execute
}
```

---

## ✅ 마이그레이션 완료 체크리스트

마이그레이션 후 반드시 확인:

```
[ ] 폴더 구조 정상인가? (7-폴더 완성)
[ ] 파일 참조 오류 없는가? (Grep으로 검사)
[ ] CLAUDE.md 갱신했는가? (모든 레벨)
[ ] 04_QA_Validation 템플릿 생성했는가?
[ ] npm run dev / build 성공하는가?
[ ] Git 커밋 성공했는가?
[ ] 원격 저장소 push 성공했는가?
```

---

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
