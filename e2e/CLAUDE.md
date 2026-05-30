# 🎭 e2e/ — End-to-End Test Suite (Phase D Track D1)

> The Nexus Electron 앱 종단간 검증 (Playwright + `_electron` 드라이버)
> Vitest 단위 테스트와는 별도의 테스트 계층

---

## 📁 폴더 구조

```
e2e/
├── CLAUDE.md (이 파일)
├── fixtures/                 (테스트 공통 픽스처)
│   └── electron.ts           (앱 부팅 헬퍼)
└── specs/
    ├── 01_health_check.spec.ts          (앱 부팅 + 메인 윈도우)
    ├── 02_agent_command.spec.ts         (AgentCommandPanel 흐름)
    ├── 03_task_creation.spec.ts         (TaskCreationForm + IPC 승인 게이트)
    ├── 04_agent_dashboard.spec.ts       (AgentDashboard 모달 흐름)
    ├── 05_configuration.spec.ts         (ConfigurationPanel 저장·리셋)
    └── 06_constitution_viewer.spec.ts   (헌법 4-Branch 열람)
```

---

## 🛠️ 실행

Playwright CLI를 통해 실행한다. `package.json`의 `e2e`, `e2e:headed`, `e2e:report` 스크립트를 참조. 단일 spec 실행은 파일 경로를 인자로 넘긴다.

---

## 📐 규칙

1. **Vitest 단위 테스트 영역 침범 금지**: e2e는 사용자 시나리오 전체 흐름만 다룬다.
2. **Electron 부팅 1회 재사용**: 각 describe 단위로 부팅, 종료 보장.
3. **고정 픽스처 사용**: `fixtures/electron.ts`에서 공통 부팅 헬퍼 export.
4. **테스트 격리**: 각 it는 ConfigurationPanel.config 등 글로벌 상태를 초기화/복원.
5. **타임아웃 30s 한도**: 30s 초과 시 회귀 신호 (실제 사용성 저하).

---

## 📞 참조

- **부모 Claude.md**: `../CLAUDE.md`
- **Playwright 공식**: https://playwright.dev/
- **electron-playwright-helpers**: https://github.com/spaceagetv/electron-playwright-helpers

**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
