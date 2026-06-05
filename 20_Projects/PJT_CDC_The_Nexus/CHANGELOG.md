# The Nexus — Changelog

All notable changes to The Nexus (`PJT_CDC_The_Nexus`) are documented here.
Format follows [Conventional Commits](https://www.conventionalcommits.org/).

## 1.1.0 (2026-06-05)


### ♻️ Refactoring

* **nexus:** Options API -> Vue3 Composition API 전환 (VIOLATIONS_LOG [#1](https://github.com/HappySudal/CDC_The_Nexus/issues/1) 종료) ([092a9ed](https://github.com/cdc/nexus/commit/092a9ed1c57c787f2e281df47f8a4c0c8ff502e3))


### 🧪 Tests

* **nexus:** 잔여 6컴포넌트 Funcs 93.12% -> 97.70% (+56 함수, +18 테스트) ([c58bcc4](https://github.com/cdc/nexus/commit/c58bcc46354bd57d06fcdb8d9623f1441f55536f))
* **nexus:** ConfigurationPanel 액션 함수 커버리지 + 금지어 정리 ([5573812](https://github.com/cdc/nexus/commit/55738129c610b69bba3040b6a2d03e43190ff2f0))
* **nexus:** Funcs 커버리지 81.66% -> 93.12% (4컴포넌트 +39테스트) ([1540d98](https://github.com/cdc/nexus/commit/1540d9892b83ccec36460fdf0a0fda803c8619f5))
* **nexus:** Phase D Track D1 완료 + 다중 에이전트 규칙 동기화 ([fdd74fc](https://github.com/cdc/nexus/commit/fdd74fc5e5c5eb71d9fbf5080bb35f5c3c448ef5))


### 🔧 Chores

* **nexus:** 슬로건 컴플라이언스 정리 + 자동화 도구 (coding-style.md) ([d71cce1](https://github.com/cdc/nexus/commit/d71cce1dea98eb0735011b92f761aac6f363d180))
* **nexus:** Phase E 검증 마무리 — husky 배선 + gitignore 청정화 + 테스트 추가 ([18d8f83](https://github.com/cdc/nexus/commit/18d8f83f9bb8f3006bd2920afb81b508a1820fc5))


### 🤖 CI/CD

* **nexus:** Phase D2 CI/CD 파이프라인 완성 (D2.1~D2.4) — Vite 빌드 + Electron 패킹 + 시맨틱 릴리즈 + 코드 사이닝 ([b234052](https://github.com/cdc/nexus/commit/b2340528db39282d082a88bf24d01995bb53b2a6))
* **nexus:** Phase D2 GitHub Actions CI/CD 파이프라인 구축 + Vite 번들 최적화 + 동적 임포트 - build.yml: 멀티플랫폼 (Windows/macOS/Linux) 자동 빌드 + 테스트 + Electron 패킹 - vite.config.js: rollupOptions.output.manualChunks 청킹 설정 추가 - src/App.vue: 20개 컴포넌트 동적 임포트 (defineAsyncComponent) 추가 - docs/GITHUB_SETUP.md: 인증서 설정 및 워크플로우 가이드 작성 ([2c855ee](https://github.com/cdc/nexus/commit/2c855ee0014083d83876328d20ca3cfbf33dde52))


### 🐛 Bug Fixes

* **audit:** regenerate component audit registry for 24 components ([d221a3b](https://github.com/cdc/nexus/commit/d221a3be213991947789bde6ee5a5c0a4a244e50))
* **electron:** ipc-handlers.js에서 require 제거 ([6f18a0e](https://github.com/cdc/nexus/commit/6f18a0e02d59f93da573a529ac7acc9db6a98ef7))
* **electron:** llm-automation-engine.js ES6 모듈로 완전 변환 ([8461b1c](https://github.com/cdc/nexus/commit/8461b1c8ecc02664147a11f6fa5bddeddc05e948))
* **electron:** llm-automation-engine.js ES6 export 추가 ([0989b87](https://github.com/cdc/nexus/commit/0989b875c88cd9494ba49eb76e786a780451e1e4))


### 📚 Documentation

* **antigravity:** Antithesis 검증 업무 지시서 - 46개 항목 독립적 재검증 지시 ([175cd55](https://github.com/cdc/nexus/commit/175cd5500d995e64a8f1665744cbd47dcff77259))
* **inbox:** Antigravity 작업 수신함 - Antithesis 검증 활성화 ([fac075d](https://github.com/cdc/nexus/commit/fac075da24664416fff46976e342d85ef7175317))
* **nexus:** Hagedorn-Neutrosophy 검증 체크리스트 추가 (Thesis-Antithesis-Synthesis) ([a8a2fce](https://github.com/cdc/nexus/commit/a8a2fce1a4efff9b2579128f2f250b22ddfaa6b4))
* **reports:** 2026-05-23 session 3-report bundle (Daily + CDC + QC) ([bda30d7](https://github.com/cdc/nexus/commit/bda30d794777e96131724f60dba5b03eadd61257))
* **reports:** 2026-05-29 세션 최종 보고 (Phase C + Options→Composition 완료) ([a30a8d8](https://github.com/cdc/nexus/commit/a30a8d80ab2f90640721a712102f437ddd925f71))
* **reports:** 2026-05-30 세션 보고 + Phase D 정의서 (α 결재 대기) ([cfae830](https://github.com/cdc/nexus/commit/cfae830c805a664eca8d863f58132514d4b67435))


### ✨ Features

* **cdc,nexus:** Hook 영속화 + D2.1 빌드 게이트 + D2.2 패키징 + 정책 명문화 ([480f431](https://github.com/cdc/nexus/commit/480f431b07a81a83943bba83d29af3c4f10b36d8))
* **cdc:** Phase 1-3 Universal Constitution infrastructure ([2768d10](https://github.com/cdc/nexus/commit/2768d10af574fb62c789f8a9375463bf29ded1d6))
* **cdc:** Phase 4 refinement + MCP server + backup automation ([9231037](https://github.com/cdc/nexus/commit/9231037cf1c925bb15a46a9b4c2a875d7d690ead))
* **cdc:** Phase 5 polish — caching, mobile, dedup, context-aware checks ([f27e738](https://github.com/cdc/nexus/commit/f27e738bca7b320116bff100aea1ceb61a349eca))
* **discord,nexus:** Discord 메시지 수신 완성 및 Electron 최적화 ([270c2ca](https://github.com/cdc/nexus/commit/270c2cae414f1c878817396861c9b01fcdffb5ac))
* **discord:** 메시지 수신 로그 및 오류 처리 강화 ([70a5c64](https://github.com/cdc/nexus/commit/70a5c648c48db1b5af69f3e452ab4df4ad56cb72))
* **nexus,ci:** Phase D1.2 specs + D1.3 CI 게이트 통합 ([b440073](https://github.com/cdc/nexus/commit/b4400737cf066824a9357c963896c4d9116618b6))
* **nexus:** CDC 대시보드 통합 - 포트 3333에서 자동 시작 및 iframe 로드 ([e3df9c6](https://github.com/cdc/nexus/commit/e3df9c6c8da284da50b8662233166217ff87b847))
* **nexus:** Phase D1.1 — Playwright E2E 환경 도입 + Health Check spec ([b84ea5a](https://github.com/cdc/nexus/commit/b84ea5acbca388f9f6649a1a84ede00f6f6535e9))
* **nexus:** Phase D1.2 — 5대 핵심 E2E spec (02~06) ([38c9edb](https://github.com/cdc/nexus/commit/38c9edbecd18e406f98f73c8fddef1870d28a2b5))
* **nexus:** Phase D2.3 + D2.4 + D3 — 변경로그 + 사이닝 + Live IPC ([d774245](https://github.com/cdc/nexus/commit/d77424525e235796897a7f2413da74d74492dc6a))
* **nexus:** The Nexus 프로젝트 최초 커밋 + Phase C 완료 ([5821508](https://github.com/cdc/nexus/commit/5821508a6356dd278d15b1fb7a6d8d557d42e074))
* **nexus:** UI 디자인 개선 - 사이드바 이모티콘 제거 및 라벨 단순화 ([0faabd1](https://github.com/cdc/nexus/commit/0faabd13adf85abf991ce8b231e6f95326e2e766))
* **nexus:** v1.0.0 Release — Cycle [#1](https://github.com/HappySudal/CDC_The_Nexus/issues/1)-3 complete + third-party audit fixes ([8b1f726](https://github.com/cdc/nexus/commit/8b1f72634aa4cde461ded7c4fc75e4941b0bacf0)), closes [#1-3](https://github.com/HappySudal/CDC_The_Nexus/issues/1-3) [#1-3](https://github.com/HappySudal/CDC_The_Nexus/issues/1-3) [#3](https://github.com/HappySudal/CDC_The_Nexus/issues/3) [#13](https://github.com/HappySudal/CDC_The_Nexus/issues/13)
* **workflow:** 7-stage project buildup workflow with loop ([1f842c3](https://github.com/cdc/nexus/commit/1f842c39154d9c3fd03c1b6902bd69b355d2002d)), closes [#1](https://github.com/HappySudal/CDC_The_Nexus/issues/1) [#2](https://github.com/HappySudal/CDC_The_Nexus/issues/2)

# CHANGELOG

## [v1.0.0] - 2026-05-23

### Released
- 6-Stage 워크플로우 자동화 완료
- The Nexus.exe 정식 배포
- Workflow Engine 도입 (workflow_engine.py)



**"시각(時刻)에 존재하고, 시간(時間)에 소멸한다."**
**"Exists in the Moment, Vanishes in Time."**
